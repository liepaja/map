'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _mathUtils = require('../utils/math-utils');

var _math = require('math.gl');

var _scale = require('gl-mat4/scale');

var _scale2 = _interopRequireDefault(_scale);

var _translate = require('gl-mat4/translate');

var _translate2 = _interopRequireDefault(_translate);

var _multiply = require('gl-mat4/multiply');

var _multiply2 = _interopRequireDefault(_multiply);

var _invert = require('gl-mat4/invert');

var _invert2 = _interopRequireDefault(_invert);

var _perspective = require('gl-mat4/perspective');

var _perspective2 = _interopRequireDefault(_perspective);

var _viewportMercatorProject = require('viewport-mercator-project');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ZERO_VECTOR = [0, 0, 0];

var IDENTITY = (0, _mathUtils.createMat4)();

var DEFAULT_DISTANCE_SCALES = {
  pixelsPerMeter: [1, 1, 1],
  metersPerPixel: [1, 1, 1],
  pixelsPerDegree: [1, 1, 1],
  degreesPerPixel: [1, 1, 1]
};

var DEFAULT_ZOOM = 0;

var ERR_ARGUMENT = 'Illegal argument to Viewport';

var Viewport = function () {
  /**
   * @classdesc
   * Manages coordinate system transformations for deck.gl.
   *
   * Note: The Viewport is immutable in the sense that it only has accessors.
   * A new viewport instance should be created if any parameters have changed.
   */
  /* eslint-disable complexity, max-statements */
  function Viewport() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Viewport);

    var _opts$id = opts.id,
        id = _opts$id === undefined ? null : _opts$id,
        _opts$x = opts.x,
        x = _opts$x === undefined ? 0 : _opts$x,
        _opts$y = opts.y,
        y = _opts$y === undefined ? 0 : _opts$y,
        _opts$width = opts.width,
        width = _opts$width === undefined ? 1 : _opts$width,
        _opts$height = opts.height,
        height = _opts$height === undefined ? 1 : _opts$height,
        _opts$viewMatrix = opts.viewMatrix,
        viewMatrix = _opts$viewMatrix === undefined ? IDENTITY : _opts$viewMatrix,
        _opts$projectionMatri = opts.projectionMatrix,
        projectionMatrix = _opts$projectionMatri === undefined ? null : _opts$projectionMatri,
        _opts$fovy = opts.fovy,
        fovy = _opts$fovy === undefined ? 75 : _opts$fovy,
        _opts$near = opts.near,
        near = _opts$near === undefined ? 0.1 : _opts$near,
        _opts$far = opts.far,
        far = _opts$far === undefined ? 1000 : _opts$far,
        _opts$longitude = opts.longitude,
        longitude = _opts$longitude === undefined ? null : _opts$longitude,
        _opts$latitude = opts.latitude,
        latitude = _opts$latitude === undefined ? null : _opts$latitude,
        _opts$zoom = opts.zoom,
        zoom = _opts$zoom === undefined ? null : _opts$zoom,
        _opts$position = opts.position,
        position = _opts$position === undefined ? null : _opts$position,
        _opts$modelMatrix = opts.modelMatrix,
        modelMatrix = _opts$modelMatrix === undefined ? null : _opts$modelMatrix,
        _opts$distanceScales = opts.distanceScales,
        distanceScales = _opts$distanceScales === undefined ? null : _opts$distanceScales;


    this.id = id || this.constructor.displayName || 'viewport';

    // Check if we have a geospatial anchor
    this.isGeospatial = Number.isFinite(latitude) && Number.isFinite(longitude);

    // Silently allow apps to send in w,h = 0,0
    this.x = x;
    this.y = y;
    this.width = width || 1;
    this.height = height || 1;

    this.zoom = zoom;
    if (!Number.isFinite(this.zoom)) {
      this.zoom = this.isGeospatial ? (0, _viewportMercatorProject.getMeterZoom)({ latitude: latitude }) : DEFAULT_ZOOM;
    }
    this.scale = Math.pow(2, this.zoom);

    // Calculate distance scales if lng/lat/zoom are provided
    this.distanceScales = this.isGeospatial ? (0, _viewportMercatorProject.getDistanceScales)({ latitude: latitude, longitude: longitude, scale: this.scale }) : distanceScales || DEFAULT_DISTANCE_SCALES;

    this.focalDistance = opts.focalDistance || 1;

    this.distanceScales.metersPerPixel = new _math.Vector3(this.distanceScales.metersPerPixel);
    this.distanceScales.pixelsPerMeter = new _math.Vector3(this.distanceScales.pixelsPerMeter);

    this.position = ZERO_VECTOR;
    this.meterOffset = ZERO_VECTOR;
    if (position) {
      // Apply model matrix if supplied
      this.position = position;
      this.modelMatrix = modelMatrix;
      this.meterOffset = modelMatrix ? modelMatrix.transformVector(position) : position;
    }

    this.viewMatrixUncentered = viewMatrix;

    if (this.isGeospatial) {
      // Determine camera center
      this.center = (0, _viewportMercatorProject.getWorldPosition)({
        longitude: longitude,
        latitude: latitude,
        scale: this.scale,
        distanceScales: this.distanceScales,
        meterOffset: this.meterOffset
      });

      // Make a centered version of the matrix for projection modes without an offset
      this.viewMatrix = new _math.Matrix4()
      // Apply the uncentered view matrix
      .multiplyRight(this.viewMatrixUncentered)
      // The Mercator world coordinate system is upper left,
      // but GL expects lower left, so we flip it around the center after all transforms are done
      .scale([1, -1, 1])
      // And center it
      .translate(new _math.Vector3(this.center || ZERO_VECTOR).negate());
    } else {
      this.center = position;
      this.viewMatrix = viewMatrix;
    }

    // Create a projection matrix if not supplied
    if (projectionMatrix) {
      this.projectionMatrix = projectionMatrix;
    } else {
      (0, _assert2.default)(Number.isFinite(fovy));
      var DEGREES_TO_RADIANS = Math.PI / 180;
      var fovyRadians = fovy * DEGREES_TO_RADIANS;
      var aspect = this.width / this.height;
      this.projectionMatrix = (0, _perspective2.default)([], fovyRadians, aspect, near, far);
    }

    // Init pixel matrices
    this._initMatrices();

    // Bind methods for easy access
    this.equals = this.equals.bind(this);
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
    this.getMatrices = this.getMatrices.bind(this);
  }
  /* eslint-enable complexity, max-statements */

  // Two viewports are equal if width and height are identical, and if
  // their view and projection matrices are (approximately) equal.


  _createClass(Viewport, [{
    key: 'equals',
    value: function equals(viewport) {
      if (!(viewport instanceof Viewport)) {
        return false;
      }

      return viewport.width === this.width && viewport.height === this.height && (0, _math.equals)(viewport.projectionMatrix, this.projectionMatrix) && (0, _math.equals)(viewport.viewMatrix, this.viewMatrix);
      // TODO - check distance scales?
    }

    /**
     * Projects xyz (possibly latitude and longitude) to pixel coordinates in window
     * using viewport projection parameters
     * - [longitude, latitude] to [x, y]
     * - [longitude, latitude, Z] => [x, y, z]
     * Note: By default, returns top-left coordinates for canvas/SVG type render
     *
     * @param {Array} lngLatZ - [lng, lat] or [lng, lat, Z]
     * @param {Object} opts - options
     * @param {Object} opts.topLeft=true - Whether projected coords are top left
     * @return {Array} - [x, y] or [x, y, z] in top left coords
     */

  }, {
    key: 'project',
    value: function project(xyz) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$topLeft = _ref.topLeft,
          topLeft = _ref$topLeft === undefined ? true : _ref$topLeft;

      var _xyz = _slicedToArray(xyz, 3),
          x0 = _xyz[0],
          y0 = _xyz[1],
          _xyz$ = _xyz[2],
          z0 = _xyz$ === undefined ? 0 : _xyz$;

      var _projectFlat2 = this.projectFlat([x0, y0]),
          _projectFlat3 = _slicedToArray(_projectFlat2, 2),
          X = _projectFlat3[0],
          Y = _projectFlat3[1];

      var coord = (0, _viewportMercatorProject.worldToPixels)([X, Y, z0], this.pixelProjectionMatrix);

      var _coord = _slicedToArray(coord, 2),
          x = _coord[0],
          y = _coord[1];

      var y2 = topLeft ? y : this.height - y;
      return xyz.length === 2 ? [x, y2] : [x, y2, coord[2]];
    }

    /**
     * Unproject pixel coordinates on screen onto world coordinates,
     * (possibly [lon, lat]) on map.
     * - [x, y] => [lng, lat]
     * - [x, y, z] => [lng, lat, Z]
     * @param {Array} xyz -
     * @param {Object} opts - options
     * @param {Object} opts.topLeft=true - Whether origin is top left
     * @return {Array|null} - [lng, lat, Z] or [X, Y, Z]
     */

  }, {
    key: 'unproject',
    value: function unproject(xyz) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$topLeft = _ref2.topLeft,
          topLeft = _ref2$topLeft === undefined ? true : _ref2$topLeft,
          targetZ = _ref2.targetZ;

      var _xyz2 = _slicedToArray(xyz, 3),
          x = _xyz2[0],
          y = _xyz2[1],
          z = _xyz2[2];

      var y2 = topLeft ? y : this.height - y;
      var coord = (0, _viewportMercatorProject.pixelsToWorld)([x, y2, z], this.pixelUnprojectionMatrix, targetZ);

      var _unprojectFlat2 = this.unprojectFlat(coord),
          _unprojectFlat3 = _slicedToArray(_unprojectFlat2, 2),
          X = _unprojectFlat3[0],
          Y = _unprojectFlat3[1];

      if (Number.isFinite(z)) {
        // Has depth component
        return [X, Y, coord[2]];
      }

      return Number.isFinite(targetZ) ? [X, Y, targetZ] : [X, Y];
    }

    // NON_LINEAR PROJECTION HOOKS
    // Used for web meractor projection

    /**
     * Project [lng,lat] on sphere onto [x,y] on 512*512 Mercator Zoom 0 tile.
     * Performs the nonlinear part of the web mercator projection.
     * Remaining projection is done with 4x4 matrices which also handles
     * perspective.
     * @param {Array} lngLat - [lng, lat] coordinates
     *   Specifies a point on the sphere to project onto the map.
     * @return {Array} [x,y] coordinates.
     */

  }, {
    key: 'projectFlat',
    value: function projectFlat(_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
          x = _ref4[0],
          y = _ref4[1];

      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return this._projectFlat.apply(this, arguments);
    }

    /**
     * Unproject world point [x,y] on map onto {lat, lon} on sphere
     * @param {object|Vector} xy - object with {x,y} members
     *  representing point on projected map plane
     * @return {GeoCoordinates} - object with {lat,lon} of point on sphere.
     *   Has toArray method if you need a GeoJSON Array.
     *   Per cartographic tradition, lat and lon are specified as degrees.
     */

  }, {
    key: 'unprojectFlat',
    value: function unprojectFlat(xyz) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return this._unprojectFlat.apply(this, arguments);
    }

    // TODO - why do we need these?

  }, {
    key: '_projectFlat',
    value: function _projectFlat(xyz) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return xyz;
    }
  }, {
    key: '_unprojectFlat',
    value: function _unprojectFlat(xyz) {
      var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.scale;

      return xyz;
    }
  }, {
    key: 'getMercatorParams',
    value: function getMercatorParams() {
      var lngLat = this._addMetersToLngLat([this.longitude || 0, this.latitude || 0], this.meterOffset);
      return {
        longitude: lngLat[0],
        latitude: lngLat[1]
      };
    }
  }, {
    key: 'isMapSynched',
    value: function isMapSynched() {
      return false;
    }
  }, {
    key: 'getDistanceScales',
    value: function getDistanceScales() {
      var coordinateOrigin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (coordinateOrigin) {
        return (0, _viewportMercatorProject.getDistanceScales)({
          longitude: coordinateOrigin[0],
          latitude: coordinateOrigin[1],
          scale: this.scale,
          highPrecision: true
        });
      }
      return this.distanceScales;
    }
  }, {
    key: 'getMatrices',
    value: function getMatrices() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref5$modelMatrix = _ref5.modelMatrix,
          modelMatrix = _ref5$modelMatrix === undefined ? null : _ref5$modelMatrix;

      var modelViewProjectionMatrix = this.viewProjectionMatrix;
      var pixelProjectionMatrix = this.pixelProjectionMatrix;
      var pixelUnprojectionMatrix = this.pixelUnprojectionMatrix;

      if (modelMatrix) {
        modelViewProjectionMatrix = (0, _multiply2.default)([], this.viewProjectionMatrix, modelMatrix);
        pixelProjectionMatrix = (0, _multiply2.default)([], this.pixelProjectionMatrix, modelMatrix);
        pixelUnprojectionMatrix = (0, _invert2.default)([], pixelProjectionMatrix);
      }

      var matrices = Object.assign({
        modelViewProjectionMatrix: modelViewProjectionMatrix,
        viewProjectionMatrix: this.viewProjectionMatrix,
        viewMatrix: this.viewMatrix,
        projectionMatrix: this.projectionMatrix,

        // project/unproject between pixels and world
        pixelProjectionMatrix: pixelProjectionMatrix,
        pixelUnprojectionMatrix: pixelUnprojectionMatrix,

        width: this.width,
        height: this.height,
        scale: this.scale
      });

      return matrices;
    }

    // EXPERIMENTAL METHODS

  }, {
    key: 'getCameraPosition',
    value: function getCameraPosition() {
      return this.cameraPosition;
    }
  }, {
    key: 'getCameraDirection',
    value: function getCameraDirection() {
      return this.cameraDirection;
    }
  }, {
    key: 'getCameraUp',
    value: function getCameraUp() {
      return this.cameraUp;
    }

    // TODO - these are duplicating WebMercator methods

  }, {
    key: '_addMetersToLngLat',
    value: function _addMetersToLngLat(lngLatZ, xyz) {
      var _lngLatZ = _slicedToArray(lngLatZ, 3),
          lng = _lngLatZ[0],
          lat = _lngLatZ[1],
          _lngLatZ$ = _lngLatZ[2],
          Z = _lngLatZ$ === undefined ? 0 : _lngLatZ$;

      var _metersToLngLatDelta2 = this._metersToLngLatDelta(xyz),
          _metersToLngLatDelta3 = _slicedToArray(_metersToLngLatDelta2, 3),
          deltaLng = _metersToLngLatDelta3[0],
          deltaLat = _metersToLngLatDelta3[1],
          _metersToLngLatDelta4 = _metersToLngLatDelta3[2],
          deltaZ = _metersToLngLatDelta4 === undefined ? 0 : _metersToLngLatDelta4;

      return lngLatZ.length === 2 ? [lng + deltaLng, lat + deltaLat] : [lng + deltaLng, lat + deltaLat, Z + deltaZ];
    }
  }, {
    key: '_metersToLngLatDelta',
    value: function _metersToLngLatDelta(xyz) {
      var _xyz3 = _slicedToArray(xyz, 3),
          x = _xyz3[0],
          y = _xyz3[1],
          _xyz3$ = _xyz3[2],
          z = _xyz3$ === undefined ? 0 : _xyz3$;

      (0, _assert2.default)(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z), ERR_ARGUMENT);
      var _distanceScales = this.distanceScales,
          pixelsPerMeter = _distanceScales.pixelsPerMeter,
          degreesPerPixel = _distanceScales.degreesPerPixel;

      var deltaLng = x * pixelsPerMeter[0] * degreesPerPixel[0];
      var deltaLat = y * pixelsPerMeter[1] * degreesPerPixel[1];
      return xyz.length === 2 ? [deltaLng, deltaLat] : [deltaLng, deltaLat, z];
    }

    // INTERNAL METHODS

  }, {
    key: '_initMatrices',
    value: function _initMatrices() {
      // Note: As usual, matrix operations should be applied in "reverse" order
      // since vectors will be multiplied in from the right during transformation
      var vpm = (0, _mathUtils.createMat4)();
      (0, _multiply2.default)(vpm, vpm, this.projectionMatrix);
      (0, _multiply2.default)(vpm, vpm, this.viewMatrix);
      this.viewProjectionMatrix = vpm;

      // console.log('VPM', this.viewMatrix, this.projectionMatrix, this.viewProjectionMatrix);

      // Calculate inverse view matrix
      this.viewMatrixInverse = (0, _invert2.default)([], this.viewMatrix) || this.viewMatrix;

      // Decompose camera directions

      var _extractCameraVectors = (0, _mathUtils.extractCameraVectors)({
        viewMatrix: this.viewMatrix,
        viewMatrixInverse: this.viewMatrixInverse
      }),
          eye = _extractCameraVectors.eye,
          direction = _extractCameraVectors.direction,
          up = _extractCameraVectors.up;

      this.cameraPosition = eye;
      this.cameraDirection = direction;
      this.cameraUp = up;

      // console.log(this.cameraPosition, this.cameraDirection, this.cameraUp);

      /*
       * Builds matrices that converts preprojected lngLats to screen pixels
       * and vice versa.
       * Note: Currently returns bottom-left coordinates!
       * Note: Starts with the GL projection matrix and adds steps to the
       *       scale and translate that matrix onto the window.
       * Note: WebGL controls clip space to screen projection with gl.viewport
       *       and does not need this step.
       */

      // matrix for conversion from world location to screen (pixel) coordinates
      var m = (0, _mathUtils.createMat4)();
      (0, _scale2.default)(m, m, [this.width / 2, -this.height / 2, 1]);
      (0, _translate2.default)(m, m, [1, -1, 0]);
      (0, _multiply2.default)(m, m, this.viewProjectionMatrix);
      this.pixelProjectionMatrix = m;

      this.pixelUnprojectionMatrix = (0, _invert2.default)((0, _mathUtils.createMat4)(), this.pixelProjectionMatrix);
      if (!this.pixelUnprojectionMatrix) {
        _log2.default.warn('Pixel project matrix not invertible');
        // throw new Error('Pixel project matrix not invertible');
      }
    }
  }]);

  return Viewport;
}();

