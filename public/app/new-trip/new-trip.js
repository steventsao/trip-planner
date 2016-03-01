angular.module('app.new-trip', [])

.controller('new-tripController', function ($scope, $location, $window, Trips, Auth) {
  
  /* disables submit on pressing enter button (must click submit button) */
  $(document).ready(function () {
    $('#locationForm').keypress(function (event) {
      if (event.keyCode === 13 ) {
        console.log('preventing');
        event.preventDefault();
      }
    });
  });

  $scope.signout = function() {
    Auth.signout();
  };

  var mapOptions = {
    // start in USA
    center: new google.maps.LatLng(37.09024, -95.712891),
    zoom: 5
  };

  $scope.map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);
  $scope.geocoder = new google.maps.Geocoder();
  $scope.destination;
  $scope.marker = null;
  
  var createMarker = function (info) {
    if ($scope.marker) { $scope.marker.setMap(null); } // if a marker has already been set, removes from map before creating new
    $scope.destination = info.destination;

    $scope.map;
    $scope.geocoder = new google.maps.Geocoder(); // where is this used?

  var coordinates = {}; // where is this used?

    var marker = new google.maps.Marker({
      map: $scope.map,
      position: info.coordinates,
      destination: info.destination,
      animation: google.maps.Animation.DROP,
    });

    $scope.marker = marker; // sets marker on scope, so we have access to info and can remove

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

    //uses jQuerey to set the value of the destination in the box
    document.getElementById("destination").value = info.destination;
    $('#destination').scope().$apply();

  };


  var displayMarkersFromYelp = function (array) {
      var coordinates;
      // TODO: pass in pure arrays
      // array.data.businesses.forEach(function(point) {
      array.forEach(function(point) {
      coordinates = {
        lat: point.location.coordinate.latitude,
        lng: point.location.coordinate.longitude,
      };
      var marker = new google.maps.Marker({
        map: $scope.map,
        position: coordinates,
        animation: google.maps.Animation.DROP,
      });

      $scope.map.panTo(coordinates);

      assignInfoWindow(marker, point.name);
      $scope.currentMarkerData.push(point);
      $scope.currentMarkers.push(marker);
      })
      // console.log('current markers: ', $scope.currentMarkers)
  }

  var input = (document.getElementById('destination'));
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', $scope.map);

  
  var marker = new google.maps.Marker({
    map: $scope.map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  autocomplete.addListener('place_changed', function() {

    if ($scope.marker) { 
      $scope.marker.infowindow.close();
      $scope.marker.setMap(null); 
    }
    marker.setVisible(false);

    var place = autocomplete.getPlace();

    userCoordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
    };

    if (!place.geometry) {
      Materialize.toast("Autocomplete's returned place contains no geometry" + $scope.thisTrip.destination, 5000, 'rounded');
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      $scope.map.fitBounds(place.geometry.viewport);
    } else {
      $scope.map.setCenter(place.geometry.location);
      $scope.map.setZoom(17);  // Why 17? Because it looks good.
    }

    var info = {
      _id: null,
      coordinates: {},
      destination: null,
      googledata: null,
      googleplace: place,
      POI: [],
    };

    info.coordinates.lat = place.geometry.location.lat();
    info.coordinates.lng = place.geometry.location.lng();
    info.destination = place.formatted_address;
    createMarker(info);
    $scope.info = info;
    $scope.destinaiton = info.destination;    
  });

  var clearMarkers = function () {
    $scope.currentMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
  };

  // listens for a click and renders a marker and returns corresponding address
  $scope.map.addListener('click', function(e) {
    var info = {
      _id: null,
      coordinates: null,
      destination: null,
      googledata: null,
      googleplace: null,
      POI: [],
    };

    var service;

    $.get("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + e.latLng.lat() + "," + e.latLng.lng() + "&key=AIzaSyCXPMP0KsMOdfwehnmOUwu-W3VOK92CkwI", function(data) {
      if (data.status === 'ZERO_RESULTS'){
        Materialize.toast("Please click on land!" + $scope.thisTrip.destination, 5000, 'rounded');
      } else {
        info.coordinates = data.results[0].geometry.location;
        info.destination = data.results[1].formatted_address;
        info.googledata = data;
        createMarker(info);
        $scope.info = info;
        $scope.destination = info.destination;
        $('#destination').scope().$apply();
        // search nearby, will need to recall when question changes
        userCoordinates = new google.maps.LatLng(info.coordinates.lat, info.coordinates.lng);

      }
    });
  });
  
  
  $scope.createTrip = function() {
    var selectedPOI = [];
    Trips.newTrip($scope.info.destination, $scope.startDate, $scope.info.coordinates)
      .then(function(tripID) {
        $location.path('/my-trip/' + tripID);
      });
  };

  $scope.selectPOI = function (POI) {
    console.log('selecting ' + POI);
  };

  $scope.submitForm = function () {
    Trips.newTrip($scope.info.destination, $scope.startDate, $scope.info.coordinates, function(id) {
      console.log(id);
      $scope.info._id = id;
    });
    //$scope.geocodeAddress();
    $location.path('/trips/' + $scope.info._id);
  };

  /* called from logout button in menu bar for auth pages */
  $scope.signout = function () {
    Auth.signout();
  };

});