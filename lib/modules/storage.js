'use strict';

var DBVersion = 1;
var { indexedDB, IDBKeyRange } = require('sdk/indexed-db');

// TEST OBJECT STRUCTURE
// {
//   id          : <string> // The unique id of the text
//   title       : <string> // The human readable name of the test
//   description : <string> // The description of the test
//   group       : <string> // An optional group id
//   level       : <string> // "warning", "error", "danger"
//   path        : <regexp> // The pattern a page URL should match to run
//                          // the test against
//   expect      : <number> // The number of match expect by the selector, link
//                          // or text (-1 === more than 0, default value)
//
//   // For "selector" test
//   selector    : <string> // A selector to test again the DOM of the page
//   // For "link" test
//   link        : <regexp> // A regexp to check the existence of links
//   // For "text" test (must include selector as well)
//   text        : <regexp> // A regexp to check the existence of a given text
// }

// RESULT OBJECT STRUCTURE
// {
//   id      : <string>  // The id of the related test
//   url     : <string>  // The url of the page the test were run against
//   result  : <boolean> // Has the test pass?
//   level   : <string>  // "warning", "error", "danger"
//   group   : <string>  // An optional group id
//   comment : <string>  // Some extra comment about the test result
// }

/** Open the IndexedDB on demand only once
 *
 * @return Promise
 */
function open() {
  if (!open.promise) {
    open.promise = new Promise(function (resolve, reject) {
      var request = indexedDB.open('MDNDB', DBVersion);

      request.onsuccess = function (e) {
        resolve(e.target.result);
      };

      request.onerror = function (e) {
        reject(e.value);
      };

      request.onupgradeneeded = function(e) {
        var db = e.target.result;

        db.onerror = function (err) {
          reject(err.value);
        };

        // Handle the store for tests
        if(db.objectStoreNames.contains('tests')) {
          db.deleteObjectStore('tests');
        }

        var testStore = db.createObjectStore('tests', {keyPath: 'id'});

        testStore.createIndex('level', 'level', {unique: false});
        testStore.createIndex('group', 'group', {unique: false});

        // Handle the store for the results
        if(db.objectStoreNames.contains('results')) {
          db.deleteObjectStore('results');
        }

        var resultStore = db.createObjectStore('results');

        resultStore.createIndex('id',     'id',     {unique: false});
        resultStore.createIndex('url',    'url',    {unique: false});
        resultStore.createIndex('level',  'level',  {unique: false});
        resultStore.createIndex('group',  'group',  {unique: false});
      };
    });
  }

  return open.promise;
}

function error(reject) {
  return function (e) {
    reject(e.value || e);
  };
}

function applyFilter(store, filter) {
  var isResult = store.name === 'results';

  if (!filter) {
    return {
      index: store
    };
  }

  if (filter.id) {
    if (isResult) {
      if (filter.url) {
        return {
          index: store,
          range: IDBKeyRange.only(filter.id + ':' + filter.url)
        };
      }

      return {
        index: store.index('id'),
        range: IDBKeyRange.only(filter.id)
      };
    }

    return {
      index: store,
      range: IDBKeyRange.only(filter.id)
    };
  }

  if (filter.url && isResult) {
    return {
      index: store.index('url'),
      range: IDBKeyRange.only(filter.url)
    };
  }

  if (filter.level) {
    return {
      index: store.index('level'),
      range: IDBKeyRange.only(filter.level)
    };
  }

  if (filter.group) {
    return {
      index: store.index('group'),
      range: IDBKeyRange.only(filter.group)
    };
  }

  return {
    index: store
  };
}

function getStore(db, storeName, mode) {
  return db
    .transaction(storeName, mode || 'readonly')
    .objectStore(storeName);
}

function getCursor(store, filter) {
  var {index, range} = applyFilter(store, filter);

  return index.openCursor(range);
}

function putRequest(store, content) {
  if (store.name === 'results') {
    return store.put(content, content.id + ':' + content.url);
  }

  return store.put(content);
}

function getContent(storeName, filter, onsuccess, onerror) {
  open().then(function (db) {
    var store  = getStore(db, storeName);
    var cursor = getCursor(store, filter);

    cursor.onsuccess = onsuccess;
    cursor.onerror   = onerror;
    store.transaction.onerror = onerror;
  }).catch(onerror);
}


// HIGHLEVEL METHODS
// ----------------------------------------------------------------------------

/** Request all the tests
 *
 * The list of test can be filtered by:
 * id    : Will provide the given test
 * level : Will provide all the tests matching the given level
 * group : Will provide all the tests matching the given group
 * url   : Will provide all the tests relevant for the given url
 *
 * Note that currently, "level" and "group" are exclusive (with "level" taking
 * precedence);
 *
 * If successful, the promise callback will get an area of objects
 * each representing a test matching the filter
 *
 * @param filter <object>
 * @return Promise
 */
function getAllTests(filter) {
  return new Promise(function (resolve, reject) {
    var list      = [];
    var onerror   = error(reject);
    var onsuccess = function (e) {
      var crs = e.target.result;
      if (crs) {
        let path = new RegExp(crs.value.path, 'i');

        if (!('url' in filter) || path.test(filter.url)) {
          list.push(crs.value);
        }

        crs.continue();
      } else {
        resolve(list);
      }
    };

    getContent('tests', filter, onsuccess, onerror);
  });
}

/** Request all results
 *
 * Results can be filtered by:
 * id     : Will return all the result for the given test id
 * url    : Will return all the result for the given url
 * result : Will return all the result with the given result
 *
 * If successful, the promise callback will get an area of objects
 * each representing a result matching the filter
 *
 * @param filter <object>
 * @return Promise
 */
function getAllResults(filter) {
  return new Promise(function (resolve, reject) {
    var list      = [];
    var onerror   = error(reject);
    var onsuccess = function (e) {
      var crs = e.target.result;
      if (crs) {
        if (!('result' in filter) || crs.value.result === filter.result) {
          list.push(crs.value);
        }

        crs.continue();
      } else {
        resolve(list);
      }
    };

    getContent('results', filter, onsuccess, onerror);
  });
}

function countResults(url) {
  var filter = {url:url};

  return new Promise(function (resolve, reject) {
    var output  = {
      warning: {total: 0, pass: 0, fail: 0},
      error  : {total: 0, pass: 0, fail: 0},
      danger : {total: 0, pass: 0, fail: 0}
    };
    var onerror   = error(reject);
    var onsuccess = function (e) {
      var crs = e.target.result;

      if (crs) {
        let res = crs.value;
        output[res.level].total += 1;
        res.result ? output[res.level].pass++ : output[res.level].fail++;
        crs.continue();
      }

      else {
        resolve(output);
      }
    };

    getContent('results', filter, onsuccess, onerror);
  });
}

function setThis(content, storeName) {
  var list = Array.isArray(content) ? content : [content];

  return new Promise(function (resolve, reject) {
    var onerror   = error(reject);

    open().then(function (db) {
      var store   = getStore(db, storeName, 'readwrite');

      function add() {
        if (list.length === 0) {
          resolve();
        } else {
          var result        = list.shift();
          var request       = putRequest(store, result);
          request.onsuccess = add;
          request.onerror   = onerror;
        }
      }

      add();
      store.transaction.onerror = onerror;
    }).catch(error(reject));
  });
}


// MODULE API
// ----------------------------------------------------------------------------

exports.tests = {
  getAll : getAllTests,
  add    : function (test) {
    return setThis(test, 'tests');
  }
};

exports.results = {
  getAll : getAllResults,
  count  : countResults,
  add    : function (result) { return setThis(result, 'results'); }
};
