'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _deck = require('deck.gl');

var _luma = require('luma.gl');

var _bezierCurveLayerVertex = require('./bezier-curve-layer-vertex.glsl');

var _bezierCurveLayerVertex2 = _interopRequireDefault(_bezierCurveLayerVertex);

var _bezierCurveLayerFragment = require('./bezier-curve-layer-fragment.glsl');

var _bezierCurveLayerFragment2 = _interopRequireDefault(_bezierCurveLayerFragment);

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

var fp64LowPart = _deck.experimental.fp64LowPart;


var NUM_SEGMENTS = 40;
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
  getControlPoint: function getControlPoint(x) {
    return x.controlPoint;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  }
};

var BezierCurveLayer = function (_Layer) {
  _inherits(BezierCurveLayer, _Layer);

  function BezierCurveLayer() {
    _classCallCheck(this, BezierCurveLayer);

    return _possibleConstructorReturn(this, (BezierCurveLayer.__proto__ || Object.getPrototypeOf(BezierCurveLayer)).apply(this, arguments));
  }

  _createClass(BezierCurveLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return { vs: _bezierCurveLayerVertex2.default, fs: _bezierCurveLayerFragment2.default, modules: ['picking'] };
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.state.attributeManager;

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
        instanceControlPoints: {
          size: 3,
          transition: false,
          accessor: 'getControlPoint',
          update: this.calculateInstanceControlPoints
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
        var attributeManager = this.state.attributeManager;

        attributeManager.invalidateAll();
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(BezierCurveLayer.prototype.__proto__ || Object.getPrototypeOf(BezierCurveLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

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
      var positions = [];
      for (var i = 0; i <= NUM_SEGMENTS; i++) {
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
    key: 'calculateInstanceSourcePositions',
    value: function calculateInstanceSourcePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getSourcePosition = _props.getSourcePosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      data.forEach(function (object) {
        var sourcePosition = getSourcePosition(object);
        value[i + 0] = sourcePosition[0];
        value[i + 1] = sourcePosition[1];
        value[i + 2] = isNaN(sourcePosition[2]) ? 0 : sourcePosition[2];
        i += size;
      });
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
      data.forEach(function (object) {
        var targetPosition = getTargetPosition(object);
        value[i + 0] = targetPosition[0];
        value[i + 1] = targetPosition[1];
        value[i + 2] = isNaN(targetPosition[2]) ? 0 : targetPosition[2];
        i += size;
      });
    }
  }, {
    key: 'calculateInstanceControlPoints',
    value: function calculateInstanceControlPoints(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getControlPoint = _props3.getControlPoint;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      data.forEach(function (object) {
        var controlPoint = getControlPoint(object);
        value[i + 0] = controlPoint[0];
        value[i + 1] = controlPoint[1];
        value[i + 2] = isNaN(controlPoint[2]) ? 0 : controlPoint[2];
        i += size;
      });
    }
  }, {
    key: 'calculateInstanceSourceTargetPositions64xyLow',
    value: function calculateInstanceSourceTargetPositions64xyLow(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getSourcePosition = _props4.getSourcePosition,
          getTargetPosition = _props4.getTargetPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      data.forEach(function (object) {
        var sourcePosition = getSourcePosition(object);
        var targetPosition = getTargetPosition(object);
        value[i + 0] = fp64LowPart(sourcePosition[0]);
        value[i + 1] = fp64LowPart(sourcePosition[1]);
        value[i + 2] = fp64LowPart(targetPosition[0]);
        value[i + 3] = fp64LowPart(targetPosition[1]);
        i += size;
      });
    }
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props5 = this.props,
          data = _props5.data,
          getColor = _props5.getColor;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      data.forEach(function (object) {
        var color = getColor(object);
        value[i + 0] = color[0];
        value[i + 1] = color[1];
        value[i + 2] = color[2];
        value[i + 3] = isNaN(color[3]) ? 255 : color[3];
        i += size;
      });
    }
  }]);

  return BezierCurveLayer;
}(_deck.Layer);

exports.default = BezierCurveLayer;


