"use strict";

//kep the page from scrolling
$(document).ready(function() {
  $(document).on("scroll", function(e) {
    $(document).scrollTop(0)
  });
});

var app = angular.module("box_game", []);

app.controller("box_ctrl", ["$scope", "$rootScope", "$timeout", "$interval", "$filter", "turn_update", "data", function($scope, $rootScope, $timeout, $interval, $filter, turn_update, data) {

  /**********  application variables  **********/
  $scope.developer = "Developed By: Isaiah Harrison";
  $rootScope.my_score = "00";
  $rootScope.your_score = "00";
  $scope.headerText = "Main Menu";
  $rootScope.computerTurn = false;
  $scope.totalBoxes = 64;
  $rootScope.timer_mins = "400";
  $rootScope.timer_secs = "40";
  $scope.time = "2min";
  $rootScope.totalTurns = 0;
  $rootScope.disabled = false;
  $rootScope.gridLength = 64;
  $rootScope.pathFinder;
  $rootScope.endGame = false;
  $rootScope.volume = 0.25;
  $rootScope.music = 1;
  //used to ngRepeat through the grid squares
  $scope.grid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63
  ];
  //used to indicate whos turn it is (even#: myturn, odd#: yourturn)
  $rootScope.whos_turn = 0;
  /**********  complete: application variables  **********/

  //SPLASH SCREEN
  $rootScope.pregameMusic = document.getElementById("myAudio");
  $rootScope.pregameMusic.volume = $rootScope.volume;
  $rootScope.pregameMusic.pause();
  $timeout(function() {
    $(".imgHolder img").css("transform", "perspective( 600px ) rotateY(0deg)");
    $timeout(function() {
      $("body").css("backgroundColor", "#000");
      $(".splashContainer").css("backgroundColor", "#000");
      $timeout(function() {
        if ($rootScope.music != 0) {
          $rootScope.pregameMusic.play();
        }

        $("body").css("backgroundColor", "#FFF");
        $(".splashContainer").hide();
        $("#reset").fadeIn(2000);
        $("#top_bar").fadeIn(2000);
        $("#gameLiner").fadeIn(2000);
        $(".menuPage").fadeIn(2000);
      }, 1400);
    }, 1200);
  }, 10);



  /**********  test button  **********/
  //disable the computer from taking to turn (used only for testing purposes)
  $rootScope.disableComputer = () => {
    $rootScope.disabled = !$rootScope.disabled;
  };
  /**********  end: test button  **********/


  // WATCH FOR ENDGAME RESTART AND TIMER GAME START
  $interval(function() {
    if ($(".gameCompletionPage").hasClass("endGameRestart")) {
      $scope.reset();
      $(".gameCompletionPage").removeClass("endGameRestart");
    }
    if ($(".menuPage").hasClass("startGameClock")) {
      $("#gameboard").addClass("start");
      $(".menuPage").removeClass("startGameClock");
    }
  }, 10);


  /**********  reset button  **********/
  $scope.reset = () => {
    //reset click streak
    $rootScope.clickStreakInGame = 0;
    $scope.play();
    $rootScope.whos_turn = 0;
    $timeout(function() {
      //reset last clicked box
      $rootScope.lastBox = {};
      //reset endgame indicator
      $rootScope.endGame = false;
      //reset the reset button text
      $("#reset_text").text("Main Menu");
      //reset gameboard start indication (used to start the time clock)
      $("#gameboard").removeClass("start");
      //reset scores
      $rootScope.my_score = $filter("reset_numbers")($rootScope.my_score);
      $rootScope.your_score = $filter("reset_numbers")($rootScope.your_score);
      //reset start time
      $rootScope.timeSelect = true;
      //reset timer
      $rootScope.startGame = false;
      $rootScope.timer_mins = "00";
      $rootScope.timer_secs = "40";
      //reset background and borders and other classes
      $(".grid").removeClass("myPoint")
        .removeClass("yourPoint")
        .removeClass("you")
        .removeClass("me")
        .removeClass("borderTopColor")
        .removeClass("borderRightColor")
        .removeClass("borderBottomColor")
        .removeClass("borderLeftColor")
        .removeClass("borderTopColorDone")
        .removeClass("borderRightColorDone")
        .removeClass("borderBottomColorDone")
        .removeClass("borderLeftColorDone");
      //remove atr higlight
      $(".starGoal").removeClass("starHighlight");
      //reset the checkers
      $(".checker").attr("data", 0);
      //side checks
      $(".side").attr("data", "false");
      //reset turn opacity and turn variable
      $(".my_score").css("opacity", "1");
      $(".your_score").css("opacity", "0.4");
      //remove all path related classes
      $(".grid").removeClass("middlePathBox");
      $(".grid").removeClass("pathEnd");
      $(".grid").removeClass("pathAccounted");
    }, 500);
  };

  $scope.play = () => {
    $(".menuPage").fadeIn();
    if ($rootScope.music != 0) {
      $rootScope.pregameMusic.play();
    }
  }
  /**********  complete: reset button  **********/



  /**********  start game when first line is pressed  **********/
  // WATCH FOR TIMER INCREMEN
  $interval(function() {
    if ($("#timer").hasClass("incrementTimer")) {
      $("#timer").removeClass("incrementTimer");
      let plus = parseInt($rootScope.timer_secs) + 2;
      plus = $filter("double_digit")(plus);
      if (plus > 59) {
        const timeDifference = plus - 60;
        $rootScope.timer_mins = parseInt($rootScope.timer_mins) + 1;
        //turn them ino two digit numbers
        $rootScope.timer_secs = $filter("double_digit")(timeDifference);
        $rootScope.timer_mins = $filter("double_digit")($rootScope.timer_mins);
      } else {
        $rootScope.timer_secs = plus;
      }
    }
  }, 10);
  //update timer every sec
  $interval(function() {
    if ($("#gameboard").hasClass("start") && ($rootScope.whos_turn % 2 == 0)) {
      //update timer
      //convert the number for incrementing
      $rootScope.timer_mins = parseInt($rootScope.timer_mins);
      $rootScope.timer_secs = parseInt($rootScope.timer_secs);
      //increment secs by 1
      $rootScope.timer_secs--;

      if ($rootScope.timer_secs == -1) {
        $rootScope.timer_secs = 59;
        $rootScope.timer_mins--;
      }

      if (($rootScope.timer_secs == 0) && ($rootScope.timer_mins == 0)) {
        $("#gameboard").removeClass("start");
      }

      //turn them ino two digit numbers
      $rootScope.timer_secs = $filter("double_digit")($rootScope.timer_secs);
      $rootScope.timer_mins = $filter("double_digit")($rootScope.timer_mins);
    }
  }, 1000);
  /**********  complete: start game when first dot is pressed  **********/



  /**********  game flow  **********/
  //watch for a turn change and update the opacity of the scores to indicate whos turn it is -> the turn player is the number that is NOT faded out
  $rootScope.$watch("whos_turn", (newValue, oldValue) => {
    if (newValue != oldValue) {
      turn_update.opacity($rootScope.whos_turn);
      turn_update.clickableLines($rootScope.whos_turn);
    }
  });

  //update score an check for winner -> this updates everytime a line is pressed because totalTurns is incremented by 1 everytime a line is pressed
  $rootScope.$watch("totalTurns", (newValue, oldValue) => {
    if (newValue != oldValue) {
      //get the number of highlighted boxes for each players (indicated by number of "me" and "you" classes)
      $rootScope.my_score = data.updateScore("myScore");
      $rootScope.your_score = data.updateScore("computerScore");
      $rootScope.totalScore = $rootScope.my_score + $rootScope.your_score;
    }
  });
  /**********  complete: game flow  **********/



  /**********  mantain grid box dimensions / update turn indicator opacity  **********/
  $interval(function() {
    var gameWidth = $("#gameboard").width();
    var borderWidth = $(".grid").css("borderWidth");
    var gridWidth = gameWidth * 0.125;
    var gridHeight = gridWidth;
    $(".grid").css("width", gridWidth);
    $(".grid").css("height", gridHeight);
  }, 100);
  /**********  complete: mantain grid box width relative to height  **********/



}]);

app.controller("line_click", ["$scope", "$rootScope", "$filter", "$timeout", "data", "map", "click",
  function($scope, $rootScope, $filter, $timeout, data, map, click) {

    $rootScope.lastBox = {};

    $scope.edge_click = ($event) => {
      //take of the click higlight
      if ($rootScope.lastBox.madeThisSide) {
        $(".grid[data=" + $rootScope.lastBox.location + "]").addClass($rootScope.lastBox.class)
      }
      if ($rootScope.lastBox.madeAdjSide) {
        $(".grid[data=" + $rootScope.lastBox.adjLocation + "]").addClass($rootScope.lastBox.adjClass)
      }
      $rootScope.lastBox = {};

      //track total amount of turns => when this value changes we know to update the score (functionality used in box_ctrl)
      $rootScope.totalTurns++;

      //start the game clock => when the class is set to start the clcok will start (the functionality is controlled in the box_ctrl)
      $("#gameboard").addClass("start");

      //cache array for: this box's, and it's adjacet box's, data attr value and the side that was clicked
      var thisBoxes = $filter("find")($event);

      let thisBox = map.boxes($event);
      const validLineClick = (thisBox != false);

      if ($rootScope.whos_turn % 2 === 0 && validLineClick && !thisBox.hasBeenClicked) {
        $("#timer").addClass("incrementTimer");
        $("#timer .addedTime span").show();
        $("#timer .addedTime span").fadeOut(300);
      }

      //if side check == false that side has not been previously clicked
      if (!thisBox.hasBeenClicked && validLineClick) {
        //change turn when line is clicked (even#:1st player tun, odd#:computer turn) -> the turn update is handled in box_ctrl
        $rootScope.whos_turn++;

        //make cliked boxes
        map.markBoxes(thisBox);

        //perform line clicked
        click.line(thisBox);

        //fill box if needed
        click.fill(thisBox);

      } //end: if( side_check == "false" )

      const isComputerTurn = (($rootScope.whos_turn % 2 != 0) && ($rootScope.disabled == false));
      //cache the computer's move response time to use in the timeout
      const computerResponseTime = 400;
      if (!isComputerTurn) {
        $rootScope.clickStreakInGame++;
        click.updateStreak($rootScope.clickStreakInGame);
      }
      //delay computer turn
      $timeout(function() {

        if (isComputerTurn) {
          $rootScope.clickStreakInGame = 0;
          //check for boxes with 0-3 lines to decide the best move
          const noLine = $(".grid").children(".checker[data=0]").parent().attr("data");
          const oneLine = $(".grid").children(".checker[data=1]").parent().attr("data");
          const twoLines = $(".grid").children(".checker[data=2]").parent().attr("data");
          const threeLines = $(".grid").children(".checker[data=3]").parent().attr("data");

          //fill chose a box to change
          if (threeLines != undefined) {

            //get click obj
            let obj = click.threeLineClick(threeLines);

            //initiate computer move
            $scope.edge_click(obj);

          } else if ($rootScope.endGame) {

            //if the game is over don't run this box click
            if ($scope.totalScore != 64) {
              const obj = click.endGame();
              //initiate computer move
              $scope.edge_click(obj);
            }

          } else if ((noLine != undefined) || (oneLine != undefined)) {
            ////////////////////////////////////////add the difficulty adjustment here
            //get click obj
            let obj = click.noLineClick();

            if (obj === false) {

              //if the game is over don't run this box click
              if ($scope.totalScore != 64) {
                //declare end end to skip over non-endgame logic
                $rootScope.endGame = true;

                const obj = click.endGame();
                //initiate computer move
                $scope.edge_click(obj);
              }

            } else {
              //initiate computer move
              $scope.edge_click(obj);
            }

          } // end: else if((noLine != undefined) || (oneLine != undefined))

        } // end: if(isComputerTurn)

      }, computerResponseTime); // end: $timeout

    } //end: $scope.edge_click = function ($event)

  }
]);

