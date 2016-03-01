angular.module('app.my-trip', [])

.controller('my-tripController', function($scope, $location, $window, Trips, $route, Auth) {
 
  $scope.thisTrip = {}; //stores information about the current trip, to display on page??
  $scope.path = $location.path().substring(9); // gets trip id from 
  $scope.geocoder = new google.maps.Geocoder();
  $scope.destination;
  $scope.marker = null;
  // map markers
  $scope.currentMarkers = [];
  // marker data from Yelp
  $scope.currentMarkerData = [];
  $scope.buttonTitle = 'hotel';
  $scope.nextQuestion;
  $scope.addedPOIS;
  /* reqests information about the current trip from the Trips factory */
  // $scope.questions = questionBank['hotel'].question;
  var tripData = {
    hotelID: null,
    restaurants: [],
    transportation: null, 
  }


  // var displayQuestion = function(type) {
  //   $scope.questions = questionBank[type].question;
  //   $('#questionsID').scope().$apply()
  // }

  // var userCoordinates;
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

    var infowindow = new google.maps.InfoWindow({
      content: '<a href="#/my-trip/' + info._id + '">' + info.destination + '</a><br>' +
        createContent(info),
    });

    marker.addListener('click', function() {
      infowindow.open(marker.get('map'), marker);
          console.log(info);
    });

    $scope.map.setCenter(info.coordinates);
    $scope.map.setZoom(7);  // Why 17? Because it looks good.

  };

  var mapOptions = {
    // start in USA
    center: new google.maps.LatLng(37.09024, -95.712891),
    zoom: 5
  };

  $scope.next = function() {
    clearMarkers();
  $scope.nextQuestion = Object.keys(questionBank)[Object.keys(questionBank).indexOf($scope.buttonTitle)+1];

    searchNearby({
      location: $scope.thisTrip.coordinates,
      radius: '5000',
      types: [$scope.nextQuestion],
      buttonTitle: $scope.nextQuestion
    });
  };

  $scope.openTab = function(url) {
    console.log('url', url)
    window.open(url, '_blank');
  };

  // create map
  $scope.map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);

  $scope.getTrip = function () {
    Trips.accessTrip($scope.path)
      .then(function (data) {
        if (data === "") $location.path('/trips');;
        $scope.thisTrip = data;
        if (data.coordinates) createMarker(data);
      });
  };

    /* run on my-trip page load */
  $scope.getTrip();


  var infowindow = new google.maps.InfoWindow();

  var assignInfoWindow = function(marker, contentStr) {
    google.maps.event.addListener(marker, 'mouseover', function() {
      infowindow.setContent(contentStr);
      infowindow.open($scope.map, marker);
    });
    google.maps.event.addListener(marker, 'mouseout', function() {
      infowindow.close();
    });
  };

  $scope.syncInfoWindow = function(marker) {
    console.log($scope.currentMarkerData);
    var syncMarker = $scope.currentMarkers[$scope.currentMarkerData.indexOf(marker)];
    infowindow.setContent(marker.name);
    infowindow.open($scope.map, syncMarker);
  };

  $scope.leaveInfoWindow = function(marker) {
    var syncMarker = $scope.currentMarkers[$scope.currentMarkerData.indexOf(marker)];
    infowindow.close()
  };

  $scope.setBounce = function(marker) {
    var syncMarker = $scope.currentMarkers[$scope.currentMarkerData.indexOf(marker)];
    if (!marker.selected) {
      syncMarker.setAnimation(null);
    } else {
      syncMarker.setAnimation(google.maps.Animation.BOUNCE);
    }
  };

  $scope.selectMarker = function(marker){
    console.log($scope.thisTrip);
    $scope.setBounce(marker);
  };

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

  var displayMarkersFromYelp = function (array) {
    clearMarkers();
      var coordinates;
      // TODO: pass in pure arrays
      // array.data.businesses.forEach(function(point) {
      var pinColor = "FFFFFF";
      var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor);

      array.forEach(function(point) {
        coordinates = {
          lat: point.location.coordinate.latitude,
          lng: point.location.coordinate.longitude,
        };
        var marker = new google.maps.Marker({
          map: $scope.map,
          position: coordinates,
          animation: google.maps.Animation.DROP,
          icon: pinImage,
        });

        $scope.map.panTo(coordinates);

        assignInfoWindow(marker, point.name);
        $scope.currentMarkerData.push(point);
        $scope.currentMarkers.push(marker);
      });
      // console.log('current markers: ', $scope.currentMarkers)
  };

  var clearMarkers = function () {
    $scope.currentMarkers.forEach(function (marker) {
      if (!marker.animating) marker.setMap(null);
    });
  };

  var searchNearby = function (request) {
    clearMarkers();

    var service = new google.maps.places.PlacesService($scope.map);
    service.nearbySearch(request, function (results) {
      // console.log(results);
      results.forEach(function (point) {
        // console.log(point);
        var marker = new google.maps.Marker({
          map: $scope.map,
          position: point.geometry.location,
          icon: {
            url: point.icon,
            scaledSize: new google.maps.Size(25,25)
          },
          animation: google.maps.Animation.DROP,
          place_id: point.place_id,
        });
        $scope.currentMarkerData.push({
          // image_url: point.photos[0].getUrl(),
          name: point.name,
          selected: false,
          image_url: null,
          url: null,
          location: {
            address: null,
          }
        });
        $('#poiList').scope().$apply();
        

        // console.log($scope.currentMarkerData);
        
        $scope.currentMarkers.push(marker);
        var contentStr = point.name + 
            '<br><button id='+point.place_id+
            '>Select ' + request.buttonTitle + '</button>';

        assignInfoWindow(marker, contentStr);

        google.maps.event.addListener(infowindow, 'domready', function () {
          $('#' + point.place_id).click(function () {
            $scope.buttonTitle = request.buttonTitle;
            
            questionBank[$scope.buttonTitle].answer = point;
            displayQuestion($scope.nextQuestion);

            if ($scope.nextQuestion !== 'hasBeenCalled') {
              $scope.showQuestion = false;

              searchNearby({
                location: $scope.thisTrip.coordinates,
                radius: '5000',
                types: [$scope.nextQuestion],
                buttonTitle: $scope.nextQuestion
              });
            } else {
              console.log('there are no more questions');
              clearMarkers();
            }
          });
        });

        $scope.map.setZoom(12);
        $scope.map.panTo(request.location)
      });
    });
  };

    // Enables drawing on map
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

  $scope.getAttractions = function (userInput) {
    clearMarkers();
    Trips.requestAttractions($scope.thisTrip.destination, userInput)

    .then(function (results) {
      if (!results.data.businesses.length){
        Materialize.toast('no results for '+ userInput +' found around ' + $scope.thisTrip.destination, 5000, 'rounded');
      }
      $scope.currentMarkerData = [];
      displayMarkersFromYelp(results.data.businesses);
    })
    .catch(function(err){
      console.error(err);
    });

  };  

  // $scope.quickAdd = function () {
  //   $scope.showQuestion = true;
  //   if (!questionBank.hasBeenCalled) {
  //     searchNearby({
  //       location: $scope.thisTrip.coordinates,
  //       radius: '5000',
  //       types: ['lodging'],
  //       buttonTitle: 'hotel',
  //     });
  //     questionBank.hasBeenCalled = true;
  //   }
  // };



  google.maps.event.addListener(drawingManager, 'polylinecomplete', function(event) {
    console.log(event);
    // get 10 requests per line
    console.log(event.getPath().getArray().toString());
    var fromPoint = [event.getPath().getArray()[0].lat(), event.getPath().getArray()[0].lng()];
    var toPoint = [event.getPath().getArray()[1].lat(), event.getPath().getArray()[1].lng()]
    var latIncrement = (toPoint[0] - fromPoint[0]) / 10;
    var lngIncrement = (toPoint[1] - fromPoint[1]) / 10;
    // generate ten points in this line
    var tenPoints = [];
    var count = 1;
    var yelpResults = [];
    while (count < 10) {
      tenPoints.push([fromPoint[0] + latIncrement * count, fromPoint[1] + lngIncrement * count])
      count++;
    }
    Trips.searchOverlay(tenPoints)
    .then(function(results) {
      console.log(results);
      results.data.forEach(function(obj) {
        yelpResults.push(obj.businesses[0]);
      });
      displayMarkersFromYelp(yelpResults);
    })
    .catch(function(err) {
      console.error(err);
    });
  });

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
      console.log(results);
      displayMarkersFromYelp(results.data.businesses);
    })
    .catch(function(err){
      console.error(err);
    });
  });
  
  drawingManager.setMap($scope.map);

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
        $route.reload(); //reloads the page so you see the new sight you added
      });
  };

  /* called from logout button in menu bar for auth pages */
  $scope.signout = function () {
    Auth.signout();
  };

  $scope.editedSights = null;

  $scope.newSights = function (){ 
    $scope.Sights.push({name:"new record"});
  };

  $scope.startEditing = function (Sights){
    console.log('start editing');
    Sights.editing=true;
    $scope.editedSights = Sights.details.notes;
    console.log(Sights, $scope.editedSights);
  };
      
  $scope.doneEditing = function (Sights){
    
    Sights.editing=false;
    $scope.editedSights = null;
  };

});