exports.default = Viewport;


Viewport.displayName = 'Viewport';
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3ZpZXdwb3J0cy92aWV3cG9ydC5qcyJdLCJuYW1lcyI6WyJaRVJPX1ZFQ1RPUiIsIklERU5USVRZIiwiREVGQVVMVF9ESVNUQU5DRV9TQ0FMRVMiLCJwaXhlbHNQZXJNZXRlciIsIm1ldGVyc1BlclBpeGVsIiwicGl4ZWxzUGVyRGVncmVlIiwiZGVncmVlc1BlclBpeGVsIiwiREVGQVVMVF9aT09NIiwiRVJSX0FSR1VNRU5UIiwiVmlld3BvcnQiLCJvcHRzIiwiaWQiLCJ4IiwieSIsIndpZHRoIiwiaGVpZ2h0Iiwidmlld01hdHJpeCIsInByb2plY3Rpb25NYXRyaXgiLCJmb3Z5IiwibmVhciIsImZhciIsImxvbmdpdHVkZSIsImxhdGl0dWRlIiwiem9vbSIsInBvc2l0aW9uIiwibW9kZWxNYXRyaXgiLCJkaXN0YW5jZVNjYWxlcyIsImNvbnN0cnVjdG9yIiwiZGlzcGxheU5hbWUiLCJpc0dlb3NwYXRpYWwiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsInNjYWxlIiwiTWF0aCIsInBvdyIsImZvY2FsRGlzdGFuY2UiLCJtZXRlck9mZnNldCIsInRyYW5zZm9ybVZlY3RvciIsInZpZXdNYXRyaXhVbmNlbnRlcmVkIiwiY2VudGVyIiwibXVsdGlwbHlSaWdodCIsInRyYW5zbGF0ZSIsIm5lZ2F0ZSIsIkRFR1JFRVNfVE9fUkFESUFOUyIsIlBJIiwiZm92eVJhZGlhbnMiLCJhc3BlY3QiLCJfaW5pdE1hdHJpY2VzIiwiZXF1YWxzIiwiYmluZCIsInByb2plY3QiLCJ1bnByb2plY3QiLCJwcm9qZWN0RmxhdCIsInVucHJvamVjdEZsYXQiLCJnZXRNYXRyaWNlcyIsInZpZXdwb3J0IiwieHl6IiwidG9wTGVmdCIsIngwIiwieTAiLCJ6MCIsIlgiLCJZIiwiY29vcmQiLCJwaXhlbFByb2plY3Rpb25NYXRyaXgiLCJ5MiIsImxlbmd0aCIsInRhcmdldFoiLCJ6IiwicGl4ZWxVbnByb2plY3Rpb25NYXRyaXgiLCJfcHJvamVjdEZsYXQiLCJhcmd1bWVudHMiLCJfdW5wcm9qZWN0RmxhdCIsImxuZ0xhdCIsIl9hZGRNZXRlcnNUb0xuZ0xhdCIsImNvb3JkaW5hdGVPcmlnaW4iLCJoaWdoUHJlY2lzaW9uIiwibW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCIsInZpZXdQcm9qZWN0aW9uTWF0cml4IiwibWF0cmljZXMiLCJPYmplY3QiLCJhc3NpZ24iLCJjYW1lcmFQb3NpdGlvbiIsImNhbWVyYURpcmVjdGlvbiIsImNhbWVyYVVwIiwibG5nTGF0WiIsImxuZyIsImxhdCIsIloiLCJfbWV0ZXJzVG9MbmdMYXREZWx0YSIsImRlbHRhTG5nIiwiZGVsdGFMYXQiLCJkZWx0YVoiLCJ2cG0iLCJ2aWV3TWF0cml4SW52ZXJzZSIsImV5ZSIsImRpcmVjdGlvbiIsInVwIiwibSIsIndhcm4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3FqQkFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7OztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFJQTs7QUFRQTs7Ozs7Ozs7QUFWQSxJQUFNQSxjQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBQXBCOztBQVlBLElBQU1DLFdBQVcsNEJBQWpCOztBQUVBLElBQU1DLDBCQUEwQjtBQUM5QkMsa0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBRGM7QUFFOUJDLGtCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUZjO0FBRzlCQyxtQkFBaUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FIYTtBQUk5QkMsbUJBQWlCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQO0FBSmEsQ0FBaEM7O0FBT0EsSUFBTUMsZUFBZSxDQUFyQjs7QUFFQSxJQUFNQyxlQUFlLDhCQUFyQjs7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Y0ZBLFNBZEU7QUFBQSxVQWNTQyxFQWRULHlCQWNTQSxFQWRUOztBQWtCZCxXQUFLZixjQUFMLEdBQXNCYSxHQUF0QjtBQUNBLFdBQUtaLGVBQUwsR0FBdUJhLFNBQXZCO0FBQ0EsV0FBS1osUUFBTCxHQUFnQmEsRUFBaEI7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7QUFVQTtBQUNBLFVBQU1DLElBQUksNEJBQVY7QUFDQSwyQkFBV0EsQ0FBWCxFQUFjQSxDQUFkLEVBQWlCLENBQUMsS0FBS3BGLEtBQUwsR0FBYSxDQUFkLEVBQWlCLENBQUMsS0FBS0MsTUFBTixHQUFlLENBQWhDLEVBQW1DLENBQW5DLENBQWpCO0FBQ0EsK0JBQWVtRixDQUFmLEVBQWtCQSxDQUFsQixFQUFxQixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsRUFBUSxDQUFSLENBQXJCO0FBQ0EsOEJBQWNBLENBQWQsRUFBaUJBLENBQWpCLEVBQW9CLEtBQUtwQixvQkFBekI7QUFDQSxXQUFLZCxxQkFBTCxHQUE2QmtDLENBQTdCOztBQUVBLFdBQUs3Qix1QkFBTCxHQUErQixzQkFBWSw0QkFBWixFQUEwQixLQUFLTCxxQkFBL0IsQ0FBL0I7QUFDQSxVQUFJLENBQUMsS0FBS0ssdUJBQVYsRUFBbUM7QUFDakMsc0JBQUk4QixJQUFKLENBQVMscUNBQVQ7QUFDQTtBQUNEO0FBQ0Y7Ozs7OztrQkE5V2tCMUYsUTs7O0FBaVhyQkEsU0FBU21CLFdBQVQsR0FBdUIsVUFBdkIiLCJmaWxlIjoidmlld3BvcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IGxvZyBmcm9tICcuLi91dGlscy9sb2cnO1xuaW1wb3J0IHtjcmVhdGVNYXQ0LCBleHRyYWN0Q2FtZXJhVmVjdG9yc30gZnJvbSAnLi4vdXRpbHMvbWF0aC11dGlscyc7XG5cbmltcG9ydCB7TWF0cml4NCwgVmVjdG9yMywgZXF1YWxzfSBmcm9tICdtYXRoLmdsJztcbmltcG9ydCBtYXQ0X3NjYWxlIGZyb20gJ2dsLW1hdDQvc2NhbGUnO1xuaW1wb3J0IG1hdDRfdHJhbnNsYXRlIGZyb20gJ2dsLW1hdDQvdHJhbnNsYXRlJztcbmltcG9ydCBtYXQ0X211bHRpcGx5IGZyb20gJ2dsLW1hdDQvbXVsdGlwbHknO1xuaW1wb3J0IG1hdDRfaW52ZXJ0IGZyb20gJ2dsLW1hdDQvaW52ZXJ0JztcbmltcG9ydCBtYXQ0X3BlcnNwZWN0aXZlIGZyb20gJ2dsLW1hdDQvcGVyc3BlY3RpdmUnO1xuXG5jb25zdCBaRVJPX1ZFQ1RPUiA9IFswLCAwLCAwXTtcblxuaW1wb3J0IHtcbiAgZ2V0RGlzdGFuY2VTY2FsZXMsXG4gIGdldFdvcmxkUG9zaXRpb24sXG4gIGdldE1ldGVyWm9vbSxcbiAgd29ybGRUb1BpeGVscyxcbiAgcGl4ZWxzVG9Xb3JsZFxufSBmcm9tICd2aWV3cG9ydC1tZXJjYXRvci1wcm9qZWN0JztcblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBJREVOVElUWSA9IGNyZWF0ZU1hdDQoKTtcblxuY29uc3QgREVGQVVMVF9ESVNUQU5DRV9TQ0FMRVMgPSB7XG4gIHBpeGVsc1Blck1ldGVyOiBbMSwgMSwgMV0sXG4gIG1ldGVyc1BlclBpeGVsOiBbMSwgMSwgMV0sXG4gIHBpeGVsc1BlckRlZ3JlZTogWzEsIDEsIDFdLFxuICBkZWdyZWVzUGVyUGl4ZWw6IFsxLCAxLCAxXVxufTtcblxuY29uc3QgREVGQVVMVF9aT09NID0gMDtcblxuY29uc3QgRVJSX0FSR1VNRU5UID0gJ0lsbGVnYWwgYXJndW1lbnQgdG8gVmlld3BvcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWaWV3cG9ydCB7XG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIE1hbmFnZXMgY29vcmRpbmF0ZSBzeXN0ZW0gdHJhbnNmb3JtYXRpb25zIGZvciBkZWNrLmdsLlxuICAgKlxuICAgKiBOb3RlOiBUaGUgVmlld3BvcnQgaXMgaW1tdXRhYmxlIGluIHRoZSBzZW5zZSB0aGF0IGl0IG9ubHkgaGFzIGFjY2Vzc29ycy5cbiAgICogQSBuZXcgdmlld3BvcnQgaW5zdGFuY2Ugc2hvdWxkIGJlIGNyZWF0ZWQgaWYgYW55IHBhcmFtZXRlcnMgaGF2ZSBjaGFuZ2VkLlxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qge1xuICAgICAgaWQgPSBudWxsLFxuXG4gICAgICAvLyBXaW5kb3cgd2lkdGgvaGVpZ2h0IGluIHBpeGVscyAoZm9yIHBpeGVsIHByb2plY3Rpb24pXG4gICAgICB4ID0gMCxcbiAgICAgIHkgPSAwLFxuICAgICAgd2lkdGggPSAxLFxuICAgICAgaGVpZ2h0ID0gMSxcblxuICAgICAgLy8gdmlldyBtYXRyaXhcbiAgICAgIHZpZXdNYXRyaXggPSBJREVOVElUWSxcblxuICAgICAgLy8gUHJvamVjdGlvbiBtYXRyaXhcbiAgICAgIHByb2plY3Rpb25NYXRyaXggPSBudWxsLFxuXG4gICAgICAvLyBQZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCBwYXJhbWV0ZXJzLCB1c2VkIGlmIHByb2plY3Rpb25NYXRyaXggbm90IHN1cHBsaWVkXG4gICAgICBmb3Z5ID0gNzUsXG4gICAgICBuZWFyID0gMC4xLCAvLyBEaXN0YW5jZSBvZiBuZWFyIGNsaXBwaW5nIHBsYW5lXG4gICAgICBmYXIgPSAxMDAwLCAvLyBEaXN0YW5jZSBvZiBmYXIgY2xpcHBpbmcgcGxhbmVcblxuICAgICAgLy8gQW5jaG9yOiBsbmcgbGF0IHpvb20gd2lsbCBtYWtlIHRoaXMgdmlld3BvcnQgd29yayB3aXRoIGdlb3NwYXRpYWwgY29vcmRpbmF0ZSBzeXN0ZW1zXG4gICAgICBsb25naXR1ZGUgPSBudWxsLFxuICAgICAgbGF0aXR1ZGUgPSBudWxsLFxuICAgICAgem9vbSA9IG51bGwsXG5cbiAgICAgIC8vIEFuY2hvciBwb3NpdGlvbiBvZmZzZXQgKGluIG1ldGVycyBmb3IgZ2Vvc3BhdGlhbCB2aWV3cG9ydHMpXG4gICAgICBwb3NpdGlvbiA9IG51bGwsXG4gICAgICAvLyBBIG1vZGVsIG1hdHJpeCB0byBiZSBhcHBsaWVkIHRvIHBvc2l0aW9uLCB0byBtYXRjaCB0aGUgbGF5ZXIgcHJvcHMgQVBJXG4gICAgICBtb2RlbE1hdHJpeCA9IG51bGwsXG5cbiAgICAgIGRpc3RhbmNlU2NhbGVzID0gbnVsbFxuICAgIH0gPSBvcHRzO1xuXG4gICAgdGhpcy5pZCA9IGlkIHx8IHRoaXMuY29uc3RydWN0b3IuZGlzcGxheU5hbWUgfHwgJ3ZpZXdwb3J0JztcblxuICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYSBnZW9zcGF0aWFsIGFuY2hvclxuICAgIHRoaXMuaXNHZW9zcGF0aWFsID0gTnVtYmVyLmlzRmluaXRlKGxhdGl0dWRlKSAmJiBOdW1iZXIuaXNGaW5pdGUobG9uZ2l0dWRlKTtcblxuICAgIC8vIFNpbGVudGx5IGFsbG93IGFwcHMgdG8gc2VuZCBpbiB3LGggPSAwLDBcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IDE7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgMTtcblxuICAgIHRoaXMuem9vbSA9IHpvb207XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodGhpcy56b29tKSkge1xuICAgICAgdGhpcy56b29tID0gdGhpcy5pc0dlb3NwYXRpYWwgPyBnZXRNZXRlclpvb20oe2xhdGl0dWRlfSkgOiBERUZBVUxUX1pPT007XG4gICAgfVxuICAgIHRoaXMuc2NhbGUgPSBNYXRoLnBvdygyLCB0aGlzLnpvb20pO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGRpc3RhbmNlIHNjYWxlcyBpZiBsbmcvbGF0L3pvb20gYXJlIHByb3ZpZGVkXG4gICAgdGhpcy5kaXN0YW5jZVNjYWxlcyA9IHRoaXMuaXNHZW9zcGF0aWFsXG4gICAgICA/IGdldERpc3RhbmNlU2NhbGVzKHtsYXRpdHVkZSwgbG9uZ2l0dWRlLCBzY2FsZTogdGhpcy5zY2FsZX0pXG4gICAgICA6IGRpc3RhbmNlU2NhbGVzIHx8IERFRkFVTFRfRElTVEFOQ0VfU0NBTEVTO1xuXG4gICAgdGhpcy5mb2NhbERpc3RhbmNlID0gb3B0cy5mb2NhbERpc3RhbmNlIHx8IDE7XG5cbiAgICB0aGlzLmRpc3RhbmNlU2NhbGVzLm1ldGVyc1BlclBpeGVsID0gbmV3IFZlY3RvcjModGhpcy5kaXN0YW5jZVNjYWxlcy5tZXRlcnNQZXJQaXhlbCk7XG4gICAgdGhpcy5kaXN0YW5jZVNjYWxlcy5waXhlbHNQZXJNZXRlciA9IG5ldyBWZWN0b3IzKHRoaXMuZGlzdGFuY2VTY2FsZXMucGl4ZWxzUGVyTWV0ZXIpO1xuXG4gICAgdGhpcy5wb3NpdGlvbiA9IFpFUk9fVkVDVE9SO1xuICAgIHRoaXMubWV0ZXJPZmZzZXQgPSBaRVJPX1ZFQ1RPUjtcbiAgICBpZiAocG9zaXRpb24pIHtcbiAgICAgIC8vIEFwcGx5IG1vZGVsIG1hdHJpeCBpZiBzdXBwbGllZFxuICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgdGhpcy5tb2RlbE1hdHJpeCA9IG1vZGVsTWF0cml4O1xuICAgICAgdGhpcy5tZXRlck9mZnNldCA9IG1vZGVsTWF0cml4ID8gbW9kZWxNYXRyaXgudHJhbnNmb3JtVmVjdG9yKHBvc2l0aW9uKSA6IHBvc2l0aW9uO1xuICAgIH1cblxuICAgIHRoaXMudmlld01hdHJpeFVuY2VudGVyZWQgPSB2aWV3TWF0cml4O1xuXG4gICAgaWYgKHRoaXMuaXNHZW9zcGF0aWFsKSB7XG4gICAgICAvLyBEZXRlcm1pbmUgY2FtZXJhIGNlbnRlclxuICAgICAgdGhpcy5jZW50ZXIgPSBnZXRXb3JsZFBvc2l0aW9uKHtcbiAgICAgICAgbG9uZ2l0dWRlLFxuICAgICAgICBsYXRpdHVkZSxcbiAgICAgICAgc2NhbGU6IHRoaXMuc2NhbGUsXG4gICAgICAgIGRpc3RhbmNlU2NhbGVzOiB0aGlzLmRpc3RhbmNlU2NhbGVzLFxuICAgICAgICBtZXRlck9mZnNldDogdGhpcy5tZXRlck9mZnNldFxuICAgICAgfSk7XG5cbiAgICAgIC8vIE1ha2UgYSBjZW50ZXJlZCB2ZXJzaW9uIG9mIHRoZSBtYXRyaXggZm9yIHByb2plY3Rpb24gbW9kZXMgd2l0aG91dCBhbiBvZmZzZXRcbiAgICAgIHRoaXMudmlld01hdHJpeCA9IG5ldyBNYXRyaXg0KClcbiAgICAgICAgLy8gQXBwbHkgdGhlIHVuY2VudGVyZWQgdmlldyBtYXRyaXhcbiAgICAgICAgLm11bHRpcGx5UmlnaHQodGhpcy52aWV3TWF0cml4VW5jZW50ZXJlZClcbiAgICAgICAgLy8gVGhlIE1lcmNhdG9yIHdvcmxkIGNvb3JkaW5hdGUgc3lzdGVtIGlzIHVwcGVyIGxlZnQsXG4gICAgICAgIC8vIGJ1dCBHTCBleHBlY3RzIGxvd2VyIGxlZnQsIHNvIHdlIGZsaXAgaXQgYXJvdW5kIHRoZSBjZW50ZXIgYWZ0ZXIgYWxsIHRyYW5zZm9ybXMgYXJlIGRvbmVcbiAgICAgICAgLnNjYWxlKFsxLCAtMSwgMV0pXG4gICAgICAgIC8vIEFuZCBjZW50ZXIgaXRcbiAgICAgICAgLnRyYW5zbGF0ZShuZXcgVmVjdG9yMyh0aGlzLmNlbnRlciB8fCBaRVJPX1ZFQ1RPUikubmVnYXRlKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNlbnRlciA9IHBvc2l0aW9uO1xuICAgICAgdGhpcy52aWV3TWF0cml4ID0gdmlld01hdHJpeDtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBwcm9qZWN0aW9uIG1hdHJpeCBpZiBub3Qgc3VwcGxpZWRcbiAgICBpZiAocHJvamVjdGlvbk1hdHJpeCkge1xuICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4ID0gcHJvamVjdGlvbk1hdHJpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0KE51bWJlci5pc0Zpbml0ZShmb3Z5KSk7XG4gICAgICBjb25zdCBERUdSRUVTX1RPX1JBRElBTlMgPSBNYXRoLlBJIC8gMTgwO1xuICAgICAgY29uc3QgZm92eVJhZGlhbnMgPSBmb3Z5ICogREVHUkVFU19UT19SQURJQU5TO1xuICAgICAgY29uc3QgYXNwZWN0ID0gdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0O1xuICAgICAgdGhpcy5wcm9qZWN0aW9uTWF0cml4ID0gbWF0NF9wZXJzcGVjdGl2ZShbXSwgZm92eVJhZGlhbnMsIGFzcGVjdCwgbmVhciwgZmFyKTtcbiAgICB9XG5cbiAgICAvLyBJbml0IHBpeGVsIG1hdHJpY2VzXG4gICAgdGhpcy5faW5pdE1hdHJpY2VzKCk7XG5cbiAgICAvLyBCaW5kIG1ldGhvZHMgZm9yIGVhc3kgYWNjZXNzXG4gICAgdGhpcy5lcXVhbHMgPSB0aGlzLmVxdWFscy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucHJvamVjdCA9IHRoaXMucHJvamVjdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMudW5wcm9qZWN0ID0gdGhpcy51bnByb2plY3QuYmluZCh0aGlzKTtcbiAgICB0aGlzLnByb2plY3RGbGF0ID0gdGhpcy5wcm9qZWN0RmxhdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMudW5wcm9qZWN0RmxhdCA9IHRoaXMudW5wcm9qZWN0RmxhdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0TWF0cmljZXMgPSB0aGlzLmdldE1hdHJpY2VzLmJpbmQodGhpcyk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIC8vIFR3byB2aWV3cG9ydHMgYXJlIGVxdWFsIGlmIHdpZHRoIGFuZCBoZWlnaHQgYXJlIGlkZW50aWNhbCwgYW5kIGlmXG4gIC8vIHRoZWlyIHZpZXcgYW5kIHByb2plY3Rpb24gbWF0cmljZXMgYXJlIChhcHByb3hpbWF0ZWx5KSBlcXVhbC5cbiAgZXF1YWxzKHZpZXdwb3J0KSB7XG4gICAgaWYgKCEodmlld3BvcnQgaW5zdGFuY2VvZiBWaWV3cG9ydCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgdmlld3BvcnQud2lkdGggPT09IHRoaXMud2lkdGggJiZcbiAgICAgIHZpZXdwb3J0LmhlaWdodCA9PT0gdGhpcy5oZWlnaHQgJiZcbiAgICAgIGVxdWFscyh2aWV3cG9ydC5wcm9qZWN0aW9uTWF0cml4LCB0aGlzLnByb2plY3Rpb25NYXRyaXgpICYmXG4gICAgICBlcXVhbHModmlld3BvcnQudmlld01hdHJpeCwgdGhpcy52aWV3TWF0cml4KVxuICAgICk7XG4gICAgLy8gVE9ETyAtIGNoZWNrIGRpc3RhbmNlIHNjYWxlcz9cbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9qZWN0cyB4eXogKHBvc3NpYmx5IGxhdGl0dWRlIGFuZCBsb25naXR1ZGUpIHRvIHBpeGVsIGNvb3JkaW5hdGVzIGluIHdpbmRvd1xuICAgKiB1c2luZyB2aWV3cG9ydCBwcm9qZWN0aW9uIHBhcmFtZXRlcnNcbiAgICogLSBbbG9uZ2l0dWRlLCBsYXRpdHVkZV0gdG8gW3gsIHldXG4gICAqIC0gW2xvbmdpdHVkZSwgbGF0aXR1ZGUsIFpdID0+IFt4LCB5LCB6XVxuICAgKiBOb3RlOiBCeSBkZWZhdWx0LCByZXR1cm5zIHRvcC1sZWZ0IGNvb3JkaW5hdGVzIGZvciBjYW52YXMvU1ZHIHR5cGUgcmVuZGVyXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl9IGxuZ0xhdFogLSBbbG5nLCBsYXRdIG9yIFtsbmcsIGxhdCwgWl1cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLnRvcExlZnQ9dHJ1ZSAtIFdoZXRoZXIgcHJvamVjdGVkIGNvb3JkcyBhcmUgdG9wIGxlZnRcbiAgICogQHJldHVybiB7QXJyYXl9IC0gW3gsIHldIG9yIFt4LCB5LCB6XSBpbiB0b3AgbGVmdCBjb29yZHNcbiAgICovXG4gIHByb2plY3QoeHl6LCB7dG9wTGVmdCA9IHRydWV9ID0ge30pIHtcbiAgICBjb25zdCBbeDAsIHkwLCB6MCA9IDBdID0geHl6O1xuXG4gICAgY29uc3QgW1gsIFldID0gdGhpcy5wcm9qZWN0RmxhdChbeDAsIHkwXSk7XG4gICAgY29uc3QgY29vcmQgPSB3b3JsZFRvUGl4ZWxzKFtYLCBZLCB6MF0sIHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4KTtcblxuICAgIGNvbnN0IFt4LCB5XSA9IGNvb3JkO1xuICAgIGNvbnN0IHkyID0gdG9wTGVmdCA/IHkgOiB0aGlzLmhlaWdodCAtIHk7XG4gICAgcmV0dXJuIHh5ei5sZW5ndGggPT09IDIgPyBbeCwgeTJdIDogW3gsIHkyLCBjb29yZFsyXV07XG4gIH1cblxuICAvKipcbiAgICogVW5wcm9qZWN0IHBpeGVsIGNvb3JkaW5hdGVzIG9uIHNjcmVlbiBvbnRvIHdvcmxkIGNvb3JkaW5hdGVzLFxuICAgKiAocG9zc2libHkgW2xvbiwgbGF0XSkgb24gbWFwLlxuICAgKiAtIFt4LCB5XSA9PiBbbG5nLCBsYXRdXG4gICAqIC0gW3gsIHksIHpdID0+IFtsbmcsIGxhdCwgWl1cbiAgICogQHBhcmFtIHtBcnJheX0geHl6IC1cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLnRvcExlZnQ9dHJ1ZSAtIFdoZXRoZXIgb3JpZ2luIGlzIHRvcCBsZWZ0XG4gICAqIEByZXR1cm4ge0FycmF5fG51bGx9IC0gW2xuZywgbGF0LCBaXSBvciBbWCwgWSwgWl1cbiAgICovXG4gIHVucHJvamVjdCh4eXosIHt0b3BMZWZ0ID0gdHJ1ZSwgdGFyZ2V0Wn0gPSB7fSkge1xuICAgIGNvbnN0IFt4LCB5LCB6XSA9IHh5ejtcblxuICAgIGNvbnN0IHkyID0gdG9wTGVmdCA/IHkgOiB0aGlzLmhlaWdodCAtIHk7XG4gICAgY29uc3QgY29vcmQgPSBwaXhlbHNUb1dvcmxkKFt4LCB5Miwgel0sIHRoaXMucGl4ZWxVbnByb2plY3Rpb25NYXRyaXgsIHRhcmdldFopO1xuICAgIGNvbnN0IFtYLCBZXSA9IHRoaXMudW5wcm9qZWN0RmxhdChjb29yZCk7XG5cbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHopKSB7XG4gICAgICAvLyBIYXMgZGVwdGggY29tcG9uZW50XG4gICAgICByZXR1cm4gW1gsIFksIGNvb3JkWzJdXTtcbiAgICB9XG5cbiAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHRhcmdldFopID8gW1gsIFksIHRhcmdldFpdIDogW1gsIFldO1xuICB9XG5cbiAgLy8gTk9OX0xJTkVBUiBQUk9KRUNUSU9OIEhPT0tTXG4gIC8vIFVzZWQgZm9yIHdlYiBtZXJhY3RvciBwcm9qZWN0aW9uXG5cbiAgLyoqXG4gICAqIFByb2plY3QgW2xuZyxsYXRdIG9uIHNwaGVyZSBvbnRvIFt4LHldIG9uIDUxMio1MTIgTWVyY2F0b3IgWm9vbSAwIHRpbGUuXG4gICAqIFBlcmZvcm1zIHRoZSBub25saW5lYXIgcGFydCBvZiB0aGUgd2ViIG1lcmNhdG9yIHByb2plY3Rpb24uXG4gICAqIFJlbWFpbmluZyBwcm9qZWN0aW9uIGlzIGRvbmUgd2l0aCA0eDQgbWF0cmljZXMgd2hpY2ggYWxzbyBoYW5kbGVzXG4gICAqIHBlcnNwZWN0aXZlLlxuICAgKiBAcGFyYW0ge0FycmF5fSBsbmdMYXQgLSBbbG5nLCBsYXRdIGNvb3JkaW5hdGVzXG4gICAqICAgU3BlY2lmaWVzIGEgcG9pbnQgb24gdGhlIHNwaGVyZSB0byBwcm9qZWN0IG9udG8gdGhlIG1hcC5cbiAgICogQHJldHVybiB7QXJyYXl9IFt4LHldIGNvb3JkaW5hdGVzLlxuICAgKi9cbiAgcHJvamVjdEZsYXQoW3gsIHldLCBzY2FsZSA9IHRoaXMuc2NhbGUpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvamVjdEZsYXQoLi4uYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnByb2plY3Qgd29ybGQgcG9pbnQgW3gseV0gb24gbWFwIG9udG8ge2xhdCwgbG9ufSBvbiBzcGhlcmVcbiAgICogQHBhcmFtIHtvYmplY3R8VmVjdG9yfSB4eSAtIG9iamVjdCB3aXRoIHt4LHl9IG1lbWJlcnNcbiAgICogIHJlcHJlc2VudGluZyBwb2ludCBvbiBwcm9qZWN0ZWQgbWFwIHBsYW5lXG4gICAqIEByZXR1cm4ge0dlb0Nvb3JkaW5hdGVzfSAtIG9iamVjdCB3aXRoIHtsYXQsbG9ufSBvZiBwb2ludCBvbiBzcGhlcmUuXG4gICAqICAgSGFzIHRvQXJyYXkgbWV0aG9kIGlmIHlvdSBuZWVkIGEgR2VvSlNPTiBBcnJheS5cbiAgICogICBQZXIgY2FydG9ncmFwaGljIHRyYWRpdGlvbiwgbGF0IGFuZCBsb24gYXJlIHNwZWNpZmllZCBhcyBkZWdyZWVzLlxuICAgKi9cbiAgdW5wcm9qZWN0RmxhdCh4eXosIHNjYWxlID0gdGhpcy5zY2FsZSkge1xuICAgIHJldHVybiB0aGlzLl91bnByb2plY3RGbGF0KC4uLmFyZ3VtZW50cyk7XG4gIH1cblxuICAvLyBUT0RPIC0gd2h5IGRvIHdlIG5lZWQgdGhlc2U/XG4gIF9wcm9qZWN0RmxhdCh4eXosIHNjYWxlID0gdGhpcy5zY2FsZSkge1xuICAgIHJldHVybiB4eXo7XG4gIH1cblxuICBfdW5wcm9qZWN0RmxhdCh4eXosIHNjYWxlID0gdGhpcy5zY2FsZSkge1xuICAgIHJldHVybiB4eXo7XG4gIH1cblxuICBnZXRNZXJjYXRvclBhcmFtcygpIHtcbiAgICBjb25zdCBsbmdMYXQgPSB0aGlzLl9hZGRNZXRlcnNUb0xuZ0xhdChcbiAgICAgIFt0aGlzLmxvbmdpdHVkZSB8fCAwLCB0aGlzLmxhdGl0dWRlIHx8IDBdLFxuICAgICAgdGhpcy5tZXRlck9mZnNldFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxvbmdpdHVkZTogbG5nTGF0WzBdLFxuICAgICAgbGF0aXR1ZGU6IGxuZ0xhdFsxXVxuICAgIH07XG4gIH1cblxuICBpc01hcFN5bmNoZWQoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0RGlzdGFuY2VTY2FsZXMoY29vcmRpbmF0ZU9yaWdpbiA9IG51bGwpIHtcbiAgICBpZiAoY29vcmRpbmF0ZU9yaWdpbikge1xuICAgICAgcmV0dXJuIGdldERpc3RhbmNlU2NhbGVzKHtcbiAgICAgICAgbG9uZ2l0dWRlOiBjb29yZGluYXRlT3JpZ2luWzBdLFxuICAgICAgICBsYXRpdHVkZTogY29vcmRpbmF0ZU9yaWdpblsxXSxcbiAgICAgICAgc2NhbGU6IHRoaXMuc2NhbGUsXG4gICAgICAgIGhpZ2hQcmVjaXNpb246IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kaXN0YW5jZVNjYWxlcztcbiAgfVxuXG4gIGdldE1hdHJpY2VzKHttb2RlbE1hdHJpeCA9IG51bGx9ID0ge30pIHtcbiAgICBsZXQgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCA9IHRoaXMudmlld1Byb2plY3Rpb25NYXRyaXg7XG4gICAgbGV0IHBpeGVsUHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4O1xuICAgIGxldCBwaXhlbFVucHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucGl4ZWxVbnByb2plY3Rpb25NYXRyaXg7XG5cbiAgICBpZiAobW9kZWxNYXRyaXgpIHtcbiAgICAgIG1vZGVsVmlld1Byb2plY3Rpb25NYXRyaXggPSBtYXQ0X211bHRpcGx5KFtdLCB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4LCBtb2RlbE1hdHJpeCk7XG4gICAgICBwaXhlbFByb2plY3Rpb25NYXRyaXggPSBtYXQ0X211bHRpcGx5KFtdLCB0aGlzLnBpeGVsUHJvamVjdGlvbk1hdHJpeCwgbW9kZWxNYXRyaXgpO1xuICAgICAgcGl4ZWxVbnByb2plY3Rpb25NYXRyaXggPSBtYXQ0X2ludmVydChbXSwgcGl4ZWxQcm9qZWN0aW9uTWF0cml4KTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRyaWNlcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgbW9kZWxWaWV3UHJvamVjdGlvbk1hdHJpeCxcbiAgICAgIHZpZXdQcm9qZWN0aW9uTWF0cml4OiB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4LFxuICAgICAgdmlld01hdHJpeDogdGhpcy52aWV3TWF0cml4LFxuICAgICAgcHJvamVjdGlvbk1hdHJpeDogdGhpcy5wcm9qZWN0aW9uTWF0cml4LFxuXG4gICAgICAvLyBwcm9qZWN0L3VucHJvamVjdCBiZXR3ZWVuIHBpeGVscyBhbmQgd29ybGRcbiAgICAgIHBpeGVsUHJvamVjdGlvbk1hdHJpeCxcbiAgICAgIHBpeGVsVW5wcm9qZWN0aW9uTWF0cml4LFxuXG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBzY2FsZTogdGhpcy5zY2FsZVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1hdHJpY2VzO1xuICB9XG5cbiAgLy8gRVhQRVJJTUVOVEFMIE1FVEhPRFNcblxuICBnZXRDYW1lcmFQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jYW1lcmFQb3NpdGlvbjtcbiAgfVxuXG4gIGdldENhbWVyYURpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jYW1lcmFEaXJlY3Rpb247XG4gIH1cblxuICBnZXRDYW1lcmFVcCgpIHtcbiAgICByZXR1cm4gdGhpcy5jYW1lcmFVcDtcbiAgfVxuXG4gIC8vIFRPRE8gLSB0aGVzZSBhcmUgZHVwbGljYXRpbmcgV2ViTWVyY2F0b3IgbWV0aG9kc1xuICBfYWRkTWV0ZXJzVG9MbmdMYXQobG5nTGF0WiwgeHl6KSB7XG4gICAgY29uc3QgW2xuZywgbGF0LCBaID0gMF0gPSBsbmdMYXRaO1xuICAgIGNvbnN0IFtkZWx0YUxuZywgZGVsdGFMYXQsIGRlbHRhWiA9IDBdID0gdGhpcy5fbWV0ZXJzVG9MbmdMYXREZWx0YSh4eXopO1xuICAgIHJldHVybiBsbmdMYXRaLmxlbmd0aCA9PT0gMlxuICAgICAgPyBbbG5nICsgZGVsdGFMbmcsIGxhdCArIGRlbHRhTGF0XVxuICAgICAgOiBbbG5nICsgZGVsdGFMbmcsIGxhdCArIGRlbHRhTGF0LCBaICsgZGVsdGFaXTtcbiAgfVxuXG4gIF9tZXRlcnNUb0xuZ0xhdERlbHRhKHh5eikge1xuICAgIGNvbnN0IFt4LCB5LCB6ID0gMF0gPSB4eXo7XG4gICAgYXNzZXJ0KE51bWJlci5pc0Zpbml0ZSh4KSAmJiBOdW1iZXIuaXNGaW5pdGUoeSkgJiYgTnVtYmVyLmlzRmluaXRlKHopLCBFUlJfQVJHVU1FTlQpO1xuICAgIGNvbnN0IHtwaXhlbHNQZXJNZXRlciwgZGVncmVlc1BlclBpeGVsfSA9IHRoaXMuZGlzdGFuY2VTY2FsZXM7XG4gICAgY29uc3QgZGVsdGFMbmcgPSB4ICogcGl4ZWxzUGVyTWV0ZXJbMF0gKiBkZWdyZWVzUGVyUGl4ZWxbMF07XG4gICAgY29uc3QgZGVsdGFMYXQgPSB5ICogcGl4ZWxzUGVyTWV0ZXJbMV0gKiBkZWdyZWVzUGVyUGl4ZWxbMV07XG4gICAgcmV0dXJuIHh5ei5sZW5ndGggPT09IDIgPyBbZGVsdGFMbmcsIGRlbHRhTGF0XSA6IFtkZWx0YUxuZywgZGVsdGFMYXQsIHpdO1xuICB9XG5cbiAgLy8gSU5URVJOQUwgTUVUSE9EU1xuXG4gIF9pbml0TWF0cmljZXMoKSB7XG4gICAgLy8gTm90ZTogQXMgdXN1YWwsIG1hdHJpeCBvcGVyYXRpb25zIHNob3VsZCBiZSBhcHBsaWVkIGluIFwicmV2ZXJzZVwiIG9yZGVyXG4gICAgLy8gc2luY2UgdmVjdG9ycyB3aWxsIGJlIG11bHRpcGxpZWQgaW4gZnJvbSB0aGUgcmlnaHQgZHVyaW5nIHRyYW5zZm9ybWF0aW9uXG4gICAgY29uc3QgdnBtID0gY3JlYXRlTWF0NCgpO1xuICAgIG1hdDRfbXVsdGlwbHkodnBtLCB2cG0sIHRoaXMucHJvamVjdGlvbk1hdHJpeCk7XG4gICAgbWF0NF9tdWx0aXBseSh2cG0sIHZwbSwgdGhpcy52aWV3TWF0cml4KTtcbiAgICB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4ID0gdnBtO1xuXG4gICAgLy8gY29uc29sZS5sb2coJ1ZQTScsIHRoaXMudmlld01hdHJpeCwgdGhpcy5wcm9qZWN0aW9uTWF0cml4LCB0aGlzLnZpZXdQcm9qZWN0aW9uTWF0cml4KTtcblxuICAgIC8vIENhbGN1bGF0ZSBpbnZlcnNlIHZpZXcgbWF0cml4XG4gICAgdGhpcy52aWV3TWF0cml4SW52ZXJzZSA9IG1hdDRfaW52ZXJ0KFtdLCB0aGlzLnZpZXdNYXRyaXgpIHx8IHRoaXMudmlld01hdHJpeDtcblxuICAgIC8vIERlY29tcG9zZSBjYW1lcmEgZGlyZWN0aW9uc1xuICAgIGNvbnN0IHtleWUsIGRpcmVjdGlvbiwgdXB9ID0gZXh0cmFjdENhbWVyYVZlY3RvcnMoe1xuICAgICAgdmlld01hdHJpeDogdGhpcy52aWV3TWF0cml4LFxuICAgICAgdmlld01hdHJpeEludmVyc2U6IHRoaXMudmlld01hdHJpeEludmVyc2VcbiAgICB9KTtcbiAgICB0aGlzLmNhbWVyYVBvc2l0aW9uID0gZXllO1xuICAgIHRoaXMuY2FtZXJhRGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHRoaXMuY2FtZXJhVXAgPSB1cDtcblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuY2FtZXJhUG9zaXRpb24sIHRoaXMuY2FtZXJhRGlyZWN0aW9uLCB0aGlzLmNhbWVyYVVwKTtcblxuICAgIC8qXG4gICAgICogQnVpbGRzIG1hdHJpY2VzIHRoYXQgY29udmVydHMgcHJlcHJvamVjdGVkIGxuZ0xhdHMgdG8gc2NyZWVuIHBpeGVsc1xuICAgICAqIGFuZCB2aWNlIHZlcnNhLlxuICAgICAqIE5vdGU6IEN1cnJlbnRseSByZXR1cm5zIGJvdHRvbS1sZWZ0IGNvb3JkaW5hdGVzIVxuICAgICAqIE5vdGU6IFN0YXJ0cyB3aXRoIHRoZSBHTCBwcm9qZWN0aW9uIG1hdHJpeCBhbmQgYWRkcyBzdGVwcyB0byB0aGVcbiAgICAgKiAgICAgICBzY2FsZSBhbmQgdHJhbnNsYXRlIHRoYXQgbWF0cml4IG9udG8gdGhlIHdpbmRvdy5cbiAgICAgKiBOb3RlOiBXZWJHTCBjb250cm9scyBjbGlwIHNwYWNlIHRvIHNjcmVlbiBwcm9qZWN0aW9uIHdpdGggZ2wudmlld3BvcnRcbiAgICAgKiAgICAgICBhbmQgZG9lcyBub3QgbmVlZCB0aGlzIHN0ZXAuXG4gICAgICovXG5cbiAgICAvLyBtYXRyaXggZm9yIGNvbnZlcnNpb24gZnJvbSB3b3JsZCBsb2NhdGlvbiB0byBzY3JlZW4gKHBpeGVsKSBjb29yZGluYXRlc1xuICAgIGNvbnN0IG0gPSBjcmVhdGVNYXQ0KCk7XG4gICAgbWF0NF9zY2FsZShtLCBtLCBbdGhpcy53aWR0aCAvIDIsIC10aGlzLmhlaWdodCAvIDIsIDFdKTtcbiAgICBtYXQ0X3RyYW5zbGF0ZShtLCBtLCBbMSwgLTEsIDBdKTtcbiAgICBtYXQ0X211bHRpcGx5KG0sIG0sIHRoaXMudmlld1Byb2plY3Rpb25NYXRyaXgpO1xuICAgIHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4ID0gbTtcblxuICAgIHRoaXMucGl4ZWxVbnByb2plY3Rpb25NYXRyaXggPSBtYXQ0X2ludmVydChjcmVhdGVNYXQ0KCksIHRoaXMucGl4ZWxQcm9qZWN0aW9uTWF0cml4KTtcbiAgICBpZiAoIXRoaXMucGl4ZWxVbnByb2plY3Rpb25NYXRyaXgpIHtcbiAgICAgIGxvZy53YXJuKCdQaXhlbCBwcm9qZWN0IG1hdHJpeCBub3QgaW52ZXJ0aWJsZScpO1xuICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKCdQaXhlbCBwcm9qZWN0IG1hdHJpeCBub3QgaW52ZXJ0aWJsZScpO1xuICAgIH1cbiAgfVxufVxuXG5WaWV3cG9ydC5kaXNwbGF5TmFtZSA9ICdWaWV3cG9ydCc7XG4iXX0=