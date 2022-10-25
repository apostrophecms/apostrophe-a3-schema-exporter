const fs = require('fs/promises');
const { stripIndent } = require('common-tags');
const { moduleTypes } = require('./config');
const {
  checkAreaOrRelationship,
  handleArray,
  writeFile
} = require('./helpers');

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
      async(apos, argv) => {
        const { folder = 'lib/modules', keepTags } = argv;

        for (const aposModule of Object.values(apos.modules)) {
          const nativeModules = [ 'apostrophe-', '-auto-pages' ];
          const isCustomModule = !nativeModules.some(nativeModule => {
            return aposModule.__meta.name.includes(nativeModule);
          });

          if (!isCustomModule || !aposModule?.schema.length) {
            continue;
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
                acc = handleArray({
                  acc,
                  cur,
                  name,
                  props,
                  keepTags
                });

                return acc;
              }

              const newProps = checkAreaOrRelationship(cur, props);
              acc[name] = newProps;

              return acc;
            }, {});

            await writeFile(folder, moduleName, moduleTypeInA3, fields);
          }
        }
      }
    );
  }
};
