'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

/* global window */


var _constants = require('./constants');

var _attributeManager = require('./attribute-manager');

var _attributeManager2 = _interopRequireDefault(_attributeManager);

var _stats = require('./stats');

var _stats2 = _interopRequireDefault(_stats);

var _count = require('../utils/count');

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _createProps = require('../lifecycle/create-props');

var _props2 = require('../lifecycle/props');

var _seerIntegration = require('./seer-integration');

var _luma = require('luma.gl');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LOG_PRIORITY_UPDATE = 1;
var EMPTY_PROPS = Object.freeze({});
var noop = function noop() {};

var defaultProps = {
  // data: Special handling for null, see below
  dataComparator: null,
  updateTriggers: {}, // Update triggers: a core change detection mechanism in deck.gl
  numInstances: undefined,

  visible: true,
  pickable: false,
  opacity: 0.8,

  onHover: noop,
  onClick: noop,

  coordinateSystem: _constants.COORDINATE_SYSTEM.LNGLAT,
  coordinateOrigin: [0, 0, 0],

  parameters: {},
  uniforms: {},
  framebuffer: null,

  animation: null, // Passed prop animation functions to evaluate props

  // Offset depth based on layer index to avoid z-fighting.
  // Negative values pull layer towards the camera
  // https://www.opengl.org/archives/resources/faq/technical/polygonoffset.htm
  getPolygonOffset: function getPolygonOffset(_ref) {
    var layerIndex = _ref.layerIndex;
    return [0, -layerIndex * 100];
  },

  // Selection/Highlighting
  highlightedObjectIndex: null,
  autoHighlight: false,
  highlightColor: [0, 0, 128, 128]
};

var counter = 0;