app.controller("outOfGamePlayFunction", ["$scope", "$rootScope", "$interval", "$timeout", "calc", function($scope, $rootScope, $interval, $timeout, calc) {



  // CORDOVA EVENT LISTENERS
  // a full list can be found at: https://cordova.apache.org/docs/en/latest/cordova/events/events.html#pause

  //fires when app is paused
  document.addEventListener("pause", onPause, false);

  function onPause() {
    // Handle the pause event
    $rootScope.pregameMusic.pause();

    //reset the in game indicator
    $rootScope.InGame = false;
    if ($("#gameboard").hasClass("start")) {
      $("#gameboard").removeClass("start");
      $rootScope.InGame = true;
    }
  }

  //fires when app resumes
  document.addEventListener("resume", onResume, false);

  function onResume() {
    // Handle the resume event
    let notDisplayNone = ($(".menuPage").css("display") != "none");
    if ((notDisplayNone) && ($scope.switch2 == "on")) {
      $rootScope.pregameMusic.play()
    }

    if ($rootScope.InGame === true) {
      $("#gameboard").addClass("start")
    }
  }

  ///////////////

  $rootScope.InGame = false;
  $rootScope.winStatus = "";
  $scope.menu = "Main Menu"
  $scope.quickStart = "quick start";
  $scope.directions = "directions";
  $scope.settings = "settings";
  $scope.stats = "stats";
  $scope.settingsVolume = "volume";
  $scope.music = "music";
  $scope.gameplaySounds = "gameplay sounds";
  $scope.bestFinishTime = "best finish time";
  $scope.highestScore = "highest score";
  $scope.clickStreak = "click streak";
  $rootScope.bestFinishTimeValue = localStorage.bestFinishTime || "99:99";
  $rootScope.highestScoreValue = localStorage.highestScore || 0;
  $rootScope.clickStreakValue = localStorage.clickStreak || 0;
  $rootScope.points = 0;
  $scope.switch1 = "on";
  $scope.switch2 = "on";
  $rootScope.score = 0;
  $scope.endGameWatch = true;
  $rootScope.clickStreakInGame = 0;
  $rootScope.highestGameStreak = 0;

  //increment speed for end game score
  let incrementSpeed = 10;

  //set local storage variables
  localStorage.highestScore;
  localStorage.bestFinishTime;
  localStorage.clickStreak;
  localStorage.bestMin;
  localStorage.bestSec;
  if (localStorage.bestFinishTime != undefined) {
    let split = localStorage.bestFinishTime.split(":");
    localStorage.bestMin = split[0];
    localStorage.bestSec = split[1];
  }

  //sounds
  $rootScope.youwin = new Audio('audio/youWinSound.wav');
  $rootScope.youlose = new Audio('audio/youLoseSound.wav');
  $rootScope.youlose2 = new Audio('audio/youLoseSound.wav');
  $rootScope.youlose3 = new Audio('audio/youLoseSound.wav');
  $rootScope.scoreSound = new Audio('audio/points.wav');
  //set volume
  $rootScope.youwin.volume = $rootScope.volume;
  $rootScope.youlose.volume = $rootScope.volume;
  $rootScope.youlose2.volume = $rootScope.volume;
  $rootScope.youlose3.volume = $rootScope.volume;
  $rootScope.scoreSound.volume = $rootScope.volume;

  //watch for the end of the game
  $scope.watch = () => {
    let endGame = $interval(function() {
      let myScore = $("#me span").text();
      let yourScore = $("#you span").text();
      myScore = parseInt(myScore);
      yourScore = parseInt(yourScore);
      let totalScore = myScore + yourScore;

      if (totalScore === 64) {
        //stop the clock
        $("#gameboard").removeClass("start");
        $scope.endGameWatch = false;
        $(".gameCompletionPage").fadeIn();
        //determine winner
        if (myScore > yourScore) {
          if ($rootScope.gamepPlaySound != 0) {
            $rootScope.youwin.play()
          }
          calc.score($rootScope.timer_mins, $rootScope.timer_secs);
          $rootScope.winStatus = "You Win!";
          //set local variables
          calc.records();

          $(".winStatus").css("color", "#87E9FF");
          //start score count
          $timeout(function() {
            $scope.timeCount(1);
            if ($rootScope.gamepPlaySound != 0) {
              $rootScope.scoreSound.play()
            }
          }, 800);
        } else if (myScore < yourScore) {
          if ($rootScope.gamepPlaySound != 0) {
            $rootScope.youlose.play();
            $timeout(function() {
              $rootScope.youlose2.play();
              $timeout(function() {
                $rootScope.youlose3.play();
              }, 1200);
            }, 800);
          }
          $rootScope.winStatus = "You Lose!";
          $(".winStatus").css("color", "#C12B5F");
          $rootScope.score = 0;
        } else if (myScore === yourScore) {
          $rootScope.winStatus = "Draw!";
          $(".winStatus").css("color", "#FFF");
          $rootScope.score = 0;
        }
      }

      //stop the interval count
      if ($scope.endGameWatch === false) {
        //reset th watch
        $scope.endGameWatch = true;
        $interval.cancel(endGame);
        //stop the clock
        $("#gameboard").removeClass("start");
      }
    }, 1000);

    let outOfTime = $interval(function() {
      let minLeft = parseInt($rootScope.timer_mins);
      let secLeft = parseInt($rootScope.timer_secs);
      let total = minLeft + secLeft;
      if (total === 0) {
        $interval.cancel(outOfTime);
        if ($rootScope.gamepPlaySound != 0) {
          $rootScope.youlose.play();
          $timeout(function() {
            $rootScope.youlose2.play();
            $timeout(function() {
              $rootScope.youlose3.play();
            }, 1200);
          }, 800);
        }
        $rootScope.winStatus = "You Lose!";
        $(".winStatus").css("color", "#C12B5F");
        $rootScope.score = 0;
        $("#gameboard").removeClass("start");
        $(".gameCompletionPage").fadeIn();
      }
    }, 10);
  }
  //increment the score
  $scope.timeCount = (incrementSpeed) => {
    let scoreIncrement = $interval(function() {
      $rootScope.points++;

      //star indicator
      if ($rootScope.points >= 45) {
        $(".starOne").addClass("starHighlight")
      }
      if ($rootScope.points >= 80) {
        $(".starTwo").addClass("starHighlight")
      }
      if ($rootScope.points >= 95) {
        $(".starThree").addClass("starHighlight")
      }
      if ($rootScope.points >= 120) {
        $(".starFour").addClass("starHighlight")
      }

      if ($rootScope.points >= $rootScope.score) {
        $rootScope.scoreSound.pause();
        $rootScope.points = $rootScope.score;
        $interval.cancel(scoreIncrement);
      }
    }, incrementSpeed);
  }

  //game sounds
  $rootScope.playGame = new Audio('audio/introSound.wav');
  $rootScope.pregame = new Audio('audio/preGameMusic.wav');
  $rootScope.audio = new Audio('audio/click.wav');
  $rootScope.playFill = new Audio('audio/fill.wav');

  //set volume
  $rootScope.playGame.volume = $rootScope.volume;
  $rootScope.pregame.volume = $rootScope.volume;
  $rootScope.audio.volume = $rootScope.volume;
  $rootScope.playFill.volume = 0.1 * $rootScope.volume;

  var gameBoardPage = () => {
    $(".menuPage").fadeOut();
    $rootScope.pregameMusic.pause();
  }

  //initiate the game
  $scope.play = () => {
    $scope.watch();
    gameBoardPage();
    $(".countDown").css("display", "flex");
    if ($rootScope.gamepPlaySound != 0) {
      $rootScope.playGame.play()
    }
    $(".countDownBox span").css("opacity", 1).text("3");
    $timeout(function() {
      $(".countDownBox span").text("2");
      $timeout(function() {
        $(".countDownBox span").text("1");
        $timeout(function() {
          $(".countDownBox span").text("GO");
          $timeout(function() {
            $(".countDown").css("display", "none");
            $(".countDownBox span").text("3");
            $(".menuPage").addClass("startGameClock");
          }, 300);
        }, 1000);
      }, 1000);
    }, 1000);
  }
  //back main menuPage
  $scope.mainMenu = () => {
    $(".gameCompletionPage").fadeOut();
    $timeout(() => {
      if ($rootScope.music != 0) {
        $rootScope.pregameMusic.play();
      }
      $(".gameCompletionPage").addClass("endGameRestart");
      $(".menuPage").fadeIn();
    }, 1200);
  }
  //to directions
  $scope.directionsTab = () => {
    $(".quickStart").fadeOut();
    $(".directions").fadeOut();
    $(".settings").fadeOut();
    $(".stats").fadeOut();
    $timeout(function() {
      $(".directionsTab").fadeIn()
    }, 1000);
  }
  //back to menu from directions
  $scope.directionsToMenu = () => {
    $(".directionsTab").fadeOut();
    $timeout(function() {
      $(".quickStart").fadeIn();
      $(".directions").fadeIn();
      $(".settings").fadeIn();
      $(".stats").fadeIn();
    }, 1000);
  }
  //to settings
  $scope.settingsTab = () => {
    $(".quickStart").fadeOut();
    $(".directions").fadeOut();
    $(".settings").fadeOut();
    $(".stats").fadeOut();
    $timeout(function() {
      $(".settingsTab").fadeIn()
    }, 1000);
  }
  //back to menu from settings
  $scope.settingsToMenu = () => {
    $(".settingsTab").fadeOut();
    $timeout(function() {
      $(".quickStart").fadeIn();
      $(".directions").fadeIn();
      $(".settings").fadeIn();
      $(".stats").fadeIn();
    }, 1000);
  }
  //to stats
  $scope.statsTab = () => {
    $(".quickStart").fadeOut();
    $(".directions").fadeOut();
    $(".settings").fadeOut();
    $(".stats").fadeOut();
    $timeout(function() {
      $(".statsTab").fadeIn()
    }, 1000);
  }
  //back to menu from stats
  $scope.statsToMenu = () => {
    $(".statsTab").fadeOut();
    $timeout(function() {
      $(".quickStart").fadeIn();
      $(".directions").fadeIn();
      $(".settings").fadeIn();
      $(".stats").fadeIn();
    }, 1000);
  }

  //settings tab functionality
  $scope.switchOne = () => {
    $(".switch1").toggleClass("off");
    if ($(".switch1").hasClass("off")) {
      $scope.switch1 = "off";
      $rootScope.music = 0;
      $rootScope.pregameMusic.pause();
    } else {
      $scope.switch1 = "on";
      $rootScope.music = 1;
      if ($rootScope.music != 0) {
        $rootScope.pregameMusic.play();
      }
    }
  };
  $scope.switchTwo = () => {
    $(".switch2").toggleClass("off");
    if ($(".switch2").hasClass("off")) {
      $scope.switch2 = "off";
      $rootScope.gamepPlaySound = 0;
    } else {
      $scope.switch2 = "on";
      $rootScope.gamepPlaySound = 1;
    }
  };

  //volume keys
  //initiate beingging colume indicator
  $(".lessThanAll").addClass("volumeColor");
  $(".lessThan25").addClass("volumeColor");
  $scope.off = () => {
    $rootScope.volume = 0;
    setVolume($rootScope.volume);
    $(".volumeChange").removeClass("volumeColor");
    $(".lessThanAll").addClass("volumeColor");
  };
  $scope.low = () => {
    $rootScope.volume = 0.25;
    setVolume($rootScope.volume);
    $(".volumeChange").removeClass("volumeColor");
    $(".lessThan25").addClass("volumeColor");
  };
  $scope.medium = () => {
    $rootScope.volume = 0.5;
    setVolume($rootScope.volume);
    $(".volumeChange").removeClass("volumeColor");
    $(".lessThan50").addClass("volumeColor");
  };
  $scope.high = () => {
    $rootScope.volume = 0.75;
    setVolume($rootScope.volume);
    $(".volumeChange").removeClass("volumeColor");
    $(".lessThan75").addClass("volumeColor");
  };
  $scope.loud = () => {
    $rootScope.volume = 1;
    setVolume($rootScope.volume);
    $(".volumeChange").addClass("volumeColor");
  };

  const setVolume = (volume) => {
    $rootScope.pregameMusic.volume = volume;
    $rootScope.playGame.volume = volume;
    $rootScope.pregame.volume = volume;
    $rootScope.audio.volume = volume;
    $rootScope.playFill.volume = 0.1 * volume;
    $rootScope.youwin.volume = volume;
    $rootScope.youlose.volume = volume;
    $rootScope.youlose2.volume = volume;
    $rootScope.youlose3.volume = volume;
    $rootScope.scoreSound.volume = volume;
  }

}]);

