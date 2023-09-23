function toggleButton(key, trueText, falseText) {
  'use strict';
  var button = $('<label/><input type="checkbox"/>').addClass('ui-button-small');
  var id = newUUID();
  button.first().attr('for', id);
  var input = button.last().attr('id', id).button();
  input.on('change', function (e) {
    WS.Set(key, input.prop('checked'));
  });
  input.button('option', 'label', falseText);
  WS.Register(key, function (k, v) {
    input
      .button('option', 'label', isTrue(v) ? trueText : falseText)
      .prop('checked', isTrue(v))
      .button('refresh');
  });
  return button;
}

function mediaSelect(key, format, type, humanName) {
  'use strict';
  var select = $('<select>').append($('<option value="">No ' + humanName + '</option>'));
  WS.Register('ScoreBoard.Media.Format(' + format + ').Type(' + type + ').File(*).Name', function (k, v) {
    select.children('[value="' + '/' + format + '/' + type + '/' + k.File + '"]').remove();
    if (v != null) {
      var option = $('<option>')
        .attr('name', v)
        .val('/' + format + '/' + type + '/' + k.File)
        .text(v);
      _windowFunctions.appendAlphaSortedByAttr(select, option, 'name', 1);
    }
    select.val(WS.state[key]);
  });
  WSControl(key, select);
  return select;
}

function WSActiveButton(key, button) {
  'use strict';
  button.on('click', function () {
    WS.Set(key, !button.hasClass('Active'));
  });
  WS.Register(key, function (k, v) {
    button.toggleClass('Active', isTrue(v));
  });
  button.toggleClass('Active', isTrue(WS.state[key]));
  return button;
}

function WSChangeButton(key, value, button) {
  'use strict';
  button.on('click', function () {
    WS.Set(key, value, 'change');
  });
  return button;
}

function WSSetButton(key, value, button) {
  'use strict';
  button.on('click', function () {
    WS.Set(key, typeof value === 'function' ? value() : value);
  });
  return button;
}

function WSControl(key, element) {
  'use strict';
  element.on('change', function () {
    WS.Set(key, element.val());
  });
  WS.Register(key, function (k, v) {
    element.val(v);
  });
  element.val(WS.state[key]);
  return element;
}

function WSDisplay(key, element) {
  'use strict';
  WS.Register(key, function (k, v) {
    element.text(v);
  });
  element.text(WS.state[key]);
  return element;
}

function WSTextToggle(key, element, trueText, falseText) {
  'use strict';
  WS.Register(key, function (k, v) {
    element.text(isTrue(v) ? trueText : falseText);
  });
  element.text(isTrue(WS.state[key]) ? trueText : falseText);
  return element;
}
