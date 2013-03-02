'use strict';

/* Controllers */

var TimerController = function($rootScope, $scope, $location, $timeout, timer) {
    var baseUrl = (BASE_URL) ? BASE_URL : '';
    $scope.timer = timer;

    $scope.$on('my:keyup', function(event, keyEvent) {
        //console.log('TimerController my:keyup', keyEvent);
        switch (keyEvent.keyCode) {
            case 38: // Up arrow
                $scope.timer.adjust(2);
                break;
            case 40: // Down arrow
                $scope.timer.adjust(-2);
                break;
            case 39: // Right arrow
                $rootScope.game.nextState(false);
                break;
            case 37: // Left arrow
                $rootScope.game.prevState();
                break;
            case 32: // Spacebar
                if ($rootScope.game.state == 'begin') {
                    $rootScope.game.start();
                } else if ($scope.game.state == 'end') {
                    $rootScope.game.reset();
                } else if ($scope.game.state == 'paused') {
                    $rootScope.game.resume();
                } else {
                    $rootScope.game.pause();
                }
                break;
        }
    });
    $scope.showMessages = function() {
        return $rootScope.game.state != 'playing';
    };
    $scope.showTimer = function() {
        return $rootScope.game.state == 'playing';
    };
    $scope.showPrevRound = function() {
        return $rootScope.game.state == 'change' || $rootScope.game.state == 'break';
    };
    $scope.showRound = function() {
        return !($rootScope.game.state == 'begin' || $rootScope.game.state == 'end' || $rootScope.game.state == 'paused');
    };
    $scope.warn = function() {
        return $scope.timer.msRemaining <= ($rootScope.game.warningSeconds * 1000);
    };
    $scope.gotoSettings = function() {
        if ($rootScope.game.state == 'begin' || $rootScope.game.state == 'end' || $rootScope.game.state == 'paused') {
            $location.url(baseUrl + '/settings');
        } else {
            $rootScope.game.pause();
            $timeout(function() { $location.url(baseUrl + '/settings'); }, 700);
        }
    };
    /*
    $scope.$on('timer:update', function(event, secsRemaining, totalSeconds) {
        console.log('Timer update event', secsRemaining);
    });
    $scope.$on('timer:complete', function(event, totalSeconds) {
        console.log('Timer complete!', totalSeconds);
    });
    */
};

var SettingsController = function($rootScope, $scope, $location, localstorage) {
    var baseUrl = (BASE_URL) ? BASE_URL : '';
    $scope.tmpGame = {};
    $scope.tmpGame = angular.copy($rootScope.game);

    $scope.save = function() {
        angular.copy($scope.tmpGame, $rootScope.game);
        localstorage.save($rootScope.game);
        $location.url(baseUrl + '/');
    };
    $scope.cancel = function() {
        $location.url(baseUrl + '/');
    };
};
