const express = require('express')
const path = require('path')
var cool = require('cool-ascii-faces')
const PORT = process.env.PORT || 5000

var bonsai_url = process.env.BONSAI_URL;
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: bonsai_url,
  log: 'trace'
});

// Test the connection:
// Send a HEAD request to "/" and allow
// up to 30 seconds for it to complete.
client.ping({
	requestTimeout: 30000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/cool', (req, res) => res.send(cool()))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