app.controller("clickArea", ["$scope", "$interval", "$rootScope", "$filter", "$timeout", "data", "map", "click", function($scope, $interval, $rootScope, $filter, $timeout, data, map, click) {
  $scope.clickAreaLength = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
    55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
    84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
    135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158,
    159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182,
    183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206,
    207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230,
    231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254,
    255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278,
    279, 280, 281, 282, 283, 284, 285, 286, 287, 288
  ];

  $scope.lineClick = ($event) => {
    const dataLocation = $event.target.attributes.data.nodeValue;
    //console.log(clickArray[dataLocation]);

    //cach all node info
    const clickDataLocation = clickArray[dataLocation].grid;
    const clickSide = clickArray[dataLocation].side;
    const clickAdjDataLocation = clickArray[dataLocation].adjGrid;
    const clickAdjSide = clickArray[dataLocation].adjSide;

    //check to see if the box is already clicked
    const booleanCheck = $(".grid[data=" + clickDataLocation + "]").children("#" + clickSide).attr("data");
    const isClicked = (booleanCheck === "true");

    if (!isClicked && (booleanCheck != undefined)) {
      //check to see if it has an adj lineClick
      if (clickAdjDataLocation != undefined) {
        //highligh only two side -> b/c it has an adj side
        $(".grid[data=" + clickDataLocation + "]").children("#" + clickSide).attr("data", "true");
        $(".grid[data=" + clickDataLocation + "]").css("border-" + clickSide + "-color", "blue");
        $(".grid[data=" + clickAdjDataLocation + "]").children("#" + clickAdjSide).attr("data", "true");
        $(".grid[data=" + clickAdjDataLocation + "]").css("border-" + clickAdjSide + "-color", "blue");
        //increment the data location
        let incrementValue = $(".grid[data=" + clickDataLocation + "]").children(".checker").attr("data");
        let incrementValueAdj = $(".grid[data=" + clickAdjDataLocation + "]").children(".checker").attr("data");
        incrementValue = parseInt(incrementValue) + 1;
        incrementValueAdj = parseInt(incrementValueAdj) + 1;
        $(".grid[data=" + clickDataLocation + "]").children(".checker").attr("data", incrementValue);
        $(".grid[data=" + clickAdjDataLocation + "]").children(".checker").attr("data", incrementValueAdj);

        //if a point is scores, take another turn
        const hasScoredThisSide = ($(".grid[data=" + clickDataLocation + "]").children(".checker").attr("data") == 4);
        const hasScoredAdjSide = ($(".grid[data=" + clickAdjDataLocation + "]").children(".checker").attr("data") == 4);

        //check to see if you score on either box
        if (hasScoredThisSide || hasScoredAdjSide) {
          if (hasScoredThisSide) {
            //check to see which play score
            if ($rootScope.whos_turn % 2 === 0) {
              console.log("I scored");
            } else {
              console.log("opponent scored")
            }
          } else if (hasScoredAdjSide) {
            //check to see which play score
            if ($rootScope.whos_turn % 2 === 0) {
              console.log("I scored");
            } else {
              console.log("opponent scored")
            }
          }
        } else {
          $rootScope.whos_turn++;
        }


      } else {
        //highligh only one side -> b/c it doesn't have an adj side
        $(".grid[data=" + clickDataLocation + "]").children("#" + clickSide).attr("data", "true");
        $(".grid[data=" + clickDataLocation + "]").css("border-" + clickSide + "-color", "blue");
        //increment the data location
        let incrementValue = $(".grid[data=" + clickDataLocation + "]").children(".checker").attr("data");
        incrementValue = parseInt(incrementValue) + 1;
        $(".grid[data=" + clickDataLocation + "]").children(".checker").attr("data", incrementValue);

        //if a point is scores, take another turn
        const hasScoredThisSide = ($(".grid[data=" + clickDataLocation + "]").children(".checker").attr("data") == 4);
        //check to see if you score on either box
        if (hasScoredThisSide) {
          //check to see which play score
          if ($rootScope.whos_turn % 2 === 0) {
            console.log("I scored");
          } else {
            console.log("opponent scored")
          }
        } else {
          $rootScope.whos_turn++;
        }
      }

    }


    const isComputerTurn = ($rootScope.whos_turn % 2 != 0);
    //cache the computer's move response time to use in the timeout
    const computerResponseTime = 800;
    if (!isComputerTurn) {
      $rootScope.clickStreakInGame++;
      click.updateStreak($rootScope.clickStreakInGame);
    }
    //delay computer turn
    $timeout(function() {

      if (isComputerTurn) {
        $rootScope.clickStreakInGame = 0;
        //check for boxes with 0-3 lines to decide the best move
        const noLine = $(".grid").children(".checker[data=0]").parent().attr("data");
        const oneLine = $(".grid").children(".checker[data=1]").parent().attr("data");
        const twoLines = $(".grid").children(".checker[data=2]").parent().attr("data");
        const threeLines = $(".grid").children(".checker[data=3]").parent().attr("data");

        //fill chose a box to change
        if (threeLines != undefined) {

          //get click obj
          //let obj = click.threeLineClick(threeLines);

          //initiate computer move
          //$scope.edge_click(obj);

          //get click obj
          let obj = click.threeLinesClick(threeLines, clickSide);

          //initiate computer move
          $scope.lineClick(obj);

        } else if ($rootScope.endGame) {

          //if the game is over don't run this box click
          if ($scope.totalScore != 64) {
            const obj = click.endGame();
            //initiate computer move
            $scope.edge_click(obj);
          }

        } else if ((noLine != undefined) || (oneLine != undefined)) {
          ////////////////////////////////////////add the difficulty adjustment here
          //get click obj
          let obj = click.noLineClick(clickSide);

          if (obj === false) {

            //if the game is over don't run this box click
            if ($scope.totalScore != 64) {
              //declare end end to skip over non-endgame logic
              $rootScope.endGame = true;

              const obj = click.endGame();
              //initiate computer move
              $scope.edge_click(obj);
            }

          } else {
            //initiate computer move
            $scope.lineClick(obj);
          }

        } // end: else if((noLine != undefined) || (oneLine != undefined))

      } // end: if(isComputerTurn)

    }, computerResponseTime); // end: $timeout

  };


  //used to position the click boxes
  var originalHeight = $(".clickLiner").height();
  var adjustedHeight = originalHeight - 24;
  $(".clickLiner").css("height", adjustedHeight);

  // $interval(function() {
  //   //$(".clicks:odd").css("backgroundColor", "orange");
  //   $(".clicks:even").css("opacity", 0);
  // }, 10);

  // var gridCount = 0;
  // var array = "[";
  // for (let i = 0; i < 289; i++) {
  //   if (i % 2 === 0) {
  //     array += "{}, ";
  //   } else if (i < 16) {
  //     array += "{grid:" + gridCount + ", side:'top'}, ";
  //     gridCount++;
  //   } else if (i === 17) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 33) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 33) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 50) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 51) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 67) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 67) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 84) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 85) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 101) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 101) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 118) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 119) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 135) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 135) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 152) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 153) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 169) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 169) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 186) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 187) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 203) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 203) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 220) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 221) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 237) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 237) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 254) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   } else if (i === 255) {
  //     gridCount -= 8;
  //     array += "{grid:" + gridCount + ", side:'left'}, ";
  //   } else if (i < 271) {
  //     array += "{grid:" + gridCount + ", side:'right', adjGrid:" + (gridCount + 1) + ", adjSide:'left'}, ";
  //     gridCount++;
  //   } else if (i === 271) {
  //     array += "{grid:" + gridCount + ", side:'right'}, ";
  //     gridCount++;
  //   } else if (i < 288) {
  //     array += "{grid:" + gridCount + ", side:'top', adjGrid:" + (gridCount - 8) + ", adjSide:'bottom'}, ";
  //     gridCount++;
  //   }
  //
  // }
  // array += "]";
  //console.log(array);


  //array that associates the click boxs with the grid boxes
  let clickArray = [{}, {
    grid: 0,
    side: 'top'
  }, {}, {
    grid: 1,
    side: 'top'
  }, {}, {
    grid: 2,
    side: 'top'
  }, {}, {
    grid: 3,
    side: 'top'
  }, {}, {
    grid: 4,
    side: 'top'
  }, {}, {
    grid: 5,
    side: 'top'
  }, {}, {
    grid: 6,
    side: 'top'
  }, {}, {
    grid: 7,
    side: 'top'
  }, {}, {
    grid: 0,
    side: 'left'
  }, {}, {
    grid: 0,
    side: 'right',
    adjGrid: 1,
    adjSide: 'left'
  }, {}, {
    grid: 1,
    side: 'right',
    adjGrid: 2,
    adjSide: 'left'
  }, {}, {
    grid: 2,
    side: 'right',
    adjGrid: 3,
    adjSide: 'left'
  }, {}, {
    grid: 3,
    side: 'right',
    adjGrid: 4,
    adjSide: 'left'
  }, {}, {
    grid: 4,
    side: 'right',
    adjGrid: 5,
    adjSide: 'left'
  }, {}, {
    grid: 5,
    side: 'right',
    adjGrid: 6,
    adjSide: 'left'
  }, {}, {
    grid: 6,
    side: 'right',
    adjGrid: 7,
    adjSide: 'left'
  }, {}, {
    grid: 7,
    side: 'right'
  }, {}, {
    grid: 8,
    side: 'top',
    adjGrid: 0,
    adjSide: 'bottom'
  }, {}, {
    grid: 9,
    side: 'top',
    adjGrid: 1,
    adjSide: 'bottom'
  }, {}, {
    grid: 10,
    side: 'top',
    adjGrid: 2,
    adjSide: 'bottom'
  }, {}, {
    grid: 11,
    side: 'top',
    adjGrid: 3,
    adjSide: 'bottom'
  }, {}, {
    grid: 12,
    side: 'top',
    adjGrid: 4,
    adjSide: 'bottom'
  }, {}, {
    grid: 13,
    side: 'top',
    adjGrid: 5,
    adjSide: 'bottom'
  }, {}, {
    grid: 14,
    side: 'top',
    adjGrid: 6,
    adjSide: 'bottom'
  }, {}, {
    grid: 15,
    side: 'top',
    adjGrid: 7,
    adjSide: 'bottom'
  }, {}, {
    grid: 8,
    side: 'left'
  }, {}, {
    grid: 8,
    side: 'right',
    adjGrid: 9,
    adjSide: 'left'
  }, {}, {
    grid: 9,
    side: 'right',
    adjGrid: 10,
    adjSide: 'left'
  }, {}, {
    grid: 10,
    side: 'right',
    adjGrid: 11,
    adjSide: 'left'
  }, {}, {
    grid: 11,
    side: 'right',
    adjGrid: 12,
    adjSide: 'left'
  }, {}, {
    grid: 12,
    side: 'right',
    adjGrid: 13,
    adjSide: 'left'
  }, {}, {
    grid: 13,
    side: 'right',
    adjGrid: 14,
    adjSide: 'left'
  }, {}, {
    grid: 14,
    side: 'right',
    adjGrid: 15,
    adjSide: 'left'
  }, {}, {
    grid: 15,
    side: 'right'
  }, {}, {
    grid: 16,
    side: 'top',
    adjGrid: 8,
    adjSide: 'bottom'
  }, {}, {
    grid: 17,
    side: 'top',
    adjGrid: 9,
    adjSide: 'bottom'
  }, {}, {
    grid: 18,
    side: 'top',
    adjGrid: 10,
    adjSide: 'bottom'
  }, {}, {
    grid: 19,
    side: 'top',
    adjGrid: 11,
    adjSide: 'bottom'
  }, {}, {
    grid: 20,
    side: 'top',
    adjGrid: 12,
    adjSide: 'bottom'
  }, {}, {
    grid: 21,
    side: 'top',
    adjGrid: 13,
    adjSide: 'bottom'
  }, {}, {
    grid: 22,
    side: 'top',
    adjGrid: 14,
    adjSide: 'bottom'
  }, {}, {
    grid: 23,
    side: 'top',
    adjGrid: 15,
    adjSide: 'bottom'
  }, {}, {
    grid: 16,
    side: 'left'
  }, {}, {
    grid: 16,
    side: 'right',
    adjGrid: 17,
    adjSide: 'left'
  }, {}, {
    grid: 17,
    side: 'right',
    adjGrid: 18,
    adjSide: 'left'
  }, {}, {
    grid: 18,
    side: 'right',
    adjGrid: 19,
    adjSide: 'left'
  }, {}, {
    grid: 19,
    side: 'right',
    adjGrid: 20,
    adjSide: 'left'
  }, {}, {
    grid: 20,
    side: 'right',
    adjGrid: 21,
    adjSide: 'left'
  }, {}, {
    grid: 21,
    side: 'right',
    adjGrid: 22,
    adjSide: 'left'
  }, {}, {
    grid: 22,
    side: 'right',
    adjGrid: 23,
    adjSide: 'left'
  }, {}, {
    grid: 23,
    side: 'right'
  }, {}, {
    grid: 24,
    side: 'top',
    adjGrid: 16,
    adjSide: 'bottom'
  }, {}, {
    grid: 25,
    side: 'top',
    adjGrid: 17,
    adjSide: 'bottom'
  }, {}, {
    grid: 26,
    side: 'top',
    adjGrid: 18,
    adjSide: 'bottom'
  }, {}, {
    grid: 27,
    side: 'top',
    adjGrid: 19,
    adjSide: 'bottom'
  }, {}, {
    grid: 28,
    side: 'top',
    adjGrid: 20,
    adjSide: 'bottom'
  }, {}, {
    grid: 29,
    side: 'top',
    adjGrid: 21,
    adjSide: 'bottom'
  }, {}, {
    grid: 30,
    side: 'top',
    adjGrid: 22,
    adjSide: 'bottom'
  }, {}, {
    grid: 31,
    side: 'top',
    adjGrid: 23,
    adjSide: 'bottom'
  }, {}, {
    grid: 24,
    side: 'left'
  }, {}, {
    grid: 24,
    side: 'right',
    adjGrid: 25,
    adjSide: 'left'
  }, {}, {
    grid: 25,
    side: 'right',
    adjGrid: 26,
    adjSide: 'left'
  }, {}, {
    grid: 26,
    side: 'right',
    adjGrid: 27,
    adjSide: 'left'
  }, {}, {
    grid: 27,
    side: 'right',
    adjGrid: 28,
    adjSide: 'left'
  }, {}, {
    grid: 28,
    side: 'right',
    adjGrid: 29,
    adjSide: 'left'
  }, {}, {
    grid: 29,
    side: 'right',
    adjGrid: 30,
    adjSide: 'left'
  }, {}, {
    grid: 30,
    side: 'right',
    adjGrid: 31,
    adjSide: 'left'
  }, {}, {
    grid: 31,
    side: 'right'
  }, {}, {
    grid: 32,
    side: 'top',
    adjGrid: 24,
    adjSide: 'bottom'
  }, {}, {
    grid: 33,
    side: 'top',
    adjGrid: 25,
    adjSide: 'bottom'
  }, {}, {
    grid: 34,
    side: 'top',
    adjGrid: 26,
    adjSide: 'bottom'
  }, {}, {
    grid: 35,
    side: 'top',
    adjGrid: 27,
    adjSide: 'bottom'
  }, {}, {
    grid: 36,
    side: 'top',
    adjGrid: 28,
    adjSide: 'bottom'
  }, {}, {
    grid: 37,
    side: 'top',
    adjGrid: 29,
    adjSide: 'bottom'
  }, {}, {
    grid: 38,
    side: 'top',
    adjGrid: 30,
    adjSide: 'bottom'
  }, {}, {
    grid: 39,
    side: 'top',
    adjGrid: 31,
    adjSide: 'bottom'
  }, {}, {
    grid: 32,
    side: 'left'
  }, {}, {
    grid: 32,
    side: 'right',
    adjGrid: 33,
    adjSide: 'left'
  }, {}, {
    grid: 33,
    side: 'right',
    adjGrid: 34,
    adjSide: 'left'
  }, {}, {
    grid: 34,
    side: 'right',
    adjGrid: 35,
    adjSide: 'left'
  }, {}, {
    grid: 35,
    side: 'right',
    adjGrid: 36,
    adjSide: 'left'
  }, {}, {
    grid: 36,
    side: 'right',
    adjGrid: 37,
    adjSide: 'left'
  }, {}, {
    grid: 37,
    side: 'right',
    adjGrid: 38,
    adjSide: 'left'
  }, {}, {
    grid: 38,
    side: 'right',
    adjGrid: 39,
    adjSide: 'left'
  }, {}, {
    grid: 39,
    side: 'right'
  }, {}, {
    grid: 40,
    side: 'top',
    adjGrid: 32,
    adjSide: 'bottom'
  }, {}, {
    grid: 41,
    side: 'top',
    adjGrid: 33,
    adjSide: 'bottom'
  }, {}, {
    grid: 42,
    side: 'top',
    adjGrid: 34,
    adjSide: 'bottom'
  }, {}, {
    grid: 43,
    side: 'top',
    adjGrid: 35,
    adjSide: 'bottom'
  }, {}, {
    grid: 44,
    side: 'top',
    adjGrid: 36,
    adjSide: 'bottom'
  }, {}, {
    grid: 45,
    side: 'top',
    adjGrid: 37,
    adjSide: 'bottom'
  }, {}, {
    grid: 46,
    side: 'top',
    adjGrid: 38,
    adjSide: 'bottom'
  }, {}, {
    grid: 47,
    side: 'top',
    adjGrid: 39,
    adjSide: 'bottom'
  }, {}, {
    grid: 40,
    side: 'left'
  }, {}, {
    grid: 40,
    side: 'right',
    adjGrid: 41,
    adjSide: 'left'
  }, {}, {
    grid: 41,
    side: 'right',
    adjGrid: 42,
    adjSide: 'left'
  }, {}, {
    grid: 42,
    side: 'right',
    adjGrid: 43,
    adjSide: 'left'
  }, {}, {
    grid: 43,
    side: 'right',
    adjGrid: 44,
    adjSide: 'left'
  }, {}, {
    grid: 44,
    side: 'right',
    adjGrid: 45,
    adjSide: 'left'
  }, {}, {
    grid: 45,
    side: 'right',
    adjGrid: 46,
    adjSide: 'left'
  }, {}, {
    grid: 46,
    side: 'right',
    adjGrid: 47,
    adjSide: 'left'
  }, {}, {
    grid: 47,
    side: 'right'
  }, {}, {
    grid: 48,
    side: 'top',
    adjGrid: 40,
    adjSide: 'bottom'
  }, {}, {
    grid: 49,
    side: 'top',
    adjGrid: 41,
    adjSide: 'bottom'
  }, {}, {
    grid: 50,
    side: 'top',
    adjGrid: 42,
    adjSide: 'bottom'
  }, {}, {
    grid: 51,
    side: 'top',
    adjGrid: 43,
    adjSide: 'bottom'
  }, {}, {
    grid: 52,
    side: 'top',
    adjGrid: 44,
    adjSide: 'bottom'
  }, {}, {
    grid: 53,
    side: 'top',
    adjGrid: 45,
    adjSide: 'bottom'
  }, {}, {
    grid: 54,
    side: 'top',
    adjGrid: 46,
    adjSide: 'bottom'
  }, {}, {
    grid: 55,
    side: 'top',
    adjGrid: 47,
    adjSide: 'bottom'
  }, {}, {
    grid: 48,
    side: 'left'
  }, {}, {
    grid: 48,
    side: 'right',
    adjGrid: 49,
    adjSide: 'left'
  }, {}, {
    grid: 49,
    side: 'right',
    adjGrid: 50,
    adjSide: 'left'
  }, {}, {
    grid: 50,
    side: 'right',
    adjGrid: 51,
    adjSide: 'left'
  }, {}, {
    grid: 51,
    side: 'right',
    adjGrid: 52,
    adjSide: 'left'
  }, {}, {
    grid: 52,
    side: 'right',
    adjGrid: 53,
    adjSide: 'left'
  }, {}, {
    grid: 53,
    side: 'right',
    adjGrid: 54,
    adjSide: 'left'
  }, {}, {
    grid: 54,
    side: 'right',
    adjGrid: 55,
    adjSide: 'left'
  }, {}, {
    grid: 55,
    side: 'right'
  }, {}, {
    grid: 56,
    side: 'top',
    adjGrid: 48,
    adjSide: 'bottom'
  }, {}, {
    grid: 57,
    side: 'top',
    adjGrid: 49,
    adjSide: 'bottom'
  }, {}, {
    grid: 58,
    side: 'top',
    adjGrid: 50,
    adjSide: 'bottom'
  }, {}, {
    grid: 59,
    side: 'top',
    adjGrid: 51,
    adjSide: 'bottom'
  }, {}, {
    grid: 60,
    side: 'top',
    adjGrid: 52,
    adjSide: 'bottom'
  }, {}, {
    grid: 61,
    side: 'top',
    adjGrid: 53,
    adjSide: 'bottom'
  }, {}, {
    grid: 62,
    side: 'top',
    adjGrid: 54,
    adjSide: 'bottom'
  }, {}, {
    grid: 63,
    side: 'top',
    adjGrid: 55,
    adjSide: 'bottom'
  }, {}, {
    grid: 56,
    side: 'left'
  }, {}, {
    grid: 56,
    side: 'right',
    adjGrid: 57,
    adjSide: 'left'
  }, {}, {
    grid: 57,
    side: 'right',
    adjGrid: 58,
    adjSide: 'left'
  }, {}, {
    grid: 58,
    side: 'right',
    adjGrid: 59,
    adjSide: 'left'
  }, {}, {
    grid: 59,
    side: 'right',
    adjGrid: 60,
    adjSide: 'left'
  }, {}, {
    grid: 60,
    side: 'right',
    adjGrid: 61,
    adjSide: 'left'
  }, {}, {
    grid: 61,
    side: 'right',
    adjGrid: 62,
    adjSide: 'left'
  }, {}, {
    grid: 62,
    side: 'right',
    adjGrid: 63,
    adjSide: 'left'
  }, {}, {
    grid: 63,
    side: 'right'
  }, {}, {
    grid: 56,
    side: 'bottom'
  }, {}, {
    grid: 57,
    side: 'bottom'
  }, {}, {
    grid: 58,
    side: 'bottom'
  }, {}, {
    grid: 59,
    side: 'bottom'
  }, {}, {
    grid: 60,
    side: 'bottom'
  }, {}, {
    grid: 61,
    side: 'bottom'
  }, {}, {
    grid: 62,
    side: 'bottom'
  }, {}, {
    grid: 63,
    side: 'bottom'
  }, {}];

}]);

