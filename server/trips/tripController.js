var Trip = require('./tripModel.js');

/*
  create: create trip from database
  remove: remove trip from database
  modify: add POIs to matching trip from database
  modify2: add checklist responses to matching trip
  getTripView: return single trip data for mytrip view
  removePOI: NON-FUNCTIONAL remove POI to matching trip from database
*/

module.exports = {

  /* creates a trip for our Trip Model 
     called on new-trip page upon form submission (submit button click)
     creates trip using 
      - user input on destination (from map click or autocomplete)
      - user selection of date (optional)
  */
  create: function (req, res) {

    var newTrip = new Trip ({
      destination: req.body.destination,
      startDate: req.body.startDate,
      userId: req.decoded.username,
      POI: [],
      coordinates: req.body.coordinates,
    });

    newTrip.save(function (err, savedTrip) {
      if (err) {
        res.status(404).send(err);
        console.log(err);
      } else {
        res.status(201).send(savedTrip._id);
      }
    });
  },

  /* removes a trip from database
     called on trips view from click of trash can icon
     (appears on hover over trip in list view)
  */
  remove: function (req, res) {

    Trip.remove({_id: req.body.destination._id}, 
      function(err) {
        if (err) {
          console.error(err);
        }
        console.log('successfully removed..');
      }
    );
  },

  /* adds a POI (point of interest) to an existing trip in database
     called on my-trip view when savePage is called (save changes button click) 
     selected POIs (checked boxes) data saved to trip instance
  */
  modify: function (req, res) {

    Trip.findOne({_id: req.body._id}, 
      function(err, trip) {
        if (err) {
          res.send('failed');
        } else {
          trip.POI.push({
            title: req.body.title,
            details: req.body.details
          });
          res.status(201).send('Trip modified');
          trip.save(function(err, data) {});
        }
      }
    );
  },

  /* REFACTOR: saves the checkboxes for the four questions on the myTrip view
     currently not a way to undo 
  */
  modify2: function (req, res) {
    Trip.findOne({
      _id: req.body._id
    }, function(err, trip) {
      if (err) {
        res.send('failed');
      } else {
        if (req.body.flying) trip.flying = req.body.flying;
        if (req.body.leavingCountry) trip.leavingCountry = req.body.leavingCountry;
        if (req.body.travelingAlone) trip.travelingAlone = req.body.travelingAlone;
        if (req.body.accomodations) trip.accomodations = req.body.accomodations;
        res.status(201).send('Trip modified');
        trip.save(function(err, data) {});
      }
    });
  },

  /* loads an individual trip for the myTrip view
     finds with tripID (also path name - REFACTOR)
  */
  getTripView: function(req, res) {
    Trip.findOne({
        _id: req.params.tripId
      })
      .then(function(trip) {
        res.send(trip);
      })
      .catch(function(err) {
        res.status(403).send('Trip not found');
      });

  },

  /* REFACTOR: delete a point of interest from the myTrip page
     this is clearly not functional at the moment. sorry.
  */
  removePOI: function(req, res) {
    res.status(200).send('sup');
  }
};
