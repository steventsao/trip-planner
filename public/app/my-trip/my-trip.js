angular.module('app.my-trip', [])

.controller('my-tripController', function($scope, $location, $window, Trips, $route, Auth) {
 
  $scope.thisTrip = {}; //stores information about the current trip, to display on page??
  $scope.path = $location.path().substring(9); // gets trip id from 
  //$scope.geocoder = new google.maps.Geocoder();  // REFACTOR: when used?
  $scope.destination; // REFACTOR: when used?
  $scope.marker = null; // REFACTOR: when used?
  $scope.currentMarkers = []; // map markers
  $scope.currentMarkerData = []; // marker data from Yelp
  $scope.addedPOIS;  // POI = POINTS OF INTEREST
  $scope.editedSights = null;

  /* REFACTOR: used? */
  var tripData = {
    hotelID: null,
    restaurants: [],
    transportation: null, 
  }

  /* creates content to render in opened infowindow
     called in createMarker
  */
  var createContent = function(info) {
    var string = '';
    if (info.POI.length > 0) {
      info.POI.forEach(function(point) {

        string += '<strong>' + (point.title ? point.title : '') + ':</strong> ' + (point.details ? point.details : '') + '<br>';
      });
    }
    return string;
  };

  /* creates google maps marker for passed in trip info

     more on google maps markers: https://developers.google.com/maps/documentation/javascript/markers
     REFACTOR: used for POI display?
  */
  var createMarker = function(info) {
    $scope.destination = info.destination;
    var marker = new google.maps.Marker({
      map: $scope.map,
      position: info.coordinates,
      destination: info.destination,
      animation: google.maps.Animation.DROP,
    });

    /* REFACTOR: creates info window with clickable link */
    var infowindow = new google.maps.InfoWindow({
      content: '<a href="#/my-trip/' + info._id + '">' + info.destination + '</a><br>' +
        createContent(info),
    });

    marker.addListener('click', function() { // REFACTOR: is this used anymore???
      infowindow.open(marker.get('map'), marker);
    });

    $scope.map.setCenter(info.coordinates); // sets map center to trip coordinates
    $scope.map.setZoom(7);  // Why 7? Because it looks good.

  };


  /* triggers a bounce animation on a marker if it is selected
     alled from selectMarker whenever a map marker is clicked or list item is selected on
     my-trip page.
  */
  $scope.setBounce = function(marker) {
    var syncMarker = $scope.currentMarkers[$scope.currentMarkerData.indexOf(marker)];
    if (!marker.selected) {
      syncMarker.setAnimation(null);
    } else {
      syncMarker.setAnimation(google.maps.Animation.BOUNCE);
    }
  };

  /* called when a POI marker is selected on map
     calls setBounce on marker
  */
  $scope.selectMarker = function(marker){
    console.log($scope.thisTrip);
    $scope.setBounce(marker);
  };

  /* 
    specifications for map created directly below
  */
  var mapOptions = {
    // start in USA
    center: new google.maps.LatLng(37.09024, -95.712891), // defaults map view to midwestern-USA
    zoom: 5
  };

  /* creates map where trip markers are rendered 
     to specifications laid out in mapOptions above 
  */
  $scope.map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);

  /*  */
  $scope.getTrip = function () {
    Trips.accessTrip($scope.path)
      .then(function (data) {
        if (data === "") $location.path('/trips');;
        $scope.thisTrip = data;
        if (data.coordinates) createMarker(data);
      });
  };

  /* run on my-trip page load so trip data is loaded and accessible for viewing */
  $scope.getTrip();


  /* REFACTOR? creates single google map InfoWindow instance
     used for all infowindow instances, preventing multiple infowindows

     more on infowindows: https://developers.google.com/maps/documentation/javascript/infowindows
  */
  var infowindow = new google.maps.InfoWindow();

  /* REFACTOR?: 
     assigns infowindow information to current POI marker (sets content)
     based on mouse hover and opens window
  */
  var assignInfoWindow = function(marker, contentStr) {
    google.maps.event.addListener(marker, 'mouseover', function() {
      infowindow.setContent(contentStr);
      infowindow.open($scope.map, marker);
    });
    google.maps.event.addListener(marker, 'mouseout', function() {
      infowindow.close();
    });
  };

  /* REFACTOR?: 
     syncs infowindow information to current POI marker (sets content)
     and opens window
  */
  $scope.syncInfoWindow = function(marker) {
    var syncMarker = $scope.currentMarkers[$scope.currentMarkerData.indexOf(marker)];
    infowindow.setContent(marker.name);
    infowindow.open($scope.map, syncMarker);
  };

  /* REFACTOR?: closes info window for google map marker when mouse is no longer hovered over
     used for POIS 
  */
  $scope.leaveInfoWindow = function(marker) {
    var syncMarker = $scope.currentMarkers[$scope.currentMarkerData.indexOf(marker)];
    infowindow.close()
  };



  /* saves all checked POIs to database 
     called when save changes button is pressed (my-trip.html)
  */
  $scope.savePage = function () {
    $scope.currentMarkerData.forEach(function(poi, i){
      if (poi.selected) {
        console.log(poi)
        Trips.addPOI($scope.thisTrip._id, poi.name,{
          imgUrl: poi.image_url,
          yelpUrl: poi.url,
          address: poi.location.address,
          notes: '',
        });
        poi.selected = false;
      }
    });
    $route.reload();
  };

  /*  */
  $scope.openTab = function(url) {
    console.log('url', url)
    window.open(url, '_blank');
  };

  /* displays markers on data retrieved from yelp
     called after each search submission that returns a
     non-empty businesses array in the resp obj    
  */
  var displayMarkersFromYelp = function (array) {
     clearMarkers(); // REFACTOR: repeated in getAttractions - clears markers from previous searches from map before displaying
      var coordinates;
      // REFACTOR: pass in pure arrays
      var pinColor = "FFFFFF";
      var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor);

      array.forEach(function(point) {
        coordinates = {
          lat: point.location.coordinate.latitude,
          lng: point.location.coordinate.longitude,
        };

        /* creates google maps marker for each POI retrieved from yelp */
        var marker = new google.maps.Marker({
          map: $scope.map,
          position: coordinates,
          animation: google.maps.Animation.DROP,
          icon: pinImage,
        });

        $scope.map.panTo(coordinates); 
        assignInfoWindow(marker, point.name); // assigns info window to each marker
        $scope.currentMarkerData.push(point);
        $scope.currentMarkers.push(marker); // REFACTOR
      });
  };

  /* clears all POI markers from map
     called when page is saved or new search submitted
  */
  var clearMarkers = function () {
    $scope.currentMarkers.forEach(function (marker) {
      if (!marker.animating) marker.setMap(null);
    });
  };

  /* 
     retrieves nearby businesses/attractions based on user input (userSearchInput in my-trip.html)
     displays markers on map based on GPS coordinates
     business results queried from yelp api, using yelp module
  */
  $scope.getAttractions = function (userInput) {
    clearMarkers(); // REFACTOR: repeated in displayMarkersFromYelp - clears markers from previous searches from map before each search
    Trips.requestAttractions($scope.thisTrip.destination, userInput)

    .then(function (results) {
      if (!results.data.businesses.length){ // if yelp returns no results, a materialize toast will display alert to user
        Materialize.toast('no results for '+ userInput +' found around ' + $scope.thisTrip.destination, 5000, 'rounded');
      }
      $scope.currentMarkerData = [];
      displayMarkersFromYelp(results.data.businesses);
    })
    .catch(function(err){
      console.error(err);
    });

  };  

  /* google drawing manager used on map to filter search by custom drawn borders (rectangle)
     or 'route' (straight line), see google map event listeners below for 'polylinecomplete' 
     and 'rectanglecomplete'

    more info: https://developers.google.com/maps/documentation/javascript/drawinglayer
  */
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.RECTANGLE,
        google.maps.drawing.OverlayType.POLYLINE,
      ]
    },
    markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
  });

  /* allows user to filter search results by selected area on map
     uses google drawing manager defined above to draw line
     displays results pulled from yelp along drawn line
  */
  google.maps.event.addListener(drawingManager, 'polylinecomplete', function(event) {
    
    var fromPoint = [event.getPath().getArray()[0].lat(), event.getPath().getArray()[0].lng()]; 
    var toPoint = [event.getPath().getArray()[1].lat(), event.getPath().getArray()[1].lng()]
    var latIncrement = (toPoint[0] - fromPoint[0]) / 10; // sets increment
    var lngIncrement = (toPoint[1] - fromPoint[1]) / 10; 
    var tenPoints = []; // generate ten points in this line
    var count = 1;
    var yelpResults = [];
    while (count < 10) {
      tenPoints.push([fromPoint[0] + latIncrement * count, fromPoint[1] + lngIncrement * count])
      count++;
    }
    Trips.searchOverlay(tenPoints) 
    .then(function(results) {
      if (!results.data.businesses.length){ // if yelp returns no results, a materialize toast will display alert to user
        Materialize.toast('no results found for this selection', 5000, 'rounded');
      }
      results.data.forEach(function(obj) {
        yelpResults.push(obj.businesses[0]);
      });
      displayMarkersFromYelp(yelpResults);
    })
    .catch(function(err) {
      console.error(err);
    });
  });

  /* allows user to filter search results by selected area on map
     uses google drawing manager defined above to draw rectangle shape
     displays results pulled from yelp
  */
  google.maps.event.addListener(drawingManager, 'rectanglecomplete', function(event) {
    var rectCoordinates = event.getBounds()
      .toString()
      .replace(/[()]/g, '')
      .split(',')
      .map(function(val){
        return Number(val)
      });
    Trips.searchOverlay(rectCoordinates)
    .then(function(results) {
      if (!results.data.businesses.length){ // if yelp returns no results, a materialize toast will display alert to user
        Materialize.toast('no results found for this selection', 5000, 'rounded');
      }
      displayMarkersFromYelp(results.data.businesses);
    })
    .catch(function(err){
      console.error(err);
    });
  });
  
  drawingManager.setMap($scope.map); // sets google drawing manager map to my-trip map

  /* REFACTOR console logs that a POI is being selected - used for debugging purposes */
  $scope.selectPOI = function (POI) {
    console.log('selecting ' + POI);
  };


  /* 
    reloads the page so you see the new sight you added
    REFACTOR: reload implementation should be changed to something more elegant?
  */
  $scope.addPOI = function (poi_title, poi_detail) {
    Trips.addPOI($scope.path, poi_title, poi_detail)
      .then(function (data) {
        $route.reload();
      });
  };

  /* 
    reloads page so you can see box you checked (?)
    REFACTOR: reload implementation should be changed to something more elegant?
  */
  $scope.triggerCheck = function (string, value) {
    Trips.addTrigger($scope.path, string, value)
      .then(function (data) {
        //$route.reload(); //reloads the page so you see the new sight you added
      });
  };

  /* called from logout button in menu bar for auth pages */
  $scope.signout = function () {
    Auth.signout();
  };

  /* REFACTOR pushes to Sights array */
  $scope.newSights = function (){ 
    $scope.Sights.push({name:"new record"});
  };

  /* REFACTOR sets sights editing to true when they have been edited */
  $scope.startEditing = function (Sights){
    console.log('start editing');
    Sights.editing=true;
    $scope.editedSights = Sights.details.notes;
    console.log(Sights, $scope.editedSights);
  };
  
  /* REFACTOR sets sights editing to false when editing is complete */
  $scope.doneEditing = function (Sights){
    Sights.editing=false;
    $scope.editedSights = null;
  };

});