app.service("data", function($filter) {

  this.updateScore = (request, total, myScore, computerScore) => {

    //returns a value based off of what is asked for
    if (request == "myScore") {
      //return my score
      this.myScore = $(".grid[class*=my]").length;
      this.myScore = $filter("double_digit")(this.myScore);
      return this.myScore;
    } else if (request == "computerScore") {
      //return computer score
      this.computerScore = $(".grid[class*=your]").length;
      this.computerScore = $filter("double_digit")(this.computerScore);
      return this.computerScore;
    }
  };

});

app.service("turn_update", function($rootScope) {
  this.opacity = (turn_number) => {
    if (turn_number % 2 == 1) {
      $(".my_score").css("opacity", 0.4);
      $(".your_score").css("opacity", 1);
    } else if (turn_number % 2 == 0) {
      $(".my_score").css("opacity", 1);
      $(".your_score").css("opacity", 0.4);
    }
  }

  this.clickableLines = (turn_number) => {
    if (turn_number % 2 == 1) {
      $rootScope.computerTurn = true;
    } else if (turn_number % 2 == 0) {
      $rootScope.computerTurn = false;
    }
  }
});

app.service("map", function($filter) {

  //return the position of the box as strings -> ex: "topRight", "rightSide", "middle", "topSide"
  //fn(number)
  this.position = (dataLocation) => {

    const data = dataLocation;
    //top right corner box
    const topRight = (data === 7);
    //top left corner box
    const topLeft = (data === 0);
    //bottom right corner box
    const bottomRight = (data === 63);
    //bottome left corner
    const bottomeLeft = (data === 56);
    //top side boxes
    const topSide = (data === 1 || data === 2 || data === 3 || data === 4 || data === 5 || data === 6);
    //bottom side boxes
    const bottomSide = (data === 57 || data === 58 || data === 59 || data === 60 || data === 61 || data === 62);
    //right side boxes
    const rightSide = (data === 15 || data === 23 || data === 31 || data === 39 || data === 47 || data === 55);
    //left side boxes
    const leftSide = (data === 8 || data === 16 || data === 24 || data === 32 || data === 40 || data === 48);

    if (topRight) {
      return "topRight"
    } else if (topLeft) {
      return "topLeft"
    } else if (bottomRight) {
      return "bottomRight"
    } else if (bottomeLeft) {
      return "bottomeLeft"
    } else if (rightSide) {
      return "rightSide"
    } else if (leftSide) {
      return "leftSide"
    } else if (topSide) {
      return "topSide"
    } else if (bottomSide) {
      return "bottomSide"
    } else {
      return "middle"
    }

  }

  //return the surrounding boxes as an array of numbers -> ex: 1, 10, 56
  //fn(string, number)
  this.surroundingBoxes = (position, dataLocation) => {

    let surroundingBoxArray = [];
    if (position === "topRight") {
      surroundingBoxArray.push(dataLocation + 8);
      surroundingBoxArray.push(dataLocation - 1);
    } else if (position === "topLeft") {
      surroundingBoxArray.push(dataLocation + 1);
      surroundingBoxArray.push(dataLocation + 8);
    } else if (position === "bottomRight") {
      surroundingBoxArray.push(dataLocation - 8);
      surroundingBoxArray.push(dataLocation - 1);
    } else if (position === "bottomeLeft") {
      surroundingBoxArray.push(dataLocation - 8);
      surroundingBoxArray.push(dataLocation + 1);
    } else if (position === "rightSide") {
      surroundingBoxArray.push(dataLocation - 8);
      surroundingBoxArray.push(dataLocation + 8);
      surroundingBoxArray.push(dataLocation - 1);
    } else if (position === "leftSide") {
      surroundingBoxArray.push(dataLocation - 8);
      surroundingBoxArray.push(dataLocation + 1);
      surroundingBoxArray.push(dataLocation + 8);
    } else if (position === "middle") {
      surroundingBoxArray.push(dataLocation - 8);
      surroundingBoxArray.push(dataLocation + 1);
      surroundingBoxArray.push(dataLocation + 8);
      surroundingBoxArray.push(dataLocation - 1);
    } else if (position == "topSide") {
      surroundingBoxArray.push(dataLocation + 1);
      surroundingBoxArray.push(dataLocation + 8);
      surroundingBoxArray.push(dataLocation - 1);
    } else if (position == "bottomSide") {
      surroundingBoxArray.push(dataLocation - 8);
      surroundingBoxArray.push(dataLocation + 1);
      surroundingBoxArray.push(dataLocation - 1);
    }

    return surroundingBoxArray;

  }

  //return this box side clicked as is string -> ex: "top", "right"
  //fn(event obj)
  this.sideClicked = ($event) => {

    let sideClicked = "";
    //cache var to account for the screen size when offsets are compared
    const gameWidth = $("#gameboard").width();
    const gridWidthComparer = gameWidth * 0.125 * 0.7;
    //the side clicked is by the offset and the screen size
    if ($event.offsetY < 10) {
      sideClicked = "top"
    } else if ($event.offsetX > gridWidthComparer) {
      sideClicked = "right"
    } else if ($event.offsetY > gridWidthComparer) {
      sideClicked = "bottom"
    } else if ($event.offsetX < 10) {
      sideClicked = "left"
    } else {
      return false
    };

    return sideClicked;

  }

  //return adj box side that was clicked as is string -> ex: "top", "right"
  //fn(string)
  this.oppositeSide = (side) => {

    if (side == "top") {
      return "bottom"
    } else if (side == "right") {
      return "left"
    } else if (side == "bottom") {
      return "top"
    } else if (side == "left") {
      return "right"
    }

  }

  //return if a line has already been clicked as a boolean
  //fn(number, string)
  this.isLineAlreadyCicked = (dataLocation, side) => {

    const hasBeenClicked = ($(".grid[data=" + dataLocation + "]").children("#" + side).attr("data") === "true");
    return hasBeenClicked;

  }

  //returns all lines click and associated boxes as an object
  //fn(event obj)
  this.boxes = ($event) => {
    //return object that includes:  1. this box position
    //                              2. the line that was clicked
    //                              3. the adjcent box position (if applicable)
    //                              4. the adjcent box line that was clicked (if applicable)

    const object = {};

    let dataLocation = $event.target.attributes.data.nodeValue;
    dataLocation = parseInt(dataLocation);
    const sideClicked = this.sideClicked($event);

    if (sideClicked != false) {

      const oppositeSideClicked = this.oppositeSide(sideClicked);
      const positionOnBoard = this.position(dataLocation);
      const surroundingBoxes = this.surroundingBoxes(positionOnBoard, dataLocation);
      const hasBeenClicked = this.isLineAlreadyCicked(dataLocation, sideClicked);

      object.thisBoxLocation = dataLocation;
      object.thisBoxSideClick = sideClicked;
      object.hasBeenClicked = hasBeenClicked;
      object.hasAdjBox = false;

      let possibleAdjBox;

      if (sideClicked === "top") {
        possibleAdjBox = dataLocation - 8
      } else if (sideClicked === "right") {
        possibleAdjBox = dataLocation + 1
      } else if (sideClicked === "bottom") {
        possibleAdjBox = dataLocation + 8
      } else if (sideClicked === "left") {
        possibleAdjBox = dataLocation - 1
      }

      const adjBoxInSurroundBoxes = (surroundingBoxes.indexOf(possibleAdjBox) != -1);
      if (adjBoxInSurroundBoxes) {
        object.hasAdjBox = true;
        object.adjBox = possibleAdjBox;
        object.adjBoxSideClick = oppositeSideClicked;
      }

      return object;

    }

    //returns false if there wasn't to side clicked
    return false;

  }

  //increment .checker data -> the increment number respresents how many sides are highlighted
  //fn(object)
  this.markBoxes = (thisBox) => {

    //cache line increment number indicators -> ".check[data]"
    var data = $filter("increment_value")(thisBox.thisBoxLocation);
    //assign incremented line values to the boxes
    $(".grid[data=" + thisBox.thisBoxLocation + "]").children(".checker").attr("data", data);
    //indicate this line been clicked
    $(".grid[data=" + thisBox.thisBoxLocation + "]").children("#" + thisBox.thisBoxSideClick + "").attr("data", "true");

    if (thisBox.hasAdjBox) {
      var dataAdj = $filter("increment_value")(thisBox.adjBox);
      $(".grid[data=" + thisBox.adjBox + "]").children(".checker").attr("data", dataAdj);
      $(".grid[data=" + thisBox.adjBox + "]").children("#" + thisBox.adjBoxSideClick + "").attr("data", "true");
    }

  }

});

