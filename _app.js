myApp.constant('baseUrl', 'http://api.local/index.php/');

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
    })
}

myApp.config(myAppRouteConfig);

myApp.controller("MainController", ["$scope", "$location", "$http", "authenticationSvc", "auth", "baseUrl", function ($scope, $location, $http, authenticationSvc, auth, baseUrl) {
    
    $scope.userInfo = auth;   
    $http.get(baseUrl + "better_fund/funds")
        .success(function(response) {$scope.funds = response;});  
}]);

function myAppInterceptors($httpProvider) {
    $httpProvider.interceptors.push('myInterceptor');
}

myApp.config(myAppInterceptors);

var myApp = angular.module('myApp', ["ngRoute"]);

