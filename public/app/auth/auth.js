angular.module('app.auth', [])

/* controller in charge of login, logout and sign-up pages,
  also contains logic for profile page - migrate maybe?
*/
.controller('AuthController', function($scope, $window, $location, Auth) {
  $scope.loggedin = {}; // used to store user's email address for profile page

  /* user sign-in for exisiting users
     routes to trips page upon verification
  */
  $scope.signin = function() {
    Auth.signin($scope.user)
      .then(function(data) {
        if (data.token) {
          $window.localStorage.setItem('com.tp', data.token); // set token
          $window.localStorage.setItem('com.tp.user', data.id);
          $location.path('/trips');
        } else {
          Materialize.toast(data, 5000, 'rounded');
          //alert('username or password incorrect.'); // we'll want to handle this better
        }
      })
      .catch(function(error) {
        console.error(error);
      });
  };

  /* user sign-up for first time users
     sets jwt and re-routes to new trip page to create first trip
  */
  $scope.signup = function() {
    Auth.signup($scope.user)
      .then(function(data) {
        $window.localStorage.setItem('com.tp', data.token); // set token
        $window.localStorage.setItem('com.tp.user', data.id);
        $location.path('/new-trip');
      })
      .catch(function(error) {
        console.error('catch error', error);
      });
  };

  /* used to retrieve user from database for user profile page */
  $scope.getUser = function() {
    Auth.getUser()
      .then(function(data) {
        $scope.loggedin = data;
      });
  };

  /* called from logout button in menu bar (sitewide) */
  $scope.signout = function() {
    Auth.signout();
  };

  $scope.changePassword = function(oldPass, newPass) {
    Auth.changePassword(oldPass, newPass)
      .then(function(data) {
        if (data == 'Nope') {
          Materialize.toast('Incorrect password. Try again.', 5000, 'rounded');
        } else {
          Materialize.toast('Password changed! Time to get a new sticky note.', 5000, 'rounded');
        }
      })
      .catch(function(error) {
        console.error('catch error', error);
      });
  };

  /* delete account available on profile page - migrate to profile */
  $scope.removeUser = function() {
    Auth.removeUser()
  }

  if ($window.localStorage.getItem('com.tp.user')) {
    $scope.getUser();
  }
});
