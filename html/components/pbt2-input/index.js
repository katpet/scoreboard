const TeamId = {
  Both: "0",
  Team1: "1",
  Team2: "2"
}
const SeatId = {
  Jammer: "0",
  Blocker1: "1",
  Blocker2: "2",
  Blocker3: "3"
}
const Position = {
  None: "",
  Jammer: "Jammer",
  Blocker: "Blocker"
}
const TimerControl = {
  Start: "Start",
  Stop: "Stop",
  Reset: "Reset" 
}

const Colors = {
  Paused: "white",
  Alert: "crimson",
  Stop: "crimson",
  Inactive: "dimgrey",
  Active: "white",
  Start: "limegreen"
}

function isTrue(value) {
  'use strict';
  if (typeof value === 'boolean') {
    return value;
  } else {
    return String(value).toLowerCase() === 'true';
  }
}

function toTime(k, v) {
  'use strict';
  k = WS._enrichProp(k);
  var isCountDown = isTrue(WS.state['ScoreBoard.CurrentGame.BoxClock(' + k.BoxClock + ').Direction']);
  return _timeConversions.msToMinSecNoZero(v, isCountDown);
}

function createHeader(pageId, teamId, pos) {
  var page = $('#'+pageId);
  var header = $('<div>')
    .attr('data-role', 'header')
    .appendTo(page);
  var btn = $('<a>')
    .attr('href', '#Main')
    .attr('data-direction', 'reverse')
    .attr('data-role', 'button')
    .attr('data-icon', 'ui-icon-arrow-l')
    .attr('data-mini', true)
    .text('Main')
    .appendTo(header);
}

function createBody(pageId) {
  var page = $('#'+pageId);
  $('<div>')
  .addClass('ui-body ui-corner-all ui-grid-solo')
  .appendTo(page);
}

function createPenaltyBoxJammersPage(pageId) {
  createHeader(pageId, TeamId.Both, Position.Jammer);
  createBody(pageId);
  createBoxTimer(pageId, TeamId.Team1, Position.Jammer, SeatId.Jammer);
  createBoxTimer(pageId, TeamId.Team2, Position.Jammer, SeatId.Jammer);
}

function createPenaltyBoxBlockersPage(pageId, teamId) {
  createHeader(pageId, teamId, Position.Blocker);
  createBody(pageId);
  createBoxTimer(pageId, teamId, Position.Blocker, SeatId.Blocker1);
  createBoxTimer(pageId, teamId, Position.Blocker, SeatId.Blocker2);
  createBoxTimer(pageId, teamId, Position.Blocker, SeatId.Blocker3);
}

function createPenaltyBoxBothTeamsPage(pageId) {
  createHeader(pageId, TeamId.Both, Position.None);
  createBody(pageId);
  createBoxTimer(pageId, TeamId.Team1, Position.Blocker, SeatId.Blocker1);
  createBoxTimer(pageId, TeamId.Team1, Position.Blocker, SeatId.Blocker2);
  createBoxTimer(pageId, TeamId.Team1, Position.Blocker, SeatId.Blocker3);
  createBoxTimer(pageId, TeamId.Team1, Position.Jammer, SeatId.Jammer);
  createBoxTimer(pageId, TeamId.Team2, Position.Jammer, SeatId.Jammer);
  createBoxTimer(pageId, TeamId.Team2, Position.Blocker, SeatId.Blocker1);
  createBoxTimer(pageId, TeamId.Team2, Position.Blocker, SeatId.Blocker2);
  createBoxTimer(pageId, TeamId.Team2, Position.Blocker, SeatId.Blocker3);
}

function getSeatTag(pos, seatId) {
  return (pos == Position.Jammer) ? pos : pos+seatId;
}

function createLabel(group, teamId, pos, seatId) {
  var seatTag = getSeatTag(pos,seatId);
  var teamcolor = $('<span>')
    .addClass('Team'+teamId+' Name Color')
    .text('Team 1')
    .appendTo(group);
    var position = $('<span>')
    .addClass('Team'+teamId+' Color')
    .text(' '+pos)
    .appendTo(group);
    var numPenalties = $('<span>')
    .addClass('Team'+teamId+' '+seatTag+' PenaltyCount Color')
    .appendTo(group);
}

