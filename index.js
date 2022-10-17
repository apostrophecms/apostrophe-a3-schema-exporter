const fs = require('fs-extra');
const { stripIndent } = require('common-tags');
const prettier = require('prettier');
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
      async (apos, argv) => {
        const { folder = 'lib/modules', keepTags } = argv;

        for (const aposModule of Object.values(apos.modules)) {
          const nativeModules = [ 'apostrophe-', '-auto-pages' ];
          const isCustomModule = !nativeModules.some(nativeModule => {
            return aposModule.__meta.name.includes(nativeModule);
          });

          if (isCustomModule && aposModule.schema && aposModule.schema.length) {
            const moduleTypeInA2 = aposModule.__meta.chain
              .reverse()
              .find(element => Object.keys(moduleTypes).find(type => element.name === type));

            const moduleName = aposModule.schema[0].moduleName;
            if (
              moduleTypeInA2 && moduleTypeInA2.name &&
              moduleName &&
              (await fs.pathExists(`${folder}/${moduleName}`))
            ) {
              const moduleTypeInA3 = moduleTypes[moduleTypeInA2.name];
              const fields = aposModule.schema.reduce((acc, cur) => {
                const {
                  sortify,
                  group,
                  moduleName,
                  name,
                  checkTaken,
                  ...props
                } = cur;

                if (cur.type === 'tags' || cur.type === 'array') {
                  acc = handleArray(acc, cur, name, props, keepTags);
                } else {
                  if (cur.type === 'area') {
                    props.options.widgets = handleArea(props);
                  } else if (relationshipTypes[cur.type]) {
                    Object.assign(props, handleRelationship(cur));
                  }

                  acc[name] = props;
                }

                return acc;
              }, {});

              // do widgets now
              await writeFile(folder, moduleName, moduleTypeInA3, fields);
            }
          }
        }
      }
    );

    function handleArray(acc, cur, name, props, keepTags) {
      if (keepTags || cur.type === 'array') {
        const schema =
          cur.type === 'tags'
            ? [ {
              name,
              ...props,
              type: 'string',
              label: 'Tag'
            } ]
            : props.schema;

        const arrayFields = schema.reduce(
          (arrayAcc, arrayCur) => {
            const {
              name, moduleName, ...arrayProps
            } = arrayCur;
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
    }

    function handleArea(props) {
      const widgets = Object.keys(props.options.widgets).reduce((widgetAcc, widgetCur) => {
        if (widgetTypes[widgetCur]) {
          const newWidgetName = widgetTypes[widgetCur];
          widgetAcc[newWidgetName] = props.options.widgets[widgetCur];
        }
        return widgetAcc;
      }, {});

      return widgets;
    }

    function handleRelationship(cur) {
      let max;
      if (cur.type.includes('joinByOne')) {
        max = 1;
      }
      const type = relationshipTypes[cur.type];

      return {
        max,
        type
      };
    }

    function writeFile(folder, moduleName, moduleTypeInA3, fields) {
      return fs.outputFile(
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
          { singleQuote: true }
        )
      );
    }
  }
};
