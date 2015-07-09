
var DataTransfer = require('./DataTransfer');

var dataTransferEvents = ['drag', 'dragstart', 'dragover', 'dragend', 'drop', 'dragleave'];


function mergeInto(destObj, srcObj) {
  for (var key in srcObj) {
    if (!srcObj.hasOwnProperty(key)) { continue; }   // ignore inherited properties

    destObj[key] = srcObj[key];
  }

  return destObj;
}


function createModernEvent(eventName, eventType, eventProperties) {
  if (eventType === 'DragEvent') { eventType = 'CustomEvent'; }     // Firefox fix (since FF does not allow us to override dataTransfer)

  var constructor = window[eventType];
  var options = { view: window, bubbles: true, cancelable: true };

  mergeInto(options, eventProperties);

  var event = new constructor(eventName, options);

  mergeInto(event, eventProperties);

  return event;
}


function createLegacyEvent(eventName, eventType, eventProperties) {
  var event;

  // https://developer.mozilla.org/en-US/docs/Web/API/Event
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent
  var options = {
    bubbles: true,
    cancelable: true,
    view: window,
    detail: 0,
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: 0,
    relatedTarget: null
  };

  // copy eventProperties
  if (eventProperties) {
    mergeInto(options, eventProperties);
  }

  switch (eventType) {
    case 'MouseEvent':
      event = document.createEvent('MouseEvent');
      event.initMouseEvent(eventName,
                           options.bubbles,
                           options.cancelable,
                           options.view,
                           options.detail,
                           options.screenX,
                           options.screenY,
                           options.clientX,
                           options.clientY,
                           options.ctrlKey,
                           options.altKey,
                           options.shiftKey,
                           options.metaKey,
                           options.button,
                           options.relatedTarget);
      break;

    default:
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName,
                            options.bubbles,
                            options.cancelable,
                            options.detail);
  }

  // copy eventProperties that were not given to init to Event
  if (eventProperties) {
    delete options.bubbles;
    delete options.cancelable;
    delete options.view;
    delete options.detail;
    delete options.screenX;
    delete options.screenY;
    delete options.clientX;
    delete options.clientY;
    delete options.ctrlKey;
    delete options.altKey;
    delete options.shiftKey;
    delete options.metaKey;
    delete options.button;
    delete options.relatedTarget;

    mergeInto(event, options);
  }

  return event;
}


function createEvent(eventName, eventType, eventProperties) {
  try {
    return createModernEvent(eventName, eventType, eventProperties);
  } catch (error) {
    return createLegacyEvent(eventName, eventType, eventProperties);
  }
}


var EventFactory = {
  createEvent: function(eventName, eventProperties, dataTransfer) {
    var eventType = 'CustomEvent';

    if (eventName.match(/^mouse/)) {
      eventType = 'MouseEvent';
    }

    var event = createEvent(eventName, eventType, eventProperties);

    if (dataTransferEvents.indexOf(eventName) > -1) {
      event.dataTransfer = dataTransfer || new DataTransfer();
    }

    return event;
  }
};

module.exports = EventFactory;
