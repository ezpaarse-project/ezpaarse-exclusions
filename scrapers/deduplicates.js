#!/usr/bin/env node

'use strict';

var fs       = require('fs');
var path     = require('path');
var Splitter = require('../../lib/splitter.js').Splitter;
var Joiner   = require('../../lib/splitter.js').Joiner;

var types = [
  'robots',
  'domains',
  'hosts'
];

function deduplicate(files, callback) {

  var entries = {};
  var i       = 0;
  var removed = 0;
  var tmpFile = path.join(__dirname, '.tmp');

  (function readFile() {
    var file = files[i++];
    if (!file) { return callback(null, removed); }

    fs.createReadStream(file)
      .pipe(new Splitter(0))
      .pipe(new Joiner(function (line) {
        var entry   = line;
        var comment = entry.indexOf('#');

        if (comment >= 0) { entry = entry.substr(0, comment); }
        entry = entry.trim();

        if (entry.length === 0) { return line; }
        if (entries[entry]) {
          removed++;
          return null;
        }

        entries[entry] = 1
        return line;
      }))
      .pipe(fs.createWriteStream(tmpFile))
      .on('error', function (err) {
        fs.unlink(tmpFile);
        callback(err);
      })
      .on('finish', function () {
        fs.rename(tmpFile, file, function (err) {
          if (err) { throw err; }
          readFile();
        });
      });
  })();
}

var dir = path.join(__dirname, '..');
fs.readdir(dir, function (err, files) {
  if (err) { throw err; }

  var lists = {
    'robots':  [],
    'hosts':   [],
    'domains': []
  };

  files.forEach(function (file) {
    var type = file.substr(0, file.indexOf('.'));
    if (lists.hasOwnProperty(type)) {
      lists[type].push(path.join(dir, file));
    }
  });

  deduplicate(lists.robots, function (err, del1) {
    if (err) { throw err; }

    deduplicate(lists.hosts, function (err, del2) {
      if (err) { throw err; }

      deduplicate(lists.domains, function (err, del3) {
        if (err) { throw err; }
        console.log('%d duplicates removed', del1 + del2 + del3);
      });
    });
  });
});
