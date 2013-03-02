'use strict';

// Declare app level module which depends on filters, and services
angular.module('bridgeTimerApp', ['bridgeTimerApp.filters', 'bridgeTimerApp.services', 'bridgeTimerApp.directives']).
    config(['$routeProvider', function($routeProvider) {
        var baseUrl = (BASE_URL) ? BASE_URL : '';
        var cacheBuster = (CACHE_BUST) ? '?v=' + new Date().getTime() : '';
        $routeProvider.when(baseUrl + '/',         {templateUrl: 'partials/timer.html' + cacheBuster,    controller: TimerController});
        $routeProvider.when(baseUrl + '/settings', {templateUrl: 'partials/settings.html' + cacheBuster, controller: SettingsController, transition: 'modal' });
        $routeProvider.otherwise({redirectTo: baseUrl + '/'});
    }]).
    config(['$locationProvider', function($location) {
        $location.html5Mode(true); //now there won't be a hashbang within URLs for browers that support HTML5 history
    }]).
    run(function($rootScope, game, timer, localstorage) {
        // This is effectively part of the main method initialization code
        game.reset();
        $rootScope.game = game;
        //persistencejs.remove();
        localstorage.fetch($rootScope.game, $rootScope);
    });
