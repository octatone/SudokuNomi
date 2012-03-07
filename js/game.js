/**
 * Sudoku game logic
 * Copyright 2012 Raymond May Jr.
 * requires sudoku.js, jstorage
 */

/* defaults settings */
var Settings = {
    difficulty: 'medium',
    show_conflicts: false
};

var Game = {
    difficulties: {test_solved: 1, easy: 20, medium: 40, hard: 60, expert: 70},
    
    grid: {}, user_values: [], game_values: [],
    
    start: function(){
	this.grid = CU.Sudoku.generate();
	var loaded = this.loadState();
	if(loaded){
	    this.grid.rows = this.game_values;
	}else{
	    CU.Sudoku.cull(this.grid, this.difficulties[Settings.difficulty]);
	}
	Display.gameTable();
	if(loaded){
	    /* insert and display stored user values */
	    Display.loadUserValues();
	}
	$('.ending').fadeOut(function(){$(this).remove()});
    },

    solved: function(){
	Display.end();
    },
    
    saveState: function(){
	this.user_values = this.fillRows();
	this.game_values = this.fillRows();

	var $rows = $('.game-row');
        for(var r = 0; r < 9; r++){
            var $row = $($rows[r]);
            var $cells = $row.children('.cell');
            for(var c = 0; c < 9; c++){
                $cell = $($cells[c]);
		var value = parseInt($cell.text());
                if($cell.is('.game-value')){
		    this.game_values[r][c] = value;
                }else if(value > 0){
		    this.user_values[r][c] = value;
		}
            }
        }
	$.jStorage.set('game_values', JSON.stringify(this.game_values));
	$.jStorage.set('user_values', JSON.stringify(this.user_values));
    },

    loadState: function(){
	var _game_values = JSON.parse($.jStorage.get('game_values')) || [];
	var _user_values = JSON.parse($.jStorage.get('user_values')) || [];
	if(_user_values.length > 0){
	    this.user_values = _user_values;
	}else{
	    return false;
	}
	if(_game_values.length > 0){
	    this.game_values = _game_values;
	    return true;
	}else{
	    return false;
	}
    },

    flushState: function(){
	$.jStorage.set('game_values', JSON.stringify([]));
        $.jStorage.set('user_values', JSON.stringify([]));
    },

    /** 
     * return zero-filled grid array 
     * used by saveState
     */
    fillRows: function(){
	var rows = [];
	for(var row = 0; row < 9; row++)
	    {
		var cols = [];
		for(var col = 0; col < 9; col++)
		    cols[col] = 0;
		
		rows[row] = cols;
	    }
	return rows;
    }
}

var Display = {
    /* show game table */
    gameTable: function(){
	$game = $('#game');
	$game.empty();
        var table = $(document.createElement('table'));
        for(var r = 0; r < 9; r++){
            var tr = $(document.createElement('tr')).addClass('game-row');
            for(var c = 0; c < 9; c++){
                var td = $(document.createElement('td')).addClass('cell');
                if(Game.grid.rows[r][c] !== 0){
                    td.html(Game.grid.rows[r][c]).addClass('game-value');
                }
                if(r === 0){
                    td.addClass('first-row');
                }
                if(c === 0){
                    td.addClass('first-col');
                }
                if((c+1) % 3 === 0){
                    td.addClass('mini-right');
                }
                if((r+1) % 3 === 0){
                    td.addClass('mini-bottom');
                }
                tr.append(td);
            }
            table.append(tr);
        }
        $game.append(table);
        Binds.tableBinds();
    },

    loadUserValues: function(){
	for(var r = 0; r < 9; r ++){
	    for(var c = 0; c < 9; c++){
		if(Game.user_values[r][c] > 0){
		    $(this.getCell(c,r)).html(Game.user_values[r][c]);
		    Game.grid.rows[r][c] = Game.user_values[r][c];
		}
	    } 
	}
    },
    
    end: function(){
	var dialog = $(document.createElement('div')).addClass('ending').hide();
	var heading = $(document.createElement('h2')).html('Congradulations!');
	$('body').append(dialog.append(heading).fadeIn());
    },
    
    entryDialog: function(cell){
        var $this = $(cell);
        /* dialog to enter value */
        var dialog = $(document.createElement('div')).addClass('input-dialog').hide();
        var form = $(document.createElement('form')).addClass('input-form');
        var input = $('<input type="text" size="1">').val($this.html()).addClass('input-input');
        dialog.append(form.append(input));
        /* display dialog */
        $('.input-dialog').remove();
        var cords = $this.offset();
        dialog.css('top', (cords.top /*+ $this.height()/2*/));
	dialog.css('left', (cords.left /*+ $this.width()/2*/));
        $('body').append(dialog.fadeTo(200, 0.8));
        $('.input-input').focus();
        $('.input-form').on('submit',function(){
		Binds.inputSubmit();
		Display.killDialog();
		return false;
	    });
    },
    
    killDialog: function(){
	$('.input-dialog').fadeOut(200, function(){$(this).remove()});
    },

    getCellPosition: function(cell){
        var $this = $(cell);
        var $rows = $('.game-row');
        for(var r = 0; r < 9; r++){
            var $row = $($rows[r]);
            var $cells = $row.children('.cell');
            for(var c = 0; c < 9; c++){
                $cell = $($cells[c]);
                if($cell.get(0) == $this.get(0)){
                    return [c,r];
                }
            }
        }
    },
    
    getCell: function(col,row){
	var $rows = $('.game-row');
        for(var r = 0; r < 9; r++){
            var $row = $($rows[r]);
            var $cells = $row.children('.cell');
            for(var c = 0; c < 9; c++){
		$cell = $($cells[c]);
                if(col == c && row == r){
                    return $cell.get(0);
                }
            }
	}
    },

    moveSelect: function(direction){
	var position = [];
	$selected = $('.cell-selected');
	if($selected.length > 0){
	    position = this.getCellPosition($('.cell-selected').get(0));
	}else{
	    position = [0,0];
	}
	/* kill any open dialog */
	this.killDialog();
	switch(direction){
	case 'up':
	    if(position[1] > 0)
		position[1] -= 1;
	    break;
	case 'down':
	    if(position[1] < 8)
		position[1] += 1;
	    break;
	case 'right':
	    if(position[0] < 8)
		position[0] += 1;
	    break;
	case 'left':
	    if(position[0] >0)
		position[0] -= 1;
	    break;
	}
	/* remove prev selection */
	$('.cell-selected').removeClass('cell-selected');
	/* apply new selection */
	$(this.getCell(position[0], position[1])).addClass('cell-selected');
    },

    /* highlight /all/ conflicting cells */
    findConflicts: function(){
        /* remove previous */
        $('.conflict').removeClass('conflict');
	if(Settings.show_conflicts){
	    /* find conflicts */
	    var $rows = $('.game-row');
	    for(var r = 0; r < 9; r++){
		var $row = $($rows[r]);
		var $cells = $row.children('.cell');
		for(var c = 0; c < 9; c++){
		    if(!Game.grid.cellValid(c, r)){
			conflicts = true;
			var $cell = $($cells[c]);
			$cell.addClass('conflict');
		    }
		}
	    }
	}
	/* check if solved */
	if(Game.grid.gridSolved()){
	    Game.solved();
	}
    }
};
    
