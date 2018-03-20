'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _lineLayerVertex = require('./line-layer-vertex.glsl');

var _lineLayerVertex2 = _interopRequireDefault(_lineLayerVertex);

var _lineLayerVertex3 = require('./line-layer-vertex-64.glsl');

var _lineLayerVertex4 = _interopRequireDefault(_lineLayerVertex3);

var _lineLayerFragment = require('./line-layer-fragment.glsl');

var _lineLayerFragment2 = _interopRequireDefault(_lineLayerFragment);

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
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var LineLayer = function (_Layer) {
  _inherits(LineLayer, _Layer);

  function LineLayer() {
    _classCallCheck(this, LineLayer);

    return _possibleConstructorReturn(this, (LineLayer.__proto__ || Object.getPrototypeOf(LineLayer)).apply(this, arguments));
  }

  _createClass(LineLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: _lineLayerVertex4.default, fs: _lineLayerFragment2.default, modules: ['project64', 'picking'] } : { vs: _lineLayerVertex2.default, fs: _lineLayerFragment2.default, modules: ['picking'] }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();

      /* eslint-disable max-len */
      attributeManager.addInstanced({
        instanceSourcePositions: {
          size: 3,
          transition: true,
          accessor: 'getSourcePosition',
          update: this.calculateInstanceSourcePositions
        },
        instanceTargetPositions: {
          size: 3,
          transition: true,
          accessor: 'getTargetPosition',
          update: this.calculateInstanceTargetPositions
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
            instanceSourceTargetPositions64xyLow: {
              size: 4,
              accessor: ['getSourcePosition', 'getTargetPosition'],
              update: this.calculateInstanceSourceTargetPositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instanceSourceTargetPositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(LineLayer.prototype.__proto__ || Object.getPrototypeOf(LineLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

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
      /*
       *  (0, -1)-------------_(1, -1)
       *       |          _,-"  |
       *       o      _,-"      o
       *       |  _,-"          |
       *   (0, 1)"-------------(1, 1)
       */
      var positions = [0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0];

      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
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
    }
  }, {
    key: 'calculateInstanceSourcePositions',
    value: function calculateInstanceSourcePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getSourcePosition = _props.getSourcePosition;
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
          value[i + 0] = sourcePosition[0];
          value[i + 1] = sourcePosition[1];
          value[i + 2] = isNaN(sourcePosition[2]) ? 0 : sourcePosition[2];
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
    key: 'calculateInstanceTargetPositions',
    value: function calculateInstanceTargetPositions(attribute) {
      var _props2 = this.props,
          data = _props2.data,
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

          var targetPosition = getTargetPosition(object);
          value[i + 0] = targetPosition[0];
          value[i + 1] = targetPosition[1];
          value[i + 2] = isNaN(targetPosition[2]) ? 0 : targetPosition[2];
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
    key: 'calculateInstanceSourceTargetPositions64xyLow',
    value: function calculateInstanceSourceTargetPositions64xyLow(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getSourcePosition = _props3.getSourcePosition,
          getTargetPosition = _props3.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var sourcePosition = getSourcePosition(object);
          var targetPosition = getTargetPosition(object);
          value[i + 0] = fp64LowPart(sourcePosition[0]);
          value[i + 1] = fp64LowPart(sourcePosition[1]);
          value[i + 2] = fp64LowPart(targetPosition[0]);
          value[i + 3] = fp64LowPart(targetPosition[1]);
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
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var color = getColor(object);
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

  return LineLayer;
}(_core.Layer);

exports.default = LineLayer;


LineLayer.layerName = 'LineLayer';
LineLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9saW5lLWxheWVyL2xpbmUtbGF5ZXIuanMiXSwibmFtZXMiOlsiZnA2NExvd1BhcnQiLCJlbmFibGU2NGJpdFN1cHBvcnQiLCJERUZBVUxUX0NPTE9SIiwiZGVmYXVsdFByb3BzIiwic3Ryb2tlV2lkdGgiLCJmcDY0IiwiZ2V0U291cmNlUG9zaXRpb24iLCJ4Iiwic291cmNlUG9zaXRpb24iLCJnZXRUYXJnZXRQb3NpdGlvbiIsInRhcmdldFBvc2l0aW9uIiwiZ2V0Q29sb3IiLCJjb2xvciIsIkxpbmVMYXllciIsInByb3BzIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwiZ2V0QXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlU291cmNlUG9zaXRpb25zIiwic2l6ZSIsInRyYW5zaXRpb24iLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zIiwiaW5zdGFuY2VUYXJnZXRQb3NpdGlvbnMiLCJjYWxjdWxhdGVJbnN0YW5jZVRhcmdldFBvc2l0aW9ucyIsImluc3RhbmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwiY29vcmRpbmF0ZVN5c3RlbSIsIkxOR0xBVCIsImluc3RhbmNlU291cmNlVGFyZ2V0UG9zaXRpb25zNjR4eUxvdyIsImNhbGN1bGF0ZUluc3RhbmNlU291cmNlVGFyZ2V0UG9zaXRpb25zNjR4eUxvdyIsInJlbW92ZSIsImdsIiwiY29udGV4dCIsInNldFN0YXRlIiwibW9kZWwiLCJfZ2V0TW9kZWwiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsInN0YXRlIiwicmVuZGVyIiwiT2JqZWN0IiwiYXNzaWduIiwicG9zaXRpb25zIiwiZ2V0U2hhZGVycyIsImlkIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIlRSSUFOR0xFX1NUUklQIiwiYXR0cmlidXRlcyIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwic2hhZGVyQ2FjaGUiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJpIiwib2JqZWN0IiwiaXNOYU4iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFvQkE7O0FBRUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7OytlQTFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFHT0EsVyxzQkFBQUEsVztJQUFhQyxrQixzQkFBQUEsa0I7OztBQU9wQixJQUFNQyxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQXRCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLGVBQWEsQ0FETTtBQUVuQkMsUUFBTSxLQUZhOztBQUluQkMscUJBQW1CO0FBQUEsV0FBS0MsRUFBRUMsY0FBUDtBQUFBLEdBSkE7QUFLbkJDLHFCQUFtQjtBQUFBLFdBQUtGLEVBQUVHLGNBQVA7QUFBQSxHQUxBO0FBTW5CQyxZQUFVO0FBQUEsV0FBS0osRUFBRUssS0FBRixJQUFXVixhQUFoQjtBQUFBO0FBTlMsQ0FBckI7O0lBU3FCVyxTOzs7Ozs7Ozs7OztpQ0FDTjtBQUNYLGFBQU9aLG1CQUFtQixLQUFLYSxLQUF4QixJQUNILEVBQUNDLDZCQUFELEVBQVdDLCtCQUFYLEVBQWVDLFNBQVMsQ0FBQyxXQUFELEVBQWMsU0FBZCxDQUF4QixFQURHLEdBRUgsRUFBQ0YsNkJBQUQsRUFBS0MsK0JBQUwsRUFBU0MsU0FBUyxDQUFDLFNBQUQsQ0FBbEIsRUFGSixDQURXLENBR3lCO0FBQ3JDOzs7c0NBRWlCO0FBQ2hCLFVBQU1DLG1CQUFtQixLQUFLQyxtQkFBTCxFQUF6Qjs7QUFFQTtBQUNBRCx1QkFBaUJFLFlB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QUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWWxDOzs7Ozs7a0JBekprQlQsUzs7O0FBNEpyQkEsVUFBVXVELFNBQVYsR0FBc0IsV0FBdEI7QUFDQXZELFVBQVVWLFlBQVYsR0FBeUJBLFlBQXpCIiwiZmlsZSI6ImxpbmUtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtDT09SRElOQVRFX1NZU1RFTSwgTGF5ZXIsIGV4cGVyaW1lbnRhbH0gZnJvbSAnLi4vLi4vY29yZSc7XG5jb25zdCB7ZnA2NExvd1BhcnQsIGVuYWJsZTY0Yml0U3VwcG9ydH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnl9IGZyb20gJ2x1bWEuZ2wnO1xuXG5pbXBvcnQgdnMgZnJvbSAnLi9saW5lLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCB2czY0IGZyb20gJy4vbGluZS1sYXllci12ZXJ0ZXgtNjQuZ2xzbCc7XG5pbXBvcnQgZnMgZnJvbSAnLi9saW5lLWxheWVyLWZyYWdtZW50Lmdsc2wnO1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzAsIDAsIDAsIDI1NV07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgc3Ryb2tlV2lkdGg6IDEsXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIGdldFNvdXJjZVBvc2l0aW9uOiB4ID0+IHguc291cmNlUG9zaXRpb24sXG4gIGdldFRhcmdldFBvc2l0aW9uOiB4ID0+IHgudGFyZ2V0UG9zaXRpb24sXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUlxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGluZUxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKCkge1xuICAgIHJldHVybiBlbmFibGU2NGJpdFN1cHBvcnQodGhpcy5wcm9wcylcbiAgICAgID8ge3ZzOiB2czY0LCBmcywgbW9kdWxlczogWydwcm9qZWN0NjQnLCAncGlja2luZyddfVxuICAgICAgOiB7dnMsIGZzLCBtb2R1bGVzOiBbJ3BpY2tpbmcnXX07IC8vICdwcm9qZWN0JyBtb2R1bGUgYWRkZWQgYnkgZGVmYXVsdC5cbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VTb3VyY2VQb3NpdGlvbnM6IHtcbiAgICAgICAgc2l6ZTogMyxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRTb3VyY2VQb3NpdGlvbicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9uc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlVGFyZ2V0UG9zaXRpb25zOiB7XG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0VGFyZ2V0UG9zaXRpb24nLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRQb3NpdGlvbnNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge1xuICAgICAgICBzaXplOiA0LFxuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldENvbG9yJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzXG4gICAgICB9XG4gICAgfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gIH1cblxuICB1cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAocHJvcHMuZnA2NCAmJiBwcm9wcy5jb29yZGluYXRlU3lzdGVtID09PSBDT09SRElOQVRFX1NZU1RFTS5MTkdMQVQpIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgICAgIGluc3RhbmNlU291cmNlVGFyZ2V0UG9zaXRpb25zNjR4eUxvdzoge1xuICAgICAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgICAgIGFjY2Vzc29yOiBbJ2dldFNvdXJjZVBvc2l0aW9uJywgJ2dldFRhcmdldFBvc2l0aW9uJ10sXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VUYXJnZXRQb3NpdGlvbnM2NHh5TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFsnaW5zdGFuY2VTb3VyY2VUYXJnZXRQb3NpdGlvbnM2NHh5TG93J10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtzdHJva2VXaWR0aH0gPSB0aGlzLnByb3BzO1xuXG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIoXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgICBzdHJva2VXaWR0aFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgLypcbiAgICAgKiAgKDAsIC0xKS0tLS0tLS0tLS0tLS1fKDEsIC0xKVxuICAgICAqICAgICAgIHwgICAgICAgICAgXywtXCIgIHxcbiAgICAgKiAgICAgICBvICAgICAgXywtXCIgICAgICBvXG4gICAgICogICAgICAgfCAgXywtXCIgICAgICAgICAgfFxuICAgICAqICAgKDAsIDEpXCItLS0tLS0tLS0tLS0tKDEsIDEpXG4gICAgICovXG4gICAgY29uc3QgcG9zaXRpb25zID0gWzAsIC0xLCAwLCAwLCAxLCAwLCAxLCAtMSwgMCwgMSwgMSwgMF07XG5cbiAgICByZXR1cm4gbmV3IE1vZGVsKFxuICAgICAgZ2wsXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFNoYWRlcnMoKSwge1xuICAgICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFX1NUUklQLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgaXNJbnN0YW5jZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHNvdXJjZVBvc2l0aW9uID0gZ2V0U291cmNlUG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IHNvdXJjZVBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSArIDFdID0gc291cmNlUG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpICsgMl0gPSBpc05hTihzb3VyY2VQb3NpdGlvblsyXSkgPyAwIDogc291cmNlUG9zaXRpb25bMl07XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFRhcmdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBnZXRUYXJnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gdGFyZ2V0UG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSB0YXJnZXRQb3NpdGlvblsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGlzTmFOKHRhcmdldFBvc2l0aW9uWzJdKSA/IDAgOiB0YXJnZXRQb3NpdGlvblsyXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVRhcmdldFBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFNvdXJjZVBvc2l0aW9uLCBnZXRUYXJnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IHNvdXJjZVBvc2l0aW9uID0gZ2V0U291cmNlUG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gZ2V0VGFyZ2V0UG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IGZwNjRMb3dQYXJ0KHNvdXJjZVBvc2l0aW9uWzBdKTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGZwNjRMb3dQYXJ0KHNvdXJjZVBvc2l0aW9uWzFdKTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGZwNjRMb3dQYXJ0KHRhcmdldFBvc2l0aW9uWzBdKTtcbiAgICAgIHZhbHVlW2kgKyAzXSA9IGZwNjRMb3dQYXJ0KHRhcmdldFBvc2l0aW9uWzFdKTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCk7XG4gICAgICB2YWx1ZVtpICsgMF0gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgdmFsdWVbaSArIDJdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpICsgM10gPSBpc05hTihjb2xvclszXSkgPyAyNTUgOiBjb2xvclszXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9XG4gIH1cbn1cblxuTGluZUxheWVyLmxheWVyTmFtZSA9ICdMaW5lTGF5ZXInO1xuTGluZUxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==