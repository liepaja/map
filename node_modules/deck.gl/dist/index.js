'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.experimental = exports.DeckGL = exports.default = exports.GeoJsonLayer = exports.PolygonLayer = exports.PathLayer = exports.HexagonCellLayer = exports.HexagonLayer = exports.GridCellLayer = exports.GridLayer = exports.ScreenGridLayer = exports.ScatterplotLayer = exports.PointCloudLayer = exports.LineLayer = exports.IconLayer = exports.ArcLayer = exports.lighting = exports.project64 = exports.project = exports.OrthographicViewport = exports.PerspectiveViewport = exports.WebMercatorViewport = exports.Viewport = exports.CompositeLayer = exports.Layer = exports.AttributeManager = exports.LayerManager = exports.COORDINATE_SYSTEM = undefined;

var _core = require('./core');

Object.defineProperty(exports, 'COORDINATE_SYSTEM', {
  enumerable: true,
  get: function get() {
    return _core.COORDINATE_SYSTEM;
  }
});
Object.defineProperty(exports, 'LayerManager', {
  enumerable: true,
  get: function get() {
    return _core.LayerManager;
  }
});
Object.defineProperty(exports, 'AttributeManager', {
  enumerable: true,
  get: function get() {
    return _core.AttributeManager;
  }
});
Object.defineProperty(exports, 'Layer', {
  enumerable: true,
  get: function get() {
    return _core.Layer;
  }
});
Object.defineProperty(exports, 'CompositeLayer', {
  enumerable: true,
  get: function get() {
    return _core.CompositeLayer;
  }
});
Object.defineProperty(exports, 'Viewport', {
  enumerable: true,
  get: function get() {
    return _core.Viewport;
  }
});
Object.defineProperty(exports, 'WebMercatorViewport', {
  enumerable: true,
  get: function get() {
    return _core.WebMercatorViewport;
  }
});
Object.defineProperty(exports, 'PerspectiveViewport', {
  enumerable: true,
  get: function get() {
    return _core.PerspectiveViewport;
  }
});
Object.defineProperty(exports, 'OrthographicViewport', {
  enumerable: true,
  get: function get() {
    return _core.OrthographicViewport;
  }
});
Object.defineProperty(exports, 'project', {
  enumerable: true,
  get: function get() {
    return _core.project;
  }
});
Object.defineProperty(exports, 'project64', {
  enumerable: true,
  get: function get() {
    return _core.project64;
  }
});
Object.defineProperty(exports, 'lighting', {
  enumerable: true,
  get: function get() {
    return _core.lighting;
  }
});

var _coreLayers = require('./core-layers');

Object.defineProperty(exports, 'ArcLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.ArcLayer;
  }
});
Object.defineProperty(exports, 'IconLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.IconLayer;
  }
});
Object.defineProperty(exports, 'LineLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.LineLayer;
  }
});
Object.defineProperty(exports, 'PointCloudLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.PointCloudLayer;
  }
});
Object.defineProperty(exports, 'ScatterplotLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.ScatterplotLayer;
  }
});
Object.defineProperty(exports, 'ScreenGridLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.ScreenGridLayer;
  }
});
Object.defineProperty(exports, 'GridLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.GridLayer;
  }
});
Object.defineProperty(exports, 'GridCellLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.GridCellLayer;
  }
});
Object.defineProperty(exports, 'HexagonLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.HexagonLayer;
  }
});
Object.defineProperty(exports, 'HexagonCellLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.HexagonCellLayer;
  }
});
Object.defineProperty(exports, 'PathLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.PathLayer;
  }
});
Object.defineProperty(exports, 'PolygonLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.PolygonLayer;
  }
});
Object.defineProperty(exports, 'GeoJsonLayer', {
  enumerable: true,
  get: function get() {
    return _coreLayers.GeoJsonLayer;
  }
});

var _react = require('./react');

Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_react).default;
  }
});
Object.defineProperty(exports, 'DeckGL', {
  enumerable: true,
  get: function get() {
    return _react.DeckGL;
  }
});

var _reflectionEffect = require('./effects/experimental/reflection-effect/reflection-effect');

var _reflectionEffect2 = _interopRequireDefault(_reflectionEffect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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
/* eslint-disable max-len */

var experimental = {};

//
// CORE LIBRARY
//

// EXPERIMENTAL CORE LIB CLASSES (May change in minor version bumps, use at your own risk)
var ViewState = _core.experimental.ViewState,
    FirstPersonState = _core.experimental.FirstPersonState,
    OrbitState = _core.experimental.OrbitState,
    MapState = _core.experimental.MapState,
    Controller = _core.experimental.Controller,
    FirstPersonController = _core.experimental.FirstPersonController,
    FirstPersonViewport = _core.experimental.FirstPersonViewport,
    OrbitViewport = _core.experimental.OrbitViewport,
    ThirdPersonViewport = _core.experimental.ThirdPersonViewport,
    TRANSITION_EVENTS = _core.experimental.TRANSITION_EVENTS,
    LinearInterpolator = _core.experimental.LinearInterpolator,
    ViewportFlyToInterpolator = _core.experimental.ViewportFlyToInterpolator,
    DeckGLJS = _core.experimental.DeckGLJS,
    MapControllerJS = _core.experimental.MapControllerJS,
    EffectManager = _core.experimental.EffectManager,
    Effect = _core.experimental.Effect;


Object.assign(experimental, {
  // Unfinished controller/viewport classes
  ViewState: ViewState,
  FirstPersonState: FirstPersonState,
  OrbitState: OrbitState,
  MapState: MapState,

  Controller: Controller,
  FirstPersonController: FirstPersonController,

  FirstPersonViewport: FirstPersonViewport,
  OrbitViewport: OrbitViewport,
  ThirdPersonViewport: ThirdPersonViewport,

  // Transition bindings
  TRANSITION_EVENTS: TRANSITION_EVENTS,
  LinearInterpolator: LinearInterpolator,
  ViewportFlyToInterpolator: ViewportFlyToInterpolator,

  // Pure JS (non-React) API
  DeckGLJS: DeckGLJS,
  MapControllerJS: MapControllerJS,

  // Effects base classes
  EffectManager: EffectManager,
  Effect: Effect
});

// Experimental Data Accessor Helpers
// INTERNAL - TODO remove from experimental exports
var TransitionManager = _core.experimental.TransitionManager,
    extractViewportFrom = _core.experimental.extractViewportFrom,
    BinSorter = _core.experimental.BinSorter,
    linearScale = _core.experimental.linearScale,
    getLinearScale = _core.experimental.getLinearScale,
    quantizeScale = _core.experimental.quantizeScale,
    getQuantizeScale = _core.experimental.getQuantizeScale,
    clamp = _core.experimental.clamp,
    defaultColorRange = _core.experimental.defaultColorRange,
    log = _core.experimental.log,
    get = _core.experimental.get,
    count = _core.experimental.count,
    flatten = _core.experimental.flatten,
    countVertices = _core.experimental.countVertices,
    flattenVertices = _core.experimental.flattenVertices,
    fillArray = _core.experimental.fillArray,
    enable64bitSupport = _core.experimental.enable64bitSupport,
    fp64ify = _core.experimental.fp64ify,
    fp64LowPart = _core.experimental.fp64LowPart;


Object.assign(experimental, {
  // For react module
  TransitionManager: TransitionManager,
  extractViewportFrom: extractViewportFrom,

  // For layers
  BinSorter: BinSorter,
  linearScale: linearScale,
  getLinearScale: getLinearScale,
  quantizeScale: quantizeScale,
  getQuantizeScale: getQuantizeScale,
  clamp: clamp,
  defaultColorRange: defaultColorRange,

  log: log,

  get: get,
  count: count,

  flatten: flatten,
  countVertices: countVertices,
  flattenVertices: flattenVertices,
  fillArray: fillArray,

  enable64bitSupport: enable64bitSupport,
  fp64ify: fp64ify,
  fp64LowPart: fp64LowPart
});

//
// CORE LAYERS PACKAGE
//

//
// EFFECTS PACKAGE
//

Object.assign(experimental, {
  ReflectionEffect: _reflectionEffect2.default
});

//
// REACT BINDINGS PACKAGE
//

// TODO - do we need to expose these?


Object.assign(experimental, {
  MapController: _react.MapController,
  OrbitController: _react.OrbitController,
  ViewportController: _react.ViewportController
});

//
// EXPERIMENTAL EXPORTS
//

exports.experimental = experimental;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJDT09SRElOQVRFX1NZU1RFTSIsIkxheWVyTWFuYWdlciIsIkF0dHJpYnV0ZU1hbmFnZXIiLCJMYXllciIsIkNvbXBvc2l0ZUxheWVyIiwiVmlld3BvcnQiLCJXZWJNZXJjYXRvclZpZXdwb3J0IiwiUGVyc3BlY3RpdmVWaWV3cG9ydCIsIk9ydGhvZ3JhcGhpY1ZpZXdwb3J0IiwicHJvamVjdCIsInByb2plY3Q2NCIsImxpZ2h0aW5nIiwiQXJjTGF5ZXIiLCJJY29uTGF5ZXIiLCJMaW5lTGF5ZXIiLCJQb2ludENsb3VkTGF5ZXIiLCJTY2F0dGVycGxvdExheWVyIiwiU2NyZWVuR3JpZExheWVyIiwiR3JpZExheWVyIiwiR3JpZENlbGxMYXllciIsIkhleGFnb25MYXllciIsIkhleGFnb25DZWxsTGF5ZXIiLCJQYXRoTGF5ZXIiLCJQb2x5Z29uTGF5ZXIiLCJHZW9Kc29uTGF5ZXIiLCJkZWZhdWx0IiwiRGVja0dMIiwiZXhwZXJpbWVudGFsIiwiVmlld1N0YXRlIiwiRmlyc3RQZXJzb25TdGF0ZSIsIk9yYml0U3RhdGUiLCJNYXBTdGF0ZSIsIkNvbnRyb2xsZXIiLCJGaXJzdFBlcnNvbkNvbnRyb2xsZXIiLCJGaXJzdFBlcnNvblZpZXdwb3J0IiwiT3JiaXRWaWV3cG9ydCIsIlRoaXJkUGVyc29uVmlld3BvcnQiLCJUUkFOU0lUSU9OX0VWRU5UUyIsIkxpbmVhckludGVycG9sYXRvciIsIlZpZXdwb3J0Rmx5VG9JbnRlcnBvbGF0b3IiLCJEZWNrR0xKUyIsIk1hcENvbnRyb2xsZXJKUyIsIkVmZmVjdE1hbmFnZXIiLCJFZmZlY3QiLCJPYmplY3QiLCJhc3NpZ24iLCJUcmFuc2l0aW9uTWFuYWdlciIsImV4dHJhY3RWaWV3cG9ydEZyb20iLCJCaW5Tb3J0ZXIiLCJsaW5lYXJTY2FsZSIsImdldExpbmVhclNjYWxlIiwicXVhbnRpemVTY2FsZSIsImdldFF1YW50aXplU2NhbGUiLCJjbGFtcCIsImRlZmF1bHRDb2xvclJhbmdlIiwibG9nIiwiZ2V0IiwiY291bnQiLCJmbGF0dGVuIiwiY291bnRWZXJ0aWNlcyIsImZsYXR0ZW5WZXJ0aWNlcyIsImZpbGxBcnJheSIsImVuYWJsZTY0Yml0U3VwcG9ydCIsImZwNjRpZnkiLCJmcDY0TG93UGFydCIsIlJlZmxlY3Rpb25FZmZlY3QiLCJNYXBDb250cm9sbGVyIiwiT3JiaXRDb250cm9sbGVyIiwiVmlld3BvcnRDb250cm9sbGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7aUJBNkJFQSxpQjs7Ozs7O2lCQUNBQyxZOzs7Ozs7aUJBQ0FDLGdCOzs7Ozs7aUJBQ0FDLEs7Ozs7OztpQkFDQUMsYzs7Ozs7O2lCQUVBQyxROzs7Ozs7aUJBQ0FDLG1COzs7Ozs7aUJBQ0FDLG1COzs7Ozs7aUJBQ0FDLG9COzs7Ozs7aUJBRUFDLE87Ozs7OztpQkFDQUMsUzs7Ozs7O2lCQUNBQyxROzs7Ozs7Ozs7dUJBK0hBQyxROzs7Ozs7dUJBQ0FDLFM7Ozs7Ozt1QkFDQUMsUzs7Ozs7O3VCQUNBQyxlOzs7Ozs7dUJBQ0FDLGdCOzs7Ozs7dUJBQ0FDLGU7Ozs7Ozt1QkFDQUMsUzs7Ozs7O3VCQUNBQyxhOzs7Ozs7dUJBQ0FDLFk7Ozs7Ozt1QkFDQUMsZ0I7Ozs7Ozt1QkFDQUMsUzs7Ozs7O3VCQUNBQyxZOzs7Ozs7dUJBQ0FDLFk7Ozs7Ozs7OzswQ0FpQk1DLE87Ozs7OztrQkFBU0MsTTs7OztBQVZqQjs7Ozs7O0FBNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUMsZUFBZSxFQUFyQjs7QUFFQTtBQUNBO0FBQ0E7O0FBb0JBO0lBS0VDLFMsc0JBQUFBLFM7SUFDQUMsZ0Isc0JBQUFBLGdCO0lBQ0FDLFUsc0JBQUFBLFU7SUFDQUMsUSxzQkFBQUEsUTtJQUdBQyxVLHNCQUFBQSxVO0lBQ0FDLHFCLHNCQUFBQSxxQjtJQUdBQyxtQixzQkFBQUEsbUI7SUFDQUMsYSxzQkFBQUEsYTtJQUNBQyxtQixzQkFBQUEsbUI7SUFHQUMsaUIsc0JBQUFBLGlCO0lBQ0FDLGtCLHNCQUFBQSxrQjtJQUNBQyx5QixzQkFBQUEseUI7SUFFQUMsUSxzQkFBQUEsUTtJQUNBQyxlLHNCQUFBQSxlO0lBRUFDLGEsc0JBQUFBLGE7SUFDQUMsTSxzQkFBQUEsTTs7O0FBR0ZDLE9BQU9DLE1BQVAsQ0FBY2xCLFlBQWQsRUFBNEI7QUFDMUI7QUFDQUMsc0JBRjBCO0FBRzFCQyxvQ0FIMEI7QUFJMUJDLHdCQUowQjtBQUsxQkMsb0JBTDBCOztBQU8xQkMsd0JBUDBCO0FBUTFCQyw4Q0FSMEI7O0FBVTFCQywwQ0FWMEI7QUFXMUJDLDhCQVgwQjtBQVkxQkMsMENBWjBCOztBQWMxQjtBQUNBQyxzQ0FmMEI7QUFnQjFCQyx3Q0FoQjBCO0FBaUIxQkMsc0RBakIwQjs7QUFtQjFCO0FBQ0FDLG9CQXBCMEI7QUFxQjFCQyxrQ0FyQjBCOztBQXVCMUI7QUFDQUMsOEJBeEIwQjtBQXlCMUJDO0FBekIwQixDQUE1Qjs7QUE0QkE7QUFDQTtJQUdFRyxpQixzQkFBQUEsaUI7SUFDQUMsbUIsc0JBQUFBLG1CO0lBR0FDLFMsc0JBQUFBLFM7SUFDQUMsVyxzQkFBQUEsVztJQUNBQyxjLHNCQUFBQSxjO0lBQ0FDLGEsc0JBQUFBLGE7SUFDQUMsZ0Isc0JBQUFBLGdCO0lBQ0FDLEssc0JBQUFBLEs7SUFDQUMsaUIsc0JBQUFBLGlCO0lBRUFDLEcsc0JBQUFBLEc7SUFFQUMsRyxzQkFBQUEsRztJQUNBQyxLLHNCQUFBQSxLO0lBRUFDLE8sc0JBQUFBLE87SUFDQUMsYSxzQkFBQUEsYTtJQUNBQyxlLHNCQUFBQSxlO0lBQ0FDLFMsc0JBQUFBLFM7SUFFQUMsa0Isc0JBQUFBLGtCO0lBQ0FDLE8sc0JBQUFBLE87SUFDQUMsVyxzQkFBQUEsVzs7O0FBR0ZwQixPQUFPQyxNQUFQLENBQWNsQixZQUFkLEVBQTRCO0FBQzFCO0FBQ0FtQixzQ0FGMEI7QUFHMUJDLDBDQUgwQjs7QUFLMUI7QUFDQUMsc0JBTjBCO0FBTzFCQywwQkFQMEI7QUFRMUJDLGdDQVIwQjtBQVMxQkMsOEJBVDBCO0FBVTFCQyxvQ0FWMEI7QUFXMUJDLGNBWDBCO0FBWTFCQyxzQ0FaMEI7O0FBYzFCQyxVQWQwQjs7QUFnQjFCQyxVQWhCMEI7QUFpQjFCQyxjQWpCMEI7O0FBbUIxQkMsa0JBbkIwQjtBQW9CMUJDLDhCQXBCMEI7QUFxQjFCQyxrQ0FyQjBCO0FBc0IxQkMsc0JBdEIwQjs7QUF3QjFCQyx3Q0F4QjBCO0FBeUIxQkMsa0JBekIwQjtBQTBCMUJDO0FBMUIwQixDQUE1Qjs7QUE2QkE7QUFDQTtBQUNBOztBQWtCQTtBQUNBO0FBQ0E7O0FBSUFwQixPQUFPQyxNQUFQLENBQWNsQixZQUFkLEVBQTRCO0FBQzFCc0M7QUFEMEIsQ0FBNUI7O0FBSUE7QUFDQTtBQUNBOztBQUlBOzs7QUFPQXJCLE9BQU9DLE1BQVAsQ0FBY2xCLFlBQWQsRUFBNEI7QUFDMUJ1QyxxQ0FEMEI7QUFFMUJDLHlDQUYwQjtBQUcxQkM7QUFIMEIsQ0FBNUI7O0FBTUE7QUFDQTtBQUNBOztRQUVRekMsWSxHQUFBQSxZIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmNvbnN0IGV4cGVyaW1lbnRhbCA9IHt9O1xuXG4vL1xuLy8gQ09SRSBMSUJSQVJZXG4vL1xuXG5leHBvcnQge1xuICAvLyBMSUJcbiAgQ09PUkRJTkFURV9TWVNURU0sXG4gIExheWVyTWFuYWdlcixcbiAgQXR0cmlidXRlTWFuYWdlcixcbiAgTGF5ZXIsXG4gIENvbXBvc2l0ZUxheWVyLFxuICAvLyBWaWV3cG9ydHNcbiAgVmlld3BvcnQsXG4gIFdlYk1lcmNhdG9yVmlld3BvcnQsXG4gIFBlcnNwZWN0aXZlVmlld3BvcnQsXG4gIE9ydGhvZ3JhcGhpY1ZpZXdwb3J0LFxuICAvLyBTaGFkZXIgbW9kdWxlc1xuICBwcm9qZWN0LFxuICBwcm9qZWN0NjQsXG4gIGxpZ2h0aW5nXG59IGZyb20gJy4vY29yZSc7XG5cbi8vIEVYUEVSSU1FTlRBTCBDT1JFIExJQiBDTEFTU0VTIChNYXkgY2hhbmdlIGluIG1pbm9yIHZlcnNpb24gYnVtcHMsIHVzZSBhdCB5b3VyIG93biByaXNrKVxuaW1wb3J0IHtleHBlcmltZW50YWwgYXMgQ29yZUV4cGVyaW1lbnRhbH0gZnJvbSAnLi9jb3JlJztcblxuY29uc3Qge1xuICAvLyBWaWV3IFN0YXRlc1xuICBWaWV3U3RhdGUsXG4gIEZpcnN0UGVyc29uU3RhdGUsXG4gIE9yYml0U3RhdGUsXG4gIE1hcFN0YXRlLFxuXG4gIC8vIENvbnRyb2xsZXJzXG4gIENvbnRyb2xsZXIsXG4gIEZpcnN0UGVyc29uQ29udHJvbGxlcixcblxuICAvLyBWaWV3cG9ydHNcbiAgRmlyc3RQZXJzb25WaWV3cG9ydCxcbiAgT3JiaXRWaWV3cG9ydCxcbiAgVGhpcmRQZXJzb25WaWV3cG9ydCxcblxuICAvLyBUcmFuc2l0aW9uIGJpbmRpbmdzXG4gIFRSQU5TSVRJT05fRVZFTlRTLFxuICBMaW5lYXJJbnRlcnBvbGF0b3IsXG4gIFZpZXdwb3J0Rmx5VG9JbnRlcnBvbGF0b3IsXG5cbiAgRGVja0dMSlMsXG4gIE1hcENvbnRyb2xsZXJKUyxcblxuICBFZmZlY3RNYW5hZ2VyLFxuICBFZmZlY3Rcbn0gPSBDb3JlRXhwZXJpbWVudGFsO1xuXG5PYmplY3QuYXNzaWduKGV4cGVyaW1lbnRhbCwge1xuICAvLyBVbmZpbmlzaGVkIGNvbnRyb2xsZXIvdmlld3BvcnQgY2xhc3Nlc1xuICBWaWV3U3RhdGUsXG4gIEZpcnN0UGVyc29uU3RhdGUsXG4gIE9yYml0U3RhdGUsXG4gIE1hcFN0YXRlLFxuXG4gIENvbnRyb2xsZXIsXG4gIEZpcnN0UGVyc29uQ29udHJvbGxlcixcblxuICBGaXJzdFBlcnNvblZpZXdwb3J0LFxuICBPcmJpdFZpZXdwb3J0LFxuICBUaGlyZFBlcnNvblZpZXdwb3J0LFxuXG4gIC8vIFRyYW5zaXRpb24gYmluZGluZ3NcbiAgVFJBTlNJVElPTl9FVkVOVFMsXG4gIExpbmVhckludGVycG9sYXRvcixcbiAgVmlld3BvcnRGbHlUb0ludGVycG9sYXRvcixcblxuICAvLyBQdXJlIEpTIChub24tUmVhY3QpIEFQSVxuICBEZWNrR0xKUyxcbiAgTWFwQ29udHJvbGxlckpTLFxuXG4gIC8vIEVmZmVjdHMgYmFzZSBjbGFzc2VzXG4gIEVmZmVjdE1hbmFnZXIsXG4gIEVmZmVjdFxufSk7XG5cbi8vIEV4cGVyaW1lbnRhbCBEYXRhIEFjY2Vzc29yIEhlbHBlcnNcbi8vIElOVEVSTkFMIC0gVE9ETyByZW1vdmUgZnJvbSBleHBlcmltZW50YWwgZXhwb3J0c1xuY29uc3Qge1xuICAvLyBGb3IgcmVhY3QgbW9kdWxlXG4gIFRyYW5zaXRpb25NYW5hZ2VyLFxuICBleHRyYWN0Vmlld3BvcnRGcm9tLFxuXG4gIC8vIEZvciBsYXllcnNcbiAgQmluU29ydGVyLFxuICBsaW5lYXJTY2FsZSxcbiAgZ2V0TGluZWFyU2NhbGUsXG4gIHF1YW50aXplU2NhbGUsXG4gIGdldFF1YW50aXplU2NhbGUsXG4gIGNsYW1wLFxuICBkZWZhdWx0Q29sb3JSYW5nZSxcblxuICBsb2csXG5cbiAgZ2V0LFxuICBjb3VudCxcblxuICBmbGF0dGVuLFxuICBjb3VudFZlcnRpY2VzLFxuICBmbGF0dGVuVmVydGljZXMsXG4gIGZpbGxBcnJheSxcblxuICBlbmFibGU2NGJpdFN1cHBvcnQsXG4gIGZwNjRpZnksXG4gIGZwNjRMb3dQYXJ0XG59ID0gQ29yZUV4cGVyaW1lbnRhbDtcblxuT2JqZWN0LmFzc2lnbihleHBlcmltZW50YWwsIHtcbiAgLy8gRm9yIHJlYWN0IG1vZHVsZVxuICBUcmFuc2l0aW9uTWFuYWdlcixcbiAgZXh0cmFjdFZpZXdwb3J0RnJvbSxcblxuICAvLyBGb3IgbGF5ZXJzXG4gIEJpblNvcnRlcixcbiAgbGluZWFyU2NhbGUsXG4gIGdldExpbmVhclNjYWxlLFxuICBxdWFudGl6ZVNjYWxlLFxuICBnZXRRdWFudGl6ZVNjYWxlLFxuICBjbGFtcCxcbiAgZGVmYXVsdENvbG9yUmFuZ2UsXG5cbiAgbG9nLFxuXG4gIGdldCxcbiAgY291bnQsXG5cbiAgZmxhdHRlbixcbiAgY291bnRWZXJ0aWNlcyxcbiAgZmxhdHRlblZlcnRpY2VzLFxuICBmaWxsQXJyYXksXG5cbiAgZW5hYmxlNjRiaXRTdXBwb3J0LFxuICBmcDY0aWZ5LFxuICBmcDY0TG93UGFydFxufSk7XG5cbi8vXG4vLyBDT1JFIExBWUVSUyBQQUNLQUdFXG4vL1xuXG5leHBvcnQge1xuICBBcmNMYXllcixcbiAgSWNvbkxheWVyLFxuICBMaW5lTGF5ZXIsXG4gIFBvaW50Q2xvdWRMYXllcixcbiAgU2NhdHRlcnBsb3RMYXllcixcbiAgU2NyZWVuR3JpZExheWVyLFxuICBHcmlkTGF5ZXIsXG4gIEdyaWRDZWxsTGF5ZXIsXG4gIEhleGFnb25MYXllcixcbiAgSGV4YWdvbkNlbGxMYXllcixcbiAgUGF0aExheWVyLFxuICBQb2x5Z29uTGF5ZXIsXG4gIEdlb0pzb25MYXllclxufSBmcm9tICcuL2NvcmUtbGF5ZXJzJztcblxuLy9cbi8vIEVGRkVDVFMgUEFDS0FHRVxuLy9cblxuaW1wb3J0IHtkZWZhdWx0IGFzIFJlZmxlY3Rpb25FZmZlY3R9IGZyb20gJy4vZWZmZWN0cy9leHBlcmltZW50YWwvcmVmbGVjdGlvbi1lZmZlY3QvcmVmbGVjdGlvbi1lZmZlY3QnO1xuXG5PYmplY3QuYXNzaWduKGV4cGVyaW1lbnRhbCwge1xuICBSZWZsZWN0aW9uRWZmZWN0XG59KTtcblxuLy9cbi8vIFJFQUNUIEJJTkRJTkdTIFBBQ0tBR0Vcbi8vXG5cbmV4cG9ydCB7ZGVmYXVsdCwgRGVja0dMfSBmcm9tICcuL3JlYWN0JztcblxuLy8gVE9ETyAtIGRvIHdlIG5lZWQgdG8gZXhwb3NlIHRoZXNlP1xuaW1wb3J0IHtcbiAgTWFwQ29udHJvbGxlcixcbiAgT3JiaXRDb250cm9sbGVyLFxuICBWaWV3cG9ydENvbnRyb2xsZXIgLy8gVE9ETyAtIG1lcmdlIHdpdGggZGVjay5nbD9cbn0gZnJvbSAnLi9yZWFjdCc7XG5cbk9iamVjdC5hc3NpZ24oZXhwZXJpbWVudGFsLCB7XG4gIE1hcENvbnRyb2xsZXIsXG4gIE9yYml0Q29udHJvbGxlcixcbiAgVmlld3BvcnRDb250cm9sbGVyXG59KTtcblxuLy9cbi8vIEVYUEVSSU1FTlRBTCBFWFBPUlRTXG4vL1xuXG5leHBvcnQge2V4cGVyaW1lbnRhbH07XG4iXX0=