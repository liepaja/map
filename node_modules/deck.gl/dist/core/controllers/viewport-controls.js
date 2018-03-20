'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Copyright (c) 2015 Uber Technologies, Inc.

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

var _mapState = require('./map-state');

var _mapState2 = _interopRequireDefault(_mapState);

var _linearInterpolator = require('../transitions/linear-interpolator');

var _linearInterpolator2 = _interopRequireDefault(_linearInterpolator);

var _transitionManager = require('../lib/transition-manager');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NO_TRANSITION_PROPS = {
  transitionDuration: 0
};
var LINEAR_TRANSITION_PROPS = {
  transitionDuration: 300,
  transitionEasing: function transitionEasing(t) {
    return t;
  },
  transitionInterpolator: new _linearInterpolator2.default(),
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

var ViewportControls = function () {
  /**
   * @classdesc
   * A class that handles events and updates mercator style viewport parameters
   */
  function ViewportControls(ViewportState) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ViewportControls);

    (0, _assert2.default)(ViewportState);
    this.ViewportState = ViewportState;
    this.viewportState = null;
    this.viewportStateProps = null;
    this.eventManager = null;
    this._events = null;
    this._state = {
      isDragging: false
    };
    this.events = [];

    this.handleEvent = this.handleEvent.bind(this);

    this.setOptions(options);

    if (this.constructor === ViewportControls) {
      Object.seal(this);
    }
  }

  /**
   * Callback for events
   * @param {hammer.Event} event
   */


  _createClass(ViewportControls, [{
    key: 'handleEvent',
    value: function handleEvent(event) {
      var ViewportState = this.ViewportState;

      this.viewportState = new ViewportState(Object.assign({}, this.viewportStateProps, this._state));

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
    key: 'isDragging',
    value: function isDragging() {
      return this._state.isDragging;
    }

    /**
     * Extract interactivity options
     */

  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      var onViewportChange = options.onViewportChange,
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


      this.onViewportChange = onViewportChange;
      this.onStateChange = onStateChange;
      this.viewportStateProps = options;

      if (this.eventManager !== eventManager) {
        // EventManager has changed
        this.eventManager = eventManager;
        this._events = {};
        this.toggleEvents(this.events, true);
      }

      // Register/unregister events
      var isInteractive = Boolean(this.onViewportChange);
      this.toggleEvents(EVENT_TYPES.WHEEL, isInteractive && scrollZoom);
      this.toggleEvents(EVENT_TYPES.PAN, isInteractive && (dragPan || dragRotate));
      this.toggleEvents(EVENT_TYPES.PINCH, isInteractive && (touchZoom || touchRotate));
      this.toggleEvents(EVENT_TYPES.DOUBLE_TAP, isInteractive && doubleClickZoom);
      this.toggleEvents(EVENT_TYPES.KEYBOARD, isInteractive && keyboard);

      // Interaction toggles
      this.scrollZoom = scrollZoom;
      this.dragPan = dragPan;
      this.dragRotate = dragRotate;
      this.doubleClickZoom = doubleClickZoom;
      this.touchZoom = touchZoom;
      this.touchRotate = touchRotate;
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

    // Private Methods

  }, {
    key: 'setState',
    value: function setState(newState) {
      Object.assign(this._state, newState);
      if (this.onStateChange) {
        this.onStateChange(this._state);
      }
    }

    /* Callback util */
    // formats map state and invokes callback function

  }, {
    key: 'updateViewport',
    value: function updateViewport(newViewportState) {
      var extraProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var extraState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var oldViewport = this.viewportState.getViewportProps();
      var newViewport = Object.assign({}, newViewportState.getViewportProps(), extraProps);

      if (this.onViewportChange && Object.keys(newViewport).some(function (key) {
        return oldViewport[key] !== newViewport[key];
      })) {
        // Viewport has changed
        var viewport = this.viewportState.getViewport ? this.viewportState.getViewport() : null;
        this.onViewportChange(newViewport, viewport);
      }

      this.setState(Object.assign({}, newViewportState.getInteractiveState(), extraState));
    }

    /* Event handlers */
    // Default handler for the `panstart` event.

  }, {
    key: '_onPanStart',
    value: function _onPanStart(event) {
      var pos = this.getCenter(event);
      var newViewportState = this.viewportState.panStart({ pos: pos }).rotateStart({ pos: pos });
      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS, { isDragging: true });
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
      var newViewportState = this.viewportState.panEnd().rotateEnd();
      return this.updateViewport(newViewportState, null, { isDragging: false });
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
      var newViewportState = this.viewportState.pan({ pos: pos });
      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for panning to rotate.
    // Called by `_onPan` when panning with function key pressed.

  }, {
    key: '_onPanRotate',
    value: function _onPanRotate(event) {
      if (!this.dragRotate) {
        return false;
      }

      return this.viewportState instanceof _mapState2.default ? this._onPanRotateMap(event) : this._onPanRotateStandard(event);
    }

    // Normal pan to rotate

  }, {
    key: '_onPanRotateStandard',
    value: function _onPanRotateStandard(event) {
      var deltaX = event.deltaX,
          deltaY = event.deltaY;

      var _viewportState$getVie = this.viewportState.getViewportProps(),
          width = _viewportState$getVie.width,
          height = _viewportState$getVie.height;

      var deltaScaleX = deltaX / width;
      var deltaScaleY = deltaY / height;

      var newViewportState = this.viewportState.rotate({ deltaScaleX: deltaScaleX, deltaScaleY: deltaScaleY });
      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS, { isDragging: true });
    }
  }, {
    key: '_onPanRotateMap',
    value: function _onPanRotateMap(event) {
      var deltaX = event.deltaX,
          deltaY = event.deltaY;

      var _getCenter = this.getCenter(event),
          _getCenter2 = _slicedToArray(_getCenter, 2),
          centerY = _getCenter2[1];

      var startY = centerY - deltaY;

      var _viewportState$getVie2 = this.viewportState.getViewportProps(),
          width = _viewportState$getVie2.width,
          height = _viewportState$getVie2.height;

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

      var newViewportState = this.viewportState.rotate({ deltaScaleX: deltaScaleX, deltaScaleY: deltaScaleY });
      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS, { isDragging: true });
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

      var newViewportState = this.viewportState.zoom({ pos: pos, scale: scale });
      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS);
    }

    // Default handler for the `pinchstart` event.

  }, {
    key: '_onPinchStart',
    value: function _onPinchStart(event) {
      var pos = this.getCenter(event);
      var newViewportState = this.viewportState.zoomStart({ pos: pos }).rotateStart({ pos: pos });
      // hack - hammer's `rotation` field doesn't seem to produce the correct angle
      this._state.startPinchRotation = event.rotation;
      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for the `pinch` event.

  }, {
    key: '_onPinch',
    value: function _onPinch(event) {
      if (!this.touchZoom && !this.touchRotate) {
        return false;
      }

      var newViewportState = this.viewportState;
      if (this.touchZoom) {
        var scale = event.scale;

        var pos = this.getCenter(event);
        newViewportState = newViewportState.zoom({ pos: pos, scale: scale });
      }
      if (this.touchRotate) {
        var rotation = event.rotation;
        var startPinchRotation = this._state.startPinchRotation;

        newViewportState = newViewportState.rotate({
          deltaScaleX: -(rotation - startPinchRotation) / 180
        });
      }

      return this.updateViewport(newViewportState, NO_TRANSITION_PROPS, { isDragging: true });
    }

    // Default handler for the `pinchend` event.

  }, {
    key: '_onPinchEnd',
    value: function _onPinchEnd(event) {
      var newViewportState = this.viewportState.zoomEnd().rotateEnd();
      this._state.startPinchRotation = 0;
      return this.updateViewport(newViewportState, null, { isDragging: false });
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

      var newViewportState = this.viewportState.zoom({ pos: pos, scale: isZoomOut ? 0.5 : 2 });
      return this.updateViewport(newViewportState, LINEAR_TRANSITION_PROPS);
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
      var viewportState = this.viewportState;

      var newViewportState = void 0;

      switch (event.srcEvent.keyCode) {
        case 189:
          // -
          newViewportState = funcKey ? viewportState.zoomOut().zoomOut() : viewportState.zoomOut();
          break;
        case 187:
          // +
          newViewportState = funcKey ? viewportState.zoomIn().zoomIn() : viewportState.zoomIn();
          break;
        case 37:
          // left
          newViewportState = funcKey ? viewportState.rotateLeft() : viewportState.moveLeft();
          break;
        case 39:
          // right
          newViewportState = funcKey ? viewportState.rotateRight() : viewportState.moveRight();
          break;
        case 38:
          // up
          newViewportState = funcKey ? viewportState.rotateUp() : viewportState.moveUp();
          break;
        case 40:
          // down
          newViewportState = funcKey ? viewportState.rotateDown() : viewportState.moveDown();
          break;
        default:
          return false;
      }
      return this.updateViewport(newViewportState, LINEAR_TRANSITION_PROPS);
    }
    /* eslint-enable complexity */

  }]);

  return ViewportControls;
}();