function createSkaterNumber(pageId, group, teamId, pos, seatId) {
  if(pos != Position.Jammer) {
    group.addClass('Select');    
    var selectSkater = $('<select>')
    .attr('id', pageId+'Team'+teamId+'SelectBlocker'+seatId)
    .attr('data-mini', true)
    .attr('data-inline', true)
    .attr('data-icon', '')
    .addClass('Select')
    .appendTo(group);
  } else {
    group.addClass('Label');
    var displaySkater = $('<span>')
      .addClass('Team'+teamId+' Color')
      .attr('id', pageId+'Team'+teamId+'DisplayJammer')
      .appendTo(group);
  }  
}

function createTimerButtons(group, teamId, pos, seatId, doMini) {
  var seatTag = getSeatTag(pos,seatId);
  var grid3 = $('<div>')
  .addClass('ui-grid-a')
  .appendTo(group);
  var block3a = $('<div>')
    .addClass('ui-block-a')
    .appendTo(grid3);
  var resetBtn = $('<button>')
    .addClass('Reset Team'+teamId+seatTag)
    .attr('data-role', 'button')
    .text('Reset')
    .appendTo(block3a);
  var block3b = $('<div>')
    .addClass('ui-block-b')
    .appendTo(grid3);
  var startBtn = $('<button>')
    .addClass('Start Team'+teamId+seatTag)
    .text('Start')
    .appendTo(block3b);
  var stopBtn = $('<button>')
    .addClass('Stop Team'+teamId+seatTag)
    .text('Stop')
    .appendTo(block3b);
  if(doMini) {
    resetBtn.attr('data-mini', 'true');
    startBtn.attr('data-mini', 'true');
    stopBtn.attr('data-mini', 'true');
  }
}

function createTimeEditButton(pageId, group, teamId, pos, seatId) {
  var seatTag = getSeatTag(pos,seatId);
  var editBtn = $('<a>')
    .attr('href', '#'+pageId+'EditTimeTeam'+teamId+seatTag)
    .attr('data-role', 'button')
    .attr('data-rel', 'popup')
    .attr('data-mini', 'true')
    .attr('data-icon-pos', 'notext')
    .attr('data-icon', 'ui-icon-edit')
    .attr('data-inline', true)
    .addClass('edit-button')
    .appendTo(group);
    var popup = $('<div>')
    .attr('id', pageId+'EditTimeTeam'+teamId+seatTag)
    .attr('data-role', 'popup')
    .addClass('Popup')
    .appendTo(group);
  var popupList = $('<ul>')
    .attr('id', pageId+'Team'+teamId+seatTag+'Edit')
    .addClass('editTime')
    .append('<li><a href="#">-30</a></li>')
    .append('<li><a href="#">-1</a></li>')
    .append('<li><a href="#">+1</a></li>')
    .append('<li><a href="#">+30</a></li>')
    .appendTo(popup);  
}

function createBoxTimer(pageId, teamId, pos, seatId) {
  var doBoth = (pageId == 'PenaltyBoxBothTeams');

  var page = $('#'+pageId);

  var body = page.find('.ui-body');

  var seatTag = getSeatTag(pos,seatId);
  
  var group = $('<div>')
    .addClass(seatTag+' Time')
    .addClass('ui-block-a')
    .appendTo(body);
  if(!doBoth) {
    group.addClass('Large');
    var grid1 = $('<div>')
      .addClass('ui-grid-a')
      .appendTo(group);
      var block1a = $('<div>')
      .addClass('ui-block-a Label')
      .appendTo(grid1);
      createLabel(block1a, teamId, pos, seatId);
    var block1b = $('<div>')
      .addClass('ui-block-b')
      .appendTo(grid1);
    createSkaterNumber(pageId, block1b, teamId, pos, seatId);
  }

  var grid2 = $('<div>')
    .addClass('ui-grid-b')
    .appendTo(group);
  var block2a = $('<div>')
    .addClass('ui-block-a')
    .appendTo(grid2);
  if(doBoth) {
    var grid2a = $('<div>')
    .addClass('ui-grid-a')
    .appendTo(block2a);
    var block2aa = $('<div>')
    .addClass('ui-block-a')
    .appendTo(grid2a);
    createLabel(block2aa, teamId, pos, seatId);
    var block2ab = $('<div>')
    .addClass('ui-block-b')
    .appendTo(grid2a);
    createSkaterNumber(pageId, block2ab, teamId, pos, seatId);
  }
  var block2b = $('<div>')
    .addClass('ui-block-b')
    .appendTo(grid2);
  var clock = $('<a>')
    .addClass('Time Team'+teamId+seatTag)
    .attr('sbDisplay', 'BoxClock(Team'+teamId+seatTag+').Time')
    .attr('sbModify', 'toTime')
    .appendTo(block2b);
  var block2c = $('<div>')
    .addClass('ui-block-c')
    .appendTo(grid2);
  createTimeEditButton(pageId, block2c, teamId, pos, seatId);

  if(!doBoth) {
      createTimerButtons(group, teamId, pos, seatId, doBoth);
  } else {
      createTimerButtons(block2c, teamId, pos, seatId, doBoth);
  }
  $('<hr>')
    .appendTo(body);
  
  setupTimerButton(pageId, teamId, pos, seatId, TimerControl.Start);
  setupTimerButton(pageId, teamId, pos, seatId, TimerControl.Stop);
  setupTimerButton(pageId, teamId, pos, seatId, TimerControl.Reset);
  setupEditButton(pageId, teamId, pos, seatId);
  setupSkaterNumber(pageId, teamId, pos, seatId);
}

