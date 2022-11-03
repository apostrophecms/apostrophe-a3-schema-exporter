# A2 utility task to export schemas to A3 format

A command line task running in an A2 module that can "see" all of the schemas for all of the defined doc and widget types, their sub-array and object fields, et cetera.

The command to run in your A2 project will be:

```
node app apostrophe-a3-schema-exporter:export
```

Iterates over all of these and adds a `schema.js` file in the A3 format in every custom module. You can change the parent folder name of modules by passing the option `--folder`. By default, it is `lib/modules`. Example:

```
node app apostrophe-a3-schema-exporter:export --folder="src/lib/modules"
```

**Pay attention, the script will overwrite existing `schema.js` files in your modules directories.**

The directory structure would look like:

```
modules
  custom-module
    schema.js
  custom-page
    schema.js
  custom-widget
   schema.js
```

Inside each one the format would be:

```js
module.exports = {
  ... a3 fields here
};
```

This makes it easy to pull into custom-module/index.js:

```js
module.exports = {
  extend: '@apostrophecms/piece-type', // or whatever type needed as '@apostrophecms/piece-page-type' for example
  fields: require('./schema.js')
};
```

Another option is to output an entire module instead of the `fields` object by passing the option `--module`.

```
node app apostrophe-a3-schema-exporter:export --module
```

It will be `require`d in the custom-module/index.js:

```js
module.exports = require('./schema.js');
```

This greatly helps with A2 to A3 migration although manual review is required because it does not understand:

- Fields being optional based beforeConstruct logic
- Fields being inherited from a base class module like apostrophe-pieces, i.e. not necessary to redefine them in a subclass
- Fields being removed via removeFields
- Fields that no longer generally exist in A3, e.g. published