exports.default = ViewportControls;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2NvbnRyb2xsZXJzL3ZpZXdwb3J0LWNvbnRyb2xzLmpzIl0sIm5hbWVzIjpbIk5PX1RSQU5TSVRJT05fUFJPUFMiLCJ0cmFuc2l0aW9uRHVyYXRpb24iLCJMSU5FQVJfVFJBTlNJVElPTl9QUk9QUyIsInRyYW5zaXRpb25FYXNpbmciLCJ0IiwidHJhbnNpdGlvbkludGVycG9sYXRvciIsInRyYW5zaXRpb25JbnRlcnJ1cHRpb24iLCJCUkVBSyIsIlBJVENIX01PVVNFX1RIUkVTSE9MRCIsIlBJVENIX0FDQ0VMIiwiWk9PTV9BQ0NFTCIsIkVWRU5UX1RZUEVTIiwiV0hFRUwiLCJQQU4iLCJQSU5DSCIsIkRPVUJMRV9UQVAiLCJLRVlCT0FSRCIsIlZpZXdwb3J0Q29udHJvbHMiLCJWaWV3cG9ydFN0YXRlIiwib3B0aW9ucyIsInZpZXdwb3J0U3RhdGUiLCJ2aWV3cG9ydFN0YXRlUHJvcHMiLCJldmVudE1hbmFnZXIiLCJfZXZlbnRzIiwiX3N0YXRlIiwiaXNEcmFnZ2luZyIsImV2ZW50cyIsImhhbmRsZUV2ZW50IiwiYmluZCIsInNldE9wdGlvbnMiLCJjb25zdHJ1Y3RvciIsIk9iamVjdCIsInNlYWwiLCJldmVudCIsImFzc2lnbiIsInR5cGUiLCJfb25QYW5TdGFydCIsIl9vblBhbiIsIl9vblBhbkVuZCIsIl9vblBpbmNoU3RhcnQiLCJfb25QaW5jaCIsIl9vblBpbmNoRW5kIiwiX29uRG91YmxlVGFwIiwiX29uV2hlZWwiLCJfb25LZXlEb3duIiwib2Zmc2V0Q2VudGVyIiwieCIsInkiLCJzcmNFdmVudCIsIkJvb2xlYW4iLCJtZXRhS2V5IiwiYWx0S2V5IiwiY3RybEtleSIsInNoaWZ0S2V5Iiwib25WaWV3cG9ydENoYW5nZSIsIm9uU3RhdGVDaGFuZ2UiLCJzY3JvbGxab29tIiwiZHJhZ1BhbiIsImRyYWdSb3RhdGUiLCJkb3VibGVDbGlja1pvb20iLCJ0b3VjaFpvb20iLCJ0b3VjaFJvdGF0ZSIsImtleWJvYXJkIiwidG9nZ2xlRXZlbnRzIiwiaXNJbnRlcmFjdGl2ZSIsImV2ZW50TmFtZXMiLCJlbmFibGVkIiwiZm9yRWFjaCIsImV2ZW50TmFtZSIsIm9uIiwib2ZmIiwibmV3U3RhdGUiLCJuZXdWaWV3cG9ydFN0YXRlIiwiZXh0cmFQcm9wcyIsImV4dHJhU3RhdGUiLCJvbGRWaWV3cG9ydCIsImdldFZpZXdwb3J0UHJvcHMiLCJuZXdWaWV3cG9ydCIsImtleXMiLCJzb21lIiwia2V5Iiwidmlld3BvcnQiLCJnZXRWaWV3cG9ydCIsInNldFN0YXRlIiwiZ2V0SW50ZXJhY3RpdmVTdGF0ZSIsInBvcyIsImdldENlbnRlciIsInBhblN0YXJ0Iiwicm90YXRlU3RhcnQiLCJ1cGRhdGVWaWV3cG9ydCIsImlzRnVuY3Rpb25LZXlQcmVzc2VkIiwicmlnaHRCdXR0b24iLCJfb25QYW5Sb3RhdGUiLCJfb25QYW5Nb3ZlIiwicGFuRW5kIiwicm90YXRlRW5kIiwicGFuIiwiX29uUGFuUm90YXRlTWFwIiwiX29uUGFuUm90YXRlU3RhbmRhcmQiLCJkZWx0YVgiLCJkZWx0YVkiLCJ3aWR0aCIsImhlaWdodCIsImRlbHRhU2NhbGVYIiwiZGVsdGFTY2FsZVkiLCJyb3RhdGUiLCJjZW50ZXJZIiwic3RhcnRZIiwiTWF0aCIsImFicyIsIm1pbiIsIm1heCIsImRlbHRhIiwic2NhbGUiLCJleHAiLCJ6b29tIiwiem9vbVN0YXJ0Iiwic3RhcnRQaW5jaFJvdGF0aW9uIiwicm90YXRpb24iLCJ6b29tRW5kIiwiaXNab29tT3V0IiwiZnVuY0tleSIsImtleUNvZGUiLCJ6b29tT3V0Iiwiem9vbUluIiwicm90YXRlTGVmdCIsIm1vdmVMZWZ0Iiwicm90YXRlUmlnaHQiLCJtb3ZlUmlnaHQiLCJyb3RhdGVVcCIsIm1vdmVVcCIsInJvdGF0ZURvd24iLCJtb3ZlRG93biJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7cWpCQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QkEsYUFBTyxLQUFLM0MsY0FBTCxDQUFvQmpCLGdCQUFwQixFQUFzQ3RFLHVCQUF0QyxDQUFQO0FBQ0Q7QUFDRDs7Ozs7OztrQkE1Vm1CZSxnQiIsImZpbGUiOiJ2aWV3cG9ydC1jb250cm9scy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCBNYXBTdGF0ZSBmcm9tICcuL21hcC1zdGF0ZSc7XG5pbXBvcnQgTGluZWFySW50ZXJwb2xhdG9yIGZyb20gJy4uL3RyYW5zaXRpb25zL2xpbmVhci1pbnRlcnBvbGF0b3InO1xuaW1wb3J0IHtUUkFOU0lUSU9OX0VWRU5UU30gZnJvbSAnLi4vbGliL3RyYW5zaXRpb24tbWFuYWdlcic7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IE5PX1RSQU5TSVRJT05fUFJPUFMgPSB7XG4gIHRyYW5zaXRpb25EdXJhdGlvbjogMFxufTtcbmNvbnN0IExJTkVBUl9UUkFOU0lUSU9OX1BST1BTID0ge1xuICB0cmFuc2l0aW9uRHVyYXRpb246IDMwMCxcbiAgdHJhbnNpdGlvbkVhc2luZzogdCA9PiB0LFxuICB0cmFuc2l0aW9uSW50ZXJwb2xhdG9yOiBuZXcgTGluZWFySW50ZXJwb2xhdG9yKCksXG4gIHRyYW5zaXRpb25JbnRlcnJ1cHRpb246IFRSQU5TSVRJT05fRVZFTlRTLkJSRUFLXG59O1xuXG4vLyBFVkVOVCBIQU5ETElORyBQQVJBTUVURVJTXG5jb25zdCBQSVRDSF9NT1VTRV9USFJFU0hPTEQgPSA1O1xuY29uc3QgUElUQ0hfQUNDRUwgPSAxLjI7XG5jb25zdCBaT09NX0FDQ0VMID0gMC4wMTtcblxuY29uc3QgRVZFTlRfVFlQRVMgPSB7XG4gIFdIRUVMOiBbJ3doZWVsJ10sXG4gIFBBTjogWydwYW5zdGFydCcsICdwYW5tb3ZlJywgJ3BhbmVuZCddLFxuICBQSU5DSDogWydwaW5jaHN0YXJ0JywgJ3BpbmNobW92ZScsICdwaW5jaGVuZCddLFxuICBET1VCTEVfVEFQOiBbJ2RvdWJsZXRhcCddLFxuICBLRVlCT0FSRDogWydrZXlkb3duJ11cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZpZXdwb3J0Q29udHJvbHMge1xuICAvKipcbiAgICogQGNsYXNzZGVzY1xuICAgKiBBIGNsYXNzIHRoYXQgaGFuZGxlcyBldmVudHMgYW5kIHVwZGF0ZXMgbWVyY2F0b3Igc3R5bGUgdmlld3BvcnQgcGFyYW1ldGVyc1xuICAgKi9cbiAgY29uc3RydWN0b3IoVmlld3BvcnRTdGF0ZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgYXNzZXJ0KFZpZXdwb3J0U3RhdGUpO1xuICAgIHRoaXMuVmlld3BvcnRTdGF0ZSA9IFZpZXdwb3J0U3RhdGU7XG4gICAgdGhpcy52aWV3cG9ydFN0YXRlID0gbnVsbDtcbiAgICB0aGlzLnZpZXdwb3J0U3RhdGVQcm9wcyA9IG51bGw7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgPSBudWxsO1xuICAgIHRoaXMuX2V2ZW50cyA9IG51bGw7XG4gICAgdGhpcy5fc3RhdGUgPSB7XG4gICAgICBpc0RyYWdnaW5nOiBmYWxzZVxuICAgIH07XG4gICAgdGhpcy5ldmVudHMgPSBbXTtcblxuICAgIHRoaXMuaGFuZGxlRXZlbnQgPSB0aGlzLmhhbmRsZUV2ZW50LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICBpZiAodGhpcy5jb25zdHJ1Y3RvciA9PT0gVmlld3BvcnRDb250cm9scykge1xuICAgICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIGZvciBldmVudHNcbiAgICogQHBhcmFtIHtoYW1tZXIuRXZlbnR9IGV2ZW50XG4gICAqL1xuICBoYW5kbGVFdmVudChldmVudCkge1xuICAgIGNvbnN0IHtWaWV3cG9ydFN0YXRlfSA9IHRoaXM7XG4gICAgdGhpcy52aWV3cG9ydFN0YXRlID0gbmV3IFZpZXdwb3J0U3RhdGUoT2JqZWN0LmFzc2lnbih7fSwgdGhpcy52aWV3cG9ydFN0YXRlUHJvcHMsIHRoaXMuX3N0YXRlKSk7XG5cbiAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgJ3BhbnN0YXJ0JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uUGFuU3RhcnQoZXZlbnQpO1xuICAgICAgY2FzZSAncGFubW92ZSc6XG4gICAgICAgIHJldHVybiB0aGlzLl9vblBhbihldmVudCk7XG4gICAgICBjYXNlICdwYW5lbmQnOlxuICAgICAgICByZXR1cm4gdGhpcy5fb25QYW5FbmQoZXZlbnQpO1xuICAgICAgY2FzZSAncGluY2hzdGFydCc6XG4gICAgICAgIHJldHVybiB0aGlzLl9vblBpbmNoU3RhcnQoZXZlbnQpO1xuICAgICAgY2FzZSAncGluY2htb3ZlJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uUGluY2goZXZlbnQpO1xuICAgICAgY2FzZSAncGluY2hlbmQnOlxuICAgICAgICByZXR1cm4gdGhpcy5fb25QaW5jaEVuZChldmVudCk7XG4gICAgICBjYXNlICdkb3VibGV0YXAnOlxuICAgICAgICByZXR1cm4gdGhpcy5fb25Eb3VibGVUYXAoZXZlbnQpO1xuICAgICAgY2FzZSAnd2hlZWwnOlxuICAgICAgICByZXR1cm4gdGhpcy5fb25XaGVlbChldmVudCk7XG4gICAgICBjYXNlICdrZXlkb3duJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX29uS2V5RG93bihldmVudCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyogRXZlbnQgdXRpbHMgKi9cbiAgLy8gRXZlbnQgb2JqZWN0OiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL2FwaS8jZXZlbnQtb2JqZWN0XG4gIGdldENlbnRlcihldmVudCkge1xuICAgIGNvbnN0IHtvZmZzZXRDZW50ZXI6IHt4LCB5fX0gPSBldmVudDtcbiAgICByZXR1cm4gW3gsIHldO1xuICB9XG5cbiAgaXNGdW5jdGlvbktleVByZXNzZWQoZXZlbnQpIHtcbiAgICBjb25zdCB7c3JjRXZlbnR9ID0gZXZlbnQ7XG4gICAgcmV0dXJuIEJvb2xlYW4oc3JjRXZlbnQubWV0YUtleSB8fCBzcmNFdmVudC5hbHRLZXkgfHwgc3JjRXZlbnQuY3RybEtleSB8fCBzcmNFdmVudC5zaGlmdEtleSk7XG4gIH1cblxuICBpc0RyYWdnaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGF0ZS5pc0RyYWdnaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgaW50ZXJhY3Rpdml0eSBvcHRpb25zXG4gICAqL1xuICBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBvblZpZXdwb3J0Q2hhbmdlLFxuICAgICAgb25TdGF0ZUNoYW5nZSA9IHRoaXMub25TdGF0ZUNoYW5nZSxcbiAgICAgIGV2ZW50TWFuYWdlciA9IHRoaXMuZXZlbnRNYW5hZ2VyLFxuICAgICAgc2Nyb2xsWm9vbSA9IHRydWUsXG4gICAgICBkcmFnUGFuID0gdHJ1ZSxcbiAgICAgIGRyYWdSb3RhdGUgPSB0cnVlLFxuICAgICAgZG91YmxlQ2xpY2tab29tID0gdHJ1ZSxcbiAgICAgIHRvdWNoWm9vbSA9IHRydWUsXG4gICAgICB0b3VjaFJvdGF0ZSA9IGZhbHNlLFxuICAgICAga2V5Ym9hcmQgPSB0cnVlXG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLm9uVmlld3BvcnRDaGFuZ2UgPSBvblZpZXdwb3J0Q2hhbmdlO1xuICAgIHRoaXMub25TdGF0ZUNoYW5nZSA9IG9uU3RhdGVDaGFuZ2U7XG4gICAgdGhpcy52aWV3cG9ydFN0YXRlUHJvcHMgPSBvcHRpb25zO1xuXG4gICAgaWYgKHRoaXMuZXZlbnRNYW5hZ2VyICE9PSBldmVudE1hbmFnZXIpIHtcbiAgICAgIC8vIEV2ZW50TWFuYWdlciBoYXMgY2hhbmdlZFxuICAgICAgdGhpcy5ldmVudE1hbmFnZXIgPSBldmVudE1hbmFnZXI7XG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgIHRoaXMudG9nZ2xlRXZlbnRzKHRoaXMuZXZlbnRzLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBSZWdpc3Rlci91bnJlZ2lzdGVyIGV2ZW50c1xuICAgIGNvbnN0IGlzSW50ZXJhY3RpdmUgPSBCb29sZWFuKHRoaXMub25WaWV3cG9ydENoYW5nZSk7XG4gICAgdGhpcy50b2dnbGVFdmVudHMoRVZFTlRfVFlQRVMuV0hFRUwsIGlzSW50ZXJhY3RpdmUgJiYgc2Nyb2xsWm9vbSk7XG4gICAgdGhpcy50b2dnbGVFdmVudHMoRVZFTlRfVFlQRVMuUEFOLCBpc0ludGVyYWN0aXZlICYmIChkcmFnUGFuIHx8IGRyYWdSb3RhdGUpKTtcbiAgICB0aGlzLnRvZ2dsZUV2ZW50cyhFVkVOVF9UWVBFUy5QSU5DSCwgaXNJbnRlcmFjdGl2ZSAmJiAodG91Y2hab29tIHx8IHRvdWNoUm90YXRlKSk7XG4gICAgdGhpcy50b2dnbGVFdmVudHMoRVZFTlRfVFlQRVMuRE9VQkxFX1RBUCwgaXNJbnRlcmFjdGl2ZSAmJiBkb3VibGVDbGlja1pvb20pO1xuICAgIHRoaXMudG9nZ2xlRXZlbnRzKEVWRU5UX1RZUEVTLktFWUJPQVJELCBpc0ludGVyYWN0aXZlICYmIGtleWJvYXJkKTtcblxuICAgIC8vIEludGVyYWN0aW9uIHRvZ2dsZXNcbiAgICB0aGlzLnNjcm9sbFpvb20gPSBzY3JvbGxab29tO1xuICAgIHRoaXMuZHJhZ1BhbiA9IGRyYWdQYW47XG4gICAgdGhpcy5kcmFnUm90YXRlID0gZHJhZ1JvdGF0ZTtcbiAgICB0aGlzLmRvdWJsZUNsaWNrWm9vbSA9IGRvdWJsZUNsaWNrWm9vbTtcbiAgICB0aGlzLnRvdWNoWm9vbSA9IHRvdWNoWm9vbTtcbiAgICB0aGlzLnRvdWNoUm90YXRlID0gdG91Y2hSb3RhdGU7XG4gICAgdGhpcy5rZXlib2FyZCA9IGtleWJvYXJkO1xuICB9XG5cbiAgdG9nZ2xlRXZlbnRzKGV2ZW50TmFtZXMsIGVuYWJsZWQpIHtcbiAgICBpZiAodGhpcy5ldmVudE1hbmFnZXIpIHtcbiAgICAgIGV2ZW50TmFtZXMuZm9yRWFjaChldmVudE5hbWUgPT4ge1xuICAgICAgICBpZiAodGhpcy5fZXZlbnRzW2V2ZW50TmFtZV0gIT09IGVuYWJsZWQpIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbZXZlbnROYW1lXSA9IGVuYWJsZWQ7XG4gICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRNYW5hZ2VyLm9uKGV2ZW50TmFtZSwgdGhpcy5oYW5kbGVFdmVudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRNYW5hZ2VyLm9mZihldmVudE5hbWUsIHRoaXMuaGFuZGxlRXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZSBNZXRob2RzXG5cbiAgc2V0U3RhdGUobmV3U3RhdGUpIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuX3N0YXRlLCBuZXdTdGF0ZSk7XG4gICAgaWYgKHRoaXMub25TdGF0ZUNoYW5nZSkge1xuICAgICAgdGhpcy5vblN0YXRlQ2hhbmdlKHRoaXMuX3N0YXRlKTtcbiAgICB9XG4gIH1cblxuICAvKiBDYWxsYmFjayB1dGlsICovXG4gIC8vIGZvcm1hdHMgbWFwIHN0YXRlIGFuZCBpbnZva2VzIGNhbGxiYWNrIGZ1bmN0aW9uXG4gIHVwZGF0ZVZpZXdwb3J0KG5ld1ZpZXdwb3J0U3RhdGUsIGV4dHJhUHJvcHMgPSB7fSwgZXh0cmFTdGF0ZSA9IHt9KSB7XG4gICAgY29uc3Qgb2xkVmlld3BvcnQgPSB0aGlzLnZpZXdwb3J0U3RhdGUuZ2V0Vmlld3BvcnRQcm9wcygpO1xuICAgIGNvbnN0IG5ld1ZpZXdwb3J0ID0gT2JqZWN0LmFzc2lnbih7fSwgbmV3Vmlld3BvcnRTdGF0ZS5nZXRWaWV3cG9ydFByb3BzKCksIGV4dHJhUHJvcHMpO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5vblZpZXdwb3J0Q2hhbmdlICYmXG4gICAgICBPYmplY3Qua2V5cyhuZXdWaWV3cG9ydCkuc29tZShrZXkgPT4gb2xkVmlld3BvcnRba2V5XSAhPT0gbmV3Vmlld3BvcnRba2V5XSlcbiAgICApIHtcbiAgICAgIC8vIFZpZXdwb3J0IGhhcyBjaGFuZ2VkXG4gICAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMudmlld3BvcnRTdGF0ZS5nZXRWaWV3cG9ydCA/IHRoaXMudmlld3BvcnRTdGF0ZS5nZXRWaWV3cG9ydCgpIDogbnVsbDtcbiAgICAgIHRoaXMub25WaWV3cG9ydENoYW5nZShuZXdWaWV3cG9ydCwgdmlld3BvcnQpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoT2JqZWN0LmFzc2lnbih7fSwgbmV3Vmlld3BvcnRTdGF0ZS5nZXRJbnRlcmFjdGl2ZVN0YXRlKCksIGV4dHJhU3RhdGUpKTtcbiAgfVxuXG4gIC8qIEV2ZW50IGhhbmRsZXJzICovXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBwYW5zdGFydGAgZXZlbnQuXG4gIF9vblBhblN0YXJ0KGV2ZW50KSB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5nZXRDZW50ZXIoZXZlbnQpO1xuICAgIGNvbnN0IG5ld1ZpZXdwb3J0U3RhdGUgPSB0aGlzLnZpZXdwb3J0U3RhdGUucGFuU3RhcnQoe3Bvc30pLnJvdGF0ZVN0YXJ0KHtwb3N9KTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdWaWV3cG9ydFN0YXRlLCBOT19UUkFOU0lUSU9OX1BST1BTLCB7aXNEcmFnZ2luZzogdHJ1ZX0pO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYHBhbm1vdmVgIGV2ZW50LlxuICBfb25QYW4oZXZlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5pc0Z1bmN0aW9uS2V5UHJlc3NlZChldmVudCkgfHwgZXZlbnQucmlnaHRCdXR0b25cbiAgICAgID8gdGhpcy5fb25QYW5Sb3RhdGUoZXZlbnQpXG4gICAgICA6IHRoaXMuX29uUGFuTW92ZShldmVudCk7XG4gIH1cblxuICAvLyBEZWZhdWx0IGhhbmRsZXIgZm9yIHRoZSBgcGFuZW5kYCBldmVudC5cbiAgX29uUGFuRW5kKGV2ZW50KSB7XG4gICAgY29uc3QgbmV3Vmlld3BvcnRTdGF0ZSA9IHRoaXMudmlld3BvcnRTdGF0ZS5wYW5FbmQoKS5yb3RhdGVFbmQoKTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdWaWV3cG9ydFN0YXRlLCBudWxsLCB7aXNEcmFnZ2luZzogZmFsc2V9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgcGFubmluZyB0byBtb3ZlLlxuICAvLyBDYWxsZWQgYnkgYF9vblBhbmAgd2hlbiBwYW5uaW5nIHdpdGhvdXQgZnVuY3Rpb24ga2V5IHByZXNzZWQuXG4gIF9vblBhbk1vdmUoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuZHJhZ1Bhbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBwb3MgPSB0aGlzLmdldENlbnRlcihldmVudCk7XG4gICAgY29uc3QgbmV3Vmlld3BvcnRTdGF0ZSA9IHRoaXMudmlld3BvcnRTdGF0ZS5wYW4oe3Bvc30pO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld1ZpZXdwb3J0U3RhdGUsIE5PX1RSQU5TSVRJT05fUFJPUFMsIHtpc0RyYWdnaW5nOiB0cnVlfSk7XG4gIH1cblxuICAvLyBEZWZhdWx0IGhhbmRsZXIgZm9yIHBhbm5pbmcgdG8gcm90YXRlLlxuICAvLyBDYWxsZWQgYnkgYF9vblBhbmAgd2hlbiBwYW5uaW5nIHdpdGggZnVuY3Rpb24ga2V5IHByZXNzZWQuXG4gIF9vblBhblJvdGF0ZShldmVudCkge1xuICAgIGlmICghdGhpcy5kcmFnUm90YXRlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudmlld3BvcnRTdGF0ZSBpbnN0YW5jZW9mIE1hcFN0YXRlXG4gICAgICA/IHRoaXMuX29uUGFuUm90YXRlTWFwKGV2ZW50KVxuICAgICAgOiB0aGlzLl9vblBhblJvdGF0ZVN0YW5kYXJkKGV2ZW50KTtcbiAgfVxuXG4gIC8vIE5vcm1hbCBwYW4gdG8gcm90YXRlXG4gIF9vblBhblJvdGF0ZVN0YW5kYXJkKGV2ZW50KSB7XG4gICAgY29uc3Qge2RlbHRhWCwgZGVsdGFZfSA9IGV2ZW50O1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMudmlld3BvcnRTdGF0ZS5nZXRWaWV3cG9ydFByb3BzKCk7XG5cbiAgICBjb25zdCBkZWx0YVNjYWxlWCA9IGRlbHRhWCAvIHdpZHRoO1xuICAgIGNvbnN0IGRlbHRhU2NhbGVZID0gZGVsdGFZIC8gaGVpZ2h0O1xuXG4gICAgY29uc3QgbmV3Vmlld3BvcnRTdGF0ZSA9IHRoaXMudmlld3BvcnRTdGF0ZS5yb3RhdGUoe2RlbHRhU2NhbGVYLCBkZWx0YVNjYWxlWX0pO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld1ZpZXdwb3J0U3RhdGUsIE5PX1RSQU5TSVRJT05fUFJPUFMsIHtpc0RyYWdnaW5nOiB0cnVlfSk7XG4gIH1cblxuICBfb25QYW5Sb3RhdGVNYXAoZXZlbnQpIHtcbiAgICBjb25zdCB7ZGVsdGFYLCBkZWx0YVl9ID0gZXZlbnQ7XG4gICAgY29uc3QgWywgY2VudGVyWV0gPSB0aGlzLmdldENlbnRlcihldmVudCk7XG4gICAgY29uc3Qgc3RhcnRZID0gY2VudGVyWSAtIGRlbHRhWTtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLnZpZXdwb3J0U3RhdGUuZ2V0Vmlld3BvcnRQcm9wcygpO1xuXG4gICAgY29uc3QgZGVsdGFTY2FsZVggPSBkZWx0YVggLyB3aWR0aDtcbiAgICBsZXQgZGVsdGFTY2FsZVkgPSAwO1xuXG4gICAgaWYgKGRlbHRhWSA+IDApIHtcbiAgICAgIGlmIChNYXRoLmFicyhoZWlnaHQgLSBzdGFydFkpID4gUElUQ0hfTU9VU0VfVEhSRVNIT0xEKSB7XG4gICAgICAgIC8vIE1vdmUgZnJvbSAwIHRvIC0xIGFzIHdlIGRyYWcgdXB3YXJkc1xuICAgICAgICBkZWx0YVNjYWxlWSA9IGRlbHRhWSAvIChzdGFydFkgLSBoZWlnaHQpICogUElUQ0hfQUNDRUw7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChkZWx0YVkgPCAwKSB7XG4gICAgICBpZiAoc3RhcnRZID4gUElUQ0hfTU9VU0VfVEhSRVNIT0xEKSB7XG4gICAgICAgIC8vIE1vdmUgZnJvbSAwIHRvIDEgYXMgd2UgZHJhZyB1cHdhcmRzXG4gICAgICAgIGRlbHRhU2NhbGVZID0gMSAtIGNlbnRlclkgLyBzdGFydFk7XG4gICAgICB9XG4gICAgfVxuICAgIGRlbHRhU2NhbGVZID0gTWF0aC5taW4oMSwgTWF0aC5tYXgoLTEsIGRlbHRhU2NhbGVZKSk7XG5cbiAgICBjb25zdCBuZXdWaWV3cG9ydFN0YXRlID0gdGhpcy52aWV3cG9ydFN0YXRlLnJvdGF0ZSh7ZGVsdGFTY2FsZVgsIGRlbHRhU2NhbGVZfSk7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3Vmlld3BvcnRTdGF0ZSwgTk9fVFJBTlNJVElPTl9QUk9QUywge2lzRHJhZ2dpbmc6IHRydWV9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGB3aGVlbGAgZXZlbnQuXG4gIF9vbldoZWVsKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbFpvb20pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBwb3MgPSB0aGlzLmdldENlbnRlcihldmVudCk7XG4gICAgY29uc3Qge2RlbHRhfSA9IGV2ZW50O1xuXG4gICAgLy8gTWFwIHdoZWVsIGRlbHRhIHRvIHJlbGF0aXZlIHNjYWxlXG4gICAgbGV0IHNjYWxlID0gMiAvICgxICsgTWF0aC5leHAoLU1hdGguYWJzKGRlbHRhICogWk9PTV9BQ0NFTCkpKTtcbiAgICBpZiAoZGVsdGEgPCAwICYmIHNjYWxlICE9PSAwKSB7XG4gICAgICBzY2FsZSA9IDEgLyBzY2FsZTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdWaWV3cG9ydFN0YXRlID0gdGhpcy52aWV3cG9ydFN0YXRlLnpvb20oe3Bvcywgc2NhbGV9KTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdWaWV3cG9ydFN0YXRlLCBOT19UUkFOU0lUSU9OX1BST1BTKTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBwaW5jaHN0YXJ0YCBldmVudC5cbiAgX29uUGluY2hTdGFydChldmVudCkge1xuICAgIGNvbnN0IHBvcyA9IHRoaXMuZ2V0Q2VudGVyKGV2ZW50KTtcbiAgICBjb25zdCBuZXdWaWV3cG9ydFN0YXRlID0gdGhpcy52aWV3cG9ydFN0YXRlLnpvb21TdGFydCh7cG9zfSkucm90YXRlU3RhcnQoe3Bvc30pO1xuICAgIC8vIGhhY2sgLSBoYW1tZXIncyBgcm90YXRpb25gIGZpZWxkIGRvZXNuJ3Qgc2VlbSB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IGFuZ2xlXG4gICAgdGhpcy5fc3RhdGUuc3RhcnRQaW5jaFJvdGF0aW9uID0gZXZlbnQucm90YXRpb247XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3Vmlld3BvcnRTdGF0ZSwgTk9fVFJBTlNJVElPTl9QUk9QUywge2lzRHJhZ2dpbmc6IHRydWV9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBwaW5jaGAgZXZlbnQuXG4gIF9vblBpbmNoKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLnRvdWNoWm9vbSAmJiAhdGhpcy50b3VjaFJvdGF0ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBuZXdWaWV3cG9ydFN0YXRlID0gdGhpcy52aWV3cG9ydFN0YXRlO1xuICAgIGlmICh0aGlzLnRvdWNoWm9vbSkge1xuICAgICAgY29uc3Qge3NjYWxlfSA9IGV2ZW50O1xuICAgICAgY29uc3QgcG9zID0gdGhpcy5nZXRDZW50ZXIoZXZlbnQpO1xuICAgICAgbmV3Vmlld3BvcnRTdGF0ZSA9IG5ld1ZpZXdwb3J0U3RhdGUuem9vbSh7cG9zLCBzY2FsZX0pO1xuICAgIH1cbiAgICBpZiAodGhpcy50b3VjaFJvdGF0ZSkge1xuICAgICAgY29uc3Qge3JvdGF0aW9ufSA9IGV2ZW50O1xuICAgICAgY29uc3Qge3N0YXJ0UGluY2hSb3RhdGlvbn0gPSB0aGlzLl9zdGF0ZTtcbiAgICAgIG5ld1ZpZXdwb3J0U3RhdGUgPSBuZXdWaWV3cG9ydFN0YXRlLnJvdGF0ZSh7XG4gICAgICAgIGRlbHRhU2NhbGVYOiAtKHJvdGF0aW9uIC0gc3RhcnRQaW5jaFJvdGF0aW9uKSAvIDE4MFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVmlld3BvcnQobmV3Vmlld3BvcnRTdGF0ZSwgTk9fVFJBTlNJVElPTl9QUk9QUywge2lzRHJhZ2dpbmc6IHRydWV9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBwaW5jaGVuZGAgZXZlbnQuXG4gIF9vblBpbmNoRW5kKGV2ZW50KSB7XG4gICAgY29uc3QgbmV3Vmlld3BvcnRTdGF0ZSA9IHRoaXMudmlld3BvcnRTdGF0ZS56b29tRW5kKCkucm90YXRlRW5kKCk7XG4gICAgdGhpcy5fc3RhdGUuc3RhcnRQaW5jaFJvdGF0aW9uID0gMDtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdWaWV3cG9ydFN0YXRlLCBudWxsLCB7aXNEcmFnZ2luZzogZmFsc2V9KTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlciBmb3IgdGhlIGBkb3VibGV0YXBgIGV2ZW50LlxuICBfb25Eb3VibGVUYXAoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuZG91YmxlQ2xpY2tab29tKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHBvcyA9IHRoaXMuZ2V0Q2VudGVyKGV2ZW50KTtcbiAgICBjb25zdCBpc1pvb21PdXQgPSB0aGlzLmlzRnVuY3Rpb25LZXlQcmVzc2VkKGV2ZW50KTtcblxuICAgIGNvbnN0IG5ld1ZpZXdwb3J0U3RhdGUgPSB0aGlzLnZpZXdwb3J0U3RhdGUuem9vbSh7cG9zLCBzY2FsZTogaXNab29tT3V0ID8gMC41IDogMn0pO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZVZpZXdwb3J0KG5ld1ZpZXdwb3J0U3RhdGUsIExJTkVBUl9UUkFOU0lUSU9OX1BST1BTKTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYGtleWRvd25gIGV2ZW50XG4gIF9vbktleURvd24oZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMua2V5Ym9hcmQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgZnVuY0tleSA9IHRoaXMuaXNGdW5jdGlvbktleVByZXNzZWQoZXZlbnQpO1xuICAgIGNvbnN0IHt2aWV3cG9ydFN0YXRlfSA9IHRoaXM7XG4gICAgbGV0IG5ld1ZpZXdwb3J0U3RhdGU7XG5cbiAgICBzd2l0Y2ggKGV2ZW50LnNyY0V2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMTg5OiAvLyAtXG4gICAgICAgIG5ld1ZpZXdwb3J0U3RhdGUgPSBmdW5jS2V5ID8gdmlld3BvcnRTdGF0ZS56b29tT3V0KCkuem9vbU91dCgpIDogdmlld3BvcnRTdGF0ZS56b29tT3V0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODc6IC8vICtcbiAgICAgICAgbmV3Vmlld3BvcnRTdGF0ZSA9IGZ1bmNLZXkgPyB2aWV3cG9ydFN0YXRlLnpvb21JbigpLnpvb21JbigpIDogdmlld3BvcnRTdGF0ZS56b29tSW4oKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICAgIG5ld1ZpZXdwb3J0U3RhdGUgPSBmdW5jS2V5ID8gdmlld3BvcnRTdGF0ZS5yb3RhdGVMZWZ0KCkgOiB2aWV3cG9ydFN0YXRlLm1vdmVMZWZ0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgICAgbmV3Vmlld3BvcnRTdGF0ZSA9IGZ1bmNLZXkgPyB2aWV3cG9ydFN0YXRlLnJvdGF0ZVJpZ2h0KCkgOiB2aWV3cG9ydFN0YXRlLm1vdmVSaWdodCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICAgIG5ld1ZpZXdwb3J0U3RhdGUgPSBmdW5jS2V5ID8gdmlld3BvcnRTdGF0ZS5yb3RhdGVVcCgpIDogdmlld3BvcnRTdGF0ZS5tb3ZlVXAoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICAgIG5ld1ZpZXdwb3J0U3RhdGUgPSBmdW5jS2V5ID8gdmlld3BvcnRTdGF0ZS5yb3RhdGVEb3duKCkgOiB2aWV3cG9ydFN0YXRlLm1vdmVEb3duKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy51cGRhdGVWaWV3cG9ydChuZXdWaWV3cG9ydFN0YXRlLCBMSU5FQVJfVFJBTlNJVElPTl9QUk9QUyk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5ICovXG59XG4iXX0=