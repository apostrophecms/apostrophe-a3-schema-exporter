/* eslint-disable no-unused-expressions */
const fs = require('fs');
const assert = require('assert');
const { promisify } = require('util');
const a3SchemaExporter = require('../index');

describe('Apostrophe-a3-schema-exporter', function() {
  this.timeout(10000);
  let apos;

  after(async () => {
    const destroy = promisify(require('apostrophe/test-lib/util').destroy);
    await destroy(apos);
    fs.rmSync('./test/locales', {
      recursive: true,
      force: true
    });
    fs.rmSync('./test/data', {
      recursive: true,
      force: true
    });
    fs.rmSync('./test/public', {
      recursive: true,
      force: true
    });
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

    const generatedArray = apos.modules['apostrophe-a3-schema-exporter'].handleArray({
      acc,
      cur,
      name,
      props
    });

    assert.deepEqual(generatedArray, {
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
    const generatedArray = apos.modules['apostrophe-a3-schema-exporter'].handleArray({
      acc,
      cur,
      name,
      props,
      keepTags: true
    });

    assert.deepEqual(generatedArray, {
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
    const generatedArea = apos.modules['apostrophe-a3-schema-exporter'].handleArea(props);

    assert.deepEqual(generatedArea, {
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
    const generatedRelationship = apos.modules['apostrophe-a3-schema-exporter'].handleRelationship(cur);

    assert(generatedRelationship, {
      max: 1,
      type: 'relationship'
    });
    assert.strictEqual(generatedRelationship.filters, undefined);
  });

  it('should handle joinByArray', async () => {
    const cur = {
      type: 'joinByArray',
      name: '_articles',
      label: 'Articles',
      idsField: 'articlesId'
    };
    const generatedRelationship = apos.modules['apostrophe-a3-schema-exporter'].handleRelationship(cur);

    assert(generatedRelationship, {
      type: 'relationship'
    });
    assert.strictEqual(generatedRelationship.filters, undefined);
    assert.strictEqual(generatedRelationship.max, undefined);
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
    const generatedRelationship = apos.modules['apostrophe-a3-schema-exporter'].handleRelationship(cur);

    assert(generatedRelationship, {
      type: 'relationshipReverse',
      withType: 'article'
    });
    assert.strictEqual(generatedRelationship.filters, undefined);
    assert.strictEqual(generatedRelationship.max, undefined);
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
    const generatedRelationship = apos.modules['apostrophe-a3-schema-exporter'].handleRelationship(cur);

    assert(generatedRelationship, {
      type: 'relationship',
      withType: 'article'
    });
    assert.strictEqual(generatedRelationship.filters, undefined);
    assert(generatedRelationship.builders, {
      project: {
        title: 1,
        slug: 1,
        type: 1
      }
    });
    assert.strictEqual(generatedRelationship.builders.projection, undefined);
  });

  it('should convert joins with A2 type to A3', () => {
    const cur = {
      name: '_page',
      label: 'Link',
      type: 'joinByOne',
      withType: 'apostrophe-page',
      idField: 'pageId'
    };
    const generatedRelationship = apos.modules['apostrophe-a3-schema-exporter'].handleRelationship(cur);

    assert(generatedRelationship, {
      type: 'relationship',
      withType: '@apostrophecms/page'
    });
  });
});
