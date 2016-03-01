angular.module('app.services', [])


/* Trips factory containing all trip related requests to server */
.factory('Trips', function($http, $window) {


  var trips = {}; // persistent storage of all trips for given user
  var user = $window.localStorage.getItem('com.tp.user'); // pulls the current user for the JWT
  var tripID = {}; // loads the current trip as separate storage object

  /* fetches all trips for a given user - called on trips page load */
  var allTrips = function(user) {
    return $http({
        method: 'GET',
        url: '/api/users/alltrips',
        data: user
      })
      .then(function(resp) {
        trips = resp.data;
      })
      .then(function() {
        return trips;
      });
  };

  allTrips(user); // populates trips object on instantiation

  /* fetches single trip matching tripID for a given user - called on my-trip/:id
     page load
  */
  var accessTrip = function(tripID) {
    console.log('you called me');
    tripID = tripID; // if accessing page through bookmark or reload, sets tripID (used to define path)
    return $http({
        method: 'GET',
        url: '/api/trips/' + tripID
      })
      .then(function(resp) {
        return resp.data;
      });
  };

  /* creates new trip
     only called once the submit button is pressed on create trip page
     destination based on either dropped pin or autocompleted address in
     text input bar
     returns newly created trip
  */
  var newTrip = function(destination, startDate, coordinates) {
    return $http({
        method: 'POST',
        url: '/api/trips/create',
        data: {
          destination: destination,
          startDate: startDate,
          coordinates: coordinates,
        }
      })
      .then(function(data) {
        console.log(data.data);
        tripID = data.data;
        return data.data;
      });
  };

  /* deletes a trip - called from trips page using either infowindow delete (on map)
     or trash icon (in list), also called from my-trip page using delete button (pending)
  */
  var removeTrip = function(target) {
    return $http({
        method: 'POST',
        url: 'api/trips/remove',
        data: {
          'destination': target
        }
      })
      .then(function(results) {
        return results;
      });
  };

  var requestAttractions = function (location, userInput) {
    return $http({
      method: 'GET',
      url: 'api/trips/yelp/' + location.replace(' ', '_') +'?userInput=' + userInput,
    }).then(function (results) {
      console.log(results);
      return results;
    });
  };

  var searchOverlay = function(location) {
    console.log(location.toString());
    return $http({
      method: 'POST',
      url: 'api/trips/yelp/overlay',
      data: {
        location: location
      },
    });
  };

  /* add point of interest to trip.  currently called from my-trip page by
     manual input of POI (not filtered) and on create-trip page with results
     pulled from google places library (to be migrated to my-trip page)
  */

  var addPOI = function(tripID, title, details) {
    var tripData = {
      _id: tripID,
      title: title,
      details: details,
    };
    return $http({
      method: 'PUT',
      url: 'api/trips/modify',
      data: tripData
    });
  };

  var deletePOI = function(tripID, title, details) {
    var tripData = {
      _id: tripID,
      title: title,
      details: details,
    };
    return $http({
      method: 'DELETE',
      url: '/api/trips/poi',
      data: tripData
    });
  };

  /* someone please refactor me!!!!
     trip specific information shown on my-trip page
     used to add trip-specific information to trip instance in mongo
     data is used to send email notifications in relevant trip-related
     situations (reminders)
  */
  var addTrigger = function(tripID, string, value) {
    var tripData = {};
    if (string === 'flying') {
      tripData = {
        _id: tripID,
        flying: value
      };
    }
    if (string === 'leavingCountry') {
      tripData = {
        _id: tripID,
        leavingCountry: value
      };
    }
    if (string === 'travelingAlone') {
      tripData = {
        _id: tripID,
        travelingAlone: value
      };
    }
    if (string === 'accomodations') {
      tripData = {
        _id: tripID,
        accomodations: value
      };
    }
    return $http({
      method: 'PUT',
      url: '/api/trips/modify2',
      data: tripData
    });
  };
  return {
    searchOverlay: searchOverlay,
    requestAttractions: requestAttractions,
    allTrips: allTrips,
    accessTrip: accessTrip,
    newTrip: newTrip,
    trips: trips,
    tripID: tripID,
    addPOI: addPOI,
    removeTrip: removeTrip,
    addTrigger: addTrigger
  };

})



/* Auth factory containing all user/authentication related requests to server
   responsible for authenticating user on signin, and returning tokens
   for authentication during site use while navigating site

   token is stored in localStorage as 'com.tp'
*/
.factory('Auth', function($http, $location, $window) {

  /* user sign in - returns token */
  var signin = function(user) {
    return $http({
        method: 'POST',
        url: '/api/users/signin',
        data: user
      })
      .then(function(resp) {
        return resp.data;
      });
  };

  /* user sign up - returns token */
  var signup = function(user) {
    return $http({
        method: 'POST',
        url: '/api/users/signup',
        data: user
      })
      .then(function(resp) {
        return resp.data;
      });
  };

  /* checks for token on each page */
  var isAuth = function() {
    return !!$window.localStorage.getItem('com.tp');
  };

  /* removes token */
  var signout = function() {
    $window.localStorage.removeItem('com.tp');
    $window.localStorage.removeItem('com.tp.user');
    $location.path('/logout');
  };

  /* changes user password */
  var changePassword = function(oldPass, newPass) {
    return $http({
        method: 'POST',
        url: '/api/users/change',
        data: {
          prev: oldPass,
          future: newPass
        }
      })
      .then(function(resp) {
        return resp.data;
      });
  };

  /* deletes user from database - called on user profile page */
  var removeUser = function() {
    return $http({
        method: 'GET',
        url: '/api/users/remove',
      })
      .then(function() {
        $window.localStorage.removeItem('com.tp');
        $window.localStorage.removeItem('com.tp.user');
        $location.path('/signup');
      });
  };

  var getUser = function() {
    return $http({
        method: 'GET',
        url: '/api/users/get',
      })
      .then(function(resp) {
        return resp.data;
      });
  };

  return {
    signin: signin,
    signup: signup,
    isAuth: isAuth,
    signout: signout,
    changePassword: changePassword,
    removeUser: removeUser,
    getUser: getUser
  };
});
