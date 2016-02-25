angular.module('app.my-trip', [])

.controller('my-tripController', function($scope, $location, Trips, $route, Auth) {

  //stores information about the current trip
  $scope.thisTrip = {};
  $scope.path = $location.path().substring(9);
  //reqests information about the current trip from the Trips factory
  $scope.getTrip = function() {
    Trips.accessTrip($scope.path)
      .then(function(data) {
        $scope.thisTrip = data;
      });

  };
  $scope.getTrip();

  //sends user edits to the Trips factory
  $scope.editTrip = function(poi_title, poi_detail) {
    Trips.addDetails($scope.path, poi_title, poi_detail)
      .then(function(data) {
        //reloads the page so you see the new sight you added
        //this should be changed to something more elegant
        $route.reload();
      });
  };

  $scope.signout = function() {
    Auth.signout();
  };

})