BezierCurveLayer.layerName = 'BezierCurveLayer';
BezierCurveLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwtbGF5ZXJzL3NyYy9iZXppZXItY3VydmUtbGF5ZXIvYmV6aWVyLWN1cnZlLWxheWVyLmpzIl0sIm5hbWVzIjpbImZwNjRMb3dQYXJ0IiwiTlVNX1NFR01FTlRTIiwiREVGQVVMVF9DT0xPUiIsImRlZmF1bHRQcm9wcyIsInN0cm9rZVdpZHRoIiwiZnA2NCIsImdldFNvdXJjZVBvc2l0aW9uIiwieCIsInNvdXJjZVBvc2l0aW9uIiwiZ2V0VGFyZ2V0UG9zaXRpb24iLCJ0YXJnZXRQb3NpdGlvbiIsImdldENvbnRyb2xQb2ludCIsImNvbnRyb2xQb2ludCIsImdldENvbG9yIiwiY29sb3IiLCJCZXppZXJDdXJ2ZUxheWVyIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwic3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVNvdXJjZVBvc2l0aW9ucyIsInNpemUiLCJ0cmFuc2l0aW9uIiwiYWNjZXNzb3IiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9ucyIsImluc3RhbmNlVGFyZ2V0UG9zaXRpb25zIiwiY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRQb3NpdGlvbnMiLCJpbnN0YW5jZUNvbnRyb2xQb2ludHMiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbnRyb2xQb2ludHMiLCJpbnN0YW5jZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnMiLCJwcm9wcyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwiZ2wiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJtb2RlbCIsIl9nZXRNb2RlbCIsInVwZGF0ZUF0dHJpYnV0ZSIsInVuaWZvcm1zIiwicmVuZGVyIiwiT2JqZWN0IiwiYXNzaWduIiwicG9zaXRpb25zIiwiaSIsImNvbmNhdCIsImdldFNoYWRlcnMiLCJpZCIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJUUklBTkdMRV9TVFJJUCIsImF0dHJpYnV0ZXMiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsInNoYWRlckNhY2hlIiwic2V0VW5pZm9ybXMiLCJudW1TZWdtZW50cyIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImZvckVhY2giLCJvYmplY3QiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFFQTs7QUFFQTs7OztBQUNBOzs7Ozs7Ozs7OytlQXpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFHT0EsVyxzQkFBQUEsVzs7O0FBTVAsSUFBTUMsZUFBZSxFQUFyQjtBQUNBLElBQU1DLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsZUFBYSxDQURNO0FBRW5CQyxRQUFNLEtBRmE7QUFHbkJDLHFCQUFtQjtBQUFBLFdBQUtDLEVBQUVDLGNBQVA7QUFBQSxHQUhBO0FBSW5CQyxxQkFBbUI7QUFBQSxXQUFLRixFQUFFRyxjQUFQO0FBQUEsR0FKQTtBQUtuQkMsbUJBQWlCO0FBQUEsV0FBS0osRUFBRUssWUFBUDtBQUFBLEdBTEU7QUFNbkJDLFlBQVU7QUFBQSxXQUFLTixFQUFFTyxLQUFGLElBQVdaLGFBQWhCO0FBQUE7QUFOUyxDQUFyQjs7SUFTcUJhLGdCOzs7Ozs7Ozs7OztpQ0FDTjtBQUNYLGFBQU8sRUFBQ0Msb0NBQUQsRUFBS0Msc0NBQUwsRUFBU0MsU0FBUyxDQUFDLFNBQUQsQ0FBbEIsRUFBUDtBQUNEOzs7c0NBRWlCO0FBQUEsVUFDVEMsZ0JBRFMsR0FDVyxLQUFLQyxLQURoQixDQUNURCxnQkFEUzs7QUFHaEI7O0FBQ0FBLHVCQUFpQkUsWUFBakIsQ0FBOEI7QUFDNUJDLGlDQUF5QjtBQUN2QkMsZ0JB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T0FQRDtBQVFEOzs7Ozs7a0JBbktrQlIsZ0I7OztBQXNLckJBLGlCQUFpQnVELFNBQWpCLEdBQTZCLGtCQUE3QjtBQUNBdkQsaUJBQWlCWixZQUFqQixHQUFnQ0EsWUFBaEMiLCJmaWxlIjoiYmV6aWVyLWN1cnZlLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7TGF5ZXIsIGV4cGVyaW1lbnRhbH0gZnJvbSAnZGVjay5nbCc7XG5jb25zdCB7ZnA2NExvd1BhcnR9ID0gZXhwZXJpbWVudGFsO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vYmV6aWVyLWN1cnZlLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCBmcyBmcm9tICcuL2Jlemllci1jdXJ2ZS1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgTlVNX1NFR01FTlRTID0gNDA7XG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzAsIDAsIDAsIDI1NV07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgc3Ryb2tlV2lkdGg6IDEsXG4gIGZwNjQ6IGZhbHNlLFxuICBnZXRTb3VyY2VQb3NpdGlvbjogeCA9PiB4LnNvdXJjZVBvc2l0aW9uLFxuICBnZXRUYXJnZXRQb3NpdGlvbjogeCA9PiB4LnRhcmdldFBvc2l0aW9uLFxuICBnZXRDb250cm9sUG9pbnQ6IHggPT4geC5jb250cm9sUG9pbnQsXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUlxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmV6aWVyQ3VydmVMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge3ZzLCBmcywgbW9kdWxlczogWydwaWNraW5nJ119O1xuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VTb3VyY2VQb3NpdGlvbnM6IHtcbiAgICAgICAgc2l6ZTogMyxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRTb3VyY2VQb3NpdGlvbicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVNvdXJjZVBvc2l0aW9uc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlVGFyZ2V0UG9zaXRpb25zOiB7XG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0VGFyZ2V0UG9zaXRpb24nLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VUYXJnZXRQb3NpdGlvbnNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZUNvbnRyb2xQb2ludHM6IHtcbiAgICAgICAgc2l6ZTogMyxcbiAgICAgICAgdHJhbnNpdGlvbjogZmFsc2UsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0Q29udHJvbFBvaW50JyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29udHJvbFBvaW50c1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlQ29sb3JzOiB7XG4gICAgICAgIHNpemU6IDQsXG4gICAgICAgIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0Q29sb3InLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnNcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtzdHJva2VXaWR0aH0gPSB0aGlzLnByb3BzO1xuXG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIoXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgICBzdHJva2VXaWR0aFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgLypcbiAgICAgKiAgKDAsIC0xKS0tLS0tLS0tLS0tLS1fKDEsIC0xKVxuICAgICAqICAgICAgIHwgICAgICAgICAgXywtXCIgIHxcbiAgICAgKiAgICAgICBvICAgICAgXywtXCIgICAgICBvXG4gICAgICogICAgICAgfCAgXywtXCIgICAgICAgICAgfFxuICAgICAqICAgKDAsIDEpXCItLS0tLS0tLS0tLS0tKDEsIDEpXG4gICAgICovXG4gICAgbGV0IHBvc2l0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IE5VTV9TRUdNRU5UUzsgaSsrKSB7XG4gICAgICBwb3NpdGlvbnMgPSBwb3NpdGlvbnMuY29uY2F0KFtpLCAtMSwgMCwgaSwgMSwgMF0pO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsKFxuICAgICAgZ2wsXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFNoYWRlcnMoKSwge1xuICAgICAgICBpZDogdGhpcy5wcm9wcy5pZCxcbiAgICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgICAgZHJhd01vZGU6IEdMLlRSSUFOR0xFX1NUUklQLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgaXNJbnN0YW5jZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgICBtb2RlbC5zZXRVbmlmb3Jtcyh7bnVtU2VnbWVudHM6IE5VTV9TRUdNRU5UU30pO1xuICAgIHJldHVybiBtb2RlbDtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlU291cmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGRhdGEuZm9yRWFjaChvYmplY3QgPT4ge1xuICAgICAgY29uc3Qgc291cmNlUG9zaXRpb24gPSBnZXRTb3VyY2VQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gc291cmNlUG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBzb3VyY2VQb3NpdGlvblsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGlzTmFOKHNvdXJjZVBvc2l0aW9uWzJdKSA/IDAgOiBzb3VyY2VQb3NpdGlvblsyXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlVGFyZ2V0UG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRUYXJnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGRhdGEuZm9yRWFjaChvYmplY3QgPT4ge1xuICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSBnZXRUYXJnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gdGFyZ2V0UG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSB0YXJnZXRQb3NpdGlvblsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGlzTmFOKHRhcmdldFBvc2l0aW9uWzJdKSA/IDAgOiB0YXJnZXRQb3NpdGlvblsyXTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29udHJvbFBvaW50cyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29udHJvbFBvaW50fSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKG9iamVjdCA9PiB7XG4gICAgICBjb25zdCBjb250cm9sUG9pbnQgPSBnZXRDb250cm9sUG9pbnQob2JqZWN0KTtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IGNvbnRyb2xQb2ludFswXTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGNvbnRyb2xQb2ludFsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGlzTmFOKGNvbnRyb2xQb2ludFsyXSkgPyAwIDogY29udHJvbFBvaW50WzJdO1xuICAgICAgaSArPSBzaXplO1xuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VTb3VyY2VUYXJnZXRQb3NpdGlvbnM2NHh5TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTb3VyY2VQb3NpdGlvbiwgZ2V0VGFyZ2V0UG9zaXRpb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBkYXRhLmZvckVhY2gob2JqZWN0ID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZVBvc2l0aW9uID0gZ2V0U291cmNlUG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gZ2V0VGFyZ2V0UG9zaXRpb24ob2JqZWN0KTtcbiAgICAgIHZhbHVlW2kgKyAwXSA9IGZwNjRMb3dQYXJ0KHNvdXJjZVBvc2l0aW9uWzBdKTtcbiAgICAgIHZhbHVlW2kgKyAxXSA9IGZwNjRMb3dQYXJ0KHNvdXJjZVBvc2l0aW9uWzFdKTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGZwNjRMb3dQYXJ0KHRhcmdldFBvc2l0aW9uWzBdKTtcbiAgICAgIHZhbHVlW2kgKyAzXSA9IGZwNjRMb3dQYXJ0KHRhcmdldFBvc2l0aW9uWzFdKTtcbiAgICAgIGkgKz0gc2l6ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGRhdGEuZm9yRWFjaChvYmplY3QgPT4ge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihvYmplY3QpO1xuICAgICAgdmFsdWVbaSArIDBdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgdmFsdWVbaSArIDNdID0gaXNOYU4oY29sb3JbM10pID8gMjU1IDogY29sb3JbM107XG4gICAgICBpICs9IHNpemU7XG4gICAgfSk7XG4gIH1cbn1cblxuQmV6aWVyQ3VydmVMYXllci5sYXllck5hbWUgPSAnQmV6aWVyQ3VydmVMYXllcic7XG5CZXppZXJDdXJ2ZUxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==