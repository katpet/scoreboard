function prepareSkSheetTable(element, gameId, teamId, mode) {
  /* Values supported for mode:
   * operator: In-game mode with most recent jam at the top
   * edit: Layout as in the statsbook with all edit controls enabled
   * copyToStatsbook: Only cells that have to be manually typed in a WFTDA statsbook for the given period, except No Pivot
   */

  'use strict';
  $(initialize);

  var teamName = '';

  var isReverse = mode === 'operator';

  // Looking these up via the DOM is slow, so cache them.
  var periodElements = {};
  var jamElements = {};
  var timeoutElements = {};

  var skaterSelect = $('<select>').addClass('skaterSelect EditOnly').append($('<option>').attr('value', '').text('?'));

  function initialize() {
    if (mode !== 'operator') {
      WS.Register(['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').Name'], function () {
        teamNameUpdate();
      });
      WS.Register(['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').UniformColor'], function () {
        teamNameUpdate();
      });
      WS.Register(['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').AlternateName(operator)'], function () {
        teamNameUpdate();
      });

      WS.Register(['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').Color'], function (k, v) {
        element.find('#head').css('background-color', WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').Color(operator_bg)']);
        element.find('#head').css('color', WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').Color(operator_fg)']);
      });
    }

    WS.Register(
      [
        'ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').Skater(*).RosterNumber',
        'ScoreBoard.Game(' + gameId + ').Team(*).Skater(*).Role',
      ],
      function (k, v) {
        var objects = element.find('.skaterSelect').add(skaterSelect);
        $.each(jamElements, function () {
          $.each(this, function () {
            objects = objects.add(this[1].find('.skaterSelect'));
          });
        });
        objects.children('[value="' + k.Skater + '"]').remove();
        var prefix = 'ScoreBoard.Game(' + gameId + ').Team(' + k.Team + ').Skater(' + k.Skater + ').';
        if (v != null && WS.state[prefix + 'Role'] !== 'NotInGame') {
          var number = WS.state[prefix + 'RosterNumber'];
          var option = $('<option>').attr('number', number).val(k.Skater).text(number);
          objects.each(function () {
            var dropdown = $(this);
            _windowFunctions.appendAlphaSortedByAttr(dropdown, option.clone(), 'number', 1);
            dropdown.val(dropdown.parent().attr('uid'));
          });
        }
      }
    );

    WS.Register(
      [
        'ScoreBoard.Game(' + gameId + ').Period(*).Number',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).Number',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).StarPass',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).Overtime',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).InjuryContinuation',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).WalltimeStart',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).WalltimeEnd',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').AfterSPScore',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Calloff',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').JamScore',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Injury',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Lead',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Lost',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').NoInitial',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').StarPass',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').TotalScore',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').OsOffset',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').OsOffsetReason',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Fielding(Jammer).Skater',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Fielding(Pivot).Skater',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Fielding(Jammer).SkaterNumber',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').Fielding(Pivot).SkaterNumber',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).AfterSP',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).Current',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).Score',
        'ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).Annotation',
      ],
      handleUpdate
    );

    WS.Register('ScoreBoard.Game(' + gameId + ').Period(*).Timeout(*)', handleTimeoutUpdate);
  }

  function teamNameUpdate() {
    teamName = WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').Name'];

    if (
      WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').UniformColor'] != null &&
      WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').UniformColor'] !== ''
    ) {
      teamName = WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').UniformColor'];
    }

    if (WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').AlternateName(operator)'] != null) {
      teamName = WS.state['ScoreBoard.Game(' + gameId + ').Team(' + teamId + ').AlternateName(operator)'];
    }

    element.find('#head .Team').text(teamName);
  }

  function handleUpdate(k, v) {
    // Ensure periods/jams exist.
    if (!k.Period || k.Period === 0) {
      return;
    }
    if (v == null && k == 'ScoreBoard.Game(' + gameId + ').Period(' + k.Period + ').Number') {
      element.children('table.Period[nr=' + k.Period + ']').remove();
      delete periodElements[k.Period];
      delete jamElements[k.Period];
      delete timeoutElements[k.Period];
    } else if (v != null) {
      createPeriod(k.Period);
    }
    if (!k.Jam || k.Jam === 0 || jamElements[k.Period] == null) {
      return;
    }
    var prefix = 'ScoreBoard.Game(' + gameId + ').Period(' + k.Period + ').Jam(' + k.Jam + ').';
    if (v == null && k == prefix + 'Number') {
      element
        .children('table.Period[nr=' + k.Period + ']')
        .find('tr[nr=' + k.Jam + ']')
        .remove();
      delete jamElements[k.Period][k.Jam];
    } else if (v != null) {
      createJam(k.Period, k.Jam);
    }

    var je = (jamElements[k.Period] || {})[k.Jam];
    if (je == null) {
      return;
    }
    var jamRow = je[0];
    var spRow = je[1];
    var editRow = je[2];
    var editRow2 = je[3];
    if (k == prefix + 'StarPass') {
      if (isTrue(v)) {
        if (isReverse) {
          jamRow.before(spRow);
        } else {
          jamRow.after(spRow);
        }
      } else {
        spRow.detach();
      }
    } else if (k == prefix + 'Overtime') {
      jamRow.toggleClass('Overtime', isTrue(v));
    } else if (k == prefix + 'InjuryContinuation') {
      var nrText = k.Jam;
      if (isTrue(v)) {
        nrText = 'INJ' + (isTrue(WS.state[prefix + 'TeamJam(' + teamId + ').Lead']) ? '*' : '');
      }
      jamRow.find('.JamNumber').text(nrText);
    } else if (k.field === 'JamScore' || k.field === 'OsOffset' || k.field === 'WalltimeStart' || k.field === 'WalltimeEnd') {
      var isRunning = WS.state[prefix + 'WalltimeEnd'] === 0 && WS.state[prefix + 'WalltimeStart'] > 0;
      var hasPoints =
        WS.state[prefix + 'TeamJam(1).JamScore'] + WS.state[prefix + 'TeamJam(1).OsOffset'] != 0 ||
        WS.state[prefix + 'TeamJam(2).JamScore'] + WS.state[prefix + 'TeamJam(2).OsOffset'] != 0;
      editRow.find('.RemoveJam').toggleClass('Hide', isRunning || hasPoints);
      editRow.find('.NoRemoveJamPoints').toggleClass('Hide', !hasPoints);
      editRow.find('.NoRemoveJamRunning').toggleClass('Hide', !isRunning || hasPoints);
    }

    // Everything after here is team specific.
    if (k.TeamJam != teamId) {
      return;
    }
    prefix = prefix + 'TeamJam(' + teamId + ').';
    var row = jamRow;
    var otherRow = spRow;
    switch (k.substring(prefix.length)) {
      case 'Fielding(Jammer).SkaterNumber':
        jamRow.find('.Jammer>span').text(v);
        break;
      case 'Fielding(Jammer).Skater':
        jamRow.find('.Jammer').attr('uid', v);
        jamRow.find('.Jammer>select').val(v);
        break;
      case 'Lost':
        jamRow.find('.Lost').text(isTrue(v) ? 'X' : '');
        break;
      case 'Lead':
        jamRow.find('.Lead').text(isTrue(v) ? 'X' : '');
        if (isTrue(WS.state['ScoreBoard.Game(' + gameId + ').Period(' + k.Period + ').Jam(' + k.Jam + ').InjuryContinuation'])) {
          jamRow.find('.JamNumber').text('INJ' + (isTrue(v) ? '*' : ''));
        }
        break;

      case 'JamScore':
      case 'AfterSPScore':
      case 'TotalScore':
        if (mode !== 'copyToStatsbook') {
          jamRow.find('.JamTotal').text(WS.state[prefix + 'JamScore'] - WS.state[prefix + 'AfterSPScore']);
          spRow.find('.JamTotal').text(WS.state[prefix + 'AfterSPScore']);
          jamRow.find('.GameTotal').text(WS.state[prefix + 'TotalScore'] - WS.state[prefix + 'AfterSPScore']);
          spRow.find('.GameTotal').text(WS.state[prefix + 'TotalScore']);
        }
        break;

      case 'OsOffset':
      case 'OsOffsetReason':
        if (mode !== 'copyToStatsbook') {
          jamRow
            .find('.JamTotal')
            .toggleClass('hasAnnotation', WS.state[prefix + 'OsOffset'] !== 0 || WS.state[prefix + 'OsOffsetReason'] !== '')
            .toggleClass('clickMe', WS.state[prefix + 'OsOffset'] !== 0 && WS.state[prefix + 'OsOffsetReason'] === '');
        }
        break;

      case 'Calloff':
      case 'Injury':
      case 'StarPass':
      case 'Fielding(Pivot).SkaterNumber':
      case 'Fielding(Pivot).Skater':
        if (isTrue(WS.state[prefix + 'StarPass'])) {
          row = spRow;
          otherRow = jamRow;
          editRow2.addClass('HasSP');
          spRow.removeClass('IgnoreEdit');
        } else {
          editRow2.removeClass('HasSP');
          spRow.addClass('IgnoreEdit');
        }
        row.find('.Calloff').text(isTrue(WS.state[prefix + 'Calloff']) ? 'X' : '');
        row.find('.Injury').text(isTrue(WS.state[prefix + 'Injury']) ? 'X' : '');
        otherRow.find('.Calloff').text('');
        otherRow.find('.Injury').text('');
        spRow.find('.JamNumber').text(isTrue(WS.state[prefix + 'StarPass']) ? 'SP' : 'SP*');
        spRow.find('.Jammer>span').text(isTrue(WS.state[prefix + 'StarPass']) ? WS.state[prefix + 'Fielding(Pivot).SkaterNumber'] : '');
        spRow.find('.Jammer').attr('uid', WS.state[prefix + 'Fielding(Pivot).Skater']);
        spRow.find('.Jammer>select').val(WS.state[prefix + 'Fielding(Pivot).Skater']);
        break;

      case 'ScoringTrip(1).AfterSP':
      case 'ScoringTrip(1).Score':
      case 'ScoringTrip(1).Annotation':
      case 'ScoringTrip(2).AfterSP':
      case 'ScoringTrip(2).Score':
      case 'ScoringTrip(2).Annotation':
      case 'ScoringTrip(2).Current':
      case 'NoInitial':
        var trip1Score = WS.state[prefix + 'ScoringTrip(1).Score'];
        var trip1AfterSP = isTrue(WS.state[prefix + 'ScoringTrip(1).AfterSP']);
        var trip1HasAnnotation = (WS.state[prefix + 'ScoringTrip(1).Annotation'] || '') !== '';
        var trip2Score = WS.state[prefix + 'ScoringTrip(2).Score'];
        var trip2Current = isTrue(WS.state[prefix + 'ScoringTrip(2).Current']);
        var trip2AfterSP = isTrue(WS.state[prefix + 'ScoringTrip(2).AfterSP']);
        var trip2HasAnnotation = trip2Score != null && (WS.state[prefix + 'ScoringTrip(2).Annotation'] || '') !== '';
        var noInitial = isTrue(WS.state[prefix + 'NoInitial']);
        var scoreText = '';
        var otherScoreText = '';
        if (trip2Score === 0 && trip2Current) {
          trip2Score = '.';
        }
        if (trip1Score > 0) {
          if (trip2Score == null) {
            scoreText = trip1Score + ' + NI';
          } else if (trip1AfterSP === trip2AfterSP) {
            scoreText = trip1Score + ' + ' + trip2Score;
          } else {
            scoreText = trip2Score;
            otherScoreText = trip1Score + ' + SP';
          }
        } else if (trip2Score != null) {
          scoreText = trip2Score;
        }
        if (trip2AfterSP || (trip2Score == null && trip1AfterSP)) {
          row = spRow;
          otherRow = jamRow;
        }
        row
          .find('.Trip2')
          .toggleClass('hasAnnotation', trip2HasAnnotation)
          .toggleClass('Used', trip2Score != null)
          .removeClass('OtherUsed')
          .children('span')
          .text(scoreText);
        otherRow
          .find('.Trip2')
          .removeClass('hasAnnotation')
          .toggleClass('OtherUsed', trip2Score != null)
          .removeClass('Used')
          .children('span')
          .text(otherScoreText);
        jamRow
          .find('.NoInitial')
          .toggleClass('hasAnnotation', trip1HasAnnotation && !trip1AfterSP)
          .toggleClass('Used', !trip1AfterSP)
          .text(trip1AfterSP || noInitial ? 'X' : '');
        spRow
          .find('.NoInitial')
          .toggleClass('hasAnnotation', trip1HasAnnotation && trip1AfterSP)
          .toggleClass('Used', trip1AfterSP)
          .text(trip1AfterSP && noInitial ? 'X' : '');
        break;

      default:
        if (k.parts[5] === 'ScoringTrip' && k.ScoringTrip >= 3 && k.ScoringTrip < 10) {
          var trip = k.ScoringTrip;
          if (isTrue(WS.state[prefix + 'ScoringTrip(' + trip + ').AfterSP'])) {
            row = spRow;
            otherRow = jamRow;
          }
          var score = WS.state[prefix + 'ScoringTrip(' + trip + ').Score'];
          var current = isTrue(WS.state[prefix + 'ScoringTrip(' + trip + ').Current']);
          var hasAnnotation = (WS.state[prefix + 'ScoringTrip(' + trip + ').Annotation'] || '') !== '';
          row
            .find('.Trip' + trip)
            .toggleClass('hasAnnotation', hasAnnotation)
            .toggleClass('Used', score != null)
            .removeClass('OtherUsed')
            .children('span')
            .text(score == null ? '' : current && score === 0 ? '.' : score);
          otherRow
            .find('.Trip' + trip)
            .removeClass('hasAnnotation')
            .toggleClass('OtherUsed', score != null)
            .removeClass('Used')
            .children('span')
            .text('');
        } else if (k.parts[5] === 'ScoringTrip' && k.ScoringTrip >= 10) {
          var scoreBeforeSP = '';
          var scoreAfterSP = '';
          var t = 10;
          var annotationBeforeSP = false;
          var annotationAfterSP = false;
          while (true) {
            var tripScore = WS.state[prefix + 'ScoringTrip(' + t + ').Score'];
            if (tripScore == null) {
              break;
            }
            if (isTrue(WS.state[prefix + 'ScoringTrip(' + t + ').AfterSP'])) {
              scoreAfterSP = scoreAfterSP === '' ? tripScore : scoreAfterSP + ' + ' + tripScore;
              annotationAfterSP = annotationAfterSP || (WS.state[prefix + 'ScoringTrip(' + t + ').Annotation'] || '') !== '';
            } else {
              scoreBeforeSP = scoreBeforeSP === '' ? tripScore : scoreBeforeSP + ' + ' + tripScore;
              annotationBeforeSP = annotationBeforeSP || (WS.state[prefix + 'ScoringTrip(' + t + ').Annotation'] || '') !== '';
            }
            t++;
          }
          jamRow.find('.Trip10').toggleClass('hasAnnotation', annotationBeforeSP).children('span').text(scoreBeforeSP);
          spRow.find('.Trip10').toggleClass('hasAnnotation', annotationAfterSP).children('span').text(scoreAfterSP);
        }
    }
  }

  function handleTimeoutUpdate(k, v) {
    // Ensure period/timeout exist.
    if (!k.Period || k.Period === 0) {
      return;
    } else if (v != null) {
      createPeriod(k.Period);
    }
    if (!k.Timeout || k.Timeout === 0 || timeoutElements[k.Period] == null) {
      return;
    }
    var prefix = 'ScoreBoard.Game(' + gameId + ').Period(' + k.Period + ').Timeout(' + k.Timeout + ').';
    if (v == null && k == prefix + 'Id') {
      element
        .children('table.Period[nr=' + k.Period + ']')
        .find('tr[to=' + k.Timeout + ']')
        .remove();
      delete timeoutElements[k.Period][k.Timeout];
      return;
    } else if (v == null) {
      return;
    }

    createTimeout(k.Period, k.Timeout);
    var te = (timeoutElements[k.Period] || {})[k.Timeout];
    if (te == null) {
      return;
    }
    var toRow = te[0];
    var editRow = te[1];

    switch (k.field) {
      case 'PrecedingJamNumber':
      case 'WalltimeStart':
        var jamNo = WS.state[prefix + 'PrecedingJamNumber'];
        var startTime = WS.state[prefix + 'WalltimeStart'];
        toRow.attr('time', startTime).detach();
        editRow.attr('time', startTime).detach();
        createJam(k.Period, jamNo);
        var rowBefore = jamElements[k.Period][jamNo][3];
        var rowAfter = isReverse ? rowBefore.prev() : rowBefore.next();
        while (rowAfter.hasClass('Timeout') && rowAfter.attr('time') < startTime) {
          rowBefore = rowAfter;
          rowAfter = isReverse ? rowBefore.prev() : rowBefore.next();
        }
        if (isReverse) {
          rowBefore.before(toRow);
          toRow.before(editRow);
        } else {
          rowBefore.after(toRow);
          toRow.after(editRow);
        }
        break;
      case 'Owner':
      case 'Review':
        toRow.find('.Type > select').val(WS.state[prefix + 'Owner'] + '.' + WS.state[prefix + 'Review']);
        toRow.find('.Type > span').text(toRow.find('.Type > select > :selected').text());
        toRow.toggleClass('IsOR', isTrue(WS.state[prefix + 'Review'] && WS.state[prefix + 'Owner'] === gameId + '_' + teamId));
        break;
      case 'Duration':
      case 'Running':
        toRow
          .children('.Duration')
          .text(isTrue(WS.state[prefix + 'Running']) ? 'Running' : _timeConversions.msToMinSec(WS.state[prefix + 'Duration'], true));
        break;
    }
  }

  function createPeriod(nr) {
    if (nr > 0 && periodElements[nr] == null) {
      createPeriod(nr - 1);
      var table = $('<table cellpadding="0" cellspacing="0" border="1">').addClass('SK Period').attr('nr', nr);
      $('<col>').addClass('EditButton').appendTo(table);
      $('<col>').addClass('JamNumber').appendTo(table);
      $('<col>').addClass('Jammer').appendTo(table);
      $('<col>').addClass('Narrow').appendTo(table);
      $('<col>').addClass('Narrow').appendTo(table);
      $('<col>').addClass('Narrow').appendTo(table);
      $('<col>').addClass('Narrow').appendTo(table);
      $('<col>').addClass('Narrow').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      $('<td>').addClass('Trip').appendTo(table);
      if (mode !== 'copyToStatsbook') {
        $('<col>').addClass('JamTotal').appendTo(table);
        $('<col>').addClass('GameTotal').appendTo(table);
      }
      if (isReverse) {
        table.prependTo(element).addClass('Backwards');
      } else {
        table.appendTo(element).addClass('Forwards');
      }
      if (mode !== 'operator') {
        var header = $('<thead><tr>').appendTo(table);
        $('<td>').addClass('EditButton').text('EDIT').appendTo(header);
        $('<td>').addClass('JamNumber').text('JAM').appendTo(header);
        $('<td>').addClass('Jammer').text('JAMMER').appendTo(header);
        $('<td>').addClass('SmallHead').append($('<div>').text('LOST')).appendTo(header);
        $('<td>').addClass('SmallHead').append($('<div>').text('LEAD')).appendTo(header);
        $('<td>').addClass('SmallHead').append($('<div>').text('CALL')).appendTo(header);
        $('<td>').addClass('SmallHead').append($('<div>').text('INJ')).appendTo(header);
        $('<td>').addClass('SmallHead').append($('<div>').text('NI')).appendTo(header);
        $('<td>')
          .html('<span class ="Team">' + teamName + '</span> P' + nr)
          .attr('colspan', 9)
          .prop('id', 'head')
          .appendTo(header);
        if (mode !== 'copyToStatsbook') {
          $('<td>').addClass('JamTotal').text('JAM').appendTo(header);
          $('<td>').addClass('GameTotal').text('TOTAL').appendTo(header);
        }
      }
      var body = $('<tbody>').appendTo(table);
      periodElements[nr] = body;
      jamElements[nr] = {};
      timeoutElements[nr] = {};
    }
  }

  function stopEvent(event) {
    event.stopPropagation();
  }

  function createJam(p, nr) {
    var table = periodElements[p];
    if (nr > 0 && jamElements[p][nr] == null) {
      createJam(p, nr - 1);

      var jamPrefix = 'ScoreBoard.Game(' + gameId + ').Period(' + p + ').Jam(' + nr + ').';
      var prefix = jamPrefix + 'TeamJam(' + teamId + ').';

      var jamRow = $('<tr>').addClass('Jam').attr('nr', nr);
      $('<td>').addClass('EditButton').appendTo(jamRow);
      $('<td>').addClass('JamNumber Darker').text(nr).appendTo(jamRow);
      $('<td>')
        .addClass('Jammer')
        .append($('<span>').addClass('NoEditOnly'))
        .append(skaterSelect.clone().on('click', stopEvent))
        .appendTo(jamRow);
      $('<td>')
        .addClass('Lost Narrow Darker')
        .on('click', function () {
          WS.Set(prefix + 'Lost', $(this).text() === '');
        })
        .appendTo(jamRow);
      $('<td>')
        .addClass('Lead Narrow Darker')
        .on('click', function () {
          WS.Set(prefix + 'Lead', $(this).text() === '');
        })
        .appendTo(jamRow);
      $('<td>')
        .addClass('Calloff Narrow Darker')
        .on('click', function () {
          WS.Set(prefix + 'Calloff', $(this).text() === '');
        })
        .appendTo(jamRow);
      $('<td>')
        .addClass('Injury Narrow Darker')
        .on('click', function () {
          WS.Set(prefix + 'Injury', $(this).text() === '');
        })
        .appendTo(jamRow);
      $('<td>')
        .addClass('NoInitial Narrow Darker')
        .on('click', function () {
          setupTripEditor(gameId, p, nr, teamId, 1);
        })
        .appendTo(jamRow);
      $.each(new Array(9), function (idx) {
        var t = idx + 2;
        $('<td>')
          .addClass('Trip Trip' + t)
          .attr('nr', t)
          .on('click', function () {
            setupTripEditor(gameId, p, nr, teamId, t);
          })
          .append(
            $('<button>')
              .addClass('EditOnly UsedOnly')
              .text('+')
              .on('click', function (event) {
                WS.Set(prefix + 'ScoringTrip(' + t + ').Score', +1, 'change');
                event.stopPropagation();
              })
              .button()
          )
          .append($('<br/>').addClass('EditOnly UsedOnly'))
          .append($('<span>'))
          .append($('<br/>').addClass('EditOnly UsedOnly'))
          .append(
            $('<button>')
              .addClass('EditOnly UsedOnly')
              .text('-')
              .on('click', function (event) {
                WS.Set(prefix + 'ScoringTrip(' + t + ').Score', -1, 'change');
                event.stopPropagation();
              })
              .button()
          )
          .append($('<br/>').addClass('EditOnly UsedOnly'))
          .append(
            $('<button>')
              .addClass('EditOnly UsedOnly')
              .text('X')
              .on('click', function (event) {
                WS.Set(prefix + 'ScoringTrip(' + t + ').Remove', true);
                event.stopPropagation();
              })
              .button()
          )
          .append(
            $('<button>')
              .addClass('EditOnly FirstUnusedOnly')
              .text('Add')
              .on('click', function (event) {
                WS.Set(prefix + 'ScoringTrip(' + t + ').Score', 0);
                event.stopPropagation();
              })
              .button()
          )
          .appendTo(jamRow);
      });
      if (mode !== 'copyToStatsbook') {
        $('<td>')
          .addClass('JamTotal')
          .on('click', function () {
            showOsOffsetEditor(prefix);
          })
          .appendTo(jamRow);
        $('<td>').addClass('GameTotal').appendTo(jamRow);
      }

      var spRow = jamRow.clone(true).removeClass('Jam').addClass('SP');

      var editRow = $('<tr>').addClass('Edits Before').attr('nr', nr);
      $('<td>').addClass('EditButton').appendTo(editRow);
      $('<td>')
        .attr('colspan', mode === 'copyToStatsbook' ? 16 : 18)
        .addClass('Buttons Darker')
        .append(
          $('<button>')
            .addClass('RemoveJam')
            .text('Remove Jam ' + nr)
            .on('click', function () {
              WS.Set(jamPrefix + 'Delete', true);
              jamRow.toggleClass('Edit');
              spRow.toggleClass('Edit');
              editRow.toggleClass('Edit');
              editRow2.toggleClass('Edit');
            })
            .button()
        )
        .append($('<span>').addClass('NoRemoveJamPoints Hide').text("Can't delete jam with points"))
        .append($('<span>').addClass('NoRemoveJamRunning Hide').text("Can't delete running jam"))
        .append(
          $('<button>')
            .addClass('AddJam')
            .text('Insert New Jam Before Jam ' + nr)
            .on('click', function () {
              WS.Set(jamPrefix + 'InsertBefore', true);
              jamRow.toggleClass('Edit');
              spRow.toggleClass('Edit');
              editRow.toggleClass('Edit');
              editRow2.toggleClass('Edit');
            })
            .button()
        )
        .appendTo(editRow);

      var editRow2 = $('<tr>').addClass('Edits').attr('nr', nr);
      $('<td>').addClass('EditButton').appendTo(editRow2);
      $('<td>')
        .attr('colspan', mode === 'copyToStatsbook' ? 16 : 18)
        .addClass('Buttons Darker')
        .append(
          $('<button>')
            .addClass('AddSP')
            .text('Add SP')
            .on('click', function () {
              WS.Set(prefix + 'StarPass', true);
            })
            .button()
        )
        .append(WSActiveButton(prefix + 'ScoringTrip(1).AfterSP', $('<button>').addClass('InitialSP').text('SP on Initial')).button())
        .append(
          $('<button>')
            .addClass('AddTO')
            .text('Insert Timeout After Jam ' + nr)
            .on('click', function () {
              WS.Set(jamPrefix + 'InsertTimeoutAfter', true);
              jamRow.toggleClass('Edit');
              spRow.toggleClass('Edit');
              editRow.toggleClass('Edit');
              editRow2.toggleClass('Edit');
            })
            .button()
        )
        .appendTo(editRow2);

      jamRow.children('.EditButton').append(
        $('<button>')
          .text('✎')
          .on('click', function () {
            jamRow.toggleClass('Edit');
            spRow.toggleClass('Edit');
            editRow.toggleClass('Edit');
            editRow2.toggleClass('Edit');
          })
          .button()
      );
      jamRow.children('.Jammer').on('click', function () {
        showSkaterSelector(prefix + 'Fielding(Jammer).Skater', teamId);
      });
      spRow.children('.Jammer').on('click', function () {
        showSkaterSelector(prefix + 'Fielding(Pivot).Skater', teamId);
      });
      jamRow
        .children('.Jammer')
        .children('select')
        .on('change', function () {
          WS.Set(prefix + 'Fielding(Jammer).Skater', $(this).val());
        });
      spRow
        .children('.Jammer')
        .children('select')
        .on('change', function () {
          WS.Set(prefix + 'Fielding(Pivot).Skater', $(this).val());
        });
      jamRow.children('.Trip').append(
        $('<button>')
          .addClass('EditOnly OtherUsedOnly')
          .text(isReverse ? '↓' : '↑')
          .on('click', function (event) {
            WS.Set(prefix + 'ScoringTrip(' + $(this).parent().attr('nr') + ').AfterSP', false);
            event.stopPropagation();
          })
          .button()
      );
      spRow.children('.Trip').append(
        $('<button>')
          .addClass('EditOnly OtherUsedOnly')
          .text(isReverse ? '↑' : '↓')
          .on('click', function (event) {
            WS.Set(prefix + 'ScoringTrip(' + $(this).parent().attr('nr') + ').AfterSP', true);
            event.stopPropagation();
          })
          .button()
      );

      if (isReverse) {
        table.prepend(editRow);
        table.prepend(jamRow);
        table.prepend(editRow2);
      } else {
        table.append(editRow);
        table.append(jamRow);
        table.append(editRow2);
      }
      jamElements[p][nr] = [jamRow, spRow, editRow, editRow2];
    }
  }

  var toTypeSelect = $('<select>')
    .addClass('EditOnly')
    .append($('<option>').attr('value', '.false').text('Untyped Timeout'))
    .append($('<option>').attr('value', 'O.false').text('Official Timeout'))
    .append(
      $('<option>')
        .attr('value', gameId + '_1.false')
        .text('Team TO ' + (teamId === 1 ? 'this' : 'other') + ' team')
    )
    .append(
      $('<option>')
        .attr('value', gameId + '_2.false')
        .text('Team TO ' + (teamId === 2 ? 'this' : 'other') + ' team')
    )
    .append(
      $('<option>')
        .attr('value', gameId + '_1.true')
        .text('Off. Review ' + (teamId === 1 ? 'this' : 'other') + ' team')
    )
    .append(
      $('<option>')
        .attr('value', gameId + '_2.true')
        .text('Off. Review ' + (teamId === 2 ? 'this' : 'other') + ' team')
    );

  function createTimeout(p, id) {
    if (timeoutElements[p][id] == null) {
      var prefix = 'ScoreBoard.Game(' + gameId + ').Period(' + p + ').Timeout(' + id + ').';

      var editRow = $('<tr>').addClass('Edits Timeout').attr('to', id);
      var toRow = $('<tr>').addClass('Timeout').attr('to', id);
      $('<td>')
        .addClass('EditButton')
        .append(
          $('<button>')
            .text('✎')
            .on('click', function () {
              toRow.toggleClass('Edit');
              editRow.toggleClass('Edit');
            })
            .button()
        )
        .appendTo(toRow);
      $('<td>')
        .attr('colspan', 9)
        .addClass('Type')
        .append($('<span>').addClass('NoEditOnly'))
        .append(
          toTypeSelect.clone().on('change', function () {
            var parts = $(this).val().split('.');
            WS.Set(prefix + 'Owner', parts[0]);
            WS.Set(prefix + 'Review', isTrue(parts[1]));
          })
        )
        .appendTo(toRow);
      $('<td>')
        .attr('colspan', 4)
        .addClass('Retained')
        .append(WSActiveButton(prefix + 'RetainedReview', $('<button>').addClass('OROnly').text('Retained').button()))
        .appendTo(toRow);
      $('<td>')
        .attr('colspan', mode === 'copyToStatsbook' ? 3 : 5)
        .addClass('Duration')
        .appendTo(toRow);

      $('<td>').addClass('EditButton').appendTo(editRow);
      $('<td>')
        .attr('colspan', mode === 'copyToStatsbook' ? 16 : 18)
        .addClass('Buttons')
        .append(
          $('<button>')
            .addClass('RemoveTO')
            .text('Remove Timeout')
            .on('click', function () {
              WS.Set(prefix + 'Delete', true);
            })
            .button()
        )
        .append(
          $('<button>')
            .addClass('AddTO')
            .text('Insert Timeout')
            .on('click', function () {
              WS.Set(prefix + 'InsertAfter', true);
            })
            .button()
        )
        .appendTo(editRow);

      timeoutElements[p][id] = [toRow, editRow];
    }
  }
}

