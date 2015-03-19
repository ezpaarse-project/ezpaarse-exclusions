#!/usr/bin/env node

'use strict';

var Transform = require('stream').Transform;
var fs        = require('fs');
var path      = require('path');
var unzip     = require('unzip');
var request   = require('request').defaults({
  proxy: process.env.HTTP_PROXY || process.env.http_proxy
});

var LineModifier = function (modifier) {
  Transform.call(this, { objectMode: true });
  this.buffer   = '';
  this.modifier = modifier;
};
require('util').inherits(LineModifier, Transform);

LineModifier.prototype._transform = function(chunk, encoding, callback) {
  var self     = this;
  this.buffer += chunk.toString();
  var lines    = this.buffer.split(/\r?\n/);
  this.buffer  = lines.pop() || '';

  lines.forEach(function (line) {
    var line = self.modifier(line);
    if (line !== null) { self.push(line + '\n'); }
  });
  callback();
};

LineModifier.prototype._flush = function(callback) {
  var self = this;
  this.buffer.split(/\r?\n/).forEach(function (line) {
    var line = self.modifier(line);
    if (line !== null) { self.push(line + '\n'); }
  });
  callback();
};


var dir = path.join(__dirname, '../..');

/**
 * Helper to scrape files easily
 * Usage : scraper().download(listName, url)
 *                  .download(...)
 *                  .done();
 */
module.exports = function scraper() {
  var lists  = [];
  var nbDl   = 0;
  var nbFail = 0;
  var noMore = false;
  var busy   = false;
  var index  = 0;
  var done;

  var finish = function () {
    console.log('\nDownloaded : %d', nbDl);
    console.log('Failed : %d', nbFail);

    if (typeof done === 'function') { done(nbFail || null); }
  };

  /**
   * Download next file
   */
  var next = function () {
    var list = lists[index];
    if (busy) { return; }
    if (!list) {
      if (noMore) { finish(); }
      return;
    }

    busy = true;
    index++;
    process.stdout.write('Downloading ' + list.url + '... ');

    var location = path.join(dir, 'robots.' + list.name + '.txt');

    request.get(list.url)
      .on('error', function (err) {
        nbFail++;
        process.stdout.write('fail ✘\n');
        busy = false;
        next();
      })
      .on('response', function (res) {
        if (!res.statusCode || res.statusCode != 200) {
          nbFail++;
          process.stdout.write('fail (code ' + (res.statusCode || '?') + ') ✘\n');
          busy = false;
          return next();
        }

        (function checkZip(callback) {
          if (!list.options.unzip) {
            return callback(res);
          }

          var firstEntry = true;

          res.pipe(unzip.Parse()).on('entry', function (entry) {
            if (firstEntry) {
              firstEntry = false;
              callback(entry);
            } else {
              entry.autodrain();
            }
          });
        })(function (stream) {
          if (list.options.modifier) {
            stream = stream.pipe(new LineModifier(list.options.modifier));
          }

          stream.pipe(fs.createWriteStream(location))
            .on('error', function (err) {
              nbFail++;
              process.stdout.write('fail ✘\n');
              busy = false;
              next();
            })
            .on('finish', function () {
              nbDl++;
              process.stdout.write('done ✔\n');
              busy = false;
              next();
            });
        });
      });
  };

  return {
    download: function (listName, url, options) {
      lists.push({ url: url, name: listName, options: options || {} });
      next();
      return this;
    },
    done: function (cb) {
      noMore = true;
      done   = cb;
      if (!busy && index >= lists.length) { finish(); }
    }
  };
};
