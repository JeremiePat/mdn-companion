'use strict';

var _      = require('sdk/l10n').get;
var me     = require('sdk/self');
var ui     = require('sdk/ui');
var panel  = require('sdk/panel');
var STORE  = require('./storage.js');
var {isMDN, cleanURL} = require('./utils.js');


// SETUP UI ELEMENTS
// ----------------------------------------------------------------------------

// Main button to get the sanity check of the current MDN page
var sanityButton = ui.ToggleButton({
  id       : 'mdn-cmp-sanity',
  label    : 'MDN sanity check',
  disabled : true,
  icon     : {
    '16': './icons/mdn-16.png',
    '32': './icons/mdn-32.png',
    '64': './icons/mdn-64.png'
  },
  onChange : handleChange
});

// Main panel to display sanity check results
var sanityPanel = panel.Panel({
  contentURL       : me.data.url('ui/sanity-result-panel.html'),
  contentScriptFile: './ui/sanity-result-panel.js',
  onHide           : handleHide
});


// EVENT HANDLERS
// ----------------------------------------------------------------------------

function handleChange(state) {
  if (state.checked) {
    sanityPanel.show({
      position: sanityButton
    });
  }
}

function handleHide() {
  sanityButton.state('window', {
    checked: false
  });
}


// UPDATE ACTION
// ----------------------------------------------------------------------------

function updateButton(tab) {
  if (isMDN.test(tab.url)) {
    sanityButton.disabled = false;

    STORE.results.count(cleanURL(tab.url)).then(function (count) {
      if (count.danger.fail > 0) {
        sanityButton.badge      = count.danger.fail;
        sanityButton.badgeColor = '#000';
      }

      else if (count.error.fail > 0) {
        sanityButton.badge      = count.error.fail;
        sanityButton.badgeColor = '#900';
      }

      else if (count.warning.fail > 0) {
        sanityButton.badge      = count.warning.fail;
        sanityButton.badgeColor = '#D80';
      }

      else if (count.danger.total  > 0 &&
               count.error.total   > 0 &&
               count.warning.total > 0) {
        sanityButton.badge      = '✓';
        sanityButton.badgeColor = '#090';
      }
    }).catch(function () {
      sanityButton.badge = '';
    });
  }

  else {
    sanityButton.badge    = '';
    sanityButton.disabled = true;
  }
}

function updatePanel(tab) {
  if (isMDN.test(tab.url)) {
    STORE.results.getAll({url: cleanURL(tab.url)}).then(function (list) {
      var results = list.map(function (result) {
        var [comment, expect, found, extra] = result.comment.split(':');
        expect = parseInt(expect, 10);

        if (expect === -1) {
          comment += '-many';
          result.comment = _(comment, expect, found, extra);
        } else {
          comment += '-comment';
          result.comment = _(comment, expect, expect, found, extra);
        }

        result.group       = _(result.group);
        result.title       = _(result.id + '_title');
        result.description = _(result.id + '_description');
        return result;
      });

      sanityPanel.port.emit('display', results);
    });
  }
}


// MODULE INTERFACE
// ----------------------------------------------------------------------------

exports.sanity = {
  button: sanityButton,
  panel : sanityPanel,
  update: function (tab) {
    updateButton(tab);
    updatePanel(tab);
  }
};