var Layer = function () {
  // constructor(...propObjects)
  function Layer() {
    _classCallCheck(this, Layer);

    // Merges incoming props with defaults and freezes them.
    // TODO switch to spread operator once we no longer transpile this code
    // this.props = createProps.apply(propObjects);
    /* eslint-disable prefer-spread */
    this.props = _createProps.createProps.apply(this, arguments);
    /* eslint-enable prefer-spread */

    // Define all members before layer is sealed
    this.id = this.props.id; // The layer's id, used for matching with layers from last render cycle
    this.oldProps = EMPTY_PROPS; // Props from last render used for change detection
    this.count = counter++; // Keep track of how many layer instances you are generating
    this.lifecycle = _constants.LIFECYCLE.NO_STATE; // Helps track and debug the life cycle of the layers
    this.state = null; // Will be set to the shared layer state object during layer matching
    this.context = null; // Will reference layer manager's context, contains state shared by layers
    this.parentLayer = null; // reference to the composite layer parent that rendered this layer

    // CompositeLayer members, need to be defined here because of the `Object.seal`
    this.internalState = null;

    // Seal the layer
    Object.seal(this);
  }

  // clone this layer with modified props


  _createClass(Layer, [{
    key: 'clone',
    value: function clone(newProps) {
      return new this.constructor(Object.assign({}, this.props, newProps));
    }
  }, {
    key: 'toString',
    value: function toString() {
      var className = this.constructor.layerName || this.constructor.name;
      return className + '({id: \'' + this.props.id + '\'})';
    }
  }, {
    key: 'setState',


    // Public API

    // Updates selected state members and marks the object for redraw
    value: function setState(updateObject) {
      Object.assign(this.state, updateObject);
      this.state.needsRedraw = true;
    }

    // Sets the redraw flag for this layer, will trigger a redraw next animation frame

  }, {
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (this.state) {
        this.state.needsRedraw = redraw;
      }
    }

    // Checks state of attributes and model

  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$clearRedrawFlag = _ref2.clearRedrawFlags,
          clearRedrawFlags = _ref2$clearRedrawFlag === undefined ? false : _ref2$clearRedrawFlag;

      return this._getNeedsRedraw(clearRedrawFlags);
    }

    // Return an array of models used by this layer, can be overriden by layer subclass

  }, {
    key: 'getModels',
    value: function getModels() {
      return this.state.models || (this.state.model ? [this.state.model] : []);
    }
  }, {
    key: 'needsUpdate',
    value: function needsUpdate() {
      // Call subclass lifecycle method
      return this.shouldUpdateState(this._getUpdateParams());
      // End lifecycle method
    }

    // Returns true if the layer is pickable and visible.

  }, {
    key: 'isPickable',
    value: function isPickable() {
      return this.props.pickable && this.props.visible;
    }
  }, {
    key: 'getAttributeManager',
    value: function getAttributeManager() {
      return this.state && this.state.attributeManager;
    }

    // Use iteration (the only required capability on data) to get first element
    // deprecated

  }, {
    key: 'getFirstObject',
    value: function getFirstObject() {
      var data = this.props.data;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          return object;
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

      return null;
    }

    // PROJECTION METHODS

    /**
     * Projects a point with current map state (lat, lon, zoom, pitch, bearing)
     *
     * Note: Position conversion is done in shader, so in many cases there is no need
     * for this function
     * @param {Array|TypedArray} lngLat - long and lat values
     * @return {Array|TypedArray} - x, y coordinates
     */

  }, {
    key: 'project',
    value: function project(lngLat) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(lngLat), 'Layer.project needs [lng,lat]');
      return viewport.project(lngLat);
    }
  }, {
    key: 'unproject',
    value: function unproject(xy) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(xy), 'Layer.unproject needs [x,y]');
      return viewport.unproject(xy);
    }
  }, {
    key: 'projectFlat',
    value: function projectFlat(lngLat) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(lngLat), 'Layer.project needs [lng,lat]');
      return viewport.projectFlat(lngLat);
    }
  }, {
    key: 'unprojectFlat',
    value: function unprojectFlat(xy) {
      var viewport = this.context.viewport;

      (0, _assert2.default)(Array.isArray(xy), 'Layer.unproject needs [x,y]');
      return viewport.unprojectFlat(xy);
    }

    // TODO - needs to refer to context

  }, {
    key: 'screenToDevicePixels',
    value: function screenToDevicePixels(screenPixels) {
      _log2.default.deprecated('screenToDevicePixels', 'DeckGL prop useDevicePixels for conversion');
      var devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      return screenPixels * devicePixelRatio;
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @return {Array} - a black color
     */

  }, {
    key: 'nullPickingColor',
    value: function nullPickingColor() {
      return [0, 0, 0];
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @param {int} i - index to be decoded
     * @return {Array} - the decoded color
     */

  }, {
    key: 'encodePickingColor',
    value: function encodePickingColor(i) {
      (0, _assert2.default)((i + 1 >> 24 & 255) === 0, 'index out of picking color range');
      return [i + 1 & 255, i + 1 >> 8 & 255, i + 1 >> 8 >> 8 & 255];
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @param {Uint8Array} color - color array to be decoded
     * @return {Array} - the decoded picking color
     */

  }, {
    key: 'decodePickingColor',
    value: function decodePickingColor(color) {
      (0, _assert2.default)(color instanceof Uint8Array);

      var _color = _slicedToArray(color, 3),
          i1 = _color[0],
          i2 = _color[1],
          i3 = _color[2];
      // 1 was added to seperate from no selection


      var index = i1 + i2 * 256 + i3 * 65536 - 1;
      return index;
    }

    // //////////////////////////////////////////////////
    // LIFECYCLE METHODS, overridden by the layer subclasses

    // Called once to set up the initial state
    // App can create WebGL resources

  }, {
    key: 'initializeState',
    value: function initializeState() {
      throw new Error('Layer ' + this + ' has not defined initializeState');
    }

    // Let's layer control if updateState should be called

  }, {
    key: 'shouldUpdateState',
    value: function shouldUpdateState(_ref3) {
      var oldProps = _ref3.oldProps,
          props = _ref3.props,
          oldContext = _ref3.oldContext,
          context = _ref3.context,
          changeFlags = _ref3.changeFlags;

      return changeFlags.propsOrDataChanged;
    }

    // Default implementation, all attributes will be invalidated and updated
    // when data changes

  }, {
    key: 'updateState',
    value: function updateState(_ref4) {
      var oldProps = _ref4.oldProps,
          props = _ref4.props,
          oldContext = _ref4.oldContext,
          context = _ref4.context,
          changeFlags = _ref4.changeFlags;

      var attributeManager = this.getAttributeManager();
      if (changeFlags.dataChanged && attributeManager) {
        attributeManager.invalidateAll();
      }
    }

    // Called once when layer is no longer matched and state will be discarded
    // App can destroy WebGL resources here

  }, {
    key: 'finalizeState',
    value: function finalizeState() {}

    // Update attribute transition

  }, {
    key: 'updateTransition',
    value: function updateTransition() {
      var _state = this.state,
          model = _state.model,
          attributeManager = _state.attributeManager;

      var isInTransition = attributeManager && attributeManager.updateTransition();

      if (model && isInTransition) {
        model.setAttributes(attributeManager.getChangedAttributes({ transition: true }));
      }
    }

    // If state has a model, draw it with supplied uniforms

  }, {
    key: 'draw',
    value: function draw(opts) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.getModels()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var model = _step2.value;

          model.draw(opts);
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

    // called to populate the info object that is passed to the event handler
    // @return null to cancel event

  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref5) {
      var info = _ref5.info,
          mode = _ref5.mode;
      var index = info.index;


      if (index >= 0) {
        // If props.data is an indexable array, get the object
        if (Array.isArray(this.props.data)) {
          info.object = this.props.data[index];
        }
      }

      return info;
    }

    // END LIFECYCLE METHODS
    // //////////////////////////////////////////////////

    // Default implementation of attribute invalidation, can be redefined

  }, {
    key: 'invalidateAttribute',
    value: function invalidateAttribute() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'all';
      var diffReason = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      var attributeManager = this.getAttributeManager();
      if (!attributeManager) {
        return;
      }

      if (name === 'all') {
        _log2.default.log(LOG_PRIORITY_UPDATE, 'updateTriggers invalidating all attributes: ' + diffReason);
        attributeManager.invalidateAll();
      } else {
        _log2.default.log(LOG_PRIORITY_UPDATE, 'updateTriggers invalidating attribute ' + name + ': ' + diffReason);
        attributeManager.invalidate(name);
      }
    }

    // Calls attribute manager to update any WebGL attributes, can be redefined

  }, {
    key: 'updateAttributes',
    value: function updateAttributes(props) {
      var attributeManager = this.getAttributeManager();
      if (!attributeManager) {
        return;
      }

      // Figure out data length
      var numInstances = this.getNumInstances(props);

      attributeManager.update({
        data: props.data,
        numInstances: numInstances,
        props: props,
        transitions: props.transitions,
        buffers: props,
        context: this,
        // Don't worry about non-attribute props
        ignoreUnknownAttributes: true
      });

      // TODO - Use getModels?
      var model = this.state.model;

      if (model) {
        var changedAttributes = attributeManager.getChangedAttributes({ clearChangedFlags: true });
        model.setAttributes(changedAttributes);
      }
    }
  }, {
    key: 'calculateInstancePickingColors',
    value: function calculateInstancePickingColors(attribute, _ref6) {
      var numInstances = _ref6.numInstances;
      var value = attribute.value,
          size = attribute.size;
      // add 1 to index to seperate from no selection

      for (var i = 0; i < numInstances; i++) {
        var pickingColor = this.encodePickingColor(i);
        value[i * size + 0] = pickingColor[0];
        value[i * size + 1] = pickingColor[1];
        value[i * size + 2] = pickingColor[2];
      }
    }

    // INTERNAL METHODS

    // Deduces numer of instances. Intention is to support:
    // - Explicit setting of numInstances
    // - Auto-deduction for ES6 containers that define a size member
    // - Auto-deduction for Classic Arrays via the built-in length attribute
    // - Auto-deduction via arrays

  }, {
    key: 'getNumInstances',
    value: function getNumInstances(props) {
      props = props || this.props;

      // First check if the layer has set its own value
      if (this.state && this.state.numInstances !== undefined) {
        return this.state.numInstances;
      }

      // Check if app has provided an explicit value
      if (props.numInstances !== undefined) {
        return props.numInstances;
      }

      // Use container library to get a count for any ES6 container or object
      var _props = props,
          data = _props.data;

      return (0, _count.count)(data);
    }

    // LAYER MANAGER API
    // Should only be called by the deck.gl LayerManager class

    // Called by layer manager when a new layer is found
    /* eslint-disable max-statements */

  }, {
    key: '_initialize',
    value: function _initialize() {
      (0, _assert2.default)(arguments.length === 0);
      (0, _assert2.default)(this.context.gl);
      (0, _assert2.default)(!this.state);

      var attributeManager = new _attributeManager2.default(this.context.gl, {
        id: this.props.id
      });

      // All instanced layers get instancePickingColors attribute by default
      // Their shaders can use it to render a picking scene
      // TODO - this slightly slows down non instanced layers
      attributeManager.addInstanced({
        instancePickingColors: {
          type: _luma.GL.UNSIGNED_BYTE,
          size: 3,
          update: this.calculateInstancePickingColors
        }
      });

      this.internalState = {
        subLayers: null, // reference to sublayers rendered in a previous cycle
        stats: new _stats2.default({ id: 'draw' })
        // animatedProps: null, // Computing animated props requires layer manager state
        // TODO - move these fields here (risks breaking layers)
        // attributeManager,
        // needsRedraw: true,
      };

      this.state = {
        attributeManager: attributeManager,
        model: null,
        needsRedraw: true
      };

      // Call subclass lifecycle methods
      this.initializeState(this.context);
      // End subclass lifecycle methods

      // initializeState callback tends to clear state
      this.setChangeFlags({ dataChanged: true, propsChanged: true, viewportChanged: true });

      this._updateState(this._getUpdateParams());

      if (this.isComposite) {
        this._renderLayers(true);
      }

      var model = this.state.model;

      if (model) {
        model.id = this.props.id;
        model.program.id = this.props.id + '-program';
        model.geometry.id = this.props.id + '-geometry';
        model.setAttributes(attributeManager.getAttributes());
      }

      // Last but not least, update any sublayers
      if (this.isComposite) {
        this._renderLayers();
      }

      this.clearChangeFlags();
    }

    // Called by layer manager
    // if this layer is new (not matched with an existing layer) oldProps will be empty object

  }, {
    key: '_update',
    value: function _update() {
      (0, _assert2.default)(arguments.length === 0);

      // Call subclass lifecycle method
      var stateNeedsUpdate = this.needsUpdate();
      // End lifecycle method

      var updateParams = {
        props: this.props,
        oldProps: this.oldProps,
        context: this.context,
        oldContext: this.oldContext,
        changeFlags: this.internalState.changeFlags
      };

      if (stateNeedsUpdate) {
        this._updateState(updateParams);
      }

      // Render or update previously rendered sublayers
      if (this.isComposite) {
        this._renderLayers(stateNeedsUpdate);
      }

      this.clearChangeFlags();
    }
    /* eslint-enable max-statements */

  }, {
    key: '_updateState',
    value: function _updateState(updateParams) {
      // Call subclass lifecycle methods
      this.updateState(updateParams);
      // End subclass lifecycle methods

      // Add any subclass attributes
      this.updateAttributes(this.props);
      this._updateBaseUniforms();
      this._updateModuleSettings();

      // Note: Automatic instance count update only works for single layers
      if (this.state.model) {
        this.state.model.setInstanceCount(this.getNumInstances());
      }
    }

    // Called by manager when layer is about to be disposed
    // Note: not guaranteed to be called on application shutdown

  }, {
    key: '_finalize',
    value: function _finalize() {
      (0, _assert2.default)(arguments.length === 0);
      // Call subclass lifecycle method
      this.finalizeState(this.context);
      // End lifecycle method
      (0, _seerIntegration.removeLayerInSeer)(this.id);
    }

    // Calculates uniforms

  }, {
    key: 'drawLayer',
    value: function drawLayer(_ref7) {
      var _this = this;

      var _ref7$moduleParameter = _ref7.moduleParameters,
          moduleParameters = _ref7$moduleParameter === undefined ? null : _ref7$moduleParameter,
          _ref7$uniforms = _ref7.uniforms,
          uniforms = _ref7$uniforms === undefined ? {} : _ref7$uniforms,
          _ref7$parameters = _ref7.parameters,
          parameters = _ref7$parameters === undefined ? {} : _ref7$parameters;

      if (!uniforms.picking_uActive) {
        this.updateTransition();
      }

      // TODO/ib - hack move to luma Model.draw
      if (moduleParameters) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this.getModels()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var model = _step3.value;

            model.updateModuleSettings(moduleParameters);
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

      // Apply polygon offset to avoid z-fighting
      // TODO - move to draw-layers
      var getPolygonOffset = this.props.getPolygonOffset;

      var offsets = getPolygonOffset && getPolygonOffset(uniforms) || [0, 0];
      parameters.polygonOffset = offsets;

      // Call subclass lifecycle method
      (0, _luma.withParameters)(this.context.gl, parameters, function () {
        _this.draw({ moduleParameters: moduleParameters, uniforms: uniforms, parameters: parameters, context: _this.context });
      });
      // End lifecycle method
    }

    // {uniforms = {}, ...opts}

  }, {
    key: 'pickLayer',
    value: function pickLayer(opts) {
      // Call subclass lifecycle method
      return this.getPickingInfo(opts);
      // End lifecycle method
    }

    // Helper methods

  }, {
    key: 'getChangeFlags',
    value: function getChangeFlags() {
      return this.internalState.changeFlags;
    }

    // Dirty some change flags, will be handled by updateLayer
    /* eslint-disable complexity */

  }, {
    key: 'setChangeFlags',
    value: function setChangeFlags(flags) {
      var _this2 = this;

      this.internalState.changeFlags = this.internalState.changeFlags || {};
      var changeFlags = this.internalState.changeFlags;

      // Update primary flags
      if (flags.dataChanged && !changeFlags.dataChanged) {
        changeFlags.dataChanged = flags.dataChanged;
        _log2.default.log(LOG_PRIORITY_UPDATE + 1, function () {
          return 'dataChanged: ' + flags.dataChanged + ' in ' + _this2.id;
        });
      }
      if (flags.updateTriggersChanged && !changeFlags.updateTriggersChanged) {
        changeFlags.updateTriggersChanged = changeFlags.updateTriggersChanged && flags.updateTriggersChanged ? Object.assign({}, flags.updateTriggersChanged, changeFlags.updateTriggersChanged) : flags.updateTriggersChanged || changeFlags.updateTriggersChanged;
        _log2.default.log(LOG_PRIORITY_UPDATE + 1, function () {
          return 'updateTriggersChanged: ' + (Object.keys(flags.updateTriggersChanged).join(', ') + ' in ' + _this2.id);
        });
      }
      if (flags.propsChanged && !changeFlags.propsChanged) {
        changeFlags.propsChanged = flags.propsChanged;
        _log2.default.log(LOG_PRIORITY_UPDATE + 1, function () {
          return 'propsChanged: ' + flags.propsChanged + ' in ' + _this2.id;
        });
      }
      if (flags.viewportChanged && !changeFlags.viewportChanged) {
        changeFlags.viewportChanged = flags.viewportChanged;
        _log2.default.log(LOG_PRIORITY_UPDATE + 2, function () {
          return 'viewportChanged: ' + flags.viewportChanged + ' in ' + _this2.id;
        });
      }

      // Update composite flags
      var propsOrDataChanged = flags.dataChanged || flags.updateTriggersChanged || flags.propsChanged;
      changeFlags.propsOrDataChanged = changeFlags.propsOrDataChanged || propsOrDataChanged;
      changeFlags.somethingChanged = changeFlags.somethingChanged || propsOrDataChanged || flags.viewportChanged;
    }
    /* eslint-enable complexity */

    // Clear all changeFlags, typically after an update

  }, {
    key: 'clearChangeFlags',
    value: function clearChangeFlags() {
      this.internalState.changeFlags = {
        // Primary changeFlags, can be strings stating reason for change
        dataChanged: false,
        propsChanged: false,
        updateTriggersChanged: false,
        viewportChanged: false,

        // Derived changeFlags
        propsOrDataChanged: false,
        somethingChanged: false
      };
    }
  }, {
    key: 'printChangeFlags',
    value: function printChangeFlags() {
      var flags = this.internalState.changeFlags;
      return '' + (flags.dataChanged ? 'data ' : '') + (flags.propsChanged ? 'props ' : '') + (flags.updateTriggersChanged ? 'triggers ' : '') + (flags.viewportChanged ? 'viewport' : '');
    }

    // Compares the layers props with old props from a matched older layer
    // and extracts change flags that describe what has change so that state
    // can be update correctly with minimal effort
    // TODO - arguments for testing only

  }, {
    key: 'diffProps',
    value: function diffProps() {
      var newProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.props;
      var oldProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.oldProps;

      var changeFlags = (0, _props2.diffProps)(newProps, oldProps);

      // iterate over changedTriggers
      if (changeFlags.updateTriggersChanged) {
        for (var key in changeFlags.updateTriggersChanged) {
          if (changeFlags.updateTriggersChanged[key]) {
            this._activeUpdateTrigger(key);
          }
        }
      }

      return this.setChangeFlags(changeFlags);
    }

    // PRIVATE METHODS

  }, {
    key: '_getUpdateParams',
    value: function _getUpdateParams() {
      return {
        props: this.props,
        oldProps: this.oldProps,
        context: this.context,
        oldContext: this.oldContext || {},
        changeFlags: this.internalState.changeFlags
      };
    }

    // Checks state of attributes and model

  }, {
    key: '_getNeedsRedraw',
    value: function _getNeedsRedraw(clearRedrawFlags) {
      // this method may be called by the render loop as soon a the layer
      // has been created, so guard against uninitialized state
      if (!this.state) {
        return false;
      }

      var redraw = false;
      redraw = redraw || this.state.needsRedraw && this.id;
      this.state.needsRedraw = this.state.needsRedraw && !clearRedrawFlags;

      // TODO - is attribute manager needed? - Model should be enough.
      var attributeManager = this.getAttributeManager();
      var attributeManagerNeedsRedraw = attributeManager && attributeManager.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
      redraw = redraw || attributeManagerNeedsRedraw;

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.getModels()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var model = _step4.value;

          var modelNeedsRedraw = model.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
          if (modelNeedsRedraw && typeof modelNeedsRedraw !== 'string') {
            modelNeedsRedraw = 'model ' + model.id;
          }
          redraw = redraw || modelNeedsRedraw;
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

      return redraw;
    }

    // Called by layer manager to transfer state from an old layer

  }, {
    key: '_transferState',
    value: function _transferState(oldLayer) {
      var state = oldLayer.state,
          internalState = oldLayer.internalState,
          props = oldLayer.props;

      (0, _assert2.default)(state && internalState);

      // Move state
      state.layer = this;
      this.state = state;
      this.internalState = internalState;
      // Note: We keep the state ref on old layers to support async actions
      // oldLayer.state = null;

      // Keep a temporary ref to the old props, for prop comparison
      this.oldProps = props;

      // Update model layer reference
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.getModels()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var model = _step5.value;

          model.userData.layer = this;
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

      this.diffProps();
    }

    // Operate on each changed triggers, will be called when an updateTrigger changes

  }, {
    key: '_activeUpdateTrigger',
    value: function _activeUpdateTrigger(propName) {
      this.invalidateAttribute(propName);
    }

    //  Helper to check that required props are supplied

  }, {
    key: '_checkRequiredProp',
    value: function _checkRequiredProp(propertyName, condition) {
      var value = this.props[propertyName];
      if (value === undefined) {
        throw new Error('Property ' + propertyName + ' undefined in layer ' + this);
      }
      if (condition && !condition(value)) {
        throw new Error('Bad property ' + propertyName + ' in layer ' + this);
      }
    }
  }, {
    key: '_updateBaseUniforms',
    value: function _updateBaseUniforms() {
      var uniforms = {
        // apply gamma to opacity to make it visually "linear"
        opacity: Math.pow(this.props.opacity, 1 / 2.2),
        ONE: 1.0
      };
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = this.getModels()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var model = _step6.value;

          model.setUniforms(uniforms);
        }

        // TODO - set needsRedraw on the model(s)?
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

      this.state.needsRedraw = true;
    }
  }, {
    key: '_updateModuleSettings',
    value: function _updateModuleSettings() {
      var settings = {
        pickingHighlightColor: this.props.highlightColor
      };
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.getModels()[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var model = _step7.value;

          model.updateModuleSettings(settings);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }

    // DEPRECATED METHODS

    // Updates selected state members and marks the object for redraw

  }, {
    key: 'setUniforms',
    value: function setUniforms(uniformMap) {
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = this.getModels()[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var model = _step8.value;

          model.setUniforms(uniformMap);
        }

        // TODO - set needsRedraw on the model(s)?
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }

      this.state.needsRedraw = true;
      _log2.default.deprecated('layer.setUniforms', 'model.setUniforms');
    }
  }, {
    key: 'stats',
    get: function get() {
      return this.internalState.stats;
    }
  }]);

  return Layer;
}();

