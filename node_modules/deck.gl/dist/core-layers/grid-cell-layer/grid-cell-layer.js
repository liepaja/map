'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _gridCellLayerVertex = require('./grid-cell-layer-vertex.glsl');

var _gridCellLayerVertex2 = _interopRequireDefault(_gridCellLayerVertex);

var _gridCellLayerVertex3 = require('./grid-cell-layer-vertex-64.glsl');

var _gridCellLayerVertex4 = _interopRequireDefault(_gridCellLayerVertex3);

var _gridCellLayerFragment = require('./grid-cell-layer-fragment.glsl');

var _gridCellLayerFragment2 = _interopRequireDefault(_gridCellLayerFragment);

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

var fp64LowPart = _core.experimental.fp64LowPart,
    enable64bitSupport = _core.experimental.enable64bitSupport;


var DEFAULT_COLOR = [255, 0, 255, 255];

var defaultProps = {
  cellSize: 1000,
  coverage: 1,
  elevationScale: 1,
  extruded: true,
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getElevation: function getElevation(x) {
    return x.elevation;
  },
  getColor: function getColor(x) {
    return x.color;
  },

  lightSettings: {
    lightsPosition: [-122.45, 37.65, 8000, -122.45, 37.2, 1000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [1.0, 0.0, 0.8, 0.0],
    numberOfLights: 2
  }
};

var GridCellLayer = function (_Layer) {
  _inherits(GridCellLayer, _Layer);

  function GridCellLayer() {
    _classCallCheck(this, GridCellLayer);

    return _possibleConstructorReturn(this, (GridCellLayer.__proto__ || Object.getPrototypeOf(GridCellLayer)).apply(this, arguments));
  }

  _createClass(GridCellLayer, [{
    key: 'getShaders',

    /**
     * A generic GridLayer that takes latitude longitude delta of cells as a uniform
     * and the min lat lng of cells. grid can be 3d when pass in a height
     * and set enable3d to true
     *
     * @param {array} props.data -
     * @param {boolean} props.extruded - enable grid elevation
     * @param {number} props.cellSize - grid cell size in meters
     * @param {function} props.getPosition - position accessor, returned as [minLng, minLat]
     * @param {function} props.getElevation - elevation accessor
     * @param {function} props.getColor - color accessor, returned as [r, g, b, a]
     */

    value: function getShaders() {
      var shaderCache = this.context.shaderCache;

      return enable64bitSupport(this.props) ? { vs: _gridCellLayerVertex4.default, fs: _gridCellLayerFragment2.default, modules: ['project64', 'lighting', 'picking'], shaderCache: shaderCache } : { vs: _gridCellLayerVertex2.default, fs: _gridCellLayerFragment2.default, modules: ['lighting', 'picking'], shaderCache: shaderCache }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      /* eslint-disable max-len */
      attributeManager.addInstanced({
        instancePositions: {
          size: 4,
          transition: true,
          accessor: ['getPosition', 'getElevation'],
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
              accessor: 'getPosition',
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

      _get(GridCellLayer.prototype.__proto__ || Object.getPrototypeOf(GridCellLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      // Re-generate model if geometry changed
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
      this.updateUniforms();
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.CubeGeometry(),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'updateUniforms',
    value: function updateUniforms() {
      var _props = this.props,
          opacity = _props.opacity,
          extruded = _props.extruded,
          elevationScale = _props.elevationScale,
          coverage = _props.coverage,
          lightSettings = _props.lightSettings;
      var model = this.state.model;


      model.setUniforms(Object.assign({}, {
        extruded: extruded,
        elevationScale: elevationScale,
        opacity: opacity,
        coverage: coverage
      }, lightSettings));
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var viewport = this.context.viewport;
      // TODO - this should be a standard uniform in project package

      var _viewport$getDistance = viewport.getDistanceScales(),
          pixelsPerMeter = _viewport$getDistance.pixelsPerMeter;

      // cellSize needs to be updated on every draw call
      // because it is based on viewport


      _get(GridCellLayer.prototype.__proto__ || Object.getPrototypeOf(GridCellLayer.prototype), 'draw', this).call(this, {
        uniforms: Object.assign({
          cellSize: this.props.cellSize * pixelsPerMeter[0]
        }, uniforms)
      });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition,
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

          var position = getPosition(object);
          var elevation = getElevation(object) || 0;
          value[i + 0] = position[0];
          value[i + 1] = position[1];
          value[i + 2] = 0;
          value[i + 3] = elevation;
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
          getPosition = _props3.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var position = getPosition(point);
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

  return GridCellLayer;
}(_core.Layer);

exports.default = GridCellLayer;


GridCellLayer.layerName = 'GridCellLayer';
GridCellLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9ncmlkLWNlbGwtbGF5ZXIvZ3JpZC1jZWxsLWxheWVyLmpzIl0sIm5hbWVzIjpbImZwNjRMb3dQYXJ0IiwiZW5hYmxlNjRiaXRTdXBwb3J0IiwiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsImNlbGxTaXplIiwiY292ZXJhZ2UiLCJlbGV2YXRpb25TY2FsZSIsImV4dHJ1ZGVkIiwiZnA2NCIsImdldFBvc2l0aW9uIiwieCIsInBvc2l0aW9uIiwiZ2V0RWxldmF0aW9uIiwiZWxldmF0aW9uIiwiZ2V0Q29sb3IiLCJjb2xvciIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiR3JpZENlbGxMYXllciIsInNoYWRlckNhY2hlIiwiY29udGV4dCIsInByb3BzIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwiZ2V0QXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsInRyYW5zaXRpb24iLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zIiwiaW5zdGFuY2VDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJjb29yZGluYXRlU3lzdGVtIiwiTE5HTEFUIiwiaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwicmVtb3ZlIiwiZ2wiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwidXBkYXRlQXR0cmlidXRlIiwidXBkYXRlVW5pZm9ybXMiLCJPYmplY3QiLCJhc3NpZ24iLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImlzSW5zdGFuY2VkIiwib3BhY2l0eSIsInN0YXRlIiwic2V0VW5pZm9ybXMiLCJ1bmlmb3JtcyIsInZpZXdwb3J0IiwiZ2V0RGlzdGFuY2VTY2FsZXMiLCJwaXhlbHNQZXJNZXRlciIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJwb2ludCIsIk51bWJlciIsImlzRmluaXRlIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBb0JBOztBQUVBOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUExQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBR09BLFcsc0JBQUFBLFc7SUFBYUMsa0Isc0JBQUFBLGtCOzs7QUFPcEIsSUFBTUMsZ0JBQWdCLENBQUMsR0FBRCxFQUFNLENBQU4sRUFBUyxHQUFULEVBQWMsR0FBZCxDQUF0Qjs7QUFFQSxJQUFNQyxlQUFlO0FBQ25CQyxZQUFVLElBRFM7QUFFbkJDLFlBQVUsQ0FGUztBQUduQkMsa0JBQWdCLENBSEc7QUFJbkJDLFlBQVUsSUFKUztBQUtuQkMsUUFBTSxLQUxhOztBQU9uQkMsZUFBYTtBQUFBLFdBQUtDLEVBQUVDLFFBQVA7QUFBQSxHQVBNO0FBUW5CQyxnQkFBYztBQUFBLFdBQUtGLEVBQUVHLFNBQVA7QUFBQSxHQVJLO0FBU25CQyxZQUFVO0FBQUEsV0FBS0osRUFBRUssS0FBUDtBQUFBLEdBVFM7O0FBV25CQyxpQkFBZTtBQUNiQyxvQkFBZ0IsQ0FBQyxDQUFDLE1BQUYsRUFBVSxLQUFWLEVBQWlCLElBQWpCLEVBQXVCLENBQUMsTUFBeEIsRUFBZ0MsSUFBaEMsRUFBc0MsSUFBdEMsQ0FESDtBQUViQyxrQkFBYyxHQUZEO0FBR2JDLGtCQUFjLEdBSEQ7QUFJYkMsbUJBQWUsR0FKRjtBQUti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QTtBQVM1Qzs7OzRDQUV1QjJELFMsRUFBVztBQUFBLG9CQUNSLEtBQUs1QyxLQURHO0FBQUEsVUFDMUI2QyxJQUQwQixXQUMxQkEsSUFEMEI7QUFBQSxVQUNwQnpELFFBRG9CLFdBQ3BCQSxRQURvQjtBQUFBLFVBRTFCMEQsS0FGMEIsR0FFWEYsU0FGVyxDQUUxQkUsS0FGMEI7QUFBQSxVQUVuQnRDLElBRm1CLEdBRVhvQyxTQUZXLENBRW5CcEMsSUFGbUI7O0FBR2pDLFVBQUl1QyxJQUFJLENBQVI7QUFIaUM7QUFBQTtBQUFBOztBQUFBO0FBSWpDLDhCQUFxQkYsSUFBckIsbUlBQTJCO0FBQUEsY0FBaEJHLE1BQWdCOztBQUN6QixjQUFNM0QsUUFBUUQsU0FBUzRELE1BQVQsS0FBb0J4RSxhQUFsQztBQUNBc0UsZ0JBQU1DLElBQUksQ0FBVixJQUFlMUQsTUFBTSxDQUFOLENBQWY7QUFDQXlELGdCQUFNQyxJQUFJLENBQVYsSUFBZTFELE1BQU0sQ0FBTixDQUFmO0FBQ0F5RCxnQkFBTUMsSUFBSSxDQUFWLElBQWUxRCxNQUFNLENBQU4sQ0FBZjtBQUNBeUQsZ0JBQU1DLElBQUksQ0FBVixJQUFlRyxPQUFPQyxRQUFQLENBQWdCOUQsTUFBTSxDQUFOLENBQWhCLElBQTRCQSxNQUFNLENBQU4sQ0FBNUIsR0FBdUNiLGNBQWMsQ0FBZCxDQUF0RDtBQUNBdUUsZUFBS3ZDLElBQUw7QUFDRDtBQVhnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWWxDOzs7Ozs7a0JBN0prQlgsYTs7O0FBZ0tyQkEsY0FBY3VELFNBQWQsR0FBMEIsZUFBMUI7QUFDQXZELGNBQWNwQixZQUFkLEdBQTZCQSxZQUE3QiIsImZpbGUiOiJncmlkLWNlbGwtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtDT09SRElOQVRFX1NZU1RFTSwgTGF5ZXIsIGV4cGVyaW1lbnRhbH0gZnJvbSAnLi4vLi4vY29yZSc7XG5jb25zdCB7ZnA2NExvd1BhcnQsIGVuYWJsZTY0Yml0U3VwcG9ydH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQge0dMLCBNb2RlbCwgQ3ViZUdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vZ3JpZC1jZWxsLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCB2czY0IGZyb20gJy4vZ3JpZC1jZWxsLWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBmcyBmcm9tICcuL2dyaWQtY2VsbC1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFsyNTUsIDAsIDI1NSwgMjU1XTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICBjZWxsU2l6ZTogMTAwMCxcbiAgY292ZXJhZ2U6IDEsXG4gIGVsZXZhdGlvblNjYWxlOiAxLFxuICBleHRydWRlZDogdHJ1ZSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZ2V0RWxldmF0aW9uOiB4ID0+IHguZWxldmF0aW9uLFxuICBnZXRDb2xvcjogeCA9PiB4LmNvbG9yLFxuXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWy0xMjIuNDUsIDM3LjY1LCA4MDAwLCAtMTIyLjQ1LCAzNy4yLCAxMDAwXSxcbiAgICBhbWJpZW50UmF0aW86IDAuNCxcbiAgICBkaWZmdXNlUmF0aW86IDAuNixcbiAgICBzcGVjdWxhclJhdGlvOiAwLjgsXG4gICAgbGlnaHRzU3RyZW5ndGg6IFsxLjAsIDAuMCwgMC44LCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAyXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyaWRDZWxsTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIC8qKlxuICAgKiBBIGdlbmVyaWMgR3JpZExheWVyIHRoYXQgdGFrZXMgbGF0aXR1ZGUgbG9uZ2l0dWRlIGRlbHRhIG9mIGNlbGxzIGFzIGEgdW5pZm9ybVxuICAgKiBhbmQgdGhlIG1pbiBsYXQgbG5nIG9mIGNlbGxzLiBncmlkIGNhbiBiZSAzZCB3aGVuIHBhc3MgaW4gYSBoZWlnaHRcbiAgICogYW5kIHNldCBlbmFibGUzZCB0byB0cnVlXG4gICAqXG4gICAqIEBwYXJhbSB7YXJyYXl9IHByb3BzLmRhdGEgLVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHByb3BzLmV4dHJ1ZGVkIC0gZW5hYmxlIGdyaWQgZWxldmF0aW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwcm9wcy5jZWxsU2l6ZSAtIGdyaWQgY2VsbCBzaXplIGluIG1ldGVyc1xuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9wcy5nZXRQb3NpdGlvbiAtIHBvc2l0aW9uIGFjY2Vzc29yLCByZXR1cm5lZCBhcyBbbWluTG5nLCBtaW5MYXRdXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHByb3BzLmdldEVsZXZhdGlvbiAtIGVsZXZhdGlvbiBhY2Nlc3NvclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcm9wcy5nZXRDb2xvciAtIGNvbG9yIGFjY2Vzc29yLCByZXR1cm5lZCBhcyBbciwgZywgYiwgYV1cbiAgICovXG5cbiAgZ2V0U2hhZGVycygpIHtcbiAgICBjb25zdCB7c2hhZGVyQ2FjaGV9ID0gdGhpcy5jb250ZXh0O1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcylcbiAgICAgID8ge3ZzOiB2czY0LCBmcywgbW9kdWxlczogWydwcm9qZWN0NjQnLCAnbGlnaHRpbmcnLCAncGlja2luZyddLCBzaGFkZXJDYWNoZX1cbiAgICAgIDoge3ZzLCBmcywgbW9kdWxlczogWydsaWdodGluZycsICdwaWNraW5nJ10sIHNoYWRlckNhY2hlfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzb3I6IFsnZ2V0UG9zaXRpb24nLCAnZ2V0RWxldmF0aW9uJ10sXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlQ29sb3JzOiB7XG4gICAgICAgIHNpemU6IDQsXG4gICAgICAgIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0Q29sb3InLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnNcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3QgYXR0cmlidXRlTWFuYWdlciA9IHRoaXMuZ2V0QXR0cmlidXRlTWFuYWdlcigpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLmNvb3JkaW5hdGVTeXN0ZW0gPT09IENPT1JESU5BVEVfU1lTVEVNLkxOR0xBVCkge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICAgICAgaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93OiB7XG4gICAgICAgICAgICBzaXplOiAyLFxuICAgICAgICAgICAgYWNjZXNzb3I6ICdnZXRQb3NpdGlvbicsXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFsnaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93J10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG4gICAgLy8gUmUtZ2VuZXJhdGUgbW9kZWwgaWYgZ2VvbWV0cnkgY2hhbmdlZFxuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIHRoaXMudXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIHJldHVybiBuZXcgTW9kZWwoXG4gICAgICBnbCxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U2hhZGVycygpLCB7XG4gICAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgICBnZW9tZXRyeTogbmV3IEN1YmVHZW9tZXRyeSgpLFxuICAgICAgICBpc0luc3RhbmNlZDogdHJ1ZSxcbiAgICAgICAgc2hhZGVyQ2FjaGU6IHRoaXMuY29udGV4dC5zaGFkZXJDYWNoZVxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgdXBkYXRlVW5pZm9ybXMoKSB7XG4gICAgY29uc3Qge29wYWNpdHksIGV4dHJ1ZGVkLCBlbGV2YXRpb25TY2FsZSwgY292ZXJhZ2UsIGxpZ2h0U2V0dGluZ3N9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7bW9kZWx9ID0gdGhpcy5zdGF0ZTtcblxuICAgIG1vZGVsLnNldFVuaWZvcm1zKFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIHtcbiAgICAgICAgICBleHRydWRlZCxcbiAgICAgICAgICBlbGV2YXRpb25TY2FsZSxcbiAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgIGNvdmVyYWdlXG4gICAgICAgIH0sXG4gICAgICAgIGxpZ2h0U2V0dGluZ3NcbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICAvLyBUT0RPIC0gdGhpcyBzaG91bGQgYmUgYSBzdGFuZGFyZCB1bmlmb3JtIGluIHByb2plY3QgcGFja2FnZVxuICAgIGNvbnN0IHtwaXhlbHNQZXJNZXRlcn0gPSB2aWV3cG9ydC5nZXREaXN0YW5jZVNjYWxlcygpO1xuXG4gICAgLy8gY2VsbFNpemUgbmVlZHMgdG8gYmUgdXBkYXRlZCBvbiBldmVyeSBkcmF3IGNhbGxcbiAgICAvLyBiZWNhdXNlIGl0IGlzIGJhc2VkIG9uIHZpZXdwb3J0XG4gICAgc3VwZXIuZHJhdyh7XG4gICAgICB1bmlmb3JtczogT2JqZWN0LmFzc2lnbihcbiAgICAgICAge1xuICAgICAgICAgIGNlbGxTaXplOiB0aGlzLnByb3BzLmNlbGxTaXplICogcGl4ZWxzUGVyTWV0ZXJbMF1cbiAgICAgICAgfSxcbiAgICAgICAgdW5pZm9ybXNcbiAgICAgIClcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbiwgZ2V0RWxldmF0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgY29uc3QgZWxldmF0aW9uID0gZ2V0RWxldmF0aW9uKG9iamVjdCkgfHwgMDtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IHBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSArIDFdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpICsgMl0gPSAwO1xuICAgICAgdmFsdWVbaSArIDNdID0gZWxldmF0aW9uO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjR4eUxvdyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0UG9zaXRpb24ocG9pbnQpO1xuICAgICAgdmFsdWVbaSsrXSA9IGZwNjRMb3dQYXJ0KHBvc2l0aW9uWzBdKTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0TG93UGFydChwb3NpdGlvblsxXSk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihvYmplY3QpIHx8IERFRkFVTFRfQ09MT1I7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBOdW1iZXIuaXNGaW5pdGUoY29sb3JbM10pID8gY29sb3JbM10gOiBERUZBVUxUX0NPTE9SWzNdO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxufVxuXG5HcmlkQ2VsbExheWVyLmxheWVyTmFtZSA9ICdHcmlkQ2VsbExheWVyJztcbkdyaWRDZWxsTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19