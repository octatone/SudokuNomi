/**
 * Sudoku game logic
 * Copyright 2012 Raymond May Jr.
 * requires sudoku.js, jstorage
 */

var game;

// Main
$(document).ready(function () {

  Game.start();
  Binds.optionBinds();
});

// Default settings
var Settings = {

  difficulty: 'medium',
  show_conflicts: false
};

// The Game
var Game = (function () {

  var difficulties = {

    'test_solved': 1,
    'easy': 20,
    'medium': 40,
    'hard': 55,
    'expert': 64
  };
    
  var grid = {};
  var user_values = [];
  var game_values = [];
  var time_elapsed = '';
  var s_elapsed = 0;
  var timer = null;

  // Start the game
  function start () {

    // Initialize a full internal sudoku grid
    grid = CU.Sudoku.generate();

    // Load previous game, or create a new one
    var loaded = loadState();
    if (loaded) {
      // load previous values into memory
      grid.rows = game_values;
    }
    else {
      // or create a new game by culling full sudoku grid
      CU.Sudoku.cull(grid, difficulties[Settings.difficulty]);
    }

    // Setup display
    Display.gameTable();
    if (loaded) {

      // display stored user values
      Display.loadUserValues();
    }

    // remove ending screen if visible
    Display.hideEnding();

    // Start time elapsed display
    startTimer();
  }

  function startTimer () {

    // reset timer display
    Display.resetTimer();
    
    timer = new Timer();
    timer.start(function (arr) {

      Display.timer(arr[0]);
      time_elapsed = arr[0];
      s_elapsed = Math.floor(arr[1]/1000);
      $.jStorage.set('s_elapsed', JSON.stringify(s_elapsed));
    }, s_elapsed * 1000);
  }

  function stopTimer () {

    if (timer) {

      timer.stop();
    }
  }

  function solved () {

    stopTimer();
    Display.showEnding();
  }
    
  function saveState () {

    user_values = fillRows();
    game_values = fillRows();

    var $rows = $('.game-row');

    for (var r = 0; r < 9; r++) {

      var $row = $($rows[r]);
      var $cells = $row.children('.cell');
      
      for (var c = 0; c < 9; c++) {

        $cell = $($cells[c]);
        var value = parseInt($cell.text(), 10);
        if ($cell.is('.game-value')) {
          
          game_values[r][c] = value;
        }
        else if (value > 0) {

          user_values[r][c] = value;
        }
      }
    }
	
    $.jStorage.set('game_values', JSON.stringify(game_values));
    $.jStorage.set('user_values', JSON.stringify(user_values));
  }

  function loadState () {

    var _game_values = JSON.parse($.jStorage.get('game_values')) || [];
    var _user_values = JSON.parse($.jStorage.get('user_values')) || [];
    
    s_elapsed = 0;
    
    if (_user_values.length > 0) {

      user_values = _user_values;
    }
    else {

      return false;
    }

    if (_game_values.length > 0) {
      
      game_values = _game_values;
    }
    else {

      return false;
    }

    s_elapsed = JSON.parse($.jStorage.get('s_elapsed')) || 0;
    return true;
  }

  function flushState () {

    $.jStorage.set('game_values', JSON.stringify([]));
    $.jStorage.set('user_values', JSON.stringify([]));
    $.jStorage.set('s_elapsed', '0');
  }

  // return zero-filled grid array
  // used by saveState
  function fillRows () {
	 
    var rows = [];

    for (var row = 0; row < 9; row++) {

      var cols = [];
      for (var col = 0; col < 9; col++) {

        cols[col] = 0;
      }
      
      rows[row] = cols;
    }

    return rows;
  }

  return {

    // get access
    'getUserValues': function () {

      return user_values;
    },
    'getTimeElapsed': function () {

      return time_elapsed;
    },

    // public methods
    'flushState': flushState,
    'saveState': saveState,
    'solved': solved,
    'start': start,
    'stopTimer': stopTimer,

    // return internal sudoku grid object
    'getGrid': function () {

      return grid;
    }
  };
}());

