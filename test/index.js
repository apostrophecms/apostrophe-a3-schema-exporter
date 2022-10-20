/* eslint-disable no-unused-expressions */
const fs = require('fs-extra');
const { expect } = require('chai');
const { promisify } = require('util');
const a3SchemaExporter = require('../index');

describe('Apostrophe-a3-schema-exporter', function() {
  this.timeout(10000);
  let apos;

  after(async () => {
    const destroy = promisify(require('apostrophe/test-lib/util').destroy);
    await destroy(apos);
    fs.removeSync('./test/locales');
    fs.removeSync('./test/data');
    fs.removeSync('./test/public');
  });

  before((done) => {
    apos = require('apostrophe')({
      migrate: false,
      shortName: 'apostrophe-schema-exporter-test',
      modules: {
        'apostrophe-assets': {
          jQuery: 3
        },
        'apostrophe-express': {
          port: 3000,
          address: 'localhost',
          session: {
            secret: '12345'
          }
        },
        'apostrophe-images': {
          enableAltField: true
        },
        'apostrophe-a3-schema-exporter': a3SchemaExporter
      },
      afterListen: done
    });
  });

  it('should handle arrays', () => {
    const acc = {};
    const cur = {
      name: 'content-links',
      type: 'array',
      schema: [ {
        name: 'url',
        label: 'Url',
        type: 'url'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'string'
      } ],
      label: 'Content'
    };
    const name = 'content';
    const props = cur;

    const generatedArray = apos.a3SchemaExporter.handleArray(
      acc,
      cur,
      name,
      props,
      false
    );

    expect(generatedArray).to.deep.equal({
      content: {
        type: 'array',
        label: 'Content',
        fields: {
          add: {
            url: {
              label: 'Url',
              type: 'url'
            },
            description: {
              label: 'Description',
              type: 'string'
            }
          }
        }
      }
    });
  });

  it('should handle tags as an array', () => {
    const acc = {};
    const cur = {
      type: 'tags',
      name: 'tags',
      label: 'Tags',
      group: {
        name: 'basics',
        label: 'Basics'
      },
      moduleName: 'categories'
    };
    const name = 'tags';
    const props = {
      type: 'tags',
      label: 'Tags'
    };
    const generatedArray = apos.a3SchemaExporter.handleArray(
      acc,
      cur,
      name,
      props,
      true
    );

    expect(generatedArray).to.deep.equal({
      tags: {
        type: 'array',
        label: 'Tags',
        fields: {
          add: {
            tags: {
              type: 'string',
              label: 'Tag'
            }
          }
        }
      }
    });
  });

  it('should handle areas', async () => {
    const props = {
      label: 'Widgets',
      type: 'area',
      options: {
        widgets: {
          'apostrophe-rich-text': { toolbar: [ 'Undo', 'Redo' ] },
          'apostrophe-images': { size: 'full' },
          'apostrophe-video': {}
        }
      }
    };
    const generatedArea = apos.a3SchemaExporter.handleArea(props);

    expect(generatedArea).to.deep.equal({
      '@apostrophecms/rich-text': { toolbar: [ 'Undo', 'Redo' ] },
      '@apostrophecms/image': { size: 'full' },
      '@apostrophecms/video': {}
    });
  });

  it('should handle joinByOne', async () => {
    const cur = {
      type: 'joinByOne',
      name: '_article',
      label: 'Article',
      idField: 'articleId'
    };
    const generatedRelationship = apos.a3SchemaExporter.handleRelationship(cur);

    expect(generatedRelationship).to.contain({
      max: 1,
      type: 'relationship'
    });
    expect(generatedRelationship.filters).to.be.undefined;
  });

  it('should handle joinByArray', async () => {
    const cur = {
      type: 'joinByArray',
      name: '_articles',
      label: 'Articles',
      idsField: 'articlesId'
    };
    const generatedRelationship = apos.a3SchemaExporter.handleRelationship(cur);

    expect(generatedRelationship).to.contain({
      type: 'relationship'
    });
    expect(generatedRelationship.filters).to.be.undefined;
    expect(generatedRelationship.max).to.be.undefined;
  });

  it('should handle reverse joins', async () => {
    const cur = {
      type: 'joinByArrayReverse',
      name: '_articles',
      label: 'Articles',
      reverseOf: '_category',
      idsField: 'categoryIds',
      withType: 'article'
    };
    const generatedRelationship = apos.a3SchemaExporter.handleRelationship(cur);

    expect(generatedRelationship).to.contain({
      type: 'relationshipReverse',
      withType: 'article'
    });
    expect(generatedRelationship.filters).to.be.undefined;
    expect(generatedRelationship.max).to.be.undefined;
  });

  it('should convert join filters to builders', () => {
    const cur = {
      type: 'joinByArray',
      name: '_articles',
      label: 'Articles',
      idsField: 'articlesId',
      withType: 'article',
      filters: {
        projection: {
          title: 1,
          slug: 1,
          type: 1
        }
      }
    };
    const generatedRelationship = apos.a3SchemaExporter.handleRelationship(cur);

    expect(generatedRelationship).to.contain({
      type: 'relationship',
      withType: 'article'
    });
    expect(generatedRelationship.filters).to.be.undefined;
    expect(generatedRelationship.builders).to.deep.nested.contain({
      project: {
        title: 1,
        slug: 1,
        type: 1
      }
    });
    expect(generatedRelationship.builders.projection).to.be.undefined;
  });

  it('should convert joins with A2 type to A3', () => {
    const cur = {
      name: '_page',
      label: 'Link',
      type: 'joinByOne',
      withType: 'apostrophe-page',
      idField: 'pageId'
    };
    const generatedRelationship = apos.a3SchemaExporter.handleRelationship(cur);

    expect(generatedRelationship).to.contain({
      type: 'relationship',
      withType: '@apostrophecms/page'
    });
  });
});