var tripEditor;

function setupTripEditor(gameId, p, j, teamId, t) {
  'use strict';
  while (
    t > 1 &&
    WS.state[
      'ScoreBoard.Game(' + gameId + ').Period(' + p + ').Jam(' + j + ').TeamJam(' + teamId + ').ScoringTrip(' + (t - 1) + ').Score'
    ] === undefined
  ) {
    t--;
  }
  if (t < 1) {
    t = 1;
  }

  var prefix = 'ScoreBoard.Game(' + gameId + ').Period(' + p + ').Jam(' + j + ').TeamJam(' + teamId + ').ScoringTrip(' + t + ').';

  tripEditor.dialog('option', 'title', 'Period ' + p + ' Jam ' + j + ' Trip ' + (t === 1 ? 'Initial' : t));
  tripEditor.find('#score').val(WS.state[prefix + 'Score']);
  tripEditor.find('#afterSP').toggleClass('checked', isTrue(WS.state[prefix + 'AfterSP']));
  var annotation = WS.state[prefix + 'Annotation'] || '';
  tripEditor.find('#annotation').val(annotation);
  tripEditor.find('#prev').toggleClass('Invisible', t === 1);
  tripEditor.find('#next').toggleClass('Invisible', WS.state[prefix + 'Score'] === undefined);
  tripEditor.data('prefix', prefix);
  tripEditor.data('game', gameId);
  tripEditor.data('team', teamId);
  tripEditor.data('period', p);
  tripEditor.data('jam', j);
  tripEditor.data('trip', t);
  tripEditor.dialog('open');
}

