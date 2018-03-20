'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _viewport = require('./viewport');

var _viewport2 = _interopRequireDefault(_viewport);

var _viewportMercatorProject = require('viewport-mercator-project');

var _add = require('gl-vec2/add');

var _add2 = _interopRequireDefault(_add);

var _negate = require('gl-vec2/negate');

var _negate2 = _interopRequireDefault(_negate);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// View and Projection Matrix calculations for mapbox-js style
// map view properties


// TODO - import from viewport-mercator-project
// import {fitBounds} from '../viewport-mercator-project/fit-bounds';

// TODO - import from math.gl
/* eslint-disable camelcase */


var ERR_ARGUMENT = 'Illegal argument to WebMercatorViewport';

var WebMercatorViewport = function (_Viewport) {
  _inherits(WebMercatorViewport, _Viewport);

  /**
   * @classdesc
   * Creates view/projection matrices from mercator params
   * Note: The Viewport is immutable in the sense that it only has accessors.
   * A new viewport instance should be created if any parameters have changed.
   */
  /* eslint-disable complexity, max-statements */
  function WebMercatorViewport() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, WebMercatorViewport);

    var _opts$latitude = opts.latitude,
        latitude = _opts$latitude === undefined ? 0 : _opts$latitude,
        _opts$longitude = opts.longitude,
        longitude = _opts$longitude === undefined ? 0 : _opts$longitude,
        _opts$zoom = opts.zoom,
        zoom = _opts$zoom === undefined ? 11 : _opts$zoom,
        _opts$pitch = opts.pitch,
        pitch = _opts$pitch === undefined ? 0 : _opts$pitch,
        _opts$bearing = opts.bearing,
        bearing = _opts$bearing === undefined ? 0 : _opts$bearing,
        _opts$farZMultiplier = opts.farZMultiplier,
        farZMultiplier = _opts$farZMultiplier === undefined ? 10 : _opts$farZMultiplier;
    var width = opts.width,
        height = opts.height,
        _opts$altitude = opts.altitude,
        altitude = _opts$altitude === undefined ? 1.5 : _opts$altitude;

    // Silently allow apps to send in 0,0 to facilitate isomorphic render etc

    width = width || 1;
    height = height || 1;

    // Altitude - prevent division by 0
    // TODO - just throw an Error instead?
    altitude = Math.max(0.75, altitude);

    var projectionMatrix = (0, _viewportMercatorProject.getProjectionMatrix)({
      width: width,
      height: height,
      pitch: pitch,
      altitude: altitude,
      farZMultiplier: farZMultiplier
    });

    // The uncentered matrix allows us two move the center addition to the
    // shader (cheap) which gives a coordinate system that has its center in
    // the layer's center position. This makes rotations and other modelMatrx
    // transforms much more useful.
    var viewMatrixUncentered = (0, _viewportMercatorProject.getViewMatrix)({
      height: height,
      pitch: pitch,
      bearing: bearing,
      altitude: altitude
    });

    // Save parameters
    var _this = _possibleConstructorReturn(this, (WebMercatorViewport.__proto__ || Object.getPrototypeOf(WebMercatorViewport)).call(this, Object.assign({}, opts, {
      // x, y, position, ...
      // TODO / hack - prevent vertical offsets if not FirstPersonViewport
      position: opts.position && [opts.position[0], opts.position[1], 0],
      width: width,
      height: height,
      viewMatrix: viewMatrixUncentered,
      longitude: longitude,
      latitude: latitude,
      zoom: zoom,
      projectionMatrix: projectionMatrix,
      focalDistance: 1 // Viewport is already carefully set up to "focus" on ground
    })));

    _this.latitude = latitude;
    _this.longitude = longitude;
    _this.zoom = zoom;
    _this.pitch = pitch;
    _this.bearing = bearing;
    _this.altitude = altitude;

    // Bind methods
    _this.metersToLngLatDelta = _this.metersToLngLatDelta.bind(_this);
    _this.lngLatDeltaToMeters = _this.lngLatDeltaToMeters.bind(_this);
    _this.addMetersToLngLat = _this.addMetersToLngLat.bind(_this);

    Object.freeze(_this);
    return _this;
  }
  /* eslint-enable complexity, max-statements */

  /**
   * Project [lng,lat] on sphere onto [x,y] on 512*512 Mercator Zoom 0 tile.
   * Performs the nonlinear part of the web mercator projection.
   * Remaining projection is done with 4x4 matrices which also handles
   * perspective.
   *
   * @param {Array} lngLat - [lng, lat] coordinates
   *   Specifies a point on the sphere to project onto the map.
   * @return {Array} [x,y] coordinates.
   */


  _createClass(WebMercatorViewport, [{
    key: '_projectFlat',
    value: function _projectFlat(lngLat) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return (0, _viewportMercatorProject.lngLatToWorld)(lngLat, scale);
    }

    /**
     * Unproject world point [x,y] on map onto {lat, lon} on sphere
     *
     * @param {object|Vector} xy - object with {x,y} members
     *  representing point on projected map plane
     * @return {GeoCoordinates} - object with {lat,lon} of point on sphere.
     *   Has toArray method if you need a GeoJSON Array.
     *   Per cartographic tradition, lat and lon are specified as degrees.
     */

  }, {
    key: '_unprojectFlat',
    value: function _unprojectFlat(xy) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return (0, _viewportMercatorProject.worldToLngLat)(xy, scale);
    }

    /**
     * Converts a meter offset to a lnglat offset
     *
     * Note: Uses simple linear approximation around the viewport center
     * Error increases with size of offset (roughly 1% per 100km)
     *
     * @param {[Number,Number]|[Number,Number,Number]) xyz - array of meter deltas
     * @return {[Number,Number]|[Number,Number,Number]) - array of [lng,lat,z] deltas
     */

  }, {
    key: 'metersToLngLatDelta',
    value: function metersToLngLatDelta(xyz) {
      var _xyz = _slicedToArray(xyz, 3),
          x = _xyz[0],
          y = _xyz[1],
          _xyz$ = _xyz[2],
          z = _xyz$ === undefined ? 0 : _xyz$;

      (0, _assert2.default)(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z), ERR_ARGUMENT);
      var _distanceScales = this.distanceScales,
          pixelsPerMeter = _distanceScales.pixelsPerMeter,
          degreesPerPixel = _distanceScales.degreesPerPixel;

      var deltaLng = x * pixelsPerMeter[0] * degreesPerPixel[0];
      var deltaLat = y * pixelsPerMeter[1] * degreesPerPixel[1];
      return xyz.length === 2 ? [deltaLng, deltaLat] : [deltaLng, deltaLat, z];
    }

    /**
     * Converts a lnglat offset to a meter offset
     *
     * Note: Uses simple linear approximation around the viewport center
     * Error increases with size of offset (roughly 1% per 100km)
     *
     * @param {[Number,Number]|[Number,Number,Number]) deltaLngLatZ - array of [lng,lat,z] deltas
     * @return {[Number,Number]|[Number,Number,Number]) - array of meter deltas
     */

  }, {
    key: 'lngLatDeltaToMeters',
    value: function lngLatDeltaToMeters(deltaLngLatZ) {
      var _deltaLngLatZ = _slicedToArray(deltaLngLatZ, 3),
          deltaLng = _deltaLngLatZ[0],
          deltaLat = _deltaLngLatZ[1],
          _deltaLngLatZ$ = _deltaLngLatZ[2],
          deltaZ = _deltaLngLatZ$ === undefined ? 0 : _deltaLngLatZ$;

      (0, _assert2.default)(Number.isFinite(deltaLng) && Number.isFinite(deltaLat) && Number.isFinite(deltaZ), ERR_ARGUMENT);
      var _distanceScales2 = this.distanceScales,
          pixelsPerDegree = _distanceScales2.pixelsPerDegree,
          metersPerPixel = _distanceScales2.metersPerPixel;

      var deltaX = deltaLng * pixelsPerDegree[0] * metersPerPixel[0];
      var deltaY = deltaLat * pixelsPerDegree[1] * metersPerPixel[1];
      return deltaLngLatZ.length === 2 ? [deltaX, deltaY] : [deltaX, deltaY, deltaZ];
    }

    /**
     * Add a meter delta to a base lnglat coordinate, returning a new lnglat array
     *
     * Note: Uses simple linear approximation around the viewport center
     * Error increases with size of offset (roughly 1% per 100km)
     *
     * @param {[Number,Number]|[Number,Number,Number]) lngLatZ - base coordinate
     * @param {[Number,Number]|[Number,Number,Number]) xyz - array of meter deltas
     * @return {[Number,Number]|[Number,Number,Number]) array of [lng,lat,z] deltas
     */

  }, {
    key: 'addMetersToLngLat',
    value: function addMetersToLngLat(lngLatZ, xyz) {
      var _lngLatZ = _slicedToArray(lngLatZ, 3),
          lng = _lngLatZ[0],
          lat = _lngLatZ[1],
          _lngLatZ$ = _lngLatZ[2],
          Z = _lngLatZ$ === undefined ? 0 : _lngLatZ$;

      var _metersToLngLatDelta = this.metersToLngLatDelta(xyz),
          _metersToLngLatDelta2 = _slicedToArray(_metersToLngLatDelta, 3),
          deltaLng = _metersToLngLatDelta2[0],
          deltaLat = _metersToLngLatDelta2[1],
          _metersToLngLatDelta3 = _metersToLngLatDelta2[2],
          deltaZ = _metersToLngLatDelta3 === undefined ? 0 : _metersToLngLatDelta3;

      return lngLatZ.length === 2 ? [lng + deltaLng, lat + deltaLat] : [lng + deltaLng, lat + deltaLat, Z + deltaZ];
    }

    /**
     * Get the map center that place a given [lng, lat] coordinate at screen
     * point [x, y]
     *
     * @param {Array} lngLat - [lng,lat] coordinates
     *   Specifies a point on the sphere.
     * @param {Array} pos - [x,y] coordinates
     *   Specifies a point on the screen.
     * @return {Array} [lng,lat] new map center.
     */

  }, {
    key: 'getMapCenterByLngLatPosition',
    value: function getMapCenterByLngLatPosition(_ref) {
      var lngLat = _ref.lngLat,
          pos = _ref.pos;

      var fromLocation = (0, _viewportMercatorProject.pixelsToWorld)(pos, this.pixelUnprojectionMatrix);
      var toLocation = (0, _viewportMercatorProject.lngLatToWorld)(lngLat, this.scale);

      var translate = (0, _add2.default)([], toLocation, (0, _negate2.default)([], fromLocation));
      var newCenter = (0, _add2.default)([], this.center, translate);

      return (0, _viewportMercatorProject.worldToLngLat)(newCenter, this.scale);
    }

    // Legacy method name

  }, {
    key: 'getLocationAtPoint',
    value: function getLocationAtPoint(_ref2) {
      var lngLat = _ref2.lngLat,
          pos = _ref2.pos;

      return this.getMapCenterByLngLatPosition({ lngLat: lngLat, pos: pos });
    }

    /**
     * Returns a new viewport that fit around the given rectangle.
     * Only supports non-perspective mode.
     * @param {Array} bounds - [[lon, lat], [lon, lat]]
     * @param {Number} [options.padding] - The amount of padding in pixels to add to the given bounds.
     * @param {Array} [options.offset] - The center of the given bounds relative to the map's center,
     *    [x, y] measured in pixels.
     * @returns {WebMercatorViewport}
     */

  }, {
    key: 'fitBounds',
    value: function fitBounds(bounds) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var width = this.width,
          height = this.height;

      var _fitBounds2 = (0, _viewportMercatorProject.fitBounds)(Object.assign({ width: width, height: height, bounds: bounds }, options)),
          longitude = _fitBounds2.longitude,
          latitude = _fitBounds2.latitude,
          zoom = _fitBounds2.zoom;

      return new WebMercatorViewport({ width: width, height: height, longitude: longitude, latitude: latitude, zoom: zoom });
    }

    // TODO - should support user supplied constraints

  }, {
    key: 'isMapSynched',
    value: function isMapSynched() {
      var EPSILON = 0.000001;
      var MAPBOX_LIMITS = {
        pitch: 60,
        zoom: 40
      };

      var pitch = this.pitch,
          zoom = this.zoom;


      return pitch <= MAPBOX_LIMITS.pitch + EPSILON && zoom <= MAPBOX_LIMITS.zoom + EPSILON;
    }
  }]);

  return WebMercatorViewport;
}(_viewport2.default);