app.service("click", function($rootScope, $filter, map) {

  //update click streak
  this.updateStreak = (num) => {

    if (num > $rootScope.highestGameStreak) {
      $rootScope.highestGameStreak = num
    }

  }

  //indicates where the last move was ms-radial-gradient
  this.clickCircle = (dataLocation, offsetX, offsetY) => {

    const leftClickPosition = angular.element(document.getElementById(dataLocation)).prop('offsetLeft');
    const topClickPosition = angular.element(document.getElementById(dataLocation)).prop('offsetTop');
    const clientHeight = angular.element(document.getElementById(dataLocation)).prop('clientHeight');
    const clientWidth = angular.element(document.getElementById(dataLocation)).prop('clientWidth');

    let clickX;
    let clickY;

    if (typeof offsetX === "number") {
      if (offsetX === 1) { // left click
        clickX = leftClickPosition - 16;
        clickY = (topClickPosition + (clientHeight / 2)) - 16;
      } else if (offsetX === 1000) { // right click
        clickX = (leftClickPosition + clientWidth) - 16;
        clickY = (topClickPosition + (clientHeight / 2)) - 16;
      }
    } else if (typeof offsetY === "number") {
      if (offsetY === 1) { // top click
        clickX = (leftClickPosition + (clientWidth / 2)) - 16;
        clickY = topClickPosition - 16;
      } else if (offsetY === 1000) { // bottom click
        clickX = (leftClickPosition + (clientWidth / 2)) - 16;
        clickY = (topClickPosition + clientHeight) - 16;
      }
    }

    $("#clickCircle").css("left", clickX).css("top", clickY);
    $("#clickCircle").show().fadeOut(300);

  }





  //CONVERTING TO REFACTOR
  this.clicksCircle = (dataLocation, clickSide) => {

    const leftClickPosition = angular.element(document.getElementById(dataLocation)).prop('offsetLeft');
    const topClickPosition = angular.element(document.getElementById(dataLocation)).prop('offsetTop');
    const clientHeight = angular.element(document.getElementById(dataLocation)).prop('clientHeight');
    const clientWidth = angular.element(document.getElementById(dataLocation)).prop('clientWidth');

    let clickX;
    let clickY;

    if (clickSide == "left") { // left click
      clickX = leftClickPosition - 16;
      clickY = (topClickPosition + (clientHeight / 2)) - 16;
    } else if (clickSide == "right") { // right click
      clickX = (leftClickPosition + clientWidth) - 16;
      clickY = (topClickPosition + (clientHeight / 2)) - 16;
    } else if (clickSide == "top") { // top click
      clickX = (leftClickPosition + (clientWidth / 2)) - 16;
      clickY = topClickPosition - 16;
    } else if (clickSide == "bottom") { // bottom click
      clickX = (leftClickPosition + (clientWidth / 2)) - 16;
      clickY = (topClickPosition + clientHeight) - 16;
    }

    $("#clickCircle").css("left", clickX).css("top", clickY);
    $("#clickCircle").show().fadeOut(300);

  }





  //perform a box fill
  //fn(object)
  this.fill = (thisBox) => {

    //sound effect controller
    let notFilled = true;

    //cache box fill check
    const isThisBoxFillable = ($(".grid[data=" + thisBox.thisBoxLocation + "]").children(".checker").attr("data") == 4);
    const isAdjBoxFillable = ($(".grid[data=" + thisBox.adjBox + "]").children(".checker").attr("data") == 4);

    if ($rootScope.whos_turn % 2 == 0) {

      //the gridboxes w/ the class yourPoint get filled w/ the opponent color
      if (isThisBoxFillable) {
        $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("yourPoint");
        notFilled = false;
      }
      if (isAdjBoxFillable) {
        $(".grid[data=" + thisBox.adjBox + "]").addClass("yourPoint");
        notFilled = false;
      }

      if (isThisBoxFillable || isAdjBoxFillable) {
        //reset the turn so the player that scored can go again
        $rootScope.whos_turn--;
      }

    } else {

      //the gridboxes w/ the class myPoint get filled w/ your color
      if (isThisBoxFillable) {
        $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("myPoint");
        notFilled = false;
      }
      if (isAdjBoxFillable) {
        $(".grid[data=" + thisBox.adjBox + "]").addClass("myPoint");
        notFilled = false;
      }

      if (isThisBoxFillable || isAdjBoxFillable) {
        //reset the turn so the player that scored can go again
        $rootScope.whos_turn--;
      }

    }

    if ($rootScope.gamepPlaySound != 0) {
      if (notFilled) {
        $rootScope.audio.play();
      } else {
        $rootScope.playFill.play();
      }
    }

  };

  //perform line click on appropriate boxes
  //fn(object)
  this.line = (thisBox) => {

    //perform line click on this box
    if (thisBox.thisBoxSideClick === "top") {
      $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("borderTopColor")
    } else if (thisBox.thisBoxSideClick === "right") {
      $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("borderRightColor")
    } else if (thisBox.thisBoxSideClick === "bottom") {
      $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("borderBottomColor")
    } else if (thisBox.thisBoxSideClick === "left") {
      $(".grid[data=" + thisBox.thisBoxLocation + "]").addClass("borderLeftColor")
    }

    if (thisBox.hasAdjBox) {
      if (thisBox.thisBoxSideClick === "top") {
        $(".grid[data=" + thisBox.adjBox + "]").addClass("borderBottomColor")
      } else if (thisBox.thisBoxSideClick === "right") {
        $(".grid[data=" + thisBox.adjBox + "]").addClass("borderLeftColor")
      } else if (thisBox.thisBoxSideClick === "bottom") {
        $(".grid[data=" + thisBox.adjBox + "]").addClass("borderTopColor")
      } else if (thisBox.thisBoxSideClick === "left") {
        $(".grid[data=" + thisBox.adjBox + "]").addClass("borderRightColor")
      }
    }

    //////save the click box as a last box higlight helper
    if (thisBox.thisBoxSideClick === "top") {
      $rootScope.lastBox = {
        location: thisBox.thisBoxLocation,
        class: "borderTopColorDone",
        madeThisSide: true
      }
    } else if (thisBox.thisBoxSideClick === "right") {
      $rootScope.lastBox = {
        location: thisBox.thisBoxLocation,
        class: "borderRightColorDone",
        madeThisSide: true
      }
    } else if (thisBox.thisBoxSideClick === "bottom") {
      $rootScope.lastBox = {
        location: thisBox.thisBoxLocation,
        class: "borderBottomColorDone",
        madeThisSide: true
      }
    } else if (thisBox.thisBoxSideClick === "left") {
      $rootScope.lastBox = {
        location: thisBox.thisBoxLocation,
        class: "borderLeftColorDone",
        madeThisSide: true
      }
    }

    if (thisBox.hasAdjBox) {
      if (thisBox.thisBoxSideClick === "top") {
        $rootScope.lastBox.adjLocation = thisBox.adjBox;
        $rootScope.lastBox.adjClass = "borderBottomColorDone";
        $rootScope.lastBox.madeAdjSide = true;
      } else if (thisBox.thisBoxSideClick === "right") {
        $rootScope.lastBox.adjLocation = thisBox.adjBox;
        $rootScope.lastBox.adjClass = "borderLeftColorDone";
        $rootScope.lastBox.madeAdjSide = true;
      } else if (thisBox.thisBoxSideClick === "bottom") {
        $rootScope.lastBox.adjLocation = thisBox.adjBox;
        $rootScope.lastBox.adjClass = "borderTopColorDone";
        $rootScope.lastBox.madeAdjSide = true;
      } else if (thisBox.thisBoxSideClick === "left") {
        $rootScope.lastBox.adjLocation = thisBox.adjBox;
        $rootScope.lastBox.adjClass = "borderRightColorDone";
        $rootScope.lastBox.madeAdjSide = true;
      }
    }
    /////////////////////////////////////////////////////////

  };

  //return object with box in question and connection boolean
  //fn(number, number)
  this.isConnected = (startLocation, surroundingBox) => {

    var difference = startLocation - surroundingBox;
    let safeBox = {};

    if (difference === 8) {
      safeBox.side = "top";
      safeBox.isConnected = ($(".grid[data=" + startLocation + "]").children("#top").attr("data") === "true");
      return safeBox;
    } else if (difference === -1) {
      safeBox.side = "right";
      safeBox.isConnected = ($(".grid[data=" + startLocation + "]").children("#right").attr("data") === "true");
      return safeBox;
    } else if (difference === -8) {
      safeBox.side = "bottom";
      safeBox.isConnected = ($(".grid[data=" + startLocation + "]").children("#bottom").attr("data") === "true");
      return safeBox;
    } else if (difference === 1) {
      safeBox.side = "left";
      safeBox.isConnected = ($(".grid[data=" + startLocation + "]").children("#left").attr("data") === "true");
      return safeBox;
    }

  }

  //returns true if the location has no lines clicked
  //fn(number)
  this.hasNoLine = (dataLocation) => {

    const hasOneLine = ($(".grid[data=" + dataLocation + "]").children(".checker").attr("data") == 0);
    return hasOneLine;

  }

  //returns true if the location has one line
  //fn(number)
  this.hasOneLine = (dataLocation) => {

    const hasOneLine = ($(".grid[data=" + dataLocation + "]").children(".checker").attr("data") == 1);
    return hasOneLine;

  }

  //returns true if the location has one line
  //fn(number)
  this.hasTwoLines = (dataLocation) => {

    const hasTwoLines = ($(".grid[data=" + dataLocation + "]").children(".checker").attr("data") == 2);
    return hasTwoLines;

  }

  //returns the opposite edge -> top:bottom or right:left
  //fn(string)
  this.findOppositeEdge = (position) => {

    if (position === "topRight") {
      return "right"
    } else if (position === "topLeft") {
      return "left"
    } else if (position === "bottomRight") {
      return "right"
    } else if (position === "bottomeLeft") {
      return "left"
    } else if (position === "rightSide") {
      return "right"
    } else if (position === "leftSide") {
      return "left"
    } else if (position === "topSide") {
      return "top"
    } else if (position === "bottomSide") {
      return "bottom"
    }

  }
  this.findOppositeEdgeOnCorner = (dataLocation) => {

    let sideToClick;

    let topLeftCorner = (dataLocation === 0);
    let topRightCorner = (dataLocation === 7);
    let bottomeLeftCorner = (dataLocation === 56);
    let bottomRightCorner = (dataLocation === 63);

    if (topLeftCorner) {
      let isLeftOpen = ($(".grid[data=" + dataLocation + "]").children("#left").attr("data") === "false");
      let isTopOpen = ($(".grid[data=" + dataLocation + "]").children("#top").attr("data") === "false");
      if (isLeftOpen) {
        sideToClick = "left"
      };
      if (isTopOpen) {
        sideToClick = "top"
      };
    } else if (topRightCorner) {
      let isRightOpen = ($(".grid[data=" + dataLocation + "]").children("#right").attr("data") === "false");
      let isTopOpen = ($(".grid[data=" + dataLocation + "]").children("#top").attr("data") === "false");
      if (isRightOpen) {
        sideToClick = "right"
      };
      if (isTopOpen) {
        sideToClick = "top"
      };
    } else if (bottomeLeftCorner) {
      let isLeftOpen = ($(".grid[data=" + dataLocation + "]").children("#left").attr("data") === "false");
      let isBottomOpen = ($(".grid[data=" + dataLocation + "]").children("#bottom").attr("data") === "false");
      if (isLeftOpen) {
        sideToClick = "left"
      };
      if (isBottomOpen) {
        sideToClick = "bottom"
      };
    } else if (bottomRightCorner) {
      let isRightOpen = ($(".grid[data=" + dataLocation + "]").children("#right").attr("data") === "false");
      let isBottomOpen = ($(".grid[data=" + dataLocation + "]").children("#bottom").attr("data") === "false");
      if (isRightOpen) {
        sideToClick = "right"
      };
      if (isBottomOpen) {
        sideToClick = "bottom"
      };
    }

    return sideToClick;
  }

  //return an object with all open lines and locations
  //fn(number)
  this.findUnclickedLinesAndConnecedBoxes = (dataLocation) => {

    //init return obj
    let openLines = {};

    let position = map.position(dataLocation);
    let surroundingBoxes = map.surroundingBoxes(position, dataLocation);
    let l = surroundingBoxes.length;

    //used to check if the box is around the dataLocation box
    let possibleSurroundingBoxes = [(dataLocation - 8), (dataLocation + 1), (dataLocation + 8), (dataLocation - 1)];

    let associatedPositions = [];

    for (let i = 0; i < l; i++) {

      let positionCheck = possibleSurroundingBoxes.indexOf(surroundingBoxes[i]);

      if (positionCheck != -1) {

        let adjLocation;

        //set adjcent box dataLocation
        if (positionCheck === 0) {
          adjLocation = dataLocation - 8;
        } else if (positionCheck === 1) {
          adjLocation = dataLocation + 1;
        } else if (positionCheck === 2) {
          adjLocation = dataLocation + 8;
        } else if (positionCheck === 3) {
          adjLocation = dataLocation - 1;
        }

        let hasTwoLines = this.hasTwoLines(adjLocation);

        if (hasTwoLines) {
          if (positionCheck === 0) {
            associatedPositions.push("top")
          } else if (positionCheck === 1) {
            associatedPositions.push("right")
          } else if (positionCheck === 2) {
            associatedPositions.push("bottom")
          } else if (positionCheck === 3) {
            associatedPositions.push("left")
          }
        }

      }

    }

    const noNextBoxFound = (associatedPositions.length === 0);

    if (noNextBoxFound) {
      return -1;
    }

    if (associatedPositions.indexOf("top") != -1) {
      let isTopOpen = ($(".grid[data=" + dataLocation + "]").children("#top").attr("data") === "false");
      if (isTopOpen === true) {
        let temp = [possibleSurroundingBoxes[0], "top"];
        openLines.one = temp;
      };
    }
    if (associatedPositions.indexOf("right") != -1) {
      let isRightOpen = ($(".grid[data=" + dataLocation + "]").children("#right").attr("data") === "false");
      if (isRightOpen === true) {
        let temp = [possibleSurroundingBoxes[1], "right"];
        openLines.two = temp;
      };
    }
    if (associatedPositions.indexOf("bottom") != -1) {
      let isBottomOpen = ($(".grid[data=" + dataLocation + "]").children("#bottom").attr("data") === "false");
      if (isBottomOpen === true) {
        let temp = [possibleSurroundingBoxes[2], "bottom"];
        openLines.three = temp;
      };
    }
    if (associatedPositions.indexOf("left") != -1) {
      let isLeftOpen = ($(".grid[data=" + dataLocation + "]").children("#left").attr("data") === "false");
      if (isLeftOpen === true) {
        let temp = [possibleSurroundingBoxes[3], "left"];
        openLines.four = temp;
      };
    }

    return openLines;

  }

  //check to see if the edge an edge box is clicked
  //fn(number, string)
  this.edgeNotClicked = (dataLocation, position) => {

    let sideToCheck;
    let locationOnCorner = (dataLocation === 0 || dataLocation === 7 || dataLocation === 56 || dataLocation === 63);

    if (locationOnCorner) { //check both sides of the corner to see if the line was clicked
      if (position === "topRight") {
        let rightClicked = map.isLineAlreadyCicked(dataLocation, "right");
        let leftClicked = map.isLineAlreadyCicked(dataLocation, "top");
        if (!rightClicked) {
          sideToCheck = "right"
        } else if (!leftClicked) {
          sideToCheck = "top"
        }
      } else if (position === "topLeft") {
        let rightClicked = map.isLineAlreadyCicked(dataLocation, "top");
        let leftClicked = map.isLineAlreadyCicked(dataLocation, "left");
        if (!rightClicked) {
          sideToCheck = "top"
        } else if (!leftClicked) {
          sideToCheck = "left"
        }
      } else if (position === "bottomRight") {
        let rightClicked = map.isLineAlreadyCicked(dataLocation, "right");
        let leftClicked = map.isLineAlreadyCicked(dataLocation, "bottom");
        if (!rightClicked) {
          sideToCheck = "right"
        } else if (!leftClicked) {
          sideToCheck = "bottom"
        }
      } else if (position === "bottomeLeft") {
        let rightClicked = map.isLineAlreadyCicked(dataLocation, "bottom");
        let leftClicked = map.isLineAlreadyCicked(dataLocation, "left");
        if (!rightClicked) {
          sideToCheck = "bottom"
        } else if (!leftClicked) {
          sideToCheck = "left"
        }
      }
    } else { //check only the edge to see if it was clicked
      if (position === "rightSide") {
        sideToCheck = "right"
      } else if (position === "leftSide") {
        sideToCheck = "left"
      } else if (position === "topSide") {
        sideToCheck = "top"
      } else if (position === "bottomSide") {
        sideToCheck = "bottom"
      }
    }

    let isEdgeNotClicked = ($(".grid[data=" + dataLocation + "]").children("#" + sideToCheck).attr("data") === "false");

    return isEdgeNotClicked;

  }

  //return an object with a box number and a click side
  //check for a safe line click -> used when there is at least one boxe with no clicked lines on the board
  this.noLineClick = () => {

    //choose a random box to make computer moves unpredictable
    let startLocation = $filter("randomNumBetween")(0, 64);

    let count = 0;
    //this will set to true and stop the loop if a click box is found
    let found = false;

    //attempt to find a clickable box
    while (count < 64) {

      var hasNoLine = this.hasNoLine(startLocation);
      var hasOneLine = this.hasOneLine(startLocation);

      if (hasNoLine || hasOneLine) {
        //get surrounding boxes and check for a one or to line click
        let position = map.position(startLocation);
        let surroundingBoxes = map.surroundingBoxes(position, startLocation);
        let l = surroundingBoxes.length;

        //help to start checking at a random box
        let checkAt = $filter("randomNumBetween")(0, l);
        let randomLineCount = 0;

        //go through the surrounding boxes to find one with 0 or 1 line clicked
        while (randomLineCount < l) {
          var surBoxHasNoLine = this.hasNoLine(surroundingBoxes[checkAt]);
          var surBoxHasOneLine = this.hasOneLine(surroundingBoxes[checkAt]);
          var box = this.isConnected(startLocation, surroundingBoxes[checkAt]);

          if ((surBoxHasNoLine || surBoxHasOneLine) && !box.isConnected) {

            found = true;
            //create obj to be passed in as a computer move
            let obj = {
              offsetX: "",
              offsetY: "",
              target: {
                attributes: {
                  data: {
                    nodeValue: ""
                  }
                }
              }
            };
            const offsetXValue = $filter("offsetX")(box.side);
            const offsetYValue = $filter("offsetY")(box.side);

            obj.offsetX = offsetXValue;
            obj.offsetY = offsetYValue;
            obj.target.attributes.data.nodeValue = startLocation;

            //place a click indicator on the board
            this.clickCircle(startLocation, offsetXValue, offsetYValue);

            return obj;

          } // end: if( (surBoxHasNoLine || surBoxHasOneLine) && !box.isConnected){

          checkAt++;
          if (checkAt == l) {
            checkAt = 0
          }
          randomLineCount++;
        }

      } // end: if(hasNoLine || hasOneLine){


      if (found === true) {
        break
      }
      startLocation++;
      if (startLocation === 64) {
        startLocation = 0;
      }
      count++;

    } // end: while(count < 64)

    //do a final check on the edges if the loop is about to end
    let boxLocationsOnTheEndge = [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63, 62, 61, 60, 59, 58, 57, 56, 48, 40, 32, 24, 16, 8];
    let edgeLength = 28;
    for (let j = 0; j < 28; j++) {

      //check to see if the edge box has one line
      let edgehasOneLine = this.hasOneLine(boxLocationsOnTheEndge[j]);
      //check to see if the edge has no lines
      let edgehasNoLines = this.hasNoLine(boxLocationsOnTheEndge[j]);
      //check to see if the edge line is clicked
      let position = map.position(boxLocationsOnTheEndge[j]);
      let edgeNotClicked = this.edgeNotClicked(boxLocationsOnTheEndge[j], position); ////fix edge not click to reflect corners too

      if ((edgehasOneLine && edgeNotClicked) || (edgehasNoLines && edgeNotClicked)) {

        //init side to click
        let edgeSide;
        //check to see if side is on a corner
        let locationOnCorner = (boxLocationsOnTheEndge[j] === 0 || boxLocationsOnTheEndge[j] === 7 || boxLocationsOnTheEndge[j] === 56 || boxLocationsOnTheEndge[j] === 63);
        if (locationOnCorner) {
          //find the opposite side check -> this should always be a safe box to pressed
          edgeSide = this.findOppositeEdgeOnCorner(boxLocationsOnTheEndge[j]);
        } else {
          //find the opposite side check -> this should always be a safe box to pressed
          edgeSide = this.findOppositeEdge(position);
        }

        //create obj to be passed in as a computer move
        let obj = {
          offsetX: "",
          offsetY: "",
          target: {
            attributes: {
              data: {
                nodeValue: ""
              }
            }
          }
        };
        const offsetXValue = $filter("offsetX")(edgeSide);
        const offsetYValue = $filter("offsetY")(edgeSide);

        obj.offsetX = offsetXValue;
        obj.offsetY = offsetYValue;
        obj.target.attributes.data.nodeValue = boxLocationsOnTheEndge[j];

        //place a click indicator on the board
        this.clickCircle(boxLocationsOnTheEndge[j], offsetXValue, offsetYValue);

        return obj;
      }

    }

    //return false if no values are found
    return false;

  }

  this.threeLineClick = (dataLocation) => {

    //create obj to be passed in as a computer move
    let obj = {
      offsetX: "",
      offsetY: "",
      target: {
        attributes: {
          data: {
            nodeValue: ""
          }
        }
      }
    };

    //cache obj parameters
    const clickSide = $(".grid[data=" + dataLocation + "]").children(".side[data=false]").attr("id");
    const offsetXValue = $filter("offsetX")(clickSide);
    const offsetYValue = $filter("offsetY")(clickSide);

    obj.offsetX = offsetXValue;
    obj.offsetY = offsetYValue;
    obj.target.attributes.data.nodeValue = dataLocation;

    //place a click indicator on the board
    this.clickCircle(dataLocation, offsetXValue, offsetYValue);

    return obj;

  }



  //CONVERTING TO REFACTOR
  this.noLinesClick = () => {

    //choose a random box to make computer moves unpredictable
    let startLocation = $filter("randomNumBetween")(0, 64);

    let count = 0;
    //this will set to true and stop the loop if a click box is found
    let found = false;

    //attempt to find a clickable box
    while (count < 64) {

      var hasNoLine = this.hasNoLine(startLocation);
      var hasOneLine = this.hasOneLine(startLocation);

      if (hasNoLine || hasOneLine) {
        //get surrounding boxes and check for a one or to line click
        let position = map.position(startLocation);
        let surroundingBoxes = map.surroundingBoxes(position, startLocation);
        let l = surroundingBoxes.length;

        //help to start checking at a random box
        let checkAt = $filter("randomNumBetween")(0, l);
        let randomLineCount = 0;

        //go through the surrounding boxes to find one with 0 or 1 line clicked
        while (randomLineCount < l) {
          var surBoxHasNoLine = this.hasNoLine(surroundingBoxes[checkAt]);
          var surBoxHasOneLine = this.hasOneLine(surroundingBoxes[checkAt]);
          var box = this.isConnected(startLocation, surroundingBoxes[checkAt]);

          if ((surBoxHasNoLine || surBoxHasOneLine) && !box.isConnected) {

            found = true;
            //create obj to be passed in as a computer move
            let obj = {
              target: {
                attributes: {
                  data: {
                    nodeValue: ""
                  }
                }
              }
            };

            obj.target.attributes.data.nodeValue = startLocation;

            //place a click indicator on the board
            this.clickCircle(startLocation, clickSide);

            return obj;

          } // end: if( (surBoxHasNoLine || surBoxHasOneLine) && !box.isConnected){

          checkAt++;
          if (checkAt == l) {
            checkAt = 0
          }
          randomLineCount++;
        }

      } // end: if(hasNoLine || hasOneLine){


      if (found === true) {
        break
      }
      startLocation++;
      if (startLocation === 64) {
        startLocation = 0;
      }
      count++;

    } // end: while(count < 64)

    //do a final check on the edges if the loop is about to end
    let boxLocationsOnTheEndge = [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63, 62, 61, 60, 59, 58, 57, 56, 48, 40, 32, 24, 16, 8];
    let edgeLength = 28;
    for (let j = 0; j < 28; j++) {

      //check to see if the edge box has one line
      let edgehasOneLine = this.hasOneLine(boxLocationsOnTheEndge[j]);
      //check to see if the edge has no lines
      let edgehasNoLines = this.hasNoLine(boxLocationsOnTheEndge[j]);
      //check to see if the edge line is clicked
      let position = map.position(boxLocationsOnTheEndge[j]);
      let edgeNotClicked = this.edgeNotClicked(boxLocationsOnTheEndge[j], position); ////fix edge not click to reflect corners too

      if ((edgehasOneLine && edgeNotClicked) || (edgehasNoLines && edgeNotClicked)) {

        //init side to click
        let edgeSide;
        //check to see if side is on a corner
        let locationOnCorner = (boxLocationsOnTheEndge[j] === 0 || boxLocationsOnTheEndge[j] === 7 || boxLocationsOnTheEndge[j] === 56 || boxLocationsOnTheEndge[j] === 63);
        if (locationOnCorner) {
          //find the opposite side check -> this should always be a safe box to pressed
          edgeSide = this.findOppositeEdgeOnCorner(boxLocationsOnTheEndge[j]);
        } else {
          //find the opposite side check -> this should always be a safe box to pressed
          edgeSide = this.findOppositeEdge(position);
        }

        //create obj to be passed in as a computer move
        let obj = {
          offsetX: "",
          offsetY: "",
          target: {
            attributes: {
              data: {
                nodeValue: ""
              }
            }
          }
        };
        const offsetXValue = $filter("offsetX")(edgeSide);
        const offsetYValue = $filter("offsetY")(edgeSide);

        obj.offsetX = offsetXValue;
        obj.offsetY = offsetYValue;
        obj.target.attributes.data.nodeValue = boxLocationsOnTheEndge[j];

        //place a click indicator on the board
        this.clickCircle(boxLocationsOnTheEndge[j], offsetXValue, offsetYValue);

        return obj;
      }

    }

    //return false if no values are found
    return false;

  }
  this.threeLinesClick = (dataLocation, clickSide) => {

    //create obj to be passed in as a computer move
    let obj = {
      target: {
        attributes: {
          data: {
            nodeValue: ""
          }
        }
      }
    };

    obj.target.attributes.data.nodeValue = dataLocation;

    //place a click indicator on the board
    this.clickCircle(dataLocation, clickSide);

    return obj;

  }






  //go down the path until all boxes are found
  //fn(array)
  this.pathFinder = (objectLengthHelpArgument, openLinesArgument, currentBoxArgument, nextSide) => {

    let tempPath = [];
    let usedBoxes = [];

    tempPath.push(currentBoxArgument);
    usedBoxes.push(currentBoxArgument);

    let keepGoing = true;
    let property = objectLengthHelpArgument[0];
    let nextBox = openLinesArgument[property][0];

    //used only in the case were a middle path box is found first
    if (nextSide) {
      property = objectLengthHelpArgument[1];
      nextBox = openLinesArgument[property][0];
    }

    while (keepGoing) {

      let continuedHasTwoLines = this.hasTwoLines(nextBox);

      if (continuedHasTwoLines) {

        if (tempPath.indexOf(nextBox) != -1) { // this indicates that we are in a closed loop path
          let obj = {};
          obj.tempPath = tempPath;
          obj.usedBoxes = usedBoxes;
          return obj;
        }

        tempPath.push(nextBox);
        usedBoxes.push(nextBox);
        //i++;

        //find the nextBox unclicked lines and the associated box locations
        let openLines = this.findUnclickedLinesAndConnecedBoxes(nextBox);

        //this check is only used in the case were we initially find a middle box
        if (openLines === -1) { // a -1 return indicates that we didn't find a nextBox
          let obj = {};
          obj.tempPath = tempPath;
          obj.usedBoxes = usedBoxes;
          return obj;
        }

        //find the object length
        let objectLengthHelper = Object.keys(openLines);
        let objectLength = objectLengthHelper.length;

        if (objectLength === 1) { // this indicates that we are at the end of the path

          // tempPath.push(openLines.objectLengthHelper[0]);
          // usedBoxes.push(openLines.objectLengthHelper[0]);
          // i++;
          //allPaths.push(tempPath);
          let obj = {};
          obj.tempPath = tempPath;
          obj.usedBoxes = usedBoxes;
          return obj;

          //keepGoing = false;

        } else { // this indicates that the path keeps going

          //if it doesn't have one line it will get pushed into the array when the loop comes back around
          let property = objectLengthHelper[0];
          let property2 = objectLengthHelper[1];
          let location = openLines[property][0];
          let location2 = openLines[property2][0];

          //insert the location that isn't in the usedBoxes array
          if (usedBoxes.indexOf(location) === -1) {
            nextBox = location;
          } else if (usedBoxes.indexOf(location2) === -1) {
            nextBox = location2;
          }

        }

      } else { // this indicates that the next box doesn't belong to a path -> this is a one path box


        tempPath.push(nextBox);
        usedBoxes.push(nextBox);

        let obj = {};
        obj.tempPath = tempPath;
        obj.usedBoxes = usedBoxes;

        keepGoing = false;

      }

    }

  }

  //remove any dupplicate from an array of arrays
  //fn(array)
  this.stripArrayOfArraysDuplicates = (array) => {

    let strippedArray = [];
    const l = array.length;

    for (let i = 0; i < l; i++) {
      let temp = [];
      let insideLen = array[i].length;
      for (let j = 0; j < insideLen; j++) {
        if (temp.indexOf(array[i][j]) != -1) {
          continue
        }
        temp.push(array[i][j]);
      }
      strippedArray.push(temp);
    }

    return strippedArray;

  }

  //returns a sorted array of array by inside array length
  //fn(array)
  this.sortedArrayOfArrayLengths = (array) => {

    let l = array.length;

    let keepChecking = true;

    while (keepChecking) {

      keepChecking = false;

      for (let i = 0; i < l - 1; i++) {

        let greaterThan = (array[i].length > array[i + 1].length);

        if (greaterThan) {
          keepChecking = true;
          let temp = array[i];
          array[i] = array[i + 1];
          array[i + 1] = temp;
        }

      } // end: for

    } // end: while

    return array;

  }

  //get the click object given the allPaths array
  //fn(array)
  this.getClickObj = (allPaths) => {

    //strip all duplicates
    allPaths = this.stripArrayOfArraysDuplicates(allPaths);
    //sort array by length
    allPaths = this.sortedArrayOfArrayLengths(allPaths);

    //get obj parameters
    const dataLocation = allPaths[0][0];
    const clickSide = $(".grid[data=" + dataLocation + "]").children(".side[data=false]").attr("id");
    const offsetXValue = $filter("offsetX")(clickSide);
    const offsetYValue = $filter("offsetY")(clickSide);
    const node = dataLocation;

    //create obj to be passed in as a computer move
    let obj = {
      offsetX: "",
      offsetY: "",
      target: {
        attributes: {
          data: {
            nodeValue: ""
          }
        }
      }
    };
    obj.offsetX = offsetXValue;
    obj.offsetY = offsetYValue;
    obj.target.attributes.data.nodeValue = dataLocation;

    //place a click indicator on the board
    this.clickCircle(dataLocation, offsetXValue, offsetYValue);

    return obj;
    /******************** init computer turn click ********************/

  }

  this.endGame = () => {

    //loop through all boxes to find the paths on the board
    const gridSize = 64;
    let allPaths = [];
    let usedBoxes = [];
    let twoLineArray = [];

    //get the total amount of boxes with 2 lines on them
    for (let j = 0; j < 64; j++) {
      let isTwoLines = ($(".grid[data=" + j + "]").children(".checker").attr("data") == 2);
      if (isTwoLines) {
        twoLineArray.push(j)
      }
    }

    let twoLineArrayLength = twoLineArray.length;

    //this will loop until all boxes are accounted for
    for (let i = 0; i < twoLineArrayLength; i++) {
      //current box to checker
      let currentBox = twoLineArray[i];

      //continue if i is already on a path
      if (usedBoxes.indexOf(currentBox) != -1) {
        continue
      }

      let hasTwoLines = this.hasTwoLines(currentBox);
      if (hasTwoLines) {

        let tempPath = [];
        //add this to usedBoxes
        usedBoxes.push(currentBox);
        //add this to tempPath
        tempPath.push(currentBox);

        //find the boxes unclicked lines and the associated box locations
        let openLines = this.findUnclickedLinesAndConnecedBoxes(currentBox);

        //if the object has a length of 0 push it into the paths array and empty the temp array
        let objectLengthHelper = Object.keys(openLines);
        let objectLength = objectLengthHelper.length;
        if (objectLength === 0) { ///////////////////////////////////////start point: end  ///this is a one box path
          tempPath.push(currentBox);
          allPaths.push(tempPath);
        } else if (objectLength === 1) { ///////////////////////////////////////start point: end
          //if the length equal 1 than this must be an end box
          //push the box into the tempPath and usedBoxes arrays
          //start moving along the path until the next box object length is one or we repeat a value in the usedBoxes array
          //increment i everytime a new value is found

          let obj = this.pathFinder(objectLengthHelper, openLines, currentBox);
          tempPath = obj.tempPath;

          allPaths.push(tempPath);
          let usedBoxesArray = obj.usedBoxes;
          let l = usedBoxesArray.length;

          for (let k = 0; k < l; k++) {
            usedBoxes.push(usedBoxesArray[k]);
          }

        } else if (objectLength === 2) {
          //this means that we have run into a middle box
          //move down one side until either the object length = 1 or we repeat a value in the usedBoxes array
          //if we repeat a value push the array in the allPaths array and exit the if statement
          //if the object length equals one continue to move down the other end of the loop until the object length = 1

          const nextSide = true;
          const obj1 = this.pathFinder(objectLengthHelper, openLines, currentBox);
          const tempPath1 = obj1.tempPath;
          const obj2 = this.pathFinder(objectLengthHelper, openLines, currentBox, nextSide);
          const tempPath2 = obj2.tempPath;

          let totalTempPath = tempPath1.concat(tempPath2);

          allPaths.push(totalTempPath);

          const usedBoxesArray1 = obj1.usedBoxes;
          const usedBoxesArray2 = obj2.usedBoxes;
          let totalUsedBoxesArray = usedBoxesArray1.concat(usedBoxesArray2);

          const l = totalUsedBoxesArray.length;

          for (let k = 0; k < l; k++) {
            usedBoxes.push(totalUsedBoxesArray[k]);
          }

        }

      } // end: if(hasTwoLines)

    } // end: for(let i = 0; i < 64; i++)

    const clickObj = this.getClickObj(allPaths);

    return clickObj;

  }

});

