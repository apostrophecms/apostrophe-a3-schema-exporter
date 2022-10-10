const fs = require('fs-extra');
const { stripIndent } = require('common-tags');

module.exports = {
  construct(self, options) {
    // function convertObjToString(obj) {
    //   return Object
    //     .entries(obj)
    //     .reduce((acc, cur) => {
    //       console.log('cur', require('util').inspect(cur, {
    //         colors: true,
    //         depth: 1
    //       }));
    //       if (
    //         typeof cur[1] === 'object' &&
    //         cur[1] !== null &&
    //         !Array.isArray(cur[1])
    //       ) {
    //         acc += convertObjToString(cur[1]);
    //       } else {
    //         acc += cur[0].includes('-')
    //           ? `'${cur[0]}': '${cur[1]}', `
    //           : `${cur[0]}: '${cur[1]}', `;
    //       }
    //       return acc;
    //     }, '`{')
    //     .slice(1, -2) + '}`';
    // }

    self.addTask(
      'export',
      stripIndent`
        Exports A2 schemas to A3 format.

        Optional argument: folder name relative to root where to search for modules. By default, it is "lib/modules".
      `,
      async (apos, argv) => {
        let folder = 'lib/modules';
        if (argv._[1]) {
          folder = argv._[1];
        }
        for (const aposModule of Object.values(apos.modules)) {
          if (
            aposModule.schema &&
            aposModule.schema.length &&
            aposModule.name === 'article'
          ) {
            // console.log(
            //   'aposModule.schema',
            //   require('util').inspect(aposModule.schema, {
            //     colors: true,
            //     depth: 2
            //   })
            // );

            const moduleName = aposModule.schema[0].moduleName;
            if (moduleName && await fs.pathExists(`${folder}/${moduleName}`)) {
              const fields = aposModule.schema.reduce((acc, cur) => {
                const {
                  sortify, group, moduleName, name, checkTaken, ...props
                } = cur;
                acc[name] = props;
                return acc;
              }, {});

              const strings = stripIndent`title: {
                            label: 'Title',
                            type: 'string'
                          }`;

              console.log('fields', require('util').inspect(fields, {
                colors: true,
                depth: 1
              }));

              // eslint-disable-next-line no-inner-declarations
              function convertObjToString(obj) {
                return Object
                  .entries(obj)
                  .reduce((acc, cur) => {
                    console.log('cur', require('util').inspect(cur, {
                      colors: true,
                      depth: 1
                    }));
                    if (
                      typeof cur[1] === 'object' &&
                      cur[1] !== null &&
                      !Array.isArray(cur[1])
                    ) {
                      acc += cur[0].includes('-')
                        ? `
                          '${cur[0]}':  {${convertObjToString(cur[1])}
                          },
                      `
                        : `
                        ${cur[0]}:  {${convertObjToString(cur[1])}
                      },`;
                    } else {
                      acc += cur[0].includes('-')
                        ? `'${cur[0]}': '${cur[1]}',`
                        : `
                            ${cur[0]}: '${cur[1]}',`;
                    }
                    return acc;
                  }, '');
                // .slice(1, -2) + '}';
              }

              console.log('convertObjToString(fields)', require('util').inspect(convertObjToString(fields), {
                colors: true,
                depth: 1
              }));

              await fs.outputFile(
                `${folder}/${moduleName}/schema.js`,
                stripIndent`
                  module.exports = (self, options) => {
                    return {
                      extend: '@apostrophecms/piece-type',
                      options: {
                        label: '${moduleName}',
                      },
                      fields: {
                        add: { ${convertObjToString(fields)} }
                      }
                    };
                  };
                `
              );
            }
          }
        }

        // const req = apos.tasks.getAnonReq();
        //         await fs.outputFile(`lib/modules/${folder}/a3-exported-schemas.js`, `module.exports = (self, options) => {
        //   return {
        //   };
        // };`);
        // return self.find(req).toArray().then(products => {
        //   products.forEach(product => {
        //     console.log(product.title + ': ' + product._url);
        //   });
        // });
      }
    );
  }
};