function setupCallbacks() {
  WS.Register(
    [
      'ScoreBoard.CurrentGame.Team(*).AlternateName(operator)',
      'ScoreBoard.CurrentGame.Team(*).UniformColor',
      'ScoreBoard.CurrentGame.Team(*).Name',
    ],
    function (k, v) {
      var teamName = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').AlternateName(operator)'];
      if(teamName == null || teamName == '') {
        teamName = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').UniformColor'];
        if(teamName ==  null || teamName == '') {
          teamName = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').Name'];
        }
      }
      $('.Name.Team' + k.Team).text(teamName);
    }
  );

  WS.Register(
    [
      'ScoreBoard.CurrentGame.Team(*).Color(operator.fg)'
    ],
    function (k, v) {
      $('.Color.Team' + k.Team).css("color", v);
    }
  );

  WS.Register(
    [
      'ScoreBoard.CurrentGame.Team(*).Color(operator.bg)'
    ],
    function (k, v) {
      $('.Color.Team' + k.Team).css("background-color", v);
    }
  );

  WS.Register(
    [
      'ScoreBoard.CurrentGame.BoxClock(*).Time',
      'ScoreBoard.CurrentGame.Team(*).BoxSeat(*).Started',
      'ScoreBoard.CurrentGame.Clock(Jam).Running',
    ],
    function (k, v) {
      console.log(k);
      var running = isTrue(WS.state['ScoreBoard.CurrentGame.BoxClock(' + k.BoxClock + ').Running']);
      if(running) {
        if(v <= 10000) {
          $('.Time.'+k.BoxClock).css('color', Colors.Alert);
        } else {
          $('.Time.'+k.BoxClock).css('color', Colors.Active);
        }
      } else if(k.BoxClock) {
        var jamrunning = isTrue(WS.state['ScoreBoard.CurrentGame.Clock(Jam).Running']);
        var team = k.BoxClock.startsWith('Team2') ? 2 : 1;
        var pos = '';
        for(const p of ["Jammer", "Blocker1", "Blocker2", "Blocker3"]) {
          if(k.BoxClock.endsWith(p)) {
            pos = p;
          }
        }

        var started = isTrue(WS.state['ScoreBoard.CurrentGame.Team('+team+').BoxSeat('+ pos+').Started']);
        if(!jamrunning && started) {
          // indicate a clock that is paused between jams so it's clearer it'll start back up on next jam
          $('.Time.'+k.BoxClock).css('color', Colors.Paused);
        }
      } else if(k.BoxSeat) {
        if(v) {
          $('.Time.Team' + k.Team + k.BoxSeat).css('color', Colors.Paused);
          var jamrunning = isTrue(WS.state['ScoreBoard.CurrentGame.Clock(Jam).Running']);
          if(!jamrunning) {
            $('.BoxTimerPage button.Team'+k.Team + k.BoxSeat+'.Start').prop("disabled", true);
          }
        } else {
          $('.Time.Team' + k.Team + k.BoxSeat).css('color', Colors.Inactive);
          $('.BoxTimerPage button.Team'+k.Team + k.BoxSeat+'.Start').prop("disabled", false);
        }
      }
    }
  );

  WS.Register(
    [
      'ScoreBoard.CurrentGame.BoxClock(*).Running',
      'ScoreBoard.CurrentGame.Clock(Jam).Running',
      'ScoreBoard.CurrentGame.Team(*).BoxSeat(*).Started',
    ],
    function (k, v) {
      var running = isTrue(WS.state['ScoreBoard.CurrentGame.BoxClock(' + k.BoxClock + ').Running']);
      if(k.BoxClock == null) {
        return;
      }
      if(running) {
        $('.BoxTimerPage button.'+k.BoxClock+'.Stop').show();
        $('.BoxTimerPage button.'+k.BoxClock+'.Start').hide();
        $('.BoxTimerPage button.'+k.BoxClock+'.Reset').prop("disabled", true);
        $('.Time.'+k.BoxClock).css('color', Colors.Active);
      } else {
        $('.BoxTimerPage button.'+k.BoxClock+'.Stop').hide();
        $('.BoxTimerPage button.'+k.BoxClock+'.Start').show();
        $('.BoxTimerPage button.'+k.BoxClock+'.Start').prop("disabled", false);        
        $('.BoxTimerPage button.'+k.BoxClock+'.Reset').prop("disabled", false);

        var jamrunning = isTrue(WS.state['ScoreBoard.CurrentGame.Clock(Jam).Running']);
        var team = k.BoxClock.startsWith('Team2') ? 2 : 1;
        var pos = '';

        for(const p of ["Jammer", "Blocker1", "Blocker2", "Blocker3"]) {
          if(k.BoxClock.endsWith(p)) {
            pos = p;
          }
        }
        var started = isTrue(WS.state['ScoreBoard.CurrentGame.Team('+team+').BoxSeat('+pos+').Started']);
        if(started) {
          $('.Time.'+k.BoxClock).css('color', Colors.Paused);
          if(!jamrunning) {
            $('.BoxTimerPage button.'+k.BoxClock+'.Start').prop("disabled", true);
          }
        } else {
          $('.Time.'+k.BoxClock).css('color', Colors.Inactive);
          $('.BoxTimerPage button.'+k.BoxClock+'.Start').prop("disabled", false);          
        }
     }
    }
  );

  WS.Register(
    [
      'ScoreBoard.CurrentGame.Team(*).Skater(*).Role',
    ],
    function (k, v) {
      if(v == Position.Jammer) {
        var selectId = $('#PenaltyBoxJammersTeam'+k.Team+'DisplayJammer,#PenaltyBoxBothTeamsTeam'+k.Team+'DisplayJammer');
        var skaterNumber = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').Skater(' + k.Skater + ').RosterNumber'];
        selectId.text(skaterNumber);
      }
    }
  );

  
  WS.Register(
    [
      'ScoreBoard.CurrentGame.Team(*).BoxSeat(*).BoxSkaterPenalties',
    ],
  function (k, v) {
    var sel = $('.Team'+k.Team+'.'+k.BoxSeat+'.PenaltyCount');
    if(sel.length) {
      if(v > 0) {
        sel.text(' ('+v+')');
      } else {
        sel.text('');
      }
    }
  }
);

