'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

var _layerManager = require('../lib/layer-manager');

var _layerManager2 = _interopRequireDefault(_layerManager);

var _effectManager = require('../experimental/lib/effect-manager');

var _effectManager2 = _interopRequireDefault(_effectManager);

var _effect = require('../experimental/lib/effect');

var _effect2 = _interopRequireDefault(_effect);

var _webMercatorViewport = require('../viewports/web-mercator-viewport');

var _webMercatorViewport2 = _interopRequireDefault(_webMercatorViewport);

var _mjolnir = require('mjolnir.js');

var _luma = require('luma.gl');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global document */

function noop() {}

var propTypes = {
  id: _propTypes2.default.string,
  width: _propTypes2.default.number.isRequired,
  height: _propTypes2.default.number.isRequired,
  layers: _propTypes2.default.array, // Array can contain falsy values
  viewports: _propTypes2.default.array, // Array can contain falsy values
  effects: _propTypes2.default.arrayOf(_propTypes2.default.instanceOf(_effect2.default)),
  layerFilter: _propTypes2.default.func,
  glOptions: _propTypes2.default.object,
  gl: _propTypes2.default.object,
  pickingRadius: _propTypes2.default.number,
  onWebGLInitialized: _propTypes2.default.func,
  onBeforeRender: _propTypes2.default.func,
  onAfterRender: _propTypes2.default.func,
  onLayerClick: _propTypes2.default.func,
  onLayerHover: _propTypes2.default.func,
  useDevicePixels: _propTypes2.default.bool,

  // Debug settings
  debug: _propTypes2.default.bool,
  drawPickingColors: _propTypes2.default.bool
};

var defaultProps = {
  id: 'deckgl-overlay',
  pickingRadius: 0,
  layerFilter: null,
  glOptions: {},
  gl: null,
  layers: [],
  effects: [],
  onWebGLInitialized: noop,
  onBeforeRender: noop,
  onAfterRender: noop,
  onLayerClick: null,
  onLayerHover: null,
  useDevicePixels: true,

  debug: false,
  drawPickingColors: false
};

// TODO - should this class be joined with `LayerManager`?