var Binds = {
    /* binds for after table draw */
    tableBinds: function(){
        $('.cell:not(.game-value)').on('click', function(e){
		Binds.cellClick(this);
	    });
	$(document).off('keydown').on('keydown', function (e) {
		if(!$(e.target).is('#options-wrap') && !$(e.target).is('.input-input')){
		    var keyCode = e.keyCode || e.which, arrow = {left: 37, up: 38, right: 39, down: 40 };
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
			console.log('enter');
			var $selected = $('.cell-selected');
			if($selected.length > 0){
			    Display.entryDialog($selected.get(0));
			}
			return false; /* do not pass enter/return through */
		    }
		    /* enter cell values from the keyboard */
		    if(keyCode > 47 && keyCode < 58){
			var $selected = $('.cell-selected:not(.game-value)');
			if($selected.length > 0){
			    var value = String.fromCharCode(keyCode);
			    var pos = Display.getCellPosition($selected.get(0));
			    Game.grid.setValue(pos[0],pos[1], value);			    
			    $cell.html((value == 0 ? '' : value));
			    Display.findConflicts();
			    Game.saveState();
                        }
		    }
		    
		}
	    });
    },

    optionBinds: function(){
	$('#opt-newpuzzle').on('click', function(){
		Game.flushState();
		Game.start();
	    });
	$('#opt-difficulty').on('change', function(){
		Settings.difficulty = $(this).val();
		Game.flushState();
		Game.start();
		$(this).blur();
	    });
	$('#opt-showhints').on('change', function(){
		Settings.show_conflicts = ($(this).is(':checked') ? true : false);
		Display.findConflicts();
	    });
	$('#opt-printpuzzle').on('click', function(){window.print();});
    },
    
    /* empty cell click */
    cellClick: function(elem){
        $('.cell').removeClass('cell-selected');
        $(elem).addClass('cell-selected');
        Display.entryDialog(elem);
    },
    
    /* cell input */
    inputSubmit: function(){
        var value = $('.input-input').val();
	var $cell = $('.cell-selected');
	var pos = Display.getCellPosition($cell.get(0));
	if(Util.isNumeric(value) && value > 0 && value < 10){
	    Game.grid.setValue(pos[0],pos[1], value);
	    $cell.html(value);
	}else{
	    Game.grid.setValue(pos[0],pos[1], 0);
	    $cell.empty();
	}
	Display.findConflicts();
	Game.saveState();
    }
};

/* run */
$(document).ready(function(){
	Game.start();
	Binds.optionBinds();
});

/* utils */
var Util = {
    /* http://stackoverflow.com/a/1830844/933653 */
    isNumeric: function(n){
	return !isNaN(parseFloat(n)) && isFinite(n);
    }
}