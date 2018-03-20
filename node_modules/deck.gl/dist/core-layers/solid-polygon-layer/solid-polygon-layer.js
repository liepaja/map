'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _props2 = require('../../core/lifecycle/props');

var _polygonTesselator = require('./polygon-tesselator');

var _polygonTesselatorExtruded = require('./polygon-tesselator-extruded');

var _solidPolygonLayerVertex = require('./solid-polygon-layer-vertex.glsl');

var _solidPolygonLayerVertex2 = _interopRequireDefault(_solidPolygonLayerVertex);

var _solidPolygonLayerVertex3 = require('./solid-polygon-layer-vertex-64.glsl');

var _solidPolygonLayerVertex4 = _interopRequireDefault(_solidPolygonLayerVertex3);

var _solidPolygonLayerFragment = require('./solid-polygon-layer-fragment.glsl');

var _solidPolygonLayerFragment2 = _interopRequireDefault(_solidPolygonLayerFragment);

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

var enable64bitSupport = _core.experimental.enable64bitSupport,
    get = _core.experimental.get;

// Polygon geometry generation is managed by the polygon tesselator

var defaultProps = {
  // Whether to extrude
  extruded: false,
  // Whether to draw a GL.LINES wireframe of the polygon
  wireframe: false,
  fp64: false,

  // elevation multiplier
  elevationScale: 1,

  // Accessor for polygon geometry
  getPolygon: function getPolygon(f) {
    return get(f, 'polygon') || get(f, 'geometry.coordinates');
  },
  // Accessor for extrusion height
  getElevation: function getElevation(f) {
    return get(f, 'elevation') || get(f, 'properties.height') || 0;
  },
  // Accessor for color
  getColor: function getColor(f) {
    return get(f, 'color') || get(f, 'properties.color');
  },

  // Optional settings for 'lighting' shader module
  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.0, 5000],
    ambientRatio: 0.05,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [2.0, 0.0, 0.0, 0.0],
    numberOfLights: 2
  }
};

var SolidPolygonLayer = function (_Layer) {
  _inherits(SolidPolygonLayer, _Layer);

  function SolidPolygonLayer() {
    _classCallCheck(this, SolidPolygonLayer);

    return _possibleConstructorReturn(this, (SolidPolygonLayer.__proto__ || Object.getPrototypeOf(SolidPolygonLayer)).apply(this, arguments));
  }

  _createClass(SolidPolygonLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: _solidPolygonLayerVertex4.default, fs: _solidPolygonLayerFragment2.default, modules: ['project64', 'lighting', 'picking'] } : { vs: _solidPolygonLayerVertex2.default, fs: _solidPolygonLayerFragment2.default, modules: ['lighting', 'picking'] }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      this.setState({
        numInstances: 0,
        IndexType: gl.getExtension('OES_element_index_uint') ? Uint32Array : Uint16Array
      });

      var attributeManager = this.getAttributeManager();
      var noAlloc = true;
      /* eslint-disable max-len */
      attributeManager.add({
        indices: { size: 1, isIndexed: true, update: this.calculateIndices, noAlloc: noAlloc },
        positions: { size: 3, accessor: 'getElevation', update: this.calculatePositions, noAlloc: noAlloc },
        normals: { size: 3, update: this.calculateNormals, noAlloc: noAlloc },
        colors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          accessor: 'getColor',
          update: this.calculateColors,
          noAlloc: noAlloc
        },
        pickingColors: { size: 3, type: _luma.GL.UNSIGNED_BYTE, update: this.calculatePickingColors, noAlloc: noAlloc }
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
          attributeManager.add({
            positions64xyLow: { size: 2, update: this.calculatePositionsLow }
          });
        } else {
          attributeManager.remove(['positions64xyLow']);
        }
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;
      var _props = this.props,
          extruded = _props.extruded,
          lightSettings = _props.lightSettings,
          elevationScale = _props.elevationScale;


      this.state.model.render(Object.assign({}, uniforms, {
        extruded: extruded ? 1.0 : 0.0,
        elevationScale: elevationScale
      }, lightSettings));
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref3) {
      var props = _ref3.props,
          oldProps = _ref3.oldProps,
          changeFlags = _ref3.changeFlags;

      _get(SolidPolygonLayer.prototype.__proto__ || Object.getPrototypeOf(SolidPolygonLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var regenerateModel = this.updateGeometry({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      if (regenerateModel) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }

    /* eslint-disable complexity */

  }, {
    key: 'updateGeometry',
    value: function updateGeometry(_ref4) {
      var _this2 = this;

      var props = _ref4.props,
          oldProps = _ref4.oldProps,
          changeFlags = _ref4.changeFlags;

      var geometryConfigChanged = props.extruded !== oldProps.extruded || props.wireframe !== oldProps.wireframe || props.fp64 !== oldProps.fp64 || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

      // check if updateTriggers.getElevation has been triggered
      var getElevationTriggered = changeFlags.updateTriggersChanged && (0, _props2.compareProps)({
        oldProps: oldProps.updateTriggers.getElevation || {},
        newProps: props.updateTriggers.getElevation || {},
        triggerName: 'getElevation'
      });

      // When the geometry config  or the data is changed,
      // tessellator needs to be invoked
      if (changeFlags.dataChanged || geometryConfigChanged || getElevationTriggered) {
        var getPolygon = props.getPolygon,
            extruded = props.extruded,
            wireframe = props.wireframe,
            getElevation = props.getElevation;

        // TODO - avoid creating a temporary array here: let the tesselator iterate

        var polygons = props.data.map(getPolygon);

        this.setState({
          polygonTesselator: !extruded ? new _polygonTesselator.PolygonTesselator({ polygons: polygons, fp64: this.props.fp64 }) : new _polygonTesselatorExtruded.PolygonTesselatorExtruded({
            polygons: polygons,
            wireframe: wireframe,
            getHeight: function getHeight(polygonIndex) {
              return getElevation(_this2.props.data[polygonIndex]);
            },
            fp64: this.props.fp64
          })
        });

        this.state.attributeManager.invalidateAll();
      }

      return geometryConfigChanged;
    }
    /* eslint-disable complexity */

  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: this.props.wireframe ? _luma.GL.LINES : _luma.GL.TRIANGLES,
          attributes: {}
        }),
        vertexCount: 0,
        isIndexed: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      attribute.value = this.state.polygonTesselator.indices();
      attribute.target = _luma.GL.ELEMENT_ARRAY_BUFFER;
      this.state.model.setVertexCount(attribute.value.length / attribute.size);
    }
  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      attribute.value = this.state.polygonTesselator.positions().positions;
    }
  }, {
    key: 'calculatePositionsLow',
    value: function calculatePositionsLow(attribute) {
      attribute.value = this.state.polygonTesselator.positions().positions64xyLow;
    }
  }, {
    key: 'calculateNormals',
    value: function calculateNormals(attribute) {
      attribute.value = this.state.polygonTesselator.normals();
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _this3 = this;

      attribute.value = this.state.polygonTesselator.colors({
        getColor: function getColor(polygonIndex) {
          return _this3.props.getColor(_this3.props.data[polygonIndex]);
        }
      });
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      attribute.value = this.state.polygonTesselator.pickingColors();
    }
  }]);

  return SolidPolygonLayer;
}(_core.Layer);

exports.default = SolidPolygonLayer;


SolidPolygonLayer.layerName = 'SolidPolygonLayer';
SolidPolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZW5hYmxlNjRiaXRTdXBwb3J0IiwiZ2V0IiwiZGVmYXVsdFByb3BzIiwiZXh0cnVkZWQiLCJ3aXJlZnJhbWUiLCJmcDY0IiwiZWxldmF0aW9uU2NhbGUiLCJnZXRQb2x5Z29uIiwiZiIsImdldEVsZXZhdGlvbiIsImdldENvbG9yIiwibGlnaHRTZXR0aW5ncyIsImxpZ2h0c1Bvc2l0aW9uIiwiYW1iaWVudFJhdGlvIiwiZGlmZnVzZVJhdGlvIiwic3BlY3VsYXJSYXRpbyIsImxpZ2h0c1N0cmVuZ3RoIiwibnVtYmVyT2ZMaWdodHMiLCJTb2xpZFBvbHlnb25MYXllciIsInByb3BzIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm51bUluc3RhbmNlcyIsIkluZGV4VHlwZSIsImdldEV4dGVuc2lvbiIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwiZ2V0QXR0cmlidXRlTWFuYWdlciIsIm5vQWxsb2MiLCJhZGQiLCJpbmRpY2VzIiwic2l6ZSIsImlzSW5kZXhlZCIsInVwZGF0ZSIsImNhbGN1bGF0ZUluZGljZXMiLCJwb3NpdGlvbnMiLCJhY2Nlc3NvciIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsIm5vcm1hbHMiLCJjYWxjdWxhdGVOb3JtYWxzIiwiY29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVDb2xvcnMiLCJwaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwiY29vcmRpbmF0ZVN5c3RlbSIsIkxOR0xBVCIsInBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVQb3NpdGlvbnNMb3ciLCJyZW1vdmUiLCJ1bmlmb3JtcyIsInN0YXRlIiwibW9kZWwiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJyZWdlbmVyYXRlTW9kZWwiLCJ1cGRhdGVHZW9tZXRyeSIsIl9nZXRNb2RlbCIsInVwZGF0ZUF0dHJpYnV0ZSIsImdlb21ldHJ5Q29uZmlnQ2hhbmdlZCIsInVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCIsImFsbCIsImdldEVsZXZhdGlvblRyaWdnZXJlZCIsInVwZGF0ZVRyaWdnZXJzIiwibmV3UHJvcHMiLCJ0cmlnZ2VyTmFtZSIsImRhdGFDaGFuZ2VkIiwicG9seWdvbnMiLCJkYXRhIiwibWFwIiwicG9seWdvblRlc3NlbGF0b3IiLCJnZXRIZWlnaHQiLCJwb2x5Z29uSW5kZXgiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiTElORVMiLCJUUklBTkdMRVMiLCJhdHRyaWJ1dGVzIiwidmVydGV4Q291bnQiLCJzaGFkZXJDYWNoZSIsImF0dHJpYnV0ZSIsInZhbHVlIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJzZXRWZXJ0ZXhDb3VudCIsImxlbmd0aCIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQSxrQixzQkFBQUEsa0I7SUFBb0JDLEcsc0JBQUFBLEc7O0FBSTNCOztBQVFBLElBQU1DLGVBQWU7QUFDbkI7QUFDQUMsWUFBVSxLQUZTO0FBR25CO0FBQ0FDLGFBQVcsS0FKUTtBQUtuQkMsUUFBTSxLQUxhOztBQU9uQjtBQUNBQyxrQkFBZ0IsQ0FSRzs7QUFVbkI7QUFDQUMsY0FBWTtBQUFBLFdBQUtOLElBQUlPLENBQUosRUFBTyxTQUFQLEtBQXFCUCxJQUFJTyxD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QUtqQyxLQUFMLENBQVdvQixpQkFBWCxDQUE2QnhDLFNBQTdCLEdBQXlDQSxTQUEzRDtBQUNEOzs7MENBQ3FCb0QsUyxFQUFXO0FBQy9CQSxnQkFBVUMsS0FBVixHQUFrQixLQUFLakMsS0FBTCxDQUFXb0IsaUJBQVgsQ0FBNkJ4QyxTQUE3QixHQUF5Q2dCLGdCQUEzRDtBQUNEOzs7cUNBQ2dCb0MsUyxFQUFXO0FBQzFCQSxnQkFBVUMsS0FBVixHQUFrQixLQUFLakMsS0FBTCxDQUFXb0IsaUJBQVgsQ0FBNkJyQyxPQUE3QixFQUFsQjtBQUNEOzs7b0NBRWVpRCxTLEVBQVc7QUFBQTs7QUFDekJBLGdCQUFVQyxLQUFWLEdBQWtCLEtBQUtqQyxLQUFMLENBQVdvQixpQkFBWCxDQUE2Qm5DLE1BQTdCLENBQW9DO0FBQ3BEbkMsa0JBQVU7QUFBQSxpQkFBZ0IsT0FBS1MsS0FBTCxDQUFXVCxRQUFYLENBQW9CLE9BQUtTLEtBQUwsQ0FBVzJELElBQVgsQ0FBZ0JJLFlBQWhCLENBQXBCLENBQWhCO0FBQUE7QUFEMEMsT0FBcEMsQ0FBbEI7QUFHRDs7QUFFRDs7OzsyQ0FDdUJVLFMsRUFBVztBQUNoQ0EsZ0JBQVVDLEtBQVYsR0FBa0IsS0FBS2pDLEtBQUwsQ0FBV29CLGlCQUFYLENBQTZCL0IsYUFBN0IsRUFBbEI7QUFDRDs7Ozs7O2tCQWpLa0IvQixpQjs7O0FBb0tyQkEsa0JBQWtCZ0YsU0FBbEIsR0FBOEIsbUJBQTlCO0FBQ0FoRixrQkFBa0JoQixZQUFsQixHQUFpQ0EsWUFBakMiLCJmaWxlIjoic29saWQtcG9seWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNLCBMYXllciwgZXhwZXJpbWVudGFsfSBmcm9tICcuLi8uLi9jb3JlJztcbmNvbnN0IHtlbmFibGU2NGJpdFN1cHBvcnQsIGdldH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IHtjb21wYXJlUHJvcHN9IGZyb20gJy4uLy4uL2NvcmUvbGlmZWN5Y2xlL3Byb3BzJztcblxuLy8gUG9seWdvbiBnZW9tZXRyeSBnZW5lcmF0aW9uIGlzIG1hbmFnZWQgYnkgdGhlIHBvbHlnb24gdGVzc2VsYXRvclxuaW1wb3J0IHtQb2x5Z29uVGVzc2VsYXRvcn0gZnJvbSAnLi9wb2x5Z29uLXRlc3NlbGF0b3InO1xuaW1wb3J0IHtQb2x5Z29uVGVzc2VsYXRvckV4dHJ1ZGVkfSBmcm9tICcuL3BvbHlnb24tdGVzc2VsYXRvci1leHRydWRlZCc7XG5cbmltcG9ydCB2cyBmcm9tICcuL3NvbGlkLXBvbHlnb24tbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHZzNjQgZnJvbSAnLi9zb2xpZC1wb2x5Z29uLWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBmcyBmcm9tICcuL3NvbGlkLXBvbHlnb24tbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgLy8gV2hldGhlciB0byBleHRydWRlXG4gIGV4dHJ1ZGVkOiBmYWxzZSxcbiAgLy8gV2hldGhlciB0byBkcmF3IGEgR0wuTElORVMgd2lyZWZyYW1lIG9mIHRoZSBwb2x5Z29uXG4gIHdpcmVmcmFtZTogZmFsc2UsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIC8vIGVsZXZhdGlvbiBtdWx0aXBsaWVyXG4gIGVsZXZhdGlvblNjYWxlOiAxLFxuXG4gIC8vIEFjY2Vzc29yIGZvciBwb2x5Z29uIGdlb21ldHJ5XG4gIGdldFBvbHlnb246IGYgPT4gZ2V0KGYsICdwb2x5Z29uJykgfHwgZ2V0KGYsICdnZW9tZXRyeS5jb29yZGluYXRlcycpLFxuICAvLyBBY2Nlc3NvciBmb3IgZXh0cnVzaW9uIGhlaWdodFxuICBnZXRFbGV2YXRpb246IGYgPT4gZ2V0KGYsICdlbGV2YXRpb24nKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuaGVpZ2h0JykgfHwgMCxcbiAgLy8gQWNjZXNzb3IgZm9yIGNvbG9yXG4gIGdldENvbG9yOiBmID0+IGdldChmLCAnY29sb3InKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuY29sb3InKSxcblxuICAvLyBPcHRpb25hbCBzZXR0aW5ncyBmb3IgJ2xpZ2h0aW5nJyBzaGFkZXIgbW9kdWxlXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWy0xMjIuNDUsIDM3Ljc1LCA4MDAwLCAtMTIyLjAsIDM4LjAsIDUwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC4wNSxcbiAgICBkaWZmdXNlUmF0aW86IDAuNixcbiAgICBzcGVjdWxhclJhdGlvOiAwLjgsXG4gICAgbGlnaHRzU3RyZW5ndGg6IFsyLjAsIDAuMCwgMC4wLCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAyXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvbGlkUG9seWdvbkxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcylcbiAgICAgID8ge3ZzOiB2czY0LCBmcywgbW9kdWxlczogWydwcm9qZWN0NjQnLCAnbGlnaHRpbmcnLCAncGlja2luZyddfVxuICAgICAgOiB7dnMsIGZzLCBtb2R1bGVzOiBbJ2xpZ2h0aW5nJywgJ3BpY2tpbmcnXX07IC8vICdwcm9qZWN0JyBtb2R1bGUgYWRkZWQgYnkgZGVmYXVsdC5cbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbnVtSW5zdGFuY2VzOiAwLFxuICAgICAgSW5kZXhUeXBlOiBnbC5nZXRFeHRlbnNpb24oJ09FU19lbGVtZW50X2luZGV4X3VpbnQnKSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXlcbiAgICB9KTtcblxuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICBjb25zdCBub0FsbG9jID0gdHJ1ZTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGQoe1xuICAgICAgaW5kaWNlczoge3NpemU6IDEsIGlzSW5kZXhlZDogdHJ1ZSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluZGljZXMsIG5vQWxsb2N9LFxuICAgICAgcG9zaXRpb25zOiB7c2l6ZTogMywgYWNjZXNzb3I6ICdnZXRFbGV2YXRpb24nLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zLCBub0FsbG9jfSxcbiAgICAgIG5vcm1hbHM6IHtzaXplOiAzLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlTm9ybWFscywgbm9BbGxvY30sXG4gICAgICBjb2xvcnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVDb2xvcnMsXG4gICAgICAgIG5vQWxsb2NcbiAgICAgIH0sXG4gICAgICBwaWNraW5nQ29sb3JzOiB7c2l6ZTogMywgdHlwZTogR0wuVU5TSUdORURfQllURSwgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMsIG5vQWxsb2N9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAocHJvcHMuZnA2NCAmJiBwcm9wcy5jb29yZGluYXRlU3lzdGVtID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdMQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGQoe1xuICAgICAgICAgIHBvc2l0aW9uczY0eHlMb3c6IHtzaXplOiAyLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zTG93fVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFsncG9zaXRpb25zNjR4eUxvdyddKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBjb25zdCB7ZXh0cnVkZWQsIGxpZ2h0U2V0dGluZ3MsIGVsZXZhdGlvblNjYWxlfSA9IHRoaXMucHJvcHM7XG5cbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcihcbiAgICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICB1bmlmb3JtcyxcbiAgICAgICAge1xuICAgICAgICAgIGV4dHJ1ZGVkOiBleHRydWRlZCA/IDEuMCA6IDAuMCxcbiAgICAgICAgICBlbGV2YXRpb25TY2FsZVxuICAgICAgICB9LFxuICAgICAgICBsaWdodFNldHRpbmdzXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBjb25zdCByZWdlbmVyYXRlTW9kZWwgPSB0aGlzLnVwZGF0ZUdlb21ldHJ5KHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBpZiAocmVnZW5lcmF0ZU1vZGVsKSB7XG4gICAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAqL1xuICB1cGRhdGVHZW9tZXRyeSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBjb25zdCBnZW9tZXRyeUNvbmZpZ0NoYW5nZWQgPVxuICAgICAgcHJvcHMuZXh0cnVkZWQgIT09IG9sZFByb3BzLmV4dHJ1ZGVkIHx8XG4gICAgICBwcm9wcy53aXJlZnJhbWUgIT09IG9sZFByb3BzLndpcmVmcmFtZSB8fFxuICAgICAgcHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCB8fFxuICAgICAgKGNoYW5nZUZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCAmJlxuICAgICAgICAoY2hhbmdlRmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkLmFsbCB8fCBjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQuZ2V0UG9seWdvbikpO1xuXG4gICAgLy8gY2hlY2sgaWYgdXBkYXRlVHJpZ2dlcnMuZ2V0RWxldmF0aW9uIGhhcyBiZWVuIHRyaWdnZXJlZFxuICAgIGNvbnN0IGdldEVsZXZhdGlvblRyaWdnZXJlZCA9XG4gICAgICBjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgJiZcbiAgICAgIGNvbXBhcmVQcm9wcyh7XG4gICAgICAgIG9sZFByb3BzOiBvbGRQcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24gfHwge30sXG4gICAgICAgIG5ld1Byb3BzOiBwcm9wcy51cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24gfHwge30sXG4gICAgICAgIHRyaWdnZXJOYW1lOiAnZ2V0RWxldmF0aW9uJ1xuICAgICAgfSk7XG5cbiAgICAvLyBXaGVuIHRoZSBnZW9tZXRyeSBjb25maWcgIG9yIHRoZSBkYXRhIGlzIGNoYW5nZWQsXG4gICAgLy8gdGVzc2VsbGF0b3IgbmVlZHMgdG8gYmUgaW52b2tlZFxuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCB8fCBnZW9tZXRyeUNvbmZpZ0NoYW5nZWQgfHwgZ2V0RWxldmF0aW9uVHJpZ2dlcmVkKSB7XG4gICAgICBjb25zdCB7Z2V0UG9seWdvbiwgZXh0cnVkZWQsIHdpcmVmcmFtZSwgZ2V0RWxldmF0aW9ufSA9IHByb3BzO1xuXG4gICAgICAvLyBUT0RPIC0gYXZvaWQgY3JlYXRpbmcgYSB0ZW1wb3JhcnkgYXJyYXkgaGVyZTogbGV0IHRoZSB0ZXNzZWxhdG9yIGl0ZXJhdGVcbiAgICAgIGNvbnN0IHBvbHlnb25zID0gcHJvcHMuZGF0YS5tYXAoZ2V0UG9seWdvbik7XG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwb2x5Z29uVGVzc2VsYXRvcjogIWV4dHJ1ZGVkXG4gICAgICAgICAgPyBuZXcgUG9seWdvblRlc3NlbGF0b3Ioe3BvbHlnb25zLCBmcDY0OiB0aGlzLnByb3BzLmZwNjR9KVxuICAgICAgICAgIDogbmV3IFBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQoe1xuICAgICAgICAgICAgICBwb2x5Z29ucyxcbiAgICAgICAgICAgICAgd2lyZWZyYW1lLFxuICAgICAgICAgICAgICBnZXRIZWlnaHQ6IHBvbHlnb25JbmRleCA9PiBnZXRFbGV2YXRpb24odGhpcy5wcm9wcy5kYXRhW3BvbHlnb25JbmRleF0pLFxuICAgICAgICAgICAgICBmcDY0OiB0aGlzLnByb3BzLmZwNjRcbiAgICAgICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2VvbWV0cnlDb25maWdDaGFuZ2VkO1xuICB9XG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cblxuICBfZ2V0TW9kZWwoZ2wpIHtcbiAgICByZXR1cm4gbmV3IE1vZGVsKFxuICAgICAgZ2wsXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFNoYWRlcnMoKSwge1xuICAgICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgICAgZHJhd01vZGU6IHRoaXMucHJvcHMud2lyZWZyYW1lID8gR0wuTElORVMgOiBHTC5UUklBTkdMRVMsXG4gICAgICAgICAgYXR0cmlidXRlczoge31cbiAgICAgICAgfSksXG4gICAgICAgIHZlcnRleENvdW50OiAwLFxuICAgICAgICBpc0luZGV4ZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluZGljZXMoYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5pbmRpY2VzKCk7XG4gICAgYXR0cmlidXRlLnRhcmdldCA9IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSO1xuICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0VmVydGV4Q291bnQoYXR0cmlidXRlLnZhbHVlLmxlbmd0aCAvIGF0dHJpYnV0ZS5zaXplKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLnBvc2l0aW9ucygpLnBvc2l0aW9ucztcbiAgfVxuICBjYWxjdWxhdGVQb3NpdGlvbnNMb3coYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5wb3NpdGlvbnMoKS5wb3NpdGlvbnM2NHh5TG93O1xuICB9XG4gIGNhbGN1bGF0ZU5vcm1hbHMoYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5ub3JtYWxzKCk7XG4gIH1cblxuICBjYWxjdWxhdGVDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5jb2xvcnMoe1xuICAgICAgZ2V0Q29sb3I6IHBvbHlnb25JbmRleCA9PiB0aGlzLnByb3BzLmdldENvbG9yKHRoaXMucHJvcHMuZGF0YVtwb2x5Z29uSW5kZXhdKVxuICAgIH0pO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgdGhlIGRlZmF1bHQgcGlja2luZyBjb2xvcnMgY2FsY3VsYXRpb25cbiAgY2FsY3VsYXRlUGlja2luZ0NvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLnBpY2tpbmdDb2xvcnMoKTtcbiAgfVxufVxuXG5Tb2xpZFBvbHlnb25MYXllci5sYXllck5hbWUgPSAnU29saWRQb2x5Z29uTGF5ZXInO1xuU29saWRQb2x5Z29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19