var DeckGLJS = function () {
  function DeckGLJS(props) {
    var _this = this;

    _classCallCheck(this, DeckGLJS);

    props = Object.assign({}, defaultProps, props);

    this.state = {};
    this.needsRedraw = true;
    this.layerManager = null;
    this.effectManager = null;
    this.viewports = [];

    // Bind methods
    this._onRendererInitialized = this._onRendererInitialized.bind(this);
    this._onRenderFrame = this._onRenderFrame.bind(this);

    this.canvas = this._createCanvas(props);

    var _props = props,
        width = _props.width,
        height = _props.height,
        gl = _props.gl,
        glOptions = _props.glOptions,
        debug = _props.debug,
        useDevicePixels = _props.useDevicePixels;


    this.animationLoop = new _luma.AnimationLoop({
      width: width,
      height: height,
      useDevicePixels: useDevicePixels,
      onCreateContext: function onCreateContext(opts) {
        return gl || (0, _luma.createGLContext)(Object.assign({}, glOptions, { canvas: _this.canvas, debug: debug }));
      },
      onInitialize: this._onRendererInitialized,
      onRender: this._onRenderFrame,
      onBeforeRender: props.onBeforeRender,
      onAfterRender: props.onAfterRender
    });

    this.animationLoop.start();

    this.setProps(props);
  }

  _createClass(DeckGLJS, [{
    key: 'setProps',
    value: function setProps(props) {
      props = Object.assign({}, this.props, props);
      this.props = props;

      if (!this.layerManager) {
        return;
      }

      var _props2 = props,
          layers = _props2.layers,
          pickingRadius = _props2.pickingRadius,
          onLayerClick = _props2.onLayerClick,
          onLayerHover = _props2.onLayerHover,
          useDevicePixels = _props2.useDevicePixels,
          drawPickingColors = _props2.drawPickingColors,
          layerFilter = _props2.layerFilter;

      // Update viewports (creating one if not supplied)

      var viewports = props.viewports || props.viewport;
      if (!viewports) {
        var _props3 = props,
            width = _props3.width,
            height = _props3.height,
            latitude = _props3.latitude,
            longitude = _props3.longitude,
            zoom = _props3.zoom,
            pitch = _props3.pitch,
            bearing = _props3.bearing;

        viewports = [new _webMercatorViewport2.default({ width: width, height: height, latitude: latitude, longitude: longitude, zoom: zoom, pitch: pitch, bearing: bearing })];
      }

      // If more parameters need to be updated on layerManager add them to this method.
      this.layerManager.setParameters({
        layers: layers,
        viewports: viewports,
        useDevicePixels: useDevicePixels,
        drawPickingColors: drawPickingColors,
        layerFilter: layerFilter,
        pickingRadius: pickingRadius,
        onLayerClick: onLayerClick,
        onLayerHover: onLayerHover
      });

      // TODO - unify setParameters/setOptions/setProps etc naming.
      this.animationLoop.setViewParameters({ useDevicePixels: useDevicePixels });
    }
  }, {
    key: 'finalize',
    value: function finalize() {
      this.animationLoop.stop();
      this.animationLoop = null;

      if (this.layerManager) {
        this.layerManager.finalize();
        this.layerManager = null;
      }
    }

    // Public API

  }, {
    key: 'pickObject',
    value: function pickObject(_ref) {
      var x = _ref.x,
          y = _ref.y,
          _ref$radius = _ref.radius,
          radius = _ref$radius === undefined ? 0 : _ref$radius,
          _ref$layerIds = _ref.layerIds,
          layerIds = _ref$layerIds === undefined ? null : _ref$layerIds;

      var selectedInfos = this.layerManager.pickObject({ x: x, y: y, radius: radius, layerIds: layerIds, mode: 'query' });
      return selectedInfos.length ? selectedInfos[0] : null;
    }
  }, {
    key: 'pickObjects',
    value: function pickObjects(_ref2) {
      var x = _ref2.x,
          y = _ref2.y,
          _ref2$width = _ref2.width,
          width = _ref2$width === undefined ? 1 : _ref2$width,
          _ref2$height = _ref2.height,
          height = _ref2$height === undefined ? 1 : _ref2$height,
          _ref2$layerIds = _ref2.layerIds,
          layerIds = _ref2$layerIds === undefined ? null : _ref2$layerIds;

      return this.layerManager.pickObjects({ x: x, y: y, width: width, height: height, layerIds: layerIds });
    }
  }, {
    key: 'getViewports',
    value: function getViewports() {
      return this.layerManager ? this.layerManager.getViewports() : [];
    }

    // Private Methods

  }, {
    key: '_createCanvas',
    value: function _createCanvas(props) {
      if (props.canvas) {
        return props.canvas;
      }

      var id = props.id,
          width = props.width,
          height = props.height,
          style = props.style;

      var canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.width = width;
      canvas.height = height;
      canvas.style = style;

      var parent = props.parent || document.body;
      parent.appendChild(canvas);

      return canvas;
    }

    // Callbacks

  }, {
    key: '_onRendererInitialized',
    value: function _onRendererInitialized(_ref3) {
      var gl = _ref3.gl,
          canvas = _ref3.canvas;

      (0, _luma.setParameters)(gl, {
        blend: true,
        blendFunc: [_luma.GL.SRC_ALPHA, _luma.GL.ONE_MINUS_SRC_ALPHA, _luma.GL.ONE, _luma.GL.ONE_MINUS_SRC_ALPHA],
        polygonOffsetFill: true,
        depthTest: true,
        depthFunc: _luma.GL.LEQUAL
      });

      this.props.onWebGLInitialized(gl);

      // Note: avoid React setState due GL animation loop / setState timing issue
      this.layerManager = new _layerManager2.default(gl, {
        eventManager: new _mjolnir.EventManager(canvas)
      });

      this.effectManager = new _effectManager2.default({ gl: gl, layerManager: this.layerManager });

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.props.effects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var effect = _step.value;

          this.effectManager.addEffect(effect);
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

      this.setProps(this.props);
    }
  }, {
    key: '_onRenderFrame',
    value: function _onRenderFrame(_ref4) {
      var gl = _ref4.gl;

      var redrawReason = this.layerManager.needsRedraw({ clearRedrawFlags: true });
      if (!redrawReason) {
        return;
      }

      this.props.onBeforeRender({ gl: gl }); // TODO - should be called by AnimationLoop
      this.layerManager.drawLayers({
        pass: 'screen',
        redrawReason: redrawReason,
        // Helps debug layer picking, especially in framebuffer powered layers
        drawPickingColors: this.props.drawPickingColors
      });
      this.props.onAfterRender({ gl: gl }); // TODO - should be called by AnimationLoop
    }
  }]);

  return DeckGLJS;
}();

