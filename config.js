module.exports = {
  moduleTypes: {
    'apostrophe-widgets': '@apostrophecms/widget-type',
    'apostrophe-custom-pages': '@apostrophecms/page-type',
    'apostrophe-pieces': '@apostrophecms/piece-type',
    'apostrophe-pieces-pages': '@apostrophecms/piece-page-type',
    'apostrophe-any-page-manager': '@apostrophecms/any-page-type',
    'apostrophe-global': '@apostrophecms/global',
    'apostrophe-polymorphic-manager': '@apostrophecms/polymorphic-type',
    'apostrophe-pages': '@apostrophecms/page'
  },

  relationshipTypes: {
    joinByArray: 'relationship',
    joinByOne: 'relationship',
    joinByArrayReverse: 'relationshipReverse',
    joinByOneReverse: 'relationshipReverse'
  },

  widgetTypes: {
    'apostrophe-rich-text': '@apostrophecms/rich-text',
    'apostrophe-video': '@apostrophecms/video',
    'apostrophe-images': '@apostrophecms/image'
  }
};
