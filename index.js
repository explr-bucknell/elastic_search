const express = require('express')
const path = require('path')
const elasticsearch = require('elasticsearch')
const firebase = require('firebase')

const PORT = process.env.PORT || 5000

var bonsai_url = process.env.BONSAI_URL

var client = new elasticsearch.Client({
  host: bonsai_url,
  log: 'trace'
})

var config = {
  apiKey: 'AIzaSyBztce7Z8iOrB5EgV4IE8gjlFGAy6MXSkQ',
  authDomain: 'senior-design-explr.firebaseapp.com',
  databaseURL: 'https://senior-design-explr.firebaseio.com',
  projectId: 'senior-design-explr',
  storageBucket: 'senior-design-explr.appspot.com',
  messagingSenderId: '866651490806'
}
firebase.initializeApp(config)

var getPlacesData = (callback, res) => {
  const ref = firebase.database().ref('pois')
  ref.once('value', function(snapshot) {
    if (snapshot.numChildren()) {
      var data = []
      snapshot.forEach(function(poi) {
        data.push({
          index: {
            _index: 'explr',
            _type: 'places',
            _id: poi.val().id
          }
        })
        data.push({
          name: poi.val().name,
          id: poi.val().id
        })
      })
      callback(data, res)
    }
  })
}

var initPlaces = (data, res) => {
  client.bulk({
    body: data
  }, function (error, response) {
    // ...
    console.log("initPlaces", response)
    res.send(response)
  })
}

express()
  .get('/', (req, res) => res.send('explr'))

  // ping cluster for connection testing
  .get('/ping', (req, res) => {
    client.ping({
      requestTimeout: 30000,
    }, function (error) {
      if (error) {
        console.error('elasticsearch cluster is down!')
        res.send('elasticsearch cluster is down!')
      } else {
        console.log('All is well')
        res.send('All is well')
      }
    })
  })

  // initialize the places index by reading firebase data at once
  .get('/init_places', (req, res) => {
    client.deleteByQuery({
      index: 'explr',
      type: 'places',
      body: {
        query: {
          match_all: {}
        }
      }
    }, function (error, response) {
      // ...
    })
    getPlacesData(initPlaces, res)
  })

  // update the places index when called by cloud functions which listens to firebase changes
  .get('/update_places', (req, res) => {
    console.log("request", req.query)
    var data = JSON.parse(req.query.data)

    client.bulk({
      body: data
    }, function (error, response) {
      // ...
      console.log("updatePlaces", response)
      res.send(response)
    })
  })

  // search for places and pass in a field q which is the query
  .get('/search_places', (req, res) => {
    var query = req.query.q
    client.search({
      index: 'explr',
      type: 'places',
      body: {
        size: 50,
        query: {
          match: {
            name: query
          }
        }
      }
    }, function (error, response) {
      // ...
      res.send(response)
    })
  })

  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