var Display = {

  /* show game table */
  'gameTable': function () {

    $game = $('#game');
    $game.empty();

    var $table = $(document.createElement('table'));

    for (var r = 0; r < 9; r++) {
      
      var $tr = $(document.createElement('tr')).addClass('game-row');
      
      for (var c = 0; c < 9; c++) {
        
        var $td = $(document.createElement('td')).addClass('cell');
        if (Game.getGrid().rows[r][c] !== 0) {

          $td.html(Game.getGrid().rows[r][c]).addClass('game-value');
        }
        
        if (r === 0) {

          $td.addClass('first-row');
        }
        
        if (c === 0) {
          
          $td.addClass('first-col');
        }
        
        if ((c+1) % 3 === 0) {

          $td.addClass('mini-right');
        }
        
        if ((r+1) % 3 === 0) {
        
          $td.addClass('mini-bottom');
        }
        
        $tr.append($td);
      }

      $table.append($tr);
    }
    
    $game.append($table);
    Binds.tableBinds();
  },

  'loadUserValues': function () {

    for (var r = 0; r < 9; r ++) {

      for (var c = 0; c < 9; c++) {

        if (Game.getUserValues()[r][c] > 0) {

          $(this.getCell(c,r)).html(Game.getUserValues()[r][c]);
          Game.getGrid().rows[r][c] = Game.getUserValues()[r][c];
        }
      }
    }
  },
    
  'showEnding': function () {

    var dialog = $(document.createElement('div')).addClass('ending').hide();
    var heading = $(document.createElement('h2')).html('Congratulations!');
    var text = $(document.createElement('p')).html('You solved this puzzle in ' + Game.getTimeElapsed());

    dialog.append(heading);
    dialog.append(text);

    var tweet = $(document.createElement('p'));
    var link = $(document.createElement('a')).addClass('button');

    link.attr('href', 'http://twitter.com/home?status=I+finished+a+'+Settings.difficulty+'+sudoku+puzzle+in+'+encodeURI(Game.getTimeElapsed())+'++Try+and+beat+my+time+at+http%3A%2F%2Fsudokunomi.com');
    link.text('Tweet your time!');
    dialog.append(tweet.append(link));

    $('body').append(dialog.fadeIn());
  },

  'hideEnding': function () {

    $('.ending').fadeOut(function () {

      $(this).remove();
    });
  },

  'timer': function (str) {

    $('#timer').text(str);
  },

  'resetTimer': function () {

    this.timer('0:00:00');
  },
    
  'entryDialog': function (cell) {

    var $this = $(cell);

    /* dialog to enter value */
    var dialog = $(document.createElement('div')).addClass('input-dialog').hide();
    var form = $(document.createElement('form')).addClass('input-form');
    var input = $('<input type="text" size="1">').addClass('input-input');
    
    dialog.append(form.append(input));

    /* display dialog */
    $('.input-dialog').remove();
    var cords = $this.offset();
    dialog.css('top', (cords.top /*+ $this.height()/2*/));
    dialog.css('left', (cords.left /*+ $this.width()/2*/));

    $('body').append(dialog.fadeTo(200, 0.8));
    $('.input-input').focus();
    $('.input-form').on('submit', function () {

      return false;
    });

    $('.input-input').on('keydown', function (e) {
		
      var keyCode = e.keyCode || e.which;
      var $selected = $('.cell-selected:not(.game-value)');
      var pos = Display.getCellPosition($selected.get(0));

      if ((keyCode > 47 && keyCode < 58) || (keyCode > 93 && keyCode < 106)) {

        if($selected.length > 0){

          var value = String.fromCharCode((keyCode > 93 ? keyCode - 48 : keyCode));
          Game.getGrid().setValue(pos[0],pos[1], value);
          $this.html((value === 0 ? '' : value));
        }

      }
      else {

        Game.getGrid().setValue(pos[0],pos[1], 0);
        $this.empty();
      }

      Display.killDialog();
      Display.findConflicts();
      Game.saveState();
    });
  },
    
  'killDialog': function () {

    $('.input-dialog').fadeOut(200, function () {

      $(this).remove();
    });
  },

  'getCellPosition': function (cell){

    var $this = $(cell);
    var $rows = $('.game-row');

    for (var r = 0; r < 9; r++) {
      
      var $row = $($rows[r]);
      var $cells = $row.children('.cell');
      for (var c = 0; c < 9; c++) {
        
        $cell = $($cells[c]);

        if ($cell.get(0) == $this.get(0)) {
          
          return [c,r];
        }
      }
    }

    return false;
  },
    
  'getCell': function (col, row) {

    var $rows = $('.game-row');
    for (var r = 0; r < 9; r++) {

      var $row = $($rows[r]);
      var $cells = $row.children('.cell');

      for (var c = 0; c < 9; c++) {

        $cell = $($cells[c]);
        
        if (col == c && row == r){

          return $cell.get(0);
        }
      }
    }

    return false;
  },

  'moveSelect': function (direction) {

    var position = [];

    var $selected = $('.cell-selected');

    if ($selected.length > 0) {

      position = this.getCellPosition($('.cell-selected').get(0));
    }
    else {

      position = [0,0];
    }

    // kill any open dialog
    this.killDialog();
    switch (direction) {

      case 'up':

        if (position[1] > 0) {

          position[1] -= 1;
        }
        break;

      case 'down':

        if (position[1] < 8) {

          position[1] += 1;
        }
        break;

      case 'right':

        if (position[0] < 8) {

          position[0] += 1;
        }
        break;
      
      case 'left':

        if (position[0] >0) {

          position[0] -= 1;
        }
        break;
    }

    // remove prev selection
    $('.cell-selected').removeClass('cell-selected');

    // apply new selection
    $(this.getCell(position[0], position[1])).addClass('cell-selected');
  },

  // highlight /all/ conflicting cells
  'findConflicts': function () {

    // remove previous
    $('.conflict').removeClass('conflict');

    if (Settings.show_conflicts) {

      // find conflicts
      var $rows = $('.game-row');
      for (var r = 0; r < 9; r++) {

        var $row = $($rows[r]);
        var $cells = $row.children('.cell');
        
        for (var c = 0; c < 9; c++) {

          if (!Game.getGrid().cellValid(c, r)) {

            conflicts = true;
            var $cell = $($cells[c]);
            $cell.addClass('conflict');
          }
        }
      }
    }
    
    // check if solved
    if (Game.getGrid().gridSolved()) {

      Game.solved();
    }
  }
};
    
