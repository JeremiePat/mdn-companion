'use strict';

// REGEXP THAT DEFINE AN MDN TESTABLE URL
// ----------------------------------------------------------------------------
exports.isMDN = /^(?!.*(?:\$|%24).*)https:\/\/developer.mozilla.org\/[^\/]+\/.+$/;

// URL USED STORED INTO THE INDEXEDDB STORE MUST ONLY BE PATHNAME
// ----------------------------------------------------------------------------
exports.cleanURL = function (url) {
  return require('sdk/url').URL(url).pathname;
};
