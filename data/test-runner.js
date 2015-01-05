(function (self) {
  'use strict';

  // TEST FUNCTIONS
  // --------------------------------------------------------------------------
  function testSelector(selector) {
    return document.querySelectorAll(selector).length;
  }

  function testLink(link) {
    var rgx   = new RegExp(link, 'i');
    var links = document.querySelectorAll('#wikiArticle a');
    var count = 0;

    Array.prototype.forEach.call(links, function (a) {
      if (rgx.test(a.href)) {
        count++;
      }
    });

    return count;
  }

  function testText(selector, text) {
    var count    = 0;
    var elements = document.querySelectorAll(selector);
    var txt      = text.toLowerCase();

    Array.prototype.forEach.call(elements, function (element) {
      if (element.textContent.toLowerCase() === txt) {
        count++;
      }
    });

    return count;
  }

  function testTag(tagList) {
    var count = 0;
    var a     = document.querySelectorAll('.tags a');
    var tags  = Array.prototype.map.call(a, function (element) {
      return element.textContent.trim().toLowerCase();
    });

    tagList.forEach(function (tag) {
      if (tags.indexOf(tag.toLowerCase()) !== -1) { count++; }
    });

    return count;
  }

  // TEST RUN
  // --------------------------------------------------------------------------
  self.port.on('test', function (list) {
    var results = [];

    list.forEach(function (test) {
      var val, res = {
        id      : test.id,
        url     : window.location.pathname,
        level   : test.level,
        group   : test.group,
        result  : false,
        comment : ''
      };

      if (test.text) {
        val = testText(test.selector, test.text);
        res.comment = 'text:' + test.expect + ':' + val;
      }

      else if (test.selector) {
        val = testSelector(test.selector);
        res.comment = 'selector:' + test.expect + ':' + val;
      }

      else if (test.link) {
        val = testLink(test.link);
        res.comment = 'link:' + test.expect + ':' + val;
      }

      else if (test.tags) {
        val = testTag(tags);
        res.comment = 'tags:' + test.expect + ':' + val + ':' + tags.join(', ');
      }

      if (test.expect === -1) { res.result = val > 0; }
      else { res.result = val === test.expect; }

      results.push(res);
    });

    self.port.emit('result', results);
  });
})(self);
