(function (self) {
  'use strict';

  // UTILS
  // --------------------------------------------------------------------------
  function sortResults(a, b) {
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }

    else if (a.result !== b.result) {
      if (a.result && !b.result) { return  1; }
      if (b.result && !a.result) { return -1; }
    }

    else if (a.level !== b.level) {
      if (a.level === 'danger') { return -1; }
      if (b.level === 'danger') { return  1; }
      if (a.level === 'error')  { return -1; }
      if (b.level === 'error')  { return  1; }
    }

    return a.title.localeCompare(b.title);
  }

  // EVENT HANDLER
  // --------------------------------------------------------------------------
  function onClick(e) {
    if (e.target.matches('.more')) {
      e.target
        .parentNode
        .parentNode
        .parentNode
        .classList
        .toggle('show');
    }

    else if (e.target.matches('.edit')) {
      self.port.emit('edit', true);
    }
  }

  // DOM SETUP
  // --------------------------------------------------------------------------
  function addLine(table, result) {
    var css = 'test ok';
    var btn = '<button class="more"></button>';

    if (!result.result) {
      css = 'test ' + result.level;
      btn = '<button class="edit"></button><button class="more"></button>';
    }

    var line = [
      '<div class="', css, '">',
        '<div class="result">',
          '<div class="icon"></div>',
          '<div class="title">', result.title, '</div>',
          '<div class="action">', btn, '</div>',
        '</div>',
        '<div class="details">',
          '<div class="description">', result.description, '</div>',
          '<div class="comment">', result.comment, '</div>',
        '</div>',
      '</div>'
    ].join('');

    table.insertAdjacentHTML('beforeend', line);
  }

  function setGroup(body, group) {
    var section = document.createElement('section');
    body.appendChild(section);

    var h1 = document.createElement('h1');
    h1.appendChild(document.createTextNode(group));
    section.appendChild(h1);

    return section;
  }


  // SETUP DISPLAY
  // --------------------------------------------------------------------------
  self.port.on('display', function (list) {
    list.sort(sortResults);

    var group, table, body = document.body;
    body.innerHTML = '';

    list.forEach(function (result) {
      if (group !== result.group) {
        group = result.group;
        table = setGroup(body, group);
      }

      addLine(table, result);
    });
  });

  document.body.addEventListener('click', onClick);
})(self);