app.service("calc", function($rootScope) {

  this.records = () => {

    if ((localStorage.clickStreak == undefined) || ($rootScope.clickStreakInGame > localStorage.clickStreak)) {
      localStorage.clickStreak = $rootScope.clickStreakInGame - 1;
      $rootScope.clickStreakValue = localStorage.clickStreak;
    }

    if ((localStorage.highestScore == undefined) || ($rootScope.score > localStorage.highestScore)) {
      localStorage.highestScore = $rootScope.score;
      $rootScope.highestScoreValue = localStorage.highestScore;
    }

    if (localStorage.bestFinishTime == undefined) {
      localStorage.bestFinishTime = $(".currentTime").text();
      $rootScope.bestFinishTimeValue = localStorage.bestFinishTime;
    } else if (localStorage.bestMin > parseInt($rootScope.timer_mins)) {
      localStorage.bestFinishTime = $(".currentTime").text();
      $rootScope.bestFinishTimeValue = localStorage.bestFinishTime;
    } else if ((localStorage.bestMin == parseInt($rootScope.timer_mins)) && (localStorage.bestSec > parseInt($rootScope.timer_secs))) {
      localStorage.bestFinishTime = $(".currentTime").text();
      $rootScope.bestFinishTimeValue = localStorage.bestFinishTime;
    }

  }

  this.score = (mins, secs) => {
    let min = parseInt(mins);
    let sec = parseInt(secs);

    if ((min === 2) & (sec >= 40)) {
      $rootScope.score = 300
    } else if ((min === 2) & (sec >= 35)) {
      $rootScope.score = 260
    } else if ((min === 2) & (sec >= 30)) {
      $rootScope.score = 220
    } else if ((min === 2) & (sec >= 25)) {
      $rootScope.score = 190
    } else if ((min === 2) & (sec >= 20)) {
      $rootScope.score = 160
    } else if ((min === 2) & (sec >= 15)) {
      $rootScope.score = 140
    } else if ((min === 2) & (sec >= 10)) {
      $rootScope.score = 120
    } else if ((min === 2) & (sec >= 5)) {
      $rootScope.score = 110
    } else if ((min === 2) & (sec >= 0)) {
      $rootScope.score = 100
    } else if ((min === 1) & (sec >= 55)) {
      $rootScope.score = 95
    } else if ((min === 1) & (sec >= 50)) {
      $rootScope.score = 90
    } else if ((min === 1) & (sec >= 45)) {
      $rootScope.score = 85
    } else if ((min === 1) & (sec >= 40)) {
      $rootScope.score = 80
    } else if ((min === 1) & (sec >= 35)) {
      $rootScope.score = 75
    } else if ((min === 1) & (sec >= 30)) {
      $rootScope.score = 70
    } else if ((min === 1) & (sec >= 25)) {
      $rootScope.score = 65
    } else if ((min === 1) & (sec >= 20)) {
      $rootScope.score = 60
    } else if ((min === 1) & (sec >= 15)) {
      $rootScope.score = 55
    } else if ((min === 1) & (sec >= 10)) {
      $rootScope.score = 50
    } else if ((min === 1) & (sec >= 5)) {
      $rootScope.score = 45
    } else if ((min === 1) & (sec >= 0)) {
      $rootScope.score = 40
    } else if ((min === 0) & (sec >= 55)) {
      $rootScope.score = 30
    } else if ((min === 0) & (sec >= 50)) {
      $rootScope.score = 20
    } else if ((min === 0) & (sec >= 45)) {
      $rootScope.score = 10
    } else if ((min === 0) & (sec >= 40)) {
      $rootScope.score = 5
    } else if ((min === 0) & (sec >= 35)) {
      $rootScope.score = 4
    } else if ((min === 0) & (sec >= 30)) {
      $rootScope.score = 3
    } else if ((min === 0) & (sec >= 25)) {
      $rootScope.score = 2
    } else if ((min === 0) & (sec >= 0)) {
      $rootScope.score = 0
    }

  }
});

