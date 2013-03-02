'use strict';

/* Directives */

angular.module('bridgeTimerApp.directives', []).
    directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]).
    directive('animate', function(){
        return function(scope, elm, attrs) {
            setTimeout(function(){
                elm.addClass('show');
            });
        };
    }).
    directive('ngTap', function() {
        var isTouchDevice = !!("ontouchstart" in window);
        return function(scope, elm, attrs) {
            if (isTouchDevice) {
                var tapping = false;
                elm.bind('touchstart', function() { tapping = true; });
                elm.bind('touchmove', function() { tapping = false; });
                elm.bind('touchend', function() {
                    tapping && scope.$apply(attrs.ngTap);
                });
            } else {
                elm.bind('click', function() {
                    scope.$apply(attrs.ngTap);
                });
            }
        };
    }).
    directive('myCurrentTime', function($timeout, dateFilter) {
        // return the directive link function. (compile function not needed)
        return function(scope, element, attrs) {
            var format,  // date format
                timeoutId; // timeoutId, so that we can cancel the time updates

            // used to update the UI
            function updateTime() {
                element.text(dateFilter(new Date(), format));
            }

            // watch the expression, and update the UI on change.
            scope.$watch(attrs.myCurrentTime, function(value) {
                format = value;
                updateTime();
            });

            // schedule update in one second
            function updateLater() {
                // save the timeoutId for canceling
                timeoutId = $timeout(function() {
                    updateTime(); // update DOM
                    updateLater(); // schedule another update
                }, 1000);
            }

            // listen on DOM destroy (removal) event, and cancel the next UI update
            // to prevent updating time ofter the DOM element was removed.
            element.bind('$destroy', function() {
                $timeout.cancel(timeoutId);
            });

            updateLater(); // kick off the UI update process.
        }
    });