exports.default = WebMercatorViewport;


WebMercatorViewport.displayName = 'WebMercatorViewport';
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3ZpZXdwb3J0cy93ZWItbWVyY2F0b3Itdmlld3BvcnQuanMiXSwibmFtZXMiOlsiRVJSX0FSR1VNRU5UIiwiV2ViTWVyY2F0b3JWaWV3cG9ydCIsIm9wdHMiLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInpvb20iLCJwaXRjaCIsImJlYXJpbmciLCJmYXJaTXVsdGlwbGllciIsIndpZHRoIiwiaGVpZ2h0IiwiYWx0aXR1ZGUiLCJNYXRoIiwibWF4IiwicHJvamVjdGlvbk1hdHJpeCIsInZpZXdNYXRyaXhVbmNlbnRlcmVkIiwiT2JqZWN0IiwiYXNzaWduIiwicG9zaXRpb24iLCJ2aWV3TWF0cml4IiwiZm9jYWxEaXN0YW5jZSIsIm1ldGVyc1RvTG5nTGF0RGVsdGEiLCJiaW5kIiwibG5nTGF0RGVsdGFUb01ldGVycyIsImFkZE1ldGVyc1RvTG5nTGF0IiwiZnJlZXplIiwibG5nTGF0Iiwic2NhbGUiLCJ4eSIsInh5eiIsIngiLCJ5IiwieiIsIk51bWJlciIsImlzRmluaXRlIiwiZGlzdGFuY2VTY2FsZXMiLCJwaXhlbHNQZXJNZXRlciIsImRlZ3JlZXNQZXJQaXhlbCIsImRlbHRhTG5nIiwiZGVsdGFMYXQiLCJsZW5ndGgiLCJkZWx0YUxuZ0xhdFoiLCJkZWx0YVoiLCJwaXhlbHNQZXJEZWdyZWUiLCJtZXRlcnNQZXJQaXhlbCIsImRlbHRhWCIsImRlbHRhWSIsImxuZ0xhdFoiLCJsbmciLCJsYXQiLCJaIiwicG9zIiwiZnJvbUxvY2F0aW9uIiwicGl4ZWxVbnByb2plY3Rpb25NYXRyaXgiLCJ0b0xvY2F0aW9uIiwidHJhbnNsYXRlIiwibmV3Q2VudGVyIiwiY2VudGVyIiwiZ2V0TWFwQ2VudGVyQnlMbmdMYXRQb3NpdGlvbiIsImJvdW5kcyIsIm9wdGlvbnMiLCJFUFNJTE9OIiwiTUFQQk9YX0xJTUlUUyIsImRpc3BsYXlOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBc0JBOzs7O0FBRUE7O0FBY0E7Ozs7QUFDQTs7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LGtCQUEzQixFQUFxQ0UsVUFBckMsRUFBeEIsQ0FBUDtBQUNEOztBQUVEOzs7O21DQUNlO0FBQ2IsVUFBTXdELFVBQVUsUUFBaEI7QUFDQSxVQUFNQyxnQkFBZ0I7QUFDcEJ4RCxlQUFPLEVBRGE7QUFFcEJELGNBQU07QUFGYyxPQUF0Qjs7QUFGYSxVQU9OQyxLQVBNLEdBT1MsSUFQVCxDQU9OQSxLQVBNO0FBQUEsVUFPQ0QsSUFQRCxHQU9TLElBUFQsQ0FPQ0EsSUFQRDs7O0FBU2IsYUFBT0MsU0FBU3dELGNBQWN4RCxLQUFkLEdBQXNCdUQsT0FBL0IsSUFBMEN4RCxRQUFReUQsY0FBY3pELElBQWQsR0FBcUJ3RCxPQUE5RTtBQUNEOzs7Ozs7a0JBdk5rQjVELG1COzs7QUEwTnJCQSxvQkFBb0I4RCxXQUFwQixHQUFrQyxxQkFBbEMiLCJmaWxlIjoid2ViLW1lcmNhdG9yLXZpZXdwb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbi8vIFZpZXcgYW5kIFByb2plY3Rpb24gTWF0cml4IGNhbGN1bGF0aW9ucyBmb3IgbWFwYm94LWpzIHN0eWxlXG4vLyBtYXAgdmlldyBwcm9wZXJ0aWVzXG5pbXBvcnQgVmlld3BvcnQgZnJvbSAnLi92aWV3cG9ydCc7XG5cbmltcG9ydCB7XG4gIGxuZ0xhdFRvV29ybGQsXG4gIHdvcmxkVG9MbmdMYXQsXG4gIHBpeGVsc1RvV29ybGQsXG4gIGdldFByb2plY3Rpb25NYXRyaXgsXG4gIGdldFZpZXdNYXRyaXgsXG4gIGZpdEJvdW5kc1xufSBmcm9tICd2aWV3cG9ydC1tZXJjYXRvci1wcm9qZWN0JztcblxuLy8gVE9ETyAtIGltcG9ydCBmcm9tIHZpZXdwb3J0LW1lcmNhdG9yLXByb2plY3Rcbi8vIGltcG9ydCB7Zml0Qm91bmRzfSBmcm9tICcuLi92aWV3cG9ydC1tZXJjYXRvci1wcm9qZWN0L2ZpdC1ib3VuZHMnO1xuXG4vLyBUT0RPIC0gaW1wb3J0IGZyb20gbWF0aC5nbFxuLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5pbXBvcnQgdmVjMl9hZGQgZnJvbSAnZ2wtdmVjMi9hZGQnO1xuaW1wb3J0IHZlYzJfbmVnYXRlIGZyb20gJ2dsLXZlYzIvbmVnYXRlJztcblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBFUlJfQVJHVU1FTlQgPSAnSWxsZWdhbCBhcmd1bWVudCB0byBXZWJNZXJjYXRvclZpZXdwb3J0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2ViTWVyY2F0b3JWaWV3cG9ydCBleHRlbmRzIFZpZXdwb3J0IHtcbiAgLyoqXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogQ3JlYXRlcyB2aWV3L3Byb2plY3Rpb24gbWF0cmljZXMgZnJvbSBtZXJjYXRvciBwYXJhbXNcbiAgICogTm90ZTogVGhlIFZpZXdwb3J0IGlzIGltbXV0YWJsZSBpbiB0aGUgc2Vuc2UgdGhhdCBpdCBvbmx5IGhhcyBhY2Nlc3NvcnMuXG4gICAqIEEgbmV3IHZpZXdwb3J0IGluc3RhbmNlIHNob3VsZCBiZSBjcmVhdGVkIGlmIGFueSBwYXJhbWV0ZXJzIGhhdmUgY2hhbmdlZC5cbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGxhdGl0dWRlID0gMCxcbiAgICAgIGxvbmdpdHVkZSA9IDAsXG4gICAgICB6b29tID0gMTEsXG4gICAgICBwaXRjaCA9IDAsXG4gICAgICBiZWFyaW5nID0gMCxcbiAgICAgIGZhclpNdWx0aXBsaWVyID0gMTBcbiAgICB9ID0gb3B0cztcblxuICAgIGxldCB7d2lkdGgsIGhlaWdodCwgYWx0aXR1ZGUgPSAxLjV9ID0gb3B0cztcblxuICAgIC8vIFNpbGVudGx5IGFsbG93IGFwcHMgdG8gc2VuZCBpbiAwLDAgdG8gZmFjaWxpdGF0ZSBpc29tb3JwaGljIHJlbmRlciBldGNcbiAgICB3aWR0aCA9IHdpZHRoIHx8IDE7XG4gICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IDE7XG5cbiAgICAvLyBBbHRpdHVkZSAtIHByZXZlbnQgZGl2aXNpb24gYnkgMFxuICAgIC8vIFRPRE8gLSBqdXN0IHRocm93IGFuIEVycm9yIGluc3RlYWQ/XG4gICAgYWx0aXR1ZGUgPSBNYXRoLm1heCgwLjc1LCBhbHRpdHVkZSk7XG5cbiAgICBjb25zdCBwcm9qZWN0aW9uTWF0cml4ID0gZ2V0UHJvamVjdGlvbk1hdHJpeCh7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHBpdGNoLFxuICAgICAgYWx0aXR1ZGUsXG4gICAgICBmYXJaTXVsdGlwbGllclxuICAgIH0pO1xuXG4gICAgLy8gVGhlIHVuY2VudGVyZWQgbWF0cml4IGFsbG93cyB1cyB0d28gbW92ZSB0aGUgY2VudGVyIGFkZGl0aW9uIHRvIHRoZVxuICAgIC8vIHNoYWRlciAoY2hlYXApIHdoaWNoIGdpdmVzIGEgY29vcmRpbmF0ZSBzeXN0ZW0gdGhhdCBoYXMgaXRzIGNlbnRlciBpblxuICAgIC8vIHRoZSBsYXllcidzIGNlbnRlciBwb3NpdGlvbi4gVGhpcyBtYWtlcyByb3RhdGlvbnMgYW5kIG90aGVyIG1vZGVsTWF0cnhcbiAgICAvLyB0cmFuc2Zvcm1zIG11Y2ggbW9yZSB1c2VmdWwuXG4gICAgY29uc3Qgdmlld01hdHJpeFVuY2VudGVyZWQgPSBnZXRWaWV3TWF0cml4KHtcbiAgICAgIGhlaWdodCxcbiAgICAgIHBpdGNoLFxuICAgICAgYmVhcmluZyxcbiAgICAgIGFsdGl0dWRlXG4gICAgfSk7XG5cbiAgICBzdXBlcihcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdHMsIHtcbiAgICAgICAgLy8geCwgeSwgcG9zaXRpb24sIC4uLlxuICAgICAgICAvLyBUT0RPIC8gaGFjayAtIHByZXZlbnQgdmVydGljYWwgb2Zmc2V0cyBpZiBub3QgRmlyc3RQZXJzb25WaWV3cG9ydFxuICAgICAgICBwb3NpdGlvbjogb3B0cy5wb3NpdGlvbiAmJiBbb3B0cy5wb3NpdGlvblswXSwgb3B0cy5wb3NpdGlvblsxXSwgMF0sXG4gICAgICAgIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIHZpZXdNYXRyaXg6IHZpZXdNYXRyaXhVbmNlbnRlcmVkLFxuICAgICAgICBsb25naXR1ZGUsXG4gICAgICAgIGxhdGl0dWRlLFxuICAgICAgICB6b29tLFxuICAgICAgICBwcm9qZWN0aW9uTWF0cml4LFxuICAgICAgICBmb2NhbERpc3RhbmNlOiAxIC8vIFZpZXdwb3J0IGlzIGFscmVhZHkgY2FyZWZ1bGx5IHNldCB1cCB0byBcImZvY3VzXCIgb24gZ3JvdW5kXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBTYXZlIHBhcmFtZXRlcnNcbiAgICB0aGlzLmxhdGl0dWRlID0gbGF0aXR1ZGU7XG4gICAgdGhpcy5sb25naXR1ZGUgPSBsb25naXR1ZGU7XG4gICAgdGhpcy56b29tID0gem9vbTtcbiAgICB0aGlzLnBpdGNoID0gcGl0Y2g7XG4gICAgdGhpcy5iZWFyaW5nID0gYmVhcmluZztcbiAgICB0aGlzLmFsdGl0dWRlID0gYWx0aXR1ZGU7XG5cbiAgICAvLyBCaW5kIG1ldGhvZHNcbiAgICB0aGlzLm1ldGVyc1RvTG5nTGF0RGVsdGEgPSB0aGlzLm1ldGVyc1RvTG5nTGF0RGVsdGEuYmluZCh0aGlzKTtcbiAgICB0aGlzLmxuZ0xhdERlbHRhVG9NZXRlcnMgPSB0aGlzLmxuZ0xhdERlbHRhVG9NZXRlcnMuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFkZE1ldGVyc1RvTG5nTGF0ID0gdGhpcy5hZGRNZXRlcnNUb0xuZ0xhdC5iaW5kKHRoaXMpO1xuXG4gICAgT2JqZWN0LmZyZWV6ZSh0aGlzKTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgLyoqXG4gICAqIFByb2plY3QgW2xuZyxsYXRdIG9uIHNwaGVyZSBvbnRvIFt4LHldIG9uIDUxMio1MTIgTWVyY2F0b3IgWm9vbSAwIHRpbGUuXG4gICAqIFBlcmZvcm1zIHRoZSBub25saW5lYXIgcGFydCBvZiB0aGUgd2ViIG1lcmNhdG9yIHByb2plY3Rpb24uXG4gICAqIFJlbWFpbmluZyBwcm9qZWN0aW9uIGlzIGRvbmUgd2l0aCA0eDQgbWF0cmljZXMgd2hpY2ggYWxzbyBoYW5kbGVzXG4gICAqIHBlcnNwZWN0aXZlLlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBsbmdMYXQgLSBbbG5nLCBsYXRdIGNvb3JkaW5hdGVzXG4gICAqICAgU3BlY2lmaWVzIGEgcG9pbnQgb24gdGhlIHNwaGVyZSB0byBwcm9qZWN0IG9udG8gdGhlIG1hcC5cbiAgICogQHJldHVybiB7QXJyYXl9IFt4LHldIGNvb3JkaW5hdGVzLlxuICAgKi9cbiAgX3Byb2plY3RGbGF0KGxuZ0xhdCwgc2NhbGUgPSB0aGlzLnNjYWxlKSB7XG4gICAgcmV0dXJuIGxuZ0xhdFRvV29ybGQobG5nTGF0LCBzY2FsZSk7XG4gIH1cblxuICAvKipcbiAgICogVW5wcm9qZWN0IHdvcmxkIHBvaW50IFt4LHldIG9uIG1hcCBvbnRvIHtsYXQsIGxvbn0gb24gc3BoZXJlXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fFZlY3Rvcn0geHkgLSBvYmplY3Qgd2l0aCB7eCx5fSBtZW1iZXJzXG4gICAqICByZXByZXNlbnRpbmcgcG9pbnQgb24gcHJvamVjdGVkIG1hcCBwbGFuZVxuICAgKiBAcmV0dXJuIHtHZW9Db29yZGluYXRlc30gLSBvYmplY3Qgd2l0aCB7bGF0LGxvbn0gb2YgcG9pbnQgb24gc3BoZXJlLlxuICAgKiAgIEhhcyB0b0FycmF5IG1ldGhvZCBpZiB5b3UgbmVlZCBhIEdlb0pTT04gQXJyYXkuXG4gICAqICAgUGVyIGNhcnRvZ3JhcGhpYyB0cmFkaXRpb24sIGxhdCBhbmQgbG9uIGFyZSBzcGVjaWZpZWQgYXMgZGVncmVlcy5cbiAgICovXG4gIF91bnByb2plY3RGbGF0KHh5LCBzY2FsZSA9IHRoaXMuc2NhbGUpIHtcbiAgICByZXR1cm4gd29ybGRUb0xuZ0xhdCh4eSwgc2NhbGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgbWV0ZXIgb2Zmc2V0IHRvIGEgbG5nbGF0IG9mZnNldFxuICAgKlxuICAgKiBOb3RlOiBVc2VzIHNpbXBsZSBsaW5lYXIgYXBwcm94aW1hdGlvbiBhcm91bmQgdGhlIHZpZXdwb3J0IGNlbnRlclxuICAgKiBFcnJvciBpbmNyZWFzZXMgd2l0aCBzaXplIG9mIG9mZnNldCAocm91Z2hseSAxJSBwZXIgMTAwa20pXG4gICAqXG4gICAqIEBwYXJhbSB7W051bWJlcixOdW1iZXJdfFtOdW1iZXIsTnVtYmVyLE51bWJlcl0pIHh5eiAtIGFycmF5IG9mIG1ldGVyIGRlbHRhc1xuICAgKiBAcmV0dXJuIHtbTnVtYmVyLE51bWJlcl18W051bWJlcixOdW1iZXIsTnVtYmVyXSkgLSBhcnJheSBvZiBbbG5nLGxhdCx6XSBkZWx0YXNcbiAgICovXG4gIG1ldGVyc1RvTG5nTGF0RGVsdGEoeHl6KSB7XG4gICAgY29uc3QgW3gsIHksIHogPSAwXSA9IHh5ejtcbiAgICBhc3NlcnQoTnVtYmVyLmlzRmluaXRlKHgpICYmIE51bWJlci5pc0Zpbml0ZSh5KSAmJiBOdW1iZXIuaXNGaW5pdGUoeiksIEVSUl9BUkdVTUVOVCk7XG4gICAgY29uc3Qge3BpeGVsc1Blck1ldGVyLCBkZWdyZWVzUGVyUGl4ZWx9ID0gdGhpcy5kaXN0YW5jZVNjYWxlcztcbiAgICBjb25zdCBkZWx0YUxuZyA9IHggKiBwaXhlbHNQZXJNZXRlclswXSAqIGRlZ3JlZXNQZXJQaXhlbFswXTtcbiAgICBjb25zdCBkZWx0YUxhdCA9IHkgKiBwaXhlbHNQZXJNZXRlclsxXSAqIGRlZ3JlZXNQZXJQaXhlbFsxXTtcbiAgICByZXR1cm4geHl6Lmxlbmd0aCA9PT0gMiA/IFtkZWx0YUxuZywgZGVsdGFMYXRdIDogW2RlbHRhTG5nLCBkZWx0YUxhdCwgel07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBsbmdsYXQgb2Zmc2V0IHRvIGEgbWV0ZXIgb2Zmc2V0XG4gICAqXG4gICAqIE5vdGU6IFVzZXMgc2ltcGxlIGxpbmVhciBhcHByb3hpbWF0aW9uIGFyb3VuZCB0aGUgdmlld3BvcnQgY2VudGVyXG4gICAqIEVycm9yIGluY3JlYXNlcyB3aXRoIHNpemUgb2Ygb2Zmc2V0IChyb3VnaGx5IDElIHBlciAxMDBrbSlcbiAgICpcbiAgICogQHBhcmFtIHtbTnVtYmVyLE51bWJlcl18W051bWJlcixOdW1iZXIsTnVtYmVyXSkgZGVsdGFMbmdMYXRaIC0gYXJyYXkgb2YgW2xuZyxsYXQsel0gZGVsdGFzXG4gICAqIEByZXR1cm4ge1tOdW1iZXIsTnVtYmVyXXxbTnVtYmVyLE51bWJlcixOdW1iZXJdKSAtIGFycmF5IG9mIG1ldGVyIGRlbHRhc1xuICAgKi9cbiAgbG5nTGF0RGVsdGFUb01ldGVycyhkZWx0YUxuZ0xhdFopIHtcbiAgICBjb25zdCBbZGVsdGFMbmcsIGRlbHRhTGF0LCBkZWx0YVogPSAwXSA9IGRlbHRhTG5nTGF0WjtcbiAgICBhc3NlcnQoXG4gICAgICBOdW1iZXIuaXNGaW5pdGUoZGVsdGFMbmcpICYmIE51bWJlci5pc0Zpbml0ZShkZWx0YUxhdCkgJiYgTnVtYmVyLmlzRmluaXRlKGRlbHRhWiksXG4gICAgICBFUlJfQVJHVU1FTlRcbiAgICApO1xuICAgIGNvbnN0IHtwaXhlbHNQZXJEZWdyZWUsIG1ldGVyc1BlclBpeGVsfSA9IHRoaXMuZGlzdGFuY2VTY2FsZXM7XG4gICAgY29uc3QgZGVsdGFYID0gZGVsdGFMbmcgKiBwaXhlbHNQZXJEZWdyZWVbMF0gKiBtZXRlcnNQZXJQaXhlbFswXTtcbiAgICBjb25zdCBkZWx0YVkgPSBkZWx0YUxhdCAqIHBpeGVsc1BlckRlZ3JlZVsxXSAqIG1ldGVyc1BlclBpeGVsWzFdO1xuICAgIHJldHVybiBkZWx0YUxuZ0xhdFoubGVuZ3RoID09PSAyID8gW2RlbHRhWCwgZGVsdGFZXSA6IFtkZWx0YVgsIGRlbHRhWSwgZGVsdGFaXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBtZXRlciBkZWx0YSB0byBhIGJhc2UgbG5nbGF0IGNvb3JkaW5hdGUsIHJldHVybmluZyBhIG5ldyBsbmdsYXQgYXJyYXlcbiAgICpcbiAgICogTm90ZTogVXNlcyBzaW1wbGUgbGluZWFyIGFwcHJveGltYXRpb24gYXJvdW5kIHRoZSB2aWV3cG9ydCBjZW50ZXJcbiAgICogRXJyb3IgaW5jcmVhc2VzIHdpdGggc2l6ZSBvZiBvZmZzZXQgKHJvdWdobHkgMSUgcGVyIDEwMGttKVxuICAgKlxuICAgKiBAcGFyYW0ge1tOdW1iZXIsTnVtYmVyXXxbTnVtYmVyLE51bWJlcixOdW1iZXJdKSBsbmdMYXRaIC0gYmFzZSBjb29yZGluYXRlXG4gICAqIEBwYXJhbSB7W051bWJlcixOdW1iZXJdfFtOdW1iZXIsTnVtYmVyLE51bWJlcl0pIHh5eiAtIGFycmF5IG9mIG1ldGVyIGRlbHRhc1xuICAgKiBAcmV0dXJuIHtbTnVtYmVyLE51bWJlcl18W051bWJlcixOdW1iZXIsTnVtYmVyXSkgYXJyYXkgb2YgW2xuZyxsYXQsel0gZGVsdGFzXG4gICAqL1xuICBhZGRNZXRlcnNUb0xuZ0xhdChsbmdMYXRaLCB4eXopIHtcbiAgICBjb25zdCBbbG5nLCBsYXQsIFogPSAwXSA9IGxuZ0xhdFo7XG4gICAgY29uc3QgW2RlbHRhTG5nLCBkZWx0YUxhdCwgZGVsdGFaID0gMF0gPSB0aGlzLm1ldGVyc1RvTG5nTGF0RGVsdGEoeHl6KTtcbiAgICByZXR1cm4gbG5nTGF0Wi5sZW5ndGggPT09IDJcbiAgICAgID8gW2xuZyArIGRlbHRhTG5nLCBsYXQgKyBkZWx0YUxhdF1cbiAgICAgIDogW2xuZyArIGRlbHRhTG5nLCBsYXQgKyBkZWx0YUxhdCwgWiArIGRlbHRhWl07XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtYXAgY2VudGVyIHRoYXQgcGxhY2UgYSBnaXZlbiBbbG5nLCBsYXRdIGNvb3JkaW5hdGUgYXQgc2NyZWVuXG4gICAqIHBvaW50IFt4LCB5XVxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBsbmdMYXQgLSBbbG5nLGxhdF0gY29vcmRpbmF0ZXNcbiAgICogICBTcGVjaWZpZXMgYSBwb2ludCBvbiB0aGUgc3BoZXJlLlxuICAgKiBAcGFyYW0ge0FycmF5fSBwb3MgLSBbeCx5XSBjb29yZGluYXRlc1xuICAgKiAgIFNwZWNpZmllcyBhIHBvaW50IG9uIHRoZSBzY3JlZW4uXG4gICAqIEByZXR1cm4ge0FycmF5fSBbbG5nLGxhdF0gbmV3IG1hcCBjZW50ZXIuXG4gICAqL1xuICBnZXRNYXBDZW50ZXJCeUxuZ0xhdFBvc2l0aW9uKHtsbmdMYXQsIHBvc30pIHtcbiAgICBjb25zdCBmcm9tTG9jYXRpb24gPSBwaXhlbHNUb1dvcmxkKHBvcywgdGhpcy5waXhlbFVucHJvamVjdGlvbk1hdHJpeCk7XG4gICAgY29uc3QgdG9Mb2NhdGlvbiA9IGxuZ0xhdFRvV29ybGQobG5nTGF0LCB0aGlzLnNjYWxlKTtcblxuICAgIGNvbnN0IHRyYW5zbGF0ZSA9IHZlYzJfYWRkKFtdLCB0b0xvY2F0aW9uLCB2ZWMyX25lZ2F0ZShbXSwgZnJvbUxvY2F0aW9uKSk7XG4gICAgY29uc3QgbmV3Q2VudGVyID0gdmVjMl9hZGQoW10sIHRoaXMuY2VudGVyLCB0cmFuc2xhdGUpO1xuXG4gICAgcmV0dXJuIHdvcmxkVG9MbmdMYXQobmV3Q2VudGVyLCB0aGlzLnNjYWxlKTtcbiAgfVxuXG4gIC8vIExlZ2FjeSBtZXRob2QgbmFtZVxuICBnZXRMb2NhdGlvbkF0UG9pbnQoe2xuZ0xhdCwgcG9zfSkge1xuICAgIHJldHVybiB0aGlzLmdldE1hcENlbnRlckJ5TG5nTGF0UG9zaXRpb24oe2xuZ0xhdCwgcG9zfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyB2aWV3cG9ydCB0aGF0IGZpdCBhcm91bmQgdGhlIGdpdmVuIHJlY3RhbmdsZS5cbiAgICogT25seSBzdXBwb3J0cyBub24tcGVyc3BlY3RpdmUgbW9kZS5cbiAgICogQHBhcmFtIHtBcnJheX0gYm91bmRzIC0gW1tsb24sIGxhdF0sIFtsb24sIGxhdF1dXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5wYWRkaW5nXSAtIFRoZSBhbW91bnQgb2YgcGFkZGluZyBpbiBwaXhlbHMgdG8gYWRkIHRvIHRoZSBnaXZlbiBib3VuZHMuXG4gICAqIEBwYXJhbSB7QXJyYXl9IFtvcHRpb25zLm9mZnNldF0gLSBUaGUgY2VudGVyIG9mIHRoZSBnaXZlbiBib3VuZHMgcmVsYXRpdmUgdG8gdGhlIG1hcCdzIGNlbnRlcixcbiAgICogICAgW3gsIHldIG1lYXN1cmVkIGluIHBpeGVscy5cbiAgICogQHJldHVybnMge1dlYk1lcmNhdG9yVmlld3BvcnR9XG4gICAqL1xuICBmaXRCb3VuZHMoYm91bmRzLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzO1xuICAgIGNvbnN0IHtsb25naXR1ZGUsIGxhdGl0dWRlLCB6b29tfSA9IGZpdEJvdW5kcyhPYmplY3QuYXNzaWduKHt3aWR0aCwgaGVpZ2h0LCBib3VuZHN9LCBvcHRpb25zKSk7XG4gICAgcmV0dXJuIG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHt3aWR0aCwgaGVpZ2h0LCBsb25naXR1ZGUsIGxhdGl0dWRlLCB6b29tfSk7XG4gIH1cblxuICAvLyBUT0RPIC0gc2hvdWxkIHN1cHBvcnQgdXNlciBzdXBwbGllZCBjb25zdHJhaW50c1xuICBpc01hcFN5bmNoZWQoKSB7XG4gICAgY29uc3QgRVBTSUxPTiA9IDAuMDAwMDAxO1xuICAgIGNvbnN0IE1BUEJPWF9MSU1JVFMgPSB7XG4gICAgICBwaXRjaDogNjAsXG4gICAgICB6b29tOiA0MFxuICAgIH07XG5cbiAgICBjb25zdCB7cGl0Y2gsIHpvb219ID0gdGhpcztcblxuICAgIHJldHVybiBwaXRjaCA8PSBNQVBCT1hfTElNSVRTLnBpdGNoICsgRVBTSUxPTiAmJiB6b29tIDw9IE1BUEJPWF9MSU1JVFMuem9vbSArIEVQU0lMT047XG4gIH1cbn1cblxuV2ViTWVyY2F0b3JWaWV3cG9ydC5kaXNwbGF5TmFtZSA9ICdXZWJNZXJjYXRvclZpZXdwb3J0JztcbiJdfQ==