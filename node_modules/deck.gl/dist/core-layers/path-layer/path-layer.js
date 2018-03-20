'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _pathLayerVertex = require('./path-layer-vertex.glsl');

var _pathLayerVertex2 = _interopRequireDefault(_pathLayerVertex);

var _pathLayerVertex3 = require('./path-layer-vertex-64.glsl');

var _pathLayerVertex4 = _interopRequireDefault(_pathLayerVertex3);

var _pathLayerFragment = require('./path-layer-fragment.glsl');

var _pathLayerFragment2 = _interopRequireDefault(_pathLayerFragment);

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
  widthScale: 1, // stroke width in meters
  widthMinPixels: 0, //  min stroke width in pixels
  widthMaxPixels: Number.MAX_SAFE_INTEGER, // max stroke width in pixels
  rounded: false,
  miterLimit: 4,
  fp64: false,
  dashJustified: false,

  getPath: function getPath(object) {
    return object.path;
  },
  getColor: function getColor(object) {
    return object.color || DEFAULT_COLOR;
  },
  getWidth: function getWidth(object) {
    return object.width || 1;
  },
  getDashArray: null
};

var isClosed = function isClosed(path) {
  var firstPoint = path[0];
  var lastPoint = path[path.length - 1];
  return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] && firstPoint[2] === lastPoint[2];
};

var PathLayer = function (_Layer) {
  _inherits(PathLayer, _Layer);

  function PathLayer() {
    _classCallCheck(this, PathLayer);

    return _possibleConstructorReturn(this, (PathLayer.__proto__ || Object.getPrototypeOf(PathLayer)).apply(this, arguments));
  }

  _createClass(PathLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: _pathLayerVertex4.default, fs: _pathLayerFragment2.default, modules: ['project64', 'picking'] } : { vs: _pathLayerVertex2.default, fs: _pathLayerFragment2.default, modules: ['picking'] }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      /* eslint-disable max-len */
      attributeManager.addInstanced({
        instanceStartPositions: { size: 3, update: this.calculateStartPositions },
        instanceEndPositions: { size: 3, update: this.calculateEndPositions },
        instanceLeftDeltas: { size: 3, update: this.calculateLeftDeltas },
        instanceRightDeltas: { size: 3, update: this.calculateRightDeltas },
        instanceStrokeWidths: { size: 1, accessor: 'getWidth', update: this.calculateStrokeWidths },
        instanceDashArrays: { size: 2, accessor: 'getDashArray', update: this.calculateDashArrays },
        instanceColors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          accessor: 'getColor',
          update: this.calculateColors
        },
        instancePickingColors: { size: 3, type: _luma.GL.UNSIGNED_BYTE, update: this.calculatePickingColors }
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
            instanceStartEndPositions64xyLow: {
              size: 4,
              update: this.calculateInstanceStartEndPositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instanceStartEndPositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      _get(PathLayer.prototype.__proto__ || Object.getPrototypeOf(PathLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var getPath = this.props.getPath;

      var attributeManager = this.getAttributeManager();
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });

      var geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPath);

      if (geometryChanged) {
        // this.state.paths only stores point positions in each path
        var paths = props.data.map(getPath);
        var numInstances = paths.reduce(function (count, path) {
          return count + path.length - 1;
        }, 0);

        this.setState({ paths: paths, numInstances: numInstances });
        attributeManager.invalidateAll();
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          rounded = _props.rounded,
          miterLimit = _props.miterLimit,
          widthScale = _props.widthScale,
          widthMinPixels = _props.widthMinPixels,
          widthMaxPixels = _props.widthMaxPixels,
          dashJustified = _props.dashJustified;


      this.state.model.render(Object.assign({}, uniforms, {
        jointType: Number(rounded),
        alignMode: Number(dashJustified),
        widthScale: widthScale,
        miterLimit: miterLimit,
        widthMinPixels: widthMinPixels,
        widthMaxPixels: widthMaxPixels
      }));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      /*
       *       _
       *        "-_ 1                   3                       5
       *     _     "o---------------------o-------------------_-o
       *       -   / ""--..__              '.             _.-' /
       *   _     "@- - - - - ""--..__- - - - x - - - -_.@'    /
       *    "-_  /                   ""--..__ '.  _,-` :     /
       *       "o----------------------------""-o'    :     /
       *      0,2                            4 / '.  :     /
       *                                      /   '.:     /
       *                                     /     :'.   /
       *                                    /     :  ', /
       *                                   /     :     o
       */

      var SEGMENT_INDICES = [
      // start corner
      0, 2, 1,
      // body
      1, 2, 4, 1, 4, 3,
      // end corner
      3, 4, 5];

      // [0] position on segment - 0: start, 1: end
      // [1] side of path - -1: left, 0: center, 1: right
      // [2] role - 0: offset point 1: joint point
      var SEGMENT_POSITIONS = [
      // bevel start corner
      0, 0, 1,
      // start inner corner
      0, -1, 0,
      // start outer corner
      0, 1, 0,
      // end inner corner
      1, -1, 0,
      // end outer corner
      1, 1, 0,
      // bevel end corner
      1, 0, 1];

      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLES,
          attributes: {
            indices: new Uint16Array(SEGMENT_INDICES),
            positions: new Float32Array(SEGMENT_POSITIONS)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'calculateStartPositions',
    value: function calculateStartPositions(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        var numSegments = path.length - 1;
        for (var ptIndex = 0; ptIndex < numSegments; ptIndex++) {
          var point = path[ptIndex];
          value[i++] = point[0];
          value[i++] = point[1];
          value[i++] = point[2] || 0;
        }
      });
    }
  }, {
    key: 'calculateEndPositions',
    value: function calculateEndPositions(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          var point = path[ptIndex];
          value[i++] = point[0];
          value[i++] = point[1];
          value[i++] = point[2] || 0;
        }
      });
    }
  }, {
    key: 'calculateInstanceStartEndPositions64xyLow',
    value: function calculateInstanceStartEndPositions64xyLow(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        var numSegments = path.length - 1;
        for (var ptIndex = 0; ptIndex < numSegments; ptIndex++) {
          var startPoint = path[ptIndex];
          var endPoint = path[ptIndex + 1];
          value[i++] = fp64LowPart(startPoint[0]);
          value[i++] = fp64LowPart(startPoint[1]);
          value[i++] = fp64LowPart(endPoint[0]);
          value[i++] = fp64LowPart(endPoint[1]);
        }
      });
    }
  }, {
    key: 'calculateLeftDeltas',
    value: function calculateLeftDeltas(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        var numSegments = path.length - 1;
        var prevPoint = isClosed(path) ? path[path.length - 2] : path[0];

        for (var ptIndex = 0; ptIndex < numSegments; ptIndex++) {
          var point = path[ptIndex];
          value[i++] = point[0] - prevPoint[0];
          value[i++] = point[1] - prevPoint[1];
          value[i++] = point[2] - prevPoint[2] || 0;
          prevPoint = point;
        }
      });
    }
  }, {
    key: 'calculateRightDeltas',
    value: function calculateRightDeltas(attribute) {
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path) {
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          var point = path[ptIndex];
          var nextPoint = path[ptIndex + 1];
          if (!nextPoint) {
            nextPoint = isClosed(path) ? path[1] : point;
          }

          value[i++] = nextPoint[0] - point[0];
          value[i++] = nextPoint[1] - point[1];
          value[i++] = nextPoint[2] - point[2] || 0;
        }
      });
    }
  }, {
    key: 'calculateStrokeWidths',
    value: function calculateStrokeWidths(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getWidth = _props2.getWidth;
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path, index) {
        var width = getWidth(data[index], index);
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          value[i++] = width;
        }
      });
    }
  }, {
    key: 'calculateDashArrays',
    value: function calculateDashArrays(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getDashArray = _props3.getDashArray;

      if (!getDashArray) {
        return;
      }

      var paths = this.state.paths;
      var value = attribute.value;

      var i = 0;
      paths.forEach(function (path, index) {
        var dashArray = getDashArray(data[index], index);
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          value[i++] = dashArray[0];
          value[i++] = dashArray[1];
        }
      });
    }
  }, {
    key: 'calculateColors',
    value: function calculateColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path, index) {
        var pointColor = getColor(data[index], index);
        if (isNaN(pointColor[3])) {
          pointColor[3] = 255;
        }
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          value[i++] = pointColor[0];
          value[i++] = pointColor[1];
          value[i++] = pointColor[2];
          value[i++] = pointColor[3];
        }
      });
    }

    // Override the default picking colors calculation

  }, {
    key: 'calculatePickingColors',
    value: function calculatePickingColors(attribute) {
      var _this2 = this;

      var paths = this.state.paths;
      var value = attribute.value;


      var i = 0;
      paths.forEach(function (path, index) {
        var pickingColor = _this2.encodePickingColor(index);
        for (var ptIndex = 1; ptIndex < path.length; ptIndex++) {
          value[i++] = pickingColor[0];
          value[i++] = pickingColor[1];
          value[i++] = pickingColor[2];
        }
      });
    }
  }]);

  return PathLayer;
}(_core.Layer);

