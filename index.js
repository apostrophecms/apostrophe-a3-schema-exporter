const fs = require('fs-extra');
const { stripIndent } = require('common-tags');
const prettier = require('prettier');

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

          if (aposModule.schema && aposModule.schema.length && isCustomModule) {
            // console.log('aposModule._meta', require('util').inspect(aposModule.__meta, {
            //   colors: true,
            //   depth: 3
            // }));
            // console.log(
            //   'aposModule.name',
            //   require('util').inspect(aposModule.name, {
            //     colors: true,
            //     depth: 1
            //   }),
            //   aposModule.__meta.name
            // );

            const moduleName = aposModule.schema[0].moduleName;
            if (
              moduleName &&
              (await fs.pathExists(`${folder}/${moduleName}`))
            ) {
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
                } else {
                  acc[name] = props;
                }

                return acc;
              }, {});

              await fs.outputFile(
                `${folder}/${moduleName}/schema.js`,
                prettier.format(
                  `
                  module.exports = (self, options) => {
                    return {
                      extend: '@apostrophecms/piece-type',
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
        }
      }
    );
  }
};
