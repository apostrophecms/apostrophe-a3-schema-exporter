const fs = require('fs/promises');
const prettier = require('prettier');
const { relationshipTypes, widgetTypes } = require('./config');

function handleArray ({
  acc, cur, name, props, keepTags
}) {
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

        const newArrayProps = checkAreaOrRelationship(arrayCur, arrayProps);

        arrayAcc.add[name] = newArrayProps;
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

function handleArea (props) {
  return Object.keys(props.options.widgets).reduce((widgetAcc, widgetCur) => {
    if (widgetTypes[widgetCur]) {
      const newWidgetName = widgetTypes[widgetCur];
      widgetAcc[newWidgetName] = props.options.widgets[widgetCur];
    }
    return widgetAcc;
  }, {});
}

function handleRelationship(cur) {
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

  const withType = cur?.withType?.startsWith('apostrophe-')
    ? `@apostrophecms/${cur.withType.slice('apostrophe-'.length)}`
    : cur.withType;

  return {
    max,
    type,
    builders,
    filters,
    withType
  };
}

function checkAreaOrRelationship(field, props) {
  if (field.type === 'area') {
    props.options.widgets = handleArea(props);
  } else if (relationshipTypes[field.type]) {
    Object.assign(props, handleRelationship(field));
  }

  return props;
}

function writeFile(folder, moduleName, moduleTypeInA3, fields) {
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

module.exports = {
  writeFile,
  handleArea,
  handleArray,
  handleRelationship,
  checkAreaOrRelationship
};
