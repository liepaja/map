'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _screenGridLayerVertex = require('./screen-grid-layer-vertex.glsl');

var _screenGridLayerVertex2 = _interopRequireDefault(_screenGridLayerVertex);

var _screenGridLayerFragment = require('./screen-grid-layer-fragment.glsl');

var _screenGridLayerFragment2 = _interopRequireDefault(_screenGridLayerFragment);

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

var defaultProps = {
  cellSizePixels: 100,

  // Color range?
  minColor: [0, 0, 0, 255],
  maxColor: [0, 255, 0, 255],

  getPosition: function getPosition(d) {
    return d.position;
  },
  getWeight: function getWeight(d) {
    return 1;
  }
};

var ScreenGridLayer = function (_Layer) {
  _inherits(ScreenGridLayer, _Layer);

  function ScreenGridLayer() {
    _classCallCheck(this, ScreenGridLayer);

    return _possibleConstructorReturn(this, (ScreenGridLayer.__proto__ || Object.getPrototypeOf(ScreenGridLayer)).apply(this, arguments));
  }

  _createClass(ScreenGridLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return { vs: _screenGridLayerVertex2.default, fs: _screenGridLayerFragment2.default, modules: ['picking'] }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      var gl = this.context.gl;

      /* eslint-disable max-len */

      attributeManager.addInstanced({
        instancePositions: { size: 3, update: this.calculateInstancePositions },
        instanceCount: {
          size: 1,
          accessor: ['getPosition', 'getWeight'],
          update: this.calculateInstanceCount
        }
      });
      /* eslint-disable max-len */

      this.setState({ model: this._getModel(gl) });
    }
  }, {
    key: 'shouldUpdateState',
    value: function shouldUpdateState(_ref) {
      var changeFlags = _ref.changeFlags;

      return changeFlags.somethingChanged;
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      _get(ScreenGridLayer.prototype.__proto__ || Object.getPrototypeOf(ScreenGridLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      var cellSizeChanged = props.cellSizePixels !== oldProps.cellSizePixels;

      if (cellSizeChanged || changeFlags.viewportChanged) {
        this.updateCell();
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          minColor = _props.minColor,
          maxColor = _props.maxColor,
          _props$parameters = _props.parameters,
          parameters = _props$parameters === undefined ? {} : _props$parameters;
      var _state = this.state,
          model = _state.model,
          cellScale = _state.cellScale,
          maxCount = _state.maxCount;

      uniforms = Object.assign({}, uniforms, { minColor: minColor, maxColor: maxColor, cellScale: cellScale, maxCount: maxCount });
      model.draw({
        uniforms: uniforms,
        parameters: Object.assign({
          depthTest: false,
          depthMask: false
        }, parameters)
      });
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          attributes: {
            vertices: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'updateCell',
    value: function updateCell() {
      var _context$viewport = this.context.viewport,
          width = _context$viewport.width,
          height = _context$viewport.height;
      var cellSizePixels = this.props.cellSizePixels;


      var MARGIN = 2;
      var cellScale = new Float32Array([(cellSizePixels - MARGIN) / width * 2, -(cellSizePixels - MARGIN) / height * 2, 1]);
      var numCol = Math.ceil(width / cellSizePixels);
      var numRow = Math.ceil(height / cellSizePixels);

      this.setState({
        cellScale: cellScale,
        numCol: numCol,
        numRow: numRow,
        numInstances: numCol * numRow
      });

      var attributeManager = this.getAttributeManager();
      attributeManager.invalidateAll();
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute, _ref4) {
      var numInstances = _ref4.numInstances;
      var _context$viewport2 = this.context.viewport,
          width = _context$viewport2.width,
          height = _context$viewport2.height;
      var cellSizePixels = this.props.cellSizePixels;
      var numCol = this.state.numCol;
      var value = attribute.value,
          size = attribute.size;


      for (var i = 0; i < numInstances; i++) {
        var x = i % numCol;
        var y = Math.floor(i / numCol);
        value[i * size + 0] = x * cellSizePixels / width * 2 - 1;
        value[i * size + 1] = 1 - y * cellSizePixels / height * 2;
        value[i * size + 2] = 0;
      }
    }
  }, {
    key: 'calculateInstanceCount',
    value: function calculateInstanceCount(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          cellSizePixels = _props2.cellSizePixels,
          getPosition = _props2.getPosition,
          getWeight = _props2.getWeight;
      var _state2 = this.state,
          numCol = _state2.numCol,
          numRow = _state2.numRow;
      var value = attribute.value;

      var maxCount = 0;

      value.fill(0.0);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var pixel = this.project(getPosition(point));
          var colId = Math.floor(pixel[0] / cellSizePixels);
          var rowId = Math.floor(pixel[1] / cellSizePixels);
          if (colId >= 0 && colId < numCol && rowId >= 0 && rowId < numRow) {
            var i = colId + rowId * numCol;
            value[i] += getWeight(point);
            if (value[i] > maxCount) {
              maxCount = value[i];
            }
          }
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

      this.setState({ maxCount: maxCount });
    }
  }]);

  return ScreenGridLayer;
}(_core.Layer);

exports.default = ScreenGridLayer;


ScreenGridLayer.layerName = 'ScreenGridLayer';
ScreenGridLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9zY3JlZW4tZ3JpZC1sYXllci9zY3JlZW4tZ3JpZC1sYXllci5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0UHJvcHMiLCJjZWxsU2l6ZVBpeGVscyIsIm1pbkNvbG9yIiwibWF4Q29sb3IiLCJnZXRQb3NpdGlvbiIsImQiLCJwb3NpdGlvbiIsImdldFdlaWdodCIsIlNjcmVlbkdyaWRMYXllciIsInZzIiwiZnMiLCJtb2R1bGVzIiwiYXR0cmlidXRlTWFuYWdlciIsImdldEF0dHJpYnV0ZU1hbmFnZXIiLCJnbCIsImNvbnRleHQiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsInNpemUiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyIsImluc3RhbmNlQ291bnQiLCJhY2Nlc3NvciIsImNhbGN1bGF0ZUluc3RhbmNlQ291bnQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwiY2hhbmdlRmxhZ3MiLCJzb21ldGhpbmdDaGFuZ2VkIiwib2xkUHJvcHMiLCJwcm9wcyIsImNlbGxTaXplQ2hhbmdlZCIsInZpZXdwb3J0Q2hhbmdlZCIsInVwZGF0ZUNlbGwiLCJ1bmlmb3JtcyIsInBhcmFtZXRlcnMiLCJzdGF0ZSIsImNlbGxTY2FsZSIsIm1heENvdW50IiwiT2JqZWN0IiwiYXNzaWduIiwiZHJhdyIsImRlcHRoVGVzdCIsImRlcHRoTWFzayIsImdldFNoYWRlcnMiLCJpZCIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJUUklBTkdMRV9GQU4iLCJhdHRyaWJ1dGVzIiwidmVydGljZXMiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsInNoYWRlckNhY2hlIiwidmlld3BvcnQiLCJ3aWR0aCIsImhlaWdodCIsIk1BUkdJTiIsIm51bUNvbCIsIk1hdGgiLCJjZWlsIiwibnVtUm93IiwibnVtSW5zdGFuY2VzIiwiaW52YWxpZGF0ZUFsbCIsImF0dHJpYnV0ZSIsInZhbHVlIiwiaSIsIngiLCJ5IiwiZmxvb3IiLCJkYXRhIiwiZmlsbCIsInBvaW50IiwicGl4ZWwiLCJwcm9qZWN0IiwiY29sSWQiLCJyb3dJZCIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQW9CQTs7QUFDQTs7QUFFQTs7OztBQUNBOzs7Ozs7Ozs7OytlQXhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFRQSxJQUFNQSxlQUFlO0FBQ25CQyxrQkFBZ0IsR0FERzs7QUFHbkI7QUFDQUMsWUFBVSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FKUztBQUtuQkMsWUFBVSxDQUFDLENBQUQsRUFBSSxHQUFKLEVBQVMsQ0FBVCxFQUFZLEdBQVosQ0FMUzs7QUFPbkJDLGVBQWE7QUFBQSxXQUFLQyxFQUFFQyxRQUFQO0FBQUEsR0FQTTtBQVFuQkMsYUFBVztBQUFBLFdBQUssQ0FBTDtBQUFBO0FBUlEsQ0FBckI7O0lBV3FCQyxlOzs7Ozs7Ozs7OztpQ0FDTjtBQUNYLGFBQU8sRUFBQ0MsbUNBQUQsRUFBS0MscUNBQUwsRUFBU0MsU0FBUyxDQUFDLFNBQUQsQ0FBbEIsRUFBUCxDQURXLENBQzRCO0FBQ3hDOzs7c0NBRWlCO0FBQ2hCLFVBQU1DLG1CQUFtQixLQUFLQyxtQkFBTCxFQUF6QjtBQURnQixVQUVUQyxFQUZTLEdBRUgsS0FBS0MsT0FGRixDQUVURCxFQUZTOztBQUloQjs7QUFDQUYsdUJBQWlCSSxZQUFqQixDQUE4QjtBQUM1QkMsMkJBQW1CLEVBQUNDLE1BQU0sQ0FBUCxFQUFVQyxRQUFRLEtBQUtDLDBCQUF2QixFQURTO0FBRTVCQyx1QkFBZTtBQUNiSCxnQkFBTSxDQURPO0FBRWJJLG9CQUFVLENBQUMsYUFBRCxFQUFnQixXQUFoQixDQUZHO0FBR2JILGtCQUFRLEtBQUtJO0FBSEE7QUFGYSxPQUE5QjtBQVFBOztBQUVBLFdBQUtDLFFB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QXFCaEMsV0FBSzFDLFFBQUwsQ0FBYyxFQUFDYyxrQkFBRCxFQUFkO0FBQ0Q7Ozs7OztrQkFsSWtCOUIsZTs7O0FBcUlyQkEsZ0JBQWdCcUUsU0FBaEIsR0FBNEIsaUJBQTVCO0FBQ0FyRSxnQkFBZ0JSLFlBQWhCLEdBQStCQSxZQUEvQiIsImZpbGUiOiJzY3JlZW4tZ3JpZC1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyfSBmcm9tICcuLi8uLi9jb3JlJztcbmltcG9ydCB7R0wsIE1vZGVsLCBHZW9tZXRyeX0gZnJvbSAnbHVtYS5nbCc7XG5cbmltcG9ydCB2cyBmcm9tICcuL3NjcmVlbi1ncmlkLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCBmcyBmcm9tICcuL3NjcmVlbi1ncmlkLWxheWVyLWZyYWdtZW50Lmdsc2wnO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIGNlbGxTaXplUGl4ZWxzOiAxMDAsXG5cbiAgLy8gQ29sb3IgcmFuZ2U/XG4gIG1pbkNvbG9yOiBbMCwgMCwgMCwgMjU1XSxcbiAgbWF4Q29sb3I6IFswLCAyNTUsIDAsIDI1NV0sXG5cbiAgZ2V0UG9zaXRpb246IGQgPT4gZC5wb3NpdGlvbixcbiAgZ2V0V2VpZ2h0OiBkID0+IDFcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjcmVlbkdyaWRMYXllciBleHRlbmRzIExheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICByZXR1cm4ge3ZzLCBmcywgbW9kdWxlczogWydwaWNraW5nJ119OyAvLyAncHJvamVjdCcgbW9kdWxlIGFkZGVkIGJ5IGRlZmF1bHQuXG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3QgYXR0cmlidXRlTWFuYWdlciA9IHRoaXMuZ2V0QXR0cmlidXRlTWFuYWdlcigpO1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtzaXplOiAzLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VDb3VudDoge1xuICAgICAgICBzaXplOiAxLFxuICAgICAgICBhY2Nlc3NvcjogWydnZXRQb3NpdGlvbicsICdnZXRXZWlnaHQnXSxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ291bnRcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbiAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG4gIH1cblxuICBzaG91bGRVcGRhdGVTdGF0ZSh7Y2hhbmdlRmxhZ3N9KSB7XG4gICAgcmV0dXJuIGNoYW5nZUZsYWdzLnNvbWV0aGluZ0NoYW5nZWQ7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIGNvbnN0IGNlbGxTaXplQ2hhbmdlZCA9IHByb3BzLmNlbGxTaXplUGl4ZWxzICE9PSBvbGRQcm9wcy5jZWxsU2l6ZVBpeGVscztcblxuICAgIGlmIChjZWxsU2l6ZUNoYW5nZWQgfHwgY2hhbmdlRmxhZ3Mudmlld3BvcnRDaGFuZ2VkKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNlbGwoKTtcbiAgICB9XG4gIH1cblxuICBkcmF3KHt1bmlmb3Jtc30pIHtcbiAgICBjb25zdCB7bWluQ29sb3IsIG1heENvbG9yLCBwYXJhbWV0ZXJzID0ge319ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7bW9kZWwsIGNlbGxTY2FsZSwgbWF4Q291bnR9ID0gdGhpcy5zdGF0ZTtcbiAgICB1bmlmb3JtcyA9IE9iamVjdC5hc3NpZ24oe30sIHVuaWZvcm1zLCB7bWluQ29sb3IsIG1heENvbG9yLCBjZWxsU2NhbGUsIG1heENvdW50fSk7XG4gICAgbW9kZWwuZHJhdyh7XG4gICAgICB1bmlmb3JtcyxcbiAgICAgIHBhcmFtZXRlcnM6IE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHtcbiAgICAgICAgICBkZXB0aFRlc3Q6IGZhbHNlLFxuICAgICAgICAgIGRlcHRoTWFzazogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgcGFyYW1ldGVyc1xuICAgICAgKVxuICAgIH0pO1xuICB9XG5cbiAgX2dldE1vZGVsKGdsKSB7XG4gICAgcmV0dXJuIG5ldyBNb2RlbChcbiAgICAgIGdsLFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTaGFkZXJzKCksIHtcbiAgICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRV9GQU4sXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgdmVydGljZXM6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDEsIDAsIDAsIDEsIDEsIDAsIDAsIDEsIDBdKVxuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIGlzSW5zdGFuY2VkOiB0cnVlLFxuICAgICAgICBzaGFkZXJDYWNoZTogdGhpcy5jb250ZXh0LnNoYWRlckNhY2hlXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICB1cGRhdGVDZWxsKCkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuY29udGV4dC52aWV3cG9ydDtcbiAgICBjb25zdCB7Y2VsbFNpemVQaXhlbHN9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IE1BUkdJTiA9IDI7XG4gICAgY29uc3QgY2VsbFNjYWxlID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAoY2VsbFNpemVQaXhlbHMgLSBNQVJHSU4pIC8gd2lkdGggKiAyLFxuICAgICAgLShjZWxsU2l6ZVBpeGVscyAtIE1BUkdJTikgLyBoZWlnaHQgKiAyLFxuICAgICAgMVxuICAgIF0pO1xuICAgIGNvbnN0IG51bUNvbCA9IE1hdGguY2VpbCh3aWR0aCAvIGNlbGxTaXplUGl4ZWxzKTtcbiAgICBjb25zdCBudW1Sb3cgPSBNYXRoLmNlaWwoaGVpZ2h0IC8gY2VsbFNpemVQaXhlbHMpO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjZWxsU2NhbGUsXG4gICAgICBudW1Db2wsXG4gICAgICBudW1Sb3csXG4gICAgICBudW1JbnN0YW5jZXM6IG51bUNvbCAqIG51bVJvd1xuICAgIH0pO1xuXG4gICAgY29uc3QgYXR0cmlidXRlTWFuYWdlciA9IHRoaXMuZ2V0QXR0cmlidXRlTWFuYWdlcigpO1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMoYXR0cmlidXRlLCB7bnVtSW5zdGFuY2VzfSkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IHRoaXMuY29udGV4dC52aWV3cG9ydDtcbiAgICBjb25zdCB7Y2VsbFNpemVQaXhlbHN9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7bnVtQ29sfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtSW5zdGFuY2VzOyBpKyspIHtcbiAgICAgIGNvbnN0IHggPSBpICUgbnVtQ29sO1xuICAgICAgY29uc3QgeSA9IE1hdGguZmxvb3IoaSAvIG51bUNvbCk7XG4gICAgICB2YWx1ZVtpICogc2l6ZSArIDBdID0geCAqIGNlbGxTaXplUGl4ZWxzIC8gd2lkdGggKiAyIC0gMTtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMV0gPSAxIC0geSAqIGNlbGxTaXplUGl4ZWxzIC8gaGVpZ2h0ICogMjtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMl0gPSAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ291bnQoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGNlbGxTaXplUGl4ZWxzLCBnZXRQb3NpdGlvbiwgZ2V0V2VpZ2h0fSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge251bUNvbCwgbnVtUm93fSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgbWF4Q291bnQgPSAwO1xuXG4gICAgdmFsdWUuZmlsbCgwLjApO1xuXG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwaXhlbCA9IHRoaXMucHJvamVjdChnZXRQb3NpdGlvbihwb2ludCkpO1xuICAgICAgY29uc3QgY29sSWQgPSBNYXRoLmZsb29yKHBpeGVsWzBdIC8gY2VsbFNpemVQaXhlbHMpO1xuICAgICAgY29uc3Qgcm93SWQgPSBNYXRoLmZsb29yKHBpeGVsWzFdIC8gY2VsbFNpemVQaXhlbHMpO1xuICAgICAgaWYgKGNvbElkID49IDAgJiYgY29sSWQgPCBudW1Db2wgJiYgcm93SWQgPj0gMCAmJiByb3dJZCA8IG51bVJvdykge1xuICAgICAgICBjb25zdCBpID0gY29sSWQgKyByb3dJZCAqIG51bUNvbDtcbiAgICAgICAgdmFsdWVbaV0gKz0gZ2V0V2VpZ2h0KHBvaW50KTtcbiAgICAgICAgaWYgKHZhbHVlW2ldID4gbWF4Q291bnQpIHtcbiAgICAgICAgICBtYXhDb3VudCA9IHZhbHVlW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7bWF4Q291bnR9KTtcbiAgfVxufVxuXG5TY3JlZW5HcmlkTGF5ZXIubGF5ZXJOYW1lID0gJ1NjcmVlbkdyaWRMYXllcic7XG5TY3JlZW5HcmlkTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19