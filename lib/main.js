'use strict';

// MODULES
// ----------------------------------------------------------------------------
var tabs   = require('sdk/tabs');
var pages  = require('sdk/page-mod');
var ui     = require('./modules/ui.js');
var STORE  = require('./modules/storage.js');
var {isMDN, cleanURL} = require('./modules/utils.js');


// At first run (after installation or major version update) we store all
// the tests into our indexedDB store. It will make them easier to manipulate
// ----------------------------------------------------------------------------
STORE.tests.getAll().then(function (list) {
  if (list.length === 0) {
    require('./modules/load-tests.js');
  }
});


// Start watching for MDN pages
// ----------------------------------------------------------------------------
pages.PageMod({
  include          : isMDN,
  contentScriptFile: './test-runner.js',
  contentScriptWhen: 'ready',
  onAttach         : function (worker) {
    worker.port.on('result', function (results) {
      STORE.results.add(results).then(function () {
        if (tabs.activeTab.url === worker.url) {
          ui.sanity.update(tabs.activeTab);
        }
      });
    });

    STORE.tests.getAll({url: cleanURL(worker.url)}).then(function (list) {
      worker.port.emit('test', list);
    });
  }
});


// LOOK UP TAB CHANGE
// ----------------------------------------------------------------------------
tabs.activeTab.on('ready', ui.sanity.update);
tabs.on('activate', ui.sanity.update);

ui.sanity.panel.port.on('edit', function () {
  tabs.activeTab.url += '$edit';
});
