const fs = require('fs/promises');
const prettier = require('prettier');
const { relationshipTypes, widgetTypes } = require('./config');

function generateFields(schema) {
  return schema.reduce((acc, cur) => {
    const {
      sortify,
      group = {
        name: 'default',
        label: 'Info'
      },
      moduleName,
      name,
      checkTaken,
      ...props
    } = cur;

    acc.add[name] = handleFieldType(props);
    acc.group = groupField(acc.group, group, name);

    return acc;
  }, {
    add: {},
    group: {}
  });
}

function handleFieldType(field) {
  let newField;

  if (field.type === 'tags' || field.type === 'array') {
    newField = handleArray(field);
  } else if (field.type === 'area') {
    newField = handleArea(field);
  } else if (relationshipTypes[field.type]) {
    newField = handleRelationship(field);
  } else {
    newField = field;
  }

  return newField;
}

function handleArray(field) {
  const schema =
      field.type === 'tags'
        ? [
          {
            ...field,
            name: 'tag',
            type: 'string',
            label: 'Tag'
          }
        ]
        : field.schema;

  const arrayFields = schema.reduce(
    (arrayAcc, arrayCur) => {
      const {
        name, moduleName, ...arrayProps
      } = arrayCur;

      const newArrayProps = handleFieldType(arrayProps);

      arrayAcc.add[name] = newArrayProps;
      return arrayAcc;
    },
    { add: {} }
  );

  return {
    type: 'array',
    label: field.label,
    fields: arrayFields
  };

}

function handleArea(field) {
  const widgets = Object.keys(field.options.widgets).reduce((widgetAcc, widgetCur) => {
    if (widgetTypes[widgetCur]) {
      const newWidgetName = widgetTypes[widgetCur];
      widgetAcc[newWidgetName] = field.options.widgets[widgetCur];
    }
    return widgetAcc;
  }, {});

  return {
    ...field,
    options: {
      widgets
    }
  };
}

function handleRelationship({
  filters, type, withType, withJoins, relationship, idsField, idField, relationshipsField, ...field
}) {
  const newField = {
    ...field,
    withType: withType?.startsWith('apostrophe-')
      ? `@apostrophecms/${withType.slice('apostrophe-'.length)}`
      : withType,
    fields: generateFields(relationship || []),
    idsStorage: idsField || idField,
    type: relationshipTypes[type],
    max: type.includes('joinByOne') ? 1 : undefined,
    withRelationships: withJoins
  };

  if (filters) {
    const { projection, ...builders } = filters;
    newField.builders = builders;
    newField.builders.project = projection;
  }

  return newField;
}

function groupField(groups, group, fieldName) {
  const groupName = group.name;
  groups[groupName] = groups[groupName] || {
    label: group.label,
    fields: []
  };
  groups[groupName].fields.push(fieldName);

  return groups;
}

function writeFile(folder, moduleName, moduleTypeInA3, fields, exportModule) {
  const content = exportModule
    ? `
    module.exports = {
      extend: '${moduleTypeInA3}',
      options: {
        label: '${moduleName}',
      },
      fields: ${JSON.stringify(fields, null, 2)}
    };
  `
    : `
    module.exports = {
      ${JSON.stringify(fields, null, 2)};
    };
  `;

  return fs.writeFile(
    `${folder}/${moduleName}/schema.js`,
    prettier.format(content, {
      singleQuote: true,
      parser: 'babel'
    }));
}

module.exports = {
  writeFile,
  groupField,
  handleArea,
  handleArray,
  generateFields,
  handleFieldType,
  handleRelationship
};
