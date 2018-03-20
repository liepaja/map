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

// TODO - remove, just for dummy initialization


var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _luma = require('luma.gl');

var _seer = require('seer');

var _seer2 = _interopRequireDefault(_seer);

var _layer = require('./layer');

var _layer2 = _interopRequireDefault(_layer);

var _drawLayers2 = require('./draw-layers');

var _pickLayers = require('./pick-layers');

var _constants = require('./constants');

var _viewport = require('../viewports/viewport');

var _viewport2 = _interopRequireDefault(_viewport);

var _webMercatorViewport = require('../viewports/web-mercator-viewport');

var _webMercatorViewport2 = _interopRequireDefault(_webMercatorViewport);

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _flatten = require('../utils/flatten');

var _seerIntegration = require('./seer-integration');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LOG_PRIORITY_LIFECYCLE = 2;
var LOG_PRIORITY_LIFECYCLE_MINOR = 4;

var initialContext = {
  uniforms: {},
  viewports: [],
  viewport: null,
  layerFilter: null,
  viewportChanged: true,
  pickingFBO: null,
  useDevicePixels: true,
  lastPickedInfo: {
    index: -1,
    layerId: null
  }
};

var layerName = function layerName(layer) {
  return layer instanceof _layer2.default ? '' + layer : !layer ? 'null' : 'invalid';
};

