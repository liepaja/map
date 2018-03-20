'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testInitializeLayer = testInitializeLayer;
exports.testUpdateLayer = testUpdateLayer;
exports.testDrawLayer = testDrawLayer;
exports.testLayerUpdates = testLayerUpdates;
exports.testSubLayerUpdateTriggers = testSubLayerUpdateTriggers;
exports.testCreateLayer = testCreateLayer;
exports.testCreateEmptyLayer = testCreateEmptyLayer;
exports.testNullLayer = testNullLayer;

var _core = require('deck.gl/core');

var _spy = require('./spy');

var _spy2 = _interopRequireDefault(_spy);

var _setupGl = require('./setup-gl');

var _setupGl2 = _interopRequireDefault(_setupGl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } // Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

function testInitializeLayer(_ref) {
  var layer = _ref.layer,
      viewport = _ref.viewport;

  var layerManager = new _core.LayerManager(_setupGl2.default);
  layerManager.setViewport(new _core.WebMercatorViewport(100, 100));

  try {
    layerManager.setLayers([layer]);
  } catch (error) {
    return error;
  }

  return null;
}

function testUpdateLayer(_ref2) {
  var layer = _ref2.layer,
      viewport = _ref2.viewport,
      newProps = _ref2.newProps;

  var layerManager = new _core.LayerManager(_setupGl2.default);
  layerManager.setViewport(new _core.WebMercatorViewport(100, 100));

  try {
    layerManager.setLayers([layer]);
    layerManager.setLayers([layer.clone(newProps)]);
  } catch (error) {
    return error;
  }

  return null;
}

function testDrawLayer(_ref3) {
  var layer = _ref3.layer,
      _ref3$uniforms = _ref3.uniforms,
      uniforms = _ref3$uniforms === undefined ? {} : _ref3$uniforms;

  var layerManager = new _core.LayerManager(_setupGl2.default);
  layerManager.setViewport(new _core.WebMercatorViewport(100, 100));

  try {
    layerManager.setLayers([layer]);
    layerManager.drawLayers();
  } catch (error) {
    return error;
  }

  return null;
}

/**
 * Initialize a layer, test layer update
 * on a series of newProps, assert on the resulting layer
 *
 * Note: Updates are called sequentially. updateProps will be merged
 * with previous props
 *
 * @param {Function} t - test function
 * @param {Object} opt - test options
 * @param {Object} opt.LayerComponent - The layer component class
 * @param {Array} opt.testCases - A list of testCases
 * @param {Object} opt.testCases.INITIAL_PROPS - The initial prop to initialize the layer with
 * @param {Array} opt.testCases.UPDATES - The list of updates to update
 * @param {Object} opt.testCases.UPDATES.updateProps - updated props
 * @param {Function} opt.testCases.UPDATES.assert - callbacks with updated layer, and oldState
 */

function testLayerUpdates(t, _ref4) {
  var LayerComponent = _ref4.LayerComponent,
      testCases = _ref4.testCases;

  var layerManager = new _core.LayerManager(_setupGl2.default);
  layerManager.setViewport(new _core.WebMercatorViewport(100, 100));

  var newProps = Object.assign({}, testCases.INITIAL_PROPS);
  var layer = new LayerComponent(newProps);

  t.doesNotThrow(function () {
    return layerManager.setLayers([layer]);
  }, 'initialization of ' + LayerComponent.layerName + ' should not fail');

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var _step$value = _step.value,
          updateProps = _step$value.updateProps,
          assert = _step$value.assert;

      // Add on new props every iteration
      Object.assign(newProps, updateProps);

      // copy old state before update
      var oldState = Object.assign({}, layer.state);

      var newLayer = layer.clone(newProps);
      t.doesNotThrow(function () {
        return layerManager.setLayers([newLayer]);
      }, 'update ' + LayerComponent.layerName + ' should not fail');

      // call draw layer
      t.doesNotThrow(function () {
        return layerManager.drawLayers();
      }, 'draw ' + LayerComponent.layerName + ' should not fail');

      // assert on updated layer
      assert(newLayer, oldState, t);
    };

    for (var _iterator = testCases.UPDATES[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      _loop();
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

/**
 * Initialize a parent layer and its subLayer
 * update the parent layer a series of newProps, assert on the updated subLayer
 *
 * Note: Updates are called sequentially. updateProps will be merged
 * with previous props
 *
 * @param {Function} t - test function
 * @param {Object} opt - test options
 * @param {Object} opt.FunctionsToSpy - Functions that spied by spy
 * @param {Object} opt.LayerComponent - The layer component class
 * @param {Array} opt.testCases - A list of testCases
 * @param {Object} opt.testCases.INITIAL_PROPS - The initial prop to initialize the layer with
 * @param {Array} opt.testCases.UPDATES - The list of updates to update
 * @param {Object} opt.testCases.UPDATES.updateProps - updated props
 * @param {Function} opt.testCases.UPDATES.assert - callbacks with updated layer, and oldState
 */

function testSubLayerUpdateTriggers(t, _ref5) {
  var FunctionsToSpy = _ref5.FunctionsToSpy,
      LayerComponent = _ref5.LayerComponent,
      testCases = _ref5.testCases;

  var layerManager = new _core.LayerManager(_setupGl2.default);
  layerManager.setViewport(new _core.WebMercatorViewport(100, 100));

  var newProps = Object.assign({}, testCases.INITIAL_PROPS);

  // initialize parent layer (generates and initializes)
  var layer = new LayerComponent(newProps);
  t.doesNotThrow(function () {
    return layerManager.setLayers([layer]);
  }, 'initialization of ' + LayerComponent.layerName + ' should not fail');

  // Create a map of spies that the test case can inspect
  var spies = FunctionsToSpy.reduce(function (accu, curr) {
    return Object.assign(accu, _defineProperty({}, curr, (0, _spy2.default)(LayerComponent.prototype, curr)));
  }, {});

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    var _loop2 = function _loop2() {
      var _step2$value = _step2.value,
          updateProps = _step2$value.updateProps,
          assert = _step2$value.assert;

      // Add on new props every iteration
      Object.assign(newProps, updateProps);

      var newLayer = layer.clone(newProps);
      t.doesNotThrow(function () {
        return layerManager.setLayers([newLayer]);
      }, 'update ' + LayerComponent.layerName + ' should not fail');

      // layer manager should handle match subLayer and tranfer state and props
      // here we assume subLayer matches copy over the new props
      // from a new subLayer
      var subLayer = layer.getSubLayers()[0];

      // assert on updated subLayer
      assert(subLayer, spies, t);

      // reset spies
      Object.keys(spies).forEach(function (k) {
        return spies[k].reset();
      });
    };

    for (var _iterator2 = testCases.UPDATES[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      _loop2();
    }

    /*
    failures = testInitializeLayer({layer: subLayer});
    t.ok(!failures, `initialize ${LayerComponent.layerName} subLayer should not fail`);
    testCases.UPDATES.reduce((currentProps, {updateProps, assert}) => {
      // merge updated Props with initialProps
      const newProps = Object.assign({}, currentProps, updateProps);
      // call update layer with new props
      testUpdateLayer({layer, newProps});
      testUpdateLayer({layer: subLayer, newProps: newSubLayer.props});
      t.ok(!failures, `update ${LayerComponent.layerName} subLayer should not fail`);
      return newProps;
    }, testCases.INITIAL_PROPS);
    */

    // restore spies
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

  Object.keys(spies).forEach(function (k) {
    return spies[k].restore();
  });
}

function testCreateLayer(t, LayerComponent) {
  var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var failures = false;
  var layer = null;

  try {
    layer = new LayerComponent(Object.assign({
      id: LayerComponent.layerName + '-0'
    }, props));

    t.ok(layer instanceof LayerComponent, LayerComponent.layerName + ' created');
  } catch (error) {
    failures = true;
  }
  t.ok(!failures, 'creating ' + LayerComponent.layerName + ' should not fail');

  return layer;
}

function testCreateEmptyLayer(t, LayerComponent) {
  var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var failures = false;
  try {
    var emptyLayer = new LayerComponent(Object.assign({
      id: 'empty' + LayerComponent.layerName,
      data: [],
      pickable: true
    }, props));

    t.ok(emptyLayer instanceof LayerComponent, 'Empty ' + LayerComponent.layerName + ' created');
  } catch (error) {
    failures = true;
  }
  t.ok(!failures, 'creating empty ' + LayerComponent.layerName + ' should not fail');
}

function testNullLayer(t, LayerComponent) {
  t.doesNotThrow(function () {
    return new LayerComponent({
      id: 'nullPathLayer',
      data: null,
      pickable: true
    });
  }, 'Null ' + LayerComponent.layerName + ' did not throw exception');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL3NyYy9sYXllci1saWZlY3ljbGUtdXRpbHMuanMiXSwibmFtZXMiOlsidGVzdEluaXRpYWxpemVMYXllciIsInRlc3RVcGRhdGVMYXllciIsInRlc3REcmF3TGF5ZXIiLCJ0ZXN0TGF5ZXJVcGRhdGVzIiwidGVzdFN1YkxheWVyVXBkYXRlVHJpZ2dlcnMiLCJ0ZXN0Q3JlYXRlTGF5ZXIiLCJ0ZXN0Q3JlYXRlRW1wdHlMYXllciIsInRlc3ROdWxsTGF5ZXIiLCJsYXllciIsInZpZXdwb3J0IiwibGF5ZXJNYW5hZ2VyIiwic2V0Vmlld3BvcnQiLCJzZXRMYXllcnMiLCJlcnJvciIsIm5ld1Byb3BzIiwiY2xvbmUiLCJ1bmlmb3JtcyIsImRyYXdMYXllcnMiLCJ0IiwiTGF5ZXJDb21wb25lbnQiLCJ0ZXN0Q2FzZXMiLCJPYmplY3QiLCJhc3NpZ24iLCJJTklUSUFMX1BST1BTIiwiZG9lc05vdFRocm93IiwibGF5ZXJOYW1lIiwidXBkYXRlUHJvcHMiLCJhc3NlcnQiLCJvbGRTdGF0ZSIsInN0YXRlIiwibmV3TGF5ZXIiLCJVUERBVEVTIiwiRnVuY3Rpb25zVG9TcHkiLCJzcGllcyIsInJlZHVjZSIsImFjY3UiLCJjdXJyIiwicHJvdG90eXBlIiwic3ViTGF5ZXIiLCJnZXRTdWJMYXllcnMiLCJrZXlzIiwiZm9yRWFjaCIsImsiLCJyZXNldCIsInJlc3RvcmUiLCJwcm9wcyIsImZhaWx1cmVzIiwiaWQiLCJvayIsImVtcHR5TGF5ZXIiLCJkYXRhIiwicGlja2FibGUiXSwibWFwcGluZ3MiOiI7Ozs7O1FBd0JnQkEsbUIsR0FBQUEsbUI7UUFhQUMsZSxHQUFBQSxlO1FBY0FDLGEsR0FBQUEsYTtRQStCQUMsZ0IsR0FBQUEsZ0I7UUFzREFDLDBCLEdBQUFBLDBCO1FBOERBQyxlLEdBQUFBLGU7UUF1QkFDLG9CLEdBQUFBLG9CO1FBcUJBQyxhLEdBQUFBLGE7O0FBOU5oQjs7QUFDQTs7OztBQUNBOzs7Ozs7a05BdEJBO0FB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R2pCQyxnQkFBVTtBQUhPLEtBQW5CLENBREY7QUFBQSxHQURGLFlBT1VoQyxlQUFlTSxTQVB6QjtBQVNEIiwiZmlsZSI6ImxheWVyLWxpZmVjeWNsZS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0xheWVyTWFuYWdlciwgV2ViTWVyY2F0b3JWaWV3cG9ydH0gZnJvbSAnZGVjay5nbC9jb3JlJztcbmltcG9ydCBzcHkgZnJvbSAnLi9zcHknO1xuaW1wb3J0IGdsIGZyb20gJy4vc2V0dXAtZ2wnO1xuXG5leHBvcnQgZnVuY3Rpb24gdGVzdEluaXRpYWxpemVMYXllcih7bGF5ZXIsIHZpZXdwb3J0fSkge1xuICBjb25zdCBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKGdsKTtcbiAgbGF5ZXJNYW5hZ2VyLnNldFZpZXdwb3J0KG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KDEwMCwgMTAwKSk7XG5cbiAgdHJ5IHtcbiAgICBsYXllck1hbmFnZXIuc2V0TGF5ZXJzKFtsYXllcl0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdFVwZGF0ZUxheWVyKHtsYXllciwgdmlld3BvcnQsIG5ld1Byb3BzfSkge1xuICBjb25zdCBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKGdsKTtcbiAgbGF5ZXJNYW5hZ2VyLnNldFZpZXdwb3J0KG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KDEwMCwgMTAwKSk7XG5cbiAgdHJ5IHtcbiAgICBsYXllck1hbmFnZXIuc2V0TGF5ZXJzKFtsYXllcl0pO1xuICAgIGxheWVyTWFuYWdlci5zZXRMYXllcnMoW2xheWVyLmNsb25lKG5ld1Byb3BzKV0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdERyYXdMYXllcih7bGF5ZXIsIHVuaWZvcm1zID0ge319KSB7XG4gIGNvbnN0IGxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoZ2wpO1xuICBsYXllck1hbmFnZXIuc2V0Vmlld3BvcnQobmV3IFdlYk1lcmNhdG9yVmlld3BvcnQoMTAwLCAxMDApKTtcblxuICB0cnkge1xuICAgIGxheWVyTWFuYWdlci5zZXRMYXllcnMoW2xheWVyXSk7XG4gICAgbGF5ZXJNYW5hZ2VyLmRyYXdMYXllcnMoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbGF5ZXIsIHRlc3QgbGF5ZXIgdXBkYXRlXG4gKiBvbiBhIHNlcmllcyBvZiBuZXdQcm9wcywgYXNzZXJ0IG9uIHRoZSByZXN1bHRpbmcgbGF5ZXJcbiAqXG4gKiBOb3RlOiBVcGRhdGVzIGFyZSBjYWxsZWQgc2VxdWVudGlhbGx5LiB1cGRhdGVQcm9wcyB3aWxsIGJlIG1lcmdlZFxuICogd2l0aCBwcmV2aW91cyBwcm9wc1xuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHQgLSB0ZXN0IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0IC0gdGVzdCBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0LkxheWVyQ29tcG9uZW50IC0gVGhlIGxheWVyIGNvbXBvbmVudCBjbGFzc1xuICogQHBhcmFtIHtBcnJheX0gb3B0LnRlc3RDYXNlcyAtIEEgbGlzdCBvZiB0ZXN0Q2FzZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHQudGVzdENhc2VzLklOSVRJQUxfUFJPUFMgLSBUaGUgaW5pdGlhbCBwcm9wIHRvIGluaXRpYWxpemUgdGhlIGxheWVyIHdpdGhcbiAqIEBwYXJhbSB7QXJyYXl9IG9wdC50ZXN0Q2FzZXMuVVBEQVRFUyAtIFRoZSBsaXN0IG9mIHVwZGF0ZXMgdG8gdXBkYXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0LnRlc3RDYXNlcy5VUERBVEVTLnVwZGF0ZVByb3BzIC0gdXBkYXRlZCBwcm9wc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0LnRlc3RDYXNlcy5VUERBVEVTLmFzc2VydCAtIGNhbGxiYWNrcyB3aXRoIHVwZGF0ZWQgbGF5ZXIsIGFuZCBvbGRTdGF0ZVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0TGF5ZXJVcGRhdGVzKHQsIHtMYXllckNvbXBvbmVudCwgdGVzdENhc2VzfSkge1xuICBjb25zdCBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKGdsKTtcbiAgbGF5ZXJNYW5hZ2VyLnNldFZpZXdwb3J0KG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KDEwMCwgMTAwKSk7XG5cbiAgY29uc3QgbmV3UHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB0ZXN0Q2FzZXMuSU5JVElBTF9QUk9QUyk7XG4gIGNvbnN0IGxheWVyID0gbmV3IExheWVyQ29tcG9uZW50KG5ld1Byb3BzKTtcblxuICB0LmRvZXNOb3RUaHJvdyhcbiAgICAoKSA9PiBsYXllck1hbmFnZXIuc2V0TGF5ZXJzKFtsYXllcl0pLFxuICAgIGBpbml0aWFsaXphdGlvbiBvZiAke0xheWVyQ29tcG9uZW50LmxheWVyTmFtZX0gc2hvdWxkIG5vdCBmYWlsYFxuICApO1xuXG4gIGZvciAoY29uc3Qge3VwZGF0ZVByb3BzLCBhc3NlcnR9IG9mIHRlc3RDYXNlcy5VUERBVEVTKSB7XG4gICAgLy8gQWRkIG9uIG5ldyBwcm9wcyBldmVyeSBpdGVyYXRpb25cbiAgICBPYmplY3QuYXNzaWduKG5ld1Byb3BzLCB1cGRhdGVQcm9wcyk7XG5cbiAgICAvLyBjb3B5IG9sZCBzdGF0ZSBiZWZvcmUgdXBkYXRlXG4gICAgY29uc3Qgb2xkU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBsYXllci5zdGF0ZSk7XG5cbiAgICBjb25zdCBuZXdMYXllciA9IGxheWVyLmNsb25lKG5ld1Byb3BzKTtcbiAgICB0LmRvZXNOb3RUaHJvdyhcbiAgICAgICgpID0+IGxheWVyTWFuYWdlci5zZXRMYXllcnMoW25ld0xheWVyXSksXG4gICAgICBgdXBkYXRlICR7TGF5ZXJDb21wb25lbnQubGF5ZXJOYW1lfSBzaG91bGQgbm90IGZhaWxgXG4gICAgKTtcblxuICAgIC8vIGNhbGwgZHJhdyBsYXllclxuICAgIHQuZG9lc05vdFRocm93KFxuICAgICAgKCkgPT4gbGF5ZXJNYW5hZ2VyLmRyYXdMYXllcnMoKSxcbiAgICAgIGBkcmF3ICR7TGF5ZXJDb21wb25lbnQubGF5ZXJOYW1lfSBzaG91bGQgbm90IGZhaWxgXG4gICAgKTtcblxuICAgIC8vIGFzc2VydCBvbiB1cGRhdGVkIGxheWVyXG4gICAgYXNzZXJ0KG5ld0xheWVyLCBvbGRTdGF0ZSwgdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIGEgcGFyZW50IGxheWVyIGFuZCBpdHMgc3ViTGF5ZXJcbiAqIHVwZGF0ZSB0aGUgcGFyZW50IGxheWVyIGEgc2VyaWVzIG9mIG5ld1Byb3BzLCBhc3NlcnQgb24gdGhlIHVwZGF0ZWQgc3ViTGF5ZXJcbiAqXG4gKiBOb3RlOiBVcGRhdGVzIGFyZSBjYWxsZWQgc2VxdWVudGlhbGx5LiB1cGRhdGVQcm9wcyB3aWxsIGJlIG1lcmdlZFxuICogd2l0aCBwcmV2aW91cyBwcm9wc1xuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHQgLSB0ZXN0IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0IC0gdGVzdCBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0LkZ1bmN0aW9uc1RvU3B5IC0gRnVuY3Rpb25zIHRoYXQgc3BpZWQgYnkgc3B5XG4gKiBAcGFyYW0ge09iamVjdH0gb3B0LkxheWVyQ29tcG9uZW50IC0gVGhlIGxheWVyIGNvbXBvbmVudCBjbGFzc1xuICogQHBhcmFtIHtBcnJheX0gb3B0LnRlc3RDYXNlcyAtIEEgbGlzdCBvZiB0ZXN0Q2FzZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHQudGVzdENhc2VzLklOSVRJQUxfUFJPUFMgLSBUaGUgaW5pdGlhbCBwcm9wIHRvIGluaXRpYWxpemUgdGhlIGxheWVyIHdpdGhcbiAqIEBwYXJhbSB7QXJyYXl9IG9wdC50ZXN0Q2FzZXMuVVBEQVRFUyAtIFRoZSBsaXN0IG9mIHVwZGF0ZXMgdG8gdXBkYXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0LnRlc3RDYXNlcy5VUERBVEVTLnVwZGF0ZVByb3BzIC0gdXBkYXRlZCBwcm9wc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0LnRlc3RDYXNlcy5VUERBVEVTLmFzc2VydCAtIGNhbGxiYWNrcyB3aXRoIHVwZGF0ZWQgbGF5ZXIsIGFuZCBvbGRTdGF0ZVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0U3ViTGF5ZXJVcGRhdGVUcmlnZ2Vycyh0LCB7RnVuY3Rpb25zVG9TcHksIExheWVyQ29tcG9uZW50LCB0ZXN0Q2FzZXN9KSB7XG4gIGNvbnN0IGxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoZ2wpO1xuICBsYXllck1hbmFnZXIuc2V0Vmlld3BvcnQobmV3IFdlYk1lcmNhdG9yVmlld3BvcnQoMTAwLCAxMDApKTtcblxuICBjb25zdCBuZXdQcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIHRlc3RDYXNlcy5JTklUSUFMX1BST1BTKTtcblxuICAvLyBpbml0aWFsaXplIHBhcmVudCBsYXllciAoZ2VuZXJhdGVzIGFuZCBpbml0aWFsaXplcylcbiAgY29uc3QgbGF5ZXIgPSBuZXcgTGF5ZXJDb21wb25lbnQobmV3UHJvcHMpO1xuICB0LmRvZXNOb3RUaHJvdyhcbiAgICAoKSA9PiBsYXllck1hbmFnZXIuc2V0TGF5ZXJzKFtsYXllcl0pLFxuICAgIGBpbml0aWFsaXphdGlvbiBvZiAke0xheWVyQ29tcG9uZW50LmxheWVyTmFtZX0gc2hvdWxkIG5vdCBmYWlsYFxuICApO1xuXG4gIC8vIENyZWF0ZSBhIG1hcCBvZiBzcGllcyB0aGF0IHRoZSB0ZXN0IGNhc2UgY2FuIGluc3BlY3RcbiAgY29uc3Qgc3BpZXMgPSBGdW5jdGlvbnNUb1NweS5yZWR1Y2UoXG4gICAgKGFjY3UsIGN1cnIpID0+XG4gICAgICBPYmplY3QuYXNzaWduKGFjY3UsIHtcbiAgICAgICAgW2N1cnJdOiBzcHkoTGF5ZXJDb21wb25lbnQucHJvdG90eXBlLCBjdXJyKVxuICAgICAgfSksXG4gICAge31cbiAgKTtcblxuICBmb3IgKGNvbnN0IHt1cGRhdGVQcm9wcywgYXNzZXJ0fSBvZiB0ZXN0Q2FzZXMuVVBEQVRFUykge1xuICAgIC8vIEFkZCBvbiBuZXcgcHJvcHMgZXZlcnkgaXRlcmF0aW9uXG4gICAgT2JqZWN0LmFzc2lnbihuZXdQcm9wcywgdXBkYXRlUHJvcHMpO1xuXG4gICAgY29uc3QgbmV3TGF5ZXIgPSBsYXllci5jbG9uZShuZXdQcm9wcyk7XG4gICAgdC5kb2VzTm90VGhyb3coXG4gICAgICAoKSA9PiBsYXllck1hbmFnZXIuc2V0TGF5ZXJzKFtuZXdMYXllcl0pLFxuICAgICAgYHVwZGF0ZSAke0xheWVyQ29tcG9uZW50LmxheWVyTmFtZX0gc2hvdWxkIG5vdCBmYWlsYFxuICAgICk7XG5cbiAgICAvLyBsYXllciBtYW5hZ2VyIHNob3VsZCBoYW5kbGUgbWF0Y2ggc3ViTGF5ZXIgYW5kIHRyYW5mZXIgc3RhdGUgYW5kIHByb3BzXG4gICAgLy8gaGVyZSB3ZSBhc3N1bWUgc3ViTGF5ZXIgbWF0Y2hlcyBjb3B5IG92ZXIgdGhlIG5ldyBwcm9wc1xuICAgIC8vIGZyb20gYSBuZXcgc3ViTGF5ZXJcbiAgICBjb25zdCBzdWJMYXllciA9IGxheWVyLmdldFN1YkxheWVycygpWzBdO1xuXG4gICAgLy8gYXNzZXJ0IG9uIHVwZGF0ZWQgc3ViTGF5ZXJcbiAgICBhc3NlcnQoc3ViTGF5ZXIsIHNwaWVzLCB0KTtcblxuICAgIC8vIHJlc2V0IHNwaWVzXG4gICAgT2JqZWN0LmtleXMoc3BpZXMpLmZvckVhY2goayA9PiBzcGllc1trXS5yZXNldCgpKTtcbiAgfVxuXG4gIC8qXG4gIGZhaWx1cmVzID0gdGVzdEluaXRpYWxpemVMYXllcih7bGF5ZXI6IHN1YkxheWVyfSk7XG4gIHQub2soIWZhaWx1cmVzLCBgaW5pdGlhbGl6ZSAke0xheWVyQ29tcG9uZW50LmxheWVyTmFtZX0gc3ViTGF5ZXIgc2hvdWxkIG5vdCBmYWlsYCk7XG4gIHRlc3RDYXNlcy5VUERBVEVTLnJlZHVjZSgoY3VycmVudFByb3BzLCB7dXBkYXRlUHJvcHMsIGFzc2VydH0pID0+IHtcbiAgICAvLyBtZXJnZSB1cGRhdGVkIFByb3BzIHdpdGggaW5pdGlhbFByb3BzXG4gICAgY29uc3QgbmV3UHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50UHJvcHMsIHVwZGF0ZVByb3BzKTtcbiAgICAvLyBjYWxsIHVwZGF0ZSBsYXllciB3aXRoIG5ldyBwcm9wc1xuICAgIHRlc3RVcGRhdGVMYXllcih7bGF5ZXIsIG5ld1Byb3BzfSk7XG4gICAgdGVzdFVwZGF0ZUxheWVyKHtsYXllcjogc3ViTGF5ZXIsIG5ld1Byb3BzOiBuZXdTdWJMYXllci5wcm9wc30pO1xuICAgIHQub2soIWZhaWx1cmVzLCBgdXBkYXRlICR7TGF5ZXJDb21wb25lbnQubGF5ZXJOYW1lfSBzdWJMYXllciBzaG91bGQgbm90IGZhaWxgKTtcbiAgICByZXR1cm4gbmV3UHJvcHM7XG4gIH0sIHRlc3RDYXNlcy5JTklUSUFMX1BST1BTKTtcbiAgKi9cblxuICAvLyByZXN0b3JlIHNwaWVzXG4gIE9iamVjdC5rZXlzKHNwaWVzKS5mb3JFYWNoKGsgPT4gc3BpZXNba10ucmVzdG9yZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RDcmVhdGVMYXllcih0LCBMYXllckNvbXBvbmVudCwgcHJvcHMgPSB7fSkge1xuICBsZXQgZmFpbHVyZXMgPSBmYWxzZTtcbiAgbGV0IGxheWVyID0gbnVsbDtcblxuICB0cnkge1xuICAgIGxheWVyID0gbmV3IExheWVyQ29tcG9uZW50KFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBgJHtMYXllckNvbXBvbmVudC5sYXllck5hbWV9LTBgXG4gICAgICAgIH0sXG4gICAgICAgIHByb3BzXG4gICAgICApXG4gICAgKTtcblxuICAgIHQub2sobGF5ZXIgaW5zdGFuY2VvZiBMYXllckNvbXBvbmVudCwgYCR7TGF5ZXJDb21wb25lbnQubGF5ZXJOYW1lfSBjcmVhdGVkYCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgZmFpbHVyZXMgPSB0cnVlO1xuICB9XG4gIHQub2soIWZhaWx1cmVzLCBgY3JlYXRpbmcgJHtMYXllckNvbXBvbmVudC5sYXllck5hbWV9IHNob3VsZCBub3QgZmFpbGApO1xuXG4gIHJldHVybiBsYXllcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RDcmVhdGVFbXB0eUxheWVyKHQsIExheWVyQ29tcG9uZW50LCBwcm9wcyA9IHt9KSB7XG4gIGxldCBmYWlsdXJlcyA9IGZhbHNlO1xuICB0cnkge1xuICAgIGNvbnN0IGVtcHR5TGF5ZXIgPSBuZXcgTGF5ZXJDb21wb25lbnQoXG4gICAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IGBlbXB0eSR7TGF5ZXJDb21wb25lbnQubGF5ZXJOYW1lfWAsXG4gICAgICAgICAgZGF0YTogW10sXG4gICAgICAgICAgcGlja2FibGU6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgcHJvcHNcbiAgICAgIClcbiAgICApO1xuXG4gICAgdC5vayhlbXB0eUxheWVyIGluc3RhbmNlb2YgTGF5ZXJDb21wb25lbnQsIGBFbXB0eSAke0xheWVyQ29tcG9uZW50LmxheWVyTmFtZX0gY3JlYXRlZGApO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGZhaWx1cmVzID0gdHJ1ZTtcbiAgfVxuICB0Lm9rKCFmYWlsdXJlcywgYGNyZWF0aW5nIGVtcHR5ICR7TGF5ZXJDb21wb25lbnQubGF5ZXJOYW1lfSBzaG91bGQgbm90IGZhaWxgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3ROdWxsTGF5ZXIodCwgTGF5ZXJDb21wb25lbnQpIHtcbiAgdC5kb2VzTm90VGhyb3coXG4gICAgKCkgPT5cbiAgICAgIG5ldyBMYXllckNvbXBvbmVudCh7XG4gICAgICAgIGlkOiAnbnVsbFBhdGhMYXllcicsXG4gICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIHBpY2thYmxlOiB0cnVlXG4gICAgICB9KSxcbiAgICBgTnVsbCAke0xheWVyQ29tcG9uZW50LmxheWVyTmFtZX0gZGlkIG5vdCB0aHJvdyBleGNlcHRpb25gXG4gICk7XG59XG4iXX0=