function prepareTripEditor() {
  'use strict';
  $(initialize);

  function initialize() {
    tripEditor = $('#TripEditor').dialog({
      modal: true,
      closeOnEscape: false,
      title: 'Trip Editor',
      autoOpen: false,
      width: '300px',
    });

    tripEditor.append(
      $('<table>')
        .append(
          $('<tr>')
            .append(
              $('<td>').append(
                $('<input type="number" min="0">')
                  .attr('id', 'score')
                  .on('keydown', function (event) {
                    if (event.which === 13 && $(this).val() === '') {
                      WS.Set(tripEditor.data('prefix') + 'Remove', true);
                      tripEditor.dialog('close');
                    }
                  })
                  .on('change', function () {
                    WS.Set(tripEditor.data('prefix') + 'Score', $(this).val());
                  })
              )
            )
            .append(
              $('<td>').append(
                $('<button>')
                  .attr('id', 'afterSP')
                  .text('After SP')
                  .button()
                  .on('click', function () {
                    var check = !$(this).hasClass('checked');
                    $(this).toggleClass('checked', check);
                    WS.Set(tripEditor.data('prefix') + 'AfterSP', check);
                  })
              )
            )
        )
        .append(
          $('<tr class="buttons">')
            .append(
              $('<td>').append(
                $('<button>')
                  .attr('id', 'remove')
                  .text('Remove Trip')
                  .button()
                  .on('click', function () {
                    WS.Set(tripEditor.data('prefix') + 'Remove', true);
                    tripEditor.dialog('close');
                  })
              )
            )
            .append(
              $('<td>').append(
                $('<button>')
                  .attr('id', 'insert_before')
                  .text('Insert Trip')
                  .button()
                  .on('click', function () {
                    WS.Set(tripEditor.data('prefix') + 'InsertBefore', true);
                    tripEditor.dialog('close');
                    setupTripEditor(
                      tripEditor.data('game'),
                      tripEditor.data('period'),
                      tripEditor.data('jam'),
                      tripEditor.data('team'),
                      tripEditor.data('trip')
                    );
                    tripEditor.find('#score').val(0); // the update of the popup may run before the WS is updated
                  })
              )
            )
        )
        .append($('<tr>').append($('<td>').attr('colspan', '2').append($('<hr>'))))
        .append(
          $('<tr>')
            .addClass('Annotation')
            .append($('<td>').addClass('header').text('Notes: '))
            .append(
              $('<td>').append(
                $('<button>')
                  .text('Clear Notes')
                  .button()
                  .on('click', function () {
                    tripEditor.find('#annotation').val('');
                    WS.Set(tripEditor.data('prefix') + 'Annotation', '');
                  })
              )
            )
        )
        .append(
          $('<tr>')
            .addClass('Annotation')
            .append(
              $('<td>')
                .attr('colspan', '2')
                .append(
                  $('<textarea>')
                    .attr('cols', '25')
                    .attr('rows', '4')
                    .attr('id', 'annotation')
                    .on('change', function () {
                      WS.Set(tripEditor.data('prefix') + 'Annotation', $(this).val());
                    })
                )
            )
        )
        .append($('<tr>').append($('<td>').attr('colspan', '2').append($('<hr>'))))
        .append(
          $('<tr class="buttons nav">')
            .append(
              $('<td>')
                .append(
                  $('<button>')
                    .text('⬅ Prev')
                    .attr('id', 'prev')
                    .button()
                    .on('click', function () {
                      tripEditor.dialog('close');
                      setupTripEditor(
                        tripEditor.data('game'),
                        tripEditor.data('period'),
                        tripEditor.data('jam'),
                        tripEditor.data('team'),
                        tripEditor.data('trip') - 1
                      );
                    })
                )
                .append(
                  $('<button>')
                    .text('Next ➡')
                    .attr('id', 'next')
                    .button()
                    .on('click', function () {
                      tripEditor.dialog('close');
                      setupTripEditor(
                        tripEditor.data('game'),
                        tripEditor.data('period'),
                        tripEditor.data('jam'),
                        tripEditor.data('team'),
                        tripEditor.data('trip') + 1
                      );
                    })
                )
            )
            .append(
              $('<td>')
                .addClass('close')
                .append(
                  $('<button>')
                    .attr('id', 'close')
                    .text('Close')
                    .button()
                    .on('click', function () {
                      tripEditor.dialog('close');
                    })
                )
            )
        )
    );
  }
}

