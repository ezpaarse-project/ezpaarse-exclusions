#!/usr/bin/env node

'use strict';

require('./lib/scraper.js')()
  .download('myip_live', 'http://myip.ms/files/bots/live_webcrawlers.txt')
  .download('myip_blacklist', 'http://myip.ms/files/blacklist/general/full_blacklist_database.zip', {
    unzip: true,
    modifier: function (line) {
      // remove inline comments, which take a lot of place
      var index = line.indexOf('#');
      return index > 0 ? line.substr(0, index).trim() : line;
    }
  })
  .done();
