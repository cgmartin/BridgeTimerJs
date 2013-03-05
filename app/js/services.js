'use strict';

/* Services */

angular.module('bridgeTimerApp.services', []).
    value('version', '0.1').
    factory('timer', function($timeout, $rootScope) {
        var timer = {
            timerSeconds: 10, //1 * 60,
            msRemaining:  0,
            startTime:    null,
            hasStarted:   false,
            hasCompleted: false,
            timeoutId:    null,
            completeCb:   null,

            start: function(completeCb) {
                if (this.timeoutId) {
                    return;
                }
                if (completeCb) {
                    this.completeCb = completeCb;
                }
                this.hasStarted = true;
                this.startTime  = new Date().getTime();
                $rootScope.$broadcast('timer:started');
                this.tick();
                //console.log('Timer started');
            },
            tick: function() {
                var timerMs = this.timerSeconds * 1000; // timerSeconds could change midstream
                this.msRemaining = timerMs - (new Date().getTime() - this.startTime);
                if (this.msRemaining <= 0) {
                    this.msRemaining = 0;
                    this.complete();
                } else {
                    this.update();
                    this.timeoutId = $timeout(
                        angular.bind(this, this.tick),
                        (this.msRemaining < 200) ? this.msRemaining : 200
                    );
                }
            },
            update: function() {
                //console.log("Timer Update", this.msRemaining);
                $rootScope.$broadcast('timer:update', Math.ceil(this.msRemaining / 1000));
            },
            complete: function() {
                this.hasCompleted = true;
                this.timeoutId = null;
                $rootScope.$broadcast('timer:complete');
                if (this.completeCb) {
                    this.completeCb();
                }
            },
            stop: function() {
                if (!this.timeoutId) {
                    return;
                }
                $timeout.cancel(this.timeoutId);
                this.timeoutId = null;
                this.timerSeconds = Math.round(this.msRemaining / 1000);
                $rootScope.$broadcast('timer:stopped');
                //console.log('Timer stopped');
            },
            reset: function(seconds, completeCb) {
                this.stop();
                if (completeCb) {
                    this.completeCb   = completeCb;
                }
                this.timerSeconds = seconds;
                this.hasCompleted = false;
                this.hasStarted   = false;
                this.msRemaining  = this.timerSeconds * 1000;
                console.log('Timer reset');
            },
            adjust: function(seconds) {
                var tmp = this.timerSeconds;
                tmp += seconds;
                var maxSeconds = (59 * 60) + 59;
                if (tmp <= maxSeconds && tmp >= 0) {
                    this.timerSeconds = tmp;
                    this.msRemaining += seconds * 1000;
                }
            }
        }
        return timer;
    }).
    factory('game', function($timeout, $rootScope, timer) {

        var audio = false;
        var warnSound = null;
        var finalSound = null;
        var bufferLoader = false;

        if ('webkitAudioContext' in window) {
            audio =  new webkitAudioContext();
            bufferLoader = new BufferLoader(
                audio,
                [
                    'sounds/warn_ding.wav',
                    'sounds/final_ding.wav'
                ],
                function (bufferList) {
                    warnSound  = bufferList[0];
                    finalSound = bufferList[1];
                }
            );
            bufferLoader.load();
        }

        var playSound = function(buffer, time) {
            if (audio && buffer) {
                var source = audio.createBufferSource();
                source.buffer = buffer;
                source.connect(audio.destination);
                source.noteOn(time || 0);
            }
        };

        var game = {
            state:             'begin', // begin, playing, change, break, end, paused
            prePauseState:     null,
            hasWarned:         false,
            round:             1,
            maxRounds:         8,
            minutesPerRound:   20,  // 0-60
            changeDelay:       60,
            roundsBeforeBreak: 4,   // 2-5
            minutesPerBreak:   10,  // 0-15
            warningSeconds:    60,
            backgroundColor:   '#f7f7f7',
            foregroundColor:   '#000000',
            messages: {
                begin:  "The game will start soon.<br>Please take your seats.",
                change: "Please change tables for the next round.",
                break:  "Hospitality Break",
                end:    "The game has ended.<br>Thanks for playing!",
                paused: "[ Paused ]"
            },
            adjustRound: function(delta) {
                var newCurrent = this.round;
                newCurrent += delta;
                if (newCurrent < 1) {
                    newCurrent = 1;
                } else if (newCurrent > this.maxRounds) {
                    newCurrent = this.maxRounds;
                }
                this.round = newCurrent;
            },
            reset: function() {
                timer.stop();
                this.round = 1;
                this.state = 'begin';
            },
            start: function() {
                this.nextState();
            },
            startRound: function(playSounds) {
                this.state = 'playing';
                this.hasWarned = false;
                timer.reset(this.minutesPerRound * 60, angular.bind(this, this.nextState));
                timer.start();
                playSounds && playSound(warnSound);
                console.log('Playing round.');
            },
            startChange: function() {
                this.state = 'change';
                timer.reset(this.changeDelay, angular.bind(this, this.nextState));
                timer.start();
                console.log('Change tables.');
            },
            startBreak: function() {
                this.state = 'break';
                timer.reset(this.minutesPerBreak * 60, angular.bind(this, this.nextState));
                timer.start();
                console.log('Taking break.');
            },
            nextState: function(playSounds) {
                if (typeof playSounds === "undefined") {
                    playSounds = true;
                }

                timer.stop();
                switch (this.state) {
                    case 'begin':
                        this.startRound(playSounds);
                        break;
                    case 'playing':
                        if (this.round == this.maxRounds) {
                            this.state = 'end';
                        } else if ((this.round) % this.roundsBeforeBreak == 0) {
                            this.round++;
                            this.startBreak();
                        } else {
                            this.round++;
                            this.startChange();
                        }
                        playSounds && playSound(finalSound);
                        break;
                    case 'change':
                    case 'break':
                        this.startRound(playSounds);
                        break;
                    case 'end':
                        this.reset();
                        break;
                }
            },
            prevState: function() {
                timer.stop();
                switch (this.state) {
                    case 'playing':
                        if (this.round == 1) {
                            this.reset();
                        } else if ((this.round + 1) % this.roundsBeforeBreak == 0) {
                            this.startBreak();
                        } else {
                            this.startChange();
                        }
                        break;
                    case 'change':
                    case 'break':
                        this.round--;
                    case 'end':
                        this.startRound(false);
                        break;
                }
            },
            pause: function() {
                timer.stop();
                this.prePauseState = this.state;
                this.state = 'paused';
                console.log('Game paused.');
            },
            resume: function() {
                this.state = this.prePauseState;
                this.prePauseState = null;
                timer.start();
                this.prePauseCb = null;
            },
            warn: function(secsRemaining) {
                if (this.state == 'playing' && !this.hasWarned) {
                    if (secsRemaining <= this.warningSeconds) {
                        this.hasWarned = true;
                        playSound(warnSound);
                    }
                }
            }
        };

        // Warning check
        $rootScope.$on('timer:update', angular.bind(game, function(event, secsRemaining) {
            this.warn(secsRemaining);
        }));

        return game;
    }).
    factory('localstorage', function() {

        var mapGameToRow = function(game, row) {
            row['maxRounds']         = game.maxRounds;
            row['minutesPerRound']   = game.minutesPerRound;
            row['changeDelay']       = game.changeDelay;
            row['roundsBeforeBreak'] = game.roundsBeforeBreak;
            row['minutesPerBreak']   = game.minutesPerBreak;
            row['warningSeconds']    = game.warningSeconds;
            row['backgroundColor']   = game.backgroundColor;
            row['foregroundColor']   = game.foregroundColor;
            row['beginMessage']      = game.messages.begin;
            row['changeMessage']     = game.messages.change;
            row['breakMessage']      = game.messages.break;
            row['endMessage']        = game.messages.end;
        };
        var mapRowToGame = function(row, game) {
            game.maxRounds         = parseInt(row['maxRounds']);
            game.minutesPerRound   = parseInt(row['minutesPerRound']);
            game.changeDelay       = parseInt(row['changeDelay']);
            game.roundsBeforeBreak = parseInt(row['roundsBeforeBreak']);
            game.minutesPerBreak   = parseInt(row['minutesPerBreak']);
            game.warningSeconds    = parseInt(row['warningSeconds']);
            game.backgroundColor   = row['backgroundColor'];
            game.foregroundColor   = row['foregroundColor'];
            game.messages.begin    = row['beginMessage'];
            game.messages.change   = row['changeMessage'];
            game.messages.break    = row['breakMessage'];
            game.messages.end      = row['endMessage'];
        };

        var storage = {};
        // Is localStorage supported?
        if (typeof(Storage) !== "undefined") {
            storage = window.localStorage;
        }

        return {
            save: function(game) {
                mapGameToRow(game, storage);
            },

            fetch: function(game, $scope) {
                if (storage['maxRounds']) {
                    $scope.$apply(function() {
                        mapRowToGame(storage, game);
                    });
                }
            },

            remove: function() { }
        };
    });