exports.default = Layer;


Layer.layerName = 'Layer';
Layer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9sYXllci5qcyJdLCJuYW1lcyI6WyJMT0dfUFJJT1JJVFlfVVBEQVRFIiwiRU1QVFlfUFJPUFMiLCJPYmplY3QiLCJmcmVlemUiLCJub29wIiwiZGVmYXVsdFByb3BzIiwiZGF0YUNvbXBhcmF0b3IiLCJ1cGRhdGVUcmlnZ2VycyIsIm51bUluc3RhbmNlcyIsInVuZGVmaW5lZCIsInZpc2libGUiLCJwaWNrYWJsZSIsIm9wYWNpdHkiLCJvbkhvdmVyIiwib25DbGljayIsImNvb3JkaW5hdGVTeXN0ZW0iLCJMTkdMQVQiLCJjb29yZGluYXRlT3JpZ2luIiwicGFyYW1ldGVycyIsInVuaWZvcm1zIiwiZnJhbWVidWZmZXIiLCJhbmltYXRpb24iLCJnZXRQb2x5Z29uT2Zmc2V0IiwibGF5ZXJJbmRleCIsImhpZ2hsaWdodGVkT2JqZWN0SW5kZXgiLCJhdXRvSGlnaGxpZ2h0IiwiaGlnaGxpZ2h0Q29sb3IiLCJjb3VudGVyIiwiTGF5ZXIiLCJwcm9wcyIsImFwcGx5IiwiYXJndW1lbnRzIiwiaWQiLCJvbGRQcm9wcyIsImNvdW50IiwibGlmZWN5Y2xlIiwiTk9fU1RBVEUiLCJzdGF0ZSIsImNvbnRleHQiLCJwYXJlbnRMYXllciIsImludGVybmFsU3RhdGUiLCJzZWFsIiwibmV3UHJvcHMiLCJjb25zdHJ1Y3RvciIsImFzc2lnbiIsImNsYXNzTmFtZSIsImxheWVyTmFtZSIsIm5hbWUiLCJ1cGRhdGVPYmplY3QiLCJuZWVkc1JlZHJhdyIsInJlZHJhdyIsImNsZWFyUmVkcmF3RmxhZ3MiLCJfZ2V0TmVlZHNSZWRyYXciLCJtb2RlbHMiLCJtb2RlbCIsInNob3VsZFVwZGF0ZVN0YXRlIiwiX2dldFVwZGF0ZVBhcmFtcyIsImF0dHJpYnV0ZU1hbmFnZXIiLCJkYXRhIiwib2JqZWN0IiwibG5nTGF0Iiwidmlld3BvcnQiLCJBcnJheSIsImlzQXJyYXkiLCJwcm9qZWN0IiwieHkiLCJ1bnByb2plY3QiLCJwcm9qZWN0RmxhdCIsInVucHJvamVjdEZsYXQiLCJzY3JlZW5QaXhlbHMiLCJkZXByZWNhdGVkIiwiZGV2aWNlUGl4ZWxSYXRpbyIsIndpbmRvdyIsImkiLCJjb2xvciIsIlVpbnQ4QXJyYXkiLCJpMSIsImkyIiwiaTMiLCJpbmRleCIsIkVycm9yIiwib2xkQ29udGV4dCIsImNoYW5nZUZsYWdzIiwicHJvcHNPckRhdGFDaGFuZ2VkIiwiZ2V0QXR0cmlidXRlTWFuYWdlciIsImRhdGFDaGFuZ2VkIiwiaW52YWxpZGF0ZUFsbCIsImlzSW5UcmFuc2l0aW9uIiwidXBkYXRlVHJhbnNpdGlvbiIsInNldEF0dHJpYnV0ZXMiLCJnZXRDaGFuZ2VkQXR0cmlidXRlcyIsInRyYW5zaXRpb24iLCJvcHRzIiwiZ2V0TW9kZWxzIiwiZHJhdyIsImluZm8iLCJtb2RlIiwiZGlmZlJlYXNvbiIsImxvZyIsImludmFsaWRhdGUiLCJnZXROdW1JbnN0YW5jZXMiLCJ1cGRhdGUiLCJ0cmFuc2l0aW9ucyIsImJ1ZmZlcnMiLCJpZ25vcmVVbmtub3duQXR0cmlidXRlcyIsImNoYW5nZWRBdHRyaWJ1dGVzIiwiY2xlYXJDaGFuZ2VkRmxhZ3MiLCJhdHRyaWJ1dGUiLCJ2YWx1ZSIsInNpemUiLCJwaWNraW5nQ29sb3IiLCJlbmNvZGVQaWNraW5nQ29sb3IiLCJsZW5ndGgiLCJnbCIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlUGlja2luZ0NvbG9ycyIsInR5cGUiLCJVTlNJR05FRF9CWVRFIiwiY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzIiwic3ViTGF5ZXJzIiwic3RhdHMiLCJpbml0aWFsaXplU3RhdGUiLCJzZXRDaGFuZ2VGbGFncyIsInByb3BzQ2hhbmdlZCIsInZpZXdwb3J0Q2hhbmdlZCIsIl91cGRhdGVTdGF0ZSIsImlzQ29tcG9zaXRlIiwiX3JlbmRlckxheWVycyIsInByb2dyYW0iLCJnZW9tZXRyeSIsImdldEF0dHJpYnV0ZXMiLCJjbGVhckNoYW5nZUZsYWdzIiwic3RhdGVOZWVkc1VwZGF0ZSIsIm5lZWRzVXBkYXRlIiwidXBkYXRlUGFyYW1zIiwidXBkYXRlU3RhdGUiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiX3VwZGF0ZUJhc2VVbmlmb3JtcyIsIl91cGRhdGVNb2R1bGVTZXR0aW5ncyIsInNldEluc3RhbmNlQ291bnQiLCJmaW5hbGl6ZVN0YXRlIiwibW9kdWxlUGFyYW1ldGVycyIsInBpY2tpbmdfdUFjdGl2ZSIsInVwZGF0ZU1vZHVsZVNldHRpbmdzIiwib2Zmc2V0cyIsInBvbHlnb25PZmZzZXQiLCJnZXRQaWNraW5nSW5mbyIsImZsYWdzIiwidXBkYXRlVHJpZ2dlcnNDaGFuZ2VkIiwia2V5cyIsImpvaW4iLCJzb21ldGhpbmdDaGFuZ2VkIiwia2V5IiwiX2FjdGl2ZVVwZGF0ZVRyaWdnZXIiLCJhdHRyaWJ1dGVNYW5hZ2VyTmVlZHNSZWRyYXciLCJnZXROZWVkc1JlZHJhdyIsIm1vZGVsTmVlZHNSZWRyYXciLCJvbGRMYXllciIsImxheWVyIiwidXNlckRhdGEiLCJkaWZmUHJvcHMiLCJwcm9wTmFtZSIsImludmFsaWRhdGVBdHRyaWJ1dGUiLCJwcm9wZXJ0eU5hbWUiLCJjb25kaXRpb24iLCJNYXRoIiwicG93IiwiT05FIiwic2V0VW5pZm9ybXMiLCJzZXR0aW5ncyIsInBpY2tpbmdIaWdobGlnaHRDb2xvciIsInVuaWZvcm1NYXAiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3FqQkFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUEsSUFBTUEsc0JBQXNCLENBQTVCO0FBQ0EsSUFBTUMsY0FBY0MsT0FBT0MsTUFBUCxDQUFjLEVBQWQsQ0FBcEI7QUFDQSxJQUFNQyxPQUFPLFNBQVBBLElBQU8sR0FBTSxDQUFFLENBQXJCOztBQUVBLElBQU1DLGVBQWU7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QTtBQU92Qjs7QUFFRDs7QUFFQTs7OztnQ0FDWUUsVSxFQUFZO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQ3RCLDhCQUFvQixLQUFLOUUsU0FBTCxFQUFwQixtSUFBc0M7QUFBQSxjQUEzQnZDLEtBQTJCOztBQUNwQ0EsZ0JBQU1rSCxXQUFOLENBQWtCRyxVQUFsQjtBQUNEOztBQUVEO0FBTHNCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBTXRCLFdBQUt0SSxLQUFMLENBQVdZLFdBQVgsR0FBeUIsSUFBekI7QUFDQSxvQkFBSXFCLFVBQUosQ0FBZSxtQkFBZixFQUFvQyxtQkFBcEM7QUFDRDs7O3dCQTduQlc7QUFDVixhQUFPLEtBQUs5QixhQUFMLENBQW1CZ0YsS0FBMUI7QUFDRDs7Ozs7O2tCQXRDa0I1RixLOzs7QUFvcUJyQkEsTUFBTWtCLFNBQU4sR0FBa0IsT0FBbEI7QUFDQWxCLE1BQU12QixZQUFOLEdBQXFCQSxZQUFyQiIsImZpbGUiOiJsYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pbXBvcnQge0NPT1JESU5BVEVfU1lTVEVNLCBMSUZFQ1lDTEV9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCBBdHRyaWJ1dGVNYW5hZ2VyIGZyb20gJy4vYXR0cmlidXRlLW1hbmFnZXInO1xuaW1wb3J0IFN0YXRzIGZyb20gJy4vc3RhdHMnO1xuaW1wb3J0IHtjb3VudH0gZnJvbSAnLi4vdXRpbHMvY291bnQnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi91dGlscy9sb2cnO1xuaW1wb3J0IHtjcmVhdGVQcm9wc30gZnJvbSAnLi4vbGlmZWN5Y2xlL2NyZWF0ZS1wcm9wcyc7XG5pbXBvcnQge2RpZmZQcm9wc30gZnJvbSAnLi4vbGlmZWN5Y2xlL3Byb3BzJztcbmltcG9ydCB7cmVtb3ZlTGF5ZXJJblNlZXJ9IGZyb20gJy4vc2Vlci1pbnRlZ3JhdGlvbic7XG5pbXBvcnQge0dMLCB3aXRoUGFyYW1ldGVyc30gZnJvbSAnbHVtYS5nbCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IExPR19QUklPUklUWV9VUERBVEUgPSAxO1xuY29uc3QgRU1QVFlfUFJPUFMgPSBPYmplY3QuZnJlZXplKHt9KTtcbmNvbnN0IG5vb3AgPSAoKSA9PiB7fTtcblxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICAvLyBkYXRhOiBTcGVjaWFsIGhhbmRsaW5nIGZvciBudWxsLCBzZWUgYmVsb3dcbiAgZGF0YUNvbXBhcmF0b3I6IG51bGwsXG4gIHVwZGF0ZVRyaWdnZXJzOiB7fSwgLy8gVXBkYXRlIHRyaWdnZXJzOiBhIGNvcmUgY2hhbmdlIGRldGVjdGlvbiBtZWNoYW5pc20gaW4gZGVjay5nbFxuICBudW1JbnN0YW5jZXM6IHVuZGVmaW5lZCxcblxuICB2aXNpYmxlOiB0cnVlLFxuICBwaWNrYWJsZTogZmFsc2UsXG4gIG9wYWNpdHk6IDAuOCxcblxuICBvbkhvdmVyOiBub29wLFxuICBvbkNsaWNrOiBub29wLFxuXG4gIGNvb3JkaW5hdGVTeXN0ZW06IENPT1JESU5BVEVfU1lTVEVNLkxOR0xBVCxcbiAgY29vcmRpbmF0ZU9yaWdpbjogWzAsIDAsIDBdLFxuXG4gIHBhcmFtZXRlcnM6IHt9LFxuICB1bmlmb3Jtczoge30sXG4gIGZyYW1lYnVmZmVyOiBudWxsLFxuXG4gIGFuaW1hdGlvbjogbnVsbCwgLy8gUGFzc2VkIHByb3AgYW5pbWF0aW9uIGZ1bmN0aW9ucyB0byBldmFsdWF0ZSBwcm9wc1xuXG4gIC8vIE9mZnNldCBkZXB0aCBiYXNlZCBvbiBsYXllciBpbmRleCB0byBhdm9pZCB6LWZpZ2h0aW5nLlxuICAvLyBOZWdhdGl2ZSB2YWx1ZXMgcHVsbCBsYXllciB0b3dhcmRzIHRoZSBjYW1lcmFcbiAgLy8gaHR0cHM6Ly93d3cub3BlbmdsLm9yZy9hcmNoaXZlcy9yZXNvdXJjZXMvZmFxL3RlY2huaWNhbC9wb2x5Z29ub2Zmc2V0Lmh0bVxuICBnZXRQb2x5Z29uT2Zmc2V0OiAoe2xheWVySW5kZXh9KSA9PiBbMCwgLWxheWVySW5kZXggKiAxMDBdLFxuXG4gIC8vIFNlbGVjdGlvbi9IaWdobGlnaHRpbmdcbiAgaGlnaGxpZ2h0ZWRPYmplY3RJbmRleDogbnVsbCxcbiAgYXV0b0hpZ2hsaWdodDogZmFsc2UsXG4gIGhpZ2hsaWdodENvbG9yOiBbMCwgMCwgMTI4LCAxMjhdXG59O1xuXG5sZXQgY291bnRlciA9IDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExheWVyIHtcbiAgLy8gY29uc3RydWN0b3IoLi4ucHJvcE9iamVjdHMpXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIE1lcmdlcyBpbmNvbWluZyBwcm9wcyB3aXRoIGRlZmF1bHRzIGFuZCBmcmVlemVzIHRoZW0uXG4gICAgLy8gVE9ETyBzd2l0Y2ggdG8gc3ByZWFkIG9wZXJhdG9yIG9uY2Ugd2Ugbm8gbG9uZ2VyIHRyYW5zcGlsZSB0aGlzIGNvZGVcbiAgICAvLyB0aGlzLnByb3BzID0gY3JlYXRlUHJvcHMuYXBwbHkocHJvcE9iamVjdHMpO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIHByZWZlci1zcHJlYWQgKi9cbiAgICB0aGlzLnByb3BzID0gY3JlYXRlUHJvcHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIHByZWZlci1zcHJlYWQgKi9cblxuICAgIC8vIERlZmluZSBhbGwgbWVtYmVycyBiZWZvcmUgbGF5ZXIgaXMgc2VhbGVkXG4gICAgdGhpcy5pZCA9IHRoaXMucHJvcHMuaWQ7IC8vIFRoZSBsYXllcidzIGlkLCB1c2VkIGZvciBtYXRjaGluZyB3aXRoIGxheWVycyBmcm9tIGxhc3QgcmVuZGVyIGN5Y2xlXG4gICAgdGhpcy5vbGRQcm9wcyA9IEVNUFRZX1BST1BTOyAvLyBQcm9wcyBmcm9tIGxhc3QgcmVuZGVyIHVzZWQgZm9yIGNoYW5nZSBkZXRlY3Rpb25cbiAgICB0aGlzLmNvdW50ID0gY291bnRlcisrOyAvLyBLZWVwIHRyYWNrIG9mIGhvdyBtYW55IGxheWVyIGluc3RhbmNlcyB5b3UgYXJlIGdlbmVyYXRpbmdcbiAgICB0aGlzLmxpZmVjeWNsZSA9IExJRkVDWUNMRS5OT19TVEFURTsgLy8gSGVscHMgdHJhY2sgYW5kIGRlYnVnIHRoZSBsaWZlIGN5Y2xlIG9mIHRoZSBsYXllcnNcbiAgICB0aGlzLnN0YXRlID0gbnVsbDsgLy8gV2lsbCBiZSBzZXQgdG8gdGhlIHNoYXJlZCBsYXllciBzdGF0ZSBvYmplY3QgZHVyaW5nIGxheWVyIG1hdGNoaW5nXG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDsgLy8gV2lsbCByZWZlcmVuY2UgbGF5ZXIgbWFuYWdlcidzIGNvbnRleHQsIGNvbnRhaW5zIHN0YXRlIHNoYXJlZCBieSBsYXllcnNcbiAgICB0aGlzLnBhcmVudExheWVyID0gbnVsbDsgLy8gcmVmZXJlbmNlIHRvIHRoZSBjb21wb3NpdGUgbGF5ZXIgcGFyZW50IHRoYXQgcmVuZGVyZWQgdGhpcyBsYXllclxuXG4gICAgLy8gQ29tcG9zaXRlTGF5ZXIgbWVtYmVycywgbmVlZCB0byBiZSBkZWZpbmVkIGhlcmUgYmVjYXVzZSBvZiB0aGUgYE9iamVjdC5zZWFsYFxuICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IG51bGw7XG5cbiAgICAvLyBTZWFsIHRoZSBsYXllclxuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG5cbiAgLy8gY2xvbmUgdGhpcyBsYXllciB3aXRoIG1vZGlmaWVkIHByb3BzXG4gIGNsb25lKG5ld1Byb3BzKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKE9iamVjdC5hc3NpZ24oe30sIHRoaXMucHJvcHMsIG5ld1Byb3BzKSk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCBjbGFzc05hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLmxheWVyTmFtZSB8fCB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgcmV0dXJuIGAke2NsYXNzTmFtZX0oe2lkOiAnJHt0aGlzLnByb3BzLmlkfSd9KWA7XG4gIH1cblxuICBnZXQgc3RhdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxTdGF0ZS5zdGF0cztcbiAgfVxuXG4gIC8vIFB1YmxpYyBBUElcblxuICAvLyBVcGRhdGVzIHNlbGVjdGVkIHN0YXRlIG1lbWJlcnMgYW5kIG1hcmtzIHRoZSBvYmplY3QgZm9yIHJlZHJhd1xuICBzZXRTdGF0ZSh1cGRhdGVPYmplY3QpIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHVwZGF0ZU9iamVjdCk7XG4gICAgdGhpcy5zdGF0ZS5uZWVkc1JlZHJhdyA9IHRydWU7XG4gIH1cblxuICAvLyBTZXRzIHRoZSByZWRyYXcgZmxhZyBmb3IgdGhpcyBsYXllciwgd2lsbCB0cmlnZ2VyIGEgcmVkcmF3IG5leHQgYW5pbWF0aW9uIGZyYW1lXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSkge1xuICAgICAgdGhpcy5zdGF0ZS5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICB9XG4gIH1cblxuICAvLyBDaGVja3Mgc3RhdGUgb2YgYXR0cmlidXRlcyBhbmQgbW9kZWxcbiAgZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3MgPSBmYWxzZX0gPSB7fSkge1xuICAgIHJldHVybiB0aGlzLl9nZXROZWVkc1JlZHJhdyhjbGVhclJlZHJhd0ZsYWdzKTtcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhcnJheSBvZiBtb2RlbHMgdXNlZCBieSB0aGlzIGxheWVyLCBjYW4gYmUgb3ZlcnJpZGVuIGJ5IGxheWVyIHN1YmNsYXNzXG4gIGdldE1vZGVscygpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5tb2RlbHMgfHwgKHRoaXMuc3RhdGUubW9kZWwgPyBbdGhpcy5zdGF0ZS5tb2RlbF0gOiBbXSk7XG4gIH1cblxuICBuZWVkc1VwZGF0ZSgpIHtcbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RcbiAgICByZXR1cm4gdGhpcy5zaG91bGRVcGRhdGVTdGF0ZSh0aGlzLl9nZXRVcGRhdGVQYXJhbXMoKSk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgbGF5ZXIgaXMgcGlja2FibGUgYW5kIHZpc2libGUuXG4gIGlzUGlja2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMucGlja2FibGUgJiYgdGhpcy5wcm9wcy52aXNpYmxlO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlTWFuYWdlcigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZSAmJiB0aGlzLnN0YXRlLmF0dHJpYnV0ZU1hbmFnZXI7XG4gIH1cblxuICAvLyBVc2UgaXRlcmF0aW9uICh0aGUgb25seSByZXF1aXJlZCBjYXBhYmlsaXR5IG9uIGRhdGEpIHRvIGdldCBmaXJzdCBlbGVtZW50XG4gIC8vIGRlcHJlY2F0ZWRcbiAgZ2V0Rmlyc3RPYmplY3QoKSB7XG4gICAgY29uc3Qge2RhdGF9ID0gdGhpcy5wcm9wcztcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFBST0pFQ1RJT04gTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBQcm9qZWN0cyBhIHBvaW50IHdpdGggY3VycmVudCBtYXAgc3RhdGUgKGxhdCwgbG9uLCB6b29tLCBwaXRjaCwgYmVhcmluZylcbiAgICpcbiAgICogTm90ZTogUG9zaXRpb24gY29udmVyc2lvbiBpcyBkb25lIGluIHNoYWRlciwgc28gaW4gbWFueSBjYXNlcyB0aGVyZSBpcyBubyBuZWVkXG4gICAqIGZvciB0aGlzIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7QXJyYXl8VHlwZWRBcnJheX0gbG5nTGF0IC0gbG9uZyBhbmQgbGF0IHZhbHVlc1xuICAgKiBAcmV0dXJuIHtBcnJheXxUeXBlZEFycmF5fSAtIHgsIHkgY29vcmRpbmF0ZXNcbiAgICovXG4gIHByb2plY3QobG5nTGF0KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShsbmdMYXQpLCAnTGF5ZXIucHJvamVjdCBuZWVkcyBbbG5nLGxhdF0nKTtcbiAgICByZXR1cm4gdmlld3BvcnQucHJvamVjdChsbmdMYXQpO1xuICB9XG5cbiAgdW5wcm9qZWN0KHh5KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh4eSksICdMYXllci51bnByb2plY3QgbmVlZHMgW3gseV0nKTtcbiAgICByZXR1cm4gdmlld3BvcnQudW5wcm9qZWN0KHh5KTtcbiAgfVxuXG4gIHByb2plY3RGbGF0KGxuZ0xhdCkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkobG5nTGF0KSwgJ0xheWVyLnByb2plY3QgbmVlZHMgW2xuZyxsYXRdJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnByb2plY3RGbGF0KGxuZ0xhdCk7XG4gIH1cblxuICB1bnByb2plY3RGbGF0KHh5KSB7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh4eSksICdMYXllci51bnByb2plY3QgbmVlZHMgW3gseV0nKTtcbiAgICByZXR1cm4gdmlld3BvcnQudW5wcm9qZWN0RmxhdCh4eSk7XG4gIH1cblxuICAvLyBUT0RPIC0gbmVlZHMgdG8gcmVmZXIgdG8gY29udGV4dFxuICBzY3JlZW5Ub0RldmljZVBpeGVscyhzY3JlZW5QaXhlbHMpIHtcbiAgICBsb2cuZGVwcmVjYXRlZCgnc2NyZWVuVG9EZXZpY2VQaXhlbHMnLCAnRGVja0dMIHByb3AgdXNlRGV2aWNlUGl4ZWxzIGZvciBjb252ZXJzaW9uJyk7XG4gICAgY29uc3QgZGV2aWNlUGl4ZWxSYXRpbyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmRldmljZVBpeGVsUmF0aW8gOiAxO1xuICAgIHJldHVybiBzY3JlZW5QaXhlbHMgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBpY2tpbmcgY29sb3IgdGhhdCBkb2Vzbid0IG1hdGNoIGFueSBzdWJmZWF0dXJlXG4gICAqIFVzZSBpZiBzb21lIGdyYXBoaWNzIGRvIG5vdCBiZWxvbmcgdG8gYW55IHBpY2thYmxlIHN1YmZlYXR1cmVcbiAgICogQHJldHVybiB7QXJyYXl9IC0gYSBibGFjayBjb2xvclxuICAgKi9cbiAgbnVsbFBpY2tpbmdDb2xvcigpIHtcbiAgICByZXR1cm4gWzAsIDAsIDBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBpY2tpbmcgY29sb3IgdGhhdCBkb2Vzbid0IG1hdGNoIGFueSBzdWJmZWF0dXJlXG4gICAqIFVzZSBpZiBzb21lIGdyYXBoaWNzIGRvIG5vdCBiZWxvbmcgdG8gYW55IHBpY2thYmxlIHN1YmZlYXR1cmVcbiAgICogQHBhcmFtIHtpbnR9IGkgLSBpbmRleCB0byBiZSBkZWNvZGVkXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIHRoZSBkZWNvZGVkIGNvbG9yXG4gICAqL1xuICBlbmNvZGVQaWNraW5nQ29sb3IoaSkge1xuICAgIGFzc2VydCgoKChpICsgMSkgPj4gMjQpICYgMjU1KSA9PT0gMCwgJ2luZGV4IG91dCBvZiBwaWNraW5nIGNvbG9yIHJhbmdlJyk7XG4gICAgcmV0dXJuIFsoaSArIDEpICYgMjU1LCAoKGkgKyAxKSA+PiA4KSAmIDI1NSwgKCgoaSArIDEpID4+IDgpID4+IDgpICYgMjU1XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gY29sb3IgLSBjb2xvciBhcnJheSB0byBiZSBkZWNvZGVkXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIHRoZSBkZWNvZGVkIHBpY2tpbmcgY29sb3JcbiAgICovXG4gIGRlY29kZVBpY2tpbmdDb2xvcihjb2xvcikge1xuICAgIGFzc2VydChjb2xvciBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpO1xuICAgIGNvbnN0IFtpMSwgaTIsIGkzXSA9IGNvbG9yO1xuICAgIC8vIDEgd2FzIGFkZGVkIHRvIHNlcGVyYXRlIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgY29uc3QgaW5kZXggPSBpMSArIGkyICogMjU2ICsgaTMgKiA2NTUzNiAtIDE7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gTElGRUNZQ0xFIE1FVEhPRFMsIG92ZXJyaWRkZW4gYnkgdGhlIGxheWVyIHN1YmNsYXNzZXNcblxuICAvLyBDYWxsZWQgb25jZSB0byBzZXQgdXAgdGhlIGluaXRpYWwgc3RhdGVcbiAgLy8gQXBwIGNhbiBjcmVhdGUgV2ViR0wgcmVzb3VyY2VzXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYExheWVyICR7dGhpc30gaGFzIG5vdCBkZWZpbmVkIGluaXRpYWxpemVTdGF0ZWApO1xuICB9XG5cbiAgLy8gTGV0J3MgbGF5ZXIgY29udHJvbCBpZiB1cGRhdGVTdGF0ZSBzaG91bGQgYmUgY2FsbGVkXG4gIHNob3VsZFVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIG9sZENvbnRleHQsIGNvbnRleHQsIGNoYW5nZUZsYWdzfSkge1xuICAgIHJldHVybiBjaGFuZ2VGbGFncy5wcm9wc09yRGF0YUNoYW5nZWQ7XG4gIH1cblxuICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uLCBhbGwgYXR0cmlidXRlcyB3aWxsIGJlIGludmFsaWRhdGVkIGFuZCB1cGRhdGVkXG4gIC8vIHdoZW4gZGF0YSBjaGFuZ2VzXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIG9sZENvbnRleHQsIGNvbnRleHQsIGNoYW5nZUZsYWdzfSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgJiYgYXR0cmlidXRlTWFuYWdlcikge1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbGVkIG9uY2Ugd2hlbiBsYXllciBpcyBubyBsb25nZXIgbWF0Y2hlZCBhbmQgc3RhdGUgd2lsbCBiZSBkaXNjYXJkZWRcbiAgLy8gQXBwIGNhbiBkZXN0cm95IFdlYkdMIHJlc291cmNlcyBoZXJlXG4gIGZpbmFsaXplU3RhdGUoKSB7fVxuXG4gIC8vIFVwZGF0ZSBhdHRyaWJ1dGUgdHJhbnNpdGlvblxuICB1cGRhdGVUcmFuc2l0aW9uKCkge1xuICAgIGNvbnN0IHttb2RlbCwgYXR0cmlidXRlTWFuYWdlcn0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IGlzSW5UcmFuc2l0aW9uID0gYXR0cmlidXRlTWFuYWdlciAmJiBhdHRyaWJ1dGVNYW5hZ2VyLnVwZGF0ZVRyYW5zaXRpb24oKTtcblxuICAgIGlmIChtb2RlbCAmJiBpc0luVHJhbnNpdGlvbikge1xuICAgICAgbW9kZWwuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVNYW5hZ2VyLmdldENoYW5nZWRBdHRyaWJ1dGVzKHt0cmFuc2l0aW9uOiB0cnVlfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIHN0YXRlIGhhcyBhIG1vZGVsLCBkcmF3IGl0IHdpdGggc3VwcGxpZWQgdW5pZm9ybXNcbiAgZHJhdyhvcHRzKSB7XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLmdldE1vZGVscygpKSB7XG4gICAgICBtb2RlbC5kcmF3KG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNhbGxlZCB0byBwb3B1bGF0ZSB0aGUgaW5mbyBvYmplY3QgdGhhdCBpcyBwYXNzZWQgdG8gdGhlIGV2ZW50IGhhbmRsZXJcbiAgLy8gQHJldHVybiBudWxsIHRvIGNhbmNlbCBldmVudFxuICBnZXRQaWNraW5nSW5mbyh7aW5mbywgbW9kZX0pIHtcbiAgICBjb25zdCB7aW5kZXh9ID0gaW5mbztcblxuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAvLyBJZiBwcm9wcy5kYXRhIGlzIGFuIGluZGV4YWJsZSBhcnJheSwgZ2V0IHRoZSBvYmplY3RcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMucHJvcHMuZGF0YSkpIHtcbiAgICAgICAgaW5mby5vYmplY3QgPSB0aGlzLnByb3BzLmRhdGFbaW5kZXhdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbmZvO1xuICB9XG5cbiAgLy8gRU5EIExJRkVDWUNMRSBNRVRIT0RTXG4gIC8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBhdHRyaWJ1dGUgaW52YWxpZGF0aW9uLCBjYW4gYmUgcmVkZWZpbmVkXG4gIGludmFsaWRhdGVBdHRyaWJ1dGUobmFtZSA9ICdhbGwnLCBkaWZmUmVhc29uID0gJycpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgaWYgKCFhdHRyaWJ1dGVNYW5hZ2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdhbGwnKSB7XG4gICAgICBsb2cubG9nKExPR19QUklPUklUWV9VUERBVEUsIGB1cGRhdGVUcmlnZ2VycyBpbnZhbGlkYXRpbmcgYWxsIGF0dHJpYnV0ZXM6ICR7ZGlmZlJlYXNvbn1gKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2cubG9nKExPR19QUklPUklUWV9VUERBVEUsIGB1cGRhdGVUcmlnZ2VycyBpbnZhbGlkYXRpbmcgYXR0cmlidXRlICR7bmFtZX06ICR7ZGlmZlJlYXNvbn1gKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZShuYW1lKTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxscyBhdHRyaWJ1dGUgbWFuYWdlciB0byB1cGRhdGUgYW55IFdlYkdMIGF0dHJpYnV0ZXMsIGNhbiBiZSByZWRlZmluZWRcbiAgdXBkYXRlQXR0cmlidXRlcyhwcm9wcykge1xuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICBpZiAoIWF0dHJpYnV0ZU1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGaWd1cmUgb3V0IGRhdGEgbGVuZ3RoXG4gICAgY29uc3QgbnVtSW5zdGFuY2VzID0gdGhpcy5nZXROdW1JbnN0YW5jZXMocHJvcHMpO1xuXG4gICAgYXR0cmlidXRlTWFuYWdlci51cGRhdGUoe1xuICAgICAgZGF0YTogcHJvcHMuZGF0YSxcbiAgICAgIG51bUluc3RhbmNlcyxcbiAgICAgIHByb3BzLFxuICAgICAgdHJhbnNpdGlvbnM6IHByb3BzLnRyYW5zaXRpb25zLFxuICAgICAgYnVmZmVyczogcHJvcHMsXG4gICAgICBjb250ZXh0OiB0aGlzLFxuICAgICAgLy8gRG9uJ3Qgd29ycnkgYWJvdXQgbm9uLWF0dHJpYnV0ZSBwcm9wc1xuICAgICAgaWdub3JlVW5rbm93bkF0dHJpYnV0ZXM6IHRydWVcbiAgICB9KTtcblxuICAgIC8vIFRPRE8gLSBVc2UgZ2V0TW9kZWxzP1xuICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnN0YXRlO1xuICAgIGlmIChtb2RlbCkge1xuICAgICAgY29uc3QgY2hhbmdlZEF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVNYW5hZ2VyLmdldENoYW5nZWRBdHRyaWJ1dGVzKHtjbGVhckNoYW5nZWRGbGFnczogdHJ1ZX0pO1xuICAgICAgbW9kZWwuc2V0QXR0cmlidXRlcyhjaGFuZ2VkQXR0cmlidXRlcyk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSwge251bUluc3RhbmNlc30pIHtcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIC8vIGFkZCAxIHRvIGluZGV4IHRvIHNlcGVyYXRlIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1JbnN0YW5jZXM7IGkrKykge1xuICAgICAgY29uc3QgcGlja2luZ0NvbG9yID0gdGhpcy5lbmNvZGVQaWNraW5nQ29sb3IoaSk7XG4gICAgICB2YWx1ZVtpICogc2l6ZSArIDBdID0gcGlja2luZ0NvbG9yWzBdO1xuICAgICAgdmFsdWVbaSAqIHNpemUgKyAxXSA9IHBpY2tpbmdDb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMl0gPSBwaWNraW5nQ29sb3JbMl07XG4gICAgfVxuICB9XG5cbiAgLy8gSU5URVJOQUwgTUVUSE9EU1xuXG4gIC8vIERlZHVjZXMgbnVtZXIgb2YgaW5zdGFuY2VzLiBJbnRlbnRpb24gaXMgdG8gc3VwcG9ydDpcbiAgLy8gLSBFeHBsaWNpdCBzZXR0aW5nIG9mIG51bUluc3RhbmNlc1xuICAvLyAtIEF1dG8tZGVkdWN0aW9uIGZvciBFUzYgY29udGFpbmVycyB0aGF0IGRlZmluZSBhIHNpemUgbWVtYmVyXG4gIC8vIC0gQXV0by1kZWR1Y3Rpb24gZm9yIENsYXNzaWMgQXJyYXlzIHZpYSB0aGUgYnVpbHQtaW4gbGVuZ3RoIGF0dHJpYnV0ZVxuICAvLyAtIEF1dG8tZGVkdWN0aW9uIHZpYSBhcnJheXNcbiAgZ2V0TnVtSW5zdGFuY2VzKHByb3BzKSB7XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB0aGlzLnByb3BzO1xuXG4gICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIGxheWVyIGhhcyBzZXQgaXRzIG93biB2YWx1ZVxuICAgIGlmICh0aGlzLnN0YXRlICYmIHRoaXMuc3RhdGUubnVtSW5zdGFuY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXRlLm51bUluc3RhbmNlcztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBhcHAgaGFzIHByb3ZpZGVkIGFuIGV4cGxpY2l0IHZhbHVlXG4gICAgaWYgKHByb3BzLm51bUluc3RhbmNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gcHJvcHMubnVtSW5zdGFuY2VzO1xuICAgIH1cblxuICAgIC8vIFVzZSBjb250YWluZXIgbGlicmFyeSB0byBnZXQgYSBjb3VudCBmb3IgYW55IEVTNiBjb250YWluZXIgb3Igb2JqZWN0XG4gICAgY29uc3Qge2RhdGF9ID0gcHJvcHM7XG4gICAgcmV0dXJuIGNvdW50KGRhdGEpO1xuICB9XG5cbiAgLy8gTEFZRVIgTUFOQUdFUiBBUElcbiAgLy8gU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IHRoZSBkZWNrLmdsIExheWVyTWFuYWdlciBjbGFzc1xuXG4gIC8vIENhbGxlZCBieSBsYXllciBtYW5hZ2VyIHdoZW4gYSBuZXcgbGF5ZXIgaXMgZm91bmRcbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgX2luaXRpYWxpemUoKSB7XG4gICAgYXNzZXJ0KGFyZ3VtZW50cy5sZW5ndGggPT09IDApO1xuICAgIGFzc2VydCh0aGlzLmNvbnRleHQuZ2wpO1xuICAgIGFzc2VydCghdGhpcy5zdGF0ZSk7XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gbmV3IEF0dHJpYnV0ZU1hbmFnZXIodGhpcy5jb250ZXh0LmdsLCB7XG4gICAgICBpZDogdGhpcy5wcm9wcy5pZFxuICAgIH0pO1xuXG4gICAgLy8gQWxsIGluc3RhbmNlZCBsYXllcnMgZ2V0IGluc3RhbmNlUGlja2luZ0NvbG9ycyBhdHRyaWJ1dGUgYnkgZGVmYXVsdFxuICAgIC8vIFRoZWlyIHNoYWRlcnMgY2FuIHVzZSBpdCB0byByZW5kZXIgYSBwaWNraW5nIHNjZW5lXG4gICAgLy8gVE9ETyAtIHRoaXMgc2xpZ2h0bHkgc2xvd3MgZG93biBub24gaW5zdGFuY2VkIGxheWVyc1xuICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgIGluc3RhbmNlUGlja2luZ0NvbG9yczoge1xuICAgICAgICB0eXBlOiBHTC5VTlNJR05FRF9CWVRFLFxuICAgICAgICBzaXplOiAzLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmludGVybmFsU3RhdGUgPSB7XG4gICAgICBzdWJMYXllcnM6IG51bGwsIC8vIHJlZmVyZW5jZSB0byBzdWJsYXllcnMgcmVuZGVyZWQgaW4gYSBwcmV2aW91cyBjeWNsZVxuICAgICAgc3RhdHM6IG5ldyBTdGF0cyh7aWQ6ICdkcmF3J30pXG4gICAgICAvLyBhbmltYXRlZFByb3BzOiBudWxsLCAvLyBDb21wdXRpbmcgYW5pbWF0ZWQgcHJvcHMgcmVxdWlyZXMgbGF5ZXIgbWFuYWdlciBzdGF0ZVxuICAgICAgLy8gVE9ETyAtIG1vdmUgdGhlc2UgZmllbGRzIGhlcmUgKHJpc2tzIGJyZWFraW5nIGxheWVycylcbiAgICAgIC8vIGF0dHJpYnV0ZU1hbmFnZXIsXG4gICAgICAvLyBuZWVkc1JlZHJhdzogdHJ1ZSxcbiAgICB9O1xuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIsXG4gICAgICBtb2RlbDogbnVsbCxcbiAgICAgIG5lZWRzUmVkcmF3OiB0cnVlXG4gICAgfTtcblxuICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZHNcbiAgICB0aGlzLmluaXRpYWxpemVTdGF0ZSh0aGlzLmNvbnRleHQpO1xuICAgIC8vIEVuZCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kc1xuXG4gICAgLy8gaW5pdGlhbGl6ZVN0YXRlIGNhbGxiYWNrIHRlbmRzIHRvIGNsZWFyIHN0YXRlXG4gICAgdGhpcy5zZXRDaGFuZ2VGbGFncyh7ZGF0YUNoYW5nZWQ6IHRydWUsIHByb3BzQ2hhbmdlZDogdHJ1ZSwgdmlld3BvcnRDaGFuZ2VkOiB0cnVlfSk7XG5cbiAgICB0aGlzLl91cGRhdGVTdGF0ZSh0aGlzLl9nZXRVcGRhdGVQYXJhbXMoKSk7XG5cbiAgICBpZiAodGhpcy5pc0NvbXBvc2l0ZSkge1xuICAgICAgdGhpcy5fcmVuZGVyTGF5ZXJzKHRydWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnN0YXRlO1xuICAgIGlmIChtb2RlbCkge1xuICAgICAgbW9kZWwuaWQgPSB0aGlzLnByb3BzLmlkO1xuICAgICAgbW9kZWwucHJvZ3JhbS5pZCA9IGAke3RoaXMucHJvcHMuaWR9LXByb2dyYW1gO1xuICAgICAgbW9kZWwuZ2VvbWV0cnkuaWQgPSBgJHt0aGlzLnByb3BzLmlkfS1nZW9tZXRyeWA7XG4gICAgICBtb2RlbC5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZU1hbmFnZXIuZ2V0QXR0cmlidXRlcygpKTtcbiAgICB9XG5cbiAgICAvLyBMYXN0IGJ1dCBub3QgbGVhc3QsIHVwZGF0ZSBhbnkgc3VibGF5ZXJzXG4gICAgaWYgKHRoaXMuaXNDb21wb3NpdGUpIHtcbiAgICAgIHRoaXMuX3JlbmRlckxheWVycygpO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXJDaGFuZ2VGbGFncygpO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGJ5IGxheWVyIG1hbmFnZXJcbiAgLy8gaWYgdGhpcyBsYXllciBpcyBuZXcgKG5vdCBtYXRjaGVkIHdpdGggYW4gZXhpc3RpbmcgbGF5ZXIpIG9sZFByb3BzIHdpbGwgYmUgZW1wdHkgb2JqZWN0XG4gIF91cGRhdGUoKSB7XG4gICAgYXNzZXJ0KGFyZ3VtZW50cy5sZW5ndGggPT09IDApO1xuXG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgY29uc3Qgc3RhdGVOZWVkc1VwZGF0ZSA9IHRoaXMubmVlZHNVcGRhdGUoKTtcbiAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuXG4gICAgY29uc3QgdXBkYXRlUGFyYW1zID0ge1xuICAgICAgcHJvcHM6IHRoaXMucHJvcHMsXG4gICAgICBvbGRQcm9wczogdGhpcy5vbGRQcm9wcyxcbiAgICAgIGNvbnRleHQ6IHRoaXMuY29udGV4dCxcbiAgICAgIG9sZENvbnRleHQ6IHRoaXMub2xkQ29udGV4dCxcbiAgICAgIGNoYW5nZUZsYWdzOiB0aGlzLmludGVybmFsU3RhdGUuY2hhbmdlRmxhZ3NcbiAgICB9O1xuXG4gICAgaWYgKHN0YXRlTmVlZHNVcGRhdGUpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVN0YXRlKHVwZGF0ZVBhcmFtcyk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIG9yIHVwZGF0ZSBwcmV2aW91c2x5IHJlbmRlcmVkIHN1YmxheWVyc1xuICAgIGlmICh0aGlzLmlzQ29tcG9zaXRlKSB7XG4gICAgICB0aGlzLl9yZW5kZXJMYXllcnMoc3RhdGVOZWVkc1VwZGF0ZSk7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckNoYW5nZUZsYWdzKCk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIF91cGRhdGVTdGF0ZSh1cGRhdGVQYXJhbXMpIHtcbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RzXG4gICAgdGhpcy51cGRhdGVTdGF0ZSh1cGRhdGVQYXJhbXMpO1xuICAgIC8vIEVuZCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kc1xuXG4gICAgLy8gQWRkIGFueSBzdWJjbGFzcyBhdHRyaWJ1dGVzXG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGVzKHRoaXMucHJvcHMpO1xuICAgIHRoaXMuX3VwZGF0ZUJhc2VVbmlmb3JtcygpO1xuICAgIHRoaXMuX3VwZGF0ZU1vZHVsZVNldHRpbmdzKCk7XG5cbiAgICAvLyBOb3RlOiBBdXRvbWF0aWMgaW5zdGFuY2UgY291bnQgdXBkYXRlIG9ubHkgd29ya3MgZm9yIHNpbmdsZSBsYXllcnNcbiAgICBpZiAodGhpcy5zdGF0ZS5tb2RlbCkge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRJbnN0YW5jZUNvdW50KHRoaXMuZ2V0TnVtSW5zdGFuY2VzKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhbGxlZCBieSBtYW5hZ2VyIHdoZW4gbGF5ZXIgaXMgYWJvdXQgdG8gYmUgZGlzcG9zZWRcbiAgLy8gTm90ZTogbm90IGd1YXJhbnRlZWQgdG8gYmUgY2FsbGVkIG9uIGFwcGxpY2F0aW9uIHNodXRkb3duXG4gIF9maW5hbGl6ZSgpIHtcbiAgICBhc3NlcnQoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCk7XG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgdGhpcy5maW5hbGl6ZVN0YXRlKHRoaXMuY29udGV4dCk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgICByZW1vdmVMYXllckluU2Vlcih0aGlzLmlkKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdW5pZm9ybXNcbiAgZHJhd0xheWVyKHttb2R1bGVQYXJhbWV0ZXJzID0gbnVsbCwgdW5pZm9ybXMgPSB7fSwgcGFyYW1ldGVycyA9IHt9fSkge1xuICAgIGlmICghdW5pZm9ybXMucGlja2luZ191QWN0aXZlKSB7XG4gICAgICB0aGlzLnVwZGF0ZVRyYW5zaXRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPL2liIC0gaGFjayBtb3ZlIHRvIGx1bWEgTW9kZWwuZHJhd1xuICAgIGlmIChtb2R1bGVQYXJhbWV0ZXJzKSB7XG4gICAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMuZ2V0TW9kZWxzKCkpIHtcbiAgICAgICAgbW9kZWwudXBkYXRlTW9kdWxlU2V0dGluZ3MobW9kdWxlUGFyYW1ldGVycyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXBwbHkgcG9seWdvbiBvZmZzZXQgdG8gYXZvaWQgei1maWdodGluZ1xuICAgIC8vIFRPRE8gLSBtb3ZlIHRvIGRyYXctbGF5ZXJzXG4gICAgY29uc3Qge2dldFBvbHlnb25PZmZzZXR9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBvZmZzZXRzID0gKGdldFBvbHlnb25PZmZzZXQgJiYgZ2V0UG9seWdvbk9mZnNldCh1bmlmb3JtcykpIHx8IFswLCAwXTtcbiAgICBwYXJhbWV0ZXJzLnBvbHlnb25PZmZzZXQgPSBvZmZzZXRzO1xuXG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgd2l0aFBhcmFtZXRlcnModGhpcy5jb250ZXh0LmdsLCBwYXJhbWV0ZXJzLCAoKSA9PiB7XG4gICAgICB0aGlzLmRyYXcoe21vZHVsZVBhcmFtZXRlcnMsIHVuaWZvcm1zLCBwYXJhbWV0ZXJzLCBjb250ZXh0OiB0aGlzLmNvbnRleHR9KTtcbiAgICB9KTtcbiAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuICB9XG5cbiAgLy8ge3VuaWZvcm1zID0ge30sIC4uLm9wdHN9XG4gIHBpY2tMYXllcihvcHRzKSB7XG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGlja2luZ0luZm8ob3B0cyk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2RzXG4gIGdldENoYW5nZUZsYWdzKCkge1xuICAgIHJldHVybiB0aGlzLmludGVybmFsU3RhdGUuY2hhbmdlRmxhZ3M7XG4gIH1cblxuICAvLyBEaXJ0eSBzb21lIGNoYW5nZSBmbGFncywgd2lsbCBiZSBoYW5kbGVkIGJ5IHVwZGF0ZUxheWVyXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cbiAgc2V0Q2hhbmdlRmxhZ3MoZmxhZ3MpIHtcbiAgICB0aGlzLmludGVybmFsU3RhdGUuY2hhbmdlRmxhZ3MgPSB0aGlzLmludGVybmFsU3RhdGUuY2hhbmdlRmxhZ3MgfHwge307XG4gICAgY29uc3QgY2hhbmdlRmxhZ3MgPSB0aGlzLmludGVybmFsU3RhdGUuY2hhbmdlRmxhZ3M7XG5cbiAgICAvLyBVcGRhdGUgcHJpbWFyeSBmbGFnc1xuICAgIGlmIChmbGFncy5kYXRhQ2hhbmdlZCAmJiAhY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIGNoYW5nZUZsYWdzLmRhdGFDaGFuZ2VkID0gZmxhZ3MuZGF0YUNoYW5nZWQ7XG4gICAgICBsb2cubG9nKExPR19QUklPUklUWV9VUERBVEUgKyAxLCAoKSA9PiBgZGF0YUNoYW5nZWQ6ICR7ZmxhZ3MuZGF0YUNoYW5nZWR9IGluICR7dGhpcy5pZH1gKTtcbiAgICB9XG4gICAgaWYgKGZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCAmJiAhY2hhbmdlRmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkKSB7XG4gICAgICBjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgPVxuICAgICAgICBjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgJiYgZmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkXG4gICAgICAgICAgPyBPYmplY3QuYXNzaWduKHt9LCBmbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQsIGNoYW5nZUZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZClcbiAgICAgICAgICA6IGZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCB8fCBjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQ7XG4gICAgICBsb2cubG9nKFxuICAgICAgICBMT0dfUFJJT1JJVFlfVVBEQVRFICsgMSxcbiAgICAgICAgKCkgPT5cbiAgICAgICAgICAndXBkYXRlVHJpZ2dlcnNDaGFuZ2VkOiAnICtcbiAgICAgICAgICBgJHtPYmplY3Qua2V5cyhmbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQpLmpvaW4oJywgJyl9IGluICR7dGhpcy5pZH1gXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZmxhZ3MucHJvcHNDaGFuZ2VkICYmICFjaGFuZ2VGbGFncy5wcm9wc0NoYW5nZWQpIHtcbiAgICAgIGNoYW5nZUZsYWdzLnByb3BzQ2hhbmdlZCA9IGZsYWdzLnByb3BzQ2hhbmdlZDtcbiAgICAgIGxvZy5sb2coTE9HX1BSSU9SSVRZX1VQREFURSArIDEsICgpID0+IGBwcm9wc0NoYW5nZWQ6ICR7ZmxhZ3MucHJvcHNDaGFuZ2VkfSBpbiAke3RoaXMuaWR9YCk7XG4gICAgfVxuICAgIGlmIChmbGFncy52aWV3cG9ydENoYW5nZWQgJiYgIWNoYW5nZUZsYWdzLnZpZXdwb3J0Q2hhbmdlZCkge1xuICAgICAgY2hhbmdlRmxhZ3Mudmlld3BvcnRDaGFuZ2VkID0gZmxhZ3Mudmlld3BvcnRDaGFuZ2VkO1xuICAgICAgbG9nLmxvZyhcbiAgICAgICAgTE9HX1BSSU9SSVRZX1VQREFURSArIDIsXG4gICAgICAgICgpID0+IGB2aWV3cG9ydENoYW5nZWQ6ICR7ZmxhZ3Mudmlld3BvcnRDaGFuZ2VkfSBpbiAke3RoaXMuaWR9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgY29tcG9zaXRlIGZsYWdzXG4gICAgY29uc3QgcHJvcHNPckRhdGFDaGFuZ2VkID1cbiAgICAgIGZsYWdzLmRhdGFDaGFuZ2VkIHx8IGZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCB8fCBmbGFncy5wcm9wc0NoYW5nZWQ7XG4gICAgY2hhbmdlRmxhZ3MucHJvcHNPckRhdGFDaGFuZ2VkID0gY2hhbmdlRmxhZ3MucHJvcHNPckRhdGFDaGFuZ2VkIHx8IHByb3BzT3JEYXRhQ2hhbmdlZDtcbiAgICBjaGFuZ2VGbGFncy5zb21ldGhpbmdDaGFuZ2VkID1cbiAgICAgIGNoYW5nZUZsYWdzLnNvbWV0aGluZ0NoYW5nZWQgfHwgcHJvcHNPckRhdGFDaGFuZ2VkIHx8IGZsYWdzLnZpZXdwb3J0Q2hhbmdlZDtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cblxuICAvLyBDbGVhciBhbGwgY2hhbmdlRmxhZ3MsIHR5cGljYWxseSBhZnRlciBhbiB1cGRhdGVcbiAgY2xlYXJDaGFuZ2VGbGFncygpIHtcbiAgICB0aGlzLmludGVybmFsU3RhdGUuY2hhbmdlRmxhZ3MgPSB7XG4gICAgICAvLyBQcmltYXJ5IGNoYW5nZUZsYWdzLCBjYW4gYmUgc3RyaW5ncyBzdGF0aW5nIHJlYXNvbiBmb3IgY2hhbmdlXG4gICAgICBkYXRhQ2hhbmdlZDogZmFsc2UsXG4gICAgICBwcm9wc0NoYW5nZWQ6IGZhbHNlLFxuICAgICAgdXBkYXRlVHJpZ2dlcnNDaGFuZ2VkOiBmYWxzZSxcbiAgICAgIHZpZXdwb3J0Q2hhbmdlZDogZmFsc2UsXG5cbiAgICAgIC8vIERlcml2ZWQgY2hhbmdlRmxhZ3NcbiAgICAgIHByb3BzT3JEYXRhQ2hhbmdlZDogZmFsc2UsXG4gICAgICBzb21ldGhpbmdDaGFuZ2VkOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICBwcmludENoYW5nZUZsYWdzKCkge1xuICAgIGNvbnN0IGZsYWdzID0gdGhpcy5pbnRlcm5hbFN0YXRlLmNoYW5nZUZsYWdzO1xuICAgIHJldHVybiBgXFxcbiR7ZmxhZ3MuZGF0YUNoYW5nZWQgPyAnZGF0YSAnIDogJyd9XFxcbiR7ZmxhZ3MucHJvcHNDaGFuZ2VkID8gJ3Byb3BzICcgOiAnJ31cXFxuJHtmbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQgPyAndHJpZ2dlcnMgJyA6ICcnfVxcXG4ke2ZsYWdzLnZpZXdwb3J0Q2hhbmdlZCA/ICd2aWV3cG9ydCcgOiAnJ31cXFxuYDtcbiAgfVxuXG4gIC8vIENvbXBhcmVzIHRoZSBsYXllcnMgcHJvcHMgd2l0aCBvbGQgcHJvcHMgZnJvbSBhIG1hdGNoZWQgb2xkZXIgbGF5ZXJcbiAgLy8gYW5kIGV4dHJhY3RzIGNoYW5nZSBmbGFncyB0aGF0IGRlc2NyaWJlIHdoYXQgaGFzIGNoYW5nZSBzbyB0aGF0IHN0YXRlXG4gIC8vIGNhbiBiZSB1cGRhdGUgY29ycmVjdGx5IHdpdGggbWluaW1hbCBlZmZvcnRcbiAgLy8gVE9ETyAtIGFyZ3VtZW50cyBmb3IgdGVzdGluZyBvbmx5XG4gIGRpZmZQcm9wcyhuZXdQcm9wcyA9IHRoaXMucHJvcHMsIG9sZFByb3BzID0gdGhpcy5vbGRQcm9wcykge1xuICAgIGNvbnN0IGNoYW5nZUZsYWdzID0gZGlmZlByb3BzKG5ld1Byb3BzLCBvbGRQcm9wcyk7XG5cbiAgICAvLyBpdGVyYXRlIG92ZXIgY2hhbmdlZFRyaWdnZXJzXG4gICAgaWYgKGNoYW5nZUZsYWdzLnVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCkge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gY2hhbmdlRmxhZ3MudXBkYXRlVHJpZ2dlcnNDaGFuZ2VkKSB7XG4gICAgICAgIGlmIChjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWRba2V5XSkge1xuICAgICAgICAgIHRoaXMuX2FjdGl2ZVVwZGF0ZVRyaWdnZXIoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNldENoYW5nZUZsYWdzKGNoYW5nZUZsYWdzKTtcbiAgfVxuXG4gIC8vIFBSSVZBVEUgTUVUSE9EU1xuXG4gIF9nZXRVcGRhdGVQYXJhbXMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3BzOiB0aGlzLnByb3BzLFxuICAgICAgb2xkUHJvcHM6IHRoaXMub2xkUHJvcHMsXG4gICAgICBjb250ZXh0OiB0aGlzLmNvbnRleHQsXG4gICAgICBvbGRDb250ZXh0OiB0aGlzLm9sZENvbnRleHQgfHwge30sXG4gICAgICBjaGFuZ2VGbGFnczogdGhpcy5pbnRlcm5hbFN0YXRlLmNoYW5nZUZsYWdzXG4gICAgfTtcbiAgfVxuXG4gIC8vIENoZWNrcyBzdGF0ZSBvZiBhdHRyaWJ1dGVzIGFuZCBtb2RlbFxuICBfZ2V0TmVlZHNSZWRyYXcoY2xlYXJSZWRyYXdGbGFncykge1xuICAgIC8vIHRoaXMgbWV0aG9kIG1heSBiZSBjYWxsZWQgYnkgdGhlIHJlbmRlciBsb29wIGFzIHNvb24gYSB0aGUgbGF5ZXJcbiAgICAvLyBoYXMgYmVlbiBjcmVhdGVkLCBzbyBndWFyZCBhZ2FpbnN0IHVuaW5pdGlhbGl6ZWQgc3RhdGVcbiAgICBpZiAoIXRoaXMuc3RhdGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgcmVkcmF3ID0gZmFsc2U7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8ICh0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ICYmIHRoaXMuaWQpO1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ICYmICFjbGVhclJlZHJhd0ZsYWdzO1xuXG4gICAgLy8gVE9ETyAtIGlzIGF0dHJpYnV0ZSBtYW5hZ2VyIG5lZWRlZD8gLSBNb2RlbCBzaG91bGQgYmUgZW5vdWdoLlxuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyTmVlZHNSZWRyYXcgPVxuICAgICAgYXR0cmlidXRlTWFuYWdlciAmJiBhdHRyaWJ1dGVNYW5hZ2VyLmdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzfSk7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IGF0dHJpYnV0ZU1hbmFnZXJOZWVkc1JlZHJhdztcblxuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgdGhpcy5nZXRNb2RlbHMoKSkge1xuICAgICAgbGV0IG1vZGVsTmVlZHNSZWRyYXcgPSBtb2RlbC5nZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFnc30pO1xuICAgICAgaWYgKG1vZGVsTmVlZHNSZWRyYXcgJiYgdHlwZW9mIG1vZGVsTmVlZHNSZWRyYXcgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG1vZGVsTmVlZHNSZWRyYXcgPSBgbW9kZWwgJHttb2RlbC5pZH1gO1xuICAgICAgfVxuICAgICAgcmVkcmF3ID0gcmVkcmF3IHx8IG1vZGVsTmVlZHNSZWRyYXc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZHJhdztcbiAgfVxuXG4gIC8vIENhbGxlZCBieSBsYXllciBtYW5hZ2VyIHRvIHRyYW5zZmVyIHN0YXRlIGZyb20gYW4gb2xkIGxheWVyXG4gIF90cmFuc2ZlclN0YXRlKG9sZExheWVyKSB7XG4gICAgY29uc3Qge3N0YXRlLCBpbnRlcm5hbFN0YXRlLCBwcm9wc30gPSBvbGRMYXllcjtcbiAgICBhc3NlcnQoc3RhdGUgJiYgaW50ZXJuYWxTdGF0ZSk7XG5cbiAgICAvLyBNb3ZlIHN0YXRlXG4gICAgc3RhdGUubGF5ZXIgPSB0aGlzO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLmludGVybmFsU3RhdGUgPSBpbnRlcm5hbFN0YXRlO1xuICAgIC8vIE5vdGU6IFdlIGtlZXAgdGhlIHN0YXRlIHJlZiBvbiBvbGQgbGF5ZXJzIHRvIHN1cHBvcnQgYXN5bmMgYWN0aW9uc1xuICAgIC8vIG9sZExheWVyLnN0YXRlID0gbnVsbDtcblxuICAgIC8vIEtlZXAgYSB0ZW1wb3JhcnkgcmVmIHRvIHRoZSBvbGQgcHJvcHMsIGZvciBwcm9wIGNvbXBhcmlzb25cbiAgICB0aGlzLm9sZFByb3BzID0gcHJvcHM7XG5cbiAgICAvLyBVcGRhdGUgbW9kZWwgbGF5ZXIgcmVmZXJlbmNlXG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLmdldE1vZGVscygpKSB7XG4gICAgICBtb2RlbC51c2VyRGF0YS5sYXllciA9IHRoaXM7XG4gICAgfVxuXG4gICAgdGhpcy5kaWZmUHJvcHMoKTtcbiAgfVxuXG4gIC8vIE9wZXJhdGUgb24gZWFjaCBjaGFuZ2VkIHRyaWdnZXJzLCB3aWxsIGJlIGNhbGxlZCB3aGVuIGFuIHVwZGF0ZVRyaWdnZXIgY2hhbmdlc1xuICBfYWN0aXZlVXBkYXRlVHJpZ2dlcihwcm9wTmFtZSkge1xuICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZShwcm9wTmFtZSk7XG4gIH1cblxuICAvLyAgSGVscGVyIHRvIGNoZWNrIHRoYXQgcmVxdWlyZWQgcHJvcHMgYXJlIHN1cHBsaWVkXG4gIF9jaGVja1JlcXVpcmVkUHJvcChwcm9wZXJ0eU5hbWUsIGNvbmRpdGlvbikge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5wcm9wc1twcm9wZXJ0eU5hbWVdO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb3BlcnR5ICR7cHJvcGVydHlOYW1lfSB1bmRlZmluZWQgaW4gbGF5ZXIgJHt0aGlzfWApO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9uICYmICFjb25kaXRpb24odmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhZCBwcm9wZXJ0eSAke3Byb3BlcnR5TmFtZX0gaW4gbGF5ZXIgJHt0aGlzfWApO1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVCYXNlVW5pZm9ybXMoKSB7XG4gICAgY29uc3QgdW5pZm9ybXMgPSB7XG4gICAgICAvLyBhcHBseSBnYW1tYSB0byBvcGFjaXR5IHRvIG1ha2UgaXQgdmlzdWFsbHkgXCJsaW5lYXJcIlxuICAgICAgb3BhY2l0eTogTWF0aC5wb3codGhpcy5wcm9wcy5vcGFjaXR5LCAxIC8gMi4yKSxcbiAgICAgIE9ORTogMS4wXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMuZ2V0TW9kZWxzKCkpIHtcbiAgICAgIG1vZGVsLnNldFVuaWZvcm1zKHVuaWZvcm1zKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPIC0gc2V0IG5lZWRzUmVkcmF3IG9uIHRoZSBtb2RlbChzKT9cbiAgICB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgfVxuXG4gIF91cGRhdGVNb2R1bGVTZXR0aW5ncygpIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHtcbiAgICAgIHBpY2tpbmdIaWdobGlnaHRDb2xvcjogdGhpcy5wcm9wcy5oaWdobGlnaHRDb2xvclxuICAgIH07XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLmdldE1vZGVscygpKSB7XG4gICAgICBtb2RlbC51cGRhdGVNb2R1bGVTZXR0aW5ncyhzZXR0aW5ncyk7XG4gICAgfVxuICB9XG5cbiAgLy8gREVQUkVDQVRFRCBNRVRIT0RTXG5cbiAgLy8gVXBkYXRlcyBzZWxlY3RlZCBzdGF0ZSBtZW1iZXJzIGFuZCBtYXJrcyB0aGUgb2JqZWN0IGZvciByZWRyYXdcbiAgc2V0VW5pZm9ybXModW5pZm9ybU1hcCkge1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgdGhpcy5nZXRNb2RlbHMoKSkge1xuICAgICAgbW9kZWwuc2V0VW5pZm9ybXModW5pZm9ybU1hcCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETyAtIHNldCBuZWVkc1JlZHJhdyBvbiB0aGUgbW9kZWwocyk/XG4gICAgdGhpcy5zdGF0ZS5uZWVkc1JlZHJhdyA9IHRydWU7XG4gICAgbG9nLmRlcHJlY2F0ZWQoJ2xheWVyLnNldFVuaWZvcm1zJywgJ21vZGVsLnNldFVuaWZvcm1zJyk7XG4gIH1cbn1cblxuTGF5ZXIubGF5ZXJOYW1lID0gJ0xheWVyJztcbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==