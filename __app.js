var myApp = angular.module('myApp', ["ngRoute"]); 
  
myApp.constant('baseUrl', 'http://localhost/api.local/index.php/');

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
    when('/login', {
        controller: "LoginController",
        templateUrl: 'view/login.html'
    }).
    when('/fund/add', {
        controller: "FundAddController",
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
    otherwise({
        redirectTo: '/'
    }); 
}

myApp.config(myAppRouteConfig);

myApp.controller("MainController", ["$scope", "$http", "baseUrl", function ($scope, $http, baseUrl) {        
    $http.get(baseUrl + "api_fund/funds")
        .success(function(response) {$scope.funds = response;});
}]);

myApp.controller("FundAddController", ["$scope", "$http", "baseUrl", function ($scope, $http, baseUrl) {

    $scope.submitTheForm = function() {
        //var data = {title: $scope.title, amount: $scope.amount};
        //$http.put(baseUrl + "api_fund/fund", data).success(function(response){alert(response.status);}).error(function(response){alert(response.status);});
        $http({
        method: "PUT",
        url: baseUrl + "api_fund/fund",
        data: { title: $scope.title, amount: $scope.amount},
        headers: {
            /*"access_token": userInfo.accessToken,*/
            //'Access-Control-Allow-Origin': '*',
            //'Access-Control-Allow-Methods': 'PUT',
            //'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
        }
    })
        .then(function (response) {
            //$scope.funds = response;
        }, function (error) {
            console.log(error.message);
            //deferred.reject(error);
        });
    }
}]);
/*
myApp.controller("LoginController", ["$scope", "$http", "baseUrl", function ($scope, $http, baseUrl) {

    $scope.login = function() {
        $http({
        method: "POST",
        url: baseUrl + "api_auth/login",
        data: { email: $scope.email, password: $scope.password},

    })
    .then(function (response) {
            //$scope.funds = response;
            console.log(response);
        }, function (error) {
            console.log(error.message);
            //deferred.reject(error);
        });
    } 
}]);
*/
myApp.controller("LoginController", ["$scope", "$location", "$window", "authenticationSvc", function ($scope, $location, $window, authenticationSvc) {
    $scope.userInfo = null;
    $scope.login = function () {
        authenticationSvc.login($scope.email, $scope.password)
            .then(function (result) {
                $scope.userInfo = result;
                //console.log(result);
                $location.path("/");
            }, function (error) {
                $window.alert("Invalid credentials");
                //console.log(error);
            });
    };
}]);

myApp.factory("authenticationSvc", ["$http","$q","$window", "baseUrl", function ($http, $q, $window, baseUrl) {
    var userInfo;

    function _login(email, password) {
        var deferred = $q.defer();
        
        //$http.post(baseUrl + "better_login/login", { email: email, password: password })
        $http({
            method: "POST",
            url: baseUrl + "api_auth/login",
            data: { email: email, password: password },
            headers: {
                /*"access_token": userInfo.accessToken,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',*/
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
/*
function myAppInterceptors($httpProvider) {
    $httpProvider.interceptors.push('myInterceptor');
}

myApp.config(myAppInterceptors);
*/
function myAppHttpProvider($httpProvider) {

    $httpProvider.interceptors.push('myInterceptor');
    // We need to setup some parameters for http requests
    // These three lines are all you need for CORS support
    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = false;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
};
  
myApp.config(myAppHttpProvider); 

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