var LayerManager = function () {
  // eslint-disable-next-line
  function LayerManager(gl) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        eventManager = _ref.eventManager;

    _classCallCheck(this, LayerManager);

    // Currently deck.gl expects the DeckGL.layers array to be different
    // whenever React rerenders. If the same layers array is used, the
    // LayerManager's diffing algorithm will generate a fatal error and
    // break the rendering.

    // `this.lastRenderedLayers` stores the UNFILTERED layers sent
    // down to LayerManager, so that `layers` reference can be compared.
    // If it's the same across two React render calls, the diffing logic
    // will be skipped.
    this.lastRenderedLayers = [];
    this.prevLayers = [];
    this.layers = [];

    this.oldContext = {};
    this.context = Object.assign({}, initialContext, {
      gl: gl,
      // Enabling luma.gl Program caching using private API (_cachePrograms)
      shaderCache: new _luma.ShaderCache({ gl: gl, _cachePrograms: true })
    });

    // List of view descriptors, gets re-evaluated when width/height changes
    this.width = 100;
    this.height = 100;
    this.viewDescriptors = [];
    this.viewDescriptorsChanged = true;
    this.viewports = []; // Generated viewports
    this._needsRedraw = 'Initial render';

    // Event handling
    this._pickingRadius = 0;

    this._eventManager = null;
    this._onLayerClick = null;
    this._onLayerHover = null;
    this._onClick = this._onClick.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._pickAndCallback = this._pickAndCallback.bind(this);

    // Seer integration
    this._initSeer = this._initSeer.bind(this);
    this._editSeer = this._editSeer.bind(this);
    (0, _seerIntegration.seerInitListener)(this._initSeer);
    (0, _seerIntegration.layerEditListener)(this._editSeer);

    Object.seal(this);

    if (eventManager) {
      this._initEventHandling(eventManager);
    }

    // Init with dummy viewport
    this.setViewports([new _webMercatorViewport2.default({ width: 1, height: 1, latitude: 0, longitude: 0, zoom: 1 })]);
  }

  /**
   * Method to call when the layer manager is not needed anymore.
   *
   * Currently used in the <DeckGL> componentWillUnmount lifecycle to unbind Seer listeners.
   */


  _createClass(LayerManager, [{
    key: 'finalize',
    value: function finalize() {
      _seer2.default.removeListener(this._initSeer);
      _seer2.default.removeListener(this._editSeer);
    }
  }, {
    key: 'needsRedraw',
    value: function needsRedraw() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$clearRedrawFlag = _ref2.clearRedrawFlags,
          clearRedrawFlags = _ref2$clearRedrawFlag === undefined ? true : _ref2$clearRedrawFlag;

      return this._checkIfNeedsRedraw(clearRedrawFlags);
    }

    // Normally not called by app

  }, {
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw(reason) {
      this._needsRedraw = this._needsRedraw || reason;
    }

    // Gets an (optionally) filtered list of layers

  }, {
    key: 'getLayers',
    value: function getLayers() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref3$layerIds = _ref3.layerIds,
          layerIds = _ref3$layerIds === undefined ? null : _ref3$layerIds;

      // Filtering by layerId compares beginning of strings, so that sublayers will be included
      // Dependes on the convention of adding suffixes to the parent's layer name
      return layerIds ? this.layers.filter(function (layer) {
        return layerIds.find(function (layerId) {
          return layer.id.indexOf(layerId) === 0;
        });
      }) : this.layers;
    }

    // Get a set of viewports for a given width and height
    // TODO - Intention is for deck.gl to autodeduce width and height and drop the need for props

  }, {
    key: 'getViewports',
    value: function getViewports() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          width = _ref4.width,
          height = _ref4.height;

      if (width !== this.width || height !== this.height || this.viewDescriptorsChanged) {
        this._rebuildViewportsFromViews({ viewDescriptors: this.viewDescriptors, width: width, height: height });
        this.width = width;
        this.height = height;
      }
      return this.viewports;
    }

    /**
     * Set parameters needed for layer rendering and picking.
     * Parameters are to be passed as a single object, with the following values:
     * @param {Boolean} useDevicePixels
     */

  }, {
    key: 'setParameters',
    value: function setParameters(parameters) {
      if ('eventManager' in parameters) {
        this._initEventHandling(parameters.eventManager);
      }

      if ('pickingRadius' in parameters || 'onLayerClick' in parameters || 'onLayerHover' in parameters) {
        this._setEventHandlingParameters(parameters);
      }

      // TODO - For now we set layers before viewports to preservenchangeFlags
      if ('layers' in parameters) {
        this.setLayers(parameters.layers);
      }

      if ('viewports' in parameters) {
        this.setViewports(parameters.viewports);
      }

      if ('layerFilter' in parameters) {
        this.context.layerFilter = parameters.layerFilter;
        if (this.context.layerFilter !== parameters.layerFilter) {
          this.setNeedsRedraw('layerFilter changed');
        }
      }

      if ('drawPickingColors' in parameters) {
        if (this.context.drawPickingColors !== parameters.drawPickingColors) {
          this.setNeedsRedraw('drawPickingColors changed');
        }
      }

      Object.assign(this.context, parameters);
    }

    // Update the view descriptor list and set change flag if needed

  }, {
    key: 'setViewports',
    value: function setViewports(viewports) {
      // Ensure viewports are wrapped in descriptors
      var viewDescriptors = (0, _flatten.flatten)(viewports, { filter: Boolean }).map(function (viewport) {
        return viewport instanceof _viewport2.default ? { viewport: viewport } : viewport;
      });

      this.viewDescriptorsChanged = this.viewDescriptorsChanged || this._diffViews(viewDescriptors, this.viewDescriptors);

      // Try to not actually rebuild the viewports until `getViewports` is called
      if (this.viewDescriptorsChanged) {
        this.viewDescriptors = viewDescriptors;
        this._rebuildViewportsFromViews({ viewDescriptors: this.viewDescriptors });
        this.viewDescriptorsChanged = false;
      }
    }

    // Supply a new layer list, initiating sublayer generation and layer matching

  }, {
    key: 'setLayers',
    value: function setLayers(newLayers) {
      (0, _assert2.default)(this.context.viewport, 'LayerManager.updateLayers: viewport not set');

      // TODO - something is generating state updates that cause rerender of the same
      if (newLayers === this.lastRenderedLayers) {
        _log2.default.log(3, 'Ignoring layer update due to layer array not changed');
        return this;
      }
      this.lastRenderedLayers = newLayers;

      newLayers = (0, _flatten.flatten)(newLayers, { filter: Boolean });

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = newLayers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var layer = _step.value;

          layer.context = this.context;
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

      this.prevLayers = this.layers;

      var _updateLayers2 = this._updateLayers({
        oldLayers: this.prevLayers,
        newLayers: newLayers
      }),
          error = _updateLayers2.error,
          generatedLayers = _updateLayers2.generatedLayers;

      this.layers = generatedLayers;
      // Throw first error found, if any
      if (error) {
        throw error;
      }
      return this;
    }
  }, {
    key: 'drawLayers',
    value: function drawLayers() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref5$pass = _ref5.pass,
          pass = _ref5$pass === undefined ? 'render to screen' : _ref5$pass,
          _ref5$redrawReason = _ref5.redrawReason,
          redrawReason = _ref5$redrawReason === undefined ? 'unknown reason' : _ref5$redrawReason;

      var _context = this.context,
          gl = _context.gl,
          useDevicePixels = _context.useDevicePixels,
          drawPickingColors = _context.drawPickingColors;

      // render this viewport

      (0, _drawLayers2.drawLayers)(gl, {
        layers: this.layers,
        viewports: this.getViewports(),
        onViewportActive: this._activateViewport.bind(this),
        useDevicePixels: useDevicePixels,
        drawPickingColors: drawPickingColors,
        pass: pass,
        layerFilter: this.context.layerFilter,
        redrawReason: redrawReason
      });
    }

    // Pick the closest info at given coordinate

  }, {
    key: 'pickObject',
    value: function pickObject(_ref6) {
      var x = _ref6.x,
          y = _ref6.y,
          mode = _ref6.mode,
          _ref6$radius = _ref6.radius,
          radius = _ref6$radius === undefined ? 0 : _ref6$radius,
          layerIds = _ref6.layerIds,
          layerFilter = _ref6.layerFilter;
      var _context2 = this.context,
          gl = _context2.gl,
          useDevicePixels = _context2.useDevicePixels;


      var layers = this.getLayers({ layerIds: layerIds });

      return (0, _pickLayers.pickObject)(gl, {
        // User params
        x: x,
        y: y,
        radius: radius,
        layers: layers,
        mode: mode,
        layerFilter: layerFilter,
        // Injected params
        viewports: this.getViewports(),
        onViewportActive: this._activateViewport.bind(this),
        pickingFBO: this._getPickingBuffer(),
        lastPickedInfo: this.context.lastPickedInfo,
        useDevicePixels: useDevicePixels
      });
    }

    // Get all unique infos within a bounding box

  }, {
    key: 'pickObjects',
    value: function pickObjects(_ref7) {
      var x = _ref7.x,
          y = _ref7.y,
          width = _ref7.width,
          height = _ref7.height,
          layerIds = _ref7.layerIds,
          layerFilter = _ref7.layerFilter;
      var _context3 = this.context,
          gl = _context3.gl,
          useDevicePixels = _context3.useDevicePixels;


      var layers = this.getLayers({ layerIds: layerIds });

      return (0, _pickLayers.pickVisibleObjects)(gl, {
        x: x,
        y: y,
        width: width,
        height: height,
        layers: layers,
        layerFilter: layerFilter,
        mode: 'pickObjects',
        // TODO - how does this interact with multiple viewports?
        viewport: this.context.viewport,
        viewports: this.getViewports(),
        onViewportActive: this._activateViewport.bind(this),
        pickingFBO: this._getPickingBuffer(),
        useDevicePixels: useDevicePixels
      });
    }

    //
    // DEPRECATED METHODS in V5
    //

  }, {
    key: 'updateLayers',
    value: function updateLayers(_ref8) {
      var newLayers = _ref8.newLayers;

      _log2.default.deprecated('updateLayers', 'setLayers');
      this.setLayers(newLayers);
    }
  }, {
    key: 'setViewport',
    value: function setViewport(viewport) {
      _log2.default.deprecated('setViewport', 'setViewports');
      this.setViewports([viewport]);
      return this;
    }

    //
    // PRIVATE METHODS
    //

  }, {
    key: '_checkIfNeedsRedraw',
    value: function _checkIfNeedsRedraw(clearRedrawFlags) {
      var redraw = this._needsRedraw;
      if (clearRedrawFlags) {
        this._needsRedraw = false;
      }

      // This layers list doesn't include sublayers, relying on composite layers
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.layers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var layer = _step2.value;

          // Call every layer to clear their flags
          var layerNeedsRedraw = layer.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
          redraw = redraw || layerNeedsRedraw;
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

      return redraw;
    }

    // Rebuilds viewports from descriptors towards a certain window size

  }, {
    key: '_rebuildViewportsFromViews',
    value: function _rebuildViewportsFromViews(_ref9) {
      var _this = this;

      var viewDescriptors = _ref9.viewDescriptors,
          width = _ref9.width,
          height = _ref9.height;

      var newViewports = viewDescriptors.map(function (viewDescriptor) {
        return (
          // If a `Viewport` instance was supplied, use it, otherwise build it
          viewDescriptor.viewport instanceof _viewport2.default ? viewDescriptor.viewport : _this._makeViewportFromViewDescriptor({ viewDescriptor: viewDescriptor, width: width, height: height })
        );
      });

      this.setNeedsRedraw('Viewport(s) changed');

      // Ensure one viewport is activated, layers may expect it
      // TODO - handle empty viewport list (using dummy viewport), or assert
      // const oldViewports = this.context.viewports;
      // if (viewportsChanged) {

      var viewport = newViewports[0];
      (0, _assert2.default)(viewport instanceof _viewport2.default, 'Invalid viewport');

      this.context.viewports = newViewports;
      this._activateViewport(viewport);
      // }

      // We've just rebuilt the viewports to match the descriptors, so clear the flag
      this.viewports = newViewports;
      this.viewDescriptorsChanged = false;
    }

    // Build a `Viewport` from a view descriptor
    // TODO - add support for autosizing viewports using width and height

  }, {
    key: '_makeViewportFromViewDescriptor',
    value: function _makeViewportFromViewDescriptor(_ref10) {
      var viewDescriptor = _ref10.viewDescriptor,
          width = _ref10.width,
          height = _ref10.height;

      // Get the type of the viewport
      // TODO - default to WebMercator?
      var ViewportType = viewDescriptor.type,
          viewState = viewDescriptor.viewState;

      // Resolve relative viewport dimensions
      // TODO - we need to have width and height available

      var viewportDimensions = this._getViewDimensions({ viewDescriptor: viewDescriptor });

      // Create the viewport, giving preference to view state in `viewState`
      return new ViewportType(Object.assign({}, viewDescriptor, viewportDimensions, viewState // Object.assign handles undefined
      ));
    }

    // Check if viewport array has changed, returns true if any change
    // Note that descriptors can be the same

  }, {
    key: '_diffViews',
    value: function _diffViews(newViews, oldViews) {
      var _this2 = this;

      if (newViews.length !== oldViews.length) {
        return true;
      }

      return newViews.some(function (_, i) {
        return _this2._diffView(newViews[i], oldViews[i]);
      });
    }
  }, {
    key: '_diffView',
    value: function _diffView(newView, oldView) {
      // `View` hiearchy supports an `equals` method
      if (newView.viewport) {
        return !oldView.viewport || !newView.viewport.equals(oldView.viewport);
      }
      // TODO - implement deep equal on view descriptors
      return newView !== oldView;
    }

    // Support for relative viewport dimensions (e.g {y: '50%', height: '50%'})

  }, {
    key: '_getViewDimensions',
    value: function _getViewDimensions(_ref11) {
      var viewDescriptor = _ref11.viewDescriptor,
          width = _ref11.width,
          height = _ref11.height;

      var parsePercent = function parsePercent(value, max) {
        return value;
      };
      // TODO - enable to support percent size specifiers
      // const parsePercent = (value, max) => value ?
      //   Math.round(parseFloat(value) / 100 * max) :
      //   (value === null ? max : value);

      return {
        x: parsePercent(viewDescriptor.x, width),
        y: parsePercent(viewDescriptor.y, height),
        width: parsePercent(viewDescriptor.width, width),
        height: parsePercent(viewDescriptor.height, height)
      };
    }

    /**
     * @param {Object} eventManager   A source of DOM input events
     */

  }, {
    key: '_initEventHandling',
    value: function _initEventHandling(eventManager) {
      this._eventManager = eventManager;

      // TODO: add/remove handlers on demand at runtime, not all at once on init.
      // Consider both top-level handlers like onLayerClick/Hover
      // and per-layer handlers attached to individual layers.
      // https://github.com/uber/deck.gl/issues/634
      this._eventManager.on({
        click: this._onClick,
        pointermove: this._onPointerMove,
        pointerleave: this._onPointerLeave
      });
    }

    // Set parameters for input event handling.

  }, {
    key: '_setEventHandlingParameters',
    value: function _setEventHandlingParameters(_ref12) {
      var pickingRadius = _ref12.pickingRadius,
          onLayerClick = _ref12.onLayerClick,
          onLayerHover = _ref12.onLayerHover;

      if (!isNaN(pickingRadius)) {
        this._pickingRadius = pickingRadius;
      }
      if (typeof onLayerClick !== 'undefined') {
        this._onLayerClick = onLayerClick;
      }
      if (typeof onLayerHover !== 'undefined') {
        this._onLayerHover = onLayerHover;
      }
      this._validateEventHandling();
    }

    // Make a viewport "current" in layer context, primed for draw

  }, {
    key: '_activateViewport',
    value: function _activateViewport(viewport) {
      // TODO - viewport change detection breaks METER_OFFSETS mode
      // const oldViewport = this.context.viewport;
      // const viewportChanged = !oldViewport || !viewport.equals(oldViewport);
      var viewportChanged = true;

      if (viewportChanged) {
        Object.assign(this.oldContext, this.context);
        this.context.viewport = viewport;
        this.context.viewportChanged = true;
        this.context.uniforms = {};
        (0, _log2.default)(4, viewport);

        // Update layers states
        // Let screen space layers update their state based on viewport
        // TODO - reimplement viewport change detection (single viewport optimization)
        // TODO - don't set viewportChanged during setViewports?
        if (this.context.viewportChanged) {
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = this.layers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var layer = _step3.value;

              layer.setChangeFlags({ viewportChanged: 'Viewport changed' });
              this._updateLayer(layer);
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
      }

      (0, _assert2.default)(this.context.viewport, 'LayerManager: viewport not set');

      return this;
    }
  }, {
    key: '_getPickingBuffer',
    value: function _getPickingBuffer() {
      var gl = this.context.gl;
      // Create a frame buffer if not already available

      this.context.pickingFBO = this.context.pickingFBO || new _luma.Framebuffer(gl);
      // Resize it to current canvas size (this is a noop if size hasn't changed)
      this.context.pickingFBO.resize({ width: gl.canvas.width, height: gl.canvas.height });
      return this.context.pickingFBO;
    }

    // Match all layers, checking for caught errors
    // To avoid having an exception in one layer disrupt other layers
    // TODO - mark layers with exceptions as bad and remove from rendering cycle?

  }, {
    key: '_updateLayers',
    value: function _updateLayers(_ref13) {
      var oldLayers = _ref13.oldLayers,
          newLayers = _ref13.newLayers;

      // Create old layer map
      var oldLayerMap = {};
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = oldLayers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var oldLayer = _step4.value;

          if (oldLayerMap[oldLayer.id]) {
            _log2.default.warn('Multiple old layers with same id ' + layerName(oldLayer));
          } else {
            oldLayerMap[oldLayer.id] = oldLayer;
          }
        }

        // Allocate array for generated layers
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

      var generatedLayers = [];

      // Match sublayers
      var error = this._updateSublayersRecursively({
        newLayers: newLayers,
        oldLayerMap: oldLayerMap,
        generatedLayers: generatedLayers
      });

      // Finalize unmatched layers
      var error2 = this._finalizeOldLayers(oldLayerMap);

      var firstError = error || error2;
      return { error: firstError, generatedLayers: generatedLayers };
    }

    // Note: adds generated layers to `generatedLayers` array parameter

  }, {
    key: '_updateSublayersRecursively',
    value: function _updateSublayersRecursively(_ref14) {
      var newLayers = _ref14.newLayers,
          oldLayerMap = _ref14.oldLayerMap,
          generatedLayers = _ref14.generatedLayers;

      var error = null;

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = newLayers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var newLayer = _step5.value;

          newLayer.context = this.context;

          // Given a new coming layer, find its matching old layer (if any)
          var oldLayer = oldLayerMap[newLayer.id];
          if (oldLayer === null) {
            // null, rather than undefined, means this id was originally there
            _log2.default.warn('Multiple new layers with same id ' + layerName(newLayer));
          }
          // Remove the old layer from candidates, as it has been matched with this layer
          oldLayerMap[newLayer.id] = null;

          var sublayers = null;

          // We must not generate exceptions until after layer matching is complete
          try {
            if (!oldLayer) {
              this._initializeLayer(newLayer);
              (0, _seerIntegration.initLayerInSeer)(newLayer); // Initializes layer in seer chrome extension (if connected)
            } else {
              this._transferLayerState(oldLayer, newLayer);
              this._updateLayer(newLayer);
              (0, _seerIntegration.updateLayerInSeer)(newLayer); // Updates layer in seer chrome extension (if connected)
            }
            generatedLayers.push(newLayer);

            // Call layer lifecycle method: render sublayers
            sublayers = newLayer.isComposite && newLayer.getSubLayers();
            // End layer lifecycle method: render sublayers
          } catch (err) {
            _log2.default.warn('error during matching of ' + layerName(newLayer), err);
            error = error || err; // Record first exception
          }

          if (sublayers) {
            this._updateSublayersRecursively({
              newLayers: sublayers,
              oldLayerMap: oldLayerMap,
              generatedLayers: generatedLayers
            });
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      return error;
    }

    // Finalize any old layers that were not matched

  }, {
    key: '_finalizeOldLayers',
    value: function _finalizeOldLayers(oldLayerMap) {
      var error = null;
      for (var layerId in oldLayerMap) {
        var layer = oldLayerMap[layerId];
        if (layer) {
          error = error || this._finalizeLayer(layer);
        }
      }
      return error;
    }

    // Initializes a single layer, calling layer methods

  }, {
    key: '_initializeLayer',
    value: function _initializeLayer(layer) {
      (0, _assert2.default)(!layer.state);
      (0, _log2.default)(LOG_PRIORITY_LIFECYCLE, 'initializing ' + layerName(layer));

      var error = null;
      try {
        layer._initialize();
        layer.lifecycle = _constants.LIFECYCLE.INITIALIZED;
      } catch (err) {
        _log2.default.warn('error while initializing ' + layerName(layer) + '\n', err);
        error = error || err;
        // TODO - what should the lifecycle state be here? LIFECYCLE.INITIALIZATION_FAILED?
      }

      (0, _assert2.default)(layer.state);

      // Set back pointer (used in picking)
      layer.state.layer = layer;

      // Save layer on model for picking purposes
      // store on model.userData rather than directly on model
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = layer.getModels()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var model = _step6.value;

          model.userData.layer = layer;
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      return error;
    }
  }, {
    key: '_transferLayerState',
    value: function _transferLayerState(oldLayer, newLayer) {
      if (newLayer !== oldLayer) {
        (0, _log2.default)(LOG_PRIORITY_LIFECYCLE_MINOR, 'matched ' + layerName(newLayer), oldLayer, '->', newLayer);
        newLayer.lifecycle = _constants.LIFECYCLE.MATCHED;
        oldLayer.lifecycle = _constants.LIFECYCLE.AWAITING_GC;
        newLayer._transferState(oldLayer);
      } else {
        _log2.default.log(LOG_PRIORITY_LIFECYCLE_MINOR, 'Matching layer is unchanged ' + newLayer.id);
        newLayer.lifecycle = _constants.LIFECYCLE.MATCHED;
        newLayer.oldProps = newLayer.props;
      }
    }

    // Updates a single layer, cleaning all flags

  }, {
    key: '_updateLayer',
    value: function _updateLayer(layer) {
      _log2.default.log(LOG_PRIORITY_LIFECYCLE_MINOR, 'updating ' + layer + ' because: ' + layer.printChangeFlags());
      var error = null;
      try {
        layer._update();
      } catch (err) {
        _log2.default.warn('error during update of ' + layerName(layer), err);
        // Save first error
        error = err;
      }
      return error;
    }

    // Finalizes a single layer

  }, {
    key: '_finalizeLayer',
    value: function _finalizeLayer(layer) {
      (0, _assert2.default)(layer.state);
      (0, _assert2.default)(layer.lifecycle !== _constants.LIFECYCLE.AWAITING_FINALIZATION);
      layer.lifecycle = _constants.LIFECYCLE.AWAITING_FINALIZATION;
      var error = null;
      this.setNeedsRedraw('finalized ' + layerName(layer));
      try {
        layer._finalize();
      } catch (err) {
        _log2.default.warn('error during finalization of ' + layerName(layer), err);
        error = err;
      }
      layer.lifecycle = _constants.LIFECYCLE.FINALIZED;
      (0, _log2.default)(LOG_PRIORITY_LIFECYCLE, 'finalizing ' + layerName(layer));
      return error;
    }

    /**
     * Warn if a deck-level mouse event has been specified,
     * but no layers are `pickable`.
     */

  }, {
    key: '_validateEventHandling',
    value: function _validateEventHandling() {
      if (this.onLayerClick || this.onLayerHover) {
        if (this.layers.length && !this.layers.some(function (layer) {
          return layer.props.pickable;
        })) {
          _log2.default.warn('You have supplied a top-level input event handler (e.g. `onLayerClick`), ' + 'but none of your layers have set the `pickable` flag.');
        }
      }
    }

    /**
     * Route click events to layers.
     * `pickLayer` will call the `onClick` prop of any picked layer,
     * and `onLayerClick` is called directly from here
     * with any picking info generated by `pickLayer`.
     * @param {Object} event  An object encapsulating an input event,
     *                        with the following shape:
     *                        {Object: {x, y}} offsetCenter: center of the event
     *                        {Object} srcEvent:             native JS Event object
     */

  }, {
    key: '_onClick',
    value: function _onClick(event) {
      if (!event.offsetCenter) {
        // Do not trigger onHover callbacks when click position is invalid.
        return;
      }
      this._pickAndCallback({
        callback: this._onLayerClick,
        event: event,
        mode: 'click'
      });
    }

    /**
     * Route click events to layers.
     * `pickLayer` will call the `onHover` prop of any picked layer,
     * and `onLayerHover` is called directly from here
     * with any picking info generated by `pickLayer`.
     * @param {Object} event  An object encapsulating an input event,
     *                        with the following shape:
     *                        {Object: {x, y}} offsetCenter: center of the event
     *                        {Object} srcEvent:             native JS Event object
     */

  }, {
    key: '_onPointerMove',
    value: function _onPointerMove(event) {
      if (event.leftButton || event.rightButton) {
        // Do not trigger onHover callbacks if mouse button is down.
        return;
      }
      this._pickAndCallback({
        callback: this._onLayerHover,
        event: event,
        mode: 'hover'
      });
    }
  }, {
    key: '_onPointerLeave',
    value: function _onPointerLeave(event) {
      this.pickObject({
        x: -1,
        y: -1,
        radius: this._pickingRadius,
        mode: 'hover'
      });
    }
  }, {
    key: '_pickAndCallback',
    value: function _pickAndCallback(options) {
      var pos = options.event.offsetCenter;
      var radius = this._pickingRadius;
      var selectedInfos = this.pickObject({ x: pos.x, y: pos.y, radius: radius, mode: options.mode });
      if (options.callback) {
        var firstInfo = selectedInfos.find(function (info) {
          return info.index >= 0;
        }) || null;
        // As per documentation, send null value when no valid object is picked.
        options.callback(firstInfo, selectedInfos, options.event.srcEvent);
      }
    }

    // SEER INTEGRATION

    /**
     * Called upon Seer initialization, manually sends layers data.
     */

  }, {
    key: '_initSeer',
    value: function _initSeer() {
      this.layers.forEach(function (layer) {
        (0, _seerIntegration.initLayerInSeer)(layer);
        (0, _seerIntegration.updateLayerInSeer)(layer);
      });
    }

    /**
     * On Seer property edition, set override and update layers.
     */

  }, {
    key: '_editSeer',
    value: function _editSeer(payload) {
      if (payload.type !== 'edit' || payload.valuePath[0] !== 'props') {
        return;
      }

      (0, _seerIntegration.setPropOverrides)(payload.itemKey, payload.valuePath.slice(1), payload.value);
      var newLayers = this.layers.map(function (layer) {
        return new layer.constructor(layer.props);
      });
      this.updateLayers({ newLayers: newLayers });
    }
  }]);

  return LayerManager;
}();

