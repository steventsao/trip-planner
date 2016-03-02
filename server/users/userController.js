var Users = require('./userModel.js');
var Q = require('q');
var Trips = require('../trips/tripModel.js');
var util = require('../config/utils.js');
var authController = require('./../config/authController.js');
var Email = require('../notification_service/mailer.js');
var Trips = require('../trips/tripModel.js');
var moment = require('moment');
var config = require('../notification_service/_config.js')

module.exports = {

  /* create new user and store to database 
     returns jwt for site authentication 
  */
  signup: function(req, res) {
    var newUser = Users({
      username: req.body.username, // leave password outside to call newUser's method after instantiation
    });

    newUser.password = newUser.generateHash(req.body.password);

    Email.signupEmail(newUser.username, config.API_KEY, config.DOMAIN) //sends welcome email

    newUser.save(function(err, user) {
      if (err) {
        console.error(err);
      } else {
        var token = authController.createToken(user);
        res.send({
          'token': token,
          'id': user._id
        });
      }
    });
  },

  /* logs in user if exists and password matches
     returns jwt for site authentication 
  */
  signin: function(req, res) {
    var userLogin = Users({
      username: req.body.username,
      password: req.body.password,
    });
    // TODO: will refactor into a promise


    Email.signinEmail(userLogin.username, config.API_KEY, config.DOMAIN);

    Users.findOne({
      'username': userLogin.username
    }, function(err, user) {
      if (!user) {
        // no matching username
        res.send('Not Found');
      } else {
        // compares current password with hashed password from found user
        if (userLogin.comparePasswords(userLogin.password, user.password)) {
          var token = authController.createToken(user);
          Trips.find({
              userId: user._id
            })
            .then(function(found) {
              res.send({
                'token': token,
                'id': user._id
              });
            })
        } else { // if user is found, but password doesn't match
          res.send('Incorrect Password');
        }
      }
    })
  },

  /* removes user and all associated trips from database
     called from profile page
  */
  removeUser: function(req, res) {
    Users.remove({
      'username': req.decoded.username
    })
    Trips.remove({
        'userId': req.decoded.username
      })
      .then(function(results) {
        res.send('Deleted');
      })
  },

  /* updates user password
     called from profile page
  */
  changePassword: function(req, res) {
    var userLogin = Users({
      username: req.decoded.username,
      password: req.body.prev
    });
    Users.findOne({
      'username': userLogin.username
    }, function(err, user) {
      if (!user) {
        // no matching username
        res.send('Not Found');
      } else {
        // compares current password with hashed password from found user
        if (userLogin.comparePasswords(userLogin.password, user.password)) {
          //update the password for the existing user with the future password
          user.password = userLogin.generateHash(req.body.future);
          user.save(function(err, data) {});
          res.send('Password has been changed');
        } else {
          //if user is found, but password doesn't match
          res.send('Nope');
        }
      }
    })
  },

  /* returns all trips for a given user (logged in user) for rendering in trips view
     
     REFACTOR? @req.body expects an user _id for reference to Trips schema
     this should be moved over to the trip controller on refactor
  */
  alltrips: function(req, res) {
    var tripArr;
    Trips.find({
        'userId': req.decoded.username
      })
      .then(function(results) {
        res.send(results);
      })
      .catch(function(err) {
        console.log('Error all trips catch', err);
        res.status(403)
          .send('No trips found');
      })
  },

  /* loads the user email for the profile page */
  getUser: function(req, res) {
    res.send(req.decoded.username);
  }
};
