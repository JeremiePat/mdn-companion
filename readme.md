MDN Companion Firefox Extension
===

This project is a pet project inspired by https://github.com/Elchi3/mdn-doc-tests

This extension automatically run tests against the MDN pages you are visiting in order to check the quality of the content. The intent is to help MDN editors find glitches to fix while browsing the MDN.

There is currently 4 type of tests supported:

* Text tests check for the existence of a given text (stripped of HTML) on the page.
* Selector tests check for the matching of a CSS selector against the page content.
* Link tests check for the existence of a given link on the page content.
* Tag tests check that a page has a proper set of tags set to it.

Tests result are stored in an IndexedDB to fasten reading of the results.
