'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MAPBOX_LIMITS = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _viewState = require('./view-state');

var _viewState2 = _interopRequireDefault(_viewState);

var _viewportMercatorProject = require('viewport-mercator-project');

var _viewportMercatorProject2 = _interopRequireDefault(_viewportMercatorProject);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// MAPBOX LIMITS
var MAPBOX_LIMITS = exports.MAPBOX_LIMITS = {
  minZoom: 0,
  maxZoom: 20,
  minPitch: 0,
  maxPitch: 60
};

var DEFAULT_STATE = {
  pitch: 0,
  bearing: 0,
  altitude: 1.5
};

/* Utils */
function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

var MapState = function (_ViewState) {
  _inherits(MapState, _ViewState);

  function MapState() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        width = _ref.width,
        height = _ref.height,
        latitude = _ref.latitude,
        longitude = _ref.longitude,
        zoom = _ref.zoom,
        _ref$bearing = _ref.bearing,
        bearing = _ref$bearing === undefined ? DEFAULT_STATE.bearing : _ref$bearing,
        _ref$pitch = _ref.pitch,
        pitch = _ref$pitch === undefined ? DEFAULT_STATE.pitch : _ref$pitch,
        _ref$altitude = _ref.altitude,
        altitude = _ref$altitude === undefined ? DEFAULT_STATE.altitude : _ref$altitude,
        _ref$maxZoom = _ref.maxZoom,
        maxZoom = _ref$maxZoom === undefined ? MAPBOX_LIMITS.maxZoom : _ref$maxZoom,
        _ref$minZoom = _ref.minZoom,
        minZoom = _ref$minZoom === undefined ? MAPBOX_LIMITS.minZoom : _ref$minZoom,
        _ref$maxPitch = _ref.maxPitch,
        maxPitch = _ref$maxPitch === undefined ? MAPBOX_LIMITS.maxPitch : _ref$maxPitch,
        _ref$minPitch = _ref.minPitch,
        minPitch = _ref$minPitch === undefined ? MAPBOX_LIMITS.minPitch : _ref$minPitch,
        startPanLngLat = _ref.startPanLngLat,
        startZoomLngLat = _ref.startZoomLngLat,
        startBearing = _ref.startBearing,
        startPitch = _ref.startPitch,
        startZoom = _ref.startZoom;

    _classCallCheck(this, MapState);

    (0, _assert2.default)(Number.isFinite(longitude), '`longitude` must be supplied');
    (0, _assert2.default)(Number.isFinite(latitude), '`latitude` must be supplied');
    (0, _assert2.default)(Number.isFinite(zoom), '`zoom` must be supplied');

    var _this = _possibleConstructorReturn(this, (MapState.__proto__ || Object.getPrototypeOf(MapState)).call(this, {
      width: width,
      height: height,
      latitude: latitude,
      longitude: longitude,
      zoom: zoom,
      bearing: bearing,
      pitch: pitch,
      altitude: altitude,
      maxZoom: maxZoom,
      minZoom: minZoom,
      maxPitch: maxPitch,
      minPitch: minPitch
    }));

    _this._interactiveState = {
      startPanLngLat: startPanLngLat,
      startZoomLngLat: startZoomLngLat,
      startBearing: startBearing,
      startPitch: startPitch,
      startZoom: startZoom
    };
    return _this;
  }

  /* Public API */

  _createClass(MapState, [{
    key: 'getViewportProps',
    value: function getViewportProps() {
      return this._viewportProps;
    }
  }, {
    key: 'getInteractiveState',
    value: function getInteractiveState() {
      return this._interactiveState;
    }

    /**
     * Start panning
     * @param {[Number, Number]} pos - position on screen where the pointer grabs
     */

  }, {
    key: 'panStart',
    value: function panStart(_ref2) {
      var pos = _ref2.pos;

      return this._getUpdatedState({
        startPanLngLat: this._unproject(pos)
      });
    }

    /**
     * Pan
     * @param {[Number, Number]} pos - position on screen where the pointer is
     * @param {[Number, Number], optional} startPos - where the pointer grabbed at
     *   the start of the operation. Must be supplied of `panStart()` was not called
     */

  }, {
    key: 'pan',
    value: function pan(_ref3) {
      var pos = _ref3.pos,
          startPos = _ref3.startPos;

      var startPanLngLat = this._interactiveState.startPanLngLat || this._unproject(startPos);

      if (!startPanLngLat) {
        return this;
      }

      var _calculateNewLngLat2 = this._calculateNewLngLat({ startPanLngLat: startPanLngLat, pos: pos }),
          _calculateNewLngLat3 = _slicedToArray(_calculateNewLngLat2, 2),
          longitude = _calculateNewLngLat3[0],
          latitude = _calculateNewLngLat3[1];

      return this._getUpdatedState({
        longitude: longitude,
        latitude: latitude
      });
    }

    /**
     * End panning
     * Must call if `panStart()` was called
     */

  }, {
    key: 'panEnd',
    value: function panEnd() {
      return this._getUpdatedState({
        startPanLngLat: null
      });
    }

    /**
     * Start rotating
     * @param {[Number, Number]} pos - position on screen where the center is
     */

  }, {
    key: 'rotateStart',
    value: function rotateStart(_ref4) {
      var pos = _ref4.pos;

      return this._getUpdatedState({
        startBearing: this._viewportProps.bearing,
        startPitch: this._viewportProps.pitch
      });
    }

    /**
     * Rotate
     * @param {Number} deltaScaleX - a number between [-1, 1] specifying the
     *   change to bearing.
     * @param {Number} deltaScaleY - a number between [-1, 1] specifying the
     *   change to pitch. -1 sets to minPitch and 1 sets to maxPitch.
     */

  }, {
    key: 'rotate',
    value: function rotate(_ref5) {
      var _ref5$deltaScaleX = _ref5.deltaScaleX,
          deltaScaleX = _ref5$deltaScaleX === undefined ? 0 : _ref5$deltaScaleX,
          _ref5$deltaScaleY = _ref5.deltaScaleY,
          deltaScaleY = _ref5$deltaScaleY === undefined ? 0 : _ref5$deltaScaleY;
      var _interactiveState = this._interactiveState,
          startBearing = _interactiveState.startBearing,
          startPitch = _interactiveState.startPitch;


      if (!Number.isFinite(startBearing) || !Number.isFinite(startPitch)) {
        return this;
      }

      var _calculateNewPitchAnd = this._calculateNewPitchAndBearing({
        deltaScaleX: deltaScaleX,
        deltaScaleY: deltaScaleY,
        startBearing: startBearing,
        startPitch: startPitch
      }),
          pitch = _calculateNewPitchAnd.pitch,
          bearing = _calculateNewPitchAnd.bearing;

      return this._getUpdatedState({
        bearing: bearing,
        pitch: pitch
      });
    }

    /**
     * End rotating
     * Must call if `rotateStart()` was called
     */

  }, {
    key: 'rotateEnd',
    value: function rotateEnd() {
      return this._getUpdatedState({
        startBearing: null,
        startPitch: null
      });
    }

    /**
     * Start zooming
     * @param {[Number, Number]} pos - position on screen where the center is
     */

  }, {
    key: 'zoomStart',
    value: function zoomStart(_ref6) {
      var pos = _ref6.pos;

      return this._getUpdatedState({
        startZoomLngLat: this._unproject(pos),
        startZoom: this._viewportProps.zoom
      });
    }

    /**
     * Zoom
     * @param {[Number, Number]} pos - position on screen where the current center is
     * @param {[Number, Number]} startPos - the center position at
     *   the start of the operation. Must be supplied of `zoomStart()` was not called
     * @param {Number} scale - a number between [0, 1] specifying the accumulated
     *   relative scale.
     */

  }, {
    key: 'zoom',
    value: function zoom(_ref7) {
      var pos = _ref7.pos,
          startPos = _ref7.startPos,
          scale = _ref7.scale;

      (0, _assert2.default)(scale > 0, '`scale` must be a positive number');

      // Make sure we zoom around the current mouse position rather than map center
      var _interactiveState2 = this._interactiveState,
          startZoom = _interactiveState2.startZoom,
          startZoomLngLat = _interactiveState2.startZoomLngLat;


      if (!Number.isFinite(startZoom)) {
        // We have two modes of zoom:
        // scroll zoom that are discrete events (transform from the current zoom level),
        // and pinch zoom that are continuous events (transform from the zoom level when
        // pinch started).
        // If startZoom state is defined, then use the startZoom state;
        // otherwise assume discrete zooming
        startZoom = this._viewportProps.zoom;
        startZoomLngLat = this._unproject(startPos) || this._unproject(pos);
      }

      // take the start lnglat and put it where the mouse is down.
      (0, _assert2.default)(startZoomLngLat, '`startZoomLngLat` prop is required ' + 'for zoom behavior to calculate where to position the map.');

      var zoom = this._calculateNewZoom({ scale: scale, startZoom: startZoom });

      var zoomedViewport = new _viewportMercatorProject2.default(Object.assign({}, this._viewportProps, { zoom: zoom }));

      var _zoomedViewport$getLo = zoomedViewport.getLocationAtPoint({ lngLat: startZoomLngLat, pos: pos }),
          _zoomedViewport$getLo2 = _slicedToArray(_zoomedViewport$getLo, 2),
          longitude = _zoomedViewport$getLo2[0],
          latitude = _zoomedViewport$getLo2[1];

      return this._getUpdatedState({
        zoom: zoom,
        longitude: longitude,
        latitude: latitude
      });
    }

    /**
     * End zooming
     * Must call if `zoomStart()` was called
     */

  }, {
    key: 'zoomEnd',
    value: function zoomEnd() {
      return this._getUpdatedState({
        startZoomLngLat: null,
        startZoom: null
      });
    }
  }, {
    key: 'zoomIn',
    value: function zoomIn() {
      return this._zoomFromCenter(2);
    }
  }, {
    key: 'zoomOut',
    value: function zoomOut() {
      return this._zoomFromCenter(0.5);
    }
  }, {
    key: 'moveLeft',
    value: function moveLeft() {
      return this._panFromCenter([100, 0]);
    }
  }, {
    key: 'moveRight',
    value: function moveRight() {
      return this._panFromCenter([-100, 0]);
    }
  }, {
    key: 'moveUp',
    value: function moveUp() {
      return this._panFromCenter([0, 100]);
    }
  }, {
    key: 'moveDown',
    value: function moveDown() {
      return this._panFromCenter([0, -100]);
    }
  }, {
    key: 'rotateLeft',
    value: function rotateLeft() {
      return this._getUpdatedState({
        bearing: this._viewportProps.bearing - 15
      });
    }
  }, {
    key: 'rotateRight',
    value: function rotateRight() {
      return this._getUpdatedState({
        bearing: this._viewportProps.bearing + 15
      });
    }
  }, {
    key: 'rotateUp',
    value: function rotateUp() {
      return this._getUpdatedState({
        pitch: this._viewportProps.pitch + 10
      });
    }
  }, {
    key: 'rotateDown',
    value: function rotateDown() {
      return this._getUpdatedState({
        pitch: this._viewportProps.pitch - 10
      });
    }

    /* Private methods */

  }, {
    key: '_zoomFromCenter',
    value: function _zoomFromCenter(scale) {
      var _viewportProps = this._viewportProps,
          width = _viewportProps.width,
          height = _viewportProps.height;

      return this.zoom({
        pos: [width / 2, height / 2],
        scale: scale
      });
    }
  }, {
    key: '_panFromCenter',
    value: function _panFromCenter(offset) {
      var _viewportProps2 = this._viewportProps,
          width = _viewportProps2.width,
          height = _viewportProps2.height;

      return this.pan({
        startPos: [width / 2, height / 2],
        pos: [width / 2 + offset[0], height / 2 + offset[1]]
      });
    }
  }, {
    key: '_getUpdatedState',
    value: function _getUpdatedState(newProps) {
      // Update _viewportProps
      return new MapState(Object.assign({}, this._viewportProps, this._interactiveState, newProps));
    }

    // Apply any constraints (mathematical or defined by _viewportProps) to map state

  }, {
    key: '_applyConstraints',
    value: function _applyConstraints(props) {
      // Ensure zoom is within specified range
      var maxZoom = props.maxZoom,
          minZoom = props.minZoom,
          zoom = props.zoom;

      props.zoom = clamp(zoom, minZoom, maxZoom);

      // Ensure pitch is within specified range
      var maxPitch = props.maxPitch,
          minPitch = props.minPitch,
          pitch = props.pitch;

      props.pitch = clamp(pitch, minPitch, maxPitch);

      Object.assign(props, (0, _viewportMercatorProject.normalizeViewportProps)(props));

      return props;
    }
  }, {
    key: '_unproject',
    value: function _unproject(pos) {
      var viewport = new _viewportMercatorProject2.default(this._viewportProps);
      return pos && viewport.unproject(pos);
    }

    // Calculate a new lnglat based on pixel dragging position

  }, {
    key: '_calculateNewLngLat',
    value: function _calculateNewLngLat(_ref8) {
      var startPanLngLat = _ref8.startPanLngLat,
          pos = _ref8.pos;

      var viewport = new _viewportMercatorProject2.default(this._viewportProps);
      return viewport.getMapCenterByLngLatPosition({ lngLat: startPanLngLat, pos: pos });
    }

    // Calculates new zoom

  }, {
    key: '_calculateNewZoom',
    value: function _calculateNewZoom(_ref9) {
      var scale = _ref9.scale,
          startZoom = _ref9.startZoom;
      var _viewportProps3 = this._viewportProps,
          maxZoom = _viewportProps3.maxZoom,
          minZoom = _viewportProps3.minZoom;

      var zoom = startZoom + Math.log2(scale);
      return clamp(zoom, minZoom, maxZoom);
    }

    // Calculates a new pitch and bearing from a position (coming from an event)

  }, {
    key: '_calculateNewPitchAndBearing',
    value: function _calculateNewPitchAndBearing(_ref10) {
      var deltaScaleX = _ref10.deltaScaleX,
          deltaScaleY = _ref10.deltaScaleY,
          startBearing = _ref10.startBearing,
          startPitch = _ref10.startPitch;

      // clamp deltaScaleY to [-1, 1] so that rotation is constrained between minPitch and maxPitch.
      // deltaScaleX does not need to be clamped as bearing does not have constraints.
      deltaScaleY = clamp(deltaScaleY, -1, 1);

      var _viewportProps4 = this._viewportProps,
          minPitch = _viewportProps4.minPitch,
          maxPitch = _viewportProps4.maxPitch;


      var bearing = startBearing + 180 * deltaScaleX;
      var pitch = startPitch;
      if (deltaScaleY > 0) {
        // Gradually increase pitch
        pitch = startPitch + deltaScaleY * (maxPitch - startPitch);
      } else if (deltaScaleY < 0) {
        // Gradually decrease pitch
        pitch = startPitch - deltaScaleY * (minPitch - startPitch);
      }

      return {
        pitch: pitch,
        bearing: bearing
      };
    }
  }]);

  return MapState;
}(_viewState2.default);

