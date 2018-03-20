'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _hexagonCellLayerVertex = require('./hexagon-cell-layer-vertex.glsl');

var _hexagonCellLayerVertex2 = _interopRequireDefault(_hexagonCellLayerVertex);

var _hexagonCellLayerVertex3 = require('./hexagon-cell-layer-vertex-64.glsl');

var _hexagonCellLayerVertex4 = _interopRequireDefault(_hexagonCellLayerVertex3);

var _hexagonCellLayerFragment = require('./hexagon-cell-layer-fragment.glsl');

var _hexagonCellLayerFragment2 = _interopRequireDefault(_hexagonCellLayerFragment);

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

var log = _core.experimental.log,
    fp64LowPart = _core.experimental.fp64LowPart,
    enable64bitSupport = _core.experimental.enable64bitSupport;


var DEFAULT_COLOR = [255, 0, 255, 255];

var defaultProps = {
  hexagonVertices: null,
  radius: null,
  angle: null,
  coverage: 1,
  elevationScale: 1,
  extruded: true,
  fp64: false,

  getCentroid: function getCentroid(x) {
    return x.centroid;
  },
  getColor: function getColor(x) {
    return x.color;
  },
  getElevation: function getElevation(x) {
    return x.elevation;
  },

  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.0, 5000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [1.2, 0.0, 0.8, 0.0],
    numberOfLights: 2
  }
};