WS.Register([
  'ScoreBoard.CurrentGame.Rule(Penalties.Duration)',
],
  function(k, v) {
    // Edit the popup that allows adding/removing time to match penalty duration rule
    var sel = $('.editTime');
    if(sel.length && v) {

      // Convert from format like 0:30 or 1:00 to seconds,
      // which appears in menu like '+30', '-30' or '+60', '-60'
      var toks = v.split(':');
      var secs = '30';
      if(toks.length == 2) {
        if(toks[0] == '0') {
          secs = toks[1];
        } else {
          var s = parseInt(toks[0])*60 + parseInt(toks[1]);
          secs = s.toString();
        }
      } else if(toks.length == 1) {
        secs = toks[0];
      }

      var plusPenaltyEl = sel.find('li:nth-child(1) a');
      plusPenaltyEl.text('-'+secs);

      var minusPenaltyEl = sel.find('li:nth-child(4) a');
      minusPenaltyEl.text('+'+secs);
    }
  }
);

WS.Register(
  [
    'ScoreBoard.CurrentGame.Team(*).Skater(*).RosterNumber',
    'ScoreBoard.CurrentGame.Team(*).Skater(*).Role',
  ],
    function (k, v) {
      var number = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').Skater(' + k.Skater + ').RosterNumber'];
      var role = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').Skater(' + k.Skater + ').Role'];
      var roleTag = (role !== "Bench" && role !== "") ? ('  - '+role.charAt(0)) : "";
      var pageIds = ['PenaltyBoxTeam'+k.Team+'Blockers', 'PenaltyBoxBothTeams'];
      for(const idx in pageIds) {
        var pageId = pageIds[idx];
        for(var i=1; i <= 3; i++ ) {
          var selectId = '#'+pageId+'Team'+k.Team+'SelectBlocker'+i;
          var entry = selectId+' option[value="' + number+'"]';
          if($(entry).length == 0)
          {
            $(selectId).append($('<option>', {value: number, text: number + roleTag}));
            var options = $(selectId + ' option');
            $(selectId).empty();
        
            options.sort(function(a,b) {
                if (a.text > b.text) return 1;
                if (a.text < b.text) return -1;
                return 0;
            });

            $(selectId).append( options );

            var selectedSkater = WS.state['ScoreBoard.CurrentGame.Team(' + k.Team + ').BoxSeat(Blocker'+ i +').BoxSkater'];          
            if(selectedSkater != null && selectedSkater !== "") {
              $(selectId).val(selectedSkater).trigger('change');
            }
          }
          else
          {
            $(entry).text( number + roleTag );
          }
        }
      }
    }
  );

  WS.Register(
    [
      'ScoreBoard.CurrentGame.Team(*).BoxSeat(*).BoxSkater',
    ],
    function (k, v) {
      if(k.BoxSeat != Position.Jammer) {
        var selectId = '#PenaltyBoxBothTeamsTeam'+k.Team+'Select'+k.BoxSeat+',#PenaltyBoxTeam'+k.Team+'BlockersTeam'+k.Team+'Select'+k.BoxSeat;
        $(selectId).val(v);
        if(v == "") {
          $(selectId+' option[value=""]').prop('selected', 'selected').change();
        } else {
          $(selectId).val(v).trigger('change');
        }
      }
    }
  );  
}

