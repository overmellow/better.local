var myApp = angular.module('myApp', ["ngRoute"]);

myApp.constant('baseUrl', 'http://localhost/api.local/index.php/');

myApp.factory("authenticationSvc", ["$http","$q","$window", "baseUrl", function ($http, $q, $window, baseUrl) {
    var userInfo;

    function _login(email, password) {
        var deferred = $q.defer();
        $http({
            method: "POST",
            url: baseUrl + "api_auth/login",
            data: { email: email, password: password },
            headers: {
                /*"access_token": userInfo.accessToken,*/
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
            }
        })
            .then(function (result) {
                userInfo = {
                    accessToken: result.data.access_token,
                    email: result.data.email
                };
                $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
                deferred.resolve(userInfo);
            }, function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function _logout() {
        var deferred = $q.defer();

        $http({
            method: "POST",
            url: baseUrl + "api_auth/logout",
            headers: {
                "access_token": userInfo.accessToken
            }
        }).then(function (result) {
            userInfo = null;
            $window.sessionStorage["userInfo"] = null;
            deferred.resolve(result);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function _getUserInfo() {
        return userInfo;
    }

    function init() {
        if ($window.sessionStorage["userInfo"]) {
            userInfo = JSON.parse($window.sessionStorage["userInfo"]);
        }
    }
    init();

    return {
        login: _login,
        logout: _logout,
        getUserInfo: _getUserInfo
    };
}]);

myApp.run(["$rootScope", "$location", function ($rootScope, $location) {

    $rootScope.$on("$routeChangeSuccess", function (userInfo) {
        console.log(userInfo);
    });

    $rootScope.$on("$routeChangeError", function (event, current, previous, eventObj) {
        if (eventObj.authenticated === false) {
            $location.path("/login");
        }
    });
}]);

myApp.factory('localStorageService', ['$window', '$q', function($window, $q){
    var authServiceFactory = {};

    function _getUserInformation() {
        if ($window.sessionStorage["userInfo"]) {
            userInfo = JSON.parse($window.sessionStorage["userInfo"]);
            if (typeof(userInfo) !== 'undefined' && userInfo !== null){
                if(typeof(userInfo.accessToken) !== 'undefined' && userInfo.accessToken !== null){
                    return userInfo;
                }
                userInfo.accessToken = 99999;
                return userInfo;
            }
        }
        
    }
    
    authServiceFactory.getUserinformation = _getUserInformation();
    
    return authServiceFactory;
}]);

function myAppRouteConfig($routeProvider) {
    $routeProvider.
    when('/', {
        controller: "MainController",
        templateUrl: 'view/main.html',
        resolve: {
            auth: function ($q, authenticationSvc) {
                var userInfo = authenticationSvc.getUserInfo();
                if (userInfo) {
                    return $q.when(userInfo);
                } else {
                    return $q.reject({ authenticated: false });
                }
            }
        }
    }).
    when('/fund/add', {
        controller: 'CreateController',
        templateUrl: 'view/fund/add.html',
        resolve: {
            auth: function ($q, authenticationSvc) {
                var userInfo = authenticationSvc.getUserInfo();
                if (userInfo) {
                    return $q.when(userInfo);
                } else {
                    return $q.reject({ authenticated: false });
                }
            }
        }
    }).            
    when('/edit/:id', {
        controller: "EditController",
        templateUrl: 'view/edit.html',
        resolve: {
            auth: function ($q, authenticationSvc) {
                var userInfo = authenticationSvc.getUserInfo();
                if (userInfo) {
                    return $q.when(userInfo);
                } else {
                    return $q.reject({ authenticated: false });
                }
            }
        }
    }).          
    when('/login', {
        controller: 'LoginController',
        templateUrl: 'view/login.html'
    }).
    when('/signup', {
        controller: 'SignupController',
        templateUrl: 'view/signup.html'
    }).
    otherwise({
        redirectTo: '/'
    });   
}
function myAppInterceptors($httpProvider) {
    $httpProvider.interceptors.push('myInterceptor');
}
myApp.config(myAppInterceptors);
myApp.config(myAppRouteConfig);

myApp.factory('myInterceptor', ["$q", "$window", 'localStorageService', function($q, $window, localStorageService) {

    return {
        // optional method
        'request': function(config) {
            if ($window.sessionStorage["userInfo"]) {
                userInfo = JSON.parse($window.sessionStorage["userInfo"]);
                if (typeof(userInfo) !== 'undefined' && userInfo !== null){
                    config.headers.Authorization = userInfo.accessToken;
                }
            }
          
          return config;
        },
      };
}]);

myApp.controller('CreateController', function($scope, $http, $location, baseUrl) {
    $scope.submitTheForm = function() {
        var data = {name: $scope.name, amount: $scope.amount, allocation : $scope.allocation};
        $http.put(baseUrl + "api_fund/fund", data).success(function(response){alert(response.status);}).error(function(response){alert(response.status);});
        $location.path('/main');
    }
})

myApp.controller('EditController', function($scope, $http, $routeParams, $location, baseUrl) {
    $http.get(baseUrl + "api_fund/fund/id/" + $routeParams.id)
        .success(function(response){
            $scope.id = response['id'];
            $scope.name = response['name'];
            $scope.amount = response['amount'];
            $scope.allocation = response['allocation'];
        });
    $scope.update = function() {
        var data = {id: $scope.id, name: $scope.name, amount: $scope.amount, allocation : $scope.allocation};
        $http.post(baseUrl + "api_fund/fund", data).success(function(response){alert(response.status);}).error(function(response){alert(response);});
        $location.path('/main');
    }
    
    $scope.delete = function(index) {
        $http.delete(baseUrl + "api_fund/fund/id/"+ index).success(function(response){alert(response);}).error(function(response){alert(response);});
        $location.path('/main');
    }
});

myApp.controller("MainController", ["$scope", "$location", "$http", "authenticationSvc", "auth", "baseUrl", function ($scope, $location, $http, authenticationSvc, auth, baseUrl) {
    $scope.userInfo = auth;

    $scope.logout = function () {

        authenticationSvc.logout()
            .then(function (result) {
                $scope.userInfo = null;
                $location.path("/login");
            }, function (error) {console.log(error);});
    };
    
    $http.get(baseUrl + "api_fund/funds")
        .success(function(response) {
            $scope.funds = response;
    
            var sum = 0;
            var earnings = 0;
            for (var i = response.length - 1; i >= 0; i--) {
                sum += parseFloat(response[i]['amount']);
                earnings += parseFloat(response[i]['earning']);
            }
 
            $scope.total = sum;
            $scope.total_earnings = earnings;
        });  
}]);

myApp.controller('SignupController', function($scope, $http, $location) {
    $scope.signup = function() {
        var data = {name: $scope.name, email: $scope.email, password: $scope.password};
        $http.put(baseUrl + "api_user/user", data).success(function(response){alert(response.status);}).error(function(response){alert(response.status);});
        //$location.path('/list');
    }
})

myApp.controller("LoginController", ["$scope", "$location", "$window", "authenticationSvc", function ($scope, $location, $window, authenticationSvc) {
    $scope.userInfo = null;
    $scope.login = function () {
        authenticationSvc.login($scope.email, $scope.password)
            .then(function (result) {
                $scope.userInfo = result;
                console.log(result);
                $location.path("/");
            }, function (error) {
                $window.alert("Invalid credentials");
                console.log(error);
            });
    };
}]);

myApp.controller("MenuController", ["$scope", "$location", "authenticationSvc", function ($scope, $location, authenticationSvc) {
    //$scope.userInfo = auth;
    $scope.userInfo = authenticationSvc.getUserInfo();
    $scope.me = $scope.userInfo.email;
    $scope.logout = function () {

        authenticationSvc.logout()
            .then(function (result) {
                $scope.userInfo = null;
                $location.path("/login");
            }, function (error) {
                console.log(error);
            });
    };
}]);

myApp.controller("SettingController", ["$scope", "$location", "$http", "authenticationSvc", "auth", "baseUrl", function ($scope, $location, $http, authenticationSvc, auth, baseUrl) {
   
    $scope.save = function(id, title, director) {
        var data = {id: id, title: title, director: director};
        $http.post(baseUrl + "better_auth/movie", data).success(function(response){alert(response.status);}).error(function(response){alert(response);});
        //$location.path('/list');
    }
    
    $scope.edit = function (val) {
        
    };
    
    $http.get(baseUrl + "better_auth/movies")
        .success(function(response) {$scope.movies = response;});  
}]);