app.filter("reset_numbers", function($filter) {
  return function(score) {
    score = parseInt(score);
    score = 0;
    score = $filter("double_digit")(score);
    return score
  }
});

app.filter("surroundingBoxesArray", function() {
  return function(i) {
    var firstColumn = ((0 < i) && (i < 7));
    var lastColumn = ((56 < i) && (i < 63));
    var leftEdge = (i == 8 || i == 16 || i == 24 || i == 32 || i == 40 || i == 48);
    var rightEdge = (i == 15 || i == 23 || i == 31 || i == 39 || i == 47 || i == 55);
    var topLeftCorner = (i == 0);
    var topRightCorner = (i == 7);
    var bottomLeftCorner = (i == 56);
    var bottomRightCorner = (i == 63);

    if (firstColumn) {
      var relativeSideToClick = ["right", "bottom", "left"];
    } else if (lastColumn) {
      var relativeSideToClick = ["top", "right", "left"];
    } else if (leftEdge) {
      var relativeSideToClick = ["top", "right", "bottom"];
    } else if (rightEdge) {
      var relativeSideToClick = ["top", "bottom", "left"];
    } else if (topLeftCorner) {
      var relativeSideToClick = ["right", "bottom"];
    } else if (topRightCorner) {
      var relativeSideToClick = ["bottom", "left"];
    } else if (bottomLeftCorner) {
      var relativeSideToClick = ["top", "right"];
    } else if (bottomRightCorner) {
      var relativeSideToClick = ["top", "left"];
    } else {
      var relativeSideToClick = ["top", "right", "bottom", "left"];
    }

    return relativeSideToClick;
  }
});

