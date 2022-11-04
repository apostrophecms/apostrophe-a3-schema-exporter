const { constants } = require('fs');
const fs = require('fs/promises');
const { stripIndent } = require('common-tags');
const { generateFields, writeFile } = require('./helpers');

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

          try {
            const moduleName = aposModule.schema[0].moduleName;
            await fs.access(`${folder}/${moduleName}`, constants.W_OK);
            const fields = generateFields(aposModule.schema);
            await writeFile(folder, moduleName, fields);
          } catch {
            // module not found at project level; skipping it
          }
        }
      }
    );
  }
};
