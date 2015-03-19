#!/usr/bin/env node

'use strict';

require('../lib/deduplicate.js')(function (err, nbRemoved) {
  if (err) {
    console.error(err);
  } else {
    console.log('%d duplicates removed', nbRemoved);
  }
  process.exit(err ? 1 : 0);
});