exports.default = MapState;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2NvbnRyb2xsZXJzL21hcC1zdGF0ZS5qcyJdLCJuYW1lcyI6WyJNQVBCT1hfTElNSVRTIiwibWluWm9vbSIsIm1heFpvb20iLCJtaW5QaXRjaCIsIm1heFBpdGNoIiwiREVGQVVMVF9TVEFURSIsInBpdGNoIiwiYmVhcmluZyIsImFsdGl0dWRlIiwiY2xhbXAiLCJ2YWx1ZSIsIm1pbiIsIm1heCIsIk1hcFN0YXRlIiwid2lkdGgiLCJoZWlnaHQiLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInpvb20iLCJzdGFydFBhbkxuZ0xhdCIsInN0YXJ0Wm9vbUxuZ0xhdCIsInN0YXJ0QmVhcmluZyIsInN0YXJ0UGl0Y2giLCJzdGFydFpvb20iLCJOdW1iZXIiLCJpc0Zpbml0ZSIsIl9pbnRlcmFjdGl2ZVN0YXRlIiwiX3ZpZXdwb3J0UHJvcHMiLCJwb3MiLCJfZ2V0VXBkYXRlZFN0YXRlIiwiX3VucHJvamVjdCIsInN0YXJ0UG9zIiwiX2NhbGN1bGF0ZU5ld0xuZ0xhdCIsImRlbHRhU2NhbGVYIiwiZGVsdGFTY2FsZVkiLCJfY2FsY3VsYXRlTmV3UGl0Y2hBbmRCZWFyaW5nIiwic2NhbGUiLCJfY2FsY3VsYXRlTmV3Wm9vbSIsInpvb21lZFZpZXdwb3J0IiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0TG9jYXRpb25BdFBvaW50IiwibG5nTGF0IiwiX3pvb21Gcm9tQ2VudGVyIiwiX3BhbkZyb21DZW50ZXIiLCJvZmZzZXQiLCJwYW4iLCJuZXdQcm9wcyIsInByb3BzIiwidmlld3BvcnQiLCJ1bnByb2plY3QiLCJnZXRNYXBDZW50ZXJCeUxuZ0xhdFBvc2l0aW9uIiwiTWF0aCIsImxvZzIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQTtBQUNPLElBQU1BLHdDQUFnQjtBQUMzQkMsV0FBUyxDQURrQjtBQUUzQkMsV0FBUyxFQUZrQjtBQUczQkMsWUFBVSxDQUhpQjtBQUkzQkMs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bnQiOlsiaW1wb3J0IFZpZXdTdGF0ZSBmcm9tICcuL3ZpZXctc3RhdGUnO1xuaW1wb3J0IFdlYk1lcmNhdG9yVmlld3BvcnQsIHtub3JtYWxpemVWaWV3cG9ydFByb3BzfSBmcm9tICd2aWV3cG9ydC1tZXJjYXRvci1wcm9qZWN0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gTUFQQk9YIExJTUlUU1xuZXhwb3J0IGNvbnN0IE1BUEJPWF9MSU1JVFMgPSB7XG4gIG1pblpvb206IDAsXG4gIG1heFpvb206IDIwLFxuICBtaW5QaXRjaDogMCxcbiAgbWF4UGl0Y2g6IDYwXG59O1xuXG5jb25zdCBERUZBVUxUX1NUQVRFID0ge1xuICBwaXRjaDogMCxcbiAgYmVhcmluZzogMCxcbiAgYWx0aXR1ZGU6IDEuNVxufTtcblxuLyogVXRpbHMgKi9cbmZ1bmN0aW9uIGNsYW1wKHZhbHVlLCBtaW4sIG1heCkge1xuICByZXR1cm4gdmFsdWUgPCBtaW4gPyBtaW4gOiB2YWx1ZSA+IG1heCA/IG1heCA6IHZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXBTdGF0ZSBleHRlbmRzIFZpZXdTdGF0ZSB7XG4gIGNvbnN0cnVjdG9yKHtcbiAgICAvKiogTWFwYm94IHZpZXdwb3J0IHByb3BlcnRpZXMgKi9cbiAgICAvKiogVGhlIHdpZHRoIG9mIHRoZSB2aWV3cG9ydCAqL1xuICAgIHdpZHRoLFxuICAgIC8qKiBUaGUgaGVpZ2h0IG9mIHRoZSB2aWV3cG9ydCAqL1xuICAgIGhlaWdodCxcbiAgICAvKiogVGhlIGxhdGl0dWRlIGF0IHRoZSBjZW50ZXIgb2YgdGhlIHZpZXdwb3J0ICovXG4gICAgbGF0aXR1ZGUsXG4gICAgLyoqIFRoZSBsb25naXR1ZGUgYXQgdGhlIGNlbnRlciBvZiB0aGUgdmlld3BvcnQgKi9cbiAgICBsb25naXR1ZGUsXG4gICAgLyoqIFRoZSB0aWxlIHpvb20gbGV2ZWwgb2YgdGhlIG1hcC4gKi9cbiAgICB6b29tLFxuICAgIC8qKiBUaGUgYmVhcmluZyBvZiB0aGUgdmlld3BvcnQgaW4gZGVncmVlcyAqL1xuICAgIGJlYXJpbmcgPSBERUZBVUxUX1NUQVRFLmJlYXJpbmcsXG4gICAgLyoqIFRoZSBwaXRjaCBvZiB0aGUgdmlld3BvcnQgaW4gZGVncmVlcyAqL1xuICAgIHBpdGNoID0gREVGQVVMVF9TVEFURS5waXRjaCxcbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoZSBhbHRpdHVkZSBvZiB0aGUgdmlld3BvcnQgY2FtZXJhXG4gICAgICogVW5pdDogbWFwIGhlaWdodHMsIGRlZmF1bHQgMS41XG4gICAgICogTm9uLXB1YmxpYyBBUEksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFwYm94L21hcGJveC1nbC1qcy9pc3N1ZXMvMTEzN1xuICAgICAqL1xuICAgIGFsdGl0dWRlID0gREVGQVVMVF9TVEFURS5hbHRpdHVkZSxcblxuICAgIC8qKiBWaWV3cG9ydCBjb25zdHJhaW50cyAqL1xuICAgIG1heFpvb20gPSBNQVBCT1hfTElNSVRTLm1heFpvb20sXG4gICAgbWluWm9vbSA9IE1BUEJPWF9MSU1JVFMubWluWm9vbSxcbiAgICBtYXhQaXRjaCA9IE1BUEJPWF9MSU1JVFMubWF4UGl0Y2gsXG4gICAgbWluUGl0Y2ggPSBNQVBCT1hfTElNSVRTLm1pblBpdGNoLFxuXG4gICAgLyoqIEludGVyYWN0aW9uIHN0YXRlcywgcmVxdWlyZWQgdG8gY2FsY3VsYXRlIGNoYW5nZSBkdXJpbmcgdHJhbnNmb3JtICovXG4gICAgLyogVGhlIHBvaW50IG9uIG1hcCBiZWluZyBncmFiYmVkIHdoZW4gdGhlIG9wZXJhdGlvbiBmaXJzdCBzdGFydGVkICovXG4gICAgc3RhcnRQYW5MbmdMYXQsXG4gICAgLyogQ2VudGVyIG9mIHRoZSB6b29tIHdoZW4gdGhlIG9wZXJhdGlvbiBmaXJzdCBzdGFydGVkICovXG4gICAgc3RhcnRab29tTG5nTGF0LFxuICAgIC8qKiBCZWFyaW5nIHdoZW4gY3VycmVudCBwZXJzcGVjdGl2ZSByb3RhdGUgb3BlcmF0aW9uIHN0YXJ0ZWQgKi9cbiAgICBzdGFydEJlYXJpbmcsXG4gICAgLyoqIFBpdGNoIHdoZW4gY3VycmVudCBwZXJzcGVjdGl2ZSByb3RhdGUgb3BlcmF0aW9uIHN0YXJ0ZWQgKi9cbiAgICBzdGFydFBpdGNoLFxuICAgIC8qKiBab29tIHdoZW4gY3VycmVudCB6b29tIG9wZXJhdGlvbiBzdGFydGVkICovXG4gICAgc3RhcnRab29tXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydChOdW1iZXIuaXNGaW5pdGUobG9uZ2l0dWRlKSwgJ2Bsb25naXR1ZGVgIG11c3QgYmUgc3VwcGxpZWQnKTtcbiAgICBhc3NlcnQoTnVtYmVyLmlzRmluaXRlKGxhdGl0dWRlKSwgJ2BsYXRpdHVkZWAgbXVzdCBiZSBzdXBwbGllZCcpO1xuICAgIGFzc2VydChOdW1iZXIuaXNGaW5pdGUoem9vbSksICdgem9vbWAgbXVzdCBiZSBzdXBwbGllZCcpO1xuXG4gICAgc3VwZXIoe1xuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBsYXRpdHVkZSxcbiAgICAgIGxvbmdpdHVkZSxcbiAgICAgIHpvb20sXG4gICAgICBiZWFyaW5nLFxuICAgICAgcGl0Y2gsXG4gICAgICBhbHRpdHVkZSxcbiAgICAgIG1heFpvb20sXG4gICAgICBtaW5ab29tLFxuICAgICAgbWF4UGl0Y2gsXG4gICAgICBtaW5QaXRjaFxuICAgIH0pO1xuXG4gICAgdGhpcy5faW50ZXJhY3RpdmVTdGF0ZSA9IHtcbiAgICAgIHN0YXJ0UGFuTG5nTGF0LFxuICAgICAgc3RhcnRab29tTG5nTGF0LFxuICAgICAgc3RhcnRCZWFyaW5nLFxuICAgICAgc3RhcnRQaXRjaCxcbiAgICAgIHN0YXJ0Wm9vbVxuICAgIH07XG4gIH1cblxuICAvKiBQdWJsaWMgQVBJICovXG5cbiAgZ2V0Vmlld3BvcnRQcm9wcygpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3BvcnRQcm9wcztcbiAgfVxuXG4gIGdldEludGVyYWN0aXZlU3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aXZlU3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgcGFubmluZ1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgcG9pbnRlciBncmFic1xuICAgKi9cbiAgcGFuU3RhcnQoe3Bvc30pIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0VXBkYXRlZFN0YXRlKHtcbiAgICAgIHN0YXJ0UGFuTG5nTGF0OiB0aGlzLl91bnByb2plY3QocG9zKVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhblxuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgcG9pbnRlciBpc1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl0sIG9wdGlvbmFsfSBzdGFydFBvcyAtIHdoZXJlIHRoZSBwb2ludGVyIGdyYWJiZWQgYXRcbiAgICogICB0aGUgc3RhcnQgb2YgdGhlIG9wZXJhdGlvbi4gTXVzdCBiZSBzdXBwbGllZCBvZiBgcGFuU3RhcnQoKWAgd2FzIG5vdCBjYWxsZWRcbiAgICovXG4gIHBhbih7cG9zLCBzdGFydFBvc30pIHtcbiAgICBjb25zdCBzdGFydFBhbkxuZ0xhdCA9IHRoaXMuX2ludGVyYWN0aXZlU3RhdGUuc3RhcnRQYW5MbmdMYXQgfHwgdGhpcy5fdW5wcm9qZWN0KHN0YXJ0UG9zKTtcblxuICAgIGlmICghc3RhcnRQYW5MbmdMYXQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IFtsb25naXR1ZGUsIGxhdGl0dWRlXSA9IHRoaXMuX2NhbGN1bGF0ZU5ld0xuZ0xhdCh7c3RhcnRQYW5MbmdMYXQsIHBvc30pO1xuXG4gICAgcmV0dXJuIHRoaXMuX2dldFVwZGF0ZWRTdGF0ZSh7XG4gICAgICBsb25naXR1ZGUsXG4gICAgICBsYXRpdHVkZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZCBwYW5uaW5nXG4gICAqIE11c3QgY2FsbCBpZiBgcGFuU3RhcnQoKWAgd2FzIGNhbGxlZFxuICAgKi9cbiAgcGFuRW5kKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgc3RhcnRQYW5MbmdMYXQ6IG51bGxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCByb3RhdGluZ1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgY2VudGVyIGlzXG4gICAqL1xuICByb3RhdGVTdGFydCh7cG9zfSkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgc3RhcnRCZWFyaW5nOiB0aGlzLl92aWV3cG9ydFByb3BzLmJlYXJpbmcsXG4gICAgICBzdGFydFBpdGNoOiB0aGlzLl92aWV3cG9ydFByb3BzLnBpdGNoXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUm90YXRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVNjYWxlWCAtIGEgbnVtYmVyIGJldHdlZW4gWy0xLCAxXSBzcGVjaWZ5aW5nIHRoZVxuICAgKiAgIGNoYW5nZSB0byBiZWFyaW5nLlxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFTY2FsZVkgLSBhIG51bWJlciBiZXR3ZWVuIFstMSwgMV0gc3BlY2lmeWluZyB0aGVcbiAgICogICBjaGFuZ2UgdG8gcGl0Y2guIC0xIHNldHMgdG8gbWluUGl0Y2ggYW5kIDEgc2V0cyB0byBtYXhQaXRjaC5cbiAgICovXG4gIHJvdGF0ZSh7ZGVsdGFTY2FsZVggPSAwLCBkZWx0YVNjYWxlWSA9IDB9KSB7XG4gICAgY29uc3Qge3N0YXJ0QmVhcmluZywgc3RhcnRQaXRjaH0gPSB0aGlzLl9pbnRlcmFjdGl2ZVN0YXRlO1xuXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoc3RhcnRCZWFyaW5nKSB8fCAhTnVtYmVyLmlzRmluaXRlKHN0YXJ0UGl0Y2gpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25zdCB7cGl0Y2gsIGJlYXJpbmd9ID0gdGhpcy5fY2FsY3VsYXRlTmV3UGl0Y2hBbmRCZWFyaW5nKHtcbiAgICAgIGRlbHRhU2NhbGVYLFxuICAgICAgZGVsdGFTY2FsZVksXG4gICAgICBzdGFydEJlYXJpbmcsXG4gICAgICBzdGFydFBpdGNoXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5fZ2V0VXBkYXRlZFN0YXRlKHtcbiAgICAgIGJlYXJpbmcsXG4gICAgICBwaXRjaFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZCByb3RhdGluZ1xuICAgKiBNdXN0IGNhbGwgaWYgYHJvdGF0ZVN0YXJ0KClgIHdhcyBjYWxsZWRcbiAgICovXG4gIHJvdGF0ZUVuZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0VXBkYXRlZFN0YXRlKHtcbiAgICAgIHN0YXJ0QmVhcmluZzogbnVsbCxcbiAgICAgIHN0YXJ0UGl0Y2g6IG51bGxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB6b29taW5nXG4gICAqIEBwYXJhbSB7W051bWJlciwgTnVtYmVyXX0gcG9zIC0gcG9zaXRpb24gb24gc2NyZWVuIHdoZXJlIHRoZSBjZW50ZXIgaXNcbiAgICovXG4gIHpvb21TdGFydCh7cG9zfSkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgc3RhcnRab29tTG5nTGF0OiB0aGlzLl91bnByb2plY3QocG9zKSxcbiAgICAgIHN0YXJ0Wm9vbTogdGhpcy5fdmlld3BvcnRQcm9wcy56b29tXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogWm9vbVxuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgY3VycmVudCBjZW50ZXIgaXNcbiAgICogQHBhcmFtIHtbTnVtYmVyLCBOdW1iZXJdfSBzdGFydFBvcyAtIHRoZSBjZW50ZXIgcG9zaXRpb24gYXRcbiAgICogICB0aGUgc3RhcnQgb2YgdGhlIG9wZXJhdGlvbi4gTXVzdCBiZSBzdXBwbGllZCBvZiBgem9vbVN0YXJ0KClgIHdhcyBub3QgY2FsbGVkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSAtIGEgbnVtYmVyIGJldHdlZW4gWzAsIDFdIHNwZWNpZnlpbmcgdGhlIGFjY3VtdWxhdGVkXG4gICAqICAgcmVsYXRpdmUgc2NhbGUuXG4gICAqL1xuICB6b29tKHtwb3MsIHN0YXJ0UG9zLCBzY2FsZX0pIHtcbiAgICBhc3NlcnQoc2NhbGUgPiAwLCAnYHNjYWxlYCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG5cbiAgICAvLyBNYWtlIHN1cmUgd2Ugem9vbSBhcm91bmQgdGhlIGN1cnJlbnQgbW91c2UgcG9zaXRpb24gcmF0aGVyIHRoYW4gbWFwIGNlbnRlclxuICAgIGxldCB7c3RhcnRab29tLCBzdGFydFpvb21MbmdMYXR9ID0gdGhpcy5faW50ZXJhY3RpdmVTdGF0ZTtcblxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHN0YXJ0Wm9vbSkpIHtcbiAgICAgIC8vIFdlIGhhdmUgdHdvIG1vZGVzIG9mIHpvb206XG4gICAgICAvLyBzY3JvbGwgem9vbSB0aGF0IGFyZSBkaXNjcmV0ZSBldmVudHMgKHRyYW5zZm9ybSBmcm9tIHRoZSBjdXJyZW50IHpvb20gbGV2ZWwpLFxuICAgICAgLy8gYW5kIHBpbmNoIHpvb20gdGhhdCBhcmUgY29udGludW91cyBldmVudHMgKHRyYW5zZm9ybSBmcm9tIHRoZSB6b29tIGxldmVsIHdoZW5cbiAgICAgIC8vIHBpbmNoIHN0YXJ0ZWQpLlxuICAgICAgLy8gSWYgc3RhcnRab29tIHN0YXRlIGlzIGRlZmluZWQsIHRoZW4gdXNlIHRoZSBzdGFydFpvb20gc3RhdGU7XG4gICAgICAvLyBvdGhlcndpc2UgYXNzdW1lIGRpc2NyZXRlIHpvb21pbmdcbiAgICAgIHN0YXJ0Wm9vbSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHMuem9vbTtcbiAgICAgIHN0YXJ0Wm9vbUxuZ0xhdCA9IHRoaXMuX3VucHJvamVjdChzdGFydFBvcykgfHwgdGhpcy5fdW5wcm9qZWN0KHBvcyk7XG4gICAgfVxuXG4gICAgLy8gdGFrZSB0aGUgc3RhcnQgbG5nbGF0IGFuZCBwdXQgaXQgd2hlcmUgdGhlIG1vdXNlIGlzIGRvd24uXG4gICAgYXNzZXJ0KFxuICAgICAgc3RhcnRab29tTG5nTGF0LFxuICAgICAgJ2BzdGFydFpvb21MbmdMYXRgIHByb3AgaXMgcmVxdWlyZWQgJyArXG4gICAgICAgICdmb3Igem9vbSBiZWhhdmlvciB0byBjYWxjdWxhdGUgd2hlcmUgdG8gcG9zaXRpb24gdGhlIG1hcC4nXG4gICAgKTtcblxuICAgIGNvbnN0IHpvb20gPSB0aGlzLl9jYWxjdWxhdGVOZXdab29tKHtzY2FsZSwgc3RhcnRab29tfSk7XG5cbiAgICBjb25zdCB6b29tZWRWaWV3cG9ydCA9IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX3ZpZXdwb3J0UHJvcHMsIHt6b29tfSkpO1xuICAgIGNvbnN0IFtsb25naXR1ZGUsIGxhdGl0dWRlXSA9IHpvb21lZFZpZXdwb3J0LmdldExvY2F0aW9uQXRQb2ludCh7bG5nTGF0OiBzdGFydFpvb21MbmdMYXQsIHBvc30pO1xuXG4gICAgcmV0dXJuIHRoaXMuX2dldFVwZGF0ZWRTdGF0ZSh7XG4gICAgICB6b29tLFxuICAgICAgbG9uZ2l0dWRlLFxuICAgICAgbGF0aXR1ZGVcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmQgem9vbWluZ1xuICAgKiBNdXN0IGNhbGwgaWYgYHpvb21TdGFydCgpYCB3YXMgY2FsbGVkXG4gICAqL1xuICB6b29tRW5kKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgc3RhcnRab29tTG5nTGF0OiBudWxsLFxuICAgICAgc3RhcnRab29tOiBudWxsXG4gICAgfSk7XG4gIH1cblxuICB6b29tSW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3pvb21Gcm9tQ2VudGVyKDIpO1xuICB9XG5cbiAgem9vbU91dCgpIHtcbiAgICByZXR1cm4gdGhpcy5fem9vbUZyb21DZW50ZXIoMC41KTtcbiAgfVxuXG4gIG1vdmVMZWZ0KCkge1xuICAgIHJldHVybiB0aGlzLl9wYW5Gcm9tQ2VudGVyKFsxMDAsIDBdKTtcbiAgfVxuXG4gIG1vdmVSaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFuRnJvbUNlbnRlcihbLTEwMCwgMF0pO1xuICB9XG5cbiAgbW92ZVVwKCkge1xuICAgIHJldHVybiB0aGlzLl9wYW5Gcm9tQ2VudGVyKFswLCAxMDBdKTtcbiAgfVxuXG4gIG1vdmVEb3duKCkge1xuICAgIHJldHVybiB0aGlzLl9wYW5Gcm9tQ2VudGVyKFswLCAtMTAwXSk7XG4gIH1cblxuICByb3RhdGVMZWZ0KCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgYmVhcmluZzogdGhpcy5fdmlld3BvcnRQcm9wcy5iZWFyaW5nIC0gMTVcbiAgICB9KTtcbiAgfVxuXG4gIHJvdGF0ZVJpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgYmVhcmluZzogdGhpcy5fdmlld3BvcnRQcm9wcy5iZWFyaW5nICsgMTVcbiAgICB9KTtcbiAgfVxuXG4gIHJvdGF0ZVVwKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkU3RhdGUoe1xuICAgICAgcGl0Y2g6IHRoaXMuX3ZpZXdwb3J0UHJvcHMucGl0Y2ggKyAxMFxuICAgIH0pO1xuICB9XG5cbiAgcm90YXRlRG93bigpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0VXBkYXRlZFN0YXRlKHtcbiAgICAgIHBpdGNoOiB0aGlzLl92aWV3cG9ydFByb3BzLnBpdGNoIC0gMTBcbiAgICB9KTtcbiAgfVxuXG4gIC8qIFByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIF96b29tRnJvbUNlbnRlcihzY2FsZSkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHM7XG4gICAgcmV0dXJuIHRoaXMuem9vbSh7XG4gICAgICBwb3M6IFt3aWR0aCAvIDIsIGhlaWdodCAvIDJdLFxuICAgICAgc2NhbGVcbiAgICB9KTtcbiAgfVxuXG4gIF9wYW5Gcm9tQ2VudGVyKG9mZnNldCkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHM7XG4gICAgcmV0dXJuIHRoaXMucGFuKHtcbiAgICAgIHN0YXJ0UG9zOiBbd2lkdGggLyAyLCBoZWlnaHQgLyAyXSxcbiAgICAgIHBvczogW3dpZHRoIC8gMiArIG9mZnNldFswXSwgaGVpZ2h0IC8gMiArIG9mZnNldFsxXV1cbiAgICB9KTtcbiAgfVxuXG4gIF9nZXRVcGRhdGVkU3RhdGUobmV3UHJvcHMpIHtcbiAgICAvLyBVcGRhdGUgX3ZpZXdwb3J0UHJvcHNcbiAgICByZXR1cm4gbmV3IE1hcFN0YXRlKE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX3ZpZXdwb3J0UHJvcHMsIHRoaXMuX2ludGVyYWN0aXZlU3RhdGUsIG5ld1Byb3BzKSk7XG4gIH1cblxuICAvLyBBcHBseSBhbnkgY29uc3RyYWludHMgKG1hdGhlbWF0aWNhbCBvciBkZWZpbmVkIGJ5IF92aWV3cG9ydFByb3BzKSB0byBtYXAgc3RhdGVcbiAgX2FwcGx5Q29uc3RyYWludHMocHJvcHMpIHtcbiAgICAvLyBFbnN1cmUgem9vbSBpcyB3aXRoaW4gc3BlY2lmaWVkIHJhbmdlXG4gICAgY29uc3Qge21heFpvb20sIG1pblpvb20sIHpvb219ID0gcHJvcHM7XG4gICAgcHJvcHMuem9vbSA9IGNsYW1wKHpvb20sIG1pblpvb20sIG1heFpvb20pO1xuXG4gICAgLy8gRW5zdXJlIHBpdGNoIGlzIHdpdGhpbiBzcGVjaWZpZWQgcmFuZ2VcbiAgICBjb25zdCB7bWF4UGl0Y2gsIG1pblBpdGNoLCBwaXRjaH0gPSBwcm9wcztcbiAgICBwcm9wcy5waXRjaCA9IGNsYW1wKHBpdGNoLCBtaW5QaXRjaCwgbWF4UGl0Y2gpO1xuXG4gICAgT2JqZWN0LmFzc2lnbihwcm9wcywgbm9ybWFsaXplVmlld3BvcnRQcm9wcyhwcm9wcykpO1xuXG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgX3VucHJvamVjdChwb3MpIHtcbiAgICBjb25zdCB2aWV3cG9ydCA9IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHRoaXMuX3ZpZXdwb3J0UHJvcHMpO1xuICAgIHJldHVybiBwb3MgJiYgdmlld3BvcnQudW5wcm9qZWN0KHBvcyk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgYSBuZXcgbG5nbGF0IGJhc2VkIG9uIHBpeGVsIGRyYWdnaW5nIHBvc2l0aW9uXG4gIF9jYWxjdWxhdGVOZXdMbmdMYXQoe3N0YXJ0UGFuTG5nTGF0LCBwb3N9KSB7XG4gICAgY29uc3Qgdmlld3BvcnQgPSBuZXcgV2ViTWVyY2F0b3JWaWV3cG9ydCh0aGlzLl92aWV3cG9ydFByb3BzKTtcbiAgICByZXR1cm4gdmlld3BvcnQuZ2V0TWFwQ2VudGVyQnlMbmdMYXRQb3NpdGlvbih7bG5nTGF0OiBzdGFydFBhbkxuZ0xhdCwgcG9zfSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIG5ldyB6b29tXG4gIF9jYWxjdWxhdGVOZXdab29tKHtzY2FsZSwgc3RhcnRab29tfSkge1xuICAgIGNvbnN0IHttYXhab29tLCBtaW5ab29tfSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHM7XG4gICAgY29uc3Qgem9vbSA9IHN0YXJ0Wm9vbSArIE1hdGgubG9nMihzY2FsZSk7XG4gICAgcmV0dXJuIGNsYW1wKHpvb20sIG1pblpvb20sIG1heFpvb20pO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyBhIG5ldyBwaXRjaCBhbmQgYmVhcmluZyBmcm9tIGEgcG9zaXRpb24gKGNvbWluZyBmcm9tIGFuIGV2ZW50KVxuICBfY2FsY3VsYXRlTmV3UGl0Y2hBbmRCZWFyaW5nKHtkZWx0YVNjYWxlWCwgZGVsdGFTY2FsZVksIHN0YXJ0QmVhcmluZywgc3RhcnRQaXRjaH0pIHtcbiAgICAvLyBjbGFtcCBkZWx0YVNjYWxlWSB0byBbLTEsIDFdIHNvIHRoYXQgcm90YXRpb24gaXMgY29uc3RyYWluZWQgYmV0d2VlbiBtaW5QaXRjaCBhbmQgbWF4UGl0Y2guXG4gICAgLy8gZGVsdGFTY2FsZVggZG9lcyBub3QgbmVlZCB0byBiZSBjbGFtcGVkIGFzIGJlYXJpbmcgZG9lcyBub3QgaGF2ZSBjb25zdHJhaW50cy5cbiAgICBkZWx0YVNjYWxlWSA9IGNsYW1wKGRlbHRhU2NhbGVZLCAtMSwgMSk7XG5cbiAgICBjb25zdCB7bWluUGl0Y2gsIG1heFBpdGNofSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHM7XG5cbiAgICBjb25zdCBiZWFyaW5nID0gc3RhcnRCZWFyaW5nICsgMTgwICogZGVsdGFTY2FsZVg7XG4gICAgbGV0IHBpdGNoID0gc3RhcnRQaXRjaDtcbiAgICBpZiAoZGVsdGFTY2FsZVkgPiAwKSB7XG4gICAgICAvLyBHcmFkdWFsbHkgaW5jcmVhc2UgcGl0Y2hcbiAgICAgIHBpdGNoID0gc3RhcnRQaXRjaCArIGRlbHRhU2NhbGVZICogKG1heFBpdGNoIC0gc3RhcnRQaXRjaCk7XG4gICAgfSBlbHNlIGlmIChkZWx0YVNjYWxlWSA8IDApIHtcbiAgICAgIC8vIEdyYWR1YWxseSBkZWNyZWFzZSBwaXRjaFxuICAgICAgcGl0Y2ggPSBzdGFydFBpdGNoIC0gZGVsdGFTY2FsZVkgKiAobWluUGl0Y2ggLSBzdGFydFBpdGNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGl0Y2gsXG4gICAgICBiZWFyaW5nXG4gICAgfTtcbiAgfVxufVxuIl19