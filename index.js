const { constants } = require('fs');
const fs = require('fs/promises');
const { stripIndent } = require('common-tags');
const { moduleTypes } = require('./config');
const {
  handleFieldType,
  groupField,
  writeFile
} = require('./helpers');

module.exports = {
  construct(self, options) {
    self.addTask(
      'export',
      stripIndent`
        Exports A2 schemas to A3 format by outputting a "schema.js" file in every module folder.

        Option:
        * --folder: folder name relative to root where to search for modules. By default, it is "lib/modules". Usage: --folder=src/lib/modules
      `,
      async(apos, argv) => {
        const { folder = 'lib/modules' } = argv;

        for (const aposModule of Object.values(apos.modules)) {
          const unnecessaryModule = aposModule.__meta.name.includes('-auto-pages');
          if (unnecessaryModule || !aposModule?.schema?.length) {
            continue;
          }

          const moduleTypeInA2 = aposModule.__meta.chain
            .reverse()
            .find(element => Object.keys(moduleTypes).find(type => element.name === type));
          const moduleName = aposModule.schema[0].moduleName;

          try {
            await fs.access(`${folder}/${moduleName}`, constants.W_OK);
            if (moduleTypeInA2?.name) {
              const moduleTypeInA3 = moduleTypes[moduleTypeInA2.name];

              const fields = aposModule.schema.reduce((acc, cur) => {
                const {
                  sortify, group, moduleName, name, checkTaken, ...props
                } = cur;

                acc.add[name] = handleFieldType(props);
                acc.group = groupField(acc.group, group, name);

                return acc;
              }, {
                add: {},
                group: {}
              });

              await writeFile(folder, moduleName, moduleTypeInA3, fields);
            }
          } catch {
            // module not found at project level; skipping it
          }
        }
      }
    );
  }
};
