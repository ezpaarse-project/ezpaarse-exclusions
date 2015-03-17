#!/usr/bin/env node

'use strict';

require('./lib/scraper.js')()
  .download('google',    'http://www.iplists.com/nw/google.txt')
  .download('yahoo',     'http://www.iplists.com/nw/inktomi.txt')
  .download('lycos',     'http://www.iplists.com/nw/lycos.txt')
  .download('bing',      'http://www.iplists.com/nw/msn.txt')
  .download('altavista', 'http://www.iplists.com/nw/altavista.txt')
  .download('wisenut',   'http://www.iplists.com/nw/wisenut.txt')
  .download('ask',       'http://www.iplists.com/nw/askjeeves.txt')
  .download('misc',      'http://www.iplists.com/nw/misc.txt')
  .download('nospider',  'http://www.iplists.com/nw/non_engines.txt')
  .done();
