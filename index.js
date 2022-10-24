const fs = require('fs/promises');
const prettier = require('prettier');
const { stripIndent } = require('common-tags');
const {
  moduleTypes, relationshipTypes, widgetTypes
} = require('./config');

module.exports = {
  construct(self, options) {
    self.addTask(
      'export',
      stripIndent`
        Exports A2 schemas to A3 format by outputting a "schema.js" file in every module folder.

        Options:
        * --folder: folder name relative to root where to search for modules. By default, it is "lib/modules". Usage: --folder=src/lib/modules
        * --keepTags: A3 does not have a "tags" field type anymore. If true, convert tags to an array containing strings. By default, false (tags are not kept). Usage: --keepTags
      `,
      (apos, argv) => self.exportSchemas(apos, argv)
    );

    self.exportSchemas = async (apos, argv) => {
      const { folder = 'lib/modules', keepTags } = argv;

      for (const aposModule of Object.values(apos.modules)) {
        const nativeModules = [ 'apostrophe-', '-auto-pages' ];
        const isCustomModule = !nativeModules.some(nativeModule => {
          return aposModule.__meta.name.includes(nativeModule);
        });

        if (!isCustomModule || aposModule?.schema.length) {
          return;
        }

        const moduleTypeInA2 = aposModule.__meta.chain
          .reverse()
          .find(element => Object.keys(moduleTypes).find(type => element.name === type));

        const moduleName = aposModule.schema[0].moduleName;
        if (
          moduleTypeInA2 &&
            moduleTypeInA2.name &&
            moduleName &&
            (await fs.stat(`${folder}/${moduleName}`))
        ) {
          const moduleTypeInA3 = moduleTypes[moduleTypeInA2.name];
          const fields = aposModule.schema.reduce((acc, cur) => {
            const {
              sortify, group, moduleName, name, checkTaken, ...props
            } = cur;

            if (cur.type === 'tags' || cur.type === 'array') {
              acc = self.handleArray({
                acc,
                cur,
                name,
                props,
                keepTags
              });
            } else {
              if (cur.type === 'area') {
                props.options.widgets = self.handleArea(props);
              } else if (relationshipTypes[cur.type]) {
                Object.assign(props, self.handleRelationship(cur));
              }

              acc[name] = props;
            }

            return acc;
          }, {});

          await self.writeFile(folder, moduleName, moduleTypeInA3, fields);
        }
      }
    };

    self.handleArray = ({
      acc, cur, name, props, keepTags
    }) => {
      if (keepTags || cur.type === 'array') {
        const schema =
          cur.type === 'tags'
            ? [
              {
                name,
                ...props,
                type: 'string',
                label: 'Tag'
              }
            ]
            : props.schema;

        const arrayFields = schema.reduce(
          (arrayAcc, arrayCur) => {
            const {
              name, moduleName, ...arrayProps
            } = arrayCur;

            if (arrayCur.type === 'area') {
              arrayProps.options.widgets = self.handleArea(arrayProps);
            } else if (relationshipTypes[arrayCur.type]) {
              Object.assign(arrayProps, self.handleRelationship(arrayCur));
            }

            arrayAcc.add[name] = arrayProps;
            return arrayAcc;
          },
          { add: {} }
        );

        acc[name] = {
          type: 'array',
          label: props.label,
          fields: arrayFields
        };
      }

      return acc;
    };

    self.handleArea = (props) => {
      return Object.keys(props.options.widgets).reduce((widgetAcc, widgetCur) => {
        if (widgetTypes[widgetCur]) {
          const newWidgetName = widgetTypes[widgetCur];
          widgetAcc[newWidgetName] = props.options.widgets[widgetCur];
        }
        return widgetAcc;
      }, {});
    };

    self.handleRelationship = (cur) => {
      let max, builders, filters;
      const type = relationshipTypes[cur.type];

      if (cur.type.includes('joinByOne')) {
        max = 1;
      }

      if (cur.filters) {
        builders = cur.filters;

        if (cur.filters.projection) {
          builders.project = cur.filters.projection;
          builders.projection = undefined;
        }

        filters = undefined;
      }

      const withType = cur?.withType.startsWith('apostrophe-')
        ? `@apostrophecms/${cur.withType.slice('apostrophe-'.length)}`
        : cur.withType;

      return {
        max,
        type,
        builders,
        filters,
        withType
      };
    };

    self.writeFile = (folder, moduleName, moduleTypeInA3, fields) =>
      fs.writeFile(
        `${folder}/${moduleName}/schema.js`,
        prettier.format(
          `
          module.exports = (self, options) => {
            return {
              extend: '${moduleTypeInA3}',
              options: {
                label: '${moduleName}',
              },
              fields: {
                add: ${JSON.stringify(fields, null, 2)}
              }
            };
          };
        `,
          {
            singleQuote: true,
            parser: 'babel'
          }
        )
      );
  }
};
