var Yelp = require('yelp');

// Please register for a Yelp API Key @: 
// https://www.yelp.com/developers/documentation/v2/overview
var yelp = new Yelp({
  consumer_key: null,
  consumer_secret: null,
  token: null,
  token_secret: null,
});
 
/* returns results from yelp matching user input */
exports.getPOI = function (req, res) {
  yelp.search({ term: req.query.userInput, location: req.params.city.replace('_',' ') })
  .then(function (data) {
    res.send(data);
  })
  .catch(function (err) {
    console.error(err);
  });
}

/* returns results for queries using google drawing manager */
exports.getOverlay = function (req, res) {

    if (req.body.location.length < 5) { // request is a rectangle
      yelp.search({
          bounds: req.body.location[0] + ',' + req.body.location[1] +
            '|' + req.body.location[2] + ',' + req.body.location[3],
          sort: 1,
          term: 'tourist attraction'
        })
        .then(function (data) {
          // console.log(data);
          res.status(200).send(data);
        })
        .catch(function (err) {
          console.error(err);
        })
    } else {
      var batch = [];
      //  yelp.search({
      //    ll: 40.92072966705823 + ',' +-90.65338209271431,
      //    term: 'tourist attraction'
      //    // req.body.location[0][0] + ',' + req.body.location[0][1]
      //  })
      // .then(function(vals) {
      //      console.log(vals);
      //      res.send(vals);
      //    })
      //    .catch(function(err) {
      //      console.error(err);
      //    })
      // request is a line
      // var promiseArr = req.body.location.map(function(coordinate) {
      //   console.log(req.body.location.length, ' is length');
      //   return new Promise(function(resolve, reject) {
      //   })
      // })
      // turn each to a promise
      req.body.location.forEach(function(coor, i) {

          console.log(coor);

          yelp.search({
              ll: coor[0] + ',' + coor[1],
              term: 'tourist attraction',
              limit: 1,
              sort: 1,
            })
            .then(function(data) {
              batch.push(data);
              console.log(data.id);
              if (batch.length === req.body.location.length) {
                res.send(batch);
              }
            })
            .catch(function(err) {
              console.error(err);
            });
        });
        // Promise.all(promiseArr)
        //   .then(function(vals) {
        //     console.log('all good')
        //     res.status(200).send(vals);
        //   })
        //   .catch(function(err) {
        //     console.log('cant do it');
        //     console.error(err);
        //   })
    }

};
  // See http://www.yelp.com/developers/documentation/v2/search_api

// See http://www.yelp.com/developers/documentation/v2/business
// yelp.business('yelp-san-francisco')
//   .then(console.log)
//   .catch(console.error);

// yelp.phoneSearch({ phone: '+15555555555' })
//   .then(console.log)
//   .catch(console.error);

// // A callback based API is also available:
// yelp.business('yelp-san-francisco', function(err, data) {
//   if (err) return console.log(error);
//   console.log(data);
// });
//have my JSON object, do whatever we want here, like add to spreadsheets
