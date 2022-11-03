const { constants } = require('fs');
const fs = require('fs/promises');
const { stripIndent } = require('common-tags');
const { moduleTypes } = require('./config');
const { generateFields, writeFile } = require('./helpers');

module.exports = {
  construct(self, options) {
    self.addTask(
      'export',
      stripIndent`
        Exports A2 schemas to A3 format by outputting a "schema.js" file in every module folder.

        Option:
        * --folder: folder name relative to root where to search for modules. By default, it is "lib/modules". Usage: --folder=src/lib/modules
        * --module: output an entire module instead of only the "fields" object
      `,
      async (apos, argv) => {
        const { folder = 'lib/modules', module: exportModule } = argv;

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
              const fields = generateFields(aposModule.schema);
              await writeFile(folder, moduleName, moduleTypeInA3, fields, exportModule);
            }
          } catch {
            // module not found at project level; skipping it
          }
        }
      }
    );
  }
};
