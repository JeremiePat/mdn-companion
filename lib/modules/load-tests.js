'use strict';

// MODULES
// ----------------------------------------------------------------------------
var me = require('sdk/self');
var store = require('./storage.js');


// TEST DEFINITIONS
// ----------------------------------------------------------------------------
// TODO: Mess with IO to get that list, rather than maintaining it by hand
var testFiles = [
  'basic-link-test.json',
  'basic-selector-test.json',
  'compatibility-section.json',
  'empty-elements.json',
  'js-tag.json',
  'old-en-links.json'
];


// LOAD TESTS INTO INDEXEDDB STORE
// ----------------------------------------------------------------------------
testFiles.forEach(function (fileName) {
  var data   = JSON.parse(me.data.load('tests/' + fileName));
  var expect = parseInt(data.expect, 10);

  var test = {
    id       : data.id || fileName.substr(0, fileName.lastIndexOf('.')),
    group    : data.group || '',
    level    : data.level === 'warning' ? 'warning' :
               data.level === 'danger'  ? 'danger'  :
                                          'error',
    path     : data.path || '.*',
    expect   : expect > -1 ? expect : -1,
    selector : data.selector,
    link     : data.link,
    text     : data.text,
    tags     : Array.isArray(data.tags) ? data.tags : [data.tags]
  };

  store.tests.add(test);
});
