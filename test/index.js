const assert = require('assert').strict;
const helpers = require('../helpers');

describe('Apostrophe-a3-schema-exporter', function() {
  it('should handle arrays', function() {
    const field = {
      name: 'content-links',
      type: 'array',
      schema: [
        {
          name: 'url',
          label: 'Url',
          type: 'url'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'string'
        }
      ],
      label: 'Content'
    };
    const generatedArray = helpers.handleArray(field);

    assert.deepEqual(generatedArray, {
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
    });
  });

  it('should handle tags as an array', function() {
    const field = {
      type: 'tags',
      name: 'tags',
      label: 'Tags'
    };
    const generatedArray = helpers.handleArray(field);

    assert.deepEqual(generatedArray, {
      type: 'array',
      label: 'Tags',
      fields: {
        add: {
          tag: {
            type: 'string',
            label: 'Tag'
          }
        }
      }
    });
  });

  it('should handle areas', function() {
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
    const generatedArea = helpers.handleArea(props);

    assert.deepEqual(generatedArea, {
      label: 'Widgets',
      type: 'area',
      options: {
        widgets: {
          '@apostrophecms/rich-text': { toolbar: [ 'Undo', 'Redo' ] },
          '@apostrophecms/image': { size: 'full' },
          '@apostrophecms/video': {}
        }
      }
    });
  });

  it('should handle joinByOne', function() {
    const cur = {
      type: 'joinByOne',
      name: '_article',
      label: 'Article',
      idField: 'articleId'
    };
    const generatedRelationship = helpers.handleRelationship(cur);

    assert.deepEqual(generatedRelationship, {
      ...generatedRelationship,
      max: 1,
      type: 'relationship'
    });
    assert.equal(generatedRelationship.filters, undefined);
  });

  it('should handle joinByArray', function() {
    const cur = {
      type: 'joinByArray',
      name: '_articles',
      label: 'Articles',
      idsField: 'articlesId'
    };
    const generatedRelationship = helpers.handleRelationship(cur);

    assert.deepEqual(generatedRelationship, {
      ...generatedRelationship,
      type: 'relationship'
    });
    assert.equal(generatedRelationship.filters, undefined);
    assert.equal(generatedRelationship.max, undefined);
  });

  it('should handle reverse joins', function() {
    const cur = {
      type: 'joinByArrayReverse',
      name: '_articles',
      label: 'Articles',
      reverseOf: '_category',
      idsField: 'categoryIds',
      withType: 'article'
    };
    const generatedRelationship = helpers.handleRelationship(cur);

    assert.deepEqual(generatedRelationship, {
      ...generatedRelationship,
      type: 'relationshipReverse',
      withType: 'article'
    });
    assert.equal(generatedRelationship.filters, undefined);
    assert.equal(generatedRelationship.max, undefined);
  });

  it('should convert join filters to builders', function() {
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
    const generatedRelationship = helpers.handleRelationship(cur);

    assert.deepEqual(generatedRelationship, {
      ...generatedRelationship,
      type: 'relationship',
      withType: 'article'
    });
    assert.equal(generatedRelationship.filters, undefined);
    assert.deepEqual(generatedRelationship.builders, {
      ...generatedRelationship.builders,
      project: {
        title: 1,
        slug: 1,
        type: 1
      }
    });
    assert.equal(generatedRelationship.builders.projection, undefined);
  });

  it('should convert joins with A2 type to A3', function() {
    const cur = {
      name: '_page',
      label: 'Link',
      type: 'joinByOne',
      withType: 'apostrophe-page',
      idField: 'pageId'
    };
    const generatedRelationship = helpers.handleRelationship(cur);

    assert.deepEqual(generatedRelationship, {
      ...generatedRelationship,
      type: 'relationship',
      withType: '@apostrophecms/page'
    });
  });

  it('should add a group field', function() {
    const groups = {
      basics: {
        label: 'Basics',
        fields: [ 'title', 'slug', 'published' ]
      }
    };
    const group = {
      name: 'content',
      label: 'Content'
    };
    const generatedGroups = helpers.groupField(groups, group, 'description');

    assert.deepEqual(generatedGroups, {
      basics: {
        label: 'Basics',
        fields: [ 'title', 'slug', 'published' ]
      },
      content: {
        label: 'Content',
        fields: [ 'description' ]
      }
    });
  });

  it('should update a group field', function() {
    const groups = {
      basics: {
        label: 'Basics',
        fields: [ 'title', 'slug', 'published' ]
      },
      content: {
        label: 'Content',
        fields: [ 'description' ]
      }
    };
    const group = {
      name: 'content',
      label: 'Content'
    };
    const generatedGroups = helpers.groupField(groups, group, 'link');

    assert.deepEqual(generatedGroups, {
      basics: {
        label: 'Basics',
        fields: [ 'title', 'slug', 'published' ]
      },
      content: {
        label: 'Content',
        fields: [ 'description', 'link' ]
      }
    });
  });
});
