'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _arcLayerVertex = require('./arc-layer-vertex.glsl');

var _arcLayerVertex2 = _interopRequireDefault(_arcLayerVertex);

var _arcLayerVertex3 = require('./arc-layer-vertex-64.glsl');

var _arcLayerVertex4 = _interopRequireDefault(_arcLayerVertex3);

var _arcLayerFragment = require('./arc-layer-fragment.glsl');

var _arcLayerFragment2 = _interopRequireDefault(_arcLayerFragment);

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
  strokeWidth: 1,
  fp64: false,

  getSourcePosition: function getSourcePosition(x) {
    return x.sourcePosition;
  },
  getTargetPosition: function getTargetPosition(x) {
    return x.targetPosition;
  },
  getSourceColor: function getSourceColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  getTargetColor: function getTargetColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var ArcLayer = function (_Layer) {
  _inherits(ArcLayer, _Layer);

  function ArcLayer() {
    _classCallCheck(this, ArcLayer);

    return _possibleConstructorReturn(this, (ArcLayer.__proto__ || Object.getPrototypeOf(ArcLayer)).apply(this, arguments));
  }

  _createClass(ArcLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: _arcLayerVertex4.default, fs: _arcLayerFragment2.default, modules: ['project64', 'picking'] } : { vs: _arcLayerVertex2.default, fs: _arcLayerFragment2.default, modules: ['picking'] }; // 'project' module added by default.
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
          accessor: ['getSourcePosition', 'getTargetPosition'],
          update: this.calculateInstancePositions
        },
        instanceSourceColors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          transition: true,
          accessor: 'getSourceColor',
          update: this.calculateInstanceSourceColors
        },
        instanceTargetColors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          transition: true,
          accessor: 'getTargetColor',
          update: this.calculateInstanceTargetColors
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
            instancePositions64Low: {
              size: 4,
              accessor: ['getSourcePosition', 'getTargetPosition'],
              update: this.calculateInstancePositions64Low
            }
          });
        } else {
          attributeManager.remove(['instancePositions64Low']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(ArcLayer.prototype.__proto__ || Object.getPrototypeOf(ArcLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      // Re-generate model if geometry changed
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
      var strokeWidth = this.props.strokeWidth;


      this.state.model.render(Object.assign({}, uniforms, {
        strokeWidth: strokeWidth
      }));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var positions = [];
      var NUM_SEGMENTS = 50;
      /*
       *  (0, -1)-------------_(1, -1)
       *       |          _,-"  |
       *       o      _,-"      o
       *       |  _,-"          |
       *   (0, 1)"-------------(1, 1)
       */
      for (var i = 0; i < NUM_SEGMENTS; i++) {
        positions = positions.concat([i, -1, 0, i, 1, 0]);
      }

      var model = new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_STRIP,
          attributes: {
            positions: new Float32Array(positions)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));

      model.setUniforms({ numSegments: NUM_SEGMENTS });

      return model;
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getSourcePosition = _props.getSourcePosition,
          getTargetPosition = _props.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var sourcePosition = getSourcePosition(object);
          var targetPosition = getTargetPosition(object);
          value[i + 0] = sourcePosition[0];
          value[i + 1] = sourcePosition[1];
          value[i + 2] = targetPosition[0];
          value[i + 3] = targetPosition[1];
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
    key: 'calculateInstancePositions64Low',
    value: function calculateInstancePositions64Low(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getSourcePosition = _props2.getSourcePosition,
          getTargetPosition = _props2.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var sourcePosition = getSourcePosition(object);
          var targetPosition = getTargetPosition(object);
          value[i + 0] = fp64LowPart(sourcePosition[0]);
          value[i + 1] = fp64LowPart(sourcePosition[1]);
          value[i + 2] = fp64LowPart(targetPosition[0]);
          value[i + 3] = fp64LowPart(targetPosition[1]);
          i += size;
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
    key: 'calculateInstanceSourceColors',
    value: function calculateInstanceSourceColors(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getSourceColor = _props3.getSourceColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var color = getSourceColor(object);
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = isNaN(color[3]) ? 255 : color[3];
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
  }, {
    key: 'calculateInstanceTargetColors',
    value: function calculateInstanceTargetColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getTargetColor = _props4.getTargetColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var color = getTargetColor(object);
          value[i + 0] = color[0];
          value[i + 1] = color[1];
          value[i + 2] = color[2];
          value[i + 3] = isNaN(color[3]) ? 255 : color[3];
          i += size;
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

  return ArcLayer;
}(_core.Layer);

exports.default = ArcLayer;


ArcLayer.layerName = 'ArcLayer';
ArcLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9hcmMtbGF5ZXIvYXJjLWxheWVyLmpzIl0sIm5hbWVzIjpbImZwNjRMb3dQYXJ0IiwiZW5hYmxlNjRiaXRTdXBwb3J0IiwiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsInN0cm9rZVdpZHRoIiwiZnA2NCIsImdldFNvdXJjZVBvc2l0aW9uIiwieCIsInNvdXJjZVBvc2l0aW9uIiwiZ2V0VGFyZ2V0UG9zaXRpb24iLCJ0YXJnZXRQb3NpdGlvbiIsImdldFNvdXJjZUNvbG9yIiwiY29sb3IiLCJnZXRUYXJnZXRDb2xvciIsIkFyY0xheWVyIiwicHJvcHMiLCJ2cyIsImZzIiwibW9kdWxlcyIsImF0dHJpYnV0ZU1hbmFnZXIiLCJnZXRBdHRyaWJ1dGVNYW5hZ2VyIiwiYWRkSW5zdGFuY2VkIiwiaW5zdGFuY2VQb3NpdGlvbnMiLCJzaXplIiwidHJhbnNpdGlvbiIsImFjY2Vzc29yIiwidXBkYXRlIiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMiLCJpbnN0YW5jZVNvdXJjZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnMiLCJpbnN0YW5jZVRhcmdldENvbG9ycyIsImNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0Q29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImludmFsaWRhdGVBbGwiLCJjb29yZGluYXRlU3lzdGVtIiwiTE5HTEFUIiwiaW5zdGFuY2VQb3NpdGlvbnM2NExvdyIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zNjRMb3ciLCJyZW1vdmUiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwidXBkYXRlQXR0cmlidXRlIiwidW5pZm9ybXMiLCJzdGF0ZSIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsInBvc2l0aW9ucyIsIk5VTV9TRUdNRU5UUyIsImkiLCJjb25jYXQiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfU1RSSVAiLCJhdHRyaWJ1dGVzIiwiRmxvYXQzMkFycmF5IiwiaXNJbnN0YW5jZWQiLCJzaGFkZXJDYWNoZSIsInNldFVuaWZvcm1zIiwibnVtU2VnbWVudHMiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJvYmplY3QiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFHQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQSxXLHNCQUFBQSxXO0lBQWFDLGtCLHNCQUFBQSxrQjs7O0FBUXBCLElBQU1DLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsZUFBYSxDQURNO0FBRW5CQyxRQUFNLEtBRmE7O0FBSW5CQyxxQkFBbUI7QUFBQSxXQUFLQyxFQUFFQyxjQUFQO0FBQUEsR0FKQTtBQUtuQkMscUJBQW1CO0FBQUEsV0FBS0YsRUFBRUcsY0FBUDtBQUFBLEdBTEE7QUFNbkJDLGtCQUFnQjtBQUFBLFdBQUtKLEVBQUVLLEtBQUYsSUFBV1YsYUFBaEI7QUFBQSxHQU5HO0FBT25CVyxrQkFBZ0I7QUFBQSxXQUFLTixFQUFFSyxLQUFGLElBQVdWLGFBQWhCO0FBQUE7QUFQRyxDQUFyQjs7SUFVcUJZLFE7Ozs7Ozs7Ozs7O2lDQUNOO0FBQ1gsYUFBT2IsbUJBQW1CLEtBQUtjLEtBQXhCLElBQ0gsRUFBQ0MsNEJBQUQsRUFBV0MsOEJBQVgsRUFBZUMsU0FBUyxDQUFDLFdBQUQsRUFBYyxTQUFkLENBQXhCLEVBREcsR0FFSCxFQUFDRiw0QkFBRCxFQUFLQyw4QkFBTCxFQUFTQyxTQUFTLENBQUMsU0FB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LENBQVI7QUFIdUM7QUFBQTtBQUFBOztBQUFBO0FBSXZDLDhCQUFxQmMsSUFBckIsbUlBQTJCO0FBQUEsY0FBaEJFLE1BQWdCOztBQUN6QixjQUFNM0QsUUFBUUMsZUFBZTBELE1BQWYsQ0FBZDtBQUNBRCxnQkFBTWYsSUFBSSxDQUFWLElBQWUzQyxNQUFNLENBQU4sQ0FBZjtBQUNBMEQsZ0JBQU1mLElBQUksQ0FBVixJQUFlM0MsTUFBTSxDQUFOLENBQWY7QUFDQTBELGdCQUFNZixJQUFJLENBQVYsSUFBZTNDLE1BQU0sQ0FBTixDQUFmO0FBQ0EwRCxnQkFBTWYsSUFBSSxDQUFWLElBQWVpQixNQUFNNUQsTUFBTSxDQUFOLENBQU4sSUFBa0IsR0FBbEIsR0FBd0JBLE1BQU0sQ0FBTixDQUF2QztBQUNBMkMsZUFBS2hDLElBQUw7QUFDRDtBQVhzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWXhDOzs7Ozs7a0JBcktrQlQsUTs7O0FBd0tyQkEsU0FBUzJELFNBQVQsR0FBcUIsVUFBckI7QUFDQTNELFNBQVNYLFlBQVQsR0FBd0JBLFlBQXhCIiwiZmlsZSI6ImFyYy1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNLCBMYXllciwgZXhwZXJpbWVudGFsfSBmcm9tICcuLi8uLi9jb3JlJztcbmNvbnN0IHtmcDY0TG93UGFydCwgZW5hYmxlNjRiaXRTdXBwb3J0fSA9IGV4cGVyaW1lbnRhbDtcblxuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vYXJjLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCB2czY0IGZyb20gJy4vYXJjLWxheWVyLXZlcnRleC02NC5nbHNsJztcbmltcG9ydCBmcyBmcm9tICcuL2FyYy1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHN0cm9rZVdpZHRoOiAxLFxuICBmcDY0OiBmYWxzZSxcblxuICBnZXRTb3VyY2VQb3NpdGlvbjogeCA9PiB4LnNvdXJjZVBvc2l0aW9uLFxuICBnZXRUYXJnZXRQb3NpdGlvbjogeCA9PiB4LnRhcmdldFBvc2l0aW9uLFxuICBnZXRTb3VyY2VDb2xvcjogeCA9PiB4LmNvbG9yIHx8IERFRkFVTFRfQ09MT1IsXG4gIGdldFRhcmdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUlxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJjTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIGVuYWJsZTY0Yml0U3VwcG9ydCh0aGlzLnByb3BzKVxuICAgICAgPyB7dnM6IHZzNjQsIGZzLCBtb2R1bGVzOiBbJ3Byb2plY3Q2NCcsICdwaWNraW5nJ119XG4gICAgICA6IHt2cywgZnMsIG1vZHVsZXM6IFsncGlja2luZyddfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge1xuICAgICAgICBzaXplOiA0LFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogWydnZXRTb3VyY2VQb3NpdGlvbicsICdnZXRUYXJnZXRQb3NpdGlvbiddLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZVNvdXJjZUNvbG9yczoge1xuICAgICAgICBzaXplOiA0LFxuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldFNvdXJjZUNvbG9yJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlU291cmNlQ29sb3JzXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VUYXJnZXRDb2xvcnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRUYXJnZXRDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVRhcmdldENvbG9yc1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMuY29vcmRpbmF0ZVN5c3RlbSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HTEFUKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0TG93OiB7XG4gICAgICAgICAgICBzaXplOiA0LFxuICAgICAgICAgICAgYWNjZXNzb3I6IFsnZ2V0U291cmNlUG9zaXRpb24nLCAnZ2V0VGFyZ2V0UG9zaXRpb24nXSxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFsnaW5zdGFuY2VQb3NpdGlvbnM2NExvdyddKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIC8vIFJlLWdlbmVyYXRlIG1vZGVsIGlmIGdlb21ldHJ5IGNoYW5nZWRcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtzdHJva2VXaWR0aH0gPSB0aGlzLnByb3BzO1xuXG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIoXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgICBzdHJva2VXaWR0aFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgbGV0IHBvc2l0aW9ucyA9IFtdO1xuICAgIGNvbnN0IE5VTV9TRUdNRU5UUyA9IDUwO1xuICAgIC8qXG4gICAgICogICgwLCAtMSktLS0tLS0tLS0tLS0tXygxLCAtMSlcbiAgICAgKiAgICAgICB8ICAgICAgICAgIF8sLVwiICB8XG4gICAgICogICAgICAgbyAgICAgIF8sLVwiICAgICAgb1xuICAgICAqICAgICAgIHwgIF8sLVwiICAgICAgICAgIHxcbiAgICAgKiAgICgwLCAxKVwiLS0tLS0tLS0tLS0tLSgxLCAxKVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTlVNX1NFR01FTlRTOyBpKyspIHtcbiAgICAgIHBvc2l0aW9ucyA9IHBvc2l0aW9ucy5jb25jYXQoW2ksIC0xLCAwLCBpLCAxLCAwXSk7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kZWwgPSBuZXcgTW9kZWwoXG4gICAgICBnbCxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U2hhZGVycygpLCB7XG4gICAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgICBkcmF3TW9kZTogR0wuVFJJQU5HTEVfU1RSSVAsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucylcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBpc0luc3RhbmNlZDogdHJ1ZSxcbiAgICAgICAgc2hhZGVyQ2FjaGU6IHRoaXMuY29udGV4dC5zaGFkZXJDYWNoZVxuICAgICAgfSlcbiAgICApO1xuXG4gICAgbW9kZWwuc2V0VW5pZm9ybXMoe251bVNlZ21lbnRzOiBOVU1fU0VHTUVOVFN9KTtcblxuICAgIHJldHVybiBtb2RlbDtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbiwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IGdldFNvdXJjZVBvc2l0aW9uKG9iamVjdCk7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IGdldFRhcmdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBzb3VyY2VQb3NpdGlvblswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IHNvdXJjZVBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gdGFyZ2V0UG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgM10gPSB0YXJnZXRQb3NpdGlvblsxXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbiwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IGdldFNvdXJjZVBvc2l0aW9uKG9iamVjdCk7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IGdldFRhcmdldFBvc2l0aW9uKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBmcDY0TG93UGFydChzb3VyY2VQb3NpdGlvblswXSk7XG4gICAgICB2YWx1ZVtpICsgMV0gPSBmcDY0TG93UGFydChzb3VyY2VQb3NpdGlvblsxXSk7XG4gICAgICB2YWx1ZVtpICsgMl0gPSBmcDY0TG93UGFydCh0YXJnZXRQb3NpdGlvblswXSk7XG4gICAgICB2YWx1ZVtpICsgM10gPSBmcDY0TG93UGFydCh0YXJnZXRQb3NpdGlvblsxXSk7XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFNvdXJjZUNvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRTb3VyY2VDb2xvcihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gaXNOYU4oY29sb3JbM10pID8gMjU1IDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRDb2xvcnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFRhcmdldENvbG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRUYXJnZXRDb2xvcihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gaXNOYU4oY29sb3JbM10pID8gMjU1IDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG59XG5cbkFyY0xheWVyLmxheWVyTmFtZSA9ICdBcmNMYXllcic7XG5BcmNMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=