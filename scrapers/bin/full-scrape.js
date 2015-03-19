#!/usr/bin/env node

'use strict';

var fs   = require('fs');
var path = require('path');

function deduplicate() {
  console.log('\nDeduplicating lists...');
  require('../lib/deduplicate.js')(function (err, nbRemoved) {
    if (err) {
      console.error(err);
    } else {
      console.log('%d duplicates removed', nbRemoved);
    }
  });
}

var dir = path.join(__dirname, '..');
fs.readdir(dir, function (err, files) {
  if (err) { throw err; }

  var i = 0;
  (function next() {
    var file = files[i++];
    if (!file) { return deduplicate(); }

    if (!/\.js$/.test(file)) { return next(); }

    var filepath = path.join(dir, file);
    console.log('\nExecuting %s', file);

    var scrape = require(filepath);
    scrape(function (err) {
      if (err) { throw err; }
      next();
    });
  })();
});