function showSkaterSelector(element, teamId) {
  'use strict';
  $('#skaterSelector .skaterSelect').addClass('Hide');
  $('#skaterSelector #skaterSelect' + teamId).removeClass('Hide');
  $('#skaterSelector #skaterSelect' + teamId).val(WS.state[element]);
  $('#skaterSelector').data('element', element).dialog('open');
}

function prepareSkaterSelector(gameId) {
  'use strict';

  var selects = [];

  var selectorDialog = $('#skaterSelector').dialog({
    modal: true,
    closeOnEscape: false,
    title: 'Skater Selector',
    autoOpen: false,
    width: '200px',
  });

  $.each(['1', '2'], function () {
    selects[String(this)] = $('<select>')
      .attr('id', 'skaterSelect' + String(this))
      .addClass('skaterSelect')
      .append($('<option>').attr('value', '').text('None/Unknown'))
      .on('change', function () {
        WS.Set(selectorDialog.data('element'), $(this).val());
        selectorDialog.dialog('close');
      });
  });

  selectorDialog.append(selects['1']).append(selects['2']);

  WS.Register(
    ['ScoreBoard.Game(' + gameId + ').Team(*).Skater(*).RosterNumber', 'ScoreBoard.Game(' + gameId + ').Team(*).Skater(*).Role'],
    function (k, v) {
      selects[k.Team].children('[value="' + k.Skater + '"]').remove();
      var prefix = 'ScoreBoard.Game(' + gameId + ').Team(' + k.Team + ').Skater(' + k.Skater + ').';
      if (v != null && WS.state[prefix + 'Role'] !== 'NotInGame') {
        var number = WS.state[prefix + 'RosterNumber'];
        var option = $('<option>').attr('number', number).val(k.Skater).text(number);
        _windowFunctions.appendAlphaSortedByAttr(selects[k.Team], option, 'number', 1);
      }
    }
  );

  WS.Register(['ScoreBoard.Game(' + gameId + ').Period(*).Jam(*).TeamJam(*).Fielding(*).Skater']);
}

function showOsOffsetEditor(prefix) {
  'use strict';
  $('#osOffsetEditor .Offset').val(WS.state[prefix + 'OsOffset']);
  $('#osOffsetEditor .Reason').val(WS.state[prefix + 'OsOffsetReason']);
  $('#osOffsetEditor').data('prefix', prefix).dialog('open');
}

function prepareOsOffsetEditor(gameId) {
  'use strict';

  var osOffsetDialog = $('#osOffsetEditor').dialog({
    modal: true,
    closeOnEscape: false,
    title: 'OS Offset',
    autoOpen: false,
    width: '600px',
  });

  osOffsetDialog
    .append($('<input type="number" size="2">').addClass('Offset'))
    .append($('<input type="text" size="40">').addClass('Reason'))
    .append(
      $('<button>')
        .text('Set')
        .button()
        .on('click', function () {
          WS.Set(osOffsetDialog.data('prefix') + 'OsOffset', osOffsetDialog.children('.Offset').val());
          WS.Set(osOffsetDialog.data('prefix') + 'OsOffsetReason', osOffsetDialog.children('.Reason').val());
          osOffsetDialog.dialog('close');
        })
    );
}