exports.default = LayerManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9sYXllci1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIkxPR19QUklPUklUWV9MSUZFQ1lDTEUiLCJMT0dfUFJJT1JJVFlfTElGRUNZQ0xFX01JTk9SIiwiaW5pdGlhbENvbnRleHQiLCJ1bmlmb3JtcyIsInZpZXdwb3J0cyIsInZpZXdwb3J0IiwibGF5ZXJGaWx0ZXIiLCJ2aWV3cG9ydENoYW5nZWQiLCJwaWNraW5nRkJPIiwidXNlRGV2aWNlUGl4ZWxzIiwibGFzdFBpY2tlZEluZm8iLCJpbmRleCIsImxheWVySWQiLCJsYXllck5hbWUiLCJsYXllciIsIkxheWVyTWFuYWdlciIsImdsIiwiZXZlbnRNYW5hZ2VyIiwibGFzdFJlbmRlcmVkTGF5ZXJzIiwicHJldkxheWVycyIsImxheWVycyIsIm9sZENvbnRleHQiLCJjb250ZXh0IiwiT2JqZWN0IiwiYXNzaWduIiwic2hhZGVyQ2FjaGUiLCJfY2FjaGVQcm9ncmFtcyIsIndpZHRoIiwiaGVpZ2h0Iiwidmlld0Rlc2NyaXB0b3JzIiwidmlld0Rlc2NyaXB0b3JzQ2hhbmdlZCIsIl9uZWVkc1JlZHJhdyIsIl9waWNraW5nUmFkaXVzIiwiX2V2ZW50TWFuYWdlciIsIl9vbkxheWVyQ2xpY2siLCJfb25MYXllckhvdmVyIiwiX29uQ2xpY2siLCJiaW5kIiwiX29uUG9pbnRlck1vdmUiLCJfb25Qb2ludGVyTGVhdmUiLCJfcGlja0FuZENhbGxiYWNrIiwiX2luaXRTZWVyIiwiX2VkaXRTZWVyIiwic2VhbCIsIl9pbml0RXZlbnRIYW5kbGluZyIsInNldFZpZXdwb3J0cyIsImxhdGl0dWRlIiwibG9uZ2l0dWRlIiwiem9vbSIsInJlbW92ZUxpc3RlbmVyIiwiY2xlYXJSZWRyYXdGbGFncyIsIl9jaGVja0lmTmVlZHNSZWRyYXciLCJyZWFzb24iLCJsYXllcklkcyIsImZpbHRlciIsImZpbmQiLCJpZCIsImluZGV4T2YiLCJfcmVidWlsZFZpZXdwb3J0c0Zyb21WaWV3cyIsInBhcmFtZXRlcnMiLCJfc2V0RXZlbnRIYW5kbGluZ1BhcmFtZXRlcnMiLCJzZXRMYXllcnMiLCJzZXROZWVkc1JlZHJhdyIsImRyYXdQaWNraW5nQ29sb3JzIiwiQm9vbGVhbiIsIm1hcCIsIl9kaWZmVmlld3MiLCJuZXdMYXllcnMiLCJsb2ciLCJfdXBkYXRlTGF5ZXJzIiwib2xkTGF5ZXJzIiwiZXJyb3IiLCJnZW5lcmF0ZWRMYXllcnMiLCJwYXNzIiwicmVkcmF3UmVhc29uIiwiZ2V0Vmlld3BvcnRzIiwib25WaWV3cG9ydEFjdGl2ZSIsIl9hY3RpdmF0ZVZpZXdwb3J0IiwieCIsInkiLCJtb2RlIiwicmFkaXVzIiwiZ2V0TGF5ZXJzIiwiX2dldFBpY2tpbmdCdWZmZXIiLCJkZXByZWNhdGVkIiwicmVkcmF3IiwibGF5ZXJOZWVkc1JlZHJhdyIsImdldE5lZWRzUmVkcmF3IiwibmV3Vmlld3BvcnRzIiwidmlld0Rlc2NyaXB0b3IiLCJfbWFrZVZpZXdwb3J0RnJvbVZpZXdEZXNjcmlwdG9yIiwiVmlld3BvcnRUeXBlIiwidHlwZSIsInZpZXdTdGF0ZSIsInZpZXdwb3J0RGltZW5zaW9ucyIsIl9nZXRWaWV3RGltZW5zaW9ucyIsIm5ld1ZpZXdzIiwib2xkVmlld3MiLCJsZW5ndGgiLCJzb21lIiwiXyIsImkiLCJfZGlmZlZpZXciLCJuZXdWaWV3Iiwib2xkVmlldyIsImVxdWFscyIsInBhcnNlUGVyY2VudCIsInZhbHVlIiwibWF4Iiwib24iLCJjbGljayIsInBvaW50ZXJtb3ZlIiwicG9pbnRlcmxlYXZlIiwicGlja2luZ1JhZGl1cyIsIm9uTGF5ZXJDbGljayIsIm9uTGF5ZXJIb3ZlciIsImlzTmFOIiwiX3ZhbGlkYXRlRXZlbnRIYW5kbGluZyIsInNldENoYW5nZUZsYWdzIiwiX3VwZGF0ZUxheWVyIiwicmVzaXplIiwiY2FudmFzIiwib2xkTGF5ZXJNYXAiLCJvbGRMYXllciIsIndhcm4iLCJfdXBkYXRlU3VibGF5ZXJzUmVjdXJzaXZlbHkiLCJlcnJvcjIiLCJfZmluYWxpemVPbGRMYXllcnMiLCJmaXJzdEVycm9yIiwibmV3TGF5ZXIiLCJzdWJsYXllcnMiLCJfaW5pdGlhbGl6ZUxheWVyIiwiX3RyYW5zZmVyTGF5ZXJTdGF0ZSIsInB1c2giLCJpc0NvbXBvc2l0ZSIsImdldFN1YkxheWVycyIsImVyciIsIl9maW5hbGl6ZUxheWVyIiwic3RhdGUiLCJfaW5pdGlhbGl6ZSIsImxpZmVjeWNsZSIsIklOSVRJQUxJWkVEIiwiZ2V0TW9kZWxzIiwibW9kZWwiLCJ1c2VyRGF0YSIsIk1BVENIRUQiLCJBV0FJVElOR19HQyIsIl90cmFuc2ZlclN0YXRlIiwib2xkUHJvcHMiLCJwcm9wcyIsInByaW50Q2hhbmdlRmxhZ3MiLCJfdXBkYXRlIiwiQVdBSVRJTkdfRklOQUxJWkFUSU9OIiwiX2ZpbmFsaXplIiwiRklOQUxJWkVEIiwicGlja2FibGUiLCJldmVudCIsIm9mZnNldENlbnRlciIsImNhbGxiYWNrIiwibGVmdEJ1dHRvbiIsInJpZ2h0QnV0dG9uIiwicGlja09iamVjdCIsIm9wdGlvbnMiLCJwb3MiLCJzZWxlY3RlZEluZm9zIiwiZmlyc3RJbmZvIiwiaW5mbyIsInNyY0V2ZW50IiwiZm9yRWFjaCIsInBheWxvYWQiLCJ2YWx1ZVBhdGgiLCJpdGVtS2V5Iiwic2xpY2UiLCJjb25zdHJ1Y3RvciIsInVwZGF0ZUxheWVycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O3FqQkFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFVQTs7O0FBUkE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7O0FBRUE7Ozs7OztBQVFBLElBQU1BLHlCQUF5QixDQUEvQjtBQUNBLElBQU1DLCtCQUErQixDQUFyQzs7QUFFQSxJQUFNQyxpQkFBaUI7QUFDckJDLFlBQVUsRUFEVztBQUVyQkMsYUFBVyxFQUZVO0FBR3JCQyxZ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QUVBOzs7Ozs7Z0NBR1k7QUFDVixXQUFLbkosTUFBTCxDQUFZb0osT0FBWixDQUFvQixpQkFBUztBQUMzQiw4Q0FBZ0IxSixLQUFoQjtBQUNBLGdEQUFrQkEsS0FBbEI7QUFDRCxPQUhEO0FBSUQ7O0FBRUQ7Ozs7Ozs4QkFHVTJKLE8sRUFBUztBQUNqQixVQUFJQSxRQUFRN0UsSUFBUixLQUFpQixNQUFqQixJQUEyQjZFLFFBQVFDLFNBQVIsQ0FBa0IsQ0FBbEIsTUFBeUIsT0FBeEQsRUFBaUU7QUFDL0Q7QUFDRDs7QUFFRCw2Q0FBaUJELFFBQVFFLE9BQXpCLEVBQWtDRixRQUFRQyxTQUFSLENBQWtCRSxLQUFsQixDQUF3QixDQUF4QixDQUFsQyxFQUE4REgsUUFBUTlELEtBQXRFO0FBQ0EsVUFBTXhDLFlBQVksS0FBSy9DLE1BQUwsQ0FBWTZDLEdBQVosQ0FBZ0I7QUFBQSxlQUFTLElBQUluRCxNQUFNK0osV0FBVixDQUFzQi9KLE1BQU11SSxLQUE1QixDQUFUO0FBQUEsT0FBaEIsQ0FBbEI7QUFDQSxXQUFLeUIsWUFBTCxDQUFrQixFQUFDM0csb0JBQUQsRUFBbEI7QUFDRDs7Ozs7O2tCQTFzQmtCcEQsWSIsImZpbGUiOiJsYXllci1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7RnJhbWVidWZmZXIsIFNoYWRlckNhY2hlfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCBzZWVyIGZyb20gJ3NlZXInO1xuaW1wb3J0IExheWVyIGZyb20gJy4vbGF5ZXInO1xuaW1wb3J0IHtkcmF3TGF5ZXJzfSBmcm9tICcuL2RyYXctbGF5ZXJzJztcbmltcG9ydCB7cGlja09iamVjdCwgcGlja1Zpc2libGVPYmplY3RzfSBmcm9tICcuL3BpY2stbGF5ZXJzJztcbmltcG9ydCB7TElGRUNZQ0xFfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgVmlld3BvcnQgZnJvbSAnLi4vdmlld3BvcnRzL3ZpZXdwb3J0Jztcbi8vIFRPRE8gLSByZW1vdmUsIGp1c3QgZm9yIGR1bW15IGluaXRpYWxpemF0aW9uXG5pbXBvcnQgV2ViTWVyY2F0b3JWaWV3cG9ydCBmcm9tICcuLi92aWV3cG9ydHMvd2ViLW1lcmNhdG9yLXZpZXdwb3J0JztcbmltcG9ydCBsb2cgZnJvbSAnLi4vdXRpbHMvbG9nJztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi4vdXRpbHMvZmxhdHRlbic7XG5cbmltcG9ydCB7XG4gIHNldFByb3BPdmVycmlkZXMsXG4gIGxheWVyRWRpdExpc3RlbmVyLFxuICBzZWVySW5pdExpc3RlbmVyLFxuICBpbml0TGF5ZXJJblNlZXIsXG4gIHVwZGF0ZUxheWVySW5TZWVyXG59IGZyb20gJy4vc2Vlci1pbnRlZ3JhdGlvbic7XG5cbmNvbnN0IExPR19QUklPUklUWV9MSUZFQ1lDTEUgPSAyO1xuY29uc3QgTE9HX1BSSU9SSVRZX0xJRkVDWUNMRV9NSU5PUiA9IDQ7XG5cbmNvbnN0IGluaXRpYWxDb250ZXh0ID0ge1xuICB1bmlmb3Jtczoge30sXG4gIHZpZXdwb3J0czogW10sXG4gIHZpZXdwb3J0OiBudWxsLFxuICBsYXllckZpbHRlcjogbnVsbCxcbiAgdmlld3BvcnRDaGFuZ2VkOiB0cnVlLFxuICBwaWNraW5nRkJPOiBudWxsLFxuICB1c2VEZXZpY2VQaXhlbHM6IHRydWUsXG4gIGxhc3RQaWNrZWRJbmZvOiB7XG4gICAgaW5kZXg6IC0xLFxuICAgIGxheWVySWQ6IG51bGxcbiAgfVxufTtcblxuY29uc3QgbGF5ZXJOYW1lID0gbGF5ZXIgPT4gKGxheWVyIGluc3RhbmNlb2YgTGF5ZXIgPyBgJHtsYXllcn1gIDogIWxheWVyID8gJ251bGwnIDogJ2ludmFsaWQnKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGF5ZXJNYW5hZ2VyIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gIGNvbnN0cnVjdG9yKGdsLCB7ZXZlbnRNYW5hZ2VyfSA9IHt9KSB7XG4gICAgLy8gQ3VycmVudGx5IGRlY2suZ2wgZXhwZWN0cyB0aGUgRGVja0dMLmxheWVycyBhcnJheSB0byBiZSBkaWZmZXJlbnRcbiAgICAvLyB3aGVuZXZlciBSZWFjdCByZXJlbmRlcnMuIElmIHRoZSBzYW1lIGxheWVycyBhcnJheSBpcyB1c2VkLCB0aGVcbiAgICAvLyBMYXllck1hbmFnZXIncyBkaWZmaW5nIGFsZ29yaXRobSB3aWxsIGdlbmVyYXRlIGEgZmF0YWwgZXJyb3IgYW5kXG4gICAgLy8gYnJlYWsgdGhlIHJlbmRlcmluZy5cblxuICAgIC8vIGB0aGlzLmxhc3RSZW5kZXJlZExheWVyc2Agc3RvcmVzIHRoZSBVTkZJTFRFUkVEIGxheWVycyBzZW50XG4gICAgLy8gZG93biB0byBMYXllck1hbmFnZXIsIHNvIHRoYXQgYGxheWVyc2AgcmVmZXJlbmNlIGNhbiBiZSBjb21wYXJlZC5cbiAgICAvLyBJZiBpdCdzIHRoZSBzYW1lIGFjcm9zcyB0d28gUmVhY3QgcmVuZGVyIGNhbGxzLCB0aGUgZGlmZmluZyBsb2dpY1xuICAgIC8vIHdpbGwgYmUgc2tpcHBlZC5cbiAgICB0aGlzLmxhc3RSZW5kZXJlZExheWVycyA9IFtdO1xuICAgIHRoaXMucHJldkxheWVycyA9IFtdO1xuICAgIHRoaXMubGF5ZXJzID0gW107XG5cbiAgICB0aGlzLm9sZENvbnRleHQgPSB7fTtcbiAgICB0aGlzLmNvbnRleHQgPSBPYmplY3QuYXNzaWduKHt9LCBpbml0aWFsQ29udGV4dCwge1xuICAgICAgZ2wsXG4gICAgICAvLyBFbmFibGluZyBsdW1hLmdsIFByb2dyYW0gY2FjaGluZyB1c2luZyBwcml2YXRlIEFQSSAoX2NhY2hlUHJvZ3JhbXMpXG4gICAgICBzaGFkZXJDYWNoZTogbmV3IFNoYWRlckNhY2hlKHtnbCwgX2NhY2hlUHJvZ3JhbXM6IHRydWV9KVxuICAgIH0pO1xuXG4gICAgLy8gTGlzdCBvZiB2aWV3IGRlc2NyaXB0b3JzLCBnZXRzIHJlLWV2YWx1YXRlZCB3aGVuIHdpZHRoL2hlaWdodCBjaGFuZ2VzXG4gICAgdGhpcy53aWR0aCA9IDEwMDtcbiAgICB0aGlzLmhlaWdodCA9IDEwMDtcbiAgICB0aGlzLnZpZXdEZXNjcmlwdG9ycyA9IFtdO1xuICAgIHRoaXMudmlld0Rlc2NyaXB0b3JzQ2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy52aWV3cG9ydHMgPSBbXTsgLy8gR2VuZXJhdGVkIHZpZXdwb3J0c1xuICAgIHRoaXMuX25lZWRzUmVkcmF3ID0gJ0luaXRpYWwgcmVuZGVyJztcblxuICAgIC8vIEV2ZW50IGhhbmRsaW5nXG4gICAgdGhpcy5fcGlja2luZ1JhZGl1cyA9IDA7XG5cbiAgICB0aGlzLl9ldmVudE1hbmFnZXIgPSBudWxsO1xuICAgIHRoaXMuX29uTGF5ZXJDbGljayA9IG51bGw7XG4gICAgdGhpcy5fb25MYXllckhvdmVyID0gbnVsbDtcbiAgICB0aGlzLl9vbkNsaWNrID0gdGhpcy5fb25DbGljay5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX29uUG9pbnRlck1vdmUgPSB0aGlzLl9vblBvaW50ZXJNb3ZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fb25Qb2ludGVyTGVhdmUgPSB0aGlzLl9vblBvaW50ZXJMZWF2ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3BpY2tBbmRDYWxsYmFjayA9IHRoaXMuX3BpY2tBbmRDYWxsYmFjay5iaW5kKHRoaXMpO1xuXG4gICAgLy8gU2VlciBpbnRlZ3JhdGlvblxuICAgIHRoaXMuX2luaXRTZWVyID0gdGhpcy5faW5pdFNlZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9lZGl0U2VlciA9IHRoaXMuX2VkaXRTZWVyLmJpbmQodGhpcyk7XG4gICAgc2VlckluaXRMaXN0ZW5lcih0aGlzLl9pbml0U2Vlcik7XG4gICAgbGF5ZXJFZGl0TGlzdGVuZXIodGhpcy5fZWRpdFNlZXIpO1xuXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICBpZiAoZXZlbnRNYW5hZ2VyKSB7XG4gICAgICB0aGlzLl9pbml0RXZlbnRIYW5kbGluZyhldmVudE1hbmFnZXIpO1xuICAgIH1cblxuICAgIC8vIEluaXQgd2l0aCBkdW1teSB2aWV3cG9ydFxuICAgIHRoaXMuc2V0Vmlld3BvcnRzKFtcbiAgICAgIG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHt3aWR0aDogMSwgaGVpZ2h0OiAxLCBsYXRpdHVkZTogMCwgbG9uZ2l0dWRlOiAwLCB6b29tOiAxfSlcbiAgICBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdG8gY2FsbCB3aGVuIHRoZSBsYXllciBtYW5hZ2VyIGlzIG5vdCBuZWVkZWQgYW55bW9yZS5cbiAgICpcbiAgICogQ3VycmVudGx5IHVzZWQgaW4gdGhlIDxEZWNrR0w+IGNvbXBvbmVudFdpbGxVbm1vdW50IGxpZmVjeWNsZSB0byB1bmJpbmQgU2VlciBsaXN0ZW5lcnMuXG4gICAqL1xuICBmaW5hbGl6ZSgpIHtcbiAgICBzZWVyLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2luaXRTZWVyKTtcbiAgICBzZWVyLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2VkaXRTZWVyKTtcbiAgfVxuXG4gIG5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gdHJ1ZX0gPSB7fSkge1xuICAgIHJldHVybiB0aGlzLl9jaGVja0lmTmVlZHNSZWRyYXcoY2xlYXJSZWRyYXdGbGFncyk7XG4gIH1cblxuICAvLyBOb3JtYWxseSBub3QgY2FsbGVkIGJ5IGFwcFxuICBzZXROZWVkc1JlZHJhdyhyZWFzb24pIHtcbiAgICB0aGlzLl9uZWVkc1JlZHJhdyA9IHRoaXMuX25lZWRzUmVkcmF3IHx8IHJlYXNvbjtcbiAgfVxuXG4gIC8vIEdldHMgYW4gKG9wdGlvbmFsbHkpIGZpbHRlcmVkIGxpc3Qgb2YgbGF5ZXJzXG4gIGdldExheWVycyh7bGF5ZXJJZHMgPSBudWxsfSA9IHt9KSB7XG4gICAgLy8gRmlsdGVyaW5nIGJ5IGxheWVySWQgY29tcGFyZXMgYmVnaW5uaW5nIG9mIHN0cmluZ3MsIHNvIHRoYXQgc3VibGF5ZXJzIHdpbGwgYmUgaW5jbHVkZWRcbiAgICAvLyBEZXBlbmRlcyBvbiB0aGUgY29udmVudGlvbiBvZiBhZGRpbmcgc3VmZml4ZXMgdG8gdGhlIHBhcmVudCdzIGxheWVyIG5hbWVcbiAgICByZXR1cm4gbGF5ZXJJZHNcbiAgICAgID8gdGhpcy5sYXllcnMuZmlsdGVyKGxheWVyID0+IGxheWVySWRzLmZpbmQobGF5ZXJJZCA9PiBsYXllci5pZC5pbmRleE9mKGxheWVySWQpID09PSAwKSlcbiAgICAgIDogdGhpcy5sYXllcnM7XG4gIH1cblxuICAvLyBHZXQgYSBzZXQgb2Ygdmlld3BvcnRzIGZvciBhIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHRcbiAgLy8gVE9ETyAtIEludGVudGlvbiBpcyBmb3IgZGVjay5nbCB0byBhdXRvZGVkdWNlIHdpZHRoIGFuZCBoZWlnaHQgYW5kIGRyb3AgdGhlIG5lZWQgZm9yIHByb3BzXG4gIGdldFZpZXdwb3J0cyh7d2lkdGgsIGhlaWdodH0gPSB7fSkge1xuICAgIGlmICh3aWR0aCAhPT0gdGhpcy53aWR0aCB8fCBoZWlnaHQgIT09IHRoaXMuaGVpZ2h0IHx8IHRoaXMudmlld0Rlc2NyaXB0b3JzQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fcmVidWlsZFZpZXdwb3J0c0Zyb21WaWV3cyh7dmlld0Rlc2NyaXB0b3JzOiB0aGlzLnZpZXdEZXNjcmlwdG9ycywgd2lkdGgsIGhlaWdodH0pO1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnZpZXdwb3J0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgcGFyYW1ldGVycyBuZWVkZWQgZm9yIGxheWVyIHJlbmRlcmluZyBhbmQgcGlja2luZy5cbiAgICogUGFyYW1ldGVycyBhcmUgdG8gYmUgcGFzc2VkIGFzIGEgc2luZ2xlIG9iamVjdCwgd2l0aCB0aGUgZm9sbG93aW5nIHZhbHVlczpcbiAgICogQHBhcmFtIHtCb29sZWFufSB1c2VEZXZpY2VQaXhlbHNcbiAgICovXG4gIHNldFBhcmFtZXRlcnMocGFyYW1ldGVycykge1xuICAgIGlmICgnZXZlbnRNYW5hZ2VyJyBpbiBwYXJhbWV0ZXJzKSB7XG4gICAgICB0aGlzLl9pbml0RXZlbnRIYW5kbGluZyhwYXJhbWV0ZXJzLmV2ZW50TWFuYWdlcik7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgJ3BpY2tpbmdSYWRpdXMnIGluIHBhcmFtZXRlcnMgfHxcbiAgICAgICdvbkxheWVyQ2xpY2snIGluIHBhcmFtZXRlcnMgfHxcbiAgICAgICdvbkxheWVySG92ZXInIGluIHBhcmFtZXRlcnNcbiAgICApIHtcbiAgICAgIHRoaXMuX3NldEV2ZW50SGFuZGxpbmdQYXJhbWV0ZXJzKHBhcmFtZXRlcnMpO1xuICAgIH1cblxuICAgIC8vIFRPRE8gLSBGb3Igbm93IHdlIHNldCBsYXllcnMgYmVmb3JlIHZpZXdwb3J0cyB0byBwcmVzZXJ2ZW5jaGFuZ2VGbGFnc1xuICAgIGlmICgnbGF5ZXJzJyBpbiBwYXJhbWV0ZXJzKSB7XG4gICAgICB0aGlzLnNldExheWVycyhwYXJhbWV0ZXJzLmxheWVycyk7XG4gICAgfVxuXG4gICAgaWYgKCd2aWV3cG9ydHMnIGluIHBhcmFtZXRlcnMpIHtcbiAgICAgIHRoaXMuc2V0Vmlld3BvcnRzKHBhcmFtZXRlcnMudmlld3BvcnRzKTtcbiAgICB9XG5cbiAgICBpZiAoJ2xheWVyRmlsdGVyJyBpbiBwYXJhbWV0ZXJzKSB7XG4gICAgICB0aGlzLmNvbnRleHQubGF5ZXJGaWx0ZXIgPSBwYXJhbWV0ZXJzLmxheWVyRmlsdGVyO1xuICAgICAgaWYgKHRoaXMuY29udGV4dC5sYXllckZpbHRlciAhPT0gcGFyYW1ldGVycy5sYXllckZpbHRlcikge1xuICAgICAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCdsYXllckZpbHRlciBjaGFuZ2VkJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCdkcmF3UGlja2luZ0NvbG9ycycgaW4gcGFyYW1ldGVycykge1xuICAgICAgaWYgKHRoaXMuY29udGV4dC5kcmF3UGlja2luZ0NvbG9ycyAhPT0gcGFyYW1ldGVycy5kcmF3UGlja2luZ0NvbG9ycykge1xuICAgICAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCdkcmF3UGlja2luZ0NvbG9ycyBjaGFuZ2VkJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmNvbnRleHQsIHBhcmFtZXRlcnMpO1xuICB9XG5cbiAgLy8gVXBkYXRlIHRoZSB2aWV3IGRlc2NyaXB0b3IgbGlzdCBhbmQgc2V0IGNoYW5nZSBmbGFnIGlmIG5lZWRlZFxuICBzZXRWaWV3cG9ydHModmlld3BvcnRzKSB7XG4gICAgLy8gRW5zdXJlIHZpZXdwb3J0cyBhcmUgd3JhcHBlZCBpbiBkZXNjcmlwdG9yc1xuICAgIGNvbnN0IHZpZXdEZXNjcmlwdG9ycyA9IGZsYXR0ZW4odmlld3BvcnRzLCB7ZmlsdGVyOiBCb29sZWFufSkubWFwKFxuICAgICAgdmlld3BvcnQgPT4gKHZpZXdwb3J0IGluc3RhbmNlb2YgVmlld3BvcnQgPyB7dmlld3BvcnR9IDogdmlld3BvcnQpXG4gICAgKTtcblxuICAgIHRoaXMudmlld0Rlc2NyaXB0b3JzQ2hhbmdlZCA9XG4gICAgICB0aGlzLnZpZXdEZXNjcmlwdG9yc0NoYW5nZWQgfHwgdGhpcy5fZGlmZlZpZXdzKHZpZXdEZXNjcmlwdG9ycywgdGhpcy52aWV3RGVzY3JpcHRvcnMpO1xuXG4gICAgLy8gVHJ5IHRvIG5vdCBhY3R1YWxseSByZWJ1aWxkIHRoZSB2aWV3cG9ydHMgdW50aWwgYGdldFZpZXdwb3J0c2AgaXMgY2FsbGVkXG4gICAgaWYgKHRoaXMudmlld0Rlc2NyaXB0b3JzQ2hhbmdlZCkge1xuICAgICAgdGhpcy52aWV3RGVzY3JpcHRvcnMgPSB2aWV3RGVzY3JpcHRvcnM7XG4gICAgICB0aGlzLl9yZWJ1aWxkVmlld3BvcnRzRnJvbVZpZXdzKHt2aWV3RGVzY3JpcHRvcnM6IHRoaXMudmlld0Rlc2NyaXB0b3JzfSk7XG4gICAgICB0aGlzLnZpZXdEZXNjcmlwdG9yc0NoYW5nZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvLyBTdXBwbHkgYSBuZXcgbGF5ZXIgbGlzdCwgaW5pdGlhdGluZyBzdWJsYXllciBnZW5lcmF0aW9uIGFuZCBsYXllciBtYXRjaGluZ1xuICBzZXRMYXllcnMobmV3TGF5ZXJzKSB7XG4gICAgYXNzZXJ0KHRoaXMuY29udGV4dC52aWV3cG9ydCwgJ0xheWVyTWFuYWdlci51cGRhdGVMYXllcnM6IHZpZXdwb3J0IG5vdCBzZXQnKTtcblxuICAgIC8vIFRPRE8gLSBzb21ldGhpbmcgaXMgZ2VuZXJhdGluZyBzdGF0ZSB1cGRhdGVzIHRoYXQgY2F1c2UgcmVyZW5kZXIgb2YgdGhlIHNhbWVcbiAgICBpZiAobmV3TGF5ZXJzID09PSB0aGlzLmxhc3RSZW5kZXJlZExheWVycykge1xuICAgICAgbG9nLmxvZygzLCAnSWdub3JpbmcgbGF5ZXIgdXBkYXRlIGR1ZSB0byBsYXllciBhcnJheSBub3QgY2hhbmdlZCcpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHRoaXMubGFzdFJlbmRlcmVkTGF5ZXJzID0gbmV3TGF5ZXJzO1xuXG4gICAgbmV3TGF5ZXJzID0gZmxhdHRlbihuZXdMYXllcnMsIHtmaWx0ZXI6IEJvb2xlYW59KTtcblxuICAgIGZvciAoY29uc3QgbGF5ZXIgb2YgbmV3TGF5ZXJzKSB7XG4gICAgICBsYXllci5jb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIH1cblxuICAgIHRoaXMucHJldkxheWVycyA9IHRoaXMubGF5ZXJzO1xuICAgIGNvbnN0IHtlcnJvciwgZ2VuZXJhdGVkTGF5ZXJzfSA9IHRoaXMuX3VwZGF0ZUxheWVycyh7XG4gICAgICBvbGRMYXllcnM6IHRoaXMucHJldkxheWVycyxcbiAgICAgIG5ld0xheWVyc1xuICAgIH0pO1xuXG4gICAgdGhpcy5sYXllcnMgPSBnZW5lcmF0ZWRMYXllcnM7XG4gICAgLy8gVGhyb3cgZmlyc3QgZXJyb3IgZm91bmQsIGlmIGFueVxuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZHJhd0xheWVycyh7cGFzcyA9ICdyZW5kZXIgdG8gc2NyZWVuJywgcmVkcmF3UmVhc29uID0gJ3Vua25vd24gcmVhc29uJ30gPSB7fSkge1xuICAgIGNvbnN0IHtnbCwgdXNlRGV2aWNlUGl4ZWxzLCBkcmF3UGlja2luZ0NvbG9yc30gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAvLyByZW5kZXIgdGhpcyB2aWV3cG9ydFxuICAgIGRyYXdMYXllcnMoZ2wsIHtcbiAgICAgIGxheWVyczogdGhpcy5sYXllcnMsXG4gICAgICB2aWV3cG9ydHM6IHRoaXMuZ2V0Vmlld3BvcnRzKCksXG4gICAgICBvblZpZXdwb3J0QWN0aXZlOiB0aGlzLl9hY3RpdmF0ZVZpZXdwb3J0LmJpbmQodGhpcyksXG4gICAgICB1c2VEZXZpY2VQaXhlbHMsXG4gICAgICBkcmF3UGlja2luZ0NvbG9ycyxcbiAgICAgIHBhc3MsXG4gICAgICBsYXllckZpbHRlcjogdGhpcy5jb250ZXh0LmxheWVyRmlsdGVyLFxuICAgICAgcmVkcmF3UmVhc29uXG4gICAgfSk7XG4gIH1cblxuICAvLyBQaWNrIHRoZSBjbG9zZXN0IGluZm8gYXQgZ2l2ZW4gY29vcmRpbmF0ZVxuICBwaWNrT2JqZWN0KHt4LCB5LCBtb2RlLCByYWRpdXMgPSAwLCBsYXllcklkcywgbGF5ZXJGaWx0ZXJ9KSB7XG4gICAgY29uc3Qge2dsLCB1c2VEZXZpY2VQaXhlbHN9ID0gdGhpcy5jb250ZXh0O1xuXG4gICAgY29uc3QgbGF5ZXJzID0gdGhpcy5nZXRMYXllcnMoe2xheWVySWRzfSk7XG5cbiAgICByZXR1cm4gcGlja09iamVjdChnbCwge1xuICAgICAgLy8gVXNlciBwYXJhbXNcbiAgICAgIHgsXG4gICAgICB5LFxuICAgICAgcmFkaXVzLFxuICAgICAgbGF5ZXJzLFxuICAgICAgbW9kZSxcbiAgICAgIGxheWVyRmlsdGVyLFxuICAgICAgLy8gSW5qZWN0ZWQgcGFyYW1zXG4gICAgICB2aWV3cG9ydHM6IHRoaXMuZ2V0Vmlld3BvcnRzKCksXG4gICAgICBvblZpZXdwb3J0QWN0aXZlOiB0aGlzLl9hY3RpdmF0ZVZpZXdwb3J0LmJpbmQodGhpcyksXG4gICAgICBwaWNraW5nRkJPOiB0aGlzLl9nZXRQaWNraW5nQnVmZmVyKCksXG4gICAgICBsYXN0UGlja2VkSW5mbzogdGhpcy5jb250ZXh0Lmxhc3RQaWNrZWRJbmZvLFxuICAgICAgdXNlRGV2aWNlUGl4ZWxzXG4gICAgfSk7XG4gIH1cblxuICAvLyBHZXQgYWxsIHVuaXF1ZSBpbmZvcyB3aXRoaW4gYSBib3VuZGluZyBib3hcbiAgcGlja09iamVjdHMoe3gsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVySWRzLCBsYXllckZpbHRlcn0pIHtcbiAgICBjb25zdCB7Z2wsIHVzZURldmljZVBpeGVsc30gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICBjb25zdCBsYXllcnMgPSB0aGlzLmdldExheWVycyh7bGF5ZXJJZHN9KTtcblxuICAgIHJldHVybiBwaWNrVmlzaWJsZU9iamVjdHMoZ2wsIHtcbiAgICAgIHgsXG4gICAgICB5LFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBsYXllcnMsXG4gICAgICBsYXllckZpbHRlcixcbiAgICAgIG1vZGU6ICdwaWNrT2JqZWN0cycsXG4gICAgICAvLyBUT0RPIC0gaG93IGRvZXMgdGhpcyBpbnRlcmFjdCB3aXRoIG11bHRpcGxlIHZpZXdwb3J0cz9cbiAgICAgIHZpZXdwb3J0OiB0aGlzLmNvbnRleHQudmlld3BvcnQsXG4gICAgICB2aWV3cG9ydHM6IHRoaXMuZ2V0Vmlld3BvcnRzKCksXG4gICAgICBvblZpZXdwb3J0QWN0aXZlOiB0aGlzLl9hY3RpdmF0ZVZpZXdwb3J0LmJpbmQodGhpcyksXG4gICAgICBwaWNraW5nRkJPOiB0aGlzLl9nZXRQaWNraW5nQnVmZmVyKCksXG4gICAgICB1c2VEZXZpY2VQaXhlbHNcbiAgICB9KTtcbiAgfVxuXG4gIC8vXG4gIC8vIERFUFJFQ0FURUQgTUVUSE9EUyBpbiBWNVxuICAvL1xuXG4gIHVwZGF0ZUxheWVycyh7bmV3TGF5ZXJzfSkge1xuICAgIGxvZy5kZXByZWNhdGVkKCd1cGRhdGVMYXllcnMnLCAnc2V0TGF5ZXJzJyk7XG4gICAgdGhpcy5zZXRMYXllcnMobmV3TGF5ZXJzKTtcbiAgfVxuXG4gIHNldFZpZXdwb3J0KHZpZXdwb3J0KSB7XG4gICAgbG9nLmRlcHJlY2F0ZWQoJ3NldFZpZXdwb3J0JywgJ3NldFZpZXdwb3J0cycpO1xuICAgIHRoaXMuc2V0Vmlld3BvcnRzKFt2aWV3cG9ydF0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy9cbiAgLy8gUFJJVkFURSBNRVRIT0RTXG4gIC8vXG5cbiAgX2NoZWNrSWZOZWVkc1JlZHJhdyhjbGVhclJlZHJhd0ZsYWdzKSB7XG4gICAgbGV0IHJlZHJhdyA9IHRoaXMuX25lZWRzUmVkcmF3O1xuICAgIGlmIChjbGVhclJlZHJhd0ZsYWdzKSB7XG4gICAgICB0aGlzLl9uZWVkc1JlZHJhdyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbGF5ZXJzIGxpc3QgZG9lc24ndCBpbmNsdWRlIHN1YmxheWVycywgcmVseWluZyBvbiBjb21wb3NpdGUgbGF5ZXJzXG4gICAgZm9yIChjb25zdCBsYXllciBvZiB0aGlzLmxheWVycykge1xuICAgICAgLy8gQ2FsbCBldmVyeSBsYXllciB0byBjbGVhciB0aGVpciBmbGFnc1xuICAgICAgY29uc3QgbGF5ZXJOZWVkc1JlZHJhdyA9IGxheWVyLmdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzfSk7XG4gICAgICByZWRyYXcgPSByZWRyYXcgfHwgbGF5ZXJOZWVkc1JlZHJhdztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVkcmF3O1xuICB9XG5cbiAgLy8gUmVidWlsZHMgdmlld3BvcnRzIGZyb20gZGVzY3JpcHRvcnMgdG93YXJkcyBhIGNlcnRhaW4gd2luZG93IHNpemVcbiAgX3JlYnVpbGRWaWV3cG9ydHNGcm9tVmlld3Moe3ZpZXdEZXNjcmlwdG9ycywgd2lkdGgsIGhlaWdodH0pIHtcbiAgICBjb25zdCBuZXdWaWV3cG9ydHMgPSB2aWV3RGVzY3JpcHRvcnMubWFwKFxuICAgICAgdmlld0Rlc2NyaXB0b3IgPT5cbiAgICAgICAgLy8gSWYgYSBgVmlld3BvcnRgIGluc3RhbmNlIHdhcyBzdXBwbGllZCwgdXNlIGl0LCBvdGhlcndpc2UgYnVpbGQgaXRcbiAgICAgICAgdmlld0Rlc2NyaXB0b3Iudmlld3BvcnQgaW5zdGFuY2VvZiBWaWV3cG9ydFxuICAgICAgICAgID8gdmlld0Rlc2NyaXB0b3Iudmlld3BvcnRcbiAgICAgICAgICA6IHRoaXMuX21ha2VWaWV3cG9ydEZyb21WaWV3RGVzY3JpcHRvcih7dmlld0Rlc2NyaXB0b3IsIHdpZHRoLCBoZWlnaHR9KVxuICAgICk7XG5cbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCdWaWV3cG9ydChzKSBjaGFuZ2VkJyk7XG5cbiAgICAvLyBFbnN1cmUgb25lIHZpZXdwb3J0IGlzIGFjdGl2YXRlZCwgbGF5ZXJzIG1heSBleHBlY3QgaXRcbiAgICAvLyBUT0RPIC0gaGFuZGxlIGVtcHR5IHZpZXdwb3J0IGxpc3QgKHVzaW5nIGR1bW15IHZpZXdwb3J0KSwgb3IgYXNzZXJ0XG4gICAgLy8gY29uc3Qgb2xkVmlld3BvcnRzID0gdGhpcy5jb250ZXh0LnZpZXdwb3J0cztcbiAgICAvLyBpZiAodmlld3BvcnRzQ2hhbmdlZCkge1xuXG4gICAgY29uc3Qgdmlld3BvcnQgPSBuZXdWaWV3cG9ydHNbMF07XG4gICAgYXNzZXJ0KHZpZXdwb3J0IGluc3RhbmNlb2YgVmlld3BvcnQsICdJbnZhbGlkIHZpZXdwb3J0Jyk7XG5cbiAgICB0aGlzLmNvbnRleHQudmlld3BvcnRzID0gbmV3Vmlld3BvcnRzO1xuICAgIHRoaXMuX2FjdGl2YXRlVmlld3BvcnQodmlld3BvcnQpO1xuICAgIC8vIH1cblxuICAgIC8vIFdlJ3ZlIGp1c3QgcmVidWlsdCB0aGUgdmlld3BvcnRzIHRvIG1hdGNoIHRoZSBkZXNjcmlwdG9ycywgc28gY2xlYXIgdGhlIGZsYWdcbiAgICB0aGlzLnZpZXdwb3J0cyA9IG5ld1ZpZXdwb3J0cztcbiAgICB0aGlzLnZpZXdEZXNjcmlwdG9yc0NoYW5nZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEJ1aWxkIGEgYFZpZXdwb3J0YCBmcm9tIGEgdmlldyBkZXNjcmlwdG9yXG4gIC8vIFRPRE8gLSBhZGQgc3VwcG9ydCBmb3IgYXV0b3NpemluZyB2aWV3cG9ydHMgdXNpbmcgd2lkdGggYW5kIGhlaWdodFxuICBfbWFrZVZpZXdwb3J0RnJvbVZpZXdEZXNjcmlwdG9yKHt2aWV3RGVzY3JpcHRvciwgd2lkdGgsIGhlaWdodH0pIHtcbiAgICAvLyBHZXQgdGhlIHR5cGUgb2YgdGhlIHZpZXdwb3J0XG4gICAgLy8gVE9ETyAtIGRlZmF1bHQgdG8gV2ViTWVyY2F0b3I/XG4gICAgY29uc3Qge3R5cGU6IFZpZXdwb3J0VHlwZSwgdmlld1N0YXRlfSA9IHZpZXdEZXNjcmlwdG9yO1xuXG4gICAgLy8gUmVzb2x2ZSByZWxhdGl2ZSB2aWV3cG9ydCBkaW1lbnNpb25zXG4gICAgLy8gVE9ETyAtIHdlIG5lZWQgdG8gaGF2ZSB3aWR0aCBhbmQgaGVpZ2h0IGF2YWlsYWJsZVxuICAgIGNvbnN0IHZpZXdwb3J0RGltZW5zaW9ucyA9IHRoaXMuX2dldFZpZXdEaW1lbnNpb25zKHt2aWV3RGVzY3JpcHRvcn0pO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB2aWV3cG9ydCwgZ2l2aW5nIHByZWZlcmVuY2UgdG8gdmlldyBzdGF0ZSBpbiBgdmlld1N0YXRlYFxuICAgIHJldHVybiBuZXcgVmlld3BvcnRUeXBlKFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIHZpZXdEZXNjcmlwdG9yLFxuICAgICAgICB2aWV3cG9ydERpbWVuc2lvbnMsXG4gICAgICAgIHZpZXdTdGF0ZSAvLyBPYmplY3QuYXNzaWduIGhhbmRsZXMgdW5kZWZpbmVkXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHZpZXdwb3J0IGFycmF5IGhhcyBjaGFuZ2VkLCByZXR1cm5zIHRydWUgaWYgYW55IGNoYW5nZVxuICAvLyBOb3RlIHRoYXQgZGVzY3JpcHRvcnMgY2FuIGJlIHRoZSBzYW1lXG4gIF9kaWZmVmlld3MobmV3Vmlld3MsIG9sZFZpZXdzKSB7XG4gICAgaWYgKG5ld1ZpZXdzLmxlbmd0aCAhPT0gb2xkVmlld3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Vmlld3Muc29tZSgoXywgaSkgPT4gdGhpcy5fZGlmZlZpZXcobmV3Vmlld3NbaV0sIG9sZFZpZXdzW2ldKSk7XG4gIH1cblxuICBfZGlmZlZpZXcobmV3Vmlldywgb2xkVmlldykge1xuICAgIC8vIGBWaWV3YCBoaWVhcmNoeSBzdXBwb3J0cyBhbiBgZXF1YWxzYCBtZXRob2RcbiAgICBpZiAobmV3Vmlldy52aWV3cG9ydCkge1xuICAgICAgcmV0dXJuICFvbGRWaWV3LnZpZXdwb3J0IHx8ICFuZXdWaWV3LnZpZXdwb3J0LmVxdWFscyhvbGRWaWV3LnZpZXdwb3J0KTtcbiAgICB9XG4gICAgLy8gVE9ETyAtIGltcGxlbWVudCBkZWVwIGVxdWFsIG9uIHZpZXcgZGVzY3JpcHRvcnNcbiAgICByZXR1cm4gbmV3VmlldyAhPT0gb2xkVmlldztcbiAgfVxuXG4gIC8vIFN1cHBvcnQgZm9yIHJlbGF0aXZlIHZpZXdwb3J0IGRpbWVuc2lvbnMgKGUuZyB7eTogJzUwJScsIGhlaWdodDogJzUwJSd9KVxuICBfZ2V0Vmlld0RpbWVuc2lvbnMoe3ZpZXdEZXNjcmlwdG9yLCB3aWR0aCwgaGVpZ2h0fSkge1xuICAgIGNvbnN0IHBhcnNlUGVyY2VudCA9ICh2YWx1ZSwgbWF4KSA9PiB2YWx1ZTtcbiAgICAvLyBUT0RPIC0gZW5hYmxlIHRvIHN1cHBvcnQgcGVyY2VudCBzaXplIHNwZWNpZmllcnNcbiAgICAvLyBjb25zdCBwYXJzZVBlcmNlbnQgPSAodmFsdWUsIG1heCkgPT4gdmFsdWUgP1xuICAgIC8vICAgTWF0aC5yb3VuZChwYXJzZUZsb2F0KHZhbHVlKSAvIDEwMCAqIG1heCkgOlxuICAgIC8vICAgKHZhbHVlID09PSBudWxsID8gbWF4IDogdmFsdWUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHBhcnNlUGVyY2VudCh2aWV3RGVzY3JpcHRvci54LCB3aWR0aCksXG4gICAgICB5OiBwYXJzZVBlcmNlbnQodmlld0Rlc2NyaXB0b3IueSwgaGVpZ2h0KSxcbiAgICAgIHdpZHRoOiBwYXJzZVBlcmNlbnQodmlld0Rlc2NyaXB0b3Iud2lkdGgsIHdpZHRoKSxcbiAgICAgIGhlaWdodDogcGFyc2VQZXJjZW50KHZpZXdEZXNjcmlwdG9yLmhlaWdodCwgaGVpZ2h0KVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50TWFuYWdlciAgIEEgc291cmNlIG9mIERPTSBpbnB1dCBldmVudHNcbiAgICovXG4gIF9pbml0RXZlbnRIYW5kbGluZyhldmVudE1hbmFnZXIpIHtcbiAgICB0aGlzLl9ldmVudE1hbmFnZXIgPSBldmVudE1hbmFnZXI7XG5cbiAgICAvLyBUT0RPOiBhZGQvcmVtb3ZlIGhhbmRsZXJzIG9uIGRlbWFuZCBhdCBydW50aW1lLCBub3QgYWxsIGF0IG9uY2Ugb24gaW5pdC5cbiAgICAvLyBDb25zaWRlciBib3RoIHRvcC1sZXZlbCBoYW5kbGVycyBsaWtlIG9uTGF5ZXJDbGljay9Ib3ZlclxuICAgIC8vIGFuZCBwZXItbGF5ZXIgaGFuZGxlcnMgYXR0YWNoZWQgdG8gaW5kaXZpZHVhbCBsYXllcnMuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ViZXIvZGVjay5nbC9pc3N1ZXMvNjM0XG4gICAgdGhpcy5fZXZlbnRNYW5hZ2VyLm9uKHtcbiAgICAgIGNsaWNrOiB0aGlzLl9vbkNsaWNrLFxuICAgICAgcG9pbnRlcm1vdmU6IHRoaXMuX29uUG9pbnRlck1vdmUsXG4gICAgICBwb2ludGVybGVhdmU6IHRoaXMuX29uUG9pbnRlckxlYXZlXG4gICAgfSk7XG4gIH1cblxuICAvLyBTZXQgcGFyYW1ldGVycyBmb3IgaW5wdXQgZXZlbnQgaGFuZGxpbmcuXG4gIF9zZXRFdmVudEhhbmRsaW5nUGFyYW1ldGVycyh7cGlja2luZ1JhZGl1cywgb25MYXllckNsaWNrLCBvbkxheWVySG92ZXJ9KSB7XG4gICAgaWYgKCFpc05hTihwaWNraW5nUmFkaXVzKSkge1xuICAgICAgdGhpcy5fcGlja2luZ1JhZGl1cyA9IHBpY2tpbmdSYWRpdXM7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb25MYXllckNsaWNrICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5fb25MYXllckNsaWNrID0gb25MYXllckNsaWNrO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9uTGF5ZXJIb3ZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuX29uTGF5ZXJIb3ZlciA9IG9uTGF5ZXJIb3ZlcjtcbiAgICB9XG4gICAgdGhpcy5fdmFsaWRhdGVFdmVudEhhbmRsaW5nKCk7XG4gIH1cblxuICAvLyBNYWtlIGEgdmlld3BvcnQgXCJjdXJyZW50XCIgaW4gbGF5ZXIgY29udGV4dCwgcHJpbWVkIGZvciBkcmF3XG4gIF9hY3RpdmF0ZVZpZXdwb3J0KHZpZXdwb3J0KSB7XG4gICAgLy8gVE9ETyAtIHZpZXdwb3J0IGNoYW5nZSBkZXRlY3Rpb24gYnJlYWtzIE1FVEVSX09GRlNFVFMgbW9kZVxuICAgIC8vIGNvbnN0IG9sZFZpZXdwb3J0ID0gdGhpcy5jb250ZXh0LnZpZXdwb3J0O1xuICAgIC8vIGNvbnN0IHZpZXdwb3J0Q2hhbmdlZCA9ICFvbGRWaWV3cG9ydCB8fCAhdmlld3BvcnQuZXF1YWxzKG9sZFZpZXdwb3J0KTtcbiAgICBjb25zdCB2aWV3cG9ydENoYW5nZWQgPSB0cnVlO1xuXG4gICAgaWYgKHZpZXdwb3J0Q2hhbmdlZCkge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLm9sZENvbnRleHQsIHRoaXMuY29udGV4dCk7XG4gICAgICB0aGlzLmNvbnRleHQudmlld3BvcnQgPSB2aWV3cG9ydDtcbiAgICAgIHRoaXMuY29udGV4dC52aWV3cG9ydENoYW5nZWQgPSB0cnVlO1xuICAgICAgdGhpcy5jb250ZXh0LnVuaWZvcm1zID0ge307XG4gICAgICBsb2coNCwgdmlld3BvcnQpO1xuXG4gICAgICAvLyBVcGRhdGUgbGF5ZXJzIHN0YXRlc1xuICAgICAgLy8gTGV0IHNjcmVlbiBzcGFjZSBsYXllcnMgdXBkYXRlIHRoZWlyIHN0YXRlIGJhc2VkIG9uIHZpZXdwb3J0XG4gICAgICAvLyBUT0RPIC0gcmVpbXBsZW1lbnQgdmlld3BvcnQgY2hhbmdlIGRldGVjdGlvbiAoc2luZ2xlIHZpZXdwb3J0IG9wdGltaXphdGlvbilcbiAgICAgIC8vIFRPRE8gLSBkb24ndCBzZXQgdmlld3BvcnRDaGFuZ2VkIGR1cmluZyBzZXRWaWV3cG9ydHM/XG4gICAgICBpZiAodGhpcy5jb250ZXh0LnZpZXdwb3J0Q2hhbmdlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGxheWVyIG9mIHRoaXMubGF5ZXJzKSB7XG4gICAgICAgICAgbGF5ZXIuc2V0Q2hhbmdlRmxhZ3Moe3ZpZXdwb3J0Q2hhbmdlZDogJ1ZpZXdwb3J0IGNoYW5nZWQnfSk7XG4gICAgICAgICAgdGhpcy5fdXBkYXRlTGF5ZXIobGF5ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgYXNzZXJ0KHRoaXMuY29udGV4dC52aWV3cG9ydCwgJ0xheWVyTWFuYWdlcjogdmlld3BvcnQgbm90IHNldCcpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBfZ2V0UGlja2luZ0J1ZmZlcigpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIC8vIENyZWF0ZSBhIGZyYW1lIGJ1ZmZlciBpZiBub3QgYWxyZWFkeSBhdmFpbGFibGVcbiAgICB0aGlzLmNvbnRleHQucGlja2luZ0ZCTyA9IHRoaXMuY29udGV4dC5waWNraW5nRkJPIHx8IG5ldyBGcmFtZWJ1ZmZlcihnbCk7XG4gICAgLy8gUmVzaXplIGl0IHRvIGN1cnJlbnQgY2FudmFzIHNpemUgKHRoaXMgaXMgYSBub29wIGlmIHNpemUgaGFzbid0IGNoYW5nZWQpXG4gICAgdGhpcy5jb250ZXh0LnBpY2tpbmdGQk8ucmVzaXplKHt3aWR0aDogZ2wuY2FudmFzLndpZHRoLCBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHR9KTtcbiAgICByZXR1cm4gdGhpcy5jb250ZXh0LnBpY2tpbmdGQk87XG4gIH1cblxuICAvLyBNYXRjaCBhbGwgbGF5ZXJzLCBjaGVja2luZyBmb3IgY2F1Z2h0IGVycm9yc1xuICAvLyBUbyBhdm9pZCBoYXZpbmcgYW4gZXhjZXB0aW9uIGluIG9uZSBsYXllciBkaXNydXB0IG90aGVyIGxheWVyc1xuICAvLyBUT0RPIC0gbWFyayBsYXllcnMgd2l0aCBleGNlcHRpb25zIGFzIGJhZCBhbmQgcmVtb3ZlIGZyb20gcmVuZGVyaW5nIGN5Y2xlP1xuICBfdXBkYXRlTGF5ZXJzKHtvbGRMYXllcnMsIG5ld0xheWVyc30pIHtcbiAgICAvLyBDcmVhdGUgb2xkIGxheWVyIG1hcFxuICAgIGNvbnN0IG9sZExheWVyTWFwID0ge307XG4gICAgZm9yIChjb25zdCBvbGRMYXllciBvZiBvbGRMYXllcnMpIHtcbiAgICAgIGlmIChvbGRMYXllck1hcFtvbGRMYXllci5pZF0pIHtcbiAgICAgICAgbG9nLndhcm4oYE11bHRpcGxlIG9sZCBsYXllcnMgd2l0aCBzYW1lIGlkICR7bGF5ZXJOYW1lKG9sZExheWVyKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9sZExheWVyTWFwW29sZExheWVyLmlkXSA9IG9sZExheWVyO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFsbG9jYXRlIGFycmF5IGZvciBnZW5lcmF0ZWQgbGF5ZXJzXG4gICAgY29uc3QgZ2VuZXJhdGVkTGF5ZXJzID0gW107XG5cbiAgICAvLyBNYXRjaCBzdWJsYXllcnNcbiAgICBjb25zdCBlcnJvciA9IHRoaXMuX3VwZGF0ZVN1YmxheWVyc1JlY3Vyc2l2ZWx5KHtcbiAgICAgIG5ld0xheWVycyxcbiAgICAgIG9sZExheWVyTWFwLFxuICAgICAgZ2VuZXJhdGVkTGF5ZXJzXG4gICAgfSk7XG5cbiAgICAvLyBGaW5hbGl6ZSB1bm1hdGNoZWQgbGF5ZXJzXG4gICAgY29uc3QgZXJyb3IyID0gdGhpcy5fZmluYWxpemVPbGRMYXllcnMob2xkTGF5ZXJNYXApO1xuXG4gICAgY29uc3QgZmlyc3RFcnJvciA9IGVycm9yIHx8IGVycm9yMjtcbiAgICByZXR1cm4ge2Vycm9yOiBmaXJzdEVycm9yLCBnZW5lcmF0ZWRMYXllcnN9O1xuICB9XG5cbiAgLy8gTm90ZTogYWRkcyBnZW5lcmF0ZWQgbGF5ZXJzIHRvIGBnZW5lcmF0ZWRMYXllcnNgIGFycmF5IHBhcmFtZXRlclxuICBfdXBkYXRlU3VibGF5ZXJzUmVjdXJzaXZlbHkoe25ld0xheWVycywgb2xkTGF5ZXJNYXAsIGdlbmVyYXRlZExheWVyc30pIHtcbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuXG4gICAgZm9yIChjb25zdCBuZXdMYXllciBvZiBuZXdMYXllcnMpIHtcbiAgICAgIG5ld0xheWVyLmNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAgIC8vIEdpdmVuIGEgbmV3IGNvbWluZyBsYXllciwgZmluZCBpdHMgbWF0Y2hpbmcgb2xkIGxheWVyIChpZiBhbnkpXG4gICAgICBjb25zdCBvbGRMYXllciA9IG9sZExheWVyTWFwW25ld0xheWVyLmlkXTtcbiAgICAgIGlmIChvbGRMYXllciA9PT0gbnVsbCkge1xuICAgICAgICAvLyBudWxsLCByYXRoZXIgdGhhbiB1bmRlZmluZWQsIG1lYW5zIHRoaXMgaWQgd2FzIG9yaWdpbmFsbHkgdGhlcmVcbiAgICAgICAgbG9nLndhcm4oYE11bHRpcGxlIG5ldyBsYXllcnMgd2l0aCBzYW1lIGlkICR7bGF5ZXJOYW1lKG5ld0xheWVyKX1gKTtcbiAgICAgIH1cbiAgICAgIC8vIFJlbW92ZSB0aGUgb2xkIGxheWVyIGZyb20gY2FuZGlkYXRlcywgYXMgaXQgaGFzIGJlZW4gbWF0Y2hlZCB3aXRoIHRoaXMgbGF5ZXJcbiAgICAgIG9sZExheWVyTWFwW25ld0xheWVyLmlkXSA9IG51bGw7XG5cbiAgICAgIGxldCBzdWJsYXllcnMgPSBudWxsO1xuXG4gICAgICAvLyBXZSBtdXN0IG5vdCBnZW5lcmF0ZSBleGNlcHRpb25zIHVudGlsIGFmdGVyIGxheWVyIG1hdGNoaW5nIGlzIGNvbXBsZXRlXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIW9sZExheWVyKSB7XG4gICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZUxheWVyKG5ld0xheWVyKTtcbiAgICAgICAgICBpbml0TGF5ZXJJblNlZXIobmV3TGF5ZXIpOyAvLyBJbml0aWFsaXplcyBsYXllciBpbiBzZWVyIGNocm9tZSBleHRlbnNpb24gKGlmIGNvbm5lY3RlZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl90cmFuc2ZlckxheWVyU3RhdGUob2xkTGF5ZXIsIG5ld0xheWVyKTtcbiAgICAgICAgICB0aGlzLl91cGRhdGVMYXllcihuZXdMYXllcik7XG4gICAgICAgICAgdXBkYXRlTGF5ZXJJblNlZXIobmV3TGF5ZXIpOyAvLyBVcGRhdGVzIGxheWVyIGluIHNlZXIgY2hyb21lIGV4dGVuc2lvbiAoaWYgY29ubmVjdGVkKVxuICAgICAgICB9XG4gICAgICAgIGdlbmVyYXRlZExheWVycy5wdXNoKG5ld0xheWVyKTtcblxuICAgICAgICAvLyBDYWxsIGxheWVyIGxpZmVjeWNsZSBtZXRob2Q6IHJlbmRlciBzdWJsYXllcnNcbiAgICAgICAgc3VibGF5ZXJzID0gbmV3TGF5ZXIuaXNDb21wb3NpdGUgJiYgbmV3TGF5ZXIuZ2V0U3ViTGF5ZXJzKCk7XG4gICAgICAgIC8vIEVuZCBsYXllciBsaWZlY3ljbGUgbWV0aG9kOiByZW5kZXIgc3VibGF5ZXJzXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLndhcm4oYGVycm9yIGR1cmluZyBtYXRjaGluZyBvZiAke2xheWVyTmFtZShuZXdMYXllcil9YCwgZXJyKTtcbiAgICAgICAgZXJyb3IgPSBlcnJvciB8fCBlcnI7IC8vIFJlY29yZCBmaXJzdCBleGNlcHRpb25cbiAgICAgIH1cblxuICAgICAgaWYgKHN1YmxheWVycykge1xuICAgICAgICB0aGlzLl91cGRhdGVTdWJsYXllcnNSZWN1cnNpdmVseSh7XG4gICAgICAgICAgbmV3TGF5ZXJzOiBzdWJsYXllcnMsXG4gICAgICAgICAgb2xkTGF5ZXJNYXAsXG4gICAgICAgICAgZ2VuZXJhdGVkTGF5ZXJzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIC8vIEZpbmFsaXplIGFueSBvbGQgbGF5ZXJzIHRoYXQgd2VyZSBub3QgbWF0Y2hlZFxuICBfZmluYWxpemVPbGRMYXllcnMob2xkTGF5ZXJNYXApIHtcbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgIGZvciAoY29uc3QgbGF5ZXJJZCBpbiBvbGRMYXllck1hcCkge1xuICAgICAgY29uc3QgbGF5ZXIgPSBvbGRMYXllck1hcFtsYXllcklkXTtcbiAgICAgIGlmIChsYXllcikge1xuICAgICAgICBlcnJvciA9IGVycm9yIHx8IHRoaXMuX2ZpbmFsaXplTGF5ZXIobGF5ZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvLyBJbml0aWFsaXplcyBhIHNpbmdsZSBsYXllciwgY2FsbGluZyBsYXllciBtZXRob2RzXG4gIF9pbml0aWFsaXplTGF5ZXIobGF5ZXIpIHtcbiAgICBhc3NlcnQoIWxheWVyLnN0YXRlKTtcbiAgICBsb2coTE9HX1BSSU9SSVRZX0xJRkVDWUNMRSwgYGluaXRpYWxpemluZyAke2xheWVyTmFtZShsYXllcil9YCk7XG5cbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBsYXllci5faW5pdGlhbGl6ZSgpO1xuICAgICAgbGF5ZXIubGlmZWN5Y2xlID0gTElGRUNZQ0xFLklOSVRJQUxJWkVEO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nLndhcm4oYGVycm9yIHdoaWxlIGluaXRpYWxpemluZyAke2xheWVyTmFtZShsYXllcil9XFxuYCwgZXJyKTtcbiAgICAgIGVycm9yID0gZXJyb3IgfHwgZXJyO1xuICAgICAgLy8gVE9ETyAtIHdoYXQgc2hvdWxkIHRoZSBsaWZlY3ljbGUgc3RhdGUgYmUgaGVyZT8gTElGRUNZQ0xFLklOSVRJQUxJWkFUSU9OX0ZBSUxFRD9cbiAgICB9XG5cbiAgICBhc3NlcnQobGF5ZXIuc3RhdGUpO1xuXG4gICAgLy8gU2V0IGJhY2sgcG9pbnRlciAodXNlZCBpbiBwaWNraW5nKVxuICAgIGxheWVyLnN0YXRlLmxheWVyID0gbGF5ZXI7XG5cbiAgICAvLyBTYXZlIGxheWVyIG9uIG1vZGVsIGZvciBwaWNraW5nIHB1cnBvc2VzXG4gICAgLy8gc3RvcmUgb24gbW9kZWwudXNlckRhdGEgcmF0aGVyIHRoYW4gZGlyZWN0bHkgb24gbW9kZWxcbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIGxheWVyLmdldE1vZGVscygpKSB7XG4gICAgICBtb2RlbC51c2VyRGF0YS5sYXllciA9IGxheWVyO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIF90cmFuc2ZlckxheWVyU3RhdGUob2xkTGF5ZXIsIG5ld0xheWVyKSB7XG4gICAgaWYgKG5ld0xheWVyICE9PSBvbGRMYXllcikge1xuICAgICAgbG9nKExPR19QUklPUklUWV9MSUZFQ1lDTEVfTUlOT1IsIGBtYXRjaGVkICR7bGF5ZXJOYW1lKG5ld0xheWVyKX1gLCBvbGRMYXllciwgJy0+JywgbmV3TGF5ZXIpO1xuICAgICAgbmV3TGF5ZXIubGlmZWN5Y2xlID0gTElGRUNZQ0xFLk1BVENIRUQ7XG4gICAgICBvbGRMYXllci5saWZlY3ljbGUgPSBMSUZFQ1lDTEUuQVdBSVRJTkdfR0M7XG4gICAgICBuZXdMYXllci5fdHJhbnNmZXJTdGF0ZShvbGRMYXllcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZy5sb2coTE9HX1BSSU9SSVRZX0xJRkVDWUNMRV9NSU5PUiwgYE1hdGNoaW5nIGxheWVyIGlzIHVuY2hhbmdlZCAke25ld0xheWVyLmlkfWApO1xuICAgICAgbmV3TGF5ZXIubGlmZWN5Y2xlID0gTElGRUNZQ0xFLk1BVENIRUQ7XG4gICAgICBuZXdMYXllci5vbGRQcm9wcyA9IG5ld0xheWVyLnByb3BzO1xuICAgIH1cbiAgfVxuXG4gIC8vIFVwZGF0ZXMgYSBzaW5nbGUgbGF5ZXIsIGNsZWFuaW5nIGFsbCBmbGFnc1xuICBfdXBkYXRlTGF5ZXIobGF5ZXIpIHtcbiAgICBsb2cubG9nKExPR19QUklPUklUWV9MSUZFQ1lDTEVfTUlOT1IsIGB1cGRhdGluZyAke2xheWVyfSBiZWNhdXNlOiAke2xheWVyLnByaW50Q2hhbmdlRmxhZ3MoKX1gKTtcbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBsYXllci5fdXBkYXRlKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2cud2FybihgZXJyb3IgZHVyaW5nIHVwZGF0ZSBvZiAke2xheWVyTmFtZShsYXllcil9YCwgZXJyKTtcbiAgICAgIC8vIFNhdmUgZmlyc3QgZXJyb3JcbiAgICAgIGVycm9yID0gZXJyO1xuICAgIH1cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvLyBGaW5hbGl6ZXMgYSBzaW5nbGUgbGF5ZXJcbiAgX2ZpbmFsaXplTGF5ZXIobGF5ZXIpIHtcbiAgICBhc3NlcnQobGF5ZXIuc3RhdGUpO1xuICAgIGFzc2VydChsYXllci5saWZlY3ljbGUgIT09IExJRkVDWUNMRS5BV0FJVElOR19GSU5BTElaQVRJT04pO1xuICAgIGxheWVyLmxpZmVjeWNsZSA9IExJRkVDWUNMRS5BV0FJVElOR19GSU5BTElaQVRJT047XG4gICAgbGV0IGVycm9yID0gbnVsbDtcbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KGBmaW5hbGl6ZWQgJHtsYXllck5hbWUobGF5ZXIpfWApO1xuICAgIHRyeSB7XG4gICAgICBsYXllci5fZmluYWxpemUoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZy53YXJuKGBlcnJvciBkdXJpbmcgZmluYWxpemF0aW9uIG9mICR7bGF5ZXJOYW1lKGxheWVyKX1gLCBlcnIpO1xuICAgICAgZXJyb3IgPSBlcnI7XG4gICAgfVxuICAgIGxheWVyLmxpZmVjeWNsZSA9IExJRkVDWUNMRS5GSU5BTElaRUQ7XG4gICAgbG9nKExPR19QUklPUklUWV9MSUZFQ1lDTEUsIGBmaW5hbGl6aW5nICR7bGF5ZXJOYW1lKGxheWVyKX1gKTtcbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvKipcbiAgICogV2FybiBpZiBhIGRlY2stbGV2ZWwgbW91c2UgZXZlbnQgaGFzIGJlZW4gc3BlY2lmaWVkLFxuICAgKiBidXQgbm8gbGF5ZXJzIGFyZSBgcGlja2FibGVgLlxuICAgKi9cbiAgX3ZhbGlkYXRlRXZlbnRIYW5kbGluZygpIHtcbiAgICBpZiAodGhpcy5vbkxheWVyQ2xpY2sgfHwgdGhpcy5vbkxheWVySG92ZXIpIHtcbiAgICAgIGlmICh0aGlzLmxheWVycy5sZW5ndGggJiYgIXRoaXMubGF5ZXJzLnNvbWUobGF5ZXIgPT4gbGF5ZXIucHJvcHMucGlja2FibGUpKSB7XG4gICAgICAgIGxvZy53YXJuKFxuICAgICAgICAgICdZb3UgaGF2ZSBzdXBwbGllZCBhIHRvcC1sZXZlbCBpbnB1dCBldmVudCBoYW5kbGVyIChlLmcuIGBvbkxheWVyQ2xpY2tgKSwgJyArXG4gICAgICAgICAgICAnYnV0IG5vbmUgb2YgeW91ciBsYXllcnMgaGF2ZSBzZXQgdGhlIGBwaWNrYWJsZWAgZmxhZy4nXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJvdXRlIGNsaWNrIGV2ZW50cyB0byBsYXllcnMuXG4gICAqIGBwaWNrTGF5ZXJgIHdpbGwgY2FsbCB0aGUgYG9uQ2xpY2tgIHByb3Agb2YgYW55IHBpY2tlZCBsYXllcixcbiAgICogYW5kIGBvbkxheWVyQ2xpY2tgIGlzIGNhbGxlZCBkaXJlY3RseSBmcm9tIGhlcmVcbiAgICogd2l0aCBhbnkgcGlja2luZyBpbmZvIGdlbmVyYXRlZCBieSBgcGlja0xheWVyYC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50ICBBbiBvYmplY3QgZW5jYXBzdWxhdGluZyBhbiBpbnB1dCBldmVudCxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICB3aXRoIHRoZSBmb2xsb3dpbmcgc2hhcGU6XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAge09iamVjdDoge3gsIHl9fSBvZmZzZXRDZW50ZXI6IGNlbnRlciBvZiB0aGUgZXZlbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICB7T2JqZWN0fSBzcmNFdmVudDogICAgICAgICAgICAgbmF0aXZlIEpTIEV2ZW50IG9iamVjdFxuICAgKi9cbiAgX29uQ2xpY2soZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50Lm9mZnNldENlbnRlcikge1xuICAgICAgLy8gRG8gbm90IHRyaWdnZXIgb25Ib3ZlciBjYWxsYmFja3Mgd2hlbiBjbGljayBwb3NpdGlvbiBpcyBpbnZhbGlkLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9waWNrQW5kQ2FsbGJhY2soe1xuICAgICAgY2FsbGJhY2s6IHRoaXMuX29uTGF5ZXJDbGljayxcbiAgICAgIGV2ZW50LFxuICAgICAgbW9kZTogJ2NsaWNrJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJvdXRlIGNsaWNrIGV2ZW50cyB0byBsYXllcnMuXG4gICAqIGBwaWNrTGF5ZXJgIHdpbGwgY2FsbCB0aGUgYG9uSG92ZXJgIHByb3Agb2YgYW55IHBpY2tlZCBsYXllcixcbiAgICogYW5kIGBvbkxheWVySG92ZXJgIGlzIGNhbGxlZCBkaXJlY3RseSBmcm9tIGhlcmVcbiAgICogd2l0aCBhbnkgcGlja2luZyBpbmZvIGdlbmVyYXRlZCBieSBgcGlja0xheWVyYC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50ICBBbiBvYmplY3QgZW5jYXBzdWxhdGluZyBhbiBpbnB1dCBldmVudCxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICB3aXRoIHRoZSBmb2xsb3dpbmcgc2hhcGU6XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAge09iamVjdDoge3gsIHl9fSBvZmZzZXRDZW50ZXI6IGNlbnRlciBvZiB0aGUgZXZlbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICB7T2JqZWN0fSBzcmNFdmVudDogICAgICAgICAgICAgbmF0aXZlIEpTIEV2ZW50IG9iamVjdFxuICAgKi9cbiAgX29uUG9pbnRlck1vdmUoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQubGVmdEJ1dHRvbiB8fCBldmVudC5yaWdodEJ1dHRvbikge1xuICAgICAgLy8gRG8gbm90IHRyaWdnZXIgb25Ib3ZlciBjYWxsYmFja3MgaWYgbW91c2UgYnV0dG9uIGlzIGRvd24uXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3BpY2tBbmRDYWxsYmFjayh7XG4gICAgICBjYWxsYmFjazogdGhpcy5fb25MYXllckhvdmVyLFxuICAgICAgZXZlbnQsXG4gICAgICBtb2RlOiAnaG92ZXInXG4gICAgfSk7XG4gIH1cblxuICBfb25Qb2ludGVyTGVhdmUoZXZlbnQpIHtcbiAgICB0aGlzLnBpY2tPYmplY3Qoe1xuICAgICAgeDogLTEsXG4gICAgICB5OiAtMSxcbiAgICAgIHJhZGl1czogdGhpcy5fcGlja2luZ1JhZGl1cyxcbiAgICAgIG1vZGU6ICdob3ZlcidcbiAgICB9KTtcbiAgfVxuXG4gIF9waWNrQW5kQ2FsbGJhY2sob3B0aW9ucykge1xuICAgIGNvbnN0IHBvcyA9IG9wdGlvbnMuZXZlbnQub2Zmc2V0Q2VudGVyO1xuICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX3BpY2tpbmdSYWRpdXM7XG4gICAgY29uc3Qgc2VsZWN0ZWRJbmZvcyA9IHRoaXMucGlja09iamVjdCh7eDogcG9zLngsIHk6IHBvcy55LCByYWRpdXMsIG1vZGU6IG9wdGlvbnMubW9kZX0pO1xuICAgIGlmIChvcHRpb25zLmNhbGxiYWNrKSB7XG4gICAgICBjb25zdCBmaXJzdEluZm8gPSBzZWxlY3RlZEluZm9zLmZpbmQoaW5mbyA9PiBpbmZvLmluZGV4ID49IDApIHx8IG51bGw7XG4gICAgICAvLyBBcyBwZXIgZG9jdW1lbnRhdGlvbiwgc2VuZCBudWxsIHZhbHVlIHdoZW4gbm8gdmFsaWQgb2JqZWN0IGlzIHBpY2tlZC5cbiAgICAgIG9wdGlvbnMuY2FsbGJhY2soZmlyc3RJbmZvLCBzZWxlY3RlZEluZm9zLCBvcHRpb25zLmV2ZW50LnNyY0V2ZW50KTtcbiAgICB9XG4gIH1cblxuICAvLyBTRUVSIElOVEVHUkFUSU9OXG5cbiAgLyoqXG4gICAqIENhbGxlZCB1cG9uIFNlZXIgaW5pdGlhbGl6YXRpb24sIG1hbnVhbGx5IHNlbmRzIGxheWVycyBkYXRhLlxuICAgKi9cbiAgX2luaXRTZWVyKCkge1xuICAgIHRoaXMubGF5ZXJzLmZvckVhY2gobGF5ZXIgPT4ge1xuICAgICAgaW5pdExheWVySW5TZWVyKGxheWVyKTtcbiAgICAgIHVwZGF0ZUxheWVySW5TZWVyKGxheWVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPbiBTZWVyIHByb3BlcnR5IGVkaXRpb24sIHNldCBvdmVycmlkZSBhbmQgdXBkYXRlIGxheWVycy5cbiAgICovXG4gIF9lZGl0U2VlcihwYXlsb2FkKSB7XG4gICAgaWYgKHBheWxvYWQudHlwZSAhPT0gJ2VkaXQnIHx8IHBheWxvYWQudmFsdWVQYXRoWzBdICE9PSAncHJvcHMnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0UHJvcE92ZXJyaWRlcyhwYXlsb2FkLml0ZW1LZXksIHBheWxvYWQudmFsdWVQYXRoLnNsaWNlKDEpLCBwYXlsb2FkLnZhbHVlKTtcbiAgICBjb25zdCBuZXdMYXllcnMgPSB0aGlzLmxheWVycy5tYXAobGF5ZXIgPT4gbmV3IGxheWVyLmNvbnN0cnVjdG9yKGxheWVyLnByb3BzKSk7XG4gICAgdGhpcy51cGRhdGVMYXllcnMoe25ld0xheWVyc30pO1xuICB9XG59XG4iXX0=