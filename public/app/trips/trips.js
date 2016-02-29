angular.module('app.trips', [])

.controller('tripsController', function($scope, Trips, $routeParams, $route, Auth) {
  $scope.trips = {};

  $scope.map;
  //$scope.geocoder = new google.maps.Geocoder();
  $scope.destination;
  var coordinates = {};

  $scope.tripID = {
    id: $routeParams.id
  };

  $scope.showTrips = function(user) {
    Trips.allTrips(user)
      .then(function(data) {
        $scope.trips = data;
      });
  };

  $scope.hover = function(trip) {
    return trip.showDelete = ! trip.showDelete;
  };

  var createContent = function(info) {
    var string = '';
    if (info.POI.length > 0) {
      info.POI.forEach(function(point) {

        string += '<strong>' + (point.title ? point.title : '') + ':</strong> ' + (point.details ? point.details : '') + '<br>';
      });
    }
    return string;
  };

  var createMarker = function(info) {
    $scope.destination = info.destination;
    var marker = new google.maps.Marker({
      map: $scope.map,
      position: info.coordinates,
      destination: info.destination,
      animation: google.maps.Animation.DROP,
    });
    marker.addListener('dblclick', function() {
      var deleteCheck = confirm('are you sure you want to delete?');
      if (deleteCheck) {
        Trips.removeTrip(info);
        marker.setMap(null);
        $scope.showTrips();
      }

    });

    var infowindow = new google.maps.InfoWindow({
      content: '<a href="#/my-trip/' + info._id + '">' + info.destination + '</a><br>' +
        createContent(info),
      disableAutoPan: true,
    });
    marker.addListener('mouseover', function() {
      infowindow.open(marker.get('map'), marker);
    });
     marker.addListener('mouseout', function() {
      infowindow.close();
    });
     marker.addListener('click', function() {
      window.location= '#/my-trip/' + info._id;
    });
  };

  $scope.showTripsOnMap = function(user) {
    console.log('hi')
    Trips.allTrips(user)
      .then(function(data) {
        $scope.trips = data;
        data.forEach(function(trip) {
          if (trip.coordinates) createMarker(trip);
        });
      });
  };

  $scope.showTripsOnMap(Trips.user);

  /* 
    specifications for map created directly below
  */
  var mapOptions = {
    center: new google.maps.LatLng(37.09024, -95.712891),  // defaults map view in USA
    zoom: 5
  };

  /* creates map where trip markers are rendered 
     to specifications laid out in mapOptions above 
  */
  $scope.map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);

  /*
    finds and removes a trip  
  */
  $scope.removeTrip = function(trip) { /
    Trips.removeTrip(trip)
      .then(function(data) {});
    $route.reload();
  };

  /* parses date value on trip in  user trips and filters by date, showing 
     trips with dates BEFORE the current date
  */
  $scope.previousTrips = function(tripDate) {
    var tripsDate = new Date(tripDate);
    var day = tripsDate.getDate();
    var month = tripsDate.getMonth();
    var year = tripsDate.getFullYear();
    var tripsDate = Date.parse(month + "/" + day + "/" + year);

    var today = new Date();
    var tday = today.getDate();
    var tmonth = today.getMonth();
    var tyear = today.getFullYear();
    var todaysDate = Date.parse(tmonth + "/" + tday + "/" + tyear);

    if (todaysDate > tripsDate) {
      return tripsDate;
    }
  };

  /* parses date value on trip in  user trips and filters by date, showing 
     trips with dates AFTER the current date
  */
  $scope.upcomingTrips = function(tripDate) {
    if (tripDate === undefined) {
      tripDate = new Date();
    }
    var tripsDate = new Date(tripDate);
    var day = tripsDate.getDate();
    var month = tripsDate.getMonth();
    var year = tripsDate.getFullYear();
    var tripsDate = Date.parse(month + "/" + day + "/" + year);

    var today = new Date();
    var tday = today.getDate();
    var tmonth = today.getMonth();
    var tyear = today.getFullYear();
    var todaysDate = Date.parse(tmonth + "/" + tday + "/" + tyear);

    if (todaysDate <= tripsDate) {
      return tripsDate;
    }
  };

    /* called from logout button in menu bar for auth pages */
  $scope.signout = function() {
    Auth.signout();
  };

})