function setupButtonsStyle() {
  $('.BoxTimerPage button.Start').css('background-color', Colors.Start);
  $('.BoxTimerPage button.Start').css('color', Colors.Active);
  $('.BoxTimerPage button.Stop').css('background-color', Colors.Stop);
  $('.BoxTimerPage button.Stop').css('color', Colors.Active);
  $('.BoxTimerPage button.Reset').css('background-color', Colors.Inactive);
  $('.BoxTimerPage button.Reset').css('color', Colors.Active);  
}

function setupEditButton(pageId, teamId, pos, seatId) {
  var seatTag = getSeatTag(pos, seatId);
  $('#'+pageId+'Team'+teamId+seatTag+'Edit li a').on('click', function(e) {
    var value = $(this).text();
    WS.Set('ScoreBoard.CurrentGame.Team('+teamId+').BoxSeat('+seatTag+').BoxTimeChange', value);
    var sel = $('#'+pageId+'EditTimeTeam'+teamId+seatTag);
    if(sel.length) {
      sel.popup('close');
    }
  })
}

function setupTimerButton(pageId, teamId, pos, seatId, op) {
  var seatTag = getSeatTag(pos, seatId);
  $('#'+pageId+' button.Team'+teamId+seatTag+'.'+op).on('click', function () {
    WS.Set('ScoreBoard.CurrentGame.Team('+teamId+').BoxSeat('+seatTag+').'+op+'Box', true);
  });
}

function setupSkaterNumber(pageId, teamId, pos, seatId) {
  var doBoth = (pageId == 'PenaltyBoxBothTeams'); 
  var seatTag = getSeatTag(pos, seatId);
  var defaultSel = "Skater #";

  if(pos == Position.Jammer) {
    return;
  }
  var sel = $('#'+pageId+'Team'+teamId+'SelectBlocker'+seatId);
  sel.children().remove();
  sel.append($('<option value="" selected hidden>'+defaultSel+'</option>'));
  sel.change(function() { 
    var value = $(this).val();
    if(value != null && value !== "") {
      WS.Set('ScoreBoard.CurrentGame.Team('+teamId+').BoxSeat('+seatTag+').BoxSkater', value);
    }
  });

}
