'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MAPBOX_LIMITS = undefined;

var _log = require('babel-runtime/core-js/math/log2');

var _log2 = _interopRequireDefault(_log);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _isFinite = require('babel-runtime/core-js/number/is-finite');

var _isFinite2 = _interopRequireDefault(_isFinite);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _viewportMercatorProject = require('viewport-mercator-project');

var _viewportMercatorProject2 = _interopRequireDefault(_viewportMercatorProject);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var MapState = function () {
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

    (0, _classCallCheck3.default)(this, MapState);

    (0, _assert2.default)((0, _isFinite2.default)(width), '`width` must be supplied');
    (0, _assert2.default)((0, _isFinite2.default)(height), '`height` must be supplied');
    (0, _assert2.default)((0, _isFinite2.default)(longitude), '`longitude` must be supplied');
    (0, _assert2.default)((0, _isFinite2.default)(latitude), '`latitude` must be supplied');
    (0, _assert2.default)((0, _isFinite2.default)(zoom), '`zoom` must be supplied');

    this._viewportProps = this._applyConstraints({
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
    });

    this._interactiveState = {
      startPanLngLat: startPanLngLat,
      startZoomLngLat: startZoomLngLat,
      startBearing: startBearing,
      startPitch: startPitch,
      startZoom: startZoom
    };
  }

  /* Public API */

  (0, _createClass3.default)(MapState, [{
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

      return this._getUpdatedMapState({
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
          _calculateNewLngLat3 = (0, _slicedToArray3.default)(_calculateNewLngLat2, 2),
          longitude = _calculateNewLngLat3[0],
          latitude = _calculateNewLngLat3[1];

      return this._getUpdatedMapState({
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
      return this._getUpdatedMapState({
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

      return this._getUpdatedMapState({
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


      if (!(0, _isFinite2.default)(startBearing) || !(0, _isFinite2.default)(startPitch)) {
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

      return this._getUpdatedMapState({
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
      return this._getUpdatedMapState({
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

      return this._getUpdatedMapState({
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


      if (!(0, _isFinite2.default)(startZoom)) {
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

      var zoomedViewport = new _viewportMercatorProject2.default((0, _assign2.default)({}, this._viewportProps, { zoom: zoom }));

      var _zoomedViewport$getLo = zoomedViewport.getLocationAtPoint({ lngLat: startZoomLngLat, pos: pos }),
          _zoomedViewport$getLo2 = (0, _slicedToArray3.default)(_zoomedViewport$getLo, 2),
          longitude = _zoomedViewport$getLo2[0],
          latitude = _zoomedViewport$getLo2[1];

      return this._getUpdatedMapState({
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
      return this._getUpdatedMapState({
        startZoomLngLat: null,
        startZoom: null
      });
    }

    /* Private methods */

  }, {
    key: '_getUpdatedMapState',
    value: function _getUpdatedMapState(newProps) {
      // Update _viewportProps
      return new MapState((0, _assign2.default)({}, this._viewportProps, this._interactiveState, newProps));
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

      (0, _assign2.default)(props, (0, _viewportMercatorProject.normalizeViewportProps)(props));

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
      var _viewportProps = this._viewportProps,
          maxZoom = _viewportProps.maxZoom,
          minZoom = _viewportProps.minZoom;

      var zoom = startZoom + (0, _log2.default)(scale);
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

      var _viewportProps2 = this._viewportProps,
          minPitch = _viewportProps2.minPitch,
          maxPitch = _viewportProps2.maxPitch;


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
}();

exports.default = MapState;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9tYXAtc3RhdGUuanMiXSwibmFtZXMiOlsiTUFQQk9YX0xJTUlUUyIsIm1pblpvb20iLCJtYXhab29tIiwibWluUGl0Y2giLCJtYXhQaXRjaCIsIkRFRkFVTFRfU1RBVEUiLCJwaXRjaCIsImJlYXJpbmciLCJhbHRpdHVkZSIsImNsYW1wIiwidmFsdWUiLCJtaW4iLCJtYXgiLCJNYXBTdGF0ZSIsIndpZHRoIiwiaGVpZ2h0IiwibGF0aXR1ZGUiLCJsb25naXR1ZGUiLCJ6b29tIiwic3RhcnRQYW5MbmdMYXQiLCJzdGFydFpvb21MbmdMYXQiLCJzdGFydEJlYXJpbmciLCJzdGFydFBpdGNoIiwic3RhcnRab29tIiwiX3ZpZXdwb3J0UHJvcHMiLCJfYXBwbHlDb25zdHJhaW50cyIsIl9pbnRlcmFjdGl2ZVN0YXRlIiwicG9zIiwiX2dldFVwZGF0ZWRNYXBTdGF0ZSIsIl91bnByb2plY3QiLCJzdGFydFBvcyIsIl9jYWxjdWxhdGVOZXdMbmdMYXQiLCJkZWx0YVNjYWxlWCIsImRlbHRhU2NhbGVZIiwiX2NhbGN1bGF0ZU5ld1BpdGNoQW5kQmVhcmluZyIsInNjYWxlIiwiX2NhbGN1bGF0ZU5ld1pvb20iLCJ6b29tZWRWaWV3cG9ydCIsImdldExvY2F0aW9uQXRQb2ludCIsImxuZ0xhdCIsIm5ld1Byb3BzIiwicHJvcHMiLCJ2aWV3cG9ydCIsInVucHJvamVjdCIsImdldE1hcENlbnRlckJ5TG5nTGF0UG9zaXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7QUFFQTtBQUNPLElBQU1BLHdDQUFnQjtBQUMzQkMsV0FBUyxDQURrQjtBQUUzQkMsV0FBUyxFQUZrQjtBQUczQkMsWUFBVSxDQUhpQjtBQUkzQkMsWUFBVTtBQUppQixDQUF0Qjs7QUFPUCxJQUFNQyxnQkFBZ0I7QUFDcEJDLFNBQU8sQ0FEYTtBQUVwQkMsV0FBUyxDQUZXO0FBR3BCQyxZQUFVO0FBSFUs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QXVCLENBQXZCLENBQWQ7O0FBSGlGLDRCQUtwRCxLQUFLVCxjQUwrQztBQUFBLFVBSzFFckIsUUFMMEUsbUJBSzFFQSxRQUwwRTtBQUFBLFVBS2hFQyxRQUxnRSxtQkFLaEVBLFFBTGdFOzs7QUFPakYsVUFBTUcsVUFBVWMsZUFBZSxNQUFNVyxXQUFyQztBQUNBLFVBQUkxQixRQUFRZ0IsVUFBWjtBQUNBLFVBQUlXLGNBQWMsQ0FBbEIsRUFBcUI7QUFDbkI7QUFDQTNCLGdCQUFRZ0IsYUFBYVcsZUFBZTdCLFdBQVdrQixVQUExQixDQUFyQjtBQUNELE9BSEQsTUFHTyxJQUFJVyxjQUFjLENBQWxCLEVBQXFCO0FBQzFCO0FBQ0EzQixnQkFBUWdCLGFBQWFXLGVBQWU5QixXQUFXbUIsVUFBMUIsQ0FBckI7QUFDRDs7QUFFRCxhQUFPO0FBQ0xoQixvQkFESztBQUVMQztBQUZLLE9BQVA7QUFJRDs7Ozs7a0JBN1NrQk0sUSIsImZpbGUiOiJtYXAtc3RhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgV2ViTWVyY2F0b3JWaWV3cG9ydCwge25vcm1hbGl6ZVZpZXdwb3J0UHJvcHN9IGZyb20gJ3ZpZXdwb3J0LW1lcmNhdG9yLXByb2plY3QnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBNQVBCT1ggTElNSVRTXG5leHBvcnQgY29uc3QgTUFQQk9YX0xJTUlUUyA9IHtcbiAgbWluWm9vbTogMCxcbiAgbWF4Wm9vbTogMjAsXG4gIG1pblBpdGNoOiAwLFxuICBtYXhQaXRjaDogNjBcbn07XG5cbmNvbnN0IERFRkFVTFRfU1RBVEUgPSB7XG4gIHBpdGNoOiAwLFxuICBiZWFyaW5nOiAwLFxuICBhbHRpdHVkZTogMS41XG59O1xuXG4vKiBVdGlscyAqL1xuZnVuY3Rpb24gY2xhbXAodmFsdWUsIG1pbiwgbWF4KSB7XG4gIHJldHVybiB2YWx1ZSA8IG1pbiA/IG1pbiA6ICh2YWx1ZSA+IG1heCA/IG1heCA6IHZhbHVlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFwU3RhdGUge1xuXG4gIGNvbnN0cnVjdG9yKHtcbiAgICAvKiogTWFwYm94IHZpZXdwb3J0IHByb3BlcnRpZXMgKi9cbiAgICAvKiogVGhlIHdpZHRoIG9mIHRoZSB2aWV3cG9ydCAqL1xuICAgIHdpZHRoLFxuICAgIC8qKiBUaGUgaGVpZ2h0IG9mIHRoZSB2aWV3cG9ydCAqL1xuICAgIGhlaWdodCxcbiAgICAvKiogVGhlIGxhdGl0dWRlIGF0IHRoZSBjZW50ZXIgb2YgdGhlIHZpZXdwb3J0ICovXG4gICAgbGF0aXR1ZGUsXG4gICAgLyoqIFRoZSBsb25naXR1ZGUgYXQgdGhlIGNlbnRlciBvZiB0aGUgdmlld3BvcnQgKi9cbiAgICBsb25naXR1ZGUsXG4gICAgLyoqIFRoZSB0aWxlIHpvb20gbGV2ZWwgb2YgdGhlIG1hcC4gKi9cbiAgICB6b29tLFxuICAgIC8qKiBUaGUgYmVhcmluZyBvZiB0aGUgdmlld3BvcnQgaW4gZGVncmVlcyAqL1xuICAgIGJlYXJpbmcgPSBERUZBVUxUX1NUQVRFLmJlYXJpbmcsXG4gICAgLyoqIFRoZSBwaXRjaCBvZiB0aGUgdmlld3BvcnQgaW4gZGVncmVlcyAqL1xuICAgIHBpdGNoID0gREVGQVVMVF9TVEFURS5waXRjaCxcbiAgICAvKipcbiAgICAgKiBTcGVjaWZ5IHRoZSBhbHRpdHVkZSBvZiB0aGUgdmlld3BvcnQgY2FtZXJhXG4gICAgICogVW5pdDogbWFwIGhlaWdodHMsIGRlZmF1bHQgMS41XG4gICAgICogTm9uLXB1YmxpYyBBUEksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFwYm94L21hcGJveC1nbC1qcy9pc3N1ZXMvMTEzN1xuICAgICAqL1xuICAgIGFsdGl0dWRlID0gREVGQVVMVF9TVEFURS5hbHRpdHVkZSxcblxuICAgIC8qKiBWaWV3cG9ydCBjb25zdHJhaW50cyAqL1xuICAgIG1heFpvb20gPSBNQVBCT1hfTElNSVRTLm1heFpvb20sXG4gICAgbWluWm9vbSA9IE1BUEJPWF9MSU1JVFMubWluWm9vbSxcbiAgICBtYXhQaXRjaCA9IE1BUEJPWF9MSU1JVFMubWF4UGl0Y2gsXG4gICAgbWluUGl0Y2ggPSBNQVBCT1hfTElNSVRTLm1pblBpdGNoLFxuXG4gICAgLyoqIEludGVyYWN0aW9uIHN0YXRlcywgcmVxdWlyZWQgdG8gY2FsY3VsYXRlIGNoYW5nZSBkdXJpbmcgdHJhbnNmb3JtICovXG4gICAgLyogVGhlIHBvaW50IG9uIG1hcCBiZWluZyBncmFiYmVkIHdoZW4gdGhlIG9wZXJhdGlvbiBmaXJzdCBzdGFydGVkICovXG4gICAgc3RhcnRQYW5MbmdMYXQsXG4gICAgLyogQ2VudGVyIG9mIHRoZSB6b29tIHdoZW4gdGhlIG9wZXJhdGlvbiBmaXJzdCBzdGFydGVkICovXG4gICAgc3RhcnRab29tTG5nTGF0LFxuICAgIC8qKiBCZWFyaW5nIHdoZW4gY3VycmVudCBwZXJzcGVjdGl2ZSByb3RhdGUgb3BlcmF0aW9uIHN0YXJ0ZWQgKi9cbiAgICBzdGFydEJlYXJpbmcsXG4gICAgLyoqIFBpdGNoIHdoZW4gY3VycmVudCBwZXJzcGVjdGl2ZSByb3RhdGUgb3BlcmF0aW9uIHN0YXJ0ZWQgKi9cbiAgICBzdGFydFBpdGNoLFxuICAgIC8qKiBab29tIHdoZW4gY3VycmVudCB6b29tIG9wZXJhdGlvbiBzdGFydGVkICovXG4gICAgc3RhcnRab29tXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydChOdW1iZXIuaXNGaW5pdGUod2lkdGgpLCAnYHdpZHRoYCBtdXN0IGJlIHN1cHBsaWVkJyk7XG4gICAgYXNzZXJ0KE51bWJlci5pc0Zpbml0ZShoZWlnaHQpLCAnYGhlaWdodGAgbXVzdCBiZSBzdXBwbGllZCcpO1xuICAgIGFzc2VydChOdW1iZXIuaXNGaW5pdGUobG9uZ2l0dWRlKSwgJ2Bsb25naXR1ZGVgIG11c3QgYmUgc3VwcGxpZWQnKTtcbiAgICBhc3NlcnQoTnVtYmVyLmlzRmluaXRlKGxhdGl0dWRlKSwgJ2BsYXRpdHVkZWAgbXVzdCBiZSBzdXBwbGllZCcpO1xuICAgIGFzc2VydChOdW1iZXIuaXNGaW5pdGUoem9vbSksICdgem9vbWAgbXVzdCBiZSBzdXBwbGllZCcpO1xuXG4gICAgdGhpcy5fdmlld3BvcnRQcm9wcyA9IHRoaXMuX2FwcGx5Q29uc3RyYWludHMoe1xuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBsYXRpdHVkZSxcbiAgICAgIGxvbmdpdHVkZSxcbiAgICAgIHpvb20sXG4gICAgICBiZWFyaW5nLFxuICAgICAgcGl0Y2gsXG4gICAgICBhbHRpdHVkZSxcbiAgICAgIG1heFpvb20sXG4gICAgICBtaW5ab29tLFxuICAgICAgbWF4UGl0Y2gsXG4gICAgICBtaW5QaXRjaFxuICAgIH0pO1xuXG4gICAgdGhpcy5faW50ZXJhY3RpdmVTdGF0ZSA9IHtcbiAgICAgIHN0YXJ0UGFuTG5nTGF0LFxuICAgICAgc3RhcnRab29tTG5nTGF0LFxuICAgICAgc3RhcnRCZWFyaW5nLFxuICAgICAgc3RhcnRQaXRjaCxcbiAgICAgIHN0YXJ0Wm9vbVxuICAgIH07XG4gIH1cblxuICAvKiBQdWJsaWMgQVBJICovXG5cbiAgZ2V0Vmlld3BvcnRQcm9wcygpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3BvcnRQcm9wcztcbiAgfVxuXG4gIGdldEludGVyYWN0aXZlU3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aXZlU3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgcGFubmluZ1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgcG9pbnRlciBncmFic1xuICAgKi9cbiAgcGFuU3RhcnQoe3Bvc30pIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0VXBkYXRlZE1hcFN0YXRlKHtcbiAgICAgIHN0YXJ0UGFuTG5nTGF0OiB0aGlzLl91bnByb2plY3QocG9zKVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhblxuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgcG9pbnRlciBpc1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl0sIG9wdGlvbmFsfSBzdGFydFBvcyAtIHdoZXJlIHRoZSBwb2ludGVyIGdyYWJiZWQgYXRcbiAgICogICB0aGUgc3RhcnQgb2YgdGhlIG9wZXJhdGlvbi4gTXVzdCBiZSBzdXBwbGllZCBvZiBgcGFuU3RhcnQoKWAgd2FzIG5vdCBjYWxsZWRcbiAgICovXG4gIHBhbih7cG9zLCBzdGFydFBvc30pIHtcbiAgICBjb25zdCBzdGFydFBhbkxuZ0xhdCA9IHRoaXMuX2ludGVyYWN0aXZlU3RhdGUuc3RhcnRQYW5MbmdMYXQgfHwgdGhpcy5fdW5wcm9qZWN0KHN0YXJ0UG9zKTtcblxuICAgIGlmICghc3RhcnRQYW5MbmdMYXQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IFtsb25naXR1ZGUsIGxhdGl0dWRlXSA9IHRoaXMuX2NhbGN1bGF0ZU5ld0xuZ0xhdCh7c3RhcnRQYW5MbmdMYXQsIHBvc30pO1xuXG4gICAgcmV0dXJuIHRoaXMuX2dldFVwZGF0ZWRNYXBTdGF0ZSh7XG4gICAgICBsb25naXR1ZGUsXG4gICAgICBsYXRpdHVkZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZCBwYW5uaW5nXG4gICAqIE11c3QgY2FsbCBpZiBgcGFuU3RhcnQoKWAgd2FzIGNhbGxlZFxuICAgKi9cbiAgcGFuRW5kKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkTWFwU3RhdGUoe1xuICAgICAgc3RhcnRQYW5MbmdMYXQ6IG51bGxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCByb3RhdGluZ1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHBvcyAtIHBvc2l0aW9uIG9uIHNjcmVlbiB3aGVyZSB0aGUgY2VudGVyIGlzXG4gICAqL1xuICByb3RhdGVTdGFydCh7cG9zfSkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkTWFwU3RhdGUoe1xuICAgICAgc3RhcnRCZWFyaW5nOiB0aGlzLl92aWV3cG9ydFByb3BzLmJlYXJpbmcsXG4gICAgICBzdGFydFBpdGNoOiB0aGlzLl92aWV3cG9ydFByb3BzLnBpdGNoXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUm90YXRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVNjYWxlWCAtIGEgbnVtYmVyIGJldHdlZW4gWy0xLCAxXSBzcGVjaWZ5aW5nIHRoZVxuICAgKiAgIGNoYW5nZSB0byBiZWFyaW5nLlxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFTY2FsZVkgLSBhIG51bWJlciBiZXR3ZWVuIFstMSwgMV0gc3BlY2lmeWluZyB0aGVcbiAgICogICBjaGFuZ2UgdG8gcGl0Y2guIC0xIHNldHMgdG8gbWluUGl0Y2ggYW5kIDEgc2V0cyB0byBtYXhQaXRjaC5cbiAgICovXG4gIHJvdGF0ZSh7ZGVsdGFTY2FsZVggPSAwLCBkZWx0YVNjYWxlWSA9IDB9KSB7XG5cbiAgICBjb25zdCB7c3RhcnRCZWFyaW5nLCBzdGFydFBpdGNofSA9IHRoaXMuX2ludGVyYWN0aXZlU3RhdGU7XG5cbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShzdGFydEJlYXJpbmcpIHx8ICFOdW1iZXIuaXNGaW5pdGUoc3RhcnRQaXRjaCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IHtwaXRjaCwgYmVhcmluZ30gPSB0aGlzLl9jYWxjdWxhdGVOZXdQaXRjaEFuZEJlYXJpbmcoe1xuICAgICAgZGVsdGFTY2FsZVgsXG4gICAgICBkZWx0YVNjYWxlWSxcbiAgICAgIHN0YXJ0QmVhcmluZyxcbiAgICAgIHN0YXJ0UGl0Y2hcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkTWFwU3RhdGUoe1xuICAgICAgYmVhcmluZyxcbiAgICAgIHBpdGNoXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRW5kIHJvdGF0aW5nXG4gICAqIE11c3QgY2FsbCBpZiBgcm90YXRlU3RhcnQoKWAgd2FzIGNhbGxlZFxuICAgKi9cbiAgcm90YXRlRW5kKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRVcGRhdGVkTWFwU3RhdGUoe1xuICAgICAgc3RhcnRCZWFyaW5nOiBudWxsLFxuICAgICAgc3RhcnRQaXRjaDogbnVsbFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHpvb21pbmdcbiAgICogQHBhcmFtIHtbTnVtYmVyLCBOdW1iZXJdfSBwb3MgLSBwb3NpdGlvbiBvbiBzY3JlZW4gd2hlcmUgdGhlIGNlbnRlciBpc1xuICAgKi9cbiAgem9vbVN0YXJ0KHtwb3N9KSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFVwZGF0ZWRNYXBTdGF0ZSh7XG4gICAgICBzdGFydFpvb21MbmdMYXQ6IHRoaXMuX3VucHJvamVjdChwb3MpLFxuICAgICAgc3RhcnRab29tOiB0aGlzLl92aWV3cG9ydFByb3BzLnpvb21cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBab29tXG4gICAqIEBwYXJhbSB7W051bWJlciwgTnVtYmVyXX0gcG9zIC0gcG9zaXRpb24gb24gc2NyZWVuIHdoZXJlIHRoZSBjdXJyZW50IGNlbnRlciBpc1xuICAgKiBAcGFyYW0ge1tOdW1iZXIsIE51bWJlcl19IHN0YXJ0UG9zIC0gdGhlIGNlbnRlciBwb3NpdGlvbiBhdFxuICAgKiAgIHRoZSBzdGFydCBvZiB0aGUgb3BlcmF0aW9uLiBNdXN0IGJlIHN1cHBsaWVkIG9mIGB6b29tU3RhcnQoKWAgd2FzIG5vdCBjYWxsZWRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIC0gYSBudW1iZXIgYmV0d2VlbiBbMCwgMV0gc3BlY2lmeWluZyB0aGUgYWNjdW11bGF0ZWRcbiAgICogICByZWxhdGl2ZSBzY2FsZS5cbiAgICovXG4gIHpvb20oe3Bvcywgc3RhcnRQb3MsIHNjYWxlfSkge1xuICAgIGFzc2VydChzY2FsZSA+IDAsICdgc2NhbGVgIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSB6b29tIGFyb3VuZCB0aGUgY3VycmVudCBtb3VzZSBwb3NpdGlvbiByYXRoZXIgdGhhbiBtYXAgY2VudGVyXG4gICAgbGV0IHtzdGFydFpvb20sIHN0YXJ0Wm9vbUxuZ0xhdH0gPSB0aGlzLl9pbnRlcmFjdGl2ZVN0YXRlO1xuXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoc3RhcnRab29tKSkge1xuICAgICAgLy8gV2UgaGF2ZSB0d28gbW9kZXMgb2Ygem9vbTpcbiAgICAgIC8vIHNjcm9sbCB6b29tIHRoYXQgYXJlIGRpc2NyZXRlIGV2ZW50cyAodHJhbnNmb3JtIGZyb20gdGhlIGN1cnJlbnQgem9vbSBsZXZlbCksXG4gICAgICAvLyBhbmQgcGluY2ggem9vbSB0aGF0IGFyZSBjb250aW51b3VzIGV2ZW50cyAodHJhbnNmb3JtIGZyb20gdGhlIHpvb20gbGV2ZWwgd2hlblxuICAgICAgLy8gcGluY2ggc3RhcnRlZCkuXG4gICAgICAvLyBJZiBzdGFydFpvb20gc3RhdGUgaXMgZGVmaW5lZCwgdGhlbiB1c2UgdGhlIHN0YXJ0Wm9vbSBzdGF0ZTtcbiAgICAgIC8vIG90aGVyd2lzZSBhc3N1bWUgZGlzY3JldGUgem9vbWluZ1xuICAgICAgc3RhcnRab29tID0gdGhpcy5fdmlld3BvcnRQcm9wcy56b29tO1xuICAgICAgc3RhcnRab29tTG5nTGF0ID0gdGhpcy5fdW5wcm9qZWN0KHN0YXJ0UG9zKSB8fCB0aGlzLl91bnByb2plY3QocG9zKTtcbiAgICB9XG5cbiAgICAvLyB0YWtlIHRoZSBzdGFydCBsbmdsYXQgYW5kIHB1dCBpdCB3aGVyZSB0aGUgbW91c2UgaXMgZG93bi5cbiAgICBhc3NlcnQoc3RhcnRab29tTG5nTGF0LCAnYHN0YXJ0Wm9vbUxuZ0xhdGAgcHJvcCBpcyByZXF1aXJlZCAnICtcbiAgICAgICdmb3Igem9vbSBiZWhhdmlvciB0byBjYWxjdWxhdGUgd2hlcmUgdG8gcG9zaXRpb24gdGhlIG1hcC4nKTtcblxuICAgIGNvbnN0IHpvb20gPSB0aGlzLl9jYWxjdWxhdGVOZXdab29tKHtzY2FsZSwgc3RhcnRab29tfSk7XG5cbiAgICBjb25zdCB6b29tZWRWaWV3cG9ydCA9IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5fdmlld3BvcnRQcm9wcywge3pvb219KVxuICAgICk7XG4gICAgY29uc3QgW2xvbmdpdHVkZSwgbGF0aXR1ZGVdID0gem9vbWVkVmlld3BvcnQuZ2V0TG9jYXRpb25BdFBvaW50KHtsbmdMYXQ6IHN0YXJ0Wm9vbUxuZ0xhdCwgcG9zfSk7XG5cbiAgICByZXR1cm4gdGhpcy5fZ2V0VXBkYXRlZE1hcFN0YXRlKHtcbiAgICAgIHpvb20sXG4gICAgICBsb25naXR1ZGUsXG4gICAgICBsYXRpdHVkZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZCB6b29taW5nXG4gICAqIE11c3QgY2FsbCBpZiBgem9vbVN0YXJ0KClgIHdhcyBjYWxsZWRcbiAgICovXG4gIHpvb21FbmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFVwZGF0ZWRNYXBTdGF0ZSh7XG4gICAgICBzdGFydFpvb21MbmdMYXQ6IG51bGwsXG4gICAgICBzdGFydFpvb206IG51bGxcbiAgICB9KTtcbiAgfVxuXG4gIC8qIFByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIF9nZXRVcGRhdGVkTWFwU3RhdGUobmV3UHJvcHMpIHtcbiAgICAvLyBVcGRhdGUgX3ZpZXdwb3J0UHJvcHNcbiAgICByZXR1cm4gbmV3IE1hcFN0YXRlKE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX3ZpZXdwb3J0UHJvcHMsIHRoaXMuX2ludGVyYWN0aXZlU3RhdGUsIG5ld1Byb3BzKSk7XG4gIH1cblxuICAvLyBBcHBseSBhbnkgY29uc3RyYWludHMgKG1hdGhlbWF0aWNhbCBvciBkZWZpbmVkIGJ5IF92aWV3cG9ydFByb3BzKSB0byBtYXAgc3RhdGVcbiAgX2FwcGx5Q29uc3RyYWludHMocHJvcHMpIHtcbiAgICAvLyBFbnN1cmUgem9vbSBpcyB3aXRoaW4gc3BlY2lmaWVkIHJhbmdlXG4gICAgY29uc3Qge21heFpvb20sIG1pblpvb20sIHpvb219ID0gcHJvcHM7XG4gICAgcHJvcHMuem9vbSA9IGNsYW1wKHpvb20sIG1pblpvb20sIG1heFpvb20pO1xuXG4gICAgLy8gRW5zdXJlIHBpdGNoIGlzIHdpdGhpbiBzcGVjaWZpZWQgcmFuZ2VcbiAgICBjb25zdCB7bWF4UGl0Y2gsIG1pblBpdGNoLCBwaXRjaH0gPSBwcm9wcztcbiAgICBwcm9wcy5waXRjaCA9IGNsYW1wKHBpdGNoLCBtaW5QaXRjaCwgbWF4UGl0Y2gpO1xuXG4gICAgT2JqZWN0LmFzc2lnbihwcm9wcywgbm9ybWFsaXplVmlld3BvcnRQcm9wcyhwcm9wcykpO1xuXG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgX3VucHJvamVjdChwb3MpIHtcbiAgICBjb25zdCB2aWV3cG9ydCA9IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHRoaXMuX3ZpZXdwb3J0UHJvcHMpO1xuICAgIHJldHVybiBwb3MgJiYgdmlld3BvcnQudW5wcm9qZWN0KHBvcyk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgYSBuZXcgbG5nbGF0IGJhc2VkIG9uIHBpeGVsIGRyYWdnaW5nIHBvc2l0aW9uXG4gIF9jYWxjdWxhdGVOZXdMbmdMYXQoe3N0YXJ0UGFuTG5nTGF0LCBwb3N9KSB7XG4gICAgY29uc3Qgdmlld3BvcnQgPSBuZXcgV2ViTWVyY2F0b3JWaWV3cG9ydCh0aGlzLl92aWV3cG9ydFByb3BzKTtcbiAgICByZXR1cm4gdmlld3BvcnQuZ2V0TWFwQ2VudGVyQnlMbmdMYXRQb3NpdGlvbih7bG5nTGF0OiBzdGFydFBhbkxuZ0xhdCwgcG9zfSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIG5ldyB6b29tXG4gIF9jYWxjdWxhdGVOZXdab29tKHtzY2FsZSwgc3RhcnRab29tfSkge1xuICAgIGNvbnN0IHttYXhab29tLCBtaW5ab29tfSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHM7XG4gICAgY29uc3Qgem9vbSA9IHN0YXJ0Wm9vbSArIE1hdGgubG9nMihzY2FsZSk7XG4gICAgcmV0dXJuIGNsYW1wKHpvb20sIG1pblpvb20sIG1heFpvb20pO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyBhIG5ldyBwaXRjaCBhbmQgYmVhcmluZyBmcm9tIGEgcG9zaXRpb24gKGNvbWluZyBmcm9tIGFuIGV2ZW50KVxuICBfY2FsY3VsYXRlTmV3UGl0Y2hBbmRCZWFyaW5nKHtkZWx0YVNjYWxlWCwgZGVsdGFTY2FsZVksIHN0YXJ0QmVhcmluZywgc3RhcnRQaXRjaH0pIHtcbiAgICAvLyBjbGFtcCBkZWx0YVNjYWxlWSB0byBbLTEsIDFdIHNvIHRoYXQgcm90YXRpb24gaXMgY29uc3RyYWluZWQgYmV0d2VlbiBtaW5QaXRjaCBhbmQgbWF4UGl0Y2guXG4gICAgLy8gZGVsdGFTY2FsZVggZG9lcyBub3QgbmVlZCB0byBiZSBjbGFtcGVkIGFzIGJlYXJpbmcgZG9lcyBub3QgaGF2ZSBjb25zdHJhaW50cy5cbiAgICBkZWx0YVNjYWxlWSA9IGNsYW1wKGRlbHRhU2NhbGVZLCAtMSwgMSk7XG5cbiAgICBjb25zdCB7bWluUGl0Y2gsIG1heFBpdGNofSA9IHRoaXMuX3ZpZXdwb3J0UHJvcHM7XG5cbiAgICBjb25zdCBiZWFyaW5nID0gc3RhcnRCZWFyaW5nICsgMTgwICogZGVsdGFTY2FsZVg7XG4gICAgbGV0IHBpdGNoID0gc3RhcnRQaXRjaDtcbiAgICBpZiAoZGVsdGFTY2FsZVkgPiAwKSB7XG4gICAgICAvLyBHcmFkdWFsbHkgaW5jcmVhc2UgcGl0Y2hcbiAgICAgIHBpdGNoID0gc3RhcnRQaXRjaCArIGRlbHRhU2NhbGVZICogKG1heFBpdGNoIC0gc3RhcnRQaXRjaCk7XG4gICAgfSBlbHNlIGlmIChkZWx0YVNjYWxlWSA8IDApIHtcbiAgICAgIC8vIEdyYWR1YWxseSBkZWNyZWFzZSBwaXRjaFxuICAgICAgcGl0Y2ggPSBzdGFydFBpdGNoIC0gZGVsdGFTY2FsZVkgKiAobWluUGl0Y2ggLSBzdGFydFBpdGNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGl0Y2gsXG4gICAgICBiZWFyaW5nXG4gICAgfTtcbiAgfVxuXG59XG4iXX0=