app.filter("offsetX", function() {
  return function(clickSide) {
    if (clickSide == "top") {
      var offsetX = "x offset";
    } else if (clickSide == "right") {
      var offsetX = 1000;
    } else if (clickSide == "bottom") {
      var offsetX = "x offset";
    } else if (clickSide == "left") {
      var offsetX = 1;
    }
    return offsetX;
  }
});

app.filter("offsetY", function() {
  return function(clickSide) {
    if (clickSide == "top") {
      var offsetY = 1;
    } else if (clickSide == "right") {
      var offsetY = "y offset";
    } else if (clickSide == "bottom") {
      var offsetY = 1000;
    } else if (clickSide == "left") {
      var offsetY = "y offset";
    }
    return offsetY;
  }
});

app.filter("randomNumBetween", function() {
  return (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
  }
});

app.filter("increment_value", function($timeout) {
  return function(position) {
    var x = $(".grid[data=" + position + "]").children(".checker").attr("data");
    x = parseInt(x);
    x++;
    return x;
  }
});

app.filter("double_digit", function() {
  return function(x) {
    if (parseInt(x) < 10) {
      x = "0" + x;
    } else if (x.length > 2) {
      var l = x.length;
      var x = x.slice(l - 2, l);
    }
    return x;
  };
});

app.filter("find", function() {
  return function($event) {
    var side;
    //cache var to account for the screen size when offsets are compared
    var gameWidth = $("#gameboard").width();
    var gridWidthComparer = gameWidth * 0.125 * 0.7;
    //check the side for a click based off of offset and .grid box size
    if ($event.offsetY < 10) {
      //hightlight corresponding side
      side = "top";
    }
    //if bottom edge is clicked highlight that edge and the edge of the box directly next to it
    if ($event.offsetY > gridWidthComparer) {
      //hightlight corresponding side
      side = "bottom";
    }
    //if right edge is clicked highlight that edge and the edge of the box directly next to it
    if ($event.offsetX > gridWidthComparer) {
      //hightlight corresponding side
      side = "right";
    }
    //if left edge is clicked highlight that edge and the edge of the box directly next to it
    if ($event.offsetX < 10) {
      //hightlight corresponding side
      side = "left";
    }
    ///////////////////////////////////
    if (side == "top") {
      //cache the top box data attr
      var position = $event.target.attributes.data.nodeValue;
      position = parseInt(position);
      var adjPosition = position - 8;
      var object = {
        data: position,
        side: "top",
        adjData: adjPosition,
        adjSide: "bottom"
      };
      return object;
    } else if (side == "right") {
      //cache the right box data attr
      var position = $event.target.attributes.data.nodeValue;
      position = parseInt(position);
      var adjPosition = position + 1;
      var object = {
        data: position,
        side: "right",
        adjData: adjPosition,
        adjSide: "left"
      };
      return object;
    } else if (side == "bottom") {
      //cache the bottom box data attr
      var position = $event.target.attributes.data.nodeValue;
      position = parseInt(position);
      var adjPosition = position + 8;
      var object = {
        data: position,
        side: "bottom",
        adjData: adjPosition,
        adjSide: "top"
      };
      return object;
    } else if (side == "left") {
      //cache the left box data attr
      var position = $event.target.attributes.data.nodeValue;
      position = parseInt(position);
      var adjPosition = position - 1;
      var object = {
        data: position,
        side: "left",
        adjData: adjPosition,
        adjSide: "right"
      };
      return object;
    } else {
      return -1;
    }
  };
});