var HexagonCellLayer = function (_Layer) {
  _inherits(HexagonCellLayer, _Layer);

  function HexagonCellLayer(props) {
    _classCallCheck(this, HexagonCellLayer);

    var missingProps = false;
    if (!props.hexagonVertices && (!props.radius || !Number.isFinite(props.angle))) {
      log.once(0, 'HexagonCellLayer: Either hexagonVertices or radius and angle are ' + 'needed to calculate primitive hexagon.');
      missingProps = true;
    } else if (props.hexagonVertices && (!Array.isArray(props.hexagonVertices) || props.hexagonVertices.length < 6)) {
      log.once(0, 'HexagonCellLayer: hexagonVertices needs to be an array of 6 points');

      missingProps = true;
    }

    if (missingProps) {
      log.once(0, 'Now using 1000 meter as default radius, 0 as default angle');
      props.radius = 1000;
      props.angle = 0;
    }

    return _possibleConstructorReturn(this, (HexagonCellLayer.__proto__ || Object.getPrototypeOf(HexagonCellLayer)).call(this, props));
  }

  _createClass(HexagonCellLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: _hexagonCellLayerVertex4.default, fs: _hexagonCellLayerFragment2.default, modules: ['project64', 'lighting', 'picking'] } : { vs: _hexagonCellLayerVertex2.default, fs: _hexagonCellLayerFragment2.default, modules: ['lighting', 'picking'] }; // 'project' module added by default.
    }

    /**
     * DeckGL calls initializeState when GL context is available
     * Essentially a deferred constructor
     */

  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      /* eslint-disable max-len */
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          transition: true,
          accessor: ['getCentroid', 'getElevation'],
          update: this.calculateInstancePositions
        },
        instanceColors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          transition: true,
          accessor: 'getColor',
          update: this.calculateInstanceColors
        }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateAttribute',
    value: function updateAttribute(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.getAttributeManager();
        attributeManager.invalidateAll();

        if (props.fp64 && props.coordinateSystem === _core.COORDINATE_SYSTEM.LNGLAT) {
          attributeManager.addInstanced({
            instancePositions64xyLow: {
              size: 2,
              accessor: 'getCentroid',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(HexagonCellLayer.prototype.__proto__ || Object.getPrototypeOf(HexagonCellLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      this.updateUniforms();
    }
  }, {
    key: 'updateRadiusAngle',
    value: function updateRadiusAngle() {
      var angle = void 0;
      var radius = void 0;
      var hexagonVertices = this.props.hexagonVertices;


      if (Array.isArray(hexagonVertices) && hexagonVertices.length >= 6) {
        // calculate angle and vertices from hexagonVertices if provided
        var vertices = this.props.hexagonVertices;

        var vertex0 = vertices[0];
        var vertex3 = vertices[3];

        // transform to space coordinates
        var spaceCoord0 = this.projectFlat(vertex0);
        var spaceCoord3 = this.projectFlat(vertex3);

        // distance between two close centroids
        var dx = spaceCoord0[0] - spaceCoord3[0];
        var dy = spaceCoord0[1] - spaceCoord3[1];
        var dxy = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle that the perpendicular hexagon vertex axis is tilted
        angle = Math.acos(dx / dxy) * -Math.sign(dy) + Math.PI / 2;
        radius = dxy / 2;
      } else if (this.props.radius && Number.isFinite(this.props.angle)) {
        // if no hexagonVertices provided, try use radius & angle
        var viewport = this.context.viewport;
        // TODO - this should be a standard uniform in project package

        var _viewport$getDistance = viewport.getDistanceScales(),
            pixelsPerMeter = _viewport$getDistance.pixelsPerMeter;

        angle = this.props.angle;
        radius = this.props.radius * pixelsPerMeter[0];
      }

      return { angle: angle, radius: radius };
    }
  }, {
    key: 'getCylinderGeometry',
    value: function getCylinderGeometry(radius) {
      return new _luma.CylinderGeometry({
        radius: radius,
        topRadius: radius,
        bottomRadius: radius,
        topCap: true,
        bottomCap: true,
        height: 1,
        nradial: 6,
        nvertical: 1
      });
    }
  }, {
    key: 'updateUniforms',
    value: function updateUniforms() {
      var _props = this.props,
          opacity = _props.opacity,
          elevationScale = _props.elevationScale,
          extruded = _props.extruded,
          coverage = _props.coverage,
          lightSettings = _props.lightSettings;
      var model = this.state.model;


      model.setUniforms(Object.assign({}, {
        extruded: extruded,
        opacity: opacity,
        coverage: coverage,
        elevationScale: elevationScale
      }, lightSettings));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: this.getCylinderGeometry(1),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;

      _get(HexagonCellLayer.prototype.__proto__ || Object.getPrototypeOf(HexagonCellLayer.prototype), 'draw', this).call(this, { uniforms: Object.assign(this.updateRadiusAngle(), uniforms) });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getCentroid = _props2.getCentroid,
          getElevation = _props2.getElevation;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var _getCentroid = getCentroid(object),
              _getCentroid2 = _slicedToArray(_getCentroid, 2),
              lon = _getCentroid2[0],
              lat = _getCentroid2[1];

          var elevation = getElevation(object);
          value[i + 0] = lon;
          value[i + 1] = lat;
          value[i + 2] = elevation || 0;
          i += size;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'calculateInstancePositions64xyLow',
    value: function calculateInstancePositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getCentroid = _props3.getCentroid;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var position = getCentroid(object);
          value[i++] = fp64LowPart(position[0]);
          value[i++] = fp64LowPart(position[1]);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getColor(object) || DEFAULT_COLOR;

          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = Number.isFinite(color[3]) ? color[3] : DEFAULT_COLOR[3];
          i += size;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }]);

  return HexagonCellLayer;
}(_core.Layer);

exports.default = HexagonCellLayer;


HexagonCellLayer.layerName = 'HexagonCellLayer';
HexagonCellLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9oZXhhZ29uLWNlbGwtbGF5ZXIvaGV4YWdvbi1jZWxsLWxheWVyLmpzIl0sIm5hbWVzIjpbImxvZyIsImZwNjRMb3dQYXJ0IiwiZW5hYmxlNjRiaXRTdXBwb3J0IiwiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImhleGFnb25WZXJ0aWNlcyIsInJhZGl1cyIsImFuZ2xlIiwiY292ZXJhZ2UiLCJlbGV2YXRpb25TY2FsZSIsImV4dHJ1ZGVkIiwiZnA2NCIsImdldENlbnRyb2lkIiwieCIsImNlbnRyb2lkIiwiZ2V0Q29sb3IiLCJjb2xvciIsImdldEVsZXZhdGlvbiIsImVsZXZhdGlvbiIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiSGV4YWdvbkNlbGxMYXllciIsInByb3BzIiwibWlzc2luZ1Byb3BzIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJvbmNlIiwiQXJyYXkiLCJpc0FycmF5IiwibGVuZ3RoIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwiZ2V0QXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsInRyYW5zaXRpb24iLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zIiwiaW5zdGFuY2VDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJjb29yZGluYXRlU3lzdGVtIiwiTE5HTEFUIiwiaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwicmVtb3ZlIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsInVwZGF0ZUF0dHJpYnV0ZSIsInVwZGF0ZVVuaWZvcm1zIiwidmVydGljZXMiLCJ2ZXJ0ZXgwIiwidmVydGV4MyIsInNwYWNlQ29vcmQwIiwicHJvamVjdEZsYXQiLCJzcGFjZUNvb3JkMyIsImR4IiwiZHkiLCJkeHkiLCJNYXRoIiwic3FydCIsImFjb3MiLCJzaWduIiwiUEkiLCJ2aWV3cG9ydCIsImdldERpc3RhbmNlU2NhbGVzIiwicGl4ZWxzUGVyTWV0ZXIiLCJ0b3BSYWRpdXMiLCJib3R0b21SYWRpdXMiLCJ0b3BDYXAiLCJib3R0b21DYXAiLCJoZWlnaHQiLCJucmFkaWFsIiwibnZlcnRpY2FsIiwib3BhY2l0eSIsInN0YXRlIiwic2V0VW5pZm9ybXMiLCJPYmplY3QiLCJhc3NpZ24iLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImdldEN5bGluZGVyR2VvbWV0cnkiLCJpc0luc3RhbmNlZCIsInNoYWRlckNhY2hlIiwidW5pZm9ybXMiLCJ1cGRhdGVSYWRpdXNBbmdsZSIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJsb24iLCJsYXQiLCJwb3NpdGlvbiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUVBOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUExQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBR09BLEcsc0JBQUFBLEc7SUFBS0MsVyxzQkFBQUEsVztJQUFhQyxrQixzQkFBQUEsa0I7OztBQU96QixJQUFNQyxnQkFBZ0IsQ0FBQyxHQUFELEVBQU0sQ0FBTixFQUFTLEdBQVQsRUFBYyxHQUFkLENBQXRCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLG1CQUFpQixJQURFO0FB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O0FBQUE7QUFhbEM7Ozs7OztrQkFuTmtCaEIsZ0I7OztBQXNOckJBLGlCQUFpQnFGLFNBQWpCLEdBQTZCLGtCQUE3QjtBQUNBckYsaUJBQWlCdEIsWUFBakIsR0FBZ0NBLFlBQWhDIiwiZmlsZSI6ImhleGFnb24tY2VsbC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNLCBMYXllciwgZXhwZXJpbWVudGFsfSBmcm9tICcuLi8uLi9jb3JlJztcbmNvbnN0IHtsb2csIGZwNjRMb3dQYXJ0LCBlbmFibGU2NGJpdFN1cHBvcnR9ID0gZXhwZXJpbWVudGFsO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEN5bGluZGVyR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuXG5pbXBvcnQgdnMgZnJvbSAnLi9oZXhhZ29uLWNlbGwtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHZzNjQgZnJvbSAnLi9oZXhhZ29uLWNlbGwtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGZzIGZyb20gJy4vaGV4YWdvbi1jZWxsLWxheWVyLWZyYWdtZW50Lmdsc2wnO1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzI1NSwgMCwgMjU1LCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGhleGFnb25WZXJ0aWNlczogbnVsbCxcbiAgcmFkaXVzOiBudWxsLFxuICBhbmdsZTogbnVsbCxcbiAgY292ZXJhZ2U6IDEsXG4gIGVsZXZhdGlvblNjYWxlOiAxLFxuICBleHRydWRlZDogdHJ1ZSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0Q2VudHJvaWQ6IHggPT4geC5jZW50cm9pZCxcbiAgZ2V0Q29sb3I6IHggPT4geC5jb2xvcixcbiAgZ2V0RWxldmF0aW9uOiB4ID0+IHguZWxldmF0aW9uLFxuXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWy0xMjIuNDUsIDM3Ljc1LCA4MDAwLCAtMTIyLjAsIDM4LjAsIDUwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC40LFxuICAgIGRpZmZ1c2VSYXRpbzogMC42LFxuICAgIHNwZWN1bGFyUmF0aW86IDAuOCxcbiAgICBsaWdodHNTdHJlbmd0aDogWzEuMiwgMC4wLCAwLjgsIDAuMF0sXG4gICAgbnVtYmVyT2ZMaWdodHM6IDJcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGV4YWdvbkNlbGxMYXllciBleHRlbmRzIExheWVyIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBsZXQgbWlzc2luZ1Byb3BzID0gZmFsc2U7XG4gICAgaWYgKCFwcm9wcy5oZXhhZ29uVmVydGljZXMgJiYgKCFwcm9wcy5yYWRpdXMgfHwgIU51bWJlci5pc0Zpbml0ZShwcm9wcy5hbmdsZSkpKSB7XG4gICAgICBsb2cub25jZShcbiAgICAgICAgMCxcbiAgICAgICAgJ0hleGFnb25DZWxsTGF5ZXI6IEVpdGhlciBoZXhhZ29uVmVydGljZXMgb3IgcmFkaXVzIGFuZCBhbmdsZSBhcmUgJyArXG4gICAgICAgICAgJ25lZWRlZCB0byBjYWxjdWxhdGUgcHJpbWl0aXZlIGhleGFnb24uJ1xuICAgICAgKTtcbiAgICAgIG1pc3NpbmdQcm9wcyA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHByb3BzLmhleGFnb25WZXJ0aWNlcyAmJlxuICAgICAgKCFBcnJheS5pc0FycmF5KHByb3BzLmhleGFnb25WZXJ0aWNlcykgfHwgcHJvcHMuaGV4YWdvblZlcnRpY2VzLmxlbmd0aCA8IDYpXG4gICAgKSB7XG4gICAgICBsb2cub25jZSgwLCAnSGV4YWdvbkNlbGxMYXllcjogaGV4YWdvblZlcnRpY2VzIG5lZWRzIHRvIGJlIGFuIGFycmF5IG9mIDYgcG9pbnRzJyk7XG5cbiAgICAgIG1pc3NpbmdQcm9wcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKG1pc3NpbmdQcm9wcykge1xuICAgICAgbG9nLm9uY2UoMCwgJ05vdyB1c2luZyAxMDAwIG1ldGVyIGFzIGRlZmF1bHQgcmFkaXVzLCAwIGFzIGRlZmF1bHQgYW5nbGUnKTtcbiAgICAgIHByb3BzLnJhZGl1cyA9IDEwMDA7XG4gICAgICBwcm9wcy5hbmdsZSA9IDA7XG4gICAgfVxuXG4gICAgc3VwZXIocHJvcHMpO1xuICB9XG5cbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4gZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpXG4gICAgICA/IHt2czogdnM2NCwgZnMsIG1vZHVsZXM6IFsncHJvamVjdDY0JywgJ2xpZ2h0aW5nJywgJ3BpY2tpbmcnXX1cbiAgICAgIDoge3ZzLCBmcywgbW9kdWxlczogWydsaWdodGluZycsICdwaWNraW5nJ119OyAvLyAncHJvamVjdCcgbW9kdWxlIGFkZGVkIGJ5IGRlZmF1bHQuXG4gIH1cblxuICAvKipcbiAgICogRGVja0dMIGNhbGxzIGluaXRpYWxpemVTdGF0ZSB3aGVuIEdMIGNvbnRleHQgaXMgYXZhaWxhYmxlXG4gICAqIEVzc2VudGlhbGx5IGEgZGVmZXJyZWQgY29uc3RydWN0b3JcbiAgICovXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlUG9zaXRpb25zOiB7XG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiBbJ2dldENlbnRyb2lkJywgJ2dldEVsZXZhdGlvbiddLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge1xuICAgICAgICBzaXplOiA0LFxuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldENvbG9yJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzXG4gICAgICB9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAocHJvcHMuZnA2NCAmJiBwcm9wcy5jb29yZGluYXRlU3lzdGVtID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdMQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgICAgIGluc3RhbmNlUG9zaXRpb25zNjR4eUxvdzoge1xuICAgICAgICAgICAgc2l6ZTogMixcbiAgICAgICAgICAgIGFjY2Vzc29yOiAnZ2V0Q2VudHJvaWQnLFxuICAgICAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eUxvd1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLnJlbW92ZShbJ2luc3RhbmNlUG9zaXRpb25zNjR4eUxvdyddKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuXG4gICAgdGhpcy51cGRhdGVVbmlmb3JtcygpO1xuICB9XG5cbiAgdXBkYXRlUmFkaXVzQW5nbGUoKSB7XG4gICAgbGV0IGFuZ2xlO1xuICAgIGxldCByYWRpdXM7XG4gICAgY29uc3Qge2hleGFnb25WZXJ0aWNlc30gPSB0aGlzLnByb3BzO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGV4YWdvblZlcnRpY2VzKSAmJiBoZXhhZ29uVmVydGljZXMubGVuZ3RoID49IDYpIHtcbiAgICAgIC8vIGNhbGN1bGF0ZSBhbmdsZSBhbmQgdmVydGljZXMgZnJvbSBoZXhhZ29uVmVydGljZXMgaWYgcHJvdmlkZWRcbiAgICAgIGNvbnN0IHZlcnRpY2VzID0gdGhpcy5wcm9wcy5oZXhhZ29uVmVydGljZXM7XG5cbiAgICAgIGNvbnN0IHZlcnRleDAgPSB2ZXJ0aWNlc1swXTtcbiAgICAgIGNvbnN0IHZlcnRleDMgPSB2ZXJ0aWNlc1szXTtcblxuICAgICAgLy8gdHJhbnNmb3JtIHRvIHNwYWNlIGNvb3JkaW5hdGVzXG4gICAgICBjb25zdCBzcGFjZUNvb3JkMCA9IHRoaXMucHJvamVjdEZsYXQodmVydGV4MCk7XG4gICAgICBjb25zdCBzcGFjZUNvb3JkMyA9IHRoaXMucHJvamVjdEZsYXQodmVydGV4Myk7XG5cbiAgICAgIC8vIGRpc3RhbmNlIGJldHdlZW4gdHdvIGNsb3NlIGNlbnRyb2lkc1xuICAgICAgY29uc3QgZHggPSBzcGFjZUNvb3JkMFswXSAtIHNwYWNlQ29vcmQzWzBdO1xuICAgICAgY29uc3QgZHkgPSBzcGFjZUNvb3JkMFsxXSAtIHNwYWNlQ29vcmQzWzFdO1xuICAgICAgY29uc3QgZHh5ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGFuZ2xlIHRoYXQgdGhlIHBlcnBlbmRpY3VsYXIgaGV4YWdvbiB2ZXJ0ZXggYXhpcyBpcyB0aWx0ZWRcbiAgICAgIGFuZ2xlID0gTWF0aC5hY29zKGR4IC8gZHh5KSAqIC1NYXRoLnNpZ24oZHkpICsgTWF0aC5QSSAvIDI7XG4gICAgICByYWRpdXMgPSBkeHkgLyAyO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5yYWRpdXMgJiYgTnVtYmVyLmlzRmluaXRlKHRoaXMucHJvcHMuYW5nbGUpKSB7XG4gICAgICAvLyBpZiBubyBoZXhhZ29uVmVydGljZXMgcHJvdmlkZWQsIHRyeSB1c2UgcmFkaXVzICYgYW5nbGVcbiAgICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgICAvLyBUT0RPIC0gdGhpcyBzaG91bGQgYmUgYSBzdGFuZGFyZCB1bmlmb3JtIGluIHByb2plY3QgcGFja2FnZVxuICAgICAgY29uc3Qge3BpeGVsc1Blck1ldGVyfSA9IHZpZXdwb3J0LmdldERpc3RhbmNlU2NhbGVzKCk7XG5cbiAgICAgIGFuZ2xlID0gdGhpcy5wcm9wcy5hbmdsZTtcbiAgICAgIHJhZGl1cyA9IHRoaXMucHJvcHMucmFkaXVzICogcGl4ZWxzUGVyTWV0ZXJbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHthbmdsZSwgcmFkaXVzfTtcbiAgfVxuXG4gIGdldEN5bGluZGVyR2VvbWV0cnkocmFkaXVzKSB7XG4gICAgcmV0dXJuIG5ldyBDeWxpbmRlckdlb21ldHJ5KHtcbiAgICAgIHJhZGl1cyxcbiAgICAgIHRvcFJhZGl1czogcmFkaXVzLFxuICAgICAgYm90dG9tUmFkaXVzOiByYWRpdXMsXG4gICAgICB0b3BDYXA6IHRydWUsXG4gICAgICBib3R0b21DYXA6IHRydWUsXG4gICAgICBoZWlnaHQ6IDEsXG4gICAgICBucmFkaWFsOiA2LFxuICAgICAgbnZlcnRpY2FsOiAxXG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVVbmlmb3JtcygpIHtcbiAgICBjb25zdCB7b3BhY2l0eSwgZWxldmF0aW9uU2NhbGUsIGV4dHJ1ZGVkLCBjb3ZlcmFnZSwgbGlnaHRTZXR0aW5nc30gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnN0YXRlO1xuXG4gICAgbW9kZWwuc2V0VW5pZm9ybXMoXG4gICAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAge1xuICAgICAgICAgIGV4dHJ1ZGVkLFxuICAgICAgICAgIG9wYWNpdHksXG4gICAgICAgICAgY292ZXJhZ2UsXG4gICAgICAgICAgZWxldmF0aW9uU2NhbGVcbiAgICAgICAgfSxcbiAgICAgICAgbGlnaHRTZXR0aW5nc1xuICAgICAgKVxuICAgICk7XG4gIH1cblxuICBfZ2V0TW9kZWwoZ2wpIHtcbiAgICByZXR1cm4gbmV3IE1vZGVsKFxuICAgICAgZ2wsXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFNoYWRlcnMoKSwge1xuICAgICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgICAgZ2VvbWV0cnk6IHRoaXMuZ2V0Q3lsaW5kZXJHZW9tZXRyeSgxKSxcbiAgICAgICAgaXNJbnN0YW5jZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIHN1cGVyLmRyYXcoe3VuaWZvcm1zOiBPYmplY3QuYXNzaWduKHRoaXMudXBkYXRlUmFkaXVzQW5nbGUoKSwgdW5pZm9ybXMpfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q2VudHJvaWQsIGdldEVsZXZhdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IFtsb24sIGxhdF0gPSBnZXRDZW50cm9pZChvYmplY3QpO1xuICAgICAgY29uc3QgZWxldmF0aW9uID0gZ2V0RWxldmF0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBsb247XG4gICAgICB2YWx1ZVtpICsgMV0gPSBsYXQ7XG4gICAgICB2YWx1ZVtpICsgMl0gPSBlbGV2YXRpb24gfHwgMDtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldENlbnRyb2lkfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRDZW50cm9pZChvYmplY3QpO1xuICAgICAgdmFsdWVbaSsrXSA9IGZwNjRMb3dQYXJ0KHBvc2l0aW9uWzBdKTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0TG93UGFydChwb3NpdGlvblsxXSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihvYmplY3QpIHx8IERFRkFVTFRfQ09MT1I7XG5cbiAgICAgIHZhbHVlW2kgKyAwXSA9IGNvbG9yWzBdO1xuICAgICAgdmFsdWVbaSArIDFdID0gY29sb3JbMV07XG4gICAgICB2YWx1ZVtpICsgMl0gPSBjb2xvclsyXTtcbiAgICAgIHZhbHVlW2kgKyAzXSA9IE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IERFRkFVTFRfQ09MT1JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cbkhleGFnb25DZWxsTGF5ZXIubGF5ZXJOYW1lID0gJ0hleGFnb25DZWxsTGF5ZXInO1xuSGV4YWdvbkNlbGxMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=