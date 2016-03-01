angular.module('app.new-trip', [])

.controller('new-tripController', function ($scope, $location, $window, Trips, Auth) {
  
  /* disables submit on pressing enter button 
     (must click submit button) 
  */
  $(document).ready(function () {
    $('#locationForm').keypress(function (event) {
      if (event.keyCode === 13 ) {
        console.log('preventing');
        event.preventDefault();
      }
    });
  });

  /* 
    specifications for map created directly below
  */
  var mapOptions = {
    // start in USA
    center: new google.maps.LatLng(39.850033, -90.6500523),
    zoom: 5
  };

  /* creates google maps marker for destination data
     called when destination information is changed, either by dropped pin
     or changed address in text input bar

     more on google maps markers: https://developers.google.com/maps/documentation/javascript/markers
     REFACTOR: used for POI display?
  */
  var createMarker = function (info) {
    if ($scope.marker) { $scope.marker.setMap(null); } // if a marker has already been set, removes from map before creating new
    $scope.destination = info.destination;

    $scope.map;

  //var coordinates = {}; // where is this used?

    var marker = new google.maps.Marker({
      map: $scope.map,
      position: info.coordinates,
      destination: info.destination,
      animation: google.maps.Animation.DROP,
    });

    $scope.marker = marker; // sets marker on scope, so we have access to info and can remove

    $scope.map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);
    $scope.destination;
    $scope.marker = null;

    /* adds info window on marker which displays location informition
       opens when marker is clicked 
    */
    $scope.marker.infowindow = new google.maps.InfoWindow({
      content: info.destination
    });
    marker.addListener('click', function() {
      $scope.marker.infowindow.setContent(info.destination);
      $scope.marker.infowindow.open(marker.get('map'), marker);
    });

    document.getElementById("destination").value = info.destination; //uses jQuery to set the value of the destination in the box
    $('#destination').scope().$apply(); // applies for live-update (angular-materialize bug-fix)

  };

  var input = (document.getElementById('destination'));
  var autocomplete = new google.maps.places.Autocomplete(input); // creates 
  autocomplete.bindTo('bounds', $scope.map);

  
  // var marker = new google.maps.Marker({
  //   map: $scope.map,
  //   anchorPoint: new google.maps.Point(0, -29)
  // });


  /* map listens for a change in input box ($scope.destination), renders 
     makes call to create marker
     retrieves location information from google based on dropped pin
  */
  autocomplete.addListener('place_changed', function() {

    if ($scope.marker) { 
      $scope.marker.infowindow.close();
      $scope.marker.setMap(null); 
    }
    marker.setVisible(false);

    var place = autocomplete.getPlace();

    if (!place.geometry) {
      Materialize.toast("Autocomplete's returned place contains no geometry" + $scope.thisTrip.destination, 5000, 'rounded');
      return;
    }
    
    if (place.geometry.viewport) { // If the place has a geometry, then present it on a map.
      $scope.map.fitBounds(place.geometry.viewport);
    } else {
      $scope.map.setCenter(place.geometry.location); // sets map center to autocompleted place coordinates
      $scope.map.setZoom(17);  // zooms map. Why 17? Because it looks good.
    }

    /* standardized formatting for location information to pass into createMarker */
    var info = {
      _id: null,
      coordinates: {},
      destination: null,
      googledata: null,
      googleplace: place, // google location info is returned in two different formats based on request, we stored autocomplete data on googleplace
      POI: [],
    };

    info.coordinates.lat = place.geometry.location.lat();
    info.coordinates.lng = place.geometry.location.lng();
    info.destination = place.formatted_address;
    createMarker(info);
    $scope.info = info;
    $scope.destinaiton = info.destination;    
  });

  /* map listens for a click and renders a marker and returns corresponding address 
     retrieves location information from google based on dropped pin
  */
  $scope.map.addListener('click', function(e) {

    /* standardized formatting for location information to pass into createMarker */
    var info = {
      _id: null,
      coordinates: null,
      destination: null,
      googledata: null, // google location info is returned in two different formats based on request, we stored dropped pin data on googledata
      googleplace: null,
      POI: [],
    };

    /* retrieves location information from google via get request based on dropped pin */
    $.get("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + e.latLng.lat() + "," + e.latLng.lng() + "&key=AIzaSyCXPMP0KsMOdfwehnmOUwu-W3VOK92CkwI", function(data) {
      if (data.status === 'ZERO_RESULTS'){ // if google cannot return a location......................
        Materialize.toast("Please click on land!" + $scope.thisTrip.destination, 5000, 'rounded'); // displays alert to user
      } else {
        info.coordinates = data.results[0].geometry.location;
        info.destination = data.results[1].formatted_address;
        info.googledata = data; // 
        createMarker(info);
        $scope.info = info;
        $scope.destination = info.destination;
        $('#destination').scope().$apply();
        // search nearby, will need to recall when question changes
        userCoordinates = new google.maps.LatLng(info.coordinates.lat, info.coordinates.lng);

      }
    });
  });
  
  /*
     creates a new trip with the last location input by user
     redirects to newly created trip (my-trip view)
  */
  $scope.createTrip = function() {
    Trips.newTrip($scope.info.destination, $scope.startDate, $scope.info.coordinates)
      .then(function(tripID) {
        $location.path('/my-trip/' + tripID);
      });
  };

  /* called when submit button is pressed
     creates a new trip with the last location input by user (dropped pin or location autocomplete search)
     if cannot create trip (factory returns error), redirects to trips view
  */
  $scope.submitForm = function () {
    Trips.newTrip($scope.info.destination, $scope.startDate, $scope.info.coordinates, function(id) {
      console.log(id);
      $scope.info._id = id;
    });
    $location.path('/trips/' + $scope.info._id);
  };

  /* called from logout button in menu bar for auth pages */
  $scope.signout = function () {
    Auth.signout();
  };

});