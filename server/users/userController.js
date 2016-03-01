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

  signup: function(req, res) {
    var newUser = Users({
      username: req.body.username,
      // leave password outside to call newUser's method after instantiation
      // password: Users.generateHash(req.body.password),
    });
    newUser.password = newUser.generateHash(req.body.password);

    // newUser.salt = newUser.generateSalt(req.body);

    //sends welcome email
    Email.signupEmail(newUser.username, config.API_KEY, config.DOMAIN)


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

  signin: function(req, res) {
    var userLogin = Users({
      username: req.body.username,
      password: req.body.password,
    });
    // TODO: will refactor into a promise


    Email.signinEmail(userLogin.username, config.API_KEY, config.DOMAIN);




    // Trips.find(function(err, trips){
    //   if(err){
    //     return console.log(err)
    //   }
    //   // var today = new Date();
    //   // var todayDate = today.getDate()
    //   // var todayMonth = today.getMonth() + 1
    //   // var todayYear = today.getFullYear()
    //   // var todayProper = todayMonth + '/' + todayDate + '/' + todayYear
    //   // console.log('todayProper', todayProper)
    //   var result = []
    //   trips.forEach(function(trip){
    //     if(trip.startDate){
    //       console.log('trip.startDate', trip.startDate)
    //       var reminderDate = moment(trip.startDate).subtract(14, 'days').calendar();
    //       console.log('reminderDate', reminderDate)
    //       if(reminderDate === 'Today at 12:00 AM'){
    //         console.log('YESSSSSS')
    //         result.push(trip)
    //       }
    //     }
    //   })
    //   return result
    // });

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
        } else {
          // if user is found, but password doesn't match
          res.send('Incorrect Password');
        }
      }
    })
  },

  // removes user and all associated trips
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

  // @req.body expects an user _id for reference to Trips schema
  // this should be moved over to the trip controller on refactor
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

  // loads the user email for the profile page
  getUser: function(req, res) {
    res.send(req.decoded.username);
  }
};
