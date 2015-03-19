#!/usr/bin/env node

'use strict';

var scraper = require('./lib/scraper.js');

function scrape(callback) {
  scraper()
  .download('myip_live', 'http://myip.ms/files/bots/live_webcrawlers.txt')
  .download('myip_blacklist', 'http://myip.ms/files/blacklist/general/full_blacklist_database.zip', {
    unzip: true,
    modifier: function (line) {
      // remove inline comments, which take a lot of place
      var index = line.indexOf('#');
      return index > 0 ? line.substr(0, index).trim() : line;
    }
  })
  .done(callback);
}

if (module.parent) {
  module.exports = scrape;
} else {
  scrape(function (err) {
    process.exit(err ? 1 : 0);
  });
}
