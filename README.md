# A2 utility task to export schemas to A3 format

A command line task running in an A2 module that can "see" all of the schemas for all of the defined doc and widget types, their sub-array and object fields, et cetera.

Iterates over all of these and prepares a folder with schemas in the A3 format, broken down in a sensible directory structure. You would be required to specify a folder name as the parent for these.

The directory structure would look like:

modules
  default-page
    schema.js

Inside each one the format would be:

module.exports = (self, options) => {
  return {
    ... a3 fields here
  };
};

This makes it easy to pull into default-page/index.js:

module.exports = {
  fields(self, options) => require('./schemas.js')(self, options)
};

This greatly helps with A2 to A3 migration although it miss things like fields being optional based on module.

If a module has a self.schema property, this code should generate a new schema from it.