var Binds = {
  
  // binds for after table draw
  'tableBinds': function () {

    var $selected;

    $('.cell:not(.game-value)').on('click', function (e) {

      Binds.cellClick(this);
    });

    $(document).off('keydown').on('keydown', function (e) {

      if (!$(e.target).is('#options-wrap') && !$(e.target).is('.input-input')) {

        var keyCode = e.keyCode || e.which, arrow = {left: 37, up: 38, right: 39, down: 40 };
        var arrows = [37,38,39,40];

        if (arrows.indexOf(keyCode) !== -1) {

          e.preventDefault();
        }

        switch (keyCode) {

          case arrow.left:

            Display.moveSelect('left');
            break;
        
          case arrow.up:

            Display.moveSelect('up');
            break;

          case arrow.right:

            Display.moveSelect('right');
            break;
        
          case arrow.down:

            Display.moveSelect('down');
            break;
        
          case 13:

            $selected = $('.cell-selected');
            if ($selected.length > 0) {

              Display.entryDialog($selected.get(0));
            }
            // do not pass enter/return through
            return false;
        }

        // enter cell values from the keyboard
        if ((keyCode > 47 && keyCode < 58) || (keyCode > 93 && keyCode < 106)) {

          $selected = $('.cell-selected:not(.game-value)');

          if ($selected.length > 0) {

            var value = String.fromCharCode((keyCode > 93 ? keyCode - 48 : keyCode));
            var pos = Display.getCellPosition($selected.get(0));
            Game.getGrid().setValue(pos[0],pos[1], value);
            $cell.html((value === 0 ? '' : value));
            Display.findConflicts();
            Game.saveState();
          }
        }
      }
    });
  },

  'optionBinds': function () {

    $('#opt-newpuzzle').on('click', function () {

      Game.stopTimer();
      Game.flushState();
      Game.start();
    });

    $('#opt-difficulty').on('change', function () {

      Game.stopTimer();
      Settings.difficulty = $(this).val();
      Game.flushState();
      Game.start();
      $(this).blur();
    });

    $('#opt-showhints').on('change', function () {

      Settings.show_conflicts = ($(this).is(':checked') ? true : false);
      Display.findConflicts();
    });

    $('#opt-printpuzzle').on('click', function () {

      window.print();
    });
  },

  // empty cell click
  'cellClick': function (elem) {

    $('.cell').removeClass('cell-selected');
    $(elem).addClass('cell-selected');
    Display.entryDialog(elem);
  }
};

var Timer = function () {

  var start_time = null;
  var id = null;
  var timerCallback = null;
  var self;
  
  function msToDuration (dur) {

    var dur_s = dur / 1000;
    var hours = Math.floor(dur_s / 3600);
    var minutes = Math.floor((dur_s % 3600) / 60);
    var seconds = Math.floor((dur_s % 3600) % 60);
          
    var str = '';
    str += (hours > 0) ? hours + ':' : '0:';
    str += (minutes > 0) ? (minutes < 10 ? '0' + minutes + ':' : minutes + ':') : '00:';
    str += (seconds > 0) ? (seconds < 10 ? '0' + seconds : seconds) : '00';
          
    return str;
  }
      
  function start (callback, offset) {

    stop();

    timerCallback = callback;
    start_time = new Date();
    start_time = start_time - offset;
    id = setInterval(run, 1000);
  }

  function stop () {

    if (id) {

      clearInterval(id);
    }
  }
      
  function run () {

    var now = new Date();
    if (timerCallback) {

      timerCallback([(msToDuration(now - start_time)), (now - start_time)]);
    }
  }

  return {

    'start': start,
    'stop': stop
  };
};

// general utilities
var Util = (function () {

  return {

    /* http://stackoverflow.com/a/1830844/933653 */
    'isNumeric': function (n) {

      return !isNaN(parseFloat(n)) && isFinite(n);
    }
  };
})();