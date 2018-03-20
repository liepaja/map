'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _scatterplotLayerVertex = require('./scatterplot-layer-vertex.glsl');

var _scatterplotLayerVertex2 = _interopRequireDefault(_scatterplotLayerVertex);

var _scatterplotLayerVertex3 = require('./scatterplot-layer-vertex-64.glsl');

var _scatterplotLayerVertex4 = _interopRequireDefault(_scatterplotLayerVertex3);

var _scatterplotLayerFragment = require('./scatterplot-layer-fragment.glsl');

var _scatterplotLayerFragment2 = _interopRequireDefault(_scatterplotLayerFragment);

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


var DEFAULT_COLOR = [0, 0, 0, 255];

var defaultProps = {
  radiusScale: 1,
  radiusMinPixels: 0, //  min point radius in pixels
  radiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels
  strokeWidth: 1,
  outline: false,
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getRadius: function getRadius(x) {
    return x.radius || 1;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var ScatterplotLayer = function (_Layer) {
  _inherits(ScatterplotLayer, _Layer);

  function ScatterplotLayer() {
    _classCallCheck(this, ScatterplotLayer);

    return _possibleConstructorReturn(this, (ScatterplotLayer.__proto__ || Object.getPrototypeOf(ScatterplotLayer)).apply(this, arguments));
  }

  _createClass(ScatterplotLayer, [{
    key: 'getShaders',
    value: function getShaders(id) {
      var shaderCache = this.context.shaderCache;

      return enable64bitSupport(this.props) ? { vs: _scatterplotLayerVertex4.default, fs: _scatterplotLayerFragment2.default, modules: ['project64', 'picking'], shaderCache: shaderCache } : { vs: _scatterplotLayerVertex2.default, fs: _scatterplotLayerFragment2.default, modules: ['picking'], shaderCache: shaderCache }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      /* eslint-disable max-len */
      this.state.attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          transition: true,
          accessor: 'getPosition',
          update: this.calculateInstancePositions
        },
        instanceRadius: {
          size: 1,
          transition: true,
          accessor: 'getRadius',
          defaultValue: 1,
          update: this.calculateInstanceRadius
        },
        instanceColors: {
          size: 4,
          transition: true,
          type: _luma.GL.UNSIGNED_BYTE,
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

      _get(ScatterplotLayer.prototype.__proto__ || Object.getPrototypeOf(ScatterplotLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          radiusScale = _props.radiusScale,
          radiusMinPixels = _props.radiusMinPixels,
          radiusMaxPixels = _props.radiusMaxPixels,
          outline = _props.outline,
          strokeWidth = _props.strokeWidth;

      this.state.model.render(Object.assign({}, uniforms, {
        outline: outline ? 1 : 0,
        strokeWidth: strokeWidth,
        radiusScale: radiusScale,
        radiusMinPixels: radiusMinPixels,
        radiusMaxPixels: radiusMaxPixels
      }));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      // a square that minimally cover the unit circle
      var positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];

      return new _luma.Model(gl, Object.assign(this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          attributes: {
            positions: new Float32Array(positions)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var position = getPosition(point);
          value[i++] = position[0];
          value[i++] = position[1];
          value[i++] = position[2] || 0;
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
    key: 'calculateInstanceRadius',
    value: function calculateInstanceRadius(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getRadius = _props4.getRadius;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;

          var radius = getRadius(point);
          value[i++] = isNaN(radius) ? 1 : radius;
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
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props5 = this.props,
          data = _props5.data,
          getColor = _props5.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var point = _step4.value;

          var color = getColor(point) || DEFAULT_COLOR;
          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? 255 : color[3];
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }]);

  return ScatterplotLayer;
}(_core.Layer);

exports.default = ScatterplotLayer;


ScatterplotLayer.layerName = 'ScatterplotLayer';
ScatterplotLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9zY2F0dGVycGxvdC1sYXllci9zY2F0dGVycGxvdC1sYXllci5qcyJdLCJuYW1lcyI6WyJmcDY0TG93UGFydCIsImVuYWJsZTY0Yml0U3VwcG9ydCIsIkRFRkFVTFRfQ09MT1IiLCJkZWZhdWx0UHJvcHMiLCJyYWRpdXNTY2FsZSIsInJhZGl1c01pblBpeGVscyIsInJhZGl1c01heFBpeGVscyIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJzdHJva2VXaWR0aCIsIm91dGxpbmUiLCJmcDY0IiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJnZXRSYWRpdXMiLCJyYWRpdXMiLCJnZXRDb2xvciIsImNvbG9yIiwiU2NhdHRlcnBsb3RMYXllciIsImlkIiwic2hhZGVyQ2FjaGUiLCJjb250ZXh0IiwicHJvcHMiLCJ2cyIsImZzIiwibW9kdWxlcyIsInN0YXRlIiwiYXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUG9zaXRpb25zIiwic2l6ZSIsInRyYW5zaXRpb24iLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zIiwiaW5zdGFuY2VSYWRpdXMiLCJkZWZhdWx0VmFsdWUiLCJjYWxjdWxhdGVJbnN0YW5jZVJhZGl1cyIsImluc3RhbmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJnZXRBdHRyaWJ1dGVNYW5hZ2VyIiwiaW52YWxpZGF0ZUFsbCIsImNvb3JkaW5hdGVTeXN0ZW0iLCJMTkdMQVQiLCJpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJnbCIsInNldFN0YXRlIiwibW9kZWwiLCJfZ2V0TW9kZWwiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsInBvc2l0aW9ucyIsImdldFNoYWRlcnMiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfRkFOIiwiYXR0cmlidXRlcyIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwiYXR0cmlidXRlIiwiZGF0YSIsInZhbHVlIiwiaSIsInBvaW50IiwiaXNOYU4iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFvQkE7O0FBRUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7OytlQTFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFHT0EsVyxzQkFBQUEsVztJQUFhQyxrQixzQkFBQUEsa0I7OztBQU9wQixJQUFNQyxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQXRCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLGVBQWEsQ0FETTtBQUVuQkMsbUJBQWlCLENBRkUsRUFFQztBQUNwQkMsbUJBQWlCQyxPQUFPQyxnQkFITCxFQUd1QjtBQUMxQ0MsZUFBYSxDQUpNO0FBS25CQyxXQUFTLEtBTFU7QUFNbkJDLFFBQU0sS0FOYTs7QUFRbkJDLGVBQWE7QUFBQSxXQUFLQyxFQUFFQyxRQUFQO0FBQUEsR0FSTTtBQVNuQkMsYUFBVztBQUFBLFdBQUtGLEVBQUVHLE1BQUYsSUFBWSxDQUFqQjtBQUFBLEdBVFE7QUFVbkJDLFlBQVU7QUFBQSxXQUFLSixFQUFFSyxLQUFGLElBQVdoQixhQUFoQjtBQUFBO0FBVlMsQ0FBckI7O0lBYXFCaUIsZ0I7Ozs7Ozs7Ozs7OytCQUNSQyxFLEVBQUk7QUFBQSxVQUNOQyxXQURNLEdBQ1MsS0FBS0MsT0FEZCxDQUNORCxXQURNOztBQUViLGFBQU9wQixtQkFBbUIsS0FBS3NCLEtBQXhCLElBQ0gsRUFBQ0Msb0NBQUQsRUFBV0Ms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LEdBQW9CQSxNQUFqQztBQUNEO0FBUGdDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRbEM7Ozs0Q0FFdUJxRCxTLEVBQVc7QUFBQSxvQkFDUixLQUFLOUMsS0FERztBQUFBLFVBQzFCK0MsSUFEMEIsV0FDMUJBLElBRDBCO0FBQUEsVUFDcEJyRCxRQURvQixXQUNwQkEsUUFEb0I7QUFBQSxVQUUxQnNELEtBRjBCLEdBRWpCRixTQUZpQixDQUUxQkUsS0FGMEI7O0FBR2pDLFVBQUlDLElBQUksQ0FBUjtBQUhpQztBQUFBO0FBQUE7O0FBQUE7QUFJakMsOEJBQW9CRixJQUFwQixtSUFBMEI7QUFBQSxjQUFmRyxLQUFlOztBQUN4QixjQUFNdkQsUUFBUUQsU0FBU3dELEtBQVQsS0FBbUJ2RSxhQUFqQztBQUNBcUUsZ0JBQU1DLEdBQU4sSUFBYXRELE1BQU0sQ0FBTixDQUFiO0FBQ0FxRCxnQkFBTUMsR0FBTixJQUFhdEQsTUFBTSxDQUFOLENBQWI7QUFDQXFELGdCQUFNQyxHQUFOLElBQWF0RCxNQUFNLENBQU4sQ0FBYjtBQUNBcUQsZ0JBQU1DLEdBQU4sSUFBYUUsTUFBTXhELE1BQU0sQ0FBTixDQUFOLElBQWtCLEdBQWxCLEdBQXdCQSxNQUFNLENBQU4sQ0FBckM7QUFDRDtBQVZnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBV2xDOzs7Ozs7a0JBNUlrQkMsZ0I7OztBQStJckJBLGlCQUFpQndELFNBQWpCLEdBQTZCLGtCQUE3QjtBQUNBeEQsaUJBQWlCaEIsWUFBakIsR0FBZ0NBLFlBQWhDIiwiZmlsZSI6InNjYXR0ZXJwbG90LWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU0sIExheWVyLCBleHBlcmltZW50YWx9IGZyb20gJy4uLy4uL2NvcmUnO1xuY29uc3Qge2ZwNjRMb3dQYXJ0LCBlbmFibGU2NGJpdFN1cHBvcnR9ID0gZXhwZXJpbWVudGFsO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vc2NhdHRlcnBsb3QtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHZzNjQgZnJvbSAnLi9zY2F0dGVycGxvdC1sYXllci12ZXJ0ZXgtNjQuZ2xzbCc7XG5pbXBvcnQgZnMgZnJvbSAnLi9zY2F0dGVycGxvdC1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHJhZGl1c1NjYWxlOiAxLFxuICByYWRpdXNNaW5QaXhlbHM6IDAsIC8vICBtaW4gcG9pbnQgcmFkaXVzIGluIHBpeGVsc1xuICByYWRpdXNNYXhQaXhlbHM6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLCAvLyBtYXggcG9pbnQgcmFkaXVzIGluIHBpeGVsc1xuICBzdHJva2VXaWR0aDogMSxcbiAgb3V0bGluZTogZmFsc2UsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIGdldFBvc2l0aW9uOiB4ID0+IHgucG9zaXRpb24sXG4gIGdldFJhZGl1czogeCA9PiB4LnJhZGl1cyB8fCAxLFxuICBnZXRDb2xvcjogeCA9PiB4LmNvbG9yIHx8IERFRkFVTFRfQ09MT1Jcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjYXR0ZXJwbG90TGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoaWQpIHtcbiAgICBjb25zdCB7c2hhZGVyQ2FjaGV9ID0gdGhpcy5jb250ZXh0O1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcylcbiAgICAgID8ge3ZzOiB2czY0LCBmcywgbW9kdWxlczogWydwcm9qZWN0NjQnLCAncGlja2luZyddLCBzaGFkZXJDYWNoZX1cbiAgICAgIDoge3ZzLCBmcywgbW9kdWxlczogWydwaWNraW5nJ10sIHNoYWRlckNhY2hlfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICB0aGlzLnN0YXRlLmF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlUG9zaXRpb25zOiB7XG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0UG9zaXRpb24nLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZVJhZGl1czoge1xuICAgICAgICBzaXplOiAxLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldFJhZGl1cycsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogMSxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUmFkaXVzXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMuY29vcmRpbmF0ZVN5c3RlbSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HTEFUKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3c6IHtcbiAgICAgICAgICAgIHNpemU6IDIsXG4gICAgICAgICAgICBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJyxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoWydpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3cnXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgc3VwZXIudXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtyYWRpdXNTY2FsZSwgcmFkaXVzTWluUGl4ZWxzLCByYWRpdXNNYXhQaXhlbHMsIG91dGxpbmUsIHN0cm9rZVdpZHRofSA9IHRoaXMucHJvcHM7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIoXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgICBvdXRsaW5lOiBvdXRsaW5lID8gMSA6IDAsXG4gICAgICAgIHN0cm9rZVdpZHRoLFxuICAgICAgICByYWRpdXNTY2FsZSxcbiAgICAgICAgcmFkaXVzTWluUGl4ZWxzLFxuICAgICAgICByYWRpdXNNYXhQaXhlbHNcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIC8vIGEgc3F1YXJlIHRoYXQgbWluaW1hbGx5IGNvdmVyIHRoZSB1bml0IGNpcmNsZVxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFstMSwgLTEsIDAsIC0xLCAxLCAwLCAxLCAxLCAwLCAxLCAtMSwgMF07XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKFxuICAgICAgZ2wsXG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuZ2V0U2hhZGVycygpLCB7XG4gICAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgICBkcmF3TW9kZTogR0wuVFJJQU5HTEVfRkFOLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgaXNJbnN0YW5jZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMl0gfHwgMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0TG93UGFydChwb3NpdGlvblswXSk7XG4gICAgICB2YWx1ZVtpKytdID0gZnA2NExvd1BhcnQocG9zaXRpb25bMV0pO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUmFkaXVzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRSYWRpdXN9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHJhZGl1cyA9IGdldFJhZGl1cyhwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gaXNOYU4ocmFkaXVzKSA/IDEgOiByYWRpdXM7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKHBvaW50KSB8fCBERUZBVUxUX0NPTE9SO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yWzBdO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSsrXSA9IGlzTmFOKGNvbG9yWzNdKSA/IDI1NSA6IGNvbG9yWzNdO1xuICAgIH1cbiAgfVxufVxuXG5TY2F0dGVycGxvdExheWVyLmxheWVyTmFtZSA9ICdTY2F0dGVycGxvdExheWVyJztcblNjYXR0ZXJwbG90TGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19