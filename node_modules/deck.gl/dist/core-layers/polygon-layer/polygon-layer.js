'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = require('../../core');

var _solidPolygonLayer = require('../solid-polygon-layer/solid-polygon-layer');

var _solidPolygonLayer2 = _interopRequireDefault(_solidPolygonLayer);

var _pathLayer = require('../path-layer/path-layer');

var _pathLayer2 = _interopRequireDefault(_pathLayer);

var _polygon = require('../solid-polygon-layer/polygon');

var Polygon = _interopRequireWildcard(_polygon);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

var get = _core.experimental.get;


var defaultLineColor = [0x0, 0x0, 0x0, 0xff];
var defaultFillColor = [0x0, 0x0, 0x0, 0xff];

var defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  elevationScale: 1,
  wireframe: false,

  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  lineDashJustified: false,
  fp64: false,

  getPolygon: function getPolygon(f) {
    return get(f, 'polygon');
  },
  // Polygon fill color
  getFillColor: function getFillColor(f) {
    return get(f, 'fillColor') || defaultFillColor;
  },
  // Point, line and polygon outline color
  getLineColor: function getLineColor(f) {
    return get(f, 'lineColor') || defaultLineColor;
  },
  // Line and polygon outline accessors
  getLineWidth: function getLineWidth(f) {
    return get(f, 'lineWidth') || 1;
  },
  // Line dash array accessor
  getLineDashArray: null,
  // Polygon extrusion accessor
  getElevation: function getElevation(f) {
    return get(f, 'elevation') || 1000;
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

var PolygonLayer = function (_CompositeLayer) {
  _inherits(PolygonLayer, _CompositeLayer);

  function PolygonLayer() {
    _classCallCheck(this, PolygonLayer);

    return _possibleConstructorReturn(this, (PolygonLayer.__proto__ || Object.getPrototypeOf(PolygonLayer)).apply(this, arguments));
  }

  _createClass(PolygonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        paths: []
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var _this2 = this;

      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      var geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

      if (geometryChanged) {
        var _props = this.props,
            data = _props.data,
            getPolygon = _props.getPolygon;

        this.state.paths = [];
        data.forEach(function (object) {
          var complexPolygon = Polygon.normalize(getPolygon(object));
          complexPolygon.forEach(function (polygon) {
            return _this2.state.paths.push({
              path: polygon,
              object: object
            });
          });
        });
      }
    }
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;

      return Object.assign(info, {
        // override object with picked data
        object: info.object && info.object.object || info.object
      });
    }

    /* eslint-disable complexity */

  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      // Layer composition props
      var _props2 = this.props,
          data = _props2.data,
          stroked = _props2.stroked,
          filled = _props2.filled,
          extruded = _props2.extruded,
          wireframe = _props2.wireframe,
          elevationScale = _props2.elevationScale;

      // Rendering props underlying layer

      var _props3 = this.props,
          lineWidthScale = _props3.lineWidthScale,
          lineWidthMinPixels = _props3.lineWidthMinPixels,
          lineWidthMaxPixels = _props3.lineWidthMaxPixels,
          lineJointRounded = _props3.lineJointRounded,
          lineMiterLimit = _props3.lineMiterLimit,
          lineDashJustified = _props3.lineDashJustified,
          fp64 = _props3.fp64;

      // Accessor props for underlying layers

      var _props4 = this.props,
          getFillColor = _props4.getFillColor,
          getLineColor = _props4.getLineColor,
          getLineWidth = _props4.getLineWidth,
          getLineDashArray = _props4.getLineDashArray,
          getElevation = _props4.getElevation,
          getPolygon = _props4.getPolygon,
          updateTriggers = _props4.updateTriggers,
          lightSettings = _props4.lightSettings;
      var paths = this.state.paths;


      var hasData = data && data.length > 0;

      // Filled Polygon Layer
      var polygonLayer = filled && hasData && new _solidPolygonLayer2.default(this.getSubLayerProps({
        id: 'fill',
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getFillColor
        }
      }), {
        data: data,
        extruded: extruded,
        elevationScale: elevationScale,

        fp64: fp64,
        wireframe: false,

        getPolygon: getPolygon,
        getElevation: getElevation,
        getColor: getFillColor,

        lightSettings: lightSettings
      });

      var polygonWireframeLayer = extruded && wireframe && hasData && new _solidPolygonLayer2.default(this.getSubLayerProps({
        id: 'wireframe',
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getLineColor
        }
      }), {
        data: data,

        fp64: fp64,
        extruded: true,
        elevationScale: elevationScale,
        wireframe: true,

        getPolygon: getPolygon,
        getElevation: getElevation,
        getColor: getLineColor
      });

      // Polygon line layer
      var polygonLineLayer = !extruded && stroked && hasData && new _pathLayer2.default(this.getSubLayerProps({
        id: 'stroke',
        updateTriggers: {
          getWidth: updateTriggers.getLineWidth,
          getColor: updateTriggers.getLineColor,
          getDashArray: updateTriggers.getLineDashArray
        }
      }), {
        data: paths,

        fp64: fp64,
        widthScale: lineWidthScale,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels,
        rounded: lineJointRounded,
        miterLimit: lineMiterLimit,
        dashJustified: lineDashJustified,

        getPath: function getPath(x) {
          return x.path;
        },
        getColor: function getColor(x) {
          return getLineColor(x.object);
        },
        getWidth: function getWidth(x) {
          return getLineWidth(x.object);
        },
        getDashArray: getLineDashArray && function (x) {
          return getLineDashArray(x.object);
        }
      });

      return [
      // If not extruded: flat fill layer is drawn below outlines
      !extruded && polygonLayer, polygonWireframeLayer, polygonLineLayer,
      // If extruded: draw fill layer last for correct blending behavior
      extruded && polygonLayer];
    }
    /* eslint-enable complexity */

  }]);

  return PolygonLayer;
}(_core.CompositeLayer);

exports.default = PolygonLayer;


PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9wb2x5Z29uLWxheWVyL3BvbHlnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiUG9seWdvbiIsImdldCIsImRlZmF1bHRMaW5lQ29sb3IiLCJkZWZhdWx0RmlsbENvbG9yIiwiZGVmYXVsdFByb3BzIiwic3Ryb2tlZCIsImZpbGxlZCIsImV4dHJ1ZGVkIiwiZWxldmF0aW9uU2NhbGUiLCJ3aXJlZnJhbWUiLCJsaW5lV2lkdGhTY2FsZSIsImxpbmVXaWR0aE1pblBpeGVscyIsImxpbmVXaWR0aE1heFBpeGVscyIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJsaW5lSm9pbnRSb3VuZGVkIiwibGluZU1pdGVyTGltaXQiLCJsaW5lRGFzaEp1c3RpZmllZCIsImZwNjQiLCJnZXRQb2x5Z29uIiwiZiIsImdldEZpbGxDb2xvciIsImdldExpbmVDb2xvciIsImdldExpbmVXaWR0aCIsImdldExpbmVEYXNoQXJyYXkiLCJnZXRFbGV2YXRpb24iLCJsaWdodFNldHRpbmdzIiwibGlnaHRzUG9zaXRpb24iLCJhbWJpZW50UmF0aW8iLCJkaWZmdXNlUmF0aW8iLCJzcGVjdWxhclJhdGlvIiwibGlnaHRzU3RyZW5ndGgiLCJudW1iZXJPZkxpZ2h0cyIsIlBvbHlnb25MYXllciIsInN0YXRlIiwicGF0aHMiLCJvbGRQcm9wcyIsInByb3BzIiwiY2hhbmdlRmxhZ3MiLCJnZW9tZXRyeUNoYW5nZWQiLCJkYXRhQ2hhbmdlZCIsInVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCIsImFsbCIsImRhdGEiLCJmb3JFYWNoIiwiY29tcGxleFBvbHlnb24iLCJub3JtYWxpemUiLCJvYmplY3QiLCJwdXNoIiwicGF0aCIsInBvbHlnb24iLCJpbmZvIiwiT2JqZWN0IiwiYXNzaWduIiwidXBkYXRlVHJpZ2dlcnMiLCJoYXNEYXRhIiwibGVuZ3RoIiwicG9seWdvbkxheWVyIiwiZ2V0U3ViTGF5ZXJQcm9wcyIsImlkIiwiZ2V0Q29sb3IiLCJwb2x5Z29uV2lyZWZyYW1lTGF5ZXIiLCJwb2x5Z29uTGluZUxheWVyIiwiZ2V0V2lkdGgiLCJnZXREYXNoQXJyYXkiLCJ3aWR0aFNjYWxlIiwid2lkdGhNaW5QaXhlbHMiLCJ3aWR0aE1heFBpeGVscyIsInJvdW5kZWQiLCJtaXRlckxpbWl0IiwiZGFzaEp1c3RpZmllZCIsImdldFBhdGgiLCJ4IiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQW9CQTs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7O0lBQVlBLE87Ozs7Ozs7Ozs7K2VBeEJaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQyxHLHNCQUFBQSxHOzs7QUFLUCxJQUFNQyxtQkFBbUIsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBekI7QUFDQSxJQUFNQyxtQkFBbUIsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBekI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsV0FBUyxJQURVO0FBRW5CQyxVQUFRLElBRlc7QUFHbkJDLFlBQVUsS0FIUztBQUluQkMsa0JBQWdCLENBSkc7QUFLbkJDLGFBQVcsS0FMUTs7QUFPbkJDLGtCQUFnQixDQVBHO0FBUW5CQyxzQkFBb0IsQ0FSRDtBQVNuQkMsc0JBQW9CQyxPQUFPQyxnQkFUUjtBQVVuQkMsb0JBQWtCLEtBVkM7QUFXbkJDLGtCQUFnQixDQVhHO0FBWW5CQyxxQkFBbUIsS0FaQTtBQWFuQkMsUUFBTSxLQWJhOztBQWVuQkMsY0FBWTtBQUFBLFdBQUtsQixJQUFJbUIsQ0FBSixFQUFPLFNBQVAsQ0FBTDtBQUFBLEdBZk87QUFnQm5CO0FBQ0FDLGdCQUFjO0FBQUEsV0FBS3BCLElBQUltQixDQUFKLEVBQU8sV0FBUCxLQUF1QmpCLGdCQUE1QjtBQUFBLEdBakJLO0FBa0JuQjtBQUNBbUIsZ0JBQWM7QUFB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YixHQUE0QkEsWUFBNUIiLCJmaWxlIjoicG9seWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NvbXBvc2l0ZUxheWVyLCBleHBlcmltZW50YWx9IGZyb20gJy4uLy4uL2NvcmUnO1xuY29uc3Qge2dldH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQgU29saWRQb2x5Z29uTGF5ZXIgZnJvbSAnLi4vc29saWQtcG9seWdvbi1sYXllci9zb2xpZC1wb2x5Z29uLWxheWVyJztcbmltcG9ydCBQYXRoTGF5ZXIgZnJvbSAnLi4vcGF0aC1sYXllci9wYXRoLWxheWVyJztcbmltcG9ydCAqIGFzIFBvbHlnb24gZnJvbSAnLi4vc29saWQtcG9seWdvbi1sYXllci9wb2x5Z29uJztcblxuY29uc3QgZGVmYXVsdExpbmVDb2xvciA9IFsweDAsIDB4MCwgMHgwLCAweGZmXTtcbmNvbnN0IGRlZmF1bHRGaWxsQ29sb3IgPSBbMHgwLCAweDAsIDB4MCwgMHhmZl07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgc3Ryb2tlZDogdHJ1ZSxcbiAgZmlsbGVkOiB0cnVlLFxuICBleHRydWRlZDogZmFsc2UsXG4gIGVsZXZhdGlvblNjYWxlOiAxLFxuICB3aXJlZnJhbWU6IGZhbHNlLFxuXG4gIGxpbmVXaWR0aFNjYWxlOiAxLFxuICBsaW5lV2lkdGhNaW5QaXhlbHM6IDAsXG4gIGxpbmVXaWR0aE1heFBpeGVsczogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gIGxpbmVKb2ludFJvdW5kZWQ6IGZhbHNlLFxuICBsaW5lTWl0ZXJMaW1pdDogNCxcbiAgbGluZURhc2hKdXN0aWZpZWQ6IGZhbHNlLFxuICBmcDY0OiBmYWxzZSxcblxuICBnZXRQb2x5Z29uOiBmID0+IGdldChmLCAncG9seWdvbicpLFxuICAvLyBQb2x5Z29uIGZpbGwgY29sb3JcbiAgZ2V0RmlsbENvbG9yOiBmID0+IGdldChmLCAnZmlsbENvbG9yJykgfHwgZGVmYXVsdEZpbGxDb2xvcixcbiAgLy8gUG9pbnQsIGxpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBjb2xvclxuICBnZXRMaW5lQ29sb3I6IGYgPT4gZ2V0KGYsICdsaW5lQ29sb3InKSB8fCBkZWZhdWx0TGluZUNvbG9yLFxuICAvLyBMaW5lIGFuZCBwb2x5Z29uIG91dGxpbmUgYWNjZXNzb3JzXG4gIGdldExpbmVXaWR0aDogZiA9PiBnZXQoZiwgJ2xpbmVXaWR0aCcpIHx8IDEsXG4gIC8vIExpbmUgZGFzaCBhcnJheSBhY2Nlc3NvclxuICBnZXRMaW5lRGFzaEFycmF5OiBudWxsLFxuICAvLyBQb2x5Z29uIGV4dHJ1c2lvbiBhY2Nlc3NvclxuICBnZXRFbGV2YXRpb246IGYgPT4gZ2V0KGYsICdlbGV2YXRpb24nKSB8fCAxMDAwLFxuXG4gIC8vIE9wdGlvbmFsIHNldHRpbmdzIGZvciAnbGlnaHRpbmcnIHNoYWRlciBtb2R1bGVcbiAgbGlnaHRTZXR0aW5nczoge1xuICAgIGxpZ2h0c1Bvc2l0aW9uOiBbLTEyMi40NSwgMzcuNzUsIDgwMDAsIC0xMjIuMCwgMzguMCwgNTAwMF0sXG4gICAgYW1iaWVudFJhdGlvOiAwLjA1LFxuICAgIGRpZmZ1c2VSYXRpbzogMC42LFxuICAgIHNwZWN1bGFyUmF0aW86IDAuOCxcbiAgICBsaWdodHNTdHJlbmd0aDogWzIuMCwgMC4wLCAwLjAsIDAuMF0sXG4gICAgbnVtYmVyT2ZMaWdodHM6IDJcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9seWdvbkxheWVyIGV4dGVuZHMgQ29tcG9zaXRlTGF5ZXIge1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHBhdGhzOiBbXVxuICAgIH07XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBjb25zdCBnZW9tZXRyeUNoYW5nZWQgPVxuICAgICAgY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHxcbiAgICAgIChjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgJiZcbiAgICAgICAgKGNoYW5nZUZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZC5hbGwgfHwgY2hhbmdlRmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkLmdldFBvbHlnb24pKTtcblxuICAgIGlmIChnZW9tZXRyeUNoYW5nZWQpIHtcbiAgICAgIGNvbnN0IHtkYXRhLCBnZXRQb2x5Z29ufSA9IHRoaXMucHJvcHM7XG4gICAgICB0aGlzLnN0YXRlLnBhdGhzID0gW107XG4gICAgICBkYXRhLmZvckVhY2gob2JqZWN0ID0+IHtcbiAgICAgICAgY29uc3QgY29tcGxleFBvbHlnb24gPSBQb2x5Z29uLm5vcm1hbGl6ZShnZXRQb2x5Z29uKG9iamVjdCkpO1xuICAgICAgICBjb21wbGV4UG9seWdvbi5mb3JFYWNoKHBvbHlnb24gPT5cbiAgICAgICAgICB0aGlzLnN0YXRlLnBhdGhzLnB1c2goe1xuICAgICAgICAgICAgcGF0aDogcG9seWdvbixcbiAgICAgICAgICAgIG9iamVjdFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBnZXRQaWNraW5nSW5mbyh7aW5mb30pIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihpbmZvLCB7XG4gICAgICAvLyBvdmVycmlkZSBvYmplY3Qgd2l0aCBwaWNrZWQgZGF0YVxuICAgICAgb2JqZWN0OiAoaW5mby5vYmplY3QgJiYgaW5mby5vYmplY3Qub2JqZWN0KSB8fCBpbmZvLm9iamVjdFxuICAgIH0pO1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAqL1xuICByZW5kZXJMYXllcnMoKSB7XG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gcHJvcHNcbiAgICBjb25zdCB7ZGF0YSwgc3Ryb2tlZCwgZmlsbGVkLCBleHRydWRlZCwgd2lyZWZyYW1lLCBlbGV2YXRpb25TY2FsZX0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gUmVuZGVyaW5nIHByb3BzIHVuZGVybHlpbmcgbGF5ZXJcbiAgICBjb25zdCB7XG4gICAgICBsaW5lV2lkdGhTY2FsZSxcbiAgICAgIGxpbmVXaWR0aE1pblBpeGVscyxcbiAgICAgIGxpbmVXaWR0aE1heFBpeGVscyxcbiAgICAgIGxpbmVKb2ludFJvdW5kZWQsXG4gICAgICBsaW5lTWl0ZXJMaW1pdCxcbiAgICAgIGxpbmVEYXNoSnVzdGlmaWVkLFxuICAgICAgZnA2NFxuICAgIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gQWNjZXNzb3IgcHJvcHMgZm9yIHVuZGVybHlpbmcgbGF5ZXJzXG4gICAgY29uc3Qge1xuICAgICAgZ2V0RmlsbENvbG9yLFxuICAgICAgZ2V0TGluZUNvbG9yLFxuICAgICAgZ2V0TGluZVdpZHRoLFxuICAgICAgZ2V0TGluZURhc2hBcnJheSxcbiAgICAgIGdldEVsZXZhdGlvbixcbiAgICAgIGdldFBvbHlnb24sXG4gICAgICB1cGRhdGVUcmlnZ2VycyxcbiAgICAgIGxpZ2h0U2V0dGluZ3NcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IHtwYXRoc30gPSB0aGlzLnN0YXRlO1xuXG4gICAgY29uc3QgaGFzRGF0YSA9IGRhdGEgJiYgZGF0YS5sZW5ndGggPiAwO1xuXG4gICAgLy8gRmlsbGVkIFBvbHlnb24gTGF5ZXJcbiAgICBjb25zdCBwb2x5Z29uTGF5ZXIgPVxuICAgICAgZmlsbGVkICYmXG4gICAgICBoYXNEYXRhICYmXG4gICAgICBuZXcgU29saWRQb2x5Z29uTGF5ZXIoXG4gICAgICAgIHRoaXMuZ2V0U3ViTGF5ZXJQcm9wcyh7XG4gICAgICAgICAgaWQ6ICdmaWxsJyxcbiAgICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgICAgZ2V0RWxldmF0aW9uOiB1cGRhdGVUcmlnZ2Vycy5nZXRFbGV2YXRpb24sXG4gICAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0RmlsbENvbG9yXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgZXh0cnVkZWQsXG4gICAgICAgICAgZWxldmF0aW9uU2NhbGUsXG5cbiAgICAgICAgICBmcDY0LFxuICAgICAgICAgIHdpcmVmcmFtZTogZmFsc2UsXG5cbiAgICAgICAgICBnZXRQb2x5Z29uLFxuICAgICAgICAgIGdldEVsZXZhdGlvbixcbiAgICAgICAgICBnZXRDb2xvcjogZ2V0RmlsbENvbG9yLFxuXG4gICAgICAgICAgbGlnaHRTZXR0aW5nc1xuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgY29uc3QgcG9seWdvbldpcmVmcmFtZUxheWVyID1cbiAgICAgIGV4dHJ1ZGVkICYmXG4gICAgICB3aXJlZnJhbWUgJiZcbiAgICAgIGhhc0RhdGEgJiZcbiAgICAgIG5ldyBTb2xpZFBvbHlnb25MYXllcihcbiAgICAgICAgdGhpcy5nZXRTdWJMYXllclByb3BzKHtcbiAgICAgICAgICBpZDogJ3dpcmVmcmFtZScsXG4gICAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICAgIGdldEVsZXZhdGlvbjogdXBkYXRlVHJpZ2dlcnMuZ2V0RWxldmF0aW9uLFxuICAgICAgICAgICAgZ2V0Q29sb3I6IHVwZGF0ZVRyaWdnZXJzLmdldExpbmVDb2xvclxuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRhLFxuXG4gICAgICAgICAgZnA2NCxcbiAgICAgICAgICBleHRydWRlZDogdHJ1ZSxcbiAgICAgICAgICBlbGV2YXRpb25TY2FsZSxcbiAgICAgICAgICB3aXJlZnJhbWU6IHRydWUsXG5cbiAgICAgICAgICBnZXRQb2x5Z29uLFxuICAgICAgICAgIGdldEVsZXZhdGlvbixcbiAgICAgICAgICBnZXRDb2xvcjogZ2V0TGluZUNvbG9yXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAvLyBQb2x5Z29uIGxpbmUgbGF5ZXJcbiAgICBjb25zdCBwb2x5Z29uTGluZUxheWVyID1cbiAgICAgICFleHRydWRlZCAmJlxuICAgICAgc3Ryb2tlZCAmJlxuICAgICAgaGFzRGF0YSAmJlxuICAgICAgbmV3IFBhdGhMYXllcihcbiAgICAgICAgdGhpcy5nZXRTdWJMYXllclByb3BzKHtcbiAgICAgICAgICBpZDogJ3N0cm9rZScsXG4gICAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICAgIGdldFdpZHRoOiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lV2lkdGgsXG4gICAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZUNvbG9yLFxuICAgICAgICAgICAgZ2V0RGFzaEFycmF5OiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lRGFzaEFycmF5XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGE6IHBhdGhzLFxuXG4gICAgICAgICAgZnA2NCxcbiAgICAgICAgICB3aWR0aFNjYWxlOiBsaW5lV2lkdGhTY2FsZSxcbiAgICAgICAgICB3aWR0aE1pblBpeGVsczogbGluZVdpZHRoTWluUGl4ZWxzLFxuICAgICAgICAgIHdpZHRoTWF4UGl4ZWxzOiBsaW5lV2lkdGhNYXhQaXhlbHMsXG4gICAgICAgICAgcm91bmRlZDogbGluZUpvaW50Um91bmRlZCxcbiAgICAgICAgICBtaXRlckxpbWl0OiBsaW5lTWl0ZXJMaW1pdCxcbiAgICAgICAgICBkYXNoSnVzdGlmaWVkOiBsaW5lRGFzaEp1c3RpZmllZCxcblxuICAgICAgICAgIGdldFBhdGg6IHggPT4geC5wYXRoLFxuICAgICAgICAgIGdldENvbG9yOiB4ID0+IGdldExpbmVDb2xvcih4Lm9iamVjdCksXG4gICAgICAgICAgZ2V0V2lkdGg6IHggPT4gZ2V0TGluZVdpZHRoKHgub2JqZWN0KSxcbiAgICAgICAgICBnZXREYXNoQXJyYXk6IGdldExpbmVEYXNoQXJyYXkgJiYgKHggPT4gZ2V0TGluZURhc2hBcnJheSh4Lm9iamVjdCkpXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICByZXR1cm4gW1xuICAgICAgLy8gSWYgbm90IGV4dHJ1ZGVkOiBmbGF0IGZpbGwgbGF5ZXIgaXMgZHJhd24gYmVsb3cgb3V0bGluZXNcbiAgICAgICFleHRydWRlZCAmJiBwb2x5Z29uTGF5ZXIsXG4gICAgICBwb2x5Z29uV2lyZWZyYW1lTGF5ZXIsXG4gICAgICBwb2x5Z29uTGluZUxheWVyLFxuICAgICAgLy8gSWYgZXh0cnVkZWQ6IGRyYXcgZmlsbCBsYXllciBsYXN0IGZvciBjb3JyZWN0IGJsZW5kaW5nIGJlaGF2aW9yXG4gICAgICBleHRydWRlZCAmJiBwb2x5Z29uTGF5ZXJcbiAgICBdO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xufVxuXG5Qb2x5Z29uTGF5ZXIubGF5ZXJOYW1lID0gJ1BvbHlnb25MYXllcic7XG5Qb2x5Z29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19