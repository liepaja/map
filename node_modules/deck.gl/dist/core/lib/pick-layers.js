'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pickObject = pickObject;
exports.pickVisibleObjects = pickVisibleObjects;
exports.getClosestFromPickingBuffer = getClosestFromPickingBuffer;

var _drawLayers = require('./draw-layers');

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NO_PICKED_OBJECT = {
  pickedColor: null,
  pickedLayer: null,
  pickedObjectIndex: -1
};

/* eslint-disable max-depth, max-statements */
// Pick the closest object at the given (x,y) coordinate
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

function pickObject(gl, _ref) {
  var layers = _ref.layers,
      viewports = _ref.viewports,
      x = _ref.x,
      y = _ref.y,
      radius = _ref.radius,
      layerFilter = _ref.layerFilter,
      mode = _ref.mode,
      onViewportActive = _ref.onViewportActive,
      pickingFBO = _ref.pickingFBO,
      lastPickedInfo = _ref.lastPickedInfo,
      useDevicePixels = _ref.useDevicePixels;

  // Convert from canvas top-left to WebGL bottom-left coordinates
  // And compensate for pixelRatio
  var pixelRatio = (0, _drawLayers.getPixelRatio)({ useDevicePixels: useDevicePixels });
  var deviceX = Math.round(x * pixelRatio);
  var deviceY = Math.round(gl.canvas.height - y * pixelRatio);
  var deviceRadius = Math.round(radius * pixelRatio);

  var deviceRect = getPickingRect({
    deviceX: deviceX,
    deviceY: deviceY,
    deviceRadius: deviceRadius,
    deviceWidth: pickingFBO.width,
    deviceHeight: pickingFBO.height
  });

  var pickedColors = deviceRect && drawAndSamplePickingBuffer(gl, {
    layers: layers,
    viewports: viewports,
    onViewportActive: onViewportActive,
    useDevicePixels: useDevicePixels,
    pickingFBO: pickingFBO,
    deviceRect: deviceRect,
    layerFilter: layerFilter,
    redrawReason: mode
  });

  var pickInfo = pickedColors && getClosestFromPickingBuffer(gl, {
    pickedColors: pickedColors,
    layers: layers,
    deviceX: deviceX,
    deviceY: deviceY,
    deviceRadius: deviceRadius,
    deviceRect: deviceRect
  }) || NO_PICKED_OBJECT;

  return processPickInfo({
    pickInfo: pickInfo,
    lastPickedInfo: lastPickedInfo,
    mode: mode,
    layers: layers,
    viewports: viewports,
    x: x,
    y: y,
    deviceX: deviceX,
    deviceY: deviceY,
    pixelRatio: pixelRatio
  });
}

// Pick all objects within the given bounding box
function pickVisibleObjects(gl, _ref2) {
  var layers = _ref2.layers,
      viewports = _ref2.viewports,
      x = _ref2.x,
      y = _ref2.y,
      width = _ref2.width,
      height = _ref2.height,
      mode = _ref2.mode,
      layerFilter = _ref2.layerFilter,
      onViewportActive = _ref2.onViewportActive,
      pickingFBO = _ref2.pickingFBO,
      useDevicePixels = _ref2.useDevicePixels;

  // Convert from canvas top-left to WebGL bottom-left coordinates
  // And compensate for pixelRatio
  var pixelRatio = (0, _drawLayers.getPixelRatio)({ useDevicePixels: useDevicePixels });

  var deviceLeft = Math.round(x * pixelRatio);
  var deviceBottom = Math.round(gl.canvas.height - y * pixelRatio);
  var deviceRight = Math.round((x + width) * pixelRatio);
  var deviceTop = Math.round(gl.canvas.height - (y + height) * pixelRatio);

  var deviceRect = {
    x: deviceLeft,
    y: deviceTop,
    width: deviceRight - deviceLeft,
    height: deviceBottom - deviceTop
  };

  var pickedColors = drawAndSamplePickingBuffer(gl, {
    layers: layers,
    viewports: viewports,
    onViewportActive: onViewportActive,
    pickingFBO: pickingFBO,
    useDevicePixels: useDevicePixels,
    deviceRect: deviceRect,
    layerFilter: layerFilter,
    redrawReason: mode
  });

  var pickInfos = getUniquesFromPickingBuffer(gl, { pickedColors: pickedColors, layers: layers });

  // Only return unique infos, identified by info.object
  var uniqueInfos = new Map();

  pickInfos.forEach(function (pickInfo) {
    var info = {
      color: pickInfo.pickedColor,
      layer: null,
      index: pickInfo.pickedObjectIndex,
      picked: true,
      x: x,
      y: y,
      width: width,
      height: height,
      pixelRatio: pixelRatio
    };

    info = getLayerPickingInfo({ layer: pickInfo.pickedLayer, info: info, mode: mode });
    if (!uniqueInfos.has(info.object)) {
      uniqueInfos.set(info.object, info);
    }
  });

  return Array.from(uniqueInfos.values());
}

// HELPER METHODS

// returns pickedColor or null if no pickable layers found.
function drawAndSamplePickingBuffer(gl, _ref3) {
  var layers = _ref3.layers,
      viewports = _ref3.viewports,
      onViewportActive = _ref3.onViewportActive,
      useDevicePixels = _ref3.useDevicePixels,
      pickingFBO = _ref3.pickingFBO,
      deviceRect = _ref3.deviceRect,
      layerFilter = _ref3.layerFilter,
      redrawReason = _ref3.redrawReason;

  (0, _assert2.default)(deviceRect);
  (0, _assert2.default)(Number.isFinite(deviceRect.width) && deviceRect.width > 0, '`width` must be > 0');
  (0, _assert2.default)(Number.isFinite(deviceRect.height) && deviceRect.height > 0, '`height` must be > 0');

  var pickableLayers = layers.filter(function (layer) {
    return layer.isPickable();
  });
  if (pickableLayers.length < 1) {
    return null;
  }

  (0, _drawLayers.drawPickingBuffer)(gl, {
    layers: layers,
    viewports: viewports,
    onViewportActive: onViewportActive,
    useDevicePixels: useDevicePixels,
    pickingFBO: pickingFBO,
    deviceRect: deviceRect,
    layerFilter: layerFilter,
    redrawReason: redrawReason
  });

  // Read from an already rendered picking buffer
  // Returns an Uint8ClampedArray of picked pixels
  var x = deviceRect.x,
      y = deviceRect.y,
      width = deviceRect.width,
      height = deviceRect.height;

  var pickedColors = new Uint8Array(width * height * 4);
  pickingFBO.readPixels({ x: x, y: y, width: width, height: height, pixelArray: pickedColors });
  return pickedColors;
}

// Indentifies which viewport, if any corresponds to x and y
// Returns first viewport if no match
// TODO - need to determine which viewport we are in
// TODO - document concept of "primary viewport" that matches all coords?
// TODO - static method on Viewport class?
function getViewportFromCoordinates(_ref4) {
  var viewports = _ref4.viewports;

  var viewport = viewports[0];
  return viewport;
}

// Calculate a picking rect centered on deviceX and deviceY and clipped to device
// Returns null if pixel is outside of device
function getPickingRect(_ref5) {
  var deviceX = _ref5.deviceX,
      deviceY = _ref5.deviceY,
      deviceRadius = _ref5.deviceRadius,
      deviceWidth = _ref5.deviceWidth,
      deviceHeight = _ref5.deviceHeight;

  var valid = deviceX >= 0 && deviceY >= 0 && deviceX < deviceWidth && deviceY < deviceHeight;

  // x, y out of bounds.
  if (!valid) {
    return null;
  }

  // Create a box of size `radius * 2 + 1` centered at [deviceX, deviceY]
  var x = Math.max(0, deviceX - deviceRadius);
  var y = Math.max(0, deviceY - deviceRadius);
  var width = Math.min(deviceWidth, deviceX + deviceRadius) - x + 1;
  var height = Math.min(deviceHeight, deviceY + deviceRadius) - y + 1;

  return { x: x, y: y, width: width, height: height };
}

// TODO - break this monster function into 3+ parts
function processPickInfo(_ref6) {
  var pickInfo = _ref6.pickInfo,
      lastPickedInfo = _ref6.lastPickedInfo,
      mode = _ref6.mode,
      layers = _ref6.layers,
      viewports = _ref6.viewports,
      x = _ref6.x,
      y = _ref6.y,
      deviceX = _ref6.deviceX,
      deviceY = _ref6.deviceY,
      pixelRatio = _ref6.pixelRatio;
  var pickedColor = pickInfo.pickedColor,
      pickedLayer = pickInfo.pickedLayer,
      pickedObjectIndex = pickInfo.pickedObjectIndex;


  var affectedLayers = pickedLayer ? [pickedLayer] : [];

  if (mode === 'hover') {
    // only invoke onHover events if picked object has changed
    var lastPickedObjectIndex = lastPickedInfo.index;
    var lastPickedLayerId = lastPickedInfo.layerId;
    var pickedLayerId = pickedLayer && pickedLayer.props.id;

    // proceed only if picked object changed
    if (pickedLayerId !== lastPickedLayerId || pickedObjectIndex !== lastPickedObjectIndex) {
      if (pickedLayerId !== lastPickedLayerId) {
        // We cannot store a ref to lastPickedLayer in the context because
        // the state of an outdated layer is no longer valid
        // and the props may have changed
        var lastPickedLayer = layers.find(function (layer) {
          return layer.props.id === lastPickedLayerId;
        });
        if (lastPickedLayer) {
          // Let leave event fire before enter event
          affectedLayers.unshift(lastPickedLayer);
        }
      }

      // Update layer manager context
      lastPickedInfo.layerId = pickedLayerId;
      lastPickedInfo.index = pickedObjectIndex;
    }
  }

  var viewport = getViewportFromCoordinates({ viewports: viewports }); // TODO - add coords

  var baseInfo = {
    color: null,
    layer: null,
    index: -1,
    picked: false,
    x: x,
    y: y,
    pixel: [x, y],
    lngLat: viewport.unproject([x, y]),
    devicePixel: [deviceX, deviceY],
    pixelRatio: pixelRatio
  };

  // Use a Map to store all picking infos.
  // The following two forEach loops are the result of
  // https://github.com/uber/deck.gl/issues/443
  // Please be very careful when changing this pattern
  var infos = new Map();

  affectedLayers.forEach(function (layer) {
    var info = Object.assign({}, baseInfo);

    if (layer === pickedLayer) {
      info.color = pickedColor;
      info.index = pickedObjectIndex;
      info.picked = true;
    }

    info = getLayerPickingInfo({ layer: layer, info: info, mode: mode });

    // This guarantees that there will be only one copy of info for
    // one composite layer
    if (info) {
      infos.set(info.layer.id, info);
    }

    var pickingSelectedColor = layer.props.autoHighlight && pickedLayer === layer ? pickedColor : null;

    var pickingParameters = {
      pickingSelectedColor: pickingSelectedColor
    };

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = layer.getModels()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var model = _step.value;

        model.updateModuleSettings(pickingParameters);
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
  });

  var unhandledPickInfos = callLayerPickingCallbacks(infos, mode);

  return unhandledPickInfos;
}

// Per-layer event handlers (e.g. onClick, onHover) are provided by the
// user and out of deck.gl's control. It's very much possible that
// the user calls React lifecycle methods in these function, such as
// ReactComponent.setState(). React lifecycle methods sometimes induce
// a re-render and re-generation of props of deck.gl and its layers,
// which invalidates all layers currently passed to this very function.

// Therefore, per-layer event handlers must be invoked at the end
// of the picking operation. NO operation that relies on the states of current
// layers should be called after this code.
function callLayerPickingCallbacks(infos, mode) {
  var unhandledPickInfos = [];

  infos.forEach(function (info) {
    var handled = false;
    switch (mode) {
      case 'click':
        handled = info.layer.props.onClick(info);
        break;
      case 'hover':
        handled = info.layer.props.onHover(info);
        break;
      case 'query':
        break;
      default:
        throw new Error('unknown pick type');
    }

    if (!handled) {
      unhandledPickInfos.push(info);
    }
  });

  return unhandledPickInfos;
}

/**
 * Pick at a specified pixel with a tolerance radius
 * Returns the closest object to the pixel in shape `{pickedColor, pickedLayer, pickedObjectIndex}`
 */
function getClosestFromPickingBuffer(gl, _ref7) {
  var pickedColors = _ref7.pickedColors,
      layers = _ref7.layers,
      deviceX = _ref7.deviceX,
      deviceY = _ref7.deviceY,
      deviceRadius = _ref7.deviceRadius,
      deviceRect = _ref7.deviceRect;

  (0, _assert2.default)(pickedColors);

  // Traverse all pixels in picking results and find the one closest to the supplied
  // [deviceX, deviceY]
  var x = deviceRect.x,
      y = deviceRect.y,
      width = deviceRect.width,
      height = deviceRect.height;

  var minSquareDistanceToCenter = deviceRadius * deviceRadius;
  var closestPixelIndex = -1;
  var i = 0;

  for (var row = 0; row < height; row++) {
    var dy = row + y - deviceY;
    var dy2 = dy * dy;

    if (dy2 > minSquareDistanceToCenter) {
      // skip this row
      i += 4 * width;
    } else {
      for (var col = 0; col < width; col++) {
        // Decode picked layer from color
        var pickedLayerIndex = pickedColors[i + 3] - 1;

        if (pickedLayerIndex >= 0) {
          var dx = col + x - deviceX;
          var d2 = dx * dx + dy2;

          if (d2 <= minSquareDistanceToCenter) {
            minSquareDistanceToCenter = d2;
            closestPixelIndex = i;
          }
        }
        i += 4;
      }
    }
  }

  if (closestPixelIndex >= 0) {
    // Decode picked object index from color
    var _pickedLayerIndex = pickedColors[closestPixelIndex + 3] - 1;
    var pickedColor = pickedColors.slice(closestPixelIndex, closestPixelIndex + 4);
    var pickedLayer = layers[_pickedLayerIndex];
    if (pickedLayer) {
      var pickedObjectIndex = pickedLayer.decodePickingColor(pickedColor);
      return { pickedColor: pickedColor, pickedLayer: pickedLayer, pickedObjectIndex: pickedObjectIndex };
    }
    _log2.default.error('Picked non-existent layer. Is picking buffer corrupt?');
  }

  return NO_PICKED_OBJECT;
}
/* eslint-enable max-depth, max-statements */

/**
 * Examines a picking buffer for unique colors
 * Returns array of unique objects in shape `{x, y, pickedColor, pickedLayer, pickedObjectIndex}`
 */
function getUniquesFromPickingBuffer(gl, _ref8) {
  var pickedColors = _ref8.pickedColors,
      layers = _ref8.layers;

  var uniqueColors = new Map();

  // Traverse all pixels in picking results and get unique colors
  if (pickedColors) {
    for (var i = 0; i < pickedColors.length; i += 4) {
      // Decode picked layer from color
      var pickedLayerIndex = pickedColors[i + 3] - 1;

      if (pickedLayerIndex >= 0) {
        var pickedColor = pickedColors.slice(i, i + 4);
        var colorKey = pickedColor.join(',');
        // eslint-disable-next-line
        if (!uniqueColors.has(colorKey)) {
          var pickedLayer = layers[pickedLayerIndex];
          // eslint-disable-next-line
          if (pickedLayer) {
            uniqueColors.set(colorKey, {
              pickedColor: pickedColor,
              pickedLayer: pickedLayer,
              pickedObjectIndex: pickedLayer.decodePickingColor(pickedColor)
            });
          } else {
            _log2.default.error('Picked non-existent layer. Is picking buffer corrupt?');
          }
        }
      }
    }
  }

  return Array.from(uniqueColors.values());
}

// Walk up the layer composite chain to populate the info object
function getLayerPickingInfo(_ref9) {
  var layer = _ref9.layer,
      info = _ref9.info,
      mode = _ref9.mode;

  while (layer && info) {
    // For a composite layer, sourceLayer will point to the sublayer
    // where the event originates from.
    // It provides additional context for the composite layer's
    // getPickingInfo() method to populate the info object
    var sourceLayer = info.layer || layer;
    info.layer = layer;
    // layer.pickLayer() function requires a non-null ```layer.state```
    // object to funtion properly. So the layer refereced here
    // must be the "current" layer, not an "out-dated" / "invalidated" layer
    info = layer.pickLayer({ info: info, mode: mode, sourceLayer: sourceLayer });
    layer = layer.parentLayer;
  }
  return info;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9waWNrLWxheWVycy5qcyJdLCJuYW1lcyI6WyJwaWNrT2JqZWN0IiwicGlja1Zpc2libGVPYmplY3RzIiwiZ2V0Q2xvc2VzdEZyb21QaWNraW5nQnVmZmVyIiwiTk9fUElDS0VEX09CSkVDVCIsInBpY2tlZENvbG9yIiwicGlja2VkTGF5ZXIiLCJwaWNrZWRPYmplY3RJbmRleCIsImdsIiwibGF5ZXJzIiwidmlld3BvcnRzIiwieCIsInkiLCJyYWRpdXMiLCJsYXllckZpbHRlciIsIm1vZGUiLCJvblZpZXdwb3J0QWN0aXZlIiwicGlja2luZ0ZCTyIsImxhc3RQaWNrZWRJbmZvIiwidXNlRGV2aWNlUGl4ZWxzIiwicGl4ZWxSYXRpbyIsImRldmljZVgiLCJNYXRoIiwicm91bmQiLCJkZXZpY2VZIiwiY2FudmFzIiwiaGVpZ2h0IiwiZGV2aWNlUmFkaXVzIiwiZGV2aWNlUmVjdCIsImdldFBpY2tpbmdSZWN0IiwiZGV2aWNlV2lkdGgiLCJ3aWR0aCIsImRldmljZUhlaWdodCIsInBpY2tlZENvbG9ycyIsImRyYXdBbmRTYW1wbGVQaWNraW5nQnVmZmVyIiwicmVkcmF3UmVhc29uIiwicGlja0luZm8iLCJwcm9jZXNzUGlja0luZm8iLCJkZXZpY2VMZWZ0IiwiZGV2aWNlQm90dG9tIiwiZGV2aWNlUmlnaHQiLCJkZXZpY2VUb3AiLCJwaWNrSW5mb3MiLCJnZXRVbmlxdWVzRnJvbVBpY2tpbmdCdWZmZXIiLCJ1bmlxdWVJbmZvcyIsIk1hcCIsImZvckVhY2giLCJpbmZvIiwiY29sb3IiLCJsYXllciIsImluZGV4IiwicGlja2VkIiwiZ2V0TGF5ZXJQaWNraW5nSW5mbyIsImhhcyIsIm9iamVjdCIsInNldCIsIkFycmF5IiwiZnJvbSIsInZhbHVlcyIsIk51bWJlciIsImlzRmluaXRlIiwicGlja2FibGVMYXllcnMiLCJmaWx0ZXIiLCJpc1BpY2thYmxlIiwibGVuZ3RoIiwiVWludDhBcnJheSIsInJlYWRQaXhlbHMiLCJwaXhlbEFycmF5IiwiZ2V0Vmlld3BvcnRGcm9tQ29vcmRpbmF0ZXMiLCJ2aWV3cG9ydCIsInZhbGlkIiwibWF4IiwibWluIiwiYWZmZWN0ZWRMYXllcnMiLCJsYXN0UGlja2VkT2JqZWN0SW5kZXgiLCJsYXN0UGlja2VkTGF5ZXJJZCIsImxheWVySWQiLCJwaWNrZWRMYXllcklkIiwicHJvcHMiLCJpZCIsImxhc3RQaWNrZWRMYXllciIsImZpbmQiLCJ1bnNoaWZ0IiwiYmFzZUluZm8iLCJwaXhlbCIsImxuZ0xhdCIsInVucHJvamVjdCIsImRldmljZVBpeGVsIiwiaW5mb3MiLCJPYmplY3QiLCJhc3NpZ24iLCJwaWNraW5nU2VsZWN0ZWRDb2xvciIsImF1dG9IaWdobGlnaHQiLCJwaWNraW5nUGFyYW1ldGVycyIsImdldE1vZGVscyIsIm1vZGVsIiwidXBkYXRlTW9kdWxlU2V0dGluZ3MiLCJ1bmhhbmRsZWRQaWNrSW5mb3MiLCJjYWxsTGF5ZXJQaWNraW5nQ2FsbGJhY2tzIiwiaGFuZGxlZCIsIm9uQ2xpY2siLCJvbkhvdmVyIiwiRXJyb3IiLCJwdXNoIiwibWluU3F1YXJlRGlzdGFuY2VUb0NlbnRlciIsImNsb3Nlc3RQaXhlbEluZGV4IiwiaSIsInJvdyIsImR5IiwiZHkyIiwiY29sIiwicGlja2VkTGF5ZXJJbmRleCIsImR4IiwiZDIiLCJzbGljZSIsImRlY29kZVBpY2tpbmdDb2xvciIsImVycm9yIiwidW5pcXVlQ29sb3JzIiwiY29sb3JLZXkiLCJqb2luIiwic291cmNlTGF5ZXIiLCJwaWNrTGF5ZXIiLCJwYXJlbnRMYXllciJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFnQ2dCQSxVLEdBQUFBLFU7UUF1RUFDLGtCLEdBQUFBLGtCO1FBd1JBQywyQixHQUFBQSwyQjs7QUEzV2hCOztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU1DLG1CQUFtQjtBQUN2QkMsZUFBYSxJQURVO0FBRXZCQyxlQUFhLElBRlU7QUFHdkJDLHFCQUFtQixDQUFDO0FBSEcsQ0FBekI7O0FBTUE7QUFDQTtBQS9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFjTyxTQUFTTixVQUFULENBQ0xPLEVBREssUUFlTDtBQUFBLE1BWkVDLE1BWUYsUUFaRUEsTUFZRjtBQUFBLE1BWEVDLFNBV0YsUUFYRUEsU0FXRjtBQUFBLE1BVkVDLENBVUYsUUFWRUEsQ0FVRjtBQUFBLE1BVEVDLENBU0YsUUFURUEsQ0FTRjtBQUFBLE1BUkVDLE1BUUYsUUFSRUEsTUFRRjtBQUFBLE1BUEVDLFdBT0YsUUFQRUEsV0FPRjtBQUFBLE1BTkVDLElBTUYsUUFORUEsSUFNRjtBQUFBLE1BTEVDLGdCQUtGLFFBTEVBLGdCQUtGO0FBQUEsTUFKRUMsVUFJRixRQUpFQSxVQUlGO0FBQUEsTUFIRUMsY0FHRixRQUhFQSxjQUdGO0FBQUEsTUFGRUMsZUFFRixRQUZFQSxlQUVGOztBQUNBO0FBQ0E7QUFDQSxNQUFNQyxhQUFhLCtCQUFjLEVBQUNELGdDQUFELEVBQWQsQ0FBbkI7QUFDQSxNQUFNRSxVQUFVQyxLQUFLQyxLQUFMLENBQVdaLElBQUlTLFVBQWYsQ0FBaEI7QUFDQSxNQUFNSSxVQUFVRixLQUFLQyxLQUFMLENBQVdmLEdBQUdpQixNQUFILENBQVVDLE1BQVYsR0FBbUJkLElBQUlRLFVBQWxDLENBQWhCO0FBQ0EsTUFBTU8sZUFBZUwsS0FBS0MsS0FBTCxDQUFXVixTQUFTTyxVQUFwQixDQUFyQjs7QUFFQSxNQUFNUSxhQUFhQyxlQUFlO0FBQ2hDUixvQkFEZ0M7QUFFaENHLG9CQUZnQztBQUdoQ0csOEJBSGdDO0FBSWhDRyxpQkFBYWIsV0FBV2MsS0FKUTtBQUtoQ0Msa0JBQWNmLFdBQVdTO0FBTE8sR0FBZixDQUFuQjs7QUFRQSxNQUFNTyxlQUNKTCxjQUNBTSwyQkFBMkIxQixFQUEzQixFQUErQjtBQUM3QkMsa0JBRDZCO0FBRTdCQyx3QkFGNkI7QUFHN0JNLHNDQUg2QjtBQUk3Qkcsb0NBSjZCO0FBSzdCRiwwQkFMNkI7QUFNN0JXLDBCQU42QjtBQU83QmQsNEJBUDZCO0FBUTdCcUIsa0JBQWNwQjtBQVJlLEdBQS9CLENBRkY7O0FBYUEsTUFBTXFCLFdBQ0hILGdCQUNDOUIsNEJBQTRCSyxFQUE1QixFQUFnQztBQUM5QnlCLDhCQUQ4QjtBQUU5QnhCLGtCQUY4QjtBQUc5Qlksb0JBSDhCO0FBSTlCRyxvQkFKOEI7QUFLOUJHLDhCQUw4QjtBQU05QkM7QUFOOEIsR0FBaEMsQ0FERixJQVNBeEIsZ0JBVkY7O0FBWUEsU0FBT2lDLGdCQUFnQjtBQUNyQkQsc0JBRHFCO0FBRXJCbEIsa0NBRnFCO0FBR3JCSCxjQUhxQjtBQUlyQk4sa0JBSnFCO0FBS3JCQyx3QkFMcUI7QUFNckJDLFFBTnFCO0FBT3JCQyxRQVBxQjtBQVFyQlMsb0JBUnFCO0FBU3JCRyxvQkFUcUI7QUFVckJKO0FBVnFCLEdBQWhCLENBQVA7QUFZRDs7QUFFRDtBQUNPLFNBQVNsQixrQkFBVCxDQUNMTSxFQURLLFNBZUw7QUFBQSxNQVpFQyxNQVlGLFNBWkVBLE1BWUY7QUFBQSxNQVhFQyxTQVdGLFNBWEVBLFNBV0Y7QUFBQSxNQVZFQyxDQVVGLFNBVkVBLENBVUY7QUFBQSxNQVRFQyxDQVNGLFNBVEVBLENBU0Y7QUFBQSxNQVJFbUIsS0FRRixTQVJFQSxLQVFGO0FBQUEsTUFQRUwsTUFPRixTQVBFQSxNQU9GO0FBQUEsTUFORVgsSUFNRixTQU5FQSxJQU1GO0FBQUEsTUFMRUQsV0FLRixTQUxFQSxXQUtGO0FBQUEsTUFKRUUsZ0JBSUYsU0FKRUEsZ0JBSUY7QUFBQSxNQUhFQyxVQUdGLFNBSEVBLFVBR0Y7QUFBQSxNQUZFRSxlQUVGLFNBRkVBLGVBRUY7O0FBQ0E7QUFDQTtBQUNBLE1BQU1DLGFBQWEsK0JBQWMsRUFBQ0QsZ0NBQUQsRUFBZCxDQUFuQjs7QUFFQSxNQUFNbUIsYUFBYWhCLEtBQUtDLEtBQUwsQ0FBV1osSUFBSVMsVUFBZixDQUFuQjtBQUNBLE1BQU1tQixlQUFlakIsS0FBS0MsS0FBTCxDQUFXZixHQUFHaUIsTUFBSCxDQUFVQyxNQUFWLEdBQW1CZCxJQUFJUSxVQUFsQyxDQUFyQjtBQUNBLE1BQU1vQixjQUFjbEIsS0FBS0MsS0FBTCxDQUFXLENBQUNaLElBQUlvQixLQUFMLElBQWNYLFVBQXpCLENBQXBCO0FBQ0EsTUFBTXFCLFlBQVluQixLQUFLQyxLQUFMLENBQVdmLEdBQUdpQixNQUFILENBQVVDLE1BQVYsR0FBbUIsQ0FBQ2QsSUFBSWMsTUFBTCxJQUFlTixVQUE3QyxDQUFsQjs7QUFFQSxNQUFNUSxhQUFhO0FBQ2pCakIsT0FBRzJCLFVBRGM7QUFFakIxQixPQUFHNkIsU0FGYztBQUdqQlYsV0FBT1MsY0FBY0YsVUFISjtBQUlqQlosWUFBUWEsZUFBZUU7QUFKTixHQUFuQjs7QUFPQSxNQUFNUixlQUFlQywyQkFBMkIxQixFQUEzQixFQUErQjtBQUNsREMsa0JBRGtEO0FBRWxEQyx3QkFGa0Q7QUFHbERNLHNDQUhrRDtBQUlsREMsMEJBSmtEO0FBS2xERSxvQ0FMa0Q7QUFNbERTLDBCQU5rRDtBQU9sRGQsNEJBUGtEO0FBUWxEcUIsa0JBQWNwQjtBQVJvQyxHQUEvQixDQUFyQjs7QUFXQSxNQUFNMkIsWUFBWUMsNEJBQTRCbkMsRUFBNUIsRUFBZ0MsRUFBQ3lCLDBCQUFELEVBQWV4QixjQUFmLEVBQWhDLENBQWxCOztBQUVBO0FBQ0EsTUFBTW1DLGNBQWMsSUFBSUMsR0FBSixFQUFwQjs7QUFFQUgsWUFBVUksT0FBVixDQUFrQixvQkFBWTtBQUM1QixRQUFJQyxPQUFPO0FBQ1RDLGFBQU9aLFNBQVMvQixXQURQO0FBRVQ0QyxhQUFPLElBRkU7QUFHVEMsYUFBT2QsU0FBUzdCLGlCQUhQO0FBSVQ0QyxjQUFRLElBSkM7QUFLVHhDLFVBTFM7QUFNVEMsVUFOUztBQU9UbUIsa0JBUFM7QUFRVEwsb0JBUlM7QUFTVE47QUFUUyxLQUFYOztBQVlBMkIsV0FBT0ssb0JBQW9CLEVBQUNILE9BQU9iLFNBQVM5QixXQUFqQixFQUE4QnlDLFVBQTlCLEVBQW9DaEMsVUFBcEMsRUFBcEIsQ0FBUDtBQUNBLFFBQUksQ0FBQzZCLFlBQVlTLEdBQVosQ0FBZ0JOLEtBQUtPLE1BQXJCLENBQUwsRUFBbUM7QUFDakNWLGtCQUFZVyxHQUFaLENBQWdCUixLQUFLTyxNQUFyQixFQUE2QlAsSUFBN0I7QUFDRDtBQUNGLEdBakJEOztBQW1CQSxTQUFPUyxNQUFNQyxJQUFOLENBQVdiLFlBQVljLE1BQVosRUFBWCxDQUFQO0FBQ0Q7O0FBRUQ7O0FBRUE7QUFDQSxTQUFTeEIsMEJBQVQsQ0FDRTFCLEVBREYsU0FZRTtBQUFBLE1BVEVDLE1BU0YsU0FURUEsTUFTRjtBQUFBLE1BUkVDLFNBUUYsU0FSRUEsU0FRRjtBQUFBLE1BUEVNLGdCQU9GLFNBUEVBLGdCQU9GO0FBQUEsTUFORUcsZUFNRixTQU5FQSxlQU1GO0FBQUEsTUFMRUYsVUFLRixTQUxFQSxVQUtGO0FBQUEsTUFKRVcsVUFJRixTQUpFQSxVQUlGO0FBQUEsTUFIRWQsV0FHRixTQUhFQSxXQUdGO0FBQUEsTUFGRXFCLFlBRUYsU0FGRUEsWUFFRjs7QUFDQSx3QkFBT1AsVUFBUDtBQUNBLHdCQUFPK0IsT0FBT0MsUUFBUCxDQUFnQmhDLFdBQVdHLEtBQTNCLEtBQXFDSCxXQUFXRyxLQUFYLEdBQW1CLENBQS9ELEVBQWtFLHFCQUFsRTtBQUNBLHdCQUFPNEIsT0FBT0MsUUFBUCxDQUFnQmhDLFdBQVdGLE1BQTNCLEtBQXNDRSxXQUFXRixNQUFYLEdBQW9CLENBQWpFLEVBQW9FLHNCQUFwRTs7QUFFQSxNQUFNbUMsaUJBQWlCcEQsT0FBT3FELE1BQVAsQ0FBYztBQUFBLFdBQVNiLE1BQU1jLFVBQU4sRUFBVDtBQUFBLEdBQWQsQ0FBdkI7QUFDQSxNQUFJRixlQUFlRyxNQUFmLEdBQXdCLENBQTVCLEVBQStCO0FBQzdCLFdBQU8sSUFBUDtBQUNEOztBQUVELHFDQUFrQnhELEVBQWxCLEVBQXNCO0FBQ3BCQyxrQkFEb0I7QUFFcEJDLHdCQUZvQjtBQUdwQk0sc0NBSG9CO0FBSXBCRyxvQ0FKb0I7QUFLcEJGLDBCQUxvQjtBQU1wQlcsMEJBTm9CO0FBT3BCZCw0QkFQb0I7QUFRcEJxQjtBQVJvQixHQUF0Qjs7QUFXQTtBQUNBO0FBdEJBLE1BdUJPeEIsQ0F2QlAsR0F1QjhCaUIsVUF2QjlCLENBdUJPakIsQ0F2QlA7QUFBQSxNQXVCVUMsQ0F2QlYsR0F1QjhCZ0IsVUF2QjlCLENBdUJVaEIsQ0F2QlY7QUFBQSxNQXVCYW1CLEtBdkJiLEdBdUI4QkgsVUF2QjlCLENBdUJhRyxLQXZCYjtBQUFBLE1BdUJvQkwsTUF2QnBCLEdBdUI4QkUsVUF2QjlCLENBdUJvQkYsTUF2QnBCOztBQXdCQSxNQUFNTyxlQUFlLElBQUlnQyxVQUFKLENBQWVsQyxRQUFRTCxNQUFSLEdBQWlCLENBQWhDLENBQXJCO0FBQ0FULGFBQVdpRCxVQUFYLENBQXNCLEVBQUN2RCxJQUFELEVBQUlDLElBQUosRUFBT21CLFlBQVAsRUFBY0wsY0FBZCxFQUFzQnlDLFlBQVlsQyxZQUFsQyxFQUF0QjtBQUNBLFNBQU9BLFlBQVA7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU21DLDBCQUFULFFBQWlEO0FBQUEsTUFBWjFELFNBQVksU0FBWkEsU0FBWTs7QUFDL0MsTUFBTTJELFdBQVczRCxVQUFVLENBQVYsQ0FBakI7QUFDQSxTQUFPMkQsUUFBUDtBQUNEOztBQUVEO0FBQ0E7QUFDQSxTQUFTeEMsY0FBVCxRQUFxRjtBQUFBLE1BQTVEUixPQUE0RCxTQUE1REEsT0FBNEQ7QUFBQSxNQUFuREcsT0FBbUQsU0FBbkRBLE9BQW1EO0FBQUEsTUFBMUNHLFlBQTBDLFNBQTFDQSxZQUEwQztBQUFBLE1BQTVCRyxXQUE0QixTQUE1QkEsV0FBNEI7QUFBQSxNQUFmRSxZQUFlLFNBQWZBLFlBQWU7O0FBQ25GLE1BQU1zQyxRQUFRakQsV0FBVyxDQUFYLElBQWdCRyxXQUFXLENBQTNCLElBQWdDSCxVQUFVUyxXQUExQyxJQUF5RE4sVUFBVVEsWUFBakY7O0FBRUE7QUFDQSxNQUFJLENBQUNzQyxLQUFMLEVBQVk7QUFDVixXQUFPLElBQVA7QUFDRDs7QUFFRDtBQUNBLE1BQU0zRCxJQUFJVyxLQUFLaUQsR0FBTCxDQUFTLENBQVQsRUFBWWxELFVBQVVNLFlBQXRCLENBQVY7QUFDQSxNQUFNZixJQUFJVSxLQUFLaUQsR0FBTCxDQUFTLENBQVQsRUFBWS9DLFVBQVVHLFlBQXRCLENBQVY7QUFDQSxNQUFNSSxRQUFRVCxLQUFLa0QsR0FBTCxDQUFTMUMsV0FBVCxFQUFzQlQsVUFBVU0sWUFBaEMsSUFBZ0RoQixDQUFoRCxHQUFvRCxDQUFsRTtBQUNBLE1BQU1lLFNBQVNKLEtBQUtrRCxHQUFMLENBQVN4QyxZQUFULEVBQXVCUixVQUFVRyxZQUFqQyxJQUFpRGYsQ0FBakQsR0FBcUQsQ0FBcEU7O0FBRUEsU0FBTyxFQUFDRCxJQUFELEVBQUlDLElBQUosRUFBT21CLFlBQVAsRUFBY0wsY0FBZCxFQUFQO0FBQ0Q7O0FBRUQ7QUFDQSxTQUFTVyxlQUFULFFBV0c7QUFBQSxNQVZERCxRQVVDLFNBVkRBLFFBVUM7QUFBQSxNQVREbEIsY0FTQyxTQVREQSxjQVNDO0FBQUEsTUFSREgsSUFRQyxTQVJEQSxJQVFDO0FBQUEsTUFQRE4sTUFPQyxTQVBEQSxNQU9DO0FBQUEsTUFOREMsU0FNQyxTQU5EQSxTQU1DO0FBQUEsTUFMREMsQ0FLQyxTQUxEQSxDQUtDO0FBQUEsTUFKREMsQ0FJQyxTQUpEQSxDQUlDO0FBQUEsTUFIRFMsT0FHQyxTQUhEQSxPQUdDO0FBQUEsTUFGREcsT0FFQyxTQUZEQSxPQUVDO0FBQUEsTUFEREosVUFDQyxTQUREQSxVQUNDO0FBQUEsTUFDTWYsV0FETixHQUNxRCtCLFFBRHJELENBQ00vQixXQUROO0FBQUEsTUFDbUJDLFdBRG5CLEdBQ3FEOEIsUUFEckQsQ0FDbUI5QixXQURuQjtBQUFBLE1BQ2dDQyxpQkFEaEMsR0FDcUQ2QixRQURyRCxDQUNnQzdCLGlCQURoQzs7O0FBR0QsTUFBTWtFLGlCQUFpQm5FLGNBQWMsQ0FBQ0EsV0FBRCxDQUFkLEdBQThCLEVBQXJEOztBQUVBLE1BQUlTLFNBQVMsT0FBYixFQUFzQjtBQUNwQjtBQUNBLFFBQU0yRCx3QkFBd0J4RCxlQUFlZ0MsS0FBN0M7QUFDQSxRQUFNeUIsb0JBQW9CekQsZUFBZTBELE9BQXpDO0FBQ0EsUUFBTUMsZ0JBQWdCdkUsZUFBZUEsWUFBWXdFLEtBQVosQ0FBa0JDLEVBQXZEOztBQUVBO0FBQ0EsUUFBSUYsa0JBQWtCRixpQkFBbEIsSUFBdUNwRSxzQkFBc0JtRSxxQkFBakUsRUFBd0Y7QUFDdEYsVUFBSUcsa0JBQWtCRixpQkFBdEIsRUFBeUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0EsWUFBTUssa0JBQWtCdkUsT0FBT3dFLElBQVAsQ0FBWTtBQUFBLGlCQUFTaEMsTUFBTTZCLEtBQU4sQ0FBWUMsRUFBWixLQUFtQkosaUJBQTVCO0FBQUEsU0FBWixDQUF4QjtBQUNBLFlBQUlLLGVBQUosRUFBcUI7QUFDbkI7QUFDQVAseUJBQWVTLE9BQWYsQ0FBdUJGLGVBQXZCO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBOUQscUJBQWUwRCxPQUFmLEdBQXlCQyxhQUF6QjtBQUNBM0QscUJBQWVnQyxLQUFmLEdBQXVCM0MsaUJBQXZCO0FBQ0Q7QUFDRjs7QUFFRCxNQUFNOEQsV0FBV0QsMkJBQTJCLEVBQUMxRCxvQkFBRCxFQUEzQixDQUFqQixDQTlCQyxDQThCeUQ7O0FBRTFELE1BQU15RSxXQUFXO0FBQ2ZuQyxXQUFPLElBRFE7QUFFZkMsV0FBTyxJQUZRO0FBR2ZDLFdBQU8sQ0FBQyxDQUhPO0FBSWZDLFlBQVEsS0FKTztBQUtmeEMsUUFMZTtBQU1mQyxRQU5lO0FBT2Z3RSxXQUFPLENBQUN6RSxDQUFELEVBQUlDLENBQUosQ0FQUTtBQVFmeUUsWUFBUWhCLFNBQVNpQixTQUFULENBQW1CLENBQUMzRSxDQUFELEVBQUlDLENBQUosQ0FBbkIsQ0FSTztBQVNmMkUsaUJBQWEsQ0FBQ2xFLE9BQUQsRUFBVUcsT0FBVixDQVRFO0FBVWZKO0FBVmUsR0FBakI7O0FBYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNb0UsUUFBUSxJQUFJM0MsR0FBSixFQUFkOztBQUVBNEIsaUJBQWUzQixPQUFmLENBQXVCLGlCQUFTO0FBQzlCLFFBQUlDLE9BQU8wQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQlAsUUFBbEIsQ0FBWDs7QUFFQSxRQUFJbEMsVUFBVTNDLFdBQWQsRUFBMkI7QUFDekJ5QyxXQUFLQyxLQUFMLEdBQWEzQyxXQUFiO0FBQ0EwQyxXQUFLRyxLQUFMLEdBQWEzQyxpQkFBYjtBQUNBd0MsV0FBS0ksTUFBTCxHQUFjLElBQWQ7QUFDRDs7QUFFREosV0FBT0ssb0JBQW9CLEVBQUNILFlBQUQsRUFBUUYsVUFBUixFQUFjaEMsVUFBZCxFQUFwQixDQUFQOztBQUVBO0FBQ0E7QUFDQSxRQUFJZ0MsSUFBSixFQUFVO0FBQ1J5QyxZQUFNakMsR0FBTixDQUFVUixLQUFLRSxLQUFMLENBQVc4QixFQUFyQixFQUF5QmhDLElBQXpCO0FBQ0Q7O0FBRUQsUUFBTTRDLHVCQUNKMUMsTUFBTTZCLEtBQU4sQ0FBWWMsYUFBWixJQUE2QnRGLGdCQUFnQjJDLEtBQTdDLEdBQXFENUMsV0FBckQsR0FBbUUsSUFEckU7O0FBR0EsUUFBTXdGLG9CQUFvQjtBQUN4QkY7QUFEd0IsS0FBMUI7O0FBcEI4QjtBQUFBO0FBQUE7O0FBQUE7QUF3QjlCLDJCQUFvQjFDLE1BQU02QyxTQUFOLEVBQXBCLDhIQUF1QztBQUFBLFlBQTVCQyxLQUE0Qjs7QUFDckNBLGNBQU1DLG9CQUFOLENBQTJCSCxpQkFBM0I7QUFDRDtBQTFCNkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTJCL0IsR0EzQkQ7O0FBNkJBLE1BQU1JLHFCQUFxQkMsMEJBQTBCVixLQUExQixFQUFpQ3pFLElBQWpDLENBQTNCOztBQUVBLFNBQU9rRixrQkFBUDtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyx5QkFBVCxDQUFtQ1YsS0FBbkMsRUFBMEN6RSxJQUExQyxFQUFnRDtBQUM5QyxNQUFNa0YscUJBQXFCLEVBQTNCOztBQUVBVCxRQUFNMUMsT0FBTixDQUFjLGdCQUFRO0FBQ3BCLFFBQUlxRCxVQUFVLEtBQWQ7QUFDQSxZQUFRcEYsSUFBUjtBQUNFLFdBQUssT0FBTDtBQUNFb0Ysa0JBQVVwRCxLQUFLRSxLQUFMLENBQVc2QixLQUFYLENBQWlCc0IsT0FBakIsQ0FBeUJyRCxJQUF6QixDQUFWO0FBQ0E7QUFDRixXQUFLLE9BQUw7QUFDRW9ELGtCQUFVcEQsS0FBS0UsS0FBTCxDQUFXNkIsS0FBWCxDQUFpQnVCLE9BQWpCLENBQXlCdEQsSUFBekIsQ0FBVjtBQUNBO0FBQ0YsV0FBSyxPQUFMO0FBQ0U7QUFDRjtBQUNFLGNBQU0sSUFBSXVELEtBQUosQ0FBVSxtQkFBVixDQUFOO0FBVko7O0FBYUEsUUFBSSxDQUFDSCxPQUFMLEVBQWM7QUFDWkYseUJBQW1CTSxJQUFuQixDQUF3QnhELElBQXhCO0FBQ0Q7QUFDRixHQWxCRDs7QUFvQkEsU0FBT2tELGtCQUFQO0FBQ0Q7O0FBRUQ7Ozs7QUFJTyxTQUFTOUYsMkJBQVQsQ0FDTEssRUFESyxTQUdMO0FBQUEsTUFEQ3lCLFlBQ0QsU0FEQ0EsWUFDRDtBQUFBLE1BRGV4QixNQUNmLFNBRGVBLE1BQ2Y7QUFBQSxNQUR1QlksT0FDdkIsU0FEdUJBLE9BQ3ZCO0FBQUEsTUFEZ0NHLE9BQ2hDLFNBRGdDQSxPQUNoQztBQUFBLE1BRHlDRyxZQUN6QyxTQUR5Q0EsWUFDekM7QUFBQSxNQUR1REMsVUFDdkQsU0FEdURBLFVBQ3ZEOztBQUNBLHdCQUFPSyxZQUFQOztBQUVBO0FBQ0E7QUFKQSxNQUtPdEIsQ0FMUCxHQUs4QmlCLFVBTDlCLENBS09qQixDQUxQO0FBQUEsTUFLVUMsQ0FMVixHQUs4QmdCLFVBTDlCLENBS1VoQixDQUxWO0FBQUEsTUFLYW1CLEtBTGIsR0FLOEJILFVBTDlCLENBS2FHLEtBTGI7QUFBQSxNQUtvQkwsTUFMcEIsR0FLOEJFLFVBTDlCLENBS29CRixNQUxwQjs7QUFNQSxNQUFJOEUsNEJBQTRCN0UsZUFBZUEsWUFBL0M7QUFDQSxNQUFJOEUsb0JBQW9CLENBQUMsQ0FBekI7QUFDQSxNQUFJQyxJQUFJLENBQVI7O0FBRUEsT0FBSyxJQUFJQyxNQUFNLENBQWYsRUFBa0JBLE1BQU1qRixNQUF4QixFQUFnQ2lGLEtBQWhDLEVBQXVDO0FBQ3JDLFFBQU1DLEtBQUtELE1BQU0vRixDQUFOLEdBQVVZLE9BQXJCO0FBQ0EsUUFBTXFGLE1BQU1ELEtBQUtBLEVBQWpCOztBQUVBLFFBQUlDLE1BQU1MLHlCQUFWLEVBQXFDO0FBQ25DO0FBQ0FFLFdBQUssSUFBSTNFLEtBQVQ7QUFDRCxLQUhELE1BR087QUFDTCxXQUFLLElBQUkrRSxNQUFNLENBQWYsRUFBa0JBLE1BQU0vRSxLQUF4QixFQUErQitFLEtBQS9CLEVBQXNDO0FBQ3BDO0FBQ0EsWUFBTUMsbUJBQW1COUUsYUFBYXlFLElBQUksQ0FBakIsSUFBc0IsQ0FBL0M7O0FBRUEsWUFBSUssb0JBQW9CLENBQXhCLEVBQTJCO0FBQ3pCLGNBQU1DLEtBQUtGLE1BQU1uRyxDQUFOLEdBQVVVLE9BQXJCO0FBQ0EsY0FBTTRGLEtBQUtELEtBQUtBLEVBQUwsR0FBVUgsR0FBckI7O0FBRUEsY0FBSUksTUFBTVQseUJBQVYsRUFBcUM7QUFDbkNBLHdDQUE0QlMsRUFBNUI7QUFDQVIsZ0NBQW9CQyxDQUFwQjtBQUNEO0FBQ0Y7QUFDREEsYUFBSyxDQUFMO0FBQ0Q7QUFDRjtBQUNGOztBQUVELE1BQUlELHFCQUFxQixDQUF6QixFQUE0QjtBQUMxQjtBQUNBLFFBQU1NLG9CQUFtQjlFLGFBQWF3RSxvQkFBb0IsQ0FBakMsSUFBc0MsQ0FBL0Q7QUFDQSxRQUFNcEcsY0FBYzRCLGFBQWFpRixLQUFiLENBQW1CVCxpQkFBbkIsRUFBc0NBLG9CQUFvQixDQUExRCxDQUFwQjtBQUNBLFFBQU1uRyxjQUFjRyxPQUFPc0csaUJBQVAsQ0FBcEI7QUFDQSxRQUFJekcsV0FBSixFQUFpQjtBQUNmLFVBQU1DLG9CQUFvQkQsWUFBWTZHLGtCQUFaLENBQStCOUcsV0FBL0IsQ0FBMUI7QUFDQSxhQUFPLEVBQUNBLHdCQUFELEVBQWNDLHdCQUFkLEVBQTJCQyxvQ0FBM0IsRUFBUDtBQUNEO0FBQ0Qsa0JBQUk2RyxLQUFKLENBQVUsdURBQVY7QUFDRDs7QUFFRCxTQUFPaEgsZ0JBQVA7QUFDRDtBQUNEOztBQUVBOzs7O0FBSUEsU0FBU3VDLDJCQUFULENBQXFDbkMsRUFBckMsU0FBaUU7QUFBQSxNQUF2QnlCLFlBQXVCLFNBQXZCQSxZQUF1QjtBQUFBLE1BQVR4QixNQUFTLFNBQVRBLE1BQVM7O0FBQy9ELE1BQU00RyxlQUFlLElBQUl4RSxHQUFKLEVBQXJCOztBQUVBO0FBQ0EsTUFBSVosWUFBSixFQUFrQjtBQUNoQixTQUFLLElBQUl5RSxJQUFJLENBQWIsRUFBZ0JBLElBQUl6RSxhQUFhK0IsTUFBakMsRUFBeUMwQyxLQUFLLENBQTlDLEVBQWlEO0FBQy9DO0FBQ0EsVUFBTUssbUJBQW1COUUsYUFBYXlFLElBQUksQ0FBakIsSUFBc0IsQ0FBL0M7O0FBRUEsVUFBSUssb0JBQW9CLENBQXhCLEVBQTJCO0FBQ3pCLFlBQU0xRyxjQUFjNEIsYUFBYWlGLEtBQWIsQ0FBbUJSLENBQW5CLEVBQXNCQSxJQUFJLENBQTFCLENBQXBCO0FBQ0EsWUFBTVksV0FBV2pILFlBQVlrSCxJQUFaLENBQWlCLEdBQWpCLENBQWpCO0FBQ0E7QUFDQSxZQUFJLENBQUNGLGFBQWFoRSxHQUFiLENBQWlCaUUsUUFBakIsQ0FBTCxFQUFpQztBQUMvQixjQUFNaEgsY0FBY0csT0FBT3NHLGdCQUFQLENBQXBCO0FBQ0E7QUFDQSxjQUFJekcsV0FBSixFQUFpQjtBQUNmK0cseUJBQWE5RCxHQUFiLENBQWlCK0QsUUFBakIsRUFBMkI7QUFDekJqSCxzQ0FEeUI7QUFFekJDLHNDQUZ5QjtBQUd6QkMsaUNBQW1CRCxZQUFZNkcsa0JBQVosQ0FBK0I5RyxXQUEvQjtBQUhNLGFBQTNCO0FBS0QsV0FORCxNQU1PO0FBQ0wsMEJBQUkrRyxLQUFKLENBQVUsdURBQVY7QUFDRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGOztBQUVELFNBQU81RCxNQUFNQyxJQUFOLENBQVc0RCxhQUFhM0QsTUFBYixFQUFYLENBQVA7QUFDRDs7QUFFRDtBQUNBLFNBQVNOLG1CQUFULFFBQWtEO0FBQUEsTUFBcEJILEtBQW9CLFNBQXBCQSxLQUFvQjtBQUFBLE1BQWJGLElBQWEsU0FBYkEsSUFBYTtBQUFBLE1BQVBoQyxJQUFPLFNBQVBBLElBQU87O0FBQ2hELFNBQU9rQyxTQUFTRixJQUFoQixFQUFzQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU15RSxjQUFjekUsS0FBS0UsS0FBTCxJQUFjQSxLQUFsQztBQUNBRixTQUFLRSxLQUFMLEdBQWFBLEtBQWI7QUFDQTtBQUNBO0FBQ0E7QUFDQUYsV0FBT0UsTUFBTXdFLFNBQU4sQ0FBZ0IsRUFBQzFFLFVBQUQsRUFBT2hDLFVBQVAsRUFBYXlHLHdCQUFiLEVBQWhCLENBQVA7QUFDQXZFLFlBQVFBLE1BQU15RSxXQUFkO0FBQ0Q7QUFDRCxTQUFPM0UsSUFBUDtBQUNEIiwiZmlsZSI6InBpY2stbGF5ZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7ZHJhd1BpY2tpbmdCdWZmZXIsIGdldFBpeGVsUmF0aW99IGZyb20gJy4vZHJhdy1sYXllcnMnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi91dGlscy9sb2cnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBOT19QSUNLRURfT0JKRUNUID0ge1xuICBwaWNrZWRDb2xvcjogbnVsbCxcbiAgcGlja2VkTGF5ZXI6IG51bGwsXG4gIHBpY2tlZE9iamVjdEluZGV4OiAtMVxufTtcblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWRlcHRoLCBtYXgtc3RhdGVtZW50cyAqL1xuLy8gUGljayB0aGUgY2xvc2VzdCBvYmplY3QgYXQgdGhlIGdpdmVuICh4LHkpIGNvb3JkaW5hdGVcbmV4cG9ydCBmdW5jdGlvbiBwaWNrT2JqZWN0KFxuICBnbCxcbiAge1xuICAgIGxheWVycyxcbiAgICB2aWV3cG9ydHMsXG4gICAgeCxcbiAgICB5LFxuICAgIHJhZGl1cyxcbiAgICBsYXllckZpbHRlcixcbiAgICBtb2RlLFxuICAgIG9uVmlld3BvcnRBY3RpdmUsXG4gICAgcGlja2luZ0ZCTyxcbiAgICBsYXN0UGlja2VkSW5mbyxcbiAgICB1c2VEZXZpY2VQaXhlbHNcbiAgfVxuKSB7XG4gIC8vIENvbnZlcnQgZnJvbSBjYW52YXMgdG9wLWxlZnQgdG8gV2ViR0wgYm90dG9tLWxlZnQgY29vcmRpbmF0ZXNcbiAgLy8gQW5kIGNvbXBlbnNhdGUgZm9yIHBpeGVsUmF0aW9cbiAgY29uc3QgcGl4ZWxSYXRpbyA9IGdldFBpeGVsUmF0aW8oe3VzZURldmljZVBpeGVsc30pO1xuICBjb25zdCBkZXZpY2VYID0gTWF0aC5yb3VuZCh4ICogcGl4ZWxSYXRpbyk7XG4gIGNvbnN0IGRldmljZVkgPSBNYXRoLnJvdW5kKGdsLmNhbnZhcy5oZWlnaHQgLSB5ICogcGl4ZWxSYXRpbyk7XG4gIGNvbnN0IGRldmljZVJhZGl1cyA9IE1hdGgucm91bmQocmFkaXVzICogcGl4ZWxSYXRpbyk7XG5cbiAgY29uc3QgZGV2aWNlUmVjdCA9IGdldFBpY2tpbmdSZWN0KHtcbiAgICBkZXZpY2VYLFxuICAgIGRldmljZVksXG4gICAgZGV2aWNlUmFkaXVzLFxuICAgIGRldmljZVdpZHRoOiBwaWNraW5nRkJPLndpZHRoLFxuICAgIGRldmljZUhlaWdodDogcGlja2luZ0ZCTy5oZWlnaHRcbiAgfSk7XG5cbiAgY29uc3QgcGlja2VkQ29sb3JzID1cbiAgICBkZXZpY2VSZWN0ICYmXG4gICAgZHJhd0FuZFNhbXBsZVBpY2tpbmdCdWZmZXIoZ2wsIHtcbiAgICAgIGxheWVycyxcbiAgICAgIHZpZXdwb3J0cyxcbiAgICAgIG9uVmlld3BvcnRBY3RpdmUsXG4gICAgICB1c2VEZXZpY2VQaXhlbHMsXG4gICAgICBwaWNraW5nRkJPLFxuICAgICAgZGV2aWNlUmVjdCxcbiAgICAgIGxheWVyRmlsdGVyLFxuICAgICAgcmVkcmF3UmVhc29uOiBtb2RlXG4gICAgfSk7XG5cbiAgY29uc3QgcGlja0luZm8gPVxuICAgIChwaWNrZWRDb2xvcnMgJiZcbiAgICAgIGdldENsb3Nlc3RGcm9tUGlja2luZ0J1ZmZlcihnbCwge1xuICAgICAgICBwaWNrZWRDb2xvcnMsXG4gICAgICAgIGxheWVycyxcbiAgICAgICAgZGV2aWNlWCxcbiAgICAgICAgZGV2aWNlWSxcbiAgICAgICAgZGV2aWNlUmFkaXVzLFxuICAgICAgICBkZXZpY2VSZWN0XG4gICAgICB9KSkgfHxcbiAgICBOT19QSUNLRURfT0JKRUNUO1xuXG4gIHJldHVybiBwcm9jZXNzUGlja0luZm8oe1xuICAgIHBpY2tJbmZvLFxuICAgIGxhc3RQaWNrZWRJbmZvLFxuICAgIG1vZGUsXG4gICAgbGF5ZXJzLFxuICAgIHZpZXdwb3J0cyxcbiAgICB4LFxuICAgIHksXG4gICAgZGV2aWNlWCxcbiAgICBkZXZpY2VZLFxuICAgIHBpeGVsUmF0aW9cbiAgfSk7XG59XG5cbi8vIFBpY2sgYWxsIG9iamVjdHMgd2l0aGluIHRoZSBnaXZlbiBib3VuZGluZyBib3hcbmV4cG9ydCBmdW5jdGlvbiBwaWNrVmlzaWJsZU9iamVjdHMoXG4gIGdsLFxuICB7XG4gICAgbGF5ZXJzLFxuICAgIHZpZXdwb3J0cyxcbiAgICB4LFxuICAgIHksXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1vZGUsXG4gICAgbGF5ZXJGaWx0ZXIsXG4gICAgb25WaWV3cG9ydEFjdGl2ZSxcbiAgICBwaWNraW5nRkJPLFxuICAgIHVzZURldmljZVBpeGVsc1xuICB9XG4pIHtcbiAgLy8gQ29udmVydCBmcm9tIGNhbnZhcyB0b3AtbGVmdCB0byBXZWJHTCBib3R0b20tbGVmdCBjb29yZGluYXRlc1xuICAvLyBBbmQgY29tcGVuc2F0ZSBmb3IgcGl4ZWxSYXRpb1xuICBjb25zdCBwaXhlbFJhdGlvID0gZ2V0UGl4ZWxSYXRpbyh7dXNlRGV2aWNlUGl4ZWxzfSk7XG5cbiAgY29uc3QgZGV2aWNlTGVmdCA9IE1hdGgucm91bmQoeCAqIHBpeGVsUmF0aW8pO1xuICBjb25zdCBkZXZpY2VCb3R0b20gPSBNYXRoLnJvdW5kKGdsLmNhbnZhcy5oZWlnaHQgLSB5ICogcGl4ZWxSYXRpbyk7XG4gIGNvbnN0IGRldmljZVJpZ2h0ID0gTWF0aC5yb3VuZCgoeCArIHdpZHRoKSAqIHBpeGVsUmF0aW8pO1xuICBjb25zdCBkZXZpY2VUb3AgPSBNYXRoLnJvdW5kKGdsLmNhbnZhcy5oZWlnaHQgLSAoeSArIGhlaWdodCkgKiBwaXhlbFJhdGlvKTtcblxuICBjb25zdCBkZXZpY2VSZWN0ID0ge1xuICAgIHg6IGRldmljZUxlZnQsXG4gICAgeTogZGV2aWNlVG9wLFxuICAgIHdpZHRoOiBkZXZpY2VSaWdodCAtIGRldmljZUxlZnQsXG4gICAgaGVpZ2h0OiBkZXZpY2VCb3R0b20gLSBkZXZpY2VUb3BcbiAgfTtcblxuICBjb25zdCBwaWNrZWRDb2xvcnMgPSBkcmF3QW5kU2FtcGxlUGlja2luZ0J1ZmZlcihnbCwge1xuICAgIGxheWVycyxcbiAgICB2aWV3cG9ydHMsXG4gICAgb25WaWV3cG9ydEFjdGl2ZSxcbiAgICBwaWNraW5nRkJPLFxuICAgIHVzZURldmljZVBpeGVscyxcbiAgICBkZXZpY2VSZWN0LFxuICAgIGxheWVyRmlsdGVyLFxuICAgIHJlZHJhd1JlYXNvbjogbW9kZVxuICB9KTtcblxuICBjb25zdCBwaWNrSW5mb3MgPSBnZXRVbmlxdWVzRnJvbVBpY2tpbmdCdWZmZXIoZ2wsIHtwaWNrZWRDb2xvcnMsIGxheWVyc30pO1xuXG4gIC8vIE9ubHkgcmV0dXJuIHVuaXF1ZSBpbmZvcywgaWRlbnRpZmllZCBieSBpbmZvLm9iamVjdFxuICBjb25zdCB1bmlxdWVJbmZvcyA9IG5ldyBNYXAoKTtcblxuICBwaWNrSW5mb3MuZm9yRWFjaChwaWNrSW5mbyA9PiB7XG4gICAgbGV0IGluZm8gPSB7XG4gICAgICBjb2xvcjogcGlja0luZm8ucGlja2VkQ29sb3IsXG4gICAgICBsYXllcjogbnVsbCxcbiAgICAgIGluZGV4OiBwaWNrSW5mby5waWNrZWRPYmplY3RJbmRleCxcbiAgICAgIHBpY2tlZDogdHJ1ZSxcbiAgICAgIHgsXG4gICAgICB5LFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBwaXhlbFJhdGlvXG4gICAgfTtcblxuICAgIGluZm8gPSBnZXRMYXllclBpY2tpbmdJbmZvKHtsYXllcjogcGlja0luZm8ucGlja2VkTGF5ZXIsIGluZm8sIG1vZGV9KTtcbiAgICBpZiAoIXVuaXF1ZUluZm9zLmhhcyhpbmZvLm9iamVjdCkpIHtcbiAgICAgIHVuaXF1ZUluZm9zLnNldChpbmZvLm9iamVjdCwgaW5mbyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gQXJyYXkuZnJvbSh1bmlxdWVJbmZvcy52YWx1ZXMoKSk7XG59XG5cbi8vIEhFTFBFUiBNRVRIT0RTXG5cbi8vIHJldHVybnMgcGlja2VkQ29sb3Igb3IgbnVsbCBpZiBubyBwaWNrYWJsZSBsYXllcnMgZm91bmQuXG5mdW5jdGlvbiBkcmF3QW5kU2FtcGxlUGlja2luZ0J1ZmZlcihcbiAgZ2wsXG4gIHtcbiAgICBsYXllcnMsXG4gICAgdmlld3BvcnRzLFxuICAgIG9uVmlld3BvcnRBY3RpdmUsXG4gICAgdXNlRGV2aWNlUGl4ZWxzLFxuICAgIHBpY2tpbmdGQk8sXG4gICAgZGV2aWNlUmVjdCxcbiAgICBsYXllckZpbHRlcixcbiAgICByZWRyYXdSZWFzb25cbiAgfVxuKSB7XG4gIGFzc2VydChkZXZpY2VSZWN0KTtcbiAgYXNzZXJ0KE51bWJlci5pc0Zpbml0ZShkZXZpY2VSZWN0LndpZHRoKSAmJiBkZXZpY2VSZWN0LndpZHRoID4gMCwgJ2B3aWR0aGAgbXVzdCBiZSA+IDAnKTtcbiAgYXNzZXJ0KE51bWJlci5pc0Zpbml0ZShkZXZpY2VSZWN0LmhlaWdodCkgJiYgZGV2aWNlUmVjdC5oZWlnaHQgPiAwLCAnYGhlaWdodGAgbXVzdCBiZSA+IDAnKTtcblxuICBjb25zdCBwaWNrYWJsZUxheWVycyA9IGxheWVycy5maWx0ZXIobGF5ZXIgPT4gbGF5ZXIuaXNQaWNrYWJsZSgpKTtcbiAgaWYgKHBpY2thYmxlTGF5ZXJzLmxlbmd0aCA8IDEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGRyYXdQaWNraW5nQnVmZmVyKGdsLCB7XG4gICAgbGF5ZXJzLFxuICAgIHZpZXdwb3J0cyxcbiAgICBvblZpZXdwb3J0QWN0aXZlLFxuICAgIHVzZURldmljZVBpeGVscyxcbiAgICBwaWNraW5nRkJPLFxuICAgIGRldmljZVJlY3QsXG4gICAgbGF5ZXJGaWx0ZXIsXG4gICAgcmVkcmF3UmVhc29uXG4gIH0pO1xuXG4gIC8vIFJlYWQgZnJvbSBhbiBhbHJlYWR5IHJlbmRlcmVkIHBpY2tpbmcgYnVmZmVyXG4gIC8vIFJldHVybnMgYW4gVWludDhDbGFtcGVkQXJyYXkgb2YgcGlja2VkIHBpeGVsc1xuICBjb25zdCB7eCwgeSwgd2lkdGgsIGhlaWdodH0gPSBkZXZpY2VSZWN0O1xuICBjb25zdCBwaWNrZWRDb2xvcnMgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuICBwaWNraW5nRkJPLnJlYWRQaXhlbHMoe3gsIHksIHdpZHRoLCBoZWlnaHQsIHBpeGVsQXJyYXk6IHBpY2tlZENvbG9yc30pO1xuICByZXR1cm4gcGlja2VkQ29sb3JzO1xufVxuXG4vLyBJbmRlbnRpZmllcyB3aGljaCB2aWV3cG9ydCwgaWYgYW55IGNvcnJlc3BvbmRzIHRvIHggYW5kIHlcbi8vIFJldHVybnMgZmlyc3Qgdmlld3BvcnQgaWYgbm8gbWF0Y2hcbi8vIFRPRE8gLSBuZWVkIHRvIGRldGVybWluZSB3aGljaCB2aWV3cG9ydCB3ZSBhcmUgaW5cbi8vIFRPRE8gLSBkb2N1bWVudCBjb25jZXB0IG9mIFwicHJpbWFyeSB2aWV3cG9ydFwiIHRoYXQgbWF0Y2hlcyBhbGwgY29vcmRzP1xuLy8gVE9ETyAtIHN0YXRpYyBtZXRob2Qgb24gVmlld3BvcnQgY2xhc3M/XG5mdW5jdGlvbiBnZXRWaWV3cG9ydEZyb21Db29yZGluYXRlcyh7dmlld3BvcnRzfSkge1xuICBjb25zdCB2aWV3cG9ydCA9IHZpZXdwb3J0c1swXTtcbiAgcmV0dXJuIHZpZXdwb3J0O1xufVxuXG4vLyBDYWxjdWxhdGUgYSBwaWNraW5nIHJlY3QgY2VudGVyZWQgb24gZGV2aWNlWCBhbmQgZGV2aWNlWSBhbmQgY2xpcHBlZCB0byBkZXZpY2Vcbi8vIFJldHVybnMgbnVsbCBpZiBwaXhlbCBpcyBvdXRzaWRlIG9mIGRldmljZVxuZnVuY3Rpb24gZ2V0UGlja2luZ1JlY3Qoe2RldmljZVgsIGRldmljZVksIGRldmljZVJhZGl1cywgZGV2aWNlV2lkdGgsIGRldmljZUhlaWdodH0pIHtcbiAgY29uc3QgdmFsaWQgPSBkZXZpY2VYID49IDAgJiYgZGV2aWNlWSA+PSAwICYmIGRldmljZVggPCBkZXZpY2VXaWR0aCAmJiBkZXZpY2VZIDwgZGV2aWNlSGVpZ2h0O1xuXG4gIC8vIHgsIHkgb3V0IG9mIGJvdW5kcy5cbiAgaWYgKCF2YWxpZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgYm94IG9mIHNpemUgYHJhZGl1cyAqIDIgKyAxYCBjZW50ZXJlZCBhdCBbZGV2aWNlWCwgZGV2aWNlWV1cbiAgY29uc3QgeCA9IE1hdGgubWF4KDAsIGRldmljZVggLSBkZXZpY2VSYWRpdXMpO1xuICBjb25zdCB5ID0gTWF0aC5tYXgoMCwgZGV2aWNlWSAtIGRldmljZVJhZGl1cyk7XG4gIGNvbnN0IHdpZHRoID0gTWF0aC5taW4oZGV2aWNlV2lkdGgsIGRldmljZVggKyBkZXZpY2VSYWRpdXMpIC0geCArIDE7XG4gIGNvbnN0IGhlaWdodCA9IE1hdGgubWluKGRldmljZUhlaWdodCwgZGV2aWNlWSArIGRldmljZVJhZGl1cykgLSB5ICsgMTtcblxuICByZXR1cm4ge3gsIHksIHdpZHRoLCBoZWlnaHR9O1xufVxuXG4vLyBUT0RPIC0gYnJlYWsgdGhpcyBtb25zdGVyIGZ1bmN0aW9uIGludG8gMysgcGFydHNcbmZ1bmN0aW9uIHByb2Nlc3NQaWNrSW5mbyh7XG4gIHBpY2tJbmZvLFxuICBsYXN0UGlja2VkSW5mbyxcbiAgbW9kZSxcbiAgbGF5ZXJzLFxuICB2aWV3cG9ydHMsXG4gIHgsXG4gIHksXG4gIGRldmljZVgsXG4gIGRldmljZVksXG4gIHBpeGVsUmF0aW9cbn0pIHtcbiAgY29uc3Qge3BpY2tlZENvbG9yLCBwaWNrZWRMYXllciwgcGlja2VkT2JqZWN0SW5kZXh9ID0gcGlja0luZm87XG5cbiAgY29uc3QgYWZmZWN0ZWRMYXllcnMgPSBwaWNrZWRMYXllciA/IFtwaWNrZWRMYXllcl0gOiBbXTtcblxuICBpZiAobW9kZSA9PT0gJ2hvdmVyJykge1xuICAgIC8vIG9ubHkgaW52b2tlIG9uSG92ZXIgZXZlbnRzIGlmIHBpY2tlZCBvYmplY3QgaGFzIGNoYW5nZWRcbiAgICBjb25zdCBsYXN0UGlja2VkT2JqZWN0SW5kZXggPSBsYXN0UGlja2VkSW5mby5pbmRleDtcbiAgICBjb25zdCBsYXN0UGlja2VkTGF5ZXJJZCA9IGxhc3RQaWNrZWRJbmZvLmxheWVySWQ7XG4gICAgY29uc3QgcGlja2VkTGF5ZXJJZCA9IHBpY2tlZExheWVyICYmIHBpY2tlZExheWVyLnByb3BzLmlkO1xuXG4gICAgLy8gcHJvY2VlZCBvbmx5IGlmIHBpY2tlZCBvYmplY3QgY2hhbmdlZFxuICAgIGlmIChwaWNrZWRMYXllcklkICE9PSBsYXN0UGlja2VkTGF5ZXJJZCB8fCBwaWNrZWRPYmplY3RJbmRleCAhPT0gbGFzdFBpY2tlZE9iamVjdEluZGV4KSB7XG4gICAgICBpZiAocGlja2VkTGF5ZXJJZCAhPT0gbGFzdFBpY2tlZExheWVySWQpIHtcbiAgICAgICAgLy8gV2UgY2Fubm90IHN0b3JlIGEgcmVmIHRvIGxhc3RQaWNrZWRMYXllciBpbiB0aGUgY29udGV4dCBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBzdGF0ZSBvZiBhbiBvdXRkYXRlZCBsYXllciBpcyBubyBsb25nZXIgdmFsaWRcbiAgICAgICAgLy8gYW5kIHRoZSBwcm9wcyBtYXkgaGF2ZSBjaGFuZ2VkXG4gICAgICAgIGNvbnN0IGxhc3RQaWNrZWRMYXllciA9IGxheWVycy5maW5kKGxheWVyID0+IGxheWVyLnByb3BzLmlkID09PSBsYXN0UGlja2VkTGF5ZXJJZCk7XG4gICAgICAgIGlmIChsYXN0UGlja2VkTGF5ZXIpIHtcbiAgICAgICAgICAvLyBMZXQgbGVhdmUgZXZlbnQgZmlyZSBiZWZvcmUgZW50ZXIgZXZlbnRcbiAgICAgICAgICBhZmZlY3RlZExheWVycy51bnNoaWZ0KGxhc3RQaWNrZWRMYXllcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIGxheWVyIG1hbmFnZXIgY29udGV4dFxuICAgICAgbGFzdFBpY2tlZEluZm8ubGF5ZXJJZCA9IHBpY2tlZExheWVySWQ7XG4gICAgICBsYXN0UGlja2VkSW5mby5pbmRleCA9IHBpY2tlZE9iamVjdEluZGV4O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZpZXdwb3J0ID0gZ2V0Vmlld3BvcnRGcm9tQ29vcmRpbmF0ZXMoe3ZpZXdwb3J0c30pOyAvLyBUT0RPIC0gYWRkIGNvb3Jkc1xuXG4gIGNvbnN0IGJhc2VJbmZvID0ge1xuICAgIGNvbG9yOiBudWxsLFxuICAgIGxheWVyOiBudWxsLFxuICAgIGluZGV4OiAtMSxcbiAgICBwaWNrZWQ6IGZhbHNlLFxuICAgIHgsXG4gICAgeSxcbiAgICBwaXhlbDogW3gsIHldLFxuICAgIGxuZ0xhdDogdmlld3BvcnQudW5wcm9qZWN0KFt4LCB5XSksXG4gICAgZGV2aWNlUGl4ZWw6IFtkZXZpY2VYLCBkZXZpY2VZXSxcbiAgICBwaXhlbFJhdGlvXG4gIH07XG5cbiAgLy8gVXNlIGEgTWFwIHRvIHN0b3JlIGFsbCBwaWNraW5nIGluZm9zLlxuICAvLyBUaGUgZm9sbG93aW5nIHR3byBmb3JFYWNoIGxvb3BzIGFyZSB0aGUgcmVzdWx0IG9mXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS91YmVyL2RlY2suZ2wvaXNzdWVzLzQ0M1xuICAvLyBQbGVhc2UgYmUgdmVyeSBjYXJlZnVsIHdoZW4gY2hhbmdpbmcgdGhpcyBwYXR0ZXJuXG4gIGNvbnN0IGluZm9zID0gbmV3IE1hcCgpO1xuXG4gIGFmZmVjdGVkTGF5ZXJzLmZvckVhY2gobGF5ZXIgPT4ge1xuICAgIGxldCBpbmZvID0gT2JqZWN0LmFzc2lnbih7fSwgYmFzZUluZm8pO1xuXG4gICAgaWYgKGxheWVyID09PSBwaWNrZWRMYXllcikge1xuICAgICAgaW5mby5jb2xvciA9IHBpY2tlZENvbG9yO1xuICAgICAgaW5mby5pbmRleCA9IHBpY2tlZE9iamVjdEluZGV4O1xuICAgICAgaW5mby5waWNrZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGluZm8gPSBnZXRMYXllclBpY2tpbmdJbmZvKHtsYXllciwgaW5mbywgbW9kZX0pO1xuXG4gICAgLy8gVGhpcyBndWFyYW50ZWVzIHRoYXQgdGhlcmUgd2lsbCBiZSBvbmx5IG9uZSBjb3B5IG9mIGluZm8gZm9yXG4gICAgLy8gb25lIGNvbXBvc2l0ZSBsYXllclxuICAgIGlmIChpbmZvKSB7XG4gICAgICBpbmZvcy5zZXQoaW5mby5sYXllci5pZCwgaW5mbyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGlja2luZ1NlbGVjdGVkQ29sb3IgPVxuICAgICAgbGF5ZXIucHJvcHMuYXV0b0hpZ2hsaWdodCAmJiBwaWNrZWRMYXllciA9PT0gbGF5ZXIgPyBwaWNrZWRDb2xvciA6IG51bGw7XG5cbiAgICBjb25zdCBwaWNraW5nUGFyYW1ldGVycyA9IHtcbiAgICAgIHBpY2tpbmdTZWxlY3RlZENvbG9yXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbGF5ZXIuZ2V0TW9kZWxzKCkpIHtcbiAgICAgIG1vZGVsLnVwZGF0ZU1vZHVsZVNldHRpbmdzKHBpY2tpbmdQYXJhbWV0ZXJzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IHVuaGFuZGxlZFBpY2tJbmZvcyA9IGNhbGxMYXllclBpY2tpbmdDYWxsYmFja3MoaW5mb3MsIG1vZGUpO1xuXG4gIHJldHVybiB1bmhhbmRsZWRQaWNrSW5mb3M7XG59XG5cbi8vIFBlci1sYXllciBldmVudCBoYW5kbGVycyAoZS5nLiBvbkNsaWNrLCBvbkhvdmVyKSBhcmUgcHJvdmlkZWQgYnkgdGhlXG4vLyB1c2VyIGFuZCBvdXQgb2YgZGVjay5nbCdzIGNvbnRyb2wuIEl0J3MgdmVyeSBtdWNoIHBvc3NpYmxlIHRoYXRcbi8vIHRoZSB1c2VyIGNhbGxzIFJlYWN0IGxpZmVjeWNsZSBtZXRob2RzIGluIHRoZXNlIGZ1bmN0aW9uLCBzdWNoIGFzXG4vLyBSZWFjdENvbXBvbmVudC5zZXRTdGF0ZSgpLiBSZWFjdCBsaWZlY3ljbGUgbWV0aG9kcyBzb21ldGltZXMgaW5kdWNlXG4vLyBhIHJlLXJlbmRlciBhbmQgcmUtZ2VuZXJhdGlvbiBvZiBwcm9wcyBvZiBkZWNrLmdsIGFuZCBpdHMgbGF5ZXJzLFxuLy8gd2hpY2ggaW52YWxpZGF0ZXMgYWxsIGxheWVycyBjdXJyZW50bHkgcGFzc2VkIHRvIHRoaXMgdmVyeSBmdW5jdGlvbi5cblxuLy8gVGhlcmVmb3JlLCBwZXItbGF5ZXIgZXZlbnQgaGFuZGxlcnMgbXVzdCBiZSBpbnZva2VkIGF0IHRoZSBlbmRcbi8vIG9mIHRoZSBwaWNraW5nIG9wZXJhdGlvbi4gTk8gb3BlcmF0aW9uIHRoYXQgcmVsaWVzIG9uIHRoZSBzdGF0ZXMgb2YgY3VycmVudFxuLy8gbGF5ZXJzIHNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgdGhpcyBjb2RlLlxuZnVuY3Rpb24gY2FsbExheWVyUGlja2luZ0NhbGxiYWNrcyhpbmZvcywgbW9kZSkge1xuICBjb25zdCB1bmhhbmRsZWRQaWNrSW5mb3MgPSBbXTtcblxuICBpbmZvcy5mb3JFYWNoKGluZm8gPT4ge1xuICAgIGxldCBoYW5kbGVkID0gZmFsc2U7XG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlICdjbGljayc6XG4gICAgICAgIGhhbmRsZWQgPSBpbmZvLmxheWVyLnByb3BzLm9uQ2xpY2soaW5mbyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaG92ZXInOlxuICAgICAgICBoYW5kbGVkID0gaW5mby5sYXllci5wcm9wcy5vbkhvdmVyKGluZm8pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3F1ZXJ5JzpcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gcGljayB0eXBlJyk7XG4gICAgfVxuXG4gICAgaWYgKCFoYW5kbGVkKSB7XG4gICAgICB1bmhhbmRsZWRQaWNrSW5mb3MucHVzaChpbmZvKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB1bmhhbmRsZWRQaWNrSW5mb3M7XG59XG5cbi8qKlxuICogUGljayBhdCBhIHNwZWNpZmllZCBwaXhlbCB3aXRoIGEgdG9sZXJhbmNlIHJhZGl1c1xuICogUmV0dXJucyB0aGUgY2xvc2VzdCBvYmplY3QgdG8gdGhlIHBpeGVsIGluIHNoYXBlIGB7cGlja2VkQ29sb3IsIHBpY2tlZExheWVyLCBwaWNrZWRPYmplY3RJbmRleH1gXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDbG9zZXN0RnJvbVBpY2tpbmdCdWZmZXIoXG4gIGdsLFxuICB7cGlja2VkQ29sb3JzLCBsYXllcnMsIGRldmljZVgsIGRldmljZVksIGRldmljZVJhZGl1cywgZGV2aWNlUmVjdH1cbikge1xuICBhc3NlcnQocGlja2VkQ29sb3JzKTtcblxuICAvLyBUcmF2ZXJzZSBhbGwgcGl4ZWxzIGluIHBpY2tpbmcgcmVzdWx0cyBhbmQgZmluZCB0aGUgb25lIGNsb3Nlc3QgdG8gdGhlIHN1cHBsaWVkXG4gIC8vIFtkZXZpY2VYLCBkZXZpY2VZXVxuICBjb25zdCB7eCwgeSwgd2lkdGgsIGhlaWdodH0gPSBkZXZpY2VSZWN0O1xuICBsZXQgbWluU3F1YXJlRGlzdGFuY2VUb0NlbnRlciA9IGRldmljZVJhZGl1cyAqIGRldmljZVJhZGl1cztcbiAgbGV0IGNsb3Nlc3RQaXhlbEluZGV4ID0gLTE7XG4gIGxldCBpID0gMDtcblxuICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCBoZWlnaHQ7IHJvdysrKSB7XG4gICAgY29uc3QgZHkgPSByb3cgKyB5IC0gZGV2aWNlWTtcbiAgICBjb25zdCBkeTIgPSBkeSAqIGR5O1xuXG4gICAgaWYgKGR5MiA+IG1pblNxdWFyZURpc3RhbmNlVG9DZW50ZXIpIHtcbiAgICAgIC8vIHNraXAgdGhpcyByb3dcbiAgICAgIGkgKz0gNCAqIHdpZHRoO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB3aWR0aDsgY29sKyspIHtcbiAgICAgICAgLy8gRGVjb2RlIHBpY2tlZCBsYXllciBmcm9tIGNvbG9yXG4gICAgICAgIGNvbnN0IHBpY2tlZExheWVySW5kZXggPSBwaWNrZWRDb2xvcnNbaSArIDNdIC0gMTtcblxuICAgICAgICBpZiAocGlja2VkTGF5ZXJJbmRleCA+PSAwKSB7XG4gICAgICAgICAgY29uc3QgZHggPSBjb2wgKyB4IC0gZGV2aWNlWDtcbiAgICAgICAgICBjb25zdCBkMiA9IGR4ICogZHggKyBkeTI7XG5cbiAgICAgICAgICBpZiAoZDIgPD0gbWluU3F1YXJlRGlzdGFuY2VUb0NlbnRlcikge1xuICAgICAgICAgICAgbWluU3F1YXJlRGlzdGFuY2VUb0NlbnRlciA9IGQyO1xuICAgICAgICAgICAgY2xvc2VzdFBpeGVsSW5kZXggPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpICs9IDQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsb3Nlc3RQaXhlbEluZGV4ID49IDApIHtcbiAgICAvLyBEZWNvZGUgcGlja2VkIG9iamVjdCBpbmRleCBmcm9tIGNvbG9yXG4gICAgY29uc3QgcGlja2VkTGF5ZXJJbmRleCA9IHBpY2tlZENvbG9yc1tjbG9zZXN0UGl4ZWxJbmRleCArIDNdIC0gMTtcbiAgICBjb25zdCBwaWNrZWRDb2xvciA9IHBpY2tlZENvbG9ycy5zbGljZShjbG9zZXN0UGl4ZWxJbmRleCwgY2xvc2VzdFBpeGVsSW5kZXggKyA0KTtcbiAgICBjb25zdCBwaWNrZWRMYXllciA9IGxheWVyc1twaWNrZWRMYXllckluZGV4XTtcbiAgICBpZiAocGlja2VkTGF5ZXIpIHtcbiAgICAgIGNvbnN0IHBpY2tlZE9iamVjdEluZGV4ID0gcGlja2VkTGF5ZXIuZGVjb2RlUGlja2luZ0NvbG9yKHBpY2tlZENvbG9yKTtcbiAgICAgIHJldHVybiB7cGlja2VkQ29sb3IsIHBpY2tlZExheWVyLCBwaWNrZWRPYmplY3RJbmRleH07XG4gICAgfVxuICAgIGxvZy5lcnJvcignUGlja2VkIG5vbi1leGlzdGVudCBsYXllci4gSXMgcGlja2luZyBidWZmZXIgY29ycnVwdD8nKTtcbiAgfVxuXG4gIHJldHVybiBOT19QSUNLRURfT0JKRUNUO1xufVxuLyogZXNsaW50LWVuYWJsZSBtYXgtZGVwdGgsIG1heC1zdGF0ZW1lbnRzICovXG5cbi8qKlxuICogRXhhbWluZXMgYSBwaWNraW5nIGJ1ZmZlciBmb3IgdW5pcXVlIGNvbG9yc1xuICogUmV0dXJucyBhcnJheSBvZiB1bmlxdWUgb2JqZWN0cyBpbiBzaGFwZSBge3gsIHksIHBpY2tlZENvbG9yLCBwaWNrZWRMYXllciwgcGlja2VkT2JqZWN0SW5kZXh9YFxuICovXG5mdW5jdGlvbiBnZXRVbmlxdWVzRnJvbVBpY2tpbmdCdWZmZXIoZ2wsIHtwaWNrZWRDb2xvcnMsIGxheWVyc30pIHtcbiAgY29uc3QgdW5pcXVlQ29sb3JzID0gbmV3IE1hcCgpO1xuXG4gIC8vIFRyYXZlcnNlIGFsbCBwaXhlbHMgaW4gcGlja2luZyByZXN1bHRzIGFuZCBnZXQgdW5pcXVlIGNvbG9yc1xuICBpZiAocGlja2VkQ29sb3JzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaWNrZWRDb2xvcnMubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgIC8vIERlY29kZSBwaWNrZWQgbGF5ZXIgZnJvbSBjb2xvclxuICAgICAgY29uc3QgcGlja2VkTGF5ZXJJbmRleCA9IHBpY2tlZENvbG9yc1tpICsgM10gLSAxO1xuXG4gICAgICBpZiAocGlja2VkTGF5ZXJJbmRleCA+PSAwKSB7XG4gICAgICAgIGNvbnN0IHBpY2tlZENvbG9yID0gcGlja2VkQ29sb3JzLnNsaWNlKGksIGkgKyA0KTtcbiAgICAgICAgY29uc3QgY29sb3JLZXkgPSBwaWNrZWRDb2xvci5qb2luKCcsJyk7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICBpZiAoIXVuaXF1ZUNvbG9ycy5oYXMoY29sb3JLZXkpKSB7XG4gICAgICAgICAgY29uc3QgcGlja2VkTGF5ZXIgPSBsYXllcnNbcGlja2VkTGF5ZXJJbmRleF07XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgICAgaWYgKHBpY2tlZExheWVyKSB7XG4gICAgICAgICAgICB1bmlxdWVDb2xvcnMuc2V0KGNvbG9yS2V5LCB7XG4gICAgICAgICAgICAgIHBpY2tlZENvbG9yLFxuICAgICAgICAgICAgICBwaWNrZWRMYXllcixcbiAgICAgICAgICAgICAgcGlja2VkT2JqZWN0SW5kZXg6IHBpY2tlZExheWVyLmRlY29kZVBpY2tpbmdDb2xvcihwaWNrZWRDb2xvcilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2cuZXJyb3IoJ1BpY2tlZCBub24tZXhpc3RlbnQgbGF5ZXIuIElzIHBpY2tpbmcgYnVmZmVyIGNvcnJ1cHQ/Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEFycmF5LmZyb20odW5pcXVlQ29sb3JzLnZhbHVlcygpKTtcbn1cblxuLy8gV2FsayB1cCB0aGUgbGF5ZXIgY29tcG9zaXRlIGNoYWluIHRvIHBvcHVsYXRlIHRoZSBpbmZvIG9iamVjdFxuZnVuY3Rpb24gZ2V0TGF5ZXJQaWNraW5nSW5mbyh7bGF5ZXIsIGluZm8sIG1vZGV9KSB7XG4gIHdoaWxlIChsYXllciAmJiBpbmZvKSB7XG4gICAgLy8gRm9yIGEgY29tcG9zaXRlIGxheWVyLCBzb3VyY2VMYXllciB3aWxsIHBvaW50IHRvIHRoZSBzdWJsYXllclxuICAgIC8vIHdoZXJlIHRoZSBldmVudCBvcmlnaW5hdGVzIGZyb20uXG4gICAgLy8gSXQgcHJvdmlkZXMgYWRkaXRpb25hbCBjb250ZXh0IGZvciB0aGUgY29tcG9zaXRlIGxheWVyJ3NcbiAgICAvLyBnZXRQaWNraW5nSW5mbygpIG1ldGhvZCB0byBwb3B1bGF0ZSB0aGUgaW5mbyBvYmplY3RcbiAgICBjb25zdCBzb3VyY2VMYXllciA9IGluZm8ubGF5ZXIgfHwgbGF5ZXI7XG4gICAgaW5mby5sYXllciA9IGxheWVyO1xuICAgIC8vIGxheWVyLnBpY2tMYXllcigpIGZ1bmN0aW9uIHJlcXVpcmVzIGEgbm9uLW51bGwgYGBgbGF5ZXIuc3RhdGVgYGBcbiAgICAvLyBvYmplY3QgdG8gZnVudGlvbiBwcm9wZXJseS4gU28gdGhlIGxheWVyIHJlZmVyZWNlZCBoZXJlXG4gICAgLy8gbXVzdCBiZSB0aGUgXCJjdXJyZW50XCIgbGF5ZXIsIG5vdCBhbiBcIm91dC1kYXRlZFwiIC8gXCJpbnZhbGlkYXRlZFwiIGxheWVyXG4gICAgaW5mbyA9IGxheWVyLnBpY2tMYXllcih7aW5mbywgbW9kZSwgc291cmNlTGF5ZXJ9KTtcbiAgICBsYXllciA9IGxheWVyLnBhcmVudExheWVyO1xuICB9XG4gIHJldHVybiBpbmZvO1xufVxuIl19