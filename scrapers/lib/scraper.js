#!/usr/bin/env node

'use strict';

var fs      = require('fs');
var path    = require('path');
var request = require('request').defaults({
  proxy: process.env.HTTP_PROXY || process.env.http_proxy
});

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
  var done   = false;
  var busy   = false;
  var index  = 0;

  var finish = function () {
    console.log('\nDownloaded : %d', nbDl);
    console.log('Failed : %d', nbFail);
    process.exit(nbFail ? 1 : 0);
  };

  /**
   * Download next file
   */
  var next = function () {
    var list = lists[index];
    if (busy) { return; }
    if (!list) {
      if (done) { finish(); }
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

        res.pipe(fs.createWriteStream(location))
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
          })
      });
  };

  return {
    download: function (listName, url) {
      lists.push({ url: url, name: listName });
      next();
      return this;
    },
    done: function () {
      done = true;
      if (!busy && index >= lists.length) { finish(); }
    }
  };
};
