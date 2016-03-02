var Schedule = require('node-schedule');
var Email = require('./mailer.js');
var Trips = require('../trips/tripModel.js');
// var moment = require('moment');


module.exports = {
  
  /* return trips that start within a certain period of time
     send reminders for those trips
  */
  getTripsForReminder: function(res){
    // var twisted = function(res){
    //   return function(err, data){
    //     if(err){
    //       console.log('err')
    //     }
    //     res.send(data)
    //   }
    // }
    
    // Trips.find({}, twisted(res))
    
    
    
    Trips.find({}, function(err, trips){
      if(err){
        console.log(err)
      }
      console.log('29', trips)
      
      // var result = []
      // trips.forEach(function(trip){
      //   var result = []
      //   var dateOfTrip = moment(trip.startDate).format('L')
      //   result.push(dateOfTrip)
        
      //   // console.log('32', trip)
      // })
      // return result
    })
    .then(function(trips){
      var results = []
      trips.forEach(function(trip){

        var date = moment(trip.startDate).format('L')
        trip.startDate = date
        
        results.push({date: date, email: trip.userId})
      })
      return results
    })
    .then(function(results){
      console.log('51', results)
      var reminder = moment().add(14, 'days').calendar()
      console.log(reminder)
      results.forEach(function(trip){
        console.log(trip.date)
        if(trip.date === reminder){
          console.log('trip.email', trip.email)
          console.log('57!!!!!!')
          Email.reminderEmail(trip.email)
        }
      })
    })
    
    
    // var today = new Date()
    // var reminderDate = moment(today).add(14, 'days').calendar();
    // console.log(reminderDate)

    // var results = []
    
    // Trips.find({}, function(err, trips){
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
    //     if(trip.startDate === reminderDate){
    //       results.push(trip)
    //     }
    //   })
    //   return results
    // });
    
  }
}

