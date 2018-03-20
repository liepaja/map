'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _deck = require('deck.gl');

var _luma = require('luma.gl');

var _polygonTesselator = require('./polygon-tesselator');

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

var enable64bitSupport = _deck.experimental.enable64bitSupport,
    get = _deck.experimental.get;

// Polygon geometry generation is managed by the polygon tesselator

var defaultLineColor = [0x0, 0x0, 0x0, 0xff];
var defaultFillColor = [0x0, 0x0, 0x0, 0xff];

var defaultProps = {
  filled: true,
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
  // Accessor for colors
  getFillColor: function getFillColor(f) {
    return get(f, 'fillColor') || get(f, 'properties.color') || defaultFillColor;
  },
  getLineColor: function getLineColor(f) {
    return get(f, 'lineColor') || get(f, 'properties.color') || defaultLineColor;
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

// Side model attributes
var SIDE_FILL_POSITIONS = new Float32Array([
// top left corner
0, 1,
// bottom left corner
0, 0,
// top right corner
1, 1,
// bottom right corner
1, 0]);
var SIDE_WIRE_POSITIONS = new Float32Array([
// top right corner
1, 1,
// top left corner
0, 1,
// bottom left corner
0, 0,
// bottom right corner
1, 0]);

// Model types
var ATTRIBUTE_MAPS = {
  TOP: {
    indices: { instanced: 0 },
    positions: { instanced: 0 },
    positions64xyLow: { instanced: 0 },
    elevations: { instanced: 0 },
    fillColors: { name: 'colors', instanced: 0 },
    pickingColors: { instanced: 0 }
  },
  SIDE: {
    positions: { instanced: 1 },
    positions64xyLow: { instanced: 1 },
    nextPositions: { instanced: 1 },
    nextPositions64xyLow: { instanced: 1 },
    elevations: { instanced: 1 },
    fillColors: { name: 'colors', instanced: 1 },
    pickingColors: { instanced: 1 }
  },
  WIRE: {
    positions: { instanced: 1 },
    positions64xyLow: { instanced: 1 },
    nextPositions: { instanced: 1 },
    nextPositions64xyLow: { instanced: 1 },
    elevations: { instanced: 1 },
    lineColors: { name: 'colors', instanced: 1 },
    pickingColors: { instanced: 1 }
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
        positions: {
          size: 3,
          accessor: ['extruded', 'fp64'],
          update: this.calculatePositions,
          noAlloc: noAlloc
        },
        nextPositions: {
          size: 3,
          accessor: ['extruded', 'fp64'],
          update: this.calculateNextPositions,
          noAlloc: noAlloc
        },
        elevations: {
          size: 1,
          accessor: ['extruded', 'getElevation'],
          update: this.calculateElevations,
          noAlloc: noAlloc
        },
        fillColors: {
          alias: 'colors',
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          accessor: 'getFillColor',
          update: this.calculateFillColors,
          noAlloc: noAlloc
        },
        lineColors: {
          alias: 'colors',
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          accessor: 'getLineColor',
          update: this.calculateLineColors,
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
          oldProps = _ref.oldProps;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.getAttributeManager();

        if (props.fp64 && props.coordinateSystem === _deck.COORDINATE_SYSTEM.LNGLAT) {
          /* eslint-disable max-len */
          attributeManager.add({
            positions64xyLow: { size: 2, accessor: 'fp64', update: this.calculatePositionsLow },
            nextPositions64xyLow: { size: 2, accessor: 'fp64', update: this.calculateNextPositionsLow }
          });
          /* eslint-enable max-len */
        } else {
          attributeManager.remove(['positions64xyLow', 'nextPositions64xyLow']);
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


      var renderUniforms = Object.assign({}, uniforms, {
        extruded: extruded ? 1.0 : 0.0,
        elevationScale: elevationScale
      }, lightSettings);

      this.state.models.forEach(function (model) {
        model.render(renderUniforms);
      });
    }
  }, {
    key: 'updateState',
    value: function updateState(updateParams) {
      _get(SolidPolygonLayer.prototype.__proto__ || Object.getPrototypeOf(SolidPolygonLayer.prototype), 'updateState', this).call(this, updateParams);

      this.updateGeometry(updateParams);
      this.updateAttribute(updateParams);

      var props = updateParams.props,
          oldProps = updateParams.oldProps;


      var regenerateModels = props.fp64 !== oldProps.fp64 || props.filled !== oldProps.filled || props.extruded !== oldProps.extruded || props.wireframe !== oldProps.wireframe;

      if (regenerateModels) {
        this.setState(Object.assign({
          // Set a flag to set attributes to new models
          modelsChanged: true
        }, this._getModels(this.context.gl)));
      }

      if (props.extruded !== oldProps.extruded) {
        this.state.attributeManager.invalidate('extruded');
      }
      if (props.fp64 !== oldProps.fp64) {
        this.state.attributeManager.invalidate('fp64');
      }
    }
  }, {
    key: 'updateGeometry',
    value: function updateGeometry(_ref3) {
      var props = _ref3.props,
          oldProps = _ref3.oldProps,
          changeFlags = _ref3.changeFlags;

      var geometryConfigChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

      // When the geometry config  or the data is changed,
      // tessellator needs to be invoked
      if (geometryConfigChanged) {
        // TODO - avoid creating a temporary array here: let the tesselator iterate
        var polygons = props.data.map(props.getPolygon);

        this.setState({
          polygonTesselator: new _polygonTesselator.PolygonTesselator({ polygons: polygons, IndexType: this.state.IndexType })
        });

        this.state.attributeManager.invalidateAll();
      }

      if (geometryConfigChanged || props.extruded !== oldProps.extruded || props.fp64 !== oldProps.fp64) {
        this.state.polygonTesselator.updatePositions({
          fp64: props.fp64,
          extruded: props.extruded
        });
      }
    }
  }, {
    key: 'updateAttributes',
    value: function updateAttributes(props) {
      var _state = this.state,
          attributeManager = _state.attributeManager,
          modelsChanged = _state.modelsChanged;

      // Figure out data length

      attributeManager.update({
        data: props.data,
        numInstances: 0,
        props: props,
        buffers: props,
        context: this,
        // Don't worry about non-attribute props
        ignoreUnknownAttributes: true
      });

      if (modelsChanged) {
        this._updateAttributes(attributeManager.attributes);
        // clear the flag
        this.setState({ modelsChanged: false });
      } else {
        var changedAttributes = attributeManager.getChangedAttributes({ clearChangedFlags: true });
        this._updateAttributes(changedAttributes);
      }
    }
  }, {
    key: '_updateAttributes',
    value: function _updateAttributes(attributes) {
      var modelsByName = this.state.modelsByName;


      for (var modelName in modelsByName) {
        var model = modelsByName[modelName];

        if (modelName === 'TOP') {
          model.setVertexCount(this.state.numVertex);
        } else {
          model.setInstanceCount(this.state.numInstances);
        }

        var attributeMap = ATTRIBUTE_MAPS[modelName];
        var newAttributes = {};
        for (var attributeName in attributes) {
          var attribute = attributes[attributeName];
          var attributeOverride = attributeMap[attributeName];

          if (attributeOverride) {
            var newAttribute = Object.assign({}, attribute, attributeOverride);
            newAttributes[attributeOverride.name || attributeName] = newAttribute;
          }
        }
        model.setAttributes(newAttributes);
      }
    }
  }, {
    key: '_getModels',
    value: function _getModels(gl) {
      var _props2 = this.props,
          id = _props2.id,
          filled = _props2.filled,
          extruded = _props2.extruded,
          wireframe = _props2.wireframe;


      var models = {};

      if (filled) {
        models.TOP = new _luma.Model(gl, Object.assign({}, this.getShaders(), {
          id: id + '-top',
          geometry: new _luma.Geometry({
            drawMode: _luma.GL.TRIANGLES,
            attributes: {
              vertexPositions: { size: 2, isGeneric: true, value: new Float32Array([0, 1]) },
              nextPositions: { size: 3, isGeneric: true, value: new Float32Array(3) },
              nextPositions64xyLow: { size: 2, isGeneric: true, value: new Float32Array(2) }
            }
          }),
          uniforms: {
            isSideVertex: 0
          },
          vertexCount: 0,
          isIndexed: true,
          shaderCache: this.context.shaderCache
        }));
      }
      if (filled && extruded) {
        models.SIDE = new _luma.Model(gl, Object.assign({}, this.getShaders(), {
          id: id + '-side',
          geometry: new _luma.Geometry({
            drawMode: _luma.GL.TRIANGLE_STRIP,
            vertexCount: 4,
            attributes: {
              vertexPositions: { size: 2, value: SIDE_FILL_POSITIONS }
            }
          }),
          uniforms: {
            isSideVertex: 1
          },
          isInstanced: 1,
          shaderCache: this.context.shaderCache
        }));
      }
      if (extruded && wireframe) {
        models.WIRE = new _luma.Model(gl, Object.assign({}, this.getShaders(), {
          id: id + '-wire',
          geometry: new _luma.Geometry({
            drawMode: _luma.GL.LINE_STRIP,
            vertexCount: 4,
            attributes: {
              vertexPositions: { size: 2, value: SIDE_WIRE_POSITIONS }
            }
          }),
          uniforms: {
            isSideVertex: 1
          },
          isInstanced: 1,
          shaderCache: this.context.shaderCache
        }));
      }

      return {
        models: [models.WIRE, models.SIDE, models.TOP].filter(Boolean),
        modelsByName: models
      };
    }
  }, {
    key: 'calculateIndices',
    value: function calculateIndices(attribute) {
      attribute.value = this.state.polygonTesselator.indices();
      attribute.target = _luma.GL.ELEMENT_ARRAY_BUFFER;
      var numVertex = attribute.value.length / attribute.size;
      this.setState({ numVertex: numVertex });
    }
  }, {
    key: 'calculatePositions',
    value: function calculatePositions(attribute) {
      attribute.value = this.state.polygonTesselator.positions();
      var numInstances = attribute.value.length / attribute.size;
      this.setState({ numInstances: numInstances });
    }
  }, {
    key: 'calculatePositionsLow',
    value: function calculatePositionsLow(attribute) {
      attribute.value = this.state.polygonTesselator.positions64xyLow();
    }
  }, {
    key: 'calculateNextPositions',
    value: function calculateNextPositions(attribute) {
      attribute.value = this.state.polygonTesselator.nextPositions();
    }
  }, {
    key: 'calculateNextPositionsLow',
    value: function calculateNextPositionsLow(attribute) {
      attribute.value = this.state.polygonTesselator.nextPositions64xyLow();
    }
  }, {
    key: 'calculateElevations',
    value: function calculateElevations(attribute) {
      var _this2 = this;

      if (this.props.extruded) {
        attribute.isGeneric = false;
        attribute.value = this.state.polygonTesselator.elevations({
          getElevation: function getElevation(polygonIndex) {
            return _this2.props.getElevation(_this2.props.data[polygonIndex]);
          }
        });
      } else {
        attribute.isGeneric = true;
        attribute.value = new Float32Array(1);
      }
    }
  }, {
    key: 'calculateFillColors',
    value: function calculateFillColors(attribute) {
      var _this3 = this;

      attribute.value = this.state.polygonTesselator.colors({
        key: 'fillColors',
        getColor: function getColor(polygonIndex) {
          return _this3.props.getFillColor(_this3.props.data[polygonIndex]);
        }
      });
    }
  }, {
    key: 'calculateLineColors',
    value: function calculateLineColors(attribute) {
      var _this4 = this;

      attribute.value = this.state.polygonTesselator.colors({
        key: 'lineColors',
        getColor: function getColor(polygonIndex) {
          return _this4.props.getLineColor(_this4.props.data[polygonIndex]);
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
}(_deck.Layer);

exports.default = SolidPolygonLayer;


SolidPolygonLayer.layerName = 'SolidPolygonLayer';
SolidPolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwtbGF5ZXJzL3NyYy9zb2xpZC1wb2x5Z29uLWxheWVyL3NvbGlkLXBvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZW5hYmxlNjRiaXRTdXBwb3J0IiwiZ2V0IiwiZGVmYXVsdExpbmVDb2xvciIsImRlZmF1bHRGaWxsQ29sb3IiLCJkZWZhdWx0UHJvcHMiLCJmaWxsZWQiLCJleHRydWRlZCIsIndpcmVmcmFtZSIsImZwNjQiLCJlbGV2YXRpb25TY2FsZSIsImdldFBvbHlnb24iLCJmIiwiZ2V0RWxldmF0aW9uIiwiZ2V0RmlsbENvbG9yIiwiZ2V0TGluZUNvbG9yIiwibGlnaHRTZXR0aW5ncyIsImxpZ2h0c1Bvc2l0aW9uIiwiYW1iaWVudFJhdGlvIiwiZGlmZnVzZVJhdGlvIiwic3BlY3VsYXJSYXRpbyIsImxpZ2h0c1N0cmVuZ3RoIiwibnVtYmVyT2ZMaWdodHMiLCJTSURFX0ZJTExfUE9TSVRJT05TIiwiRmxvYXQzMkFycmF5IiwiU0lERV9XSVJFX1BPU0lUSU9OUyIsIkFUVFJJQlVURV9NQVBTIiwiVE9QIiwiaW5kaWNlcyIsImluc3RhbmNlZCIsInBvc2l0aW9ucyIsInBvc2l0aW9uczY0eHlMb3ciLCJlbGV2YXRpb25zIiwiZmlsbENvbG9ycyIsIm5hbWUiLCJwaWNraW5nQ29sb3JzIiwiU0lERSIsIm5leHRQb3NpdGlvbnMiLCJuZXh0UG9zaXRpb25zNjR4eUxvdyIsIldJUkUiLCJsaW5lQ29sb3JzIiwiU29saWRQb2x5Z29uTGF5ZXIiLCJwcm9wcyIsInZzIiwiZnMiLCJtb2R1bGVzIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJudW1JbnN0YW5jZXMiLCJJbmRleFR5cGUiLCJnZXRFeHRlbnNpb24iLCJVaW50MzJBcnJheSIsIlVpbnQxNkFycmF5IiwiYXR0cmlidXRlTWFuYWdlciIsImdldEF0dHJpYnV0ZU1hbmFnZXIiLCJub0FsbG9jIiwiYWRkIiwic2l6ZSIsImlzSW5kZXhlZCIsInVwZGF0ZSIsImNhbGN1bGF0ZUluZGljZXMiLCJhY2Nlc3NvciIsImNhbGN1bGF0ZVBvc2l0aW9ucyIsImNhbGN1bGF0ZU5leHRQb3NpdGlvbnMiLCJjYWxjdWxhdGVFbGV2YXRpb25zIiwiYWxpYXMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUZpbGxDb2xvcnMiLCJjYWxjdWxhdGVMaW5lQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsIm9sZFByb3BzIiwiY29vcmRpbmF0ZVN5c3RlbSIsIkxOR0xBVCIsImNhbGN1bGF0ZVBvc2l0aW9uc0xvdyIsImNhbGN1bGF0ZU5leHRQb3NpdGlvbnNMb3ciLCJyZW1vdmUiLCJ1bmlmb3JtcyIsInJlbmRlclVuaWZvcm1zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RhdGUiLCJtb2RlbHMiLCJmb3JFYWNoIiwibW9kZWwiLCJyZW5kZXIiLCJ1cGRhdGVQYXJhbXMiLCJ1cGRhdGVHZW9tZXRyeSIsInVwZGF0ZUF0dHJpYnV0ZSIsInJlZ2VuZXJhdGVNb2RlbHMiLCJtb2RlbHNDaGFuZ2VkIiwiX2dldE1vZGVscyIsImludmFsaWRhdGUiLCJjaGFuZ2VGbGFncyIsImdlb21ldHJ5Q29uZmlnQ2hhbmdlZCIsImRhdGFDaGFuZ2VkIiwidXBkYXRlVHJpZ2dlcnNDaGFuZ2VkIiwiYWxsIiwicG9seWdvbnMiLCJkYXRhIiwibWFwIiwicG9seWdvblRlc3NlbGF0b3IiLCJpbnZhbGlkYXRlQWxsIiwidXBkYXRlUG9zaXRpb25zIiwiYnVmZmVycyIsImlnbm9yZVVua25vd25BdHRyaWJ1dGVzIiwiX3VwZGF0ZUF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVzIiwiY2hhbmdlZEF0dHJpYnV0ZXMiLCJnZXRDaGFuZ2VkQXR0cmlidXRlcyIsImNsZWFyQ2hhbmdlZEZsYWdzIiwibW9kZWxzQnlOYW1lIiwibW9kZWxOYW1lIiwic2V0VmVydGV4Q291bnQiLCJudW1WZXJ0ZXgiLCJzZXRJbnN0YW5jZUNvdW50IiwiYXR0cmlidXRlTWFwIiwibmV3QXR0cmlidXRlcyIsImF0dHJpYnV0ZU5hbWUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVPdmVycmlkZSIsIm5ld0F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZXMiLCJpZCIsImdldFNoYWRlcnMiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVTIiwidmVydGV4UG9zaXRpb25zIiwiaXNHZW5lcmljIiwidmFsdWUiLCJpc1NpZGVWZXJ0ZXgiLCJ2ZXJ0ZXhDb3VudCIsInNoYWRlckNhY2hlIiwiVFJJQU5HTEVfU1RSSVAiLCJpc0luc3RhbmNlZCIsIkxJTkVfU1RSSVAiLCJmaWx0ZXIiLCJCb29sZWFuIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJsZW5ndGgiLCJwb2x5Z29uSW5kZXgiLCJjb2xvcnMiLCJrZXkiLCJnZXRDb2xvciIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFFQTs7QUFHQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQSxrQixzQkFBQUEsa0I7SUFBb0JDLEcsc0JBQUFBLEc7O0FBRzNCOztBQU9BLElBQU1DLG1CQUFtQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixJQUFoQixDQUF6QjtBQUNBLElBQU1DLG1CQUFtQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixJQUFoQixDQUF6Qjs7QUFFQSxJQUFNQyxlQUFlO0FBQ25CQyxVQUFRLElBRFc7QUFFbkI7QUFDQUMsWUFBVSxLQUhTO0FBSW5CO0FBQ0FDLGFBQVcsS0FMUTtBQU1uQkMsUUFBTSxLQU5hOztBQVFuQjtBQUNBQyxrQkFBZ0IsQ0FURzs7QUFXbkI7QUFDQUMsY0FBWTtBQUFBLFdBQUtULElBQUlVLENBQUosRUFBTyxTQUFQLEtBQXFCVixJ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MkIsS0FBTCxDQUFXMEQsSUFBWCxDQUFnQjJDLFlBQWhCLENBQXhCLENBQWhCO0FBQUE7QUFGMEMsT0FBcEMsQ0FBbEI7QUFJRDs7QUFFRDs7OzsyQ0FDdUJ2QixTLEVBQVc7QUFDaENBLGdCQUFVVyxLQUFWLEdBQWtCLEtBQUtqRCxLQUFMLENBQVdvQixpQkFBWCxDQUE2Qm5FLGFBQTdCLEVBQWxCO0FBQ0Q7Ozs7OztrQkE5VWtCTSxpQjs7O0FBaVZyQkEsa0JBQWtCMEcsU0FBbEIsR0FBOEIsbUJBQTlCO0FBQ0ExRyxrQkFBa0JwQyxZQUFsQixHQUFpQ0EsWUFBakMiLCJmaWxlIjoic29saWQtcG9seWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNLCBMYXllciwgZXhwZXJpbWVudGFsfSBmcm9tICdkZWNrLmdsJztcbmNvbnN0IHtlbmFibGU2NGJpdFN1cHBvcnQsIGdldH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuXG4vLyBQb2x5Z29uIGdlb21ldHJ5IGdlbmVyYXRpb24gaXMgbWFuYWdlZCBieSB0aGUgcG9seWdvbiB0ZXNzZWxhdG9yXG5pbXBvcnQge1BvbHlnb25UZXNzZWxhdG9yfSBmcm9tICcuL3BvbHlnb24tdGVzc2VsYXRvcic7XG5cbmltcG9ydCB2cyBmcm9tICcuL3NvbGlkLXBvbHlnb24tbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHZzNjQgZnJvbSAnLi9zb2xpZC1wb2x5Z29uLWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBmcyBmcm9tICcuL3NvbGlkLXBvbHlnb24tbGF5ZXItZnJhZ21lbnQuZ2xzbCc7XG5cbmNvbnN0IGRlZmF1bHRMaW5lQ29sb3IgPSBbMHgwLCAweDAsIDB4MCwgMHhmZl07XG5jb25zdCBkZWZhdWx0RmlsbENvbG9yID0gWzB4MCwgMHgwLCAweDAsIDB4ZmZdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGZpbGxlZDogdHJ1ZSxcbiAgLy8gV2hldGhlciB0byBleHRydWRlXG4gIGV4dHJ1ZGVkOiBmYWxzZSxcbiAgLy8gV2hldGhlciB0byBkcmF3IGEgR0wuTElORVMgd2lyZWZyYW1lIG9mIHRoZSBwb2x5Z29uXG4gIHdpcmVmcmFtZTogZmFsc2UsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIC8vIGVsZXZhdGlvbiBtdWx0aXBsaWVyXG4gIGVsZXZhdGlvblNjYWxlOiAxLFxuXG4gIC8vIEFjY2Vzc29yIGZvciBwb2x5Z29uIGdlb21ldHJ5XG4gIGdldFBvbHlnb246IGYgPT4gZ2V0KGYsICdwb2x5Z29uJykgfHwgZ2V0KGYsICdnZW9tZXRyeS5jb29yZGluYXRlcycpLFxuICAvLyBBY2Nlc3NvciBmb3IgZXh0cnVzaW9uIGhlaWdodFxuICBnZXRFbGV2YXRpb246IGYgPT4gZ2V0KGYsICdlbGV2YXRpb24nKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuaGVpZ2h0JykgfHwgMCxcbiAgLy8gQWNjZXNzb3IgZm9yIGNvbG9yc1xuICBnZXRGaWxsQ29sb3I6IGYgPT4gZ2V0KGYsICdmaWxsQ29sb3InKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuY29sb3InKSB8fCBkZWZhdWx0RmlsbENvbG9yLFxuICBnZXRMaW5lQ29sb3I6IGYgPT4gZ2V0KGYsICdsaW5lQ29sb3InKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuY29sb3InKSB8fCBkZWZhdWx0TGluZUNvbG9yLFxuXG4gIC8vIE9wdGlvbmFsIHNldHRpbmdzIGZvciAnbGlnaHRpbmcnIHNoYWRlciBtb2R1bGVcbiAgbGlnaHRTZXR0aW5nczoge1xuICAgIGxpZ2h0c1Bvc2l0aW9uOiBbLTEyMi40NSwgMzcuNzUsIDgwMDAsIC0xMjIuMCwgMzguMCwgNTAwMF0sXG4gICAgYW1iaWVudFJhdGlvOiAwLjA1LFxuICAgIGRpZmZ1c2VSYXRpbzogMC42LFxuICAgIHNwZWN1bGFyUmF0aW86IDAuOCxcbiAgICBsaWdodHNTdHJlbmd0aDogWzIuMCwgMC4wLCAwLjAsIDAuMF0sXG4gICAgbnVtYmVyT2ZMaWdodHM6IDJcbiAgfVxufTtcblxuLy8gU2lkZSBtb2RlbCBhdHRyaWJ1dGVzXG5jb25zdCBTSURFX0ZJTExfUE9TSVRJT05TID0gbmV3IEZsb2F0MzJBcnJheShbXG4gIC8vIHRvcCBsZWZ0IGNvcm5lclxuICAwLFxuICAxLFxuICAvLyBib3R0b20gbGVmdCBjb3JuZXJcbiAgMCxcbiAgMCxcbiAgLy8gdG9wIHJpZ2h0IGNvcm5lclxuICAxLFxuICAxLFxuICAvLyBib3R0b20gcmlnaHQgY29ybmVyXG4gIDEsXG4gIDBcbl0pO1xuY29uc3QgU0lERV9XSVJFX1BPU0lUSU9OUyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAvLyB0b3AgcmlnaHQgY29ybmVyXG4gIDEsXG4gIDEsXG4gIC8vIHRvcCBsZWZ0IGNvcm5lclxuICAwLFxuICAxLFxuICAvLyBib3R0b20gbGVmdCBjb3JuZXJcbiAgMCxcbiAgMCxcbiAgLy8gYm90dG9tIHJpZ2h0IGNvcm5lclxuICAxLFxuICAwXG5dKTtcblxuLy8gTW9kZWwgdHlwZXNcbmNvbnN0IEFUVFJJQlVURV9NQVBTID0ge1xuICBUT1A6IHtcbiAgICBpbmRpY2VzOiB7aW5zdGFuY2VkOiAwfSxcbiAgICBwb3NpdGlvbnM6IHtpbnN0YW5jZWQ6IDB9LFxuICAgIHBvc2l0aW9uczY0eHlMb3c6IHtpbnN0YW5jZWQ6IDB9LFxuICAgIGVsZXZhdGlvbnM6IHtpbnN0YW5jZWQ6IDB9LFxuICAgIGZpbGxDb2xvcnM6IHtuYW1lOiAnY29sb3JzJywgaW5zdGFuY2VkOiAwfSxcbiAgICBwaWNraW5nQ29sb3JzOiB7aW5zdGFuY2VkOiAwfVxuICB9LFxuICBTSURFOiB7XG4gICAgcG9zaXRpb25zOiB7aW5zdGFuY2VkOiAxfSxcbiAgICBwb3NpdGlvbnM2NHh5TG93OiB7aW5zdGFuY2VkOiAxfSxcbiAgICBuZXh0UG9zaXRpb25zOiB7aW5zdGFuY2VkOiAxfSxcbiAgICBuZXh0UG9zaXRpb25zNjR4eUxvdzoge2luc3RhbmNlZDogMX0sXG4gICAgZWxldmF0aW9uczoge2luc3RhbmNlZDogMX0sXG4gICAgZmlsbENvbG9yczoge25hbWU6ICdjb2xvcnMnLCBpbnN0YW5jZWQ6IDF9LFxuICAgIHBpY2tpbmdDb2xvcnM6IHtpbnN0YW5jZWQ6IDF9XG4gIH0sXG4gIFdJUkU6IHtcbiAgICBwb3NpdGlvbnM6IHtpbnN0YW5jZWQ6IDF9LFxuICAgIHBvc2l0aW9uczY0eHlMb3c6IHtpbnN0YW5jZWQ6IDF9LFxuICAgIG5leHRQb3NpdGlvbnM6IHtpbnN0YW5jZWQ6IDF9LFxuICAgIG5leHRQb3NpdGlvbnM2NHh5TG93OiB7aW5zdGFuY2VkOiAxfSxcbiAgICBlbGV2YXRpb25zOiB7aW5zdGFuY2VkOiAxfSxcbiAgICBsaW5lQ29sb3JzOiB7bmFtZTogJ2NvbG9ycycsIGluc3RhbmNlZDogMX0sXG4gICAgcGlja2luZ0NvbG9yczoge2luc3RhbmNlZDogMX1cbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU29saWRQb2x5Z29uTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIGVuYWJsZTY0Yml0U3VwcG9ydCh0aGlzLnByb3BzKVxuICAgICAgPyB7dnM6IHZzNjQsIGZzLCBtb2R1bGVzOiBbJ3Byb2plY3Q2NCcsICdsaWdodGluZycsICdwaWNraW5nJ119XG4gICAgICA6IHt2cywgZnMsIG1vZHVsZXM6IFsnbGlnaHRpbmcnLCAncGlja2luZyddfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBudW1JbnN0YW5jZXM6IDAsXG4gICAgICBJbmRleFR5cGU6IGdsLmdldEV4dGVuc2lvbignT0VTX2VsZW1lbnRfaW5kZXhfdWludCcpID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheVxuICAgIH0pO1xuXG4gICAgY29uc3QgYXR0cmlidXRlTWFuYWdlciA9IHRoaXMuZ2V0QXR0cmlidXRlTWFuYWdlcigpO1xuICAgIGNvbnN0IG5vQWxsb2MgPSB0cnVlO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZCh7XG4gICAgICBpbmRpY2VzOiB7c2l6ZTogMSwgaXNJbmRleGVkOiB0cnVlLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5kaWNlcywgbm9BbGxvY30sXG4gICAgICBwb3NpdGlvbnM6IHtcbiAgICAgICAgc2l6ZTogMyxcbiAgICAgICAgYWNjZXNzb3I6IFsnZXh0cnVkZWQnLCAnZnA2NCddLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zLFxuICAgICAgICBub0FsbG9jXG4gICAgICB9LFxuICAgICAgbmV4dFBvc2l0aW9uczoge1xuICAgICAgICBzaXplOiAzLFxuICAgICAgICBhY2Nlc3NvcjogWydleHRydWRlZCcsICdmcDY0J10sXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVOZXh0UG9zaXRpb25zLFxuICAgICAgICBub0FsbG9jXG4gICAgICB9LFxuICAgICAgZWxldmF0aW9uczoge1xuICAgICAgICBzaXplOiAxLFxuICAgICAgICBhY2Nlc3NvcjogWydleHRydWRlZCcsICdnZXRFbGV2YXRpb24nXSxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUVsZXZhdGlvbnMsXG4gICAgICAgIG5vQWxsb2NcbiAgICAgIH0sXG4gICAgICBmaWxsQ29sb3JzOiB7XG4gICAgICAgIGFsaWFzOiAnY29sb3JzJyxcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRGaWxsQ29sb3InLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlRmlsbENvbG9ycyxcbiAgICAgICAgbm9BbGxvY1xuICAgICAgfSxcbiAgICAgIGxpbmVDb2xvcnM6IHtcbiAgICAgICAgYWxpYXM6ICdjb2xvcnMnLFxuICAgICAgICBzaXplOiA0LFxuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldExpbmVDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVMaW5lQ29sb3JzLFxuICAgICAgICBub0FsbG9jXG4gICAgICB9LFxuICAgICAgcGlja2luZ0NvbG9yczoge3NpemU6IDMsIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVQaWNraW5nQ29sb3JzLCBub0FsbG9jfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHN9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMuY29vcmRpbmF0ZVN5c3RlbSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HTEFUKSB7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGQoe1xuICAgICAgICAgIHBvc2l0aW9uczY0eHlMb3c6IHtzaXplOiAyLCBhY2Nlc3NvcjogJ2ZwNjQnLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUG9zaXRpb25zTG93fSxcbiAgICAgICAgICBuZXh0UG9zaXRpb25zNjR4eUxvdzoge3NpemU6IDIsIGFjY2Vzc29yOiAnZnA2NCcsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVOZXh0UG9zaXRpb25zTG93fVxuICAgICAgICB9KTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLnJlbW92ZShbJ3Bvc2l0aW9uczY0eHlMb3cnLCAnbmV4dFBvc2l0aW9uczY0eHlMb3cnXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge2V4dHJ1ZGVkLCBsaWdodFNldHRpbmdzLCBlbGV2YXRpb25TY2FsZX0gPSB0aGlzLnByb3BzO1xuXG4gICAgY29uc3QgcmVuZGVyVW5pZm9ybXMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB1bmlmb3JtcyxcbiAgICAgIHtcbiAgICAgICAgZXh0cnVkZWQ6IGV4dHJ1ZGVkID8gMS4wIDogMC4wLFxuICAgICAgICBlbGV2YXRpb25TY2FsZVxuICAgICAgfSxcbiAgICAgIGxpZ2h0U2V0dGluZ3NcbiAgICApO1xuXG4gICAgdGhpcy5zdGF0ZS5tb2RlbHMuZm9yRWFjaChtb2RlbCA9PiB7XG4gICAgICBtb2RlbC5yZW5kZXIocmVuZGVyVW5pZm9ybXMpO1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlU3RhdGUodXBkYXRlUGFyYW1zKSB7XG4gICAgc3VwZXIudXBkYXRlU3RhdGUodXBkYXRlUGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlR2VvbWV0cnkodXBkYXRlUGFyYW1zKTtcbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh1cGRhdGVQYXJhbXMpO1xuXG4gICAgY29uc3Qge3Byb3BzLCBvbGRQcm9wc30gPSB1cGRhdGVQYXJhbXM7XG5cbiAgICBjb25zdCByZWdlbmVyYXRlTW9kZWxzID1cbiAgICAgIHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQgfHxcbiAgICAgIHByb3BzLmZpbGxlZCAhPT0gb2xkUHJvcHMuZmlsbGVkIHx8XG4gICAgICBwcm9wcy5leHRydWRlZCAhPT0gb2xkUHJvcHMuZXh0cnVkZWQgfHxcbiAgICAgIHByb3BzLndpcmVmcmFtZSAhPT0gb2xkUHJvcHMud2lyZWZyYW1lO1xuXG4gICAgaWYgKHJlZ2VuZXJhdGVNb2RlbHMpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoXG4gICAgICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gU2V0IGEgZmxhZyB0byBzZXQgYXR0cmlidXRlcyB0byBuZXcgbW9kZWxzXG4gICAgICAgICAgICBtb2RlbHNDaGFuZ2VkOiB0cnVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0aGlzLl9nZXRNb2RlbHModGhpcy5jb250ZXh0LmdsKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChwcm9wcy5leHRydWRlZCAhPT0gb2xkUHJvcHMuZXh0cnVkZWQpIHtcbiAgICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlKCdleHRydWRlZCcpO1xuICAgIH1cbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGUoJ2ZwNjQnKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVHZW9tZXRyeSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBjb25zdCBnZW9tZXRyeUNvbmZpZ0NoYW5nZWQgPVxuICAgICAgY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHxcbiAgICAgIChjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgJiZcbiAgICAgICAgKGNoYW5nZUZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZC5hbGwgfHwgY2hhbmdlRmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkLmdldFBvbHlnb24pKTtcblxuICAgIC8vIFdoZW4gdGhlIGdlb21ldHJ5IGNvbmZpZyAgb3IgdGhlIGRhdGEgaXMgY2hhbmdlZCxcbiAgICAvLyB0ZXNzZWxsYXRvciBuZWVkcyB0byBiZSBpbnZva2VkXG4gICAgaWYgKGdlb21ldHJ5Q29uZmlnQ2hhbmdlZCkge1xuICAgICAgLy8gVE9ETyAtIGF2b2lkIGNyZWF0aW5nIGEgdGVtcG9yYXJ5IGFycmF5IGhlcmU6IGxldCB0aGUgdGVzc2VsYXRvciBpdGVyYXRlXG4gICAgICBjb25zdCBwb2x5Z29ucyA9IHByb3BzLmRhdGEubWFwKHByb3BzLmdldFBvbHlnb24pO1xuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgcG9seWdvblRlc3NlbGF0b3I6IG5ldyBQb2x5Z29uVGVzc2VsYXRvcih7cG9seWdvbnMsIEluZGV4VHlwZTogdGhpcy5zdGF0ZS5JbmRleFR5cGV9KVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuc3RhdGUuYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgZ2VvbWV0cnlDb25maWdDaGFuZ2VkIHx8XG4gICAgICBwcm9wcy5leHRydWRlZCAhPT0gb2xkUHJvcHMuZXh0cnVkZWQgfHxcbiAgICAgIHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjRcbiAgICApIHtcbiAgICAgIHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IudXBkYXRlUG9zaXRpb25zKHtcbiAgICAgICAgZnA2NDogcHJvcHMuZnA2NCxcbiAgICAgICAgZXh0cnVkZWQ6IHByb3BzLmV4dHJ1ZGVkXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGVzKHByb3BzKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXIsIG1vZGVsc0NoYW5nZWR9ID0gdGhpcy5zdGF0ZTtcblxuICAgIC8vIEZpZ3VyZSBvdXQgZGF0YSBsZW5ndGhcbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLnVwZGF0ZSh7XG4gICAgICBkYXRhOiBwcm9wcy5kYXRhLFxuICAgICAgbnVtSW5zdGFuY2VzOiAwLFxuICAgICAgcHJvcHMsXG4gICAgICBidWZmZXJzOiBwcm9wcyxcbiAgICAgIGNvbnRleHQ6IHRoaXMsXG4gICAgICAvLyBEb24ndCB3b3JyeSBhYm91dCBub24tYXR0cmlidXRlIHByb3BzXG4gICAgICBpZ25vcmVVbmtub3duQXR0cmlidXRlczogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaWYgKG1vZGVsc0NoYW5nZWQpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUF0dHJpYnV0ZXMoYXR0cmlidXRlTWFuYWdlci5hdHRyaWJ1dGVzKTtcbiAgICAgIC8vIGNsZWFyIHRoZSBmbGFnXG4gICAgICB0aGlzLnNldFN0YXRlKHttb2RlbHNDaGFuZ2VkOiBmYWxzZX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjaGFuZ2VkQXR0cmlidXRlcyA9IGF0dHJpYnV0ZU1hbmFnZXIuZ2V0Q2hhbmdlZEF0dHJpYnV0ZXMoe2NsZWFyQ2hhbmdlZEZsYWdzOiB0cnVlfSk7XG4gICAgICB0aGlzLl91cGRhdGVBdHRyaWJ1dGVzKGNoYW5nZWRBdHRyaWJ1dGVzKTtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3Qge21vZGVsc0J5TmFtZX0gPSB0aGlzLnN0YXRlO1xuXG4gICAgZm9yIChjb25zdCBtb2RlbE5hbWUgaW4gbW9kZWxzQnlOYW1lKSB7XG4gICAgICBjb25zdCBtb2RlbCA9IG1vZGVsc0J5TmFtZVttb2RlbE5hbWVdO1xuXG4gICAgICBpZiAobW9kZWxOYW1lID09PSAnVE9QJykge1xuICAgICAgICBtb2RlbC5zZXRWZXJ0ZXhDb3VudCh0aGlzLnN0YXRlLm51bVZlcnRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2RlbC5zZXRJbnN0YW5jZUNvdW50KHRoaXMuc3RhdGUubnVtSW5zdGFuY2VzKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYXR0cmlidXRlTWFwID0gQVRUUklCVVRFX01BUFNbbW9kZWxOYW1lXTtcbiAgICAgIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSB7fTtcbiAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZU92ZXJyaWRlID0gYXR0cmlidXRlTWFwW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICAgIGlmIChhdHRyaWJ1dGVPdmVycmlkZSkge1xuICAgICAgICAgIGNvbnN0IG5ld0F0dHJpYnV0ZSA9IE9iamVjdC5hc3NpZ24oe30sIGF0dHJpYnV0ZSwgYXR0cmlidXRlT3ZlcnJpZGUpO1xuICAgICAgICAgIG5ld0F0dHJpYnV0ZXNbYXR0cmlidXRlT3ZlcnJpZGUubmFtZSB8fCBhdHRyaWJ1dGVOYW1lXSA9IG5ld0F0dHJpYnV0ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbW9kZWwuc2V0QXR0cmlidXRlcyhuZXdBdHRyaWJ1dGVzKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0TW9kZWxzKGdsKSB7XG4gICAgY29uc3Qge2lkLCBmaWxsZWQsIGV4dHJ1ZGVkLCB3aXJlZnJhbWV9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IG1vZGVscyA9IHt9O1xuXG4gICAgaWYgKGZpbGxlZCkge1xuICAgICAgbW9kZWxzLlRPUCA9IG5ldyBNb2RlbChcbiAgICAgICAgZ2wsXG4gICAgICAgIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U2hhZGVycygpLCB7XG4gICAgICAgICAgaWQ6IGAke2lkfS10b3BgLFxuICAgICAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFUyxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgdmVydGV4UG9zaXRpb25zOiB7c2l6ZTogMiwgaXNHZW5lcmljOiB0cnVlLCB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbMCwgMV0pfSxcbiAgICAgICAgICAgICAgbmV4dFBvc2l0aW9uczoge3NpemU6IDMsIGlzR2VuZXJpYzogdHJ1ZSwgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoMyl9LFxuICAgICAgICAgICAgICBuZXh0UG9zaXRpb25zNjR4eUxvdzoge3NpemU6IDIsIGlzR2VuZXJpYzogdHJ1ZSwgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoMil9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICAgIGlzU2lkZVZlcnRleDogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdmVydGV4Q291bnQ6IDAsXG4gICAgICAgICAgaXNJbmRleGVkOiB0cnVlLFxuICAgICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChmaWxsZWQgJiYgZXh0cnVkZWQpIHtcbiAgICAgIG1vZGVscy5TSURFID0gbmV3IE1vZGVsKFxuICAgICAgICBnbCxcbiAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTaGFkZXJzKCksIHtcbiAgICAgICAgICBpZDogYCR7aWR9LXNpZGVgLFxuICAgICAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFX1NUUklQLFxuICAgICAgICAgICAgdmVydGV4Q291bnQ6IDQsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgIHZlcnRleFBvc2l0aW9uczoge3NpemU6IDIsIHZhbHVlOiBTSURFX0ZJTExfUE9TSVRJT05TfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHVuaWZvcm1zOiB7XG4gICAgICAgICAgICBpc1NpZGVWZXJ0ZXg6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgIGlzSW5zdGFuY2VkOiAxLFxuICAgICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChleHRydWRlZCAmJiB3aXJlZnJhbWUpIHtcbiAgICAgIG1vZGVscy5XSVJFID0gbmV3IE1vZGVsKFxuICAgICAgICBnbCxcbiAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTaGFkZXJzKCksIHtcbiAgICAgICAgICBpZDogYCR7aWR9LXdpcmVgLFxuICAgICAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICAgICAgZHJhd01vZGU6IEdMLkxJTkVfU1RSSVAsXG4gICAgICAgICAgICB2ZXJ0ZXhDb3VudDogNCxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgdmVydGV4UG9zaXRpb25zOiB7c2l6ZTogMiwgdmFsdWU6IFNJREVfV0lSRV9QT1NJVElPTlN9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICAgIGlzU2lkZVZlcnRleDogMVxuICAgICAgICAgIH0sXG4gICAgICAgICAgaXNJbnN0YW5jZWQ6IDEsXG4gICAgICAgICAgc2hhZGVyQ2FjaGU6IHRoaXMuY29udGV4dC5zaGFkZXJDYWNoZVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbW9kZWxzOiBbbW9kZWxzLldJUkUsIG1vZGVscy5TSURFLCBtb2RlbHMuVE9QXS5maWx0ZXIoQm9vbGVhbiksXG4gICAgICBtb2RlbHNCeU5hbWU6IG1vZGVsc1xuICAgIH07XG4gIH1cblxuICBjYWxjdWxhdGVJbmRpY2VzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IuaW5kaWNlcygpO1xuICAgIGF0dHJpYnV0ZS50YXJnZXQgPSBHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUjtcbiAgICBjb25zdCBudW1WZXJ0ZXggPSBhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemU7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bnVtVmVydGV4fSk7XG4gIH1cblxuICBjYWxjdWxhdGVQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5wb3NpdGlvbnMoKTtcbiAgICBjb25zdCBudW1JbnN0YW5jZXMgPSBhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemU7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bnVtSW5zdGFuY2VzfSk7XG4gIH1cbiAgY2FsY3VsYXRlUG9zaXRpb25zTG93KGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IucG9zaXRpb25zNjR4eUxvdygpO1xuICB9XG5cbiAgY2FsY3VsYXRlTmV4dFBvc2l0aW9ucyhhdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUgPSB0aGlzLnN0YXRlLnBvbHlnb25UZXNzZWxhdG9yLm5leHRQb3NpdGlvbnMoKTtcbiAgfVxuICBjYWxjdWxhdGVOZXh0UG9zaXRpb25zTG93KGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IubmV4dFBvc2l0aW9uczY0eHlMb3coKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUVsZXZhdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuZXh0cnVkZWQpIHtcbiAgICAgIGF0dHJpYnV0ZS5pc0dlbmVyaWMgPSBmYWxzZTtcbiAgICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IuZWxldmF0aW9ucyh7XG4gICAgICAgIGdldEVsZXZhdGlvbjogcG9seWdvbkluZGV4ID0+IHRoaXMucHJvcHMuZ2V0RWxldmF0aW9uKHRoaXMucHJvcHMuZGF0YVtwb2x5Z29uSW5kZXhdKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF0dHJpYnV0ZS5pc0dlbmVyaWMgPSB0cnVlO1xuICAgICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEZsb2F0MzJBcnJheSgxKTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVGaWxsQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IuY29sb3JzKHtcbiAgICAgIGtleTogJ2ZpbGxDb2xvcnMnLFxuICAgICAgZ2V0Q29sb3I6IHBvbHlnb25JbmRleCA9PiB0aGlzLnByb3BzLmdldEZpbGxDb2xvcih0aGlzLnByb3BzLmRhdGFbcG9seWdvbkluZGV4XSlcbiAgICB9KTtcbiAgfVxuICBjYWxjdWxhdGVMaW5lQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZSA9IHRoaXMuc3RhdGUucG9seWdvblRlc3NlbGF0b3IuY29sb3JzKHtcbiAgICAgIGtleTogJ2xpbmVDb2xvcnMnLFxuICAgICAgZ2V0Q29sb3I6IHBvbHlnb25JbmRleCA9PiB0aGlzLnByb3BzLmdldExpbmVDb2xvcih0aGlzLnByb3BzLmRhdGFbcG9seWdvbkluZGV4XSlcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHBpY2tpbmcgY29sb3JzIGNhbGN1bGF0aW9uXG4gIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlID0gdGhpcy5zdGF0ZS5wb2x5Z29uVGVzc2VsYXRvci5waWNraW5nQ29sb3JzKCk7XG4gIH1cbn1cblxuU29saWRQb2x5Z29uTGF5ZXIubGF5ZXJOYW1lID0gJ1NvbGlkUG9seWdvbkxheWVyJztcblNvbGlkUG9seWdvbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==