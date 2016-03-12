app.controller('loginController', ['$scope', '$location', 'AuthService', 'ActivityService', 'PlanService', function ($scope, $location, AuthService, ActivityService, PlanService) {

    $scope.login = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      authservice.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function (data) {
          $scope.disabled = false;
          $scope.loginForm = {};
          var savedActivity = activityservice.getSavedActivity();
          activityservice.saveClickedActivity(undefined) // dispose of clicked activity
          var user = authservice.getUserStatus();

          if (savedActivity) {
            planservice.addToPlan(user, savedActivity._id).then(function(){ // add saved activity to plan
              savedActivity = undefined // dispose of saved activity
              $location.path('/')
            })
          } else {
            $location.path('/')
          }
        })

        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "Invalid email and/or password";
          $scope.disabled = false;
          $scope.loginForm = {};
        });
    };
}]);

app.controller('registerController',
  ['$scope', '$location', 'AuthService', 'ActivityService',
  function ($scope, $location, AuthService, ActivityService) {

    $scope.register = function () {

      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call register from service
      authservice.register($scope.registerForm)
        // handle success
        .then(function () {
          $scope.disabled = false;
          var user = authservice.getUserStatus();
          console.log('in register controller, this is registered user id: ', user);
          $scope.registerForm = {};
          var savedActivity = activityservice.getSavedActivity();
          activityservice.saveClickedActivity(undefined) // dispose of clicked activity

          if (savedActivity) {
            planservice.addToPlan(user, savedActivity._id).then(function(){ // add saved activity to plan
              savedActivity = undefined // dispose of saved activity
              $location.path('/')
            })
          } else {
          $location.path('/');
          }
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "User already registered, please login!";
          $scope.disabled = false;
          $scope.registerForm = {};
        });

    };

}]);

app.controller('homeController', ['$scope', '$http', '$route', '$location', '$window', '$anchorScroll', 'PlanService', 'ActivityService', 'UserService', '$routeParams', function ($scope, $http, $route, $location, $window, $anchorScroll, PlanService, ActivityService, $routeParams, UserService) {
  console.log('route params: ', $routeParams); // need to fix this for verkamp's!
  $scope.columns = 1;
  if ($window.innerWidth > 550) {
    $scope.columns = 3;
  }

  $scope.resetDivs = function () {
    $scope.info = { // a list of all divs for accordian
      hero: true,
      one: false,
      two: false,
      three: false,
      four: false,
      five: false,
      six: false,
      seven: false,
      eight: false
    }
  }

  $scope.resetDivs()

  // see if a user is logged in
  $scope.user_id = authservice.getUserStatus();

  // see if any saved activities and set $scope.showActivity
  $scope.showActivity = activityservice.getSavedActivity()
  activityservice.saveClickedActivity(undefined) // dispose of saved Activity

  //get list of activites, open activity if url includes activity title OR if there is an activity in
  activityservice.getActivities().then(function (docs) {
    $scope.activities = docs;
    $scope.rowStart = activityservice.getRowArray(docs, $scope.columns);
    if ($routeParams.title) { // check if a particular activity is asked for…
      $routeParams.title = $routeParams.title.replace(/-/g, ' ') // get rid of dashes, actually, strip it to letters only
      console.log('title from the routeParams: ', $routeParams.title);
      $scope.activities.forEach(function(activity){
        console.log(activity.title); // make a temp variable here and strip it to letters only too so the match matches
        if (activity.title === $routeParams.title){ // need to verify that this will match in the end
          console.log('found a match!');
          activityservice.saveClickedActivity(activity)
          $location.path('/')
        }
      })
    }
  })

  // get userPlan (array of activities) and userPlan id
  if ($scope.user_id) {
    userservice.getUser($scope.user_id).then(function (data) {
      $scope.name = data.fname;
    })
    planservice.getUserPlan($scope.user_id).then(function(data) {
      if (data) {
        $scope.userPlan = data;
        $scope.planStart = activityservice.getRowArray(data, $scope.columns);
        activityservice.getActivities().then(function (docs) {
          $scope.activities.forEach(function (activity) {
            if ($scope.userPlan.indexOf(activity._id) >= 0){
              activity.inUserPlan = true;
            }
          })
        })
      } else {
        $scope.userPlan = []
      }
      $scope.toggleDiv('one')
    })
  } else {
    console.log('no one is logged in');
  }

  $scope.reset = function () { // resets all activities to closed
    $scope.activities.forEach(function (activity) {
      activity.open = false;
    })
  }

  $scope.toggleDiv = function (div, num) {
    var temp = $scope.info[div]
    for (item in $scope.info) { // close all divs (make this a reset service?)
      $scope.info[item] = false
    }
    $scope.info[div] = !temp; // div is now the opposite of what it was before
    if (!$scope.info.one && !$scope.info.two
    && !$scope.info.three && !$scope.info.four
    && !$scope.info.five && !$scope.info.six
    && !$scope.info.seven && !$scope.info.eight) {
      $scope.info.hero = true; // change this so hero is always open and nav slides over hero (animate it?)
    }
    console.log(typeof (num * 100));
    $window.scrollTo($window.pageYOffset + (num * 100), 0)
  }

  $scope.resetType = function () {
    console.log('hello!');
    if ($scope.type != 'active') {
      $scope.subtype = 'all'
    }
    console.log('types', $scope.type, $scope.subtype)
  }


  $scope.addToPlan = function (user, activity) {
    if (user === null) {
      // capture the activity that the user was trying to add
      $scope.activities.forEach(function (element) {
        if (element._id === activity) {
          activityservice.saveClickedActivity(element)
        }
      })
      $location.path('/register');
    } else {
      planservice.addToPlan(user, activity).then(function () {
        planservice.getUserPlan(user).then(function (data) {
          $scope.userPlan = data;
          $scope.planStart = activityservice.getRowArray(data, $scope.columns);
          $scope.activities.forEach(function (activity) {
            if ($scope.userPlan.indexOf(activity._id) >= 0){
              activity.inUserPlan = true;
            }
          })
        })
      })
    }
  }

  $scope.removeFromPlan = function (user, activity) {
    planservice.removeFromPlan(user, activity).then(function () {
      planservice.getUserPlan(user).then(function (data) {
        $scope.userPlan = data
        $scope.planStart = activityservice.getRowArray(data, $scope.columns);
        $scope.activities.forEach(function (activity) {
          if ($scope.userPlan.indexOf(activity._id) === -1){
            activity.inUserPlan = false;
          }
        })
        if ($scope.userPlan.length === 0) {
          $scope.myPlan = false;
        }
      })
    })
  }

  $scope.login = function () {
    $location.path('/login')
  }

  $scope.logout = function () {
    // call logout from service
    authservice.logout()
      .then(function () {
        $scope.user_id = null;
        $scope.userPlan = undefined;
        $scope.resetDivs();
        $scope.activities.forEach(function (activity) {
          activity.inUserPlan = false;
        })
        $location.path('/');
      });
  }

}]);

app.controller('planController',
  ['$scope', '$location', '$http', '$routeParams', '$window', 'PlanService', 'ActivityService', 'UserService', function ($scope, $location, $http, $routeParams, $window, PlanService, ActivityService, UserService) {

    console.log($routeParams.id);
    $scope.user = $routeParams.id;

    // see if a user is logged in
    $scope.user_id = authservice.getUserStatus()
    console.log('user id: ', $scope.user_id);

    $scope.columns = 1;
    if ($window.innerWidth > 550) {
      $scope.columns = 3;
    }

    activityservice.getActivities().then(function (docs) {
      $scope.activities = docs
      $scope.limitStart = []
      for (var i = 0; i < ($scope.activities.length / 3); i++) {
        $scope.limitStart.push(i * 3)
      }
    })

    planservice.getUserPlan($scope.user).then(function(doc) {
      if (!doc) {
        $scope.user = undefined;
      } else {
        $scope.userPlan = doc;
        $scope.planStart = activityservice.getRowArray(doc, $scope.columns);
        $scope.activities.forEach(function (activity) {
          if ($scope.userPlan.indexOf(activity._id) >= 0){
            activity.inUserPlan = true;
          }
        })
      }
    })

    userservice.getUser($scope.user).then(function (data) {
      if (data) {
        $scope.name = data.fname
      }
    })

    $scope.reset = function () { // resets all activities to closed
      $scope.activities.forEach(function (activity) {
        activity.open = false;
      })
    }

    $scope.login = function () {
      $location.path('/login')
    }

    $scope.logout = function () {
      // call logout from service
      authservice.logout()
        .then(function () {
          $scope.user_id = null;
          $scope.userPlan = undefined;
          $scope.activities.forEach(function (activity) {
            activity.inUserPlan = false;
          })
          $location.path('/');
        });
    }

}]);

app.controller('activitiesController',
  ['$scope', '$location', '$http', function ($scope, $location, $http) {

    $scope.addActivity = function (activity) {
      //send form data to database here? or from /activities route?
      $http.post('/activities', activity);
      $scope.activity = {};
    }

}]);