exports.default = PathLayer;


PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9wYXRoLWxheWVyL3BhdGgtbGF5ZXIuanMiXSwibmFtZXMiOlsiZnA2NExvd1BhcnQiLCJlbmFibGU2NGJpdFN1cHBvcnQiLCJERUZBVUxUX0NPTE9SIiwiZGVmYXVsdFByb3BzIiwid2lkdGhTY2FsZSIsIndpZHRoTWluUGl4ZWxzIiwid2lkdGhNYXhQaXhlbHMiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwicm91bmRlZCIsIm1pdGVyTGltaXQiLCJmcDY0IiwiZGFzaEp1c3RpZmllZCIsImdldFBhdGgiLCJvYmplY3QiLCJwYXRoIiwiZ2V0Q29sb3IiLCJjb2xvciIsImdldFdpZHRoIiwid2lkdGgiLCJnZXREYXNoQXJyYXkiLCJpc0Nsb3NlZCIsImZpcnN0UG9pbnQiLCJsYXN0UG9pbnQiLCJsZW5ndGgiLCJQYXRoTGF5ZXIiLCJwcm9wcyIsInZzIiwiZnMiLCJtb2R1bGVzIiwiYXR0cmlidXRlTWFuYWdlciIsImdldEF0dHJpYnV0ZU1hbmFnZXIiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVN0YXJ0UG9zaXRpb25zIiwic2l6ZSIsInVwZGF0ZSIsImNhbGN1bGF0ZVN0YXJ0UG9zaXRpb25zIiwiaW5zdGFuY2VFbmRQb3NpdGlvbnMiLCJjYWxjdWxhdGVFbmRQb3NpdGlvbnMiLCJpbnN0YW5jZUxlZnREZWx0YXMiLCJjYWxjdWxhdGVMZWZ0RGVsdGFzIiwiaW5zdGFuY2VSaWdodERlbHRhcyIsImNhbGN1bGF0ZVJpZ2h0RGVsdGFzIiwiaW5zdGFuY2VTdHJva2VXaWR0aHMiLCJhY2Nlc3NvciIsImNhbGN1bGF0ZVN0cm9rZVdpZHRocyIsImluc3RhbmNlRGFzaEFycmF5cyIsImNhbGN1bGF0ZURhc2hBcnJheXMiLCJpbnN0YW5jZUNvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlQ29sb3JzIiwiaW5zdGFuY2VQaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJpbnZhbGlkYXRlQWxsIiwiY29vcmRpbmF0ZVN5c3RlbSIsIkxOR0xBVCIsImluc3RhbmNlU3RhcnRFbmRQb3NpdGlvbnM2NHh5TG93IiwiY2FsY3VsYXRlSW5zdGFuY2VTdGFydEVuZFBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJnbCIsImNvbnRleHQiLCJzZXRTdGF0ZSIsIm1vZGVsIiwiX2dldE1vZGVsIiwidXBkYXRlQXR0cmlidXRlIiwiZ2VvbWV0cnlDaGFuZ2VkIiwiZGF0YUNoYW5nZWQiLCJ1cGRhdGVUcmlnZ2Vyc0NoYW5nZWQiLCJhbGwiLCJwYXRocyIsImRhdGEiLCJtYXAiLCJudW1JbnN0YW5jZXMiLCJyZWR1Y2UiLCJjb3VudCIsInVuaWZvcm1zIiwic3RhdGUiLCJyZW5kZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJqb2ludFR5cGUiLCJhbGlnbk1vZGUiLCJTRUdNRU5UX0lORElDRVMiLCJTRUdNRU5UX1BPU0lUSU9OUyIsImdldFNoYWRlcnMiLCJpZCIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJUUklBTkdMRVMiLCJhdHRyaWJ1dGVzIiwiaW5kaWNlcyIsIlVpbnQxNkFycmF5IiwicG9zaXRpb25zIiwiRmxvYXQzMkFycmF5IiwiaXNJbnN0YW5jZWQiLCJzaGFkZXJDYWNoZSIsImF0dHJpYnV0ZSIsInZhbHVlIiwiaSIsImZvckVhY2giLCJudW1TZWdtZW50cyIsInB0SW5kZXgiLCJwb2ludCIsInN0YXJ0UG9pbnQiLCJlbmRQb2ludCIsInByZXZQb2ludCIsIm5leHRQb2ludCIsImluZGV4IiwiZGFzaEFycmF5IiwicG9pbnRDb2xvciIsImlzTmFOIiwicGlja2luZ0NvbG9yIiwiZW5jb2RlUGlja2luZ0NvbG9yIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBb0JBOztBQUVBOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUExQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LGFBQWEsQ0FBYixDQUFiO0FBQ0FkLGdCQUFNQyxHQUFOLElBQWFhLGFBQWEsQ0FBYixDQUFiO0FBQ0FkLGdCQUFNQyxHQUFOLElBQWFhLGFBQWEsQ0FBYixDQUFiO0FBQ0Q7QUFDRixPQVBEO0FBUUQ7Ozs7OztrQkF6VWtCekYsUzs7O0FBNFVyQkEsVUFBVTJGLFNBQVYsR0FBc0IsV0FBdEI7QUFDQTNGLFVBQVV0QixZQUFWLEdBQXlCQSxZQUF6QiIsImZpbGUiOiJwYXRoLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU0sIExheWVyLCBleHBlcmltZW50YWx9IGZyb20gJy4uLy4uL2NvcmUnO1xuY29uc3Qge2ZwNjRMb3dQYXJ0LCBlbmFibGU2NGJpdFN1cHBvcnR9ID0gZXhwZXJpbWVudGFsO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vcGF0aC1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgdnM2NCBmcm9tICcuL3BhdGgtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGZzIGZyb20gJy4vcGF0aC1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHdpZHRoU2NhbGU6IDEsIC8vIHN0cm9rZSB3aWR0aCBpbiBtZXRlcnNcbiAgd2lkdGhNaW5QaXhlbHM6IDAsIC8vICBtaW4gc3Ryb2tlIHdpZHRoIGluIHBpeGVsc1xuICB3aWR0aE1heFBpeGVsczogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIC8vIG1heCBzdHJva2Ugd2lkdGggaW4gcGl4ZWxzXG4gIHJvdW5kZWQ6IGZhbHNlLFxuICBtaXRlckxpbWl0OiA0LFxuICBmcDY0OiBmYWxzZSxcbiAgZGFzaEp1c3RpZmllZDogZmFsc2UsXG5cbiAgZ2V0UGF0aDogb2JqZWN0ID0+IG9iamVjdC5wYXRoLFxuICBnZXRDb2xvcjogb2JqZWN0ID0+IG9iamVjdC5jb2xvciB8fCBERUZBVUxUX0NPTE9SLFxuICBnZXRXaWR0aDogb2JqZWN0ID0+IG9iamVjdC53aWR0aCB8fCAxLFxuICBnZXREYXNoQXJyYXk6IG51bGxcbn07XG5cbmNvbnN0IGlzQ2xvc2VkID0gcGF0aCA9PiB7XG4gIGNvbnN0IGZpcnN0UG9pbnQgPSBwYXRoWzBdO1xuICBjb25zdCBsYXN0UG9pbnQgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gIHJldHVybiAoXG4gICAgZmlyc3RQb2ludFswXSA9PT0gbGFzdFBvaW50WzBdICYmXG4gICAgZmlyc3RQb2ludFsxXSA9PT0gbGFzdFBvaW50WzFdICYmXG4gICAgZmlyc3RQb2ludFsyXSA9PT0gbGFzdFBvaW50WzJdXG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXRoTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIGVuYWJsZTY0Yml0U3VwcG9ydCh0aGlzLnByb3BzKVxuICAgICAgPyB7dnM6IHZzNjQsIGZzLCBtb2R1bGVzOiBbJ3Byb2plY3Q2NCcsICdwaWNraW5nJ119XG4gICAgICA6IHt2cywgZnMsIG1vZHVsZXM6IFsncGlja2luZyddfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VTdGFydFBvc2l0aW9uczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVTdGFydFBvc2l0aW9uc30sXG4gICAgICBpbnN0YW5jZUVuZFBvc2l0aW9uczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVFbmRQb3NpdGlvbnN9LFxuICAgICAgaW5zdGFuY2VMZWZ0RGVsdGFzOiB7c2l6ZTogMywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUxlZnREZWx0YXN9LFxuICAgICAgaW5zdGFuY2VSaWdodERlbHRhczoge3NpemU6IDMsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVSaWdodERlbHRhc30sXG4gICAgICBpbnN0YW5jZVN0cm9rZVdpZHRoczoge3NpemU6IDEsIGFjY2Vzc29yOiAnZ2V0V2lkdGgnLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlU3Ryb2tlV2lkdGhzfSxcbiAgICAgIGluc3RhbmNlRGFzaEFycmF5czoge3NpemU6IDIsIGFjY2Vzc29yOiAnZ2V0RGFzaEFycmF5JywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZURhc2hBcnJheXN9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVDb2xvcnNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZVBpY2tpbmdDb2xvcnM6IHtzaXplOiAzLCB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlUGlja2luZ0NvbG9yc31cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3QgYXR0cmlidXRlTWFuYWdlciA9IHRoaXMuZ2V0QXR0cmlidXRlTWFuYWdlcigpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLmNvb3JkaW5hdGVTeXN0ZW0gPT09IENPT1JESU5BVEVfU1lTVEVNLkxOR0xBVCkge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICAgICAgaW5zdGFuY2VTdGFydEVuZFBvc2l0aW9uczY0eHlMb3c6IHtcbiAgICAgICAgICAgIHNpemU6IDQsXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTdGFydEVuZFBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoWydpbnN0YW5jZVN0YXJ0RW5kUG9zaXRpb25zNjR4eUxvdyddKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuXG4gICAgY29uc3Qge2dldFBhdGh9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgaWYgKHByb3BzLmZwNjQgIT09IG9sZFByb3BzLmZwNjQpIHtcbiAgICAgIGNvbnN0IHtnbH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5fZ2V0TW9kZWwoZ2wpfSk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBjb25zdCBnZW9tZXRyeUNoYW5nZWQgPVxuICAgICAgY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHxcbiAgICAgIChjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgJiZcbiAgICAgICAgKGNoYW5nZUZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZC5hbGwgfHwgY2hhbmdlRmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkLmdldFBhdGgpKTtcblxuICAgIGlmIChnZW9tZXRyeUNoYW5nZWQpIHtcbiAgICAgIC8vIHRoaXMuc3RhdGUucGF0aHMgb25seSBzdG9yZXMgcG9pbnQgcG9zaXRpb25zIGluIGVhY2ggcGF0aFxuICAgICAgY29uc3QgcGF0aHMgPSBwcm9wcy5kYXRhLm1hcChnZXRQYXRoKTtcbiAgICAgIGNvbnN0IG51bUluc3RhbmNlcyA9IHBhdGhzLnJlZHVjZSgoY291bnQsIHBhdGgpID0+IGNvdW50ICsgcGF0aC5sZW5ndGggLSAxLCAwKTtcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7cGF0aHMsIG51bUluc3RhbmNlc30pO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge1xuICAgICAgcm91bmRlZCxcbiAgICAgIG1pdGVyTGltaXQsXG4gICAgICB3aWR0aFNjYWxlLFxuICAgICAgd2lkdGhNaW5QaXhlbHMsXG4gICAgICB3aWR0aE1heFBpeGVscyxcbiAgICAgIGRhc2hKdXN0aWZpZWRcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdW5pZm9ybXMsIHtcbiAgICAgICAgam9pbnRUeXBlOiBOdW1iZXIocm91bmRlZCksXG4gICAgICAgIGFsaWduTW9kZTogTnVtYmVyKGRhc2hKdXN0aWZpZWQpLFxuICAgICAgICB3aWR0aFNjYWxlLFxuICAgICAgICBtaXRlckxpbWl0LFxuICAgICAgICB3aWR0aE1pblBpeGVscyxcbiAgICAgICAgd2lkdGhNYXhQaXhlbHNcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIC8qXG4gICAgICogICAgICAgX1xuICAgICAqICAgICAgICBcIi1fIDEgICAgICAgICAgICAgICAgICAgMyAgICAgICAgICAgICAgICAgICAgICAgNVxuICAgICAqICAgICBfICAgICBcIm8tLS0tLS0tLS0tLS0tLS0tLS0tLS1vLS0tLS0tLS0tLS0tLS0tLS0tLV8tb1xuICAgICAqICAgICAgIC0gICAvIFwiXCItLS4uX18gICAgICAgICAgICAgICcuICAgICAgICAgICAgIF8uLScgL1xuICAgICAqICAgXyAgICAgXCJALSAtIC0gLSAtIFwiXCItLS4uX18tIC0gLSAtIHggLSAtIC0gLV8uQCcgICAgL1xuICAgICAqICAgIFwiLV8gIC8gICAgICAgICAgICAgICAgICAgXCJcIi0tLi5fXyAnLiAgXywtYCA6ICAgICAvXG4gICAgICogICAgICAgXCJvLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiXCItbycgICAgOiAgICAgL1xuICAgICAqICAgICAgMCwyICAgICAgICAgICAgICAgICAgICAgICAgICAgIDQgLyAnLiAgOiAgICAgL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvICAgJy46ICAgICAvXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyAgICAgOicuICAgL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyAgICAgOiAgJywgL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvICAgICA6ICAgICBvXG4gICAgICovXG5cbiAgICBjb25zdCBTRUdNRU5UX0lORElDRVMgPSBbXG4gICAgICAvLyBzdGFydCBjb3JuZXJcbiAgICAgIDAsXG4gICAgICAyLFxuICAgICAgMSxcbiAgICAgIC8vIGJvZHlcbiAgICAgIDEsXG4gICAgICAyLFxuICAgICAgNCxcbiAgICAgIDEsXG4gICAgICA0LFxuICAgICAgMyxcbiAgICAgIC8vIGVuZCBjb3JuZXJcbiAgICAgIDMsXG4gICAgICA0LFxuICAgICAgNVxuICAgIF07XG5cbiAgICAvLyBbMF0gcG9zaXRpb24gb24gc2VnbWVudCAtIDA6IHN0YXJ0LCAxOiBlbmRcbiAgICAvLyBbMV0gc2lkZSBvZiBwYXRoIC0gLTE6IGxlZnQsIDA6IGNlbnRlciwgMTogcmlnaHRcbiAgICAvLyBbMl0gcm9sZSAtIDA6IG9mZnNldCBwb2ludCAxOiBqb2ludCBwb2ludFxuICAgIGNvbnN0IFNFR01FTlRfUE9TSVRJT05TID0gW1xuICAgICAgLy8gYmV2ZWwgc3RhcnQgY29ybmVyXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDEsXG4gICAgICAvLyBzdGFydCBpbm5lciBjb3JuZXJcbiAgICAgIDAsXG4gICAgICAtMSxcbiAgICAgIDAsXG4gICAgICAvLyBzdGFydCBvdXRlciBjb3JuZXJcbiAgICAgIDAsXG4gICAgICAxLFxuICAgICAgMCxcbiAgICAgIC8vIGVuZCBpbm5lciBjb3JuZXJcbiAgICAgIDEsXG4gICAgICAtMSxcbiAgICAgIDAsXG4gICAgICAvLyBlbmQgb3V0ZXIgY29ybmVyXG4gICAgICAxLFxuICAgICAgMSxcbiAgICAgIDAsXG4gICAgICAvLyBiZXZlbCBlbmQgY29ybmVyXG4gICAgICAxLFxuICAgICAgMCxcbiAgICAgIDFcbiAgICBdO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbChcbiAgICAgIGdsLFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTaGFkZXJzKCksIHtcbiAgICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRVMsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgaW5kaWNlczogbmV3IFVpbnQxNkFycmF5KFNFR01FTlRfSU5ESUNFUyksXG4gICAgICAgICAgICBwb3NpdGlvbnM6IG5ldyBGbG9hdDMyQXJyYXkoU0VHTUVOVF9QT1NJVElPTlMpXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgaXNJbnN0YW5jZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVN0YXJ0UG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIGNvbnN0IG51bVNlZ21lbnRzID0gcGF0aC5sZW5ndGggLSAxO1xuICAgICAgZm9yIChsZXQgcHRJbmRleCA9IDA7IHB0SW5kZXggPCBudW1TZWdtZW50czsgcHRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHBvaW50ID0gcGF0aFtwdEluZGV4XTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50WzBdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRbMV07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludFsyXSB8fCAwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlRW5kUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAxOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICBjb25zdCBwb2ludCA9IHBhdGhbcHRJbmRleF07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludFswXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50WzFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRbMl0gfHwgMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlU3RhcnRFbmRQb3NpdGlvbnM2NHh5TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaChwYXRoID0+IHtcbiAgICAgIGNvbnN0IG51bVNlZ21lbnRzID0gcGF0aC5sZW5ndGggLSAxO1xuICAgICAgZm9yIChsZXQgcHRJbmRleCA9IDA7IHB0SW5kZXggPCBudW1TZWdtZW50czsgcHRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0UG9pbnQgPSBwYXRoW3B0SW5kZXhdO1xuICAgICAgICBjb25zdCBlbmRQb2ludCA9IHBhdGhbcHRJbmRleCArIDFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gZnA2NExvd1BhcnQoc3RhcnRQb2ludFswXSk7XG4gICAgICAgIHZhbHVlW2krK10gPSBmcDY0TG93UGFydChzdGFydFBvaW50WzFdKTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IGZwNjRMb3dQYXJ0KGVuZFBvaW50WzBdKTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IGZwNjRMb3dQYXJ0KGVuZFBvaW50WzFdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUxlZnREZWx0YXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcblxuICAgIGxldCBpID0gMDtcbiAgICBwYXRocy5mb3JFYWNoKHBhdGggPT4ge1xuICAgICAgY29uc3QgbnVtU2VnbWVudHMgPSBwYXRoLmxlbmd0aCAtIDE7XG4gICAgICBsZXQgcHJldlBvaW50ID0gaXNDbG9zZWQocGF0aCkgPyBwYXRoW3BhdGgubGVuZ3RoIC0gMl0gOiBwYXRoWzBdO1xuXG4gICAgICBmb3IgKGxldCBwdEluZGV4ID0gMDsgcHRJbmRleCA8IG51bVNlZ21lbnRzOyBwdEluZGV4KyspIHtcbiAgICAgICAgY29uc3QgcG9pbnQgPSBwYXRoW3B0SW5kZXhdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRbMF0gLSBwcmV2UG9pbnRbMF07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludFsxXSAtIHByZXZQb2ludFsxXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50WzJdIC0gcHJldlBvaW50WzJdIHx8IDA7XG4gICAgICAgIHByZXZQb2ludCA9IHBvaW50O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlUmlnaHREZWx0YXMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge3BhdGhzfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcblxuICAgIGxldCBpID0gMDtcbiAgICBwYXRocy5mb3JFYWNoKHBhdGggPT4ge1xuICAgICAgZm9yIChsZXQgcHRJbmRleCA9IDE7IHB0SW5kZXggPCBwYXRoLmxlbmd0aDsgcHRJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHBvaW50ID0gcGF0aFtwdEluZGV4XTtcbiAgICAgICAgbGV0IG5leHRQb2ludCA9IHBhdGhbcHRJbmRleCArIDFdO1xuICAgICAgICBpZiAoIW5leHRQb2ludCkge1xuICAgICAgICAgIG5leHRQb2ludCA9IGlzQ2xvc2VkKHBhdGgpID8gcGF0aFsxXSA6IHBvaW50O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWVbaSsrXSA9IG5leHRQb2ludFswXSAtIHBvaW50WzBdO1xuICAgICAgICB2YWx1ZVtpKytdID0gbmV4dFBvaW50WzFdIC0gcG9pbnRbMV07XG4gICAgICAgIHZhbHVlW2krK10gPSBuZXh0UG9pbnRbMl0gLSBwb2ludFsyXSB8fCAwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlU3Ryb2tlV2lkdGhzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRXaWR0aH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHdpZHRoID0gZ2V0V2lkdGgoZGF0YVtpbmRleF0sIGluZGV4KTtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAxOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICB2YWx1ZVtpKytdID0gd2lkdGg7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVEYXNoQXJyYXlzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXREYXNoQXJyYXl9ID0gdGhpcy5wcm9wcztcbiAgICBpZiAoIWdldERhc2hBcnJheSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIHBhdGhzLmZvckVhY2goKHBhdGgsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBkYXNoQXJyYXkgPSBnZXREYXNoQXJyYXkoZGF0YVtpbmRleF0sIGluZGV4KTtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAxOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICB2YWx1ZVtpKytdID0gZGFzaEFycmF5WzBdO1xuICAgICAgICB2YWx1ZVtpKytdID0gZGFzaEFycmF5WzFdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHBvaW50Q29sb3IgPSBnZXRDb2xvcihkYXRhW2luZGV4XSwgaW5kZXgpO1xuICAgICAgaWYgKGlzTmFOKHBvaW50Q29sb3JbM10pKSB7XG4gICAgICAgIHBvaW50Q29sb3JbM10gPSAyNTU7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBwdEluZGV4ID0gMTsgcHRJbmRleCA8IHBhdGgubGVuZ3RoOyBwdEluZGV4KyspIHtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50Q29sb3JbMF07XG4gICAgICAgIHZhbHVlW2krK10gPSBwb2ludENvbG9yWzFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcG9pbnRDb2xvclsyXTtcbiAgICAgICAgdmFsdWVbaSsrXSA9IHBvaW50Q29sb3JbM107XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBwaWNraW5nIGNvbG9ycyBjYWxjdWxhdGlvblxuICBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgcGF0aHMuZm9yRWFjaCgocGF0aCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHBpY2tpbmdDb2xvciA9IHRoaXMuZW5jb2RlUGlja2luZ0NvbG9yKGluZGV4KTtcbiAgICAgIGZvciAobGV0IHB0SW5kZXggPSAxOyBwdEluZGV4IDwgcGF0aC5sZW5ndGg7IHB0SW5kZXgrKykge1xuICAgICAgICB2YWx1ZVtpKytdID0gcGlja2luZ0NvbG9yWzBdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcGlja2luZ0NvbG9yWzFdO1xuICAgICAgICB2YWx1ZVtpKytdID0gcGlja2luZ0NvbG9yWzJdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cblBhdGhMYXllci5sYXllck5hbWUgPSAnUGF0aExheWVyJztcblBhdGhMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=