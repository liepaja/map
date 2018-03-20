'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _mapState = require('./map-state');

var _mapState2 = _interopRequireDefault(_mapState);

var _transition = require('./transition');

var _transitionManager = require('./transition-manager');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NO_TRANSITION_PROPS = {
  transitionDuration: 0
}; // Copyright (c) 2015 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: function transitionEasing(t) {
    return t;
  },
  transitionInterpolator: new _transition.LinearInterpolator(),
  transitionInterruption: _transitionManager.TRANSITION_EVENTS.BREAK
};

// EVENT HANDLING PARAMETERS
var PITCH_MOUSE_THRESHOLD = 5;
var PITCH_ACCEL = 1.2;
var ZOOM_ACCEL = 0.01;

var EVENT_TYPES = {
  WHEEL: ['wheel'],
  PAN: ['panstart', 'panmove', 'panend'],
  PINCH: ['pinchstart', 'pinchmove', 'pinchend'],
  DOUBLE_TAP: ['doubletap'],
  KEYBOARD: ['keydown']
};

var MapControls = function () {
  /**
   * @classdesc
   * A class that handles events and updates mercator style viewport parameters
   */
  function MapControls() {
    (0, _classCallCheck3.default)(this, MapControls);

    this._state = {
      isDragging: false
    };
    this.events = [];
    this.handleEvent = this.handleEvent.bind(this);
  }

  /**
   * Callback for events
   * @param {hammer.Event} event
   */


  (0, _createClass3.default)(MapControls, [{
    key: 'handleEvent',
    value: function handleEvent(event) {
      this.mapState = this.getMapState();

      switch (event.type) {
        case 'panstart':
          return this._onPanStart(event);
        case 'panmove':
          return this._onPan(event);
        case 'panend':
          return this._onPanEnd(event);
        case 'pinchstart':
          return this._onPinchStart(event);
        case 'pinchmove':
          return this._onPinch(event);
        case 'pinchend':
          return this._onPinchEnd(event);
        case 'doubletap':
          return this._onDoubleTap(event);
        case 'wheel':
          return this._onWheel(event);
        case 'keydown':
          return this._onKeyDown(event);
        default:
          return false;
      }
    }

    /* Event utils */
    // Event object: http://hammerjs.github.io/api/#event-object

  }, {
    key: 'getCenter',
    value: function getCenter(event) {
      var _event$offsetCenter = event.offsetCenter,
          x = _event$offsetCenter.x,
          y = _event$offsetCenter.y;

      return [x, y];
    }
  }, {
    key: 'isFunctionKeyPressed',
    value: function isFunctionKeyPressed(event) {
      var srcEvent = event.srcEvent;

      return Boolean(srcEvent.metaKey || srcEvent.altKey || srcEvent.ctrlKey || srcEvent.shiftKey);
    }
  }, {
    key: 'setState',
    value: function setState(newState) {
      (0, _assign2.default)(this._state, newState);
      if (this.onStateChange) {
        this.onStateChange(this._state);
      }
    }

    /* Callback util */
    // formats map state and invokes callback function

  }, {
    key: 'updateViewport',
    value: function updateViewport(newMapState) {
      var extraProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var extraState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var oldViewport = this.mapState ? this.mapState.getViewportProps() : {};
      var newViewport = (0, _assign2.default)({}, newMapState.getViewportProps(), extraProps);

      if (this.onViewportChange && (0, _keys2.default)(newViewport).some(function (key) {
        return oldViewport[key] !== newViewport[key];
      })) {
        // Viewport has changed
        this.onViewportChange(newViewport);
      }

      this.setState((0, _assign2.default)({}, newMapState.getInteractiveState(), extraState));
    }
  }, {
    key: 'getMapState',
    value: function getMapState(overrides) {
      return new _mapState2.default((0, _assign2.default)({}, this.mapStateProps, this._state, overrides));
    }

    /**
     * Extract interactivity options
     */

  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      var onChangeViewport = options.onChangeViewport,
          _options$touchZoomRot = options.touchZoomRotate,
          touchZoomRotate = _options$touchZoomRot === undefined ? true : _options$touchZoomRot,
          onViewportChange = options.onViewportChange,
          _options$onStateChang = options.onStateChange,
          onStateChange = _options$onStateChang === undefined ? this.onStateChange : _options$onStateChang,
          _options$eventManager = options.eventManager,
          eventManager = _options$eventManager === undefined ? this.eventManager : _options$eventManager,
          _options$scrollZoom = options.scrollZoom,
          scrollZoom = _options$scrollZoom === undefined ? true : _options$scrollZoom,
          _options$dragPan = options.dragPan,
          dragPan = _options$dragPan === undefined ? true : _options$dragPan,
          _options$dragRotate = options.dragRotate,
          dragRotate = _options$dragRotate === undefined ? true : _options$dragRotate,
          _options$doubleClickZ = options.doubleClickZoom,
          doubleClickZoom = _options$doubleClickZ === undefined ? true : _options$doubleClickZ,
          _options$touchZoom = options.touchZoom,
          touchZoom = _options$touchZoom === undefined ? true : _options$touchZoom,
          _options$touchRotate = options.touchRotate,
          touchRotate = _options$touchRotate === undefined ? false : _options$touchRotate,
          _options$keyboard = options.keyboard,
          keyboard = _options$keyboard === undefined ? true : _options$keyboard;

      // TODO(deprecate): remove this check when `onChangeViewport` gets deprecated

      this.onViewportChange = onViewportChange || onChangeViewport;
      this.onStateChange = onStateChange;

      if (this.mapStateProps && this.mapStateProps.height !== options.height) {
        // Dimensions changed, normalize the props
        this.updateViewport(new _mapState2.default(options));
      }

      this.mapStateProps = options;
      if (this.eventManager !== eventManager) {
        // EventManager has changed
        this.eventManager = eventManager;
        this._events = {};
        this.toggleEvents(this.events, true);
      }
      var isInteractive = Boolean(this.onViewportChange);

      // Register/unregister events
      this.toggleEvents(EVENT_TYPES.WHEEL, isInteractive && scrollZoom);
      this.toggleEvents(EVENT_TYPES.PAN, isInteractive && (dragPan || dragRotate));
      this.toggleEvents(EVENT_TYPES.PINCH, isInteractive && touchZoomRotate);
      this.toggleEvents(EVENT_TYPES.DOUBLE_TAP, isInteractive && doubleClickZoom);
      this.toggleEvents(EVENT_TYPES.KEYBOARD, isInteractive && keyboard);

      // Interaction toggles
      this.scrollZoom = scrollZoom;
      this.dragPan = dragPan;
      this.dragRotate = dragRotate;
      this.doubleClickZoom = doubleClickZoom;
      this.touchZoom = touchZoomRotate && touchZoom;
      this.touchRotate = touchZoomRotate && touchRotate;
      this.keyboard = keyboard;
    }
  }, {
    key: 'toggleEvents',
    value: function toggleEvents(eventNames, enabled) {
      var _this = this;

      if (this.eventManager) {
        eventNames.forEach(function (eventName) {
          if (_this._events[eventName] !== enabled) {
            _this._events[eventName] = enabled;
            if (enabled) {
              _this.eventManager.on(eventName, _this.handleEvent);
            } else {
              _this.eventManager.off(eventName, _this.handleEvent);
            }
          }
        });
      }
    }

    /* Event handlers */
    // Default handler for the `panstart` event.

  }, {
    key: '_onPanStart',
    value: function _onPanStart(event) {
      var pos = this.getCenter(event);
      var newMapState = this.mapState.panStart({ pos: pos }).rotateStart({ pos: pos });
      return this.updateViewport(newMapState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for the `panmove` event.

  }, {
    key: '_onPan',
    value: function _onPan(event) {
      return this.isFunctionKeyPressed(event) || event.rightButton ? this._onPanRotate(event) : this._onPanMove(event);
    }

    // Default handler for the `panend` event.

  }, {
    key: '_onPanEnd',
    value: function _onPanEnd(event) {
      var newMapState = this.mapState.panEnd().rotateEnd();
      return this.updateViewport(newMapState, null, { isDragging: false });
    }

    // Default handler for panning to move.
    // Called by `_onPan` when panning without function key pressed.

  }, {
    key: '_onPanMove',
    value: function _onPanMove(event) {
      if (!this.dragPan) {
        return false;
      }
      var pos = this.getCenter(event);
      var newMapState = this.mapState.pan({ pos: pos });
      return this.updateViewport(newMapState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for panning to rotate.
    // Called by `_onPan` when panning with function key pressed.

  }, {
    key: '_onPanRotate',
    value: function _onPanRotate(event) {
      if (!this.dragRotate) {
        return false;
      }

      var deltaX = event.deltaX,
          deltaY = event.deltaY;

      var _getCenter = this.getCenter(event),
          _getCenter2 = (0, _slicedToArray3.default)(_getCenter, 2),
          centerY = _getCenter2[1];

      var startY = centerY - deltaY;

      var _mapState$getViewport = this.mapState.getViewportProps(),
          width = _mapState$getViewport.width,
          height = _mapState$getViewport.height;

      var deltaScaleX = deltaX / width;
      var deltaScaleY = 0;

      if (deltaY > 0) {
        if (Math.abs(height - startY) > PITCH_MOUSE_THRESHOLD) {
          // Move from 0 to -1 as we drag upwards
          deltaScaleY = deltaY / (startY - height) * PITCH_ACCEL;
        }
      } else if (deltaY < 0) {
        if (startY > PITCH_MOUSE_THRESHOLD) {
          // Move from 0 to 1 as we drag upwards
          deltaScaleY = 1 - centerY / startY;
        }
      }
      deltaScaleY = Math.min(1, Math.max(-1, deltaScaleY));

      var newMapState = this.mapState.rotate({ deltaScaleX: deltaScaleX, deltaScaleY: deltaScaleY });
      return this.updateViewport(newMapState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for the `wheel` event.

  }, {
    key: '_onWheel',
    value: function _onWheel(event) {
      if (!this.scrollZoom) {
        return false;
      }

      var pos = this.getCenter(event);
      var delta = event.delta;

      // Map wheel delta to relative scale

      var scale = 2 / (1 + Math.exp(-Math.abs(delta * ZOOM_ACCEL)));
      if (delta < 0 && scale !== 0) {
        scale = 1 / scale;
      }

      var newMapState = this.mapState.zoom({ pos: pos, scale: scale });
      return this.updateViewport(newMapState, NO_TRANSITION_PROPS);
    }

    // Default handler for the `pinchstart` event.

  }, {
    key: '_onPinchStart',
    value: function _onPinchStart(event) {
      var pos = this.getCenter(event);
      var newMapState = this.mapState.zoomStart({ pos: pos }).rotateStart({ pos: pos });
      // hack - hammer's `rotation` field doesn't seem to produce the correct angle
      this._state.startPinchRotation = event.rotation;
      return this.updateViewport(newMapState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for the `pinch` event.

  }, {
    key: '_onPinch',
    value: function _onPinch(event) {
      if (!this.touchZoom && !this.touchRotate) {
        return false;
      }

      var newMapState = this.mapState;
      if (this.touchZoom) {
        var scale = event.scale;

        var pos = this.getCenter(event);
        newMapState = newMapState.zoom({ pos: pos, scale: scale });
      }
      if (this.touchRotate) {
        var rotation = event.rotation;
        var startPinchRotation = this._state.startPinchRotation;

        newMapState = newMapState.rotate({ deltaScaleX: -(rotation - startPinchRotation) / 180 });
      }

      return this.updateViewport(newMapState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for the `pinchend` event.

  }, {
    key: '_onPinchEnd',
    value: function _onPinchEnd(event) {
      var newMapState = this.mapState.zoomEnd().rotateEnd();
      this._state.startPinchRotation = 0;
      return this.updateViewport(newMapState, null, { isDragging: false });
    }

    // Default handler for the `doubletap` event.

  }, {
    key: '_onDoubleTap',
    value: function _onDoubleTap(event) {
      if (!this.doubleClickZoom) {
        return false;
      }
      var pos = this.getCenter(event);
      var isZoomOut = this.isFunctionKeyPressed(event);

      var newMapState = this.mapState.zoom({ pos: pos, scale: isZoomOut ? 0.5 : 2 });
      return this.updateViewport(newMapState, LINEAR_TRANSITION_PROPS);
    }

    /* eslint-disable complexity */
    // Default handler for the `keydown` event

  }, {
    key: '_onKeyDown',
    value: function _onKeyDown(event) {
      if (!this.keyboard) {
        return false;
      }
      var funcKey = this.isFunctionKeyPressed(event);
      var mapStateProps = this.mapStateProps;

      var newMapState = void 0;

      switch (event.srcEvent.keyCode) {
        case 189:
          // -
          if (funcKey) {
            newMapState = this.getMapState({ zoom: mapStateProps.zoom - 2 });
          } else {
            newMapState = this.getMapState({ zoom: mapStateProps.zoom - 1 });
          }
          break;
        case 187:
          // +
          if (funcKey) {
            newMapState = this.getMapState({ zoom: mapStateProps.zoom + 2 });
          } else {
            newMapState = this.getMapState({ zoom: mapStateProps.zoom + 1 });
          }
          break;
        case 37:
          // left
          if (funcKey) {
            newMapState = this.getMapState({ bearing: mapStateProps.bearing - 15 });
          } else {
            newMapState = this.mapState.pan({ pos: [100, 0], startPos: [0, 0] });
          }
          break;
        case 39:
          // right
          if (funcKey) {
            newMapState = this.getMapState({ bearing: mapStateProps.bearing + 15 });
          } else {
            newMapState = this.mapState.pan({ pos: [-100, 0], startPos: [0, 0] });
          }
          break;
        case 38:
          // up
          if (funcKey) {
            newMapState = this.getMapState({ pitch: mapStateProps.pitch + 10 });
          } else {
            newMapState = this.mapState.pan({ pos: [0, 100], startPos: [0, 0] });
          }
          break;
        case 40:
          // down
          if (funcKey) {
            newMapState = this.getMapState({ pitch: mapStateProps.pitch - 10 });
          } else {
            newMapState = this.mapState.pan({ pos: [0, -100], startPos: [0, 0] });
          }
          break;
        default:
          return false;
      }
      return this.updateViewport(newMapState, LINEAR_TRANSITION_PROPS);
    }
    /* eslint-enable complexity */

  }]);
  return MapControls;
}();

exports.default = MapControls;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9tYXAtY29udHJvbHMuanMiXSwibmFtZXMiOlsiTk9fVFJBTlNJVElPTl9QUk9QUyIsInRyYW5zaXRpb25EdXJhdGlvbiIsIkxJTkVBUl9UUkFOU0lUSU9OX1BST1BTIiwidHJhbnNpdGlvbkVhc2luZyIsInQiLCJ0cmFuc2l0aW9uSW50ZXJwb2xhdG9yIiwidHJhbnNpdGlvbkludGVycnVwdGlvbiIsIkJSRUFLIiwiUElUQ0hfTU9VU0VfVEhSRVNIT0xEIiwiUElUQ0hfQUNDRUwiLCJaT09NX0FDQ0VMIiwiRVZFTlRfVFlQRVMiLCJXSEVFTCIsIlBBTiIsIlBJTkNIIiwiRE9VQkxFX1RBUCIsIktFWUJPQVJEIiwiTWFwQ29udHJvbHMiLCJfc3RhdGUiLCJpc0RyYWdnaW5nIiwiZXZlbnRzIiwiaGFuZGxlRXZlbnQiLCJiaW5kIiwiZXZlbnQiLCJtYXBTdGF0ZSIsImdldE1hcFN0YXRlIiwidHlwZSIsIl9vblBhblN0YXJ0IiwiX29uUGFuIiwiX29uUGFuRW5kIiwiX29uUGluY2hTdGFydCIsIl9vblBpbmNoIiwiX29uUGluY2hFbmQiLCJfb25Eb3VibGVUYXAiLCJfb25XaGVlbCIsIl9vbktleURvd24iLCJvZmZzZXRDZW50ZXIiLCJ4IiwieSIsInNyY0V2ZW50IiwiQm9vbGVhbiIsIm1ldGFLZXkiLCJhbHRLZXkiLCJjdHJsS2V5Iiwic2hpZnRLZXkiLCJuZXdTdGF0ZSIsIm9uU3RhdGVDaGFuZ2UiLCJuZXdNYXBTdGF0ZSIsImV4dHJhUHJvcHMiLCJleHRyYVN0YXRlIiwib2xkVmlld3BvcnQiLCJnZXRWaWV3cG9ydFByb3BzIiwibmV3Vmlld3BvcnQiLCJvblZpZXdwb3J0Q2hhbmdlIiwic29tZSIsImtleSIsInNldFN0YXRlIiwiZ2V0SW50ZXJhY3RpdmVTdGF0ZSIsIm92ZXJyaWRlcyIsIm1hcFN0YXRlUHJvcHMiLCJvcHRpb25zIiwib25DaGFuZ2VWaWV3cG9ydCIsInRvdWNoWm9vbVJvdGF0ZSIsImV2ZW50TWFuYWdlciIsInNjcm9sbFpvb20iLCJkcmFnUGFuIiwiZHJhZ1JvdGF0ZSIsImRvdWJsZUNsaWNrWm9vbSIsInRvdWNoWm9vbSIsInRvdWNoUm90YXRlIiwia2V5Ym9hcmQiLCJoZWlnaHQiLCJ1cGRhdGVWaWV3cG9ydCIsIl9ldmVudHMiLCJ0b2dnbGVFdmVudHMiLCJpc0ludGVyYWN0aXZlIiwiZXZlbnROYW1lcyIsImVuYWJsZWQiLCJmb3JFYWNoIiwiZXZlbnROYW1lIiwib24iLCJvZmYiLCJwb3MiLCJnZXRDZW50ZXIiLCJwYW5TdGFydCIsInJvdGF0ZVN0YXJ0IiwiaXNGdW5jdGlvbktleVByZXNzZWQiLCJyaWdodEJ1dHRvbiIsIl9vblBhblJvdGF0ZSIsIl9vblBhbk1vdmUiLCJwYW5FbmQiLCJyb3RhdGVFbmQiLCJwYW4iLCJkZWx0YVgiLCJkZWx0YVkiLCJjZW50ZXJZIiwic3RhcnRZIiwid2lkdGgiLCJkZWx0YVNjYWxlWCIsImRlbHRhU2NhbGVZIiwiTWF0aCIsImFicyIsIm1pbiIsIm1heCIsInJvdGF0ZSIsImRlbHRhIiwic2NhbGUiLCJleHAiLCJ6b29tIiwiem9vbVN0YXJ0Iiwic3RhcnRQaW5jaFJvdGF0aW9uIiwicm90YXRpb24iLCJ6b29tRW5kIiwiaXNab29tT3V0IiwiZnVuY0tleSIsImtleUNvZGUiLCJiZWFyaW5nIiwic3RhcnRQb3MiLCJwaXRjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQkE7Ozs7QUFDQTs7QUFDQTs7OztBQUVBLElBQU1BLHNCQUFzQjtBQUMxQkMsc0JBQW9CO0FBRE0sQ0FBNUIsQyxDQXhCQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFTQSxJQUFNQywwQkFBMEI7QUFDOUJELHNCQUFvQixHQURVO0FBRTlCRSxvQkFBa0I7QUFBQSxXQUFLQyxDQUFMO0FBQUEsR0FGWTtBQUc5QkMsMEJBQXdCLG9DQUhNO0FBSTlCQyww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QUNEOzs7Ozs7a0JBeFZtQmUsVyIsImZpbGUiOiJtYXAtY29udHJvbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cblxuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgTWFwU3RhdGUgZnJvbSAnLi9tYXAtc3RhdGUnO1xuaW1wb3J0IHtMaW5lYXJJbnRlcnBvbGF0b3J9IGZyb20gJy4vdHJhbnNpdGlvbic7XG5pbXBvcnQge1RSQU5TSVRJT05fRVZFTlRTfSBmcm9tICcuL3RyYW5zaXRpb24tbWFuYWdlcic7XG5cbmNvbnN0IE5PX1RSQU5TSVRJT05fUFJPUFMgPSB7XG4gIHRyYW5zaXRpb25EdXJhdGlvbjogMFxufTtcbmNvbnN0IExJTkVBUl9UUkFOU0lUSU9OX1BST1BTID0ge1xuICB0cmFuc2l0aW9uRHVyYXRpb246IDMwMCxcbiAgdHJhbnNpdGlvbkVhc2luZzogdCA9PiB0LFxuICB0cmFuc2l0aW9uSW50ZXJwb2xhdG9yOiBuZXcgTGluZWFySW50ZXJwb2xhdG9yKCksXG4gIHRyYW5zaXRpb25JbnRlcnJ1cHRpb246IFRSQU5TSVRJT05fRVZFTlRTLkJSRUFLXG59O1xuXG4vLyBFVkVOVCBIQU5ETElORyBQQVJBTUVURVJTXG5jb25zdCBQSVRDSF9NT1VTRV9USFJFU0hPTEQgPSA1O1xuY29uc3QgUElUQ0hfQUNDRUwgPSAxLjI7XG5jb25zdCBaT09NX0FDQ0VMID0gMC4wMTtcblxuY29uc3QgRVZFTlRfVFlQRVMgPSB7XG4gIFdIRUVMOiBbJ3doZWVsJ10sXG4gIFBBTjogWydwYW5zdGFydCcsICdwYW5tb3ZlJywgJ3BhbmVuZCddLFxuICBQSU5DSDogWydwaW5jaHN0YXJ0JywgJ3BpbmNobW92ZScsICdwaW5jaGVuZCddLFxuICBET1VCTEVfVEFQOiBbJ2RvdWJsZXRhcCddLFxuICBLRVlCT0FSRDogWydrZXlkb3duJ11cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hcENvbnRyb2xzIHtcbiAgLyoqXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogQSBjbGFzcyB0aGF0IGhhbmRsZXMgZXZlbnRzIGFuZCB1cGRhdGVzIG1lcmNhdG9yIHN0eWxlIHZpZXdwb3J0IHBhcmFtZXRlcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3N0YXRlID0ge1xuICAgICAgaXNEcmFnZ2luZzogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMuZXZlbnRzID0gW107XG4gICAgdGhpcy5oYW5kbGVFdmVudCA9IHRoaXMuaGFuZGxlRXZlbnQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayBmb3IgZXZlbnRzXG4gICAqIEBwYXJhbSB7aGFtbWVyLkV2ZW50fSBldmVudFxuICAgKi9cbiAgaGFuZGxlRXZlbnQoZXZlbnQpIHtcbiAgICB0aGlzLm1hcFN0YXRlID0gdGhpcy5nZXRNYXBTdGF0ZSgpO1xuXG4gICAgc3dpdGNoIChldmVudC50eXBlKSB7XG4gICAgY2FzZSAncGFuc3RhcnQnOlxuICAgICAgcmV0dXJuIHRoaXMuX29uUGFuU3RhcnQoZXZlbnQpO1xuICAgIGNhc2UgJ3Bhbm1vdmUnOlxuICAgICAgcmV0dXJuIHRoaXMuX29uUGFuKGV2ZW50KTtcbiAgICBjYXNlICdwYW5lbmQnOlxuICAgICAgcmV0dXJuIHRoaXMuX29uUGFuRW5kKGV2ZW50KTtcbiAgICBjYXNlICdwaW5jaHN0YXJ0JzpcbiAgICAgIHJldHVybiB0aGlzLl9vblBpbmNoU3RhcnQoZXZlbnQpO1xuICAgIGNhc2UgJ3BpbmNobW92ZSc6XG4gICAgICByZXR1cm4gdGhpcy5fb25QaW5jaChldmVudCk7XG4gICAgY2FzZSAncGluY2hlbmQnOlxuICAgICAgcmV0dXJuIHRoaXMuX29uUGluY2hFbmQoZXZlbnQpO1xuICAgIGNhc2UgJ2RvdWJsZXRhcCc6XG4gICAgICByZXR1cm4gdGhpcy5fb25Eb3VibGVUYXAoZXZlbnQpO1xuICAgIGNhc2UgJ3doZWVsJzpcbiAgICAgIHJldHVybiB0aGlzLl9vbldoZWVsKGV2ZW50KTtcbiAgICBjYXNlICdrZXlkb3duJzpcbiAgICAgIHJldHVybiB0aGlzLl9vbktleURvd24oZXZlbnQpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyogRXZlbnQgdXRpbHMgKi9cbiAgLy8gRXZlbnQgb2JqZWN0OiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL2FwaS8jZXZlbnQtb2JqZWN0XG4gIGdldENlbnRlcihldmVudCkge1xuICAgIGNvbnN0IHtvZmZzZXRDZW50ZXI6IHt4LCB5fX0gPSBldmVudDtcbiAgICByZXR1cm4gW3gsIHldO1xuICB9XG5cbiAgaXNGdW5jdGlvbktleVByZXNzZWQoZXZlbnQpIHtcbiAgICBjb25zdCB7c3JjRXZlbnR9ID0gZXZlbnQ7XG4gICAgcmV0dXJuIEJvb2xlYW4oc3JjRXZlbnQubWV0YUtleSB8fCBzcmNFdmVudC5hbHRLZXkgfHxcbiAgICAgIHNyY0V2ZW50LmN0cmxLZXkgfHwgc3JjRXZlbnQuc2hpZnRLZXkpO1xuICB9XG5cbiAgc2V0U3RhdGUobmV3U3RhdGUpIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuX3N0YXRlLCBuZXdTdGF0ZSk7XG4gICAgaWYgKHRoaXMub25TdGF0ZUNoYW5nZSkge1xuICAgICAgdGhpcy5vblN0YXRlQ2hhbmdlKHRoaXMuX3N0YXRlKTtcbiAgICB9XG4gIH1cblxuICAvKiBDYWxsYmFjayB1dGlsICovXG4gIC8vIGZvcm1hdHMgbWFwIHN0YXRlIGFuZCBpbnZva2VzIGNhbGxiYWNrIGZ1bmN0aW9uXG4gIHVwZGF0ZVZpZXdwb3J0KG5ld01hcFN0YXRlLCBleHRyYVByb3BzID0ge30sIGV4dHJhU3RhdGUgPSB7fSkge1xuICAgIGNvbnN0IG9sZFZpZXdwb3J0ID0gdGhpcy5tYXBTdGF0ZSA/IHRoaXMubWFwU3RhdGUuZ2V0Vmlld3BvcnRQcm9wcygpIDoge307XG4gICAgY29uc3QgbmV3Vmlld3BvcnQgPSBPYmplY3QuYXNzaWduKHt9LCBuZXdNYXBTdGF0ZS5nZXRWaWV3cG9ydFByb3BzKCksIGV4dHJhUHJvcHMpO1xuXG4gICAgaWYgKHRoaXMub25WaWV3cG9ydENoYW5nZSAmJlxuICAgICAgT2JqZWN0LmtleXMobmV3Vmlld3BvcnQpLnNvbWUoa2V5ID0+IG9sZFZpZXdwb3J0W2tleV0gIT09IG5ld1ZpZXdwb3J0W2tleV0pKSB7XG4gICAgICAvLyBWaWV3cG9ydCBoYXMgY2hhbmdlZFxuICAgICAgdGhpcy5vblZpZXdwb3J0Q2hhbmdlKG5ld1ZpZXdwb3J0KTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKE9iamVjdC5hc3NpZ24oe30sIG5ld01hcFN0YXRlLmdldEludGVyYWN0aXZlU3RhdGUoKSwgZXh0cmFTdGF0ZSkpO1xuICB9XG5cbiAgZ2V0TWFwU3RhdGUob3ZlcnJpZGVzKSB7XG4gICAgcmV0dXJuIG5ldyBNYXBTdGF0ZShPYmplY3QuYXNzaWduKHt9LCB0aGlzLm1hcFN0YXRlUHJvcHMsIHRoaXMuX3N0YXRlLCBvdmVycmlkZXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IGludGVyYWN0aXZpdHkgb3B0aW9uc1xuICAgKi9cbiAgc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgY29uc3Qge1xuICAgICAgLy8gVE9ETyhkZXByZWNhdGUpOiByZW1vdmUgdGhpcyB3aGVuIGBvbkNoYW5nZVZpZXdwb3J0YCBnZXRzIGRlcHJlY2F0ZWRcbiAgICAgIG9uQ2hhbmdlVmlld3BvcnQsXG4gICAgICAvLyBUT0RPKGRlcHJlY2F0ZSk6IHJlbW92ZSB0aGlzIHdoZW4gYHRvdWNoWm9vbVJvdGF0ZWAgZ2V0cyBkZXByZWNhdGVkXG4gICAgICB0b3VjaFpvb21Sb3RhdGUgPSB0cnVlLFxuXG4gICAgICBvblZpZXdwb3J0Q2hhbmdlLFxuICAgICAgb25TdGF0ZUNoYW5nZSA9IHRoaXMub25TdGF0ZUNoYW5nZSxcbiAgICAgIGV2ZW50TWFuYWdlciA9IHRoaXMuZXZlbnRNYW5hZ2VyLFxuICAgICAgc2Nyb2xsWm9vbSA9IHRydWUsXG4gICAgICBkcmFnUGFuID0gdHJ1ZSxcbiAgICAgIGRyYWdSb3RhdGUgPSB0cnVlLFxuICAgICAgZG91YmxlQ2xpY2tab29tID0gdHJ1ZSxcbiAgICAgIHRvdWNoWm9vbSA9IHRydWUsXG4gICAgICB0b3VjaFJvdGF0ZSA9IGZhbHNlLFxuICAgICAga2V5Ym9hcmQgPSB0cnVlXG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICAvLyBUT0RPKGRlcHJlY2F0ZSk6IHJlbW92ZSB0aGlzIGNoZWNrIHdoZW4gYG9uQ2hhbmdlVmlld3BvcnRgIGdldHMgZGVwcmVjYXRlZFxuICAgIHRoaXMub25WaWV3cG9ydENoYW5nZSA9IG9uVmlld3BvcnRDaGFuZ2UgfHwgb25DaGFuZ2VWaWV3cG9ydDtcbiAgICB0aGlzLm9uU3RhdGVDaGFuZ2UgPSBvblN0YXRlQ2hhbmdlO1xuXG4gICAgaWYgKHRoaXMubWFwU3RhdGVQcm9wcyAmJiB0aGlzLm1hcFN0YXRlUHJvcHMuaGVpZ2h0ICE9PSBvcHRpb25zLmhlaWdodCkge1xuICAgICAgLy8gRGltZW5zaW9ucyBjaGFuZ2VkLCBub3JtYWxpemUgdGhlIHByb3BzXG4gICAgICB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ldyBNYXBTdGF0ZShvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgdGhpcy5tYXBTdGF0ZVByb3BzID0gb3B0aW9ucztcbiAgICBpZiAodGhpcy5ldmVudE1hbmFnZXIgIT09IGV2ZW50TWFuYWdlcikge1xuICAgICAgLy8gRXZlbnRNYW5hZ2VyIGhhcyBjaGFuZ2VkXG4gICAgICB0aGlzLmV2ZW50TWFuYWdlciA9IGV2ZW50TWFuYWdlcjtcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgdGhpcy50b2dnbGVFdmVudHModGhpcy5ldmVudHMsIHRydWUpO1xuICAgIH1cbiAgICBjb25zdCBpc0ludGVyYWN0aXZlID0gQm9vbGVhbih0aGlzLm9uVmlld3BvcnRDaGFuZ2UpO1xuXG4gICAgLy8gUmVnaXN0ZXIvdW5yZWdpc3RlciBldmVudHNcbiAgICB0aGlzLnRvZ2dsZUV2ZW50cyhFVkVOVF9UWVBFUy5XSEVFTCwgaXNJbnRlcmFjdGl2ZSAmJiBzY3JvbGxab29tKTtcbiAgICB0aGlzLnRvZ2dsZUV2ZW50cyhFVkVOVF9UWVBFUy5QQU4sIGlzSW50ZXJhY3RpdmUgJiYgKGRyYWdQYW4gfHwgZHJhZ1JvdGF0ZSkpO1xuICAgIHRoaXMudG9nZ2xlRXZlbnRzKEVWRU5UX1RZUEVTLlBJTkNILCBpc0ludGVyYWN0aXZlICYmIHRvdWNoWm9vbVJvdGF0ZSk7XG4gICAgdGhpcy50b2dnbGVFdmVudHMoRVZFTlRfVFlQRVMuRE9VQkxFX1RBUCwgaXNJbnRlcmFjdGl2ZSAmJiBkb3VibGVDbGlja1pvb20pO1xuICAgIHRoaXMudG9nZ2xlRXZlbnRzKEVWRU5UX1RZUEVTLktFWUJPQVJELCBpc0ludGVyYWN0aXZlICYmIGtleWJvYXJkKTtcblxuICAgIC8vIEludGVyYWN0aW9uIHRvZ2dsZXNcbiAgICB0aGlzLnNjcm9sbFpvb20gPSBzY3JvbGxab29tO1xuICAgIHRoaXMuZHJhZ1BhbiA9IGRyYWdQYW47XG4gICAgdGhpcy5kcmFnUm90YXRlID0gZHJhZ1JvdGF0ZTtcbiAgICB0aGlzLmRvdWJsZUNsaWNrWm9vbSA9IGRvdWJsZUNsaWNrWm9vbTtcbiAgICB0aGlzLnRvdWNoWm9vbSA9IHRvdWNoWm9vbVJvdGF0ZSAmJiB0b3VjaFpvb207XG4gICAgdGhpcy50b3VjaFJvdGF0ZSA9IHRvdWNoWm9vbVJvdGF0ZSAmJiB0b3VjaFJvdGF0ZTtcbiAgICB0aGlzLmtleWJvYXJkID0ga2V5Ym9hcmQ7XG4gIH1cblxuICB0b2dnbGVFdmVudHMoZXZlbnROYW1lcywgZW5hYmxlZCkge1xuICAgIGlmICh0aGlzLmV2ZW50TWFuYWdlcikge1xuICAgICAgZXZlbnROYW1lcy5mb3JFYWNoKGV2ZW50TmFtZSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9ldmVudHNbZXZlbnROYW1lXSAhPT0gZW5hYmxlZCkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tldmVudE5hbWVdID0gZW5hYmxlZDtcbiAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5ldmVudE1hbmFnZXIub24oZXZlbnROYW1lLCB0aGlzLmhhbmRsZUV2ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudE1hbmFnZXIub2ZmKGV2ZW50TmFtZSwgdGhpcy5oYW5kbGVFdmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiBFdmVudCBoYW5kbGVycyAqL1xuICAvLyBEZWZhdWx0IGhhbmRsZXIgZm9yIHRoZSBgcGFuc3RhcnRgIGV2ZW50LlxuICBfb25QYW5TdGFydChldmVudCkge1xuICAgIGNvbnN0IHBvcyA9IHRoaXMuZ2V0Q2VudGVyKGV2ZW50KTtcbiAgICBjb25zdCBuZXdNYXBTdGF0ZSA9IHRoaXMubWFwU3RhdGUucGFuU3RhcnQoe3Bvc30pLnJvdGF0ZVN0YXJ0KHtwb3N9KTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdNYXBTdGF0ZSwgTk9fVFJBTlNJVElPTl9QUk9QUywge2lzRHJhZ2dpbmc6IHRydWV9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBwYW5tb3ZlYCBldmVudC5cbiAgX29uUGFuKGV2ZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNGdW5jdGlvbktleVByZXNzZWQoZXZlbnQpIHx8IGV2ZW50LnJpZ2h0QnV0dG9uID9cbiAgICAgIHRoaXMuX29uUGFuUm90YXRlKGV2ZW50KSA6IHRoaXMuX29uUGFuTW92ZShldmVudCk7XG4gIH1cblxuICAvLyBEZWZhdWx0IGhhbmRsZXIgZm9yIHRoZSBgcGFuZW5kYCBldmVudC5cbiAgX29uUGFuRW5kKGV2ZW50KSB7XG4gICAgY29uc3QgbmV3TWFwU3RhdGUgPSB0aGlzLm1hcFN0YXRlLnBhbkVuZCgpLnJvdGF0ZUVuZCgpO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld01hcFN0YXRlLCBudWxsLCB7aXNEcmFnZ2luZzogZmFsc2V9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgcGFubmluZyB0byBtb3ZlLlxuICAvLyBDYWxsZWQgYnkgYF9vblBhbmAgd2hlbiBwYW5uaW5nIHdpdGhvdXQgZnVuY3Rpb24ga2V5IHByZXNzZWQuXG4gIF9vblBhbk1vdmUoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuZHJhZ1Bhbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBwb3MgPSB0aGlzLmdldENlbnRlcihldmVudCk7XG4gICAgY29uc3QgbmV3TWFwU3RhdGUgPSB0aGlzLm1hcFN0YXRlLnBhbih7cG9zfSk7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3TWFwU3RhdGUsIE5PX1RSQU5TSVRJT05fUFJPUFMsIHtpc0RyYWdnaW5nOiB0cnVlfSk7XG4gIH1cblxuICAvLyBEZWZhdWx0IGhhbmRsZXIgZm9yIHBhbm5pbmcgdG8gcm90YXRlLlxuICAvLyBDYWxsZWQgYnkgYF9vblBhbmAgd2hlbiBwYW5uaW5nIHdpdGggZnVuY3Rpb24ga2V5IHByZXNzZWQuXG4gIF9vblBhblJvdGF0ZShldmVudCkge1xuICAgIGlmICghdGhpcy5kcmFnUm90YXRlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qge2RlbHRhWCwgZGVsdGFZfSA9IGV2ZW50O1xuICAgIGNvbnN0IFssIGNlbnRlclldID0gdGhpcy5nZXRDZW50ZXIoZXZlbnQpO1xuICAgIGNvbnN0IHN0YXJ0WSA9IGNlbnRlclkgLSBkZWx0YVk7XG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gdGhpcy5tYXBTdGF0ZS5nZXRWaWV3cG9ydFByb3BzKCk7XG5cbiAgICBjb25zdCBkZWx0YVNjYWxlWCA9IGRlbHRhWCAvIHdpZHRoO1xuICAgIGxldCBkZWx0YVNjYWxlWSA9IDA7XG5cbiAgICBpZiAoZGVsdGFZID4gMCkge1xuICAgICAgaWYgKE1hdGguYWJzKGhlaWdodCAtIHN0YXJ0WSkgPiBQSVRDSF9NT1VTRV9USFJFU0hPTEQpIHtcbiAgICAgICAgLy8gTW92ZSBmcm9tIDAgdG8gLTEgYXMgd2UgZHJhZyB1cHdhcmRzXG4gICAgICAgIGRlbHRhU2NhbGVZID0gZGVsdGFZIC8gKHN0YXJ0WSAtIGhlaWdodCkgKiBQSVRDSF9BQ0NFTDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRlbHRhWSA8IDApIHtcbiAgICAgIGlmIChzdGFydFkgPiBQSVRDSF9NT1VTRV9USFJFU0hPTEQpIHtcbiAgICAgICAgLy8gTW92ZSBmcm9tIDAgdG8gMSBhcyB3ZSBkcmFnIHVwd2FyZHNcbiAgICAgICAgZGVsdGFTY2FsZVkgPSAxIC0gY2VudGVyWSAvIHN0YXJ0WTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGVsdGFTY2FsZVkgPSBNYXRoLm1pbigxLCBNYXRoLm1heCgtMSwgZGVsdGFTY2FsZVkpKTtcblxuICAgIGNvbnN0IG5ld01hcFN0YXRlID0gdGhpcy5tYXBTdGF0ZS5yb3RhdGUoe2RlbHRhU2NhbGVYLCBkZWx0YVNjYWxlWX0pO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld01hcFN0YXRlLCBOT19UUkFOU0lUSU9OX1BST1BTLCB7aXNEcmFnZ2luZzogdHJ1ZX0pO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYHdoZWVsYCBldmVudC5cbiAgX29uV2hlZWwoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuc2Nyb2xsWm9vbSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHBvcyA9IHRoaXMuZ2V0Q2VudGVyKGV2ZW50KTtcbiAgICBjb25zdCB7ZGVsdGF9ID0gZXZlbnQ7XG5cbiAgICAvLyBNYXAgd2hlZWwgZGVsdGEgdG8gcmVsYXRpdmUgc2NhbGVcbiAgICBsZXQgc2NhbGUgPSAyIC8gKDEgKyBNYXRoLmV4cCgtTWF0aC5hYnMoZGVsdGEgKiBaT09NX0FDQ0VMKSkpO1xuICAgIGlmIChkZWx0YSA8IDAgJiYgc2NhbGUgIT09IDApIHtcbiAgICAgIHNjYWxlID0gMSAvIHNjYWxlO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld01hcFN0YXRlID0gdGhpcy5tYXBTdGF0ZS56b29tKHtwb3MsIHNjYWxlfSk7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3TWFwU3RhdGUsIE5PX1RSQU5TSVRJT05fUFJPUFMpO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYHBpbmNoc3RhcnRgIGV2ZW50LlxuICBfb25QaW5jaFN0YXJ0KGV2ZW50KSB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5nZXRDZW50ZXIoZXZlbnQpO1xuICAgIGNvbnN0IG5ld01hcFN0YXRlID0gdGhpcy5tYXBTdGF0ZS56b29tU3RhcnQoe3Bvc30pLnJvdGF0ZVN0YXJ0KHtwb3N9KTtcbiAgICAvLyBoYWNrIC0gaGFtbWVyJ3MgYHJvdGF0aW9uYCBmaWVsZCBkb2Vzbid0IHNlZW0gdG8gcHJvZHVjZSB0aGUgY29ycmVjdCBhbmdsZVxuICAgIHRoaXMuX3N0YXRlLnN0YXJ0UGluY2hSb3RhdGlvbiA9IGV2ZW50LnJvdGF0aW9uO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld01hcFN0YXRlLCBOT19UUkFOU0lUSU9OX1BST1BTLCB7aXNEcmFnZ2luZzogdHJ1ZX0pO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYHBpbmNoYCBldmVudC5cbiAgX29uUGluY2goZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMudG91Y2hab29tICYmICF0aGlzLnRvdWNoUm90YXRlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IG5ld01hcFN0YXRlID0gdGhpcy5tYXBTdGF0ZTtcbiAgICBpZiAodGhpcy50b3VjaFpvb20pIHtcbiAgICAgIGNvbnN0IHtzY2FsZX0gPSBldmVudDtcbiAgICAgIGNvbnN0IHBvcyA9IHRoaXMuZ2V0Q2VudGVyKGV2ZW50KTtcbiAgICAgIG5ld01hcFN0YXRlID0gbmV3TWFwU3RhdGUuem9vbSh7cG9zLCBzY2FsZX0pO1xuICAgIH1cbiAgICBpZiAodGhpcy50b3VjaFJvdGF0ZSkge1xuICAgICAgY29uc3Qge3JvdGF0aW9ufSA9IGV2ZW50O1xuICAgICAgY29uc3Qge3N0YXJ0UGluY2hSb3RhdGlvbn0gPSB0aGlzLl9zdGF0ZTtcbiAgICAgIG5ld01hcFN0YXRlID0gbmV3TWFwU3RhdGUucm90YXRlKHtkZWx0YVNjYWxlWDogLShyb3RhdGlvbiAtIHN0YXJ0UGluY2hSb3RhdGlvbikgLyAxODB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdNYXBTdGF0ZSwgTk9fVFJBTlNJVElPTl9QUk9QUywge2lzRHJhZ2dpbmc6IHRydWV9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBwaW5jaGVuZGAgZXZlbnQuXG4gIF9vblBpbmNoRW5kKGV2ZW50KSB7XG4gICAgY29uc3QgbmV3TWFwU3RhdGUgPSB0aGlzLm1hcFN0YXRlLnpvb21FbmQoKS5yb3RhdGVFbmQoKTtcbiAgICB0aGlzLl9zdGF0ZS5zdGFydFBpbmNoUm90YXRpb24gPSAwO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld01hcFN0YXRlLCBudWxsLCB7aXNEcmFnZ2luZzogZmFsc2V9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBkb3VibGV0YXBgIGV2ZW50LlxuICBfb25Eb3VibGVUYXAoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuZG91YmxlQ2xpY2tab29tKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHBvcyA9IHRoaXMuZ2V0Q2VudGVyKGV2ZW50KTtcbiAgICBjb25zdCBpc1pvb21PdXQgPSB0aGlzLmlzRnVuY3Rpb25LZXlQcmVzc2VkKGV2ZW50KTtcblxuICAgIGNvbnN0IG5ld01hcFN0YXRlID0gdGhpcy5tYXBTdGF0ZS56b29tKHtwb3MsIHNjYWxlOiBpc1pvb21PdXQgPyAwLjUgOiAyfSk7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3TWFwU3RhdGUsIExJTkVBUl9UUkFOU0lUSU9OX1BST1BTKTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYGtleWRvd25gIGV2ZW50XG4gIF9vbktleURvd24oZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMua2V5Ym9hcmQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgZnVuY0tleSA9IHRoaXMuaXNGdW5jdGlvbktleVByZXNzZWQoZXZlbnQpO1xuICAgIGNvbnN0IHttYXBTdGF0ZVByb3BzfSA9IHRoaXM7XG4gICAgbGV0IG5ld01hcFN0YXRlO1xuXG4gICAgc3dpdGNoIChldmVudC5zcmNFdmVudC5rZXlDb2RlKSB7XG4gICAgY2FzZSAxODk6IC8vIC1cbiAgICAgIGlmIChmdW5jS2V5KSB7XG4gICAgICAgIG5ld01hcFN0YXRlID0gdGhpcy5nZXRNYXBTdGF0ZSh7em9vbTogbWFwU3RhdGVQcm9wcy56b29tIC0gMn0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3TWFwU3RhdGUgPSB0aGlzLmdldE1hcFN0YXRlKHt6b29tOiBtYXBTdGF0ZVByb3BzLnpvb20gLSAxfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDE4NzogLy8gK1xuICAgICAgaWYgKGZ1bmNLZXkpIHtcbiAgICAgICAgbmV3TWFwU3RhdGUgPSB0aGlzLmdldE1hcFN0YXRlKHt6b29tOiBtYXBTdGF0ZVByb3BzLnpvb20gKyAyfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdNYXBTdGF0ZSA9IHRoaXMuZ2V0TWFwU3RhdGUoe3pvb206IG1hcFN0YXRlUHJvcHMuem9vbSArIDF9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGlmIChmdW5jS2V5KSB7XG4gICAgICAgIG5ld01hcFN0YXRlID0gdGhpcy5nZXRNYXBTdGF0ZSh7YmVhcmluZzogbWFwU3RhdGVQcm9wcy5iZWFyaW5nIC0gMTV9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld01hcFN0YXRlID0gdGhpcy5tYXBTdGF0ZS5wYW4oe3BvczogWzEwMCwgMF0sIHN0YXJ0UG9zOiBbMCwgMF19KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBpZiAoZnVuY0tleSkge1xuICAgICAgICBuZXdNYXBTdGF0ZSA9IHRoaXMuZ2V0TWFwU3RhdGUoe2JlYXJpbmc6IG1hcFN0YXRlUHJvcHMuYmVhcmluZyArIDE1fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdNYXBTdGF0ZSA9IHRoaXMubWFwU3RhdGUucGFuKHtwb3M6IFstMTAwLCAwXSwgc3RhcnRQb3M6IFswLCAwXX0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGlmIChmdW5jS2V5KSB7XG4gICAgICAgIG5ld01hcFN0YXRlID0gdGhpcy5nZXRNYXBTdGF0ZSh7cGl0Y2g6IG1hcFN0YXRlUHJvcHMucGl0Y2ggKyAxMH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3TWFwU3RhdGUgPSB0aGlzLm1hcFN0YXRlLnBhbih7cG9zOiBbMCwgMTAwXSwgc3RhcnRQb3M6IFswLCAwXX0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgaWYgKGZ1bmNLZXkpIHtcbiAgICAgICAgbmV3TWFwU3RhdGUgPSB0aGlzLmdldE1hcFN0YXRlKHtwaXRjaDogbWFwU3RhdGVQcm9wcy5waXRjaCAtIDEwfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdNYXBTdGF0ZSA9IHRoaXMubWFwU3RhdGUucGFuKHtwb3M6IFswLCAtMTAwXSwgc3RhcnRQb3M6IFswLCAwXX0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3TWFwU3RhdGUsIExJTkVBUl9UUkFOU0lUSU9OX1BST1BTKTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cbn1cbiJdfQ==