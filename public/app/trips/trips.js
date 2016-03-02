angular.module('app.trips', [])

.controller('tripsController', function($scope, Trips, $routeParams, $route, Auth) {
  
  $scope.trips = {};
  $scope.map;
  $scope.destination;

  $scope.tripID = {
    id: $routeParams.id
  };

  /* retrieves all user trips from factory
     and binds to scope for list diplay on trips page
  */
  $scope.showTrips = function(user) {
    Trips.allTrips(user)
      .then(function(data) {
        $scope.trips = data;
      });
  };

  /* called when trip on list view is hovered over
     shows delete icon, which will delete the current trip (hovered trip)
  */
  $scope.hover = function(trip) {
    return trip.showDelete = ! trip.showDelete;
  };

  /*
    creates content for 
  */
  var createContent = function(info) {
    var string = '';
    if (info.POI.length > 0) {
      info.POI.forEach(function(point) {

        string += '<strong>' + (point.title ? point.title : '') + ':</strong> ' + (point.details.notes ? point.details.notes : point.details.address) + '<br>';
      });
    }
    return string;
  };

  /* creates google maps marker for passed in trip info

     more on google maps markers: https://developers.google.com/maps/documentation/javascript/markers
  */
  var createMarker = function(info) {
    $scope.destination = info.destination;
   
    var marker = new google.maps.Marker({
      map: $scope.map,
      position: info.coordinates,
      destination: info.destination,
      animation: google.maps.Animation.DROP,
    });

    var infowindow = new google.maps.InfoWindow({
      content: '<a href="#/my-trip/' + info._id + '">' + info.destination + '</a><br>' +
        createContent(info),
      disableAutoPan: true,
    });

    marker.addListener('mouseover', function() { // trip infowindow opens on corresponding map marker hover
      infowindow.open(marker.get('map'), marker);
    });

     marker.addListener('mouseout', function() { // infowindow closes
      infowindow.close();
    });

     marker.addListener('click', function() { // on trip marker click, goes to corresponding my-trip view
      window.location= '#/my-trip/' + info._id;
    });
  };

  /* renders all trip markers on map */
  $scope.showTripsOnMap = function(user) {
    console.log('hi')
    console.log()
    Trips.allTrips(user)
      .then(function(data) {
        $scope.trips = data;
        data.forEach(function(trip) {
          if (trip.coordinates) createMarker(trip);
        });
      });
  };

  /* run on page load so trip data is viewable on map */
  $scope.showTripsOnMap(Trips.user);

  /* 
    specifications for map created directly below
  */
  var mapOptions = {
    // start in USA
    center: new google.maps.LatLng(39.850033, -90.6500523),
    zoom: 4
  };

  /* creates map where trip markers are rendered 
     to specifications laid out in mapOptions above 
  */
  $scope.map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);

  /*
    finds and removes a trip  
  */
  $scope.removeTrip = function(trip) {
    Trips.removeTrip(trip)
      .then(function(data) {});
    $route.reload();
  };

  /* parses date value on trip in  user trips and filters by date, showing 
     trips with dates BEFORE the current date
     
     BUG NEEDS FIXING - trips created for past dates do not render in list view
     for january dates....
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