exports.default = DeckGLJS;


DeckGLJS.propTypes = propTypes;
DeckGLJS.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3B1cmUtanMvZGVjay1qcy5qcyJdLCJuYW1lcyI6WyJub29wIiwicHJvcFR5cGVzIiwiaWQiLCJzdHJpbmciLCJ3aWR0aCIsIm51bWJlciIsImlzUmVxdWlyZWQiLCJoZWlnaHQiLCJsYXllcnMiLCJhcnJheSIsInZpZXdwb3J0cyIsImVmZmVjdHMiLCJhcnJheU9mIiwiaW5zdGFuY2VPZiIsImxheWVyRmlsdGVyIiwiZnVuYyIsImdsT3B0aW9ucyIsIm9iamVjdCIsImdsIiwicGlja2luZ1JhZGl1cyIsIm9uV2ViR0xJbml0aWFsaXplZCIsIm9uQmVmb3JlUmVuZGVyIiwib25BZnRlclJlbmRlciIsIm9uTGF5ZXJDbGljayIsIm9uTGF5ZXJIb3ZlciIsInVzZURldmljZVBpeGVscyIsImJvb2wiLCJkZWJ1ZyIsImRyYXdQaWNraW5nQ29sb3JzIiwiZGVmYXVsdFByb3BzIiwiRGVja0dMSlMiLCJwcm9wcyIsIk9iamVjdCIsImFzc2lnbiIsInN0YXRlIiwibmVlZHNSZWRyYXciLCJsYXllck1hbmFnZXIiLCJlZmZlY3RNYW5hZ2VyIiwiX29uUmVuZGVyZXJJbml0aWFsaXplZCIsImJpbmQiLCJfb25SZW5kZXJGcmFtZSIsImNhbnZhcyIsIl9jcmVhdGVDYW52YXMiLCJhbmltYXRpb25Mb29wIiwib25DcmVhdGVDb250ZXh0Iiwib25Jbml0aWFsaXplIiwib25SZW5kZXIiLCJzdGFydCIsInNldFByb3BzIiwidmlld3BvcnQiLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInpvb20iLCJwaXRjaCIsImJlYXJpbmciLCJzZXRQYXJhbWV0ZXJzIiwic2V0Vmlld1BhcmFtZXRlcnMiLCJzdG9wIiwiZmluYWxpemUiLCJ4IiwieSIsInJhZGl1cyIsImxheWVySWRzIiwic2VsZWN0ZWRJbmZvcyIsInBpY2tPYmplY3QiLCJtb2RlIiwibGVuZ3RoIiwicGlja09iamVjdHMiLCJnZXRWaWV3cG9ydHMiLCJzdHlsZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInBhcmVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImJsZW5kIiwiYmxlbmRGdW5jIiwiU1JDX0FMUEhBIiwiT05FX01JTlVTX1NSQ19BTFBIQSIsIk9ORSIsInBvbHlnb25PZmZzZXRGaWxsIiwiZGVwdGhUZXN0IiwiZGVwdGhGdW5jIiwiTEVRVUFMIiwiZXZlbnRNYW5hZ2VyIiwiZWZmZWN0IiwiYWRkRWZmZWN0IiwicmVkcmF3UmVhc29uIiwiY2xlYXJSZWRyYXdGbGFncyIsImRyYXdMYXllcnMiLCJwYXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7cWpCQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBRUE7O0FBRUEsU0FBU0EsSUFBVCxHQUFnQixDQUFFOztBQUVsQixJQUFNQyxZQUFZO0FBQ2hCQyxNQUFJLG9CQUFVQyxNQURFO0FBRWhCQyxTQUFPLG9CQUFVQyxNQUFWLENBQWlCQyxVQUZSO0FBR2hCQyxVQUFRLG9CQUFVRixNQUFWLENBQWlCQyxVQUhUO0FBSWhCRSxVQUFRLG9CQUFVQyxLQUpGLEVBSVM7QUFDekJDLGFBQVcsb0JBQVVELEtBTEwsRUFLWTtBQUM1QkUsV0FBUyxvQkFBVUMsT0FBVixDQUFrQixvQkFBVUMsVUFBVixrQkFBbEIsQ0FOTztBQU9oQkMsZUFBYSxvQkFBVUMsSUFQUDtBQVFoQkMsYUFBVyxvQkFBVUMsTUFSTDtBQVNoQkMsTUFBSSxvQkFBVUQsTUFURTtBQVVoQkUsaUJBQWUsb0JBQVVkLE1BVlQ7QUFXaEJlLHNCQUFvQixvQkFBVUwsSUFYZDtBQVloQk0sa0JBQWdCLG9CQUFVTixJQVpWO0FBYWhCTyxpQkFBZSxvQkFBVVAsSUFiVDtBQWNoQlEsZ0JBQWMsb0JBQVVSLElBZFI7QUFlaEJTLGdCQUFjLG9CQUFVVCxJ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QkFBcUIsS0FBS0wsS0FBTCxDQUFXcEIsT0FBaEMsOEhBQXlDO0FBQUEsY0FBOUIwRSxNQUE4Qjs7QUFDdkMsZUFBS2hELGFBQUwsQ0FBbUJpRCxTQUFuQixDQUE2QkQsTUFBN0I7QUFDRDtBQXBCa0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFzQm5DLFdBQUtyQyxRQUFMLENBQWMsS0FBS2pCLEtBQW5CO0FBQ0Q7OzswQ0FFb0I7QUFBQSxVQUFMYixFQUFLLFNBQUxBLEVBQUs7O0FBQ25CLFVBQU1xRSxlQUFlLEtBQUtuRCxZQUFMLENBQWtCRCxXQUFsQixDQUE4QixFQUFDcUQsa0JBQWtCLElBQW5CLEVBQTlCLENBQXJCO0FBQ0EsVUFBSSxDQUFDRCxZQUFMLEVBQW1CO0FBQ2pCO0FBQ0Q7O0FBRUQsV0FBS3hELEtBQUwsQ0FBV1YsY0FBWCxDQUEwQixFQUFDSCxNQUFELEVBQTFCLEVBTm1CLENBTWM7QUFDakMsV0FBS2tCLFlBQUwsQ0FBa0JxRCxVQUFsQixDQUE2QjtBQUMzQkMsY0FBTSxRQURxQjtBQUUzQkgsa0NBRjJCO0FBRzNCO0FBQ0EzRCwyQkFBbUIsS0FBS0csS0FBTCxDQUFXSDtBQUpILE9BQTdCO0FBTUEsV0FBS0csS0FBTCxDQUFXVCxhQUFYLENBQXlCLEVBQUNKLE1BQUQsRUFBekIsRUFibUIsQ0FhYTtBQUNqQzs7Ozs7O2tCQXBLa0JZLFE7OztBQXVLckJBLFNBQVM3QixTQUFULEdBQXFCQSxTQUFyQjtBQUNBNkIsU0FBU0QsWUFBVCxHQUF3QkEsWUFBeEIiLCJmaWxlIjoiZGVjay1qcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgTGF5ZXJNYW5hZ2VyIGZyb20gJy4uL2xpYi9sYXllci1tYW5hZ2VyJztcbmltcG9ydCBFZmZlY3RNYW5hZ2VyIGZyb20gJy4uL2V4cGVyaW1lbnRhbC9saWIvZWZmZWN0LW1hbmFnZXInO1xuaW1wb3J0IEVmZmVjdCBmcm9tICcuLi9leHBlcmltZW50YWwvbGliL2VmZmVjdCc7XG5pbXBvcnQgV2ViTWVyY2F0b3JWaWV3cG9ydCBmcm9tICcuLi92aWV3cG9ydHMvd2ViLW1lcmNhdG9yLXZpZXdwb3J0JztcblxuaW1wb3J0IHtFdmVudE1hbmFnZXJ9IGZyb20gJ21qb2xuaXIuanMnO1xuaW1wb3J0IHtHTCwgQW5pbWF0aW9uTG9vcCwgY3JlYXRlR0xDb250ZXh0LCBzZXRQYXJhbWV0ZXJzfSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBwcm9wVHlwZXMgPSB7XG4gIGlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICB3aWR0aDogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICBoZWlnaHQ6IFByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgbGF5ZXJzOiBQcm9wVHlwZXMuYXJyYXksIC8vIEFycmF5IGNhbiBjb250YWluIGZhbHN5IHZhbHVlc1xuICB2aWV3cG9ydHM6IFByb3BUeXBlcy5hcnJheSwgLy8gQXJyYXkgY2FuIGNvbnRhaW4gZmFsc3kgdmFsdWVzXG4gIGVmZmVjdHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5pbnN0YW5jZU9mKEVmZmVjdCkpLFxuICBsYXllckZpbHRlcjogUHJvcFR5cGVzLmZ1bmMsXG4gIGdsT3B0aW9uczogUHJvcFR5cGVzLm9iamVjdCxcbiAgZ2w6IFByb3BUeXBlcy5vYmplY3QsXG4gIHBpY2tpbmdSYWRpdXM6IFByb3BUeXBlcy5udW1iZXIsXG4gIG9uV2ViR0xJbml0aWFsaXplZDogUHJvcFR5cGVzLmZ1bmMsXG4gIG9uQmVmb3JlUmVuZGVyOiBQcm9wVHlwZXMuZnVuYyxcbiAgb25BZnRlclJlbmRlcjogUHJvcFR5cGVzLmZ1bmMsXG4gIG9uTGF5ZXJDbGljazogUHJvcFR5cGVzLmZ1bmMsXG4gIG9uTGF5ZXJIb3ZlcjogUHJvcFR5cGVzLmZ1bmMsXG4gIHVzZURldmljZVBpeGVsczogUHJvcFR5cGVzLmJvb2wsXG5cbiAgLy8gRGVidWcgc2V0dGluZ3NcbiAgZGVidWc6IFByb3BUeXBlcy5ib29sLFxuICBkcmF3UGlja2luZ0NvbG9yczogUHJvcFR5cGVzLmJvb2xcbn07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgaWQ6ICdkZWNrZ2wtb3ZlcmxheScsXG4gIHBpY2tpbmdSYWRpdXM6IDAsXG4gIGxheWVyRmlsdGVyOiBudWxsLFxuICBnbE9wdGlvbnM6IHt9LFxuICBnbDogbnVsbCxcbiAgbGF5ZXJzOiBbXSxcbiAgZWZmZWN0czogW10sXG4gIG9uV2ViR0xJbml0aWFsaXplZDogbm9vcCxcbiAgb25CZWZvcmVSZW5kZXI6IG5vb3AsXG4gIG9uQWZ0ZXJSZW5kZXI6IG5vb3AsXG4gIG9uTGF5ZXJDbGljazogbnVsbCxcbiAgb25MYXllckhvdmVyOiBudWxsLFxuICB1c2VEZXZpY2VQaXhlbHM6IHRydWUsXG5cbiAgZGVidWc6IGZhbHNlLFxuICBkcmF3UGlja2luZ0NvbG9yczogZmFsc2Vcbn07XG5cbi8vIFRPRE8gLSBzaG91bGQgdGhpcyBjbGFzcyBiZSBqb2luZWQgd2l0aCBgTGF5ZXJNYW5hZ2VyYD9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlY2tHTEpTIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcywgcHJvcHMpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgIHRoaXMubGF5ZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmVmZmVjdE1hbmFnZXIgPSBudWxsO1xuICAgIHRoaXMudmlld3BvcnRzID0gW107XG5cbiAgICAvLyBCaW5kIG1ldGhvZHNcbiAgICB0aGlzLl9vblJlbmRlcmVySW5pdGlhbGl6ZWQgPSB0aGlzLl9vblJlbmRlcmVySW5pdGlhbGl6ZWQuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9vblJlbmRlckZyYW1lID0gdGhpcy5fb25SZW5kZXJGcmFtZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5jYW52YXMgPSB0aGlzLl9jcmVhdGVDYW52YXMocHJvcHMpO1xuXG4gICAgY29uc3Qge3dpZHRoLCBoZWlnaHQsIGdsLCBnbE9wdGlvbnMsIGRlYnVnLCB1c2VEZXZpY2VQaXhlbHN9ID0gcHJvcHM7XG5cbiAgICB0aGlzLmFuaW1hdGlvbkxvb3AgPSBuZXcgQW5pbWF0aW9uTG9vcCh7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHVzZURldmljZVBpeGVscyxcbiAgICAgIG9uQ3JlYXRlQ29udGV4dDogb3B0cyA9PlxuICAgICAgICBnbCB8fCBjcmVhdGVHTENvbnRleHQoT2JqZWN0LmFzc2lnbih7fSwgZ2xPcHRpb25zLCB7Y2FudmFzOiB0aGlzLmNhbnZhcywgZGVidWd9KSksXG4gICAgICBvbkluaXRpYWxpemU6IHRoaXMuX29uUmVuZGVyZXJJbml0aWFsaXplZCxcbiAgICAgIG9uUmVuZGVyOiB0aGlzLl9vblJlbmRlckZyYW1lLFxuICAgICAgb25CZWZvcmVSZW5kZXI6IHByb3BzLm9uQmVmb3JlUmVuZGVyLFxuICAgICAgb25BZnRlclJlbmRlcjogcHJvcHMub25BZnRlclJlbmRlclxuICAgIH0pO1xuXG4gICAgdGhpcy5hbmltYXRpb25Mb29wLnN0YXJ0KCk7XG5cbiAgICB0aGlzLnNldFByb3BzKHByb3BzKTtcbiAgfVxuXG4gIHNldFByb3BzKHByb3BzKSB7XG4gICAgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLCBwcm9wcyk7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuXG4gICAgaWYgKCF0aGlzLmxheWVyTWFuYWdlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIGxheWVycyxcbiAgICAgIHBpY2tpbmdSYWRpdXMsXG4gICAgICBvbkxheWVyQ2xpY2ssXG4gICAgICBvbkxheWVySG92ZXIsXG4gICAgICB1c2VEZXZpY2VQaXhlbHMsXG4gICAgICBkcmF3UGlja2luZ0NvbG9ycyxcbiAgICAgIGxheWVyRmlsdGVyXG4gICAgfSA9IHByb3BzO1xuXG4gICAgLy8gVXBkYXRlIHZpZXdwb3J0cyAoY3JlYXRpbmcgb25lIGlmIG5vdCBzdXBwbGllZClcbiAgICBsZXQgdmlld3BvcnRzID0gcHJvcHMudmlld3BvcnRzIHx8IHByb3BzLnZpZXdwb3J0O1xuICAgIGlmICghdmlld3BvcnRzKSB7XG4gICAgICBjb25zdCB7d2lkdGgsIGhlaWdodCwgbGF0aXR1ZGUsIGxvbmdpdHVkZSwgem9vbSwgcGl0Y2gsIGJlYXJpbmd9ID0gcHJvcHM7XG4gICAgICB2aWV3cG9ydHMgPSBbXG4gICAgICAgIG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHt3aWR0aCwgaGVpZ2h0LCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCB6b29tLCBwaXRjaCwgYmVhcmluZ30pXG4gICAgICBdO1xuICAgIH1cblxuICAgIC8vIElmIG1vcmUgcGFyYW1ldGVycyBuZWVkIHRvIGJlIHVwZGF0ZWQgb24gbGF5ZXJNYW5hZ2VyIGFkZCB0aGVtIHRvIHRoaXMgbWV0aG9kLlxuICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnNldFBhcmFtZXRlcnMoe1xuICAgICAgbGF5ZXJzLFxuICAgICAgdmlld3BvcnRzLFxuICAgICAgdXNlRGV2aWNlUGl4ZWxzLFxuICAgICAgZHJhd1BpY2tpbmdDb2xvcnMsXG4gICAgICBsYXllckZpbHRlcixcbiAgICAgIHBpY2tpbmdSYWRpdXMsXG4gICAgICBvbkxheWVyQ2xpY2ssXG4gICAgICBvbkxheWVySG92ZXJcbiAgICB9KTtcblxuICAgIC8vIFRPRE8gLSB1bmlmeSBzZXRQYXJhbWV0ZXJzL3NldE9wdGlvbnMvc2V0UHJvcHMgZXRjIG5hbWluZy5cbiAgICB0aGlzLmFuaW1hdGlvbkxvb3Auc2V0Vmlld1BhcmFtZXRlcnMoe3VzZURldmljZVBpeGVsc30pO1xuICB9XG5cbiAgZmluYWxpemUoKSB7XG4gICAgdGhpcy5hbmltYXRpb25Mb29wLnN0b3AoKTtcbiAgICB0aGlzLmFuaW1hdGlvbkxvb3AgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMubGF5ZXJNYW5hZ2VyKSB7XG4gICAgICB0aGlzLmxheWVyTWFuYWdlci5maW5hbGl6ZSgpO1xuICAgICAgdGhpcy5sYXllck1hbmFnZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1YmxpYyBBUElcblxuICBwaWNrT2JqZWN0KHt4LCB5LCByYWRpdXMgPSAwLCBsYXllcklkcyA9IG51bGx9KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRJbmZvcyA9IHRoaXMubGF5ZXJNYW5hZ2VyLnBpY2tPYmplY3Qoe3gsIHksIHJhZGl1cywgbGF5ZXJJZHMsIG1vZGU6ICdxdWVyeSd9KTtcbiAgICByZXR1cm4gc2VsZWN0ZWRJbmZvcy5sZW5ndGggPyBzZWxlY3RlZEluZm9zWzBdIDogbnVsbDtcbiAgfVxuXG4gIHBpY2tPYmplY3RzKHt4LCB5LCB3aWR0aCA9IDEsIGhlaWdodCA9IDEsIGxheWVySWRzID0gbnVsbH0pIHtcbiAgICByZXR1cm4gdGhpcy5sYXllck1hbmFnZXIucGlja09iamVjdHMoe3gsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVySWRzfSk7XG4gIH1cblxuICBnZXRWaWV3cG9ydHMoKSB7XG4gICAgcmV0dXJuIHRoaXMubGF5ZXJNYW5hZ2VyID8gdGhpcy5sYXllck1hbmFnZXIuZ2V0Vmlld3BvcnRzKCkgOiBbXTtcbiAgfVxuXG4gIC8vIFByaXZhdGUgTWV0aG9kc1xuXG4gIF9jcmVhdGVDYW52YXMocHJvcHMpIHtcbiAgICBpZiAocHJvcHMuY2FudmFzKSB7XG4gICAgICByZXR1cm4gcHJvcHMuY2FudmFzO1xuICAgIH1cblxuICAgIGNvbnN0IHtpZCwgd2lkdGgsIGhlaWdodCwgc3R5bGV9ID0gcHJvcHM7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLmlkID0gaWQ7XG4gICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICBjYW52YXMuc3R5bGUgPSBzdHlsZTtcblxuICAgIGNvbnN0IHBhcmVudCA9IHByb3BzLnBhcmVudCB8fCBkb2N1bWVudC5ib2R5O1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gICAgcmV0dXJuIGNhbnZhcztcbiAgfVxuXG4gIC8vIENhbGxiYWNrc1xuXG4gIF9vblJlbmRlcmVySW5pdGlhbGl6ZWQoe2dsLCBjYW52YXN9KSB7XG4gICAgc2V0UGFyYW1ldGVycyhnbCwge1xuICAgICAgYmxlbmQ6IHRydWUsXG4gICAgICBibGVuZEZ1bmM6IFtHTC5TUkNfQUxQSEEsIEdMLk9ORV9NSU5VU19TUkNfQUxQSEEsIEdMLk9ORSwgR0wuT05FX01JTlVTX1NSQ19BTFBIQV0sXG4gICAgICBwb2x5Z29uT2Zmc2V0RmlsbDogdHJ1ZSxcbiAgICAgIGRlcHRoVGVzdDogdHJ1ZSxcbiAgICAgIGRlcHRoRnVuYzogR0wuTEVRVUFMXG4gICAgfSk7XG5cbiAgICB0aGlzLnByb3BzLm9uV2ViR0xJbml0aWFsaXplZChnbCk7XG5cbiAgICAvLyBOb3RlOiBhdm9pZCBSZWFjdCBzZXRTdGF0ZSBkdWUgR0wgYW5pbWF0aW9uIGxvb3AgLyBzZXRTdGF0ZSB0aW1pbmcgaXNzdWVcbiAgICB0aGlzLmxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoZ2wsIHtcbiAgICAgIGV2ZW50TWFuYWdlcjogbmV3IEV2ZW50TWFuYWdlcihjYW52YXMpXG4gICAgfSk7XG5cbiAgICB0aGlzLmVmZmVjdE1hbmFnZXIgPSBuZXcgRWZmZWN0TWFuYWdlcih7Z2wsIGxheWVyTWFuYWdlcjogdGhpcy5sYXllck1hbmFnZXJ9KTtcblxuICAgIGZvciAoY29uc3QgZWZmZWN0IG9mIHRoaXMucHJvcHMuZWZmZWN0cykge1xuICAgICAgdGhpcy5lZmZlY3RNYW5hZ2VyLmFkZEVmZmVjdChlZmZlY3QpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0UHJvcHModGhpcy5wcm9wcyk7XG4gIH1cblxuICBfb25SZW5kZXJGcmFtZSh7Z2x9KSB7XG4gICAgY29uc3QgcmVkcmF3UmVhc29uID0gdGhpcy5sYXllck1hbmFnZXIubmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3M6IHRydWV9KTtcbiAgICBpZiAoIXJlZHJhd1JlYXNvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucHJvcHMub25CZWZvcmVSZW5kZXIoe2dsfSk7IC8vIFRPRE8gLSBzaG91bGQgYmUgY2FsbGVkIGJ5IEFuaW1hdGlvbkxvb3BcbiAgICB0aGlzLmxheWVyTWFuYWdlci5kcmF3TGF5ZXJzKHtcbiAgICAgIHBhc3M6ICdzY3JlZW4nLFxuICAgICAgcmVkcmF3UmVhc29uLFxuICAgICAgLy8gSGVscHMgZGVidWcgbGF5ZXIgcGlja2luZywgZXNwZWNpYWxseSBpbiBmcmFtZWJ1ZmZlciBwb3dlcmVkIGxheWVyc1xuICAgICAgZHJhd1BpY2tpbmdDb2xvcnM6IHRoaXMucHJvcHMuZHJhd1BpY2tpbmdDb2xvcnNcbiAgICB9KTtcbiAgICB0aGlzLnByb3BzLm9uQWZ0ZXJSZW5kZXIoe2dsfSk7IC8vIFRPRE8gLSBzaG91bGQgYmUgY2FsbGVkIGJ5IEFuaW1hdGlvbkxvb3BcbiAgfVxufVxuXG5EZWNrR0xKUy5wcm9wVHlwZXMgPSBwcm9wVHlwZXM7XG5EZWNrR0xKUy5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=