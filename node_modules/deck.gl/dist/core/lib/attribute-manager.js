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

/* eslint-disable guard-for-in */


exports.glArrayFromType = glArrayFromType;

var _stats = require('./stats');

var _stats2 = _interopRequireDefault(_stats);

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _luma = require('luma.gl');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _attributeTransitionManager = require('./attribute-transition-manager');

var _attributeTransitionManager2 = _interopRequireDefault(_attributeTransitionManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LOG_START_END_PRIORITY = 1;
var LOG_DETAIL_PRIORITY = 2;

function noop() {}

/* eslint-disable complexity */
function glArrayFromType(glType) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$clamped = _ref.clamped,
      clamped = _ref$clamped === undefined ? true : _ref$clamped;

  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (glType) {
    case _luma.GL.FLOAT:
      return Float32Array;
    case _luma.GL.UNSIGNED_SHORT:
    case _luma.GL.UNSIGNED_SHORT_5_6_5:
    case _luma.GL.UNSIGNED_SHORT_4_4_4_4:
    case _luma.GL.UNSIGNED_SHORT_5_5_5_1:
      return Uint16Array;
    case _luma.GL.UNSIGNED_INT:
      return Uint32Array;
    case _luma.GL.UNSIGNED_BYTE:
      return clamped ? Uint8ClampedArray : Uint8Array;
    case _luma.GL.BYTE:
      return Int8Array;
    case _luma.GL.SHORT:
      return Int16Array;
    case _luma.GL.INT:
      return Int32Array;
    default:
      throw new Error('Failed to deduce type from array');
  }
}
/* eslint-enable complexity */

// Default loggers
var logFunctions = {
  savedMessages: null,
  timeStart: null,

  onLog: function onLog(_ref2) {
    var level = _ref2.level,
        message = _ref2.message;

    _log2.default.log(level, message);
  },
  onUpdateStart: function onUpdateStart(_ref3) {
    var level = _ref3.level,
        id = _ref3.id,
        numInstances = _ref3.numInstances;

    logFunctions.savedMessages = [];
    logFunctions.timeStart = new Date();
  },
  onUpdate: function onUpdate(_ref4) {
    var level = _ref4.level,
        message = _ref4.message;

    if (logFunctions.savedMessages) {
      logFunctions.savedMessages.push(message);
    }
  },
  onUpdateEnd: function onUpdateEnd(_ref5) {
    var level = _ref5.level,
        id = _ref5.id,
        numInstances = _ref5.numInstances;

    var timeMs = Math.round(new Date() - logFunctions.timeStart);
    var time = timeMs + 'ms';
    _log2.default.group(level, 'Updated attributes for ' + numInstances + ' instances in ' + id + ' in ' + time, {
      collapsed: true
    });
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = logFunctions.savedMessages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var message = _step.value;

        _log2.default.log(level, message);
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

    _log2.default.groupEnd(level, 'Updated attributes for ' + numInstances + ' instances in ' + id + ' in ' + time);
    logFunctions.savedMessages = null;
  }
};

var AttributeManager = function () {
  _createClass(AttributeManager, null, [{
    key: 'setDefaultLogFunctions',

    /**
     * Sets log functions to help trace or time attribute updates.
     * Default logging uses deck logger.
     *
     * `onLog` is called for each attribute.
     *
     * To enable detailed control of timming and e.g. hierarchical logging,
     * hooks are also provided for update start and end.
     *
     * @param {Object} [opts]
     * @param {String} [opts.onLog=] - called to print
     * @param {String} [opts.onUpdateStart=] - called before update() starts
     * @param {String} [opts.onUpdateEnd=] - called after update() ends
     */
    value: function setDefaultLogFunctions() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          onLog = _ref6.onLog,
          onUpdateStart = _ref6.onUpdateStart,
          onUpdate = _ref6.onUpdate,
          onUpdateEnd = _ref6.onUpdateEnd;

      if (onLog !== undefined) {
        logFunctions.onLog = onLog || noop;
      }
      if (onUpdateStart !== undefined) {
        logFunctions.onUpdateStart = onUpdateStart || noop;
      }
      if (onUpdate !== undefined) {
        logFunctions.onUpdate = onUpdate || noop;
      }
      if (onUpdateEnd !== undefined) {
        logFunctions.onUpdateEnd = onUpdateEnd || noop;
      }
    }

    /**
     * @classdesc
     * Automated attribute generation and management. Suitable when a set of
     * vertex shader attributes are generated by iteration over a data array,
     * and updates to these attributes are needed either when the data itself
     * changes, or when other data relevant to the calculations change.
     *
     * - First the application registers descriptions of its dynamic vertex
     *   attributes using AttributeManager.add().
     * - Then, when any change that affects attributes is detected by the
     *   application, the app will call AttributeManager.invalidate().
     * - Finally before it renders, it calls AttributeManager.update() to
     *   ensure that attributes are automatically rebuilt if anything has been
     *   invalidated.
     *
     * The application provided update functions describe how attributes
     * should be updated from a data array and are expected to traverse
     * that data array (or iterable) and fill in the attribute's typed array.
     *
     * Note that the attribute manager intentionally does not do advanced
     * change detection, but instead makes it easy to build such detection
     * by offering the ability to "invalidate" each attribute separately.
     *
     * Summary:
     * - keeps track of valid state for each attribute
     * - auto reallocates attributes when needed
     * - auto updates attributes with registered updater functions
     * - allows overriding with application supplied buffers
     *
     * Limitations:
     * - There are currently no provisions for only invalidating a range of
     *   indices in an attribute.
     *
     * @class
     * @param {Object} [props]
     * @param {String} [props.id] - identifier (for debugging)
     */

  }]);

  function AttributeManager(gl) {
    var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref7$id = _ref7.id,
        id = _ref7$id === undefined ? 'attribute-manager' : _ref7$id;

    _classCallCheck(this, AttributeManager);

    this.id = id;
    this.gl = gl;

    this.attributes = {};
    this.updateTriggers = {};
    this.accessors = {};
    this.allocedInstances = -1;
    this.needsRedraw = true;

    this.userData = {};
    this.stats = new _stats2.default({ id: 'attr' });

    this.attributeTransitionManger = new _attributeTransitionManager2.default(gl, {
      id: id + '-transitions'
    });

    // For debugging sanity, prevent uninitialized members
    Object.seal(this);
  }

  /**
   * Adds attributes
   * Takes a map of attribute descriptor objects
   * - keys are attribute names
   * - values are objects with attribute fields
   *
   * attribute.size - number of elements per object
   * attribute.updater - number of elements
   * attribute.instanced=0 - is this is an instanced attribute (a.k.a. divisor)
   * attribute.noAlloc=false - if this attribute should not be allocated
   *
   * @example
   * attributeManager.add({
   *   positions: {size: 2, update: calculatePositions}
   *   colors: {size: 3, update: calculateColors}
   * });
   *
   * @param {Object} attributes - attribute map (see above)
   * @param {Object} updaters - separate map of update functions (deprecated)
   */


  _createClass(AttributeManager, [{
    key: 'add',
    value: function add(attributes) {
      var updaters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._add(attributes, updaters);
    }

    /**
     * Removes attributes
     * Takes an array of attribute names and delete them from
     * the attribute map if they exists
     *
     * @example
     * attributeManager.remove(['position']);
     *
     * @param {Object} attributeNameArray - attribute name array (see above)
     */

  }, {
    key: 'remove',
    value: function remove(attributeNameArray) {
      for (var i = 0; i < attributeNameArray.length; i++) {
        var name = attributeNameArray[i];
        if (this.attributes[name] !== undefined) {
          delete this.attributes[name];
        }
      }
    }

    /* Marks an attribute for update
     * @param {string} triggerName: attribute or accessor name
     */

  }, {
    key: 'invalidate',
    value: function invalidate(triggerName) {
      var invalidatedAttributes = this._invalidateTrigger(triggerName);

      // For performance tuning
      logFunctions.onLog({
        level: LOG_DETAIL_PRIORITY,
        message: 'invalidated attributes ' + invalidatedAttributes + ' (' + triggerName + ') for ' + this.id,
        id: this.identifier
      });
    }
  }, {
    key: 'invalidateAll',
    value: function invalidateAll() {
      for (var attributeName in this.attributes) {
        this.attributes[attributeName].needsUpdate = true;
      }

      // For performance tuning
      logFunctions.onLog({
        level: LOG_DETAIL_PRIORITY,
        message: 'invalidated all attributes for ' + this.id,
        id: this.identifier
      });
    }
  }, {
    key: '_invalidateTrigger',
    value: function _invalidateTrigger(triggerName) {
      var attributes = this.attributes,
          updateTriggers = this.updateTriggers;

      var invalidatedAttributes = updateTriggers[triggerName];

      if (!invalidatedAttributes) {
        var message = 'invalidating non-existent trigger ' + triggerName + ' for ' + this.id + '\n';
        message += 'Valid triggers: ' + Object.keys(attributes).join(', ');
        _log2.default.warn(message, invalidatedAttributes);
      } else {
        invalidatedAttributes.forEach(function (name) {
          var attribute = attributes[name];
          if (attribute) {
            attribute.needsUpdate = true;
          }
        });
      }
      return invalidatedAttributes;
    }

    /**
     * Ensure all attribute buffers are updated from props or data.
     *
     * Note: Any preallocated buffers in "buffers" matching registered attribute
     * names will be used. No update will happen in this case.
     * Note: Calls onUpdateStart and onUpdateEnd log callbacks before and after.
     *
     * @param {Object} opts - options
     * @param {Object} opts.data - data (iterable object)
     * @param {Object} opts.numInstances - count of data
     * @param {Object} opts.buffers = {} - pre-allocated buffers
     * @param {Object} opts.props - passed to updaters
     * @param {Object} opts.context - Used as "this" context for updaters
     */

  }, {
    key: 'update',
    value: function update() {
      var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          data = _ref8.data,
          numInstances = _ref8.numInstances,
          transitions = _ref8.transitions,
          _ref8$props = _ref8.props,
          props = _ref8$props === undefined ? {} : _ref8$props,
          _ref8$buffers = _ref8.buffers,
          buffers = _ref8$buffers === undefined ? {} : _ref8$buffers,
          _ref8$context = _ref8.context,
          context = _ref8$context === undefined ? {} : _ref8$context,
          _ref8$ignoreUnknownAt = _ref8.ignoreUnknownAttributes,
          ignoreUnknownAttributes = _ref8$ignoreUnknownAt === undefined ? false : _ref8$ignoreUnknownAt;

      // First apply any application provided buffers
      this._checkExternalBuffers({ buffers: buffers, ignoreUnknownAttributes: ignoreUnknownAttributes });
      this._setExternalBuffers(buffers);

      // Only initiate alloc/update (and logging) if actually needed
      if (this._analyzeBuffers({ numInstances: numInstances })) {
        logFunctions.onUpdateStart({ level: LOG_START_END_PRIORITY, id: this.id, numInstances: numInstances });
        this.stats.timeStart();
        this._updateBuffers({ numInstances: numInstances, data: data, props: props, context: context });
        this.stats.timeEnd();
        logFunctions.onUpdateEnd({ level: LOG_START_END_PRIORITY, id: this.id, numInstances: numInstances });
      }

      this.attributeTransitionManger.update(this.attributes, transitions);
    }

    /**
     * Returns all attribute descriptors
     * Note: Format matches luma.gl Model/Program.setAttributes()
     * @return {Object} attributes - descriptors
     */

  }, {
    key: 'getAttributes',
    value: function getAttributes() {
      return this.attributes;
    }

    /**
     * Returns changed attribute descriptors
     * This indicates which WebGLBuggers need to be updated
     * @return {Object} attributes - descriptors
     */

  }, {
    key: 'getChangedAttributes',
    value: function getChangedAttributes(_ref9) {
      var _ref9$transition = _ref9.transition,
          transition = _ref9$transition === undefined ? false : _ref9$transition,
          _ref9$clearChangedFla = _ref9.clearChangedFlags,
          clearChangedFlags = _ref9$clearChangedFla === undefined ? false : _ref9$clearChangedFla;
      var attributes = this.attributes,
          attributeTransitionManger = this.attributeTransitionManger;


      if (transition) {
        return attributeTransitionManger.getAttributes();
      }

      var changedAttributes = {};
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        if (attribute.changed) {
          attribute.changed = attribute.changed && !clearChangedFlags;

          // Only return non-transition attributes
          if (!attributeTransitionManger.hasAttribute(attributeName)) {
            changedAttributes[attributeName] = attribute;
          }
        }
      }
      return changedAttributes;
    }

    /**
     * Returns the redraw flag, optionally clearing it.
     * Redraw flag will be set if any attributes attributes changed since
     * flag was last cleared.
     *
     * @param {Object} [opts]
     * @param {String} [opts.clearRedrawFlags=false] - whether to clear the flag
     * @return {false|String} - reason a redraw is needed.
     */

  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref10 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref10$clearRedrawFla = _ref10.clearRedrawFlags,
          clearRedrawFlags = _ref10$clearRedrawFla === undefined ? false : _ref10$clearRedrawFla;

      var redraw = this.needsRedraw;
      this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
      return redraw && this.id;
    }

    /**
     * Sets the redraw flag.
     * @param {Boolean} redraw=true
     * @return {AttributeManager} - for chaining
     */

  }, {
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.needsRedraw = true;
      return this;
    }

    // DEPRECATED METHODS

    /**
     * Adds attributes
     * @param {Object} attributes - attribute map (see above)
     * @param {Object} updaters - separate map of update functions (deprecated)
     */

  }, {
    key: 'addInstanced',
    value: function addInstanced(attributes) {
      var updaters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._add(attributes, updaters, { instanced: 1 });
    }

    // PROTECTED METHODS - Only to be used by collaborating classes, not by apps

    /**
     * Returns object containing all accessors as keys, with non-null values
     * @return {Object} - accessors object
     */

  }, {
    key: 'getAccessors',
    value: function getAccessors() {
      return this.updateTriggers;
    }

    // PRIVATE METHODS

    // Used to register an attribute

  }, {
    key: '_add',
    value: function _add(attributes) {
      var updaters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _extraProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var newAttributes = {};

      for (var attributeName in attributes) {
        // support for separate update function map
        // For now, just copy any attributes from that map into the main map
        // TODO - Attribute maps are a deprecated feature, remove
        if (attributeName in updaters) {
          attributes[attributeName] = Object.assign({}, attributes[attributeName], updaters[attributeName]);
        }

        var attribute = attributes[attributeName];

        var isGeneric = attribute.isGeneric || false;
        var isIndexed = attribute.isIndexed || attribute.elements;
        var size = attribute.elements && 1 || attribute.size;
        var value = attribute.value || null;

        // Initialize the attribute descriptor, with WebGL and metadata fields
        var attributeData = Object.assign({
          // Ensure that fields are present before Object.seal()
          target: undefined,
          userData: {} // Reserved for application
        },
        // Metadata
        attribute, {
          // State
          isExternalBuffer: false,
          needsAlloc: false,
          needsUpdate: false,
          changed: false,

          // Luma fields
          isGeneric: isGeneric,
          isIndexed: isIndexed,
          size: size,
          value: value
        }, _extraProps);
        // Sanity - no app fields on our attributes. Use userData instead.
        Object.seal(attributeData);

        // Check all fields and generate helpful error messages
        this._validateAttributeDefinition(attributeName, attributeData);

        // Add to both attributes list (for registration with model)
        newAttributes[attributeName] = attributeData;
      }

      Object.assign(this.attributes, newAttributes);

      this._mapUpdateTriggersToAttributes();
    }

    // build updateTrigger name to attribute name mapping

  }, {
    key: '_mapUpdateTriggersToAttributes',
    value: function _mapUpdateTriggersToAttributes() {
      var _this = this;

      var triggers = {};

      var _loop = function _loop(attributeName) {
        var attribute = _this.attributes[attributeName];
        var accessor = attribute.accessor;

        // Backards compatibility: allow attribute name to be used as update trigger key

        triggers[attributeName] = [attributeName];

        // use accessor name as update trigger key
        if (typeof accessor === 'string') {
          accessor = [accessor];
        }
        if (Array.isArray(accessor)) {
          accessor.forEach(function (accessorName) {
            if (!triggers[accessorName]) {
              triggers[accessorName] = [];
            }
            triggers[accessorName].push(attributeName);
          });
        }
      };

      for (var attributeName in this.attributes) {
        _loop(attributeName);
      }

      this.updateTriggers = triggers;
    }
  }, {
    key: '_validateAttributeDefinition',
    value: function _validateAttributeDefinition(attributeName, attribute) {
      (0, _assert2.default)(attribute.size >= 1 && attribute.size <= 4, 'Attribute definition for ' + attributeName + ' invalid size');

      // Check that either 'accessor' or 'update' is a valid function
      var hasUpdater = attribute.noAlloc || typeof attribute.update === 'function' || typeof attribute.accessor === 'string';
      if (!hasUpdater) {
        throw new Error('Attribute ' + attributeName + ' missing update or accessor');
      }
    }

    // Checks that any attribute buffers in props are valid
    // Note: This is just to help app catch mistakes

  }, {
    key: '_checkExternalBuffers',
    value: function _checkExternalBuffers() {
      var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref11$buffers = _ref11.buffers,
          buffers = _ref11$buffers === undefined ? {} : _ref11$buffers,
          _ref11$ignoreUnknownA = _ref11.ignoreUnknownAttributes,
          ignoreUnknownAttributes = _ref11$ignoreUnknownA === undefined ? false : _ref11$ignoreUnknownA;

      var attributes = this.attributes;

      for (var attributeName in buffers) {
        var attribute = attributes[attributeName];
        if (!attribute && !ignoreUnknownAttributes) {
          throw new Error('Unknown attribute prop ' + attributeName);
        }
        // const buffer = buffers[attributeName];
        // TODO - check buffer type
      }
    }

    // Set the buffers for the supplied attributes
    // Update attribute buffers from any attributes in props
    // Detach any previously set buffers, marking all
    // Attributes for auto allocation
    /* eslint-disable max-statements */

  }, {
    key: '_setExternalBuffers',
    value: function _setExternalBuffers(bufferMap) {
      var attributes = this.attributes,
          numInstances = this.numInstances;

      // Copy the refs of any supplied buffers in the props

      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        var buffer = bufferMap[attributeName];
        attribute.isExternalBuffer = false;
        if (buffer) {
          var ArrayType = glArrayFromType(attribute.type || _luma.GL.FLOAT);
          if (!(buffer instanceof ArrayType)) {
            throw new Error('Attribute ' + attributeName + ' must be of type ' + ArrayType.name);
          }
          if (attribute.auto && buffer.length <= numInstances * attribute.size) {
            throw new Error('Attribute prop array must match length and size');
          }

          attribute.isExternalBuffer = true;
          attribute.needsUpdate = false;
          if (attribute.value !== buffer) {
            attribute.value = buffer;
            attribute.changed = true;
            this.needsRedraw = true;
          }
        }
      }
    }
    /* eslint-enable max-statements */

    /* Checks that typed arrays for attributes are big enough
     * sets alloc flag if not
     * @return {Boolean} whether any updates are needed
     */

  }, {
    key: '_analyzeBuffers',
    value: function _analyzeBuffers(_ref12) {
      var numInstances = _ref12.numInstances;
      var attributes = this.attributes;

      (0, _assert2.default)(numInstances !== undefined, 'numInstances not defined');

      // Track whether any allocations or updates are needed
      var needsUpdate = false;

      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        if (!attribute.isExternalBuffer) {
          // Do we need to reallocate the attribute's typed array?
          var needsAlloc = attribute.value === null || attribute.value.length / attribute.size < numInstances;
          if (needsAlloc && (attribute.update || attribute.accessor)) {
            attribute.needsAlloc = true;
            needsUpdate = true;
          }
          if (attribute.needsUpdate) {
            needsUpdate = true;
          }
        }
      }

      return needsUpdate;
    }

    /**
     * @private
     * Calls update on any buffers that need update
     * TODO? - If app supplied all attributes, no need to iterate over data
     *
     * @param {Object} opts - options
     * @param {Object} opts.data - data (iterable object)
     * @param {Object} opts.numInstances - count of data
     * @param {Object} opts.buffers = {} - pre-allocated buffers
     * @param {Object} opts.props - passed to updaters
     * @param {Object} opts.context - Used as "this" context for updaters
     */
    /* eslint-disable max-statements, complexity */

  }, {
    key: '_updateBuffers',
    value: function _updateBuffers(_ref13) {
      var numInstances = _ref13.numInstances,
          data = _ref13.data,
          props = _ref13.props,
          context = _ref13.context;
      var attributes = this.attributes;

      // Allocate at least one element to ensure a valid buffer

      var allocCount = Math.max(numInstances, 1);

      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];

        // Allocate a new typed array if needed
        if (attribute.needsAlloc) {
          var ArrayType = glArrayFromType(attribute.type || _luma.GL.FLOAT);
          attribute.value = new ArrayType(attribute.size * allocCount);
          logFunctions.onUpdate({
            level: LOG_DETAIL_PRIORITY,
            message: attributeName + ' allocated ' + allocCount,
            id: this.id
          });
          attribute.needsAlloc = false;
          attribute.needsUpdate = true;
        }
      }

      for (var _attributeName in attributes) {
        var _attribute = attributes[_attributeName];
        // Call updater function if needed
        if (_attribute.needsUpdate) {
          this._updateBuffer({ attribute: _attribute, attributeName: _attributeName, numInstances: numInstances, data: data, props: props, context: context });
        }
      }

      this.allocedInstances = allocCount;
    }
  }, {
    key: '_updateBuffer',
    value: function _updateBuffer(_ref14) {
      var attribute = _ref14.attribute,
          attributeName = _ref14.attributeName,
          numInstances = _ref14.numInstances,
          data = _ref14.data,
          props = _ref14.props,
          context = _ref14.context;
      var update = attribute.update,
          accessor = attribute.accessor;


      var timeStart = new Date();
      if (update) {
        // Custom updater - typically for non-instanced layers
        update.call(context, attribute, { data: data, props: props, numInstances: numInstances });
        this._checkAttributeArray(attribute, attributeName);
      } else if (accessor) {
        // Standard updater
        this._updateBufferViaStandardAccessor({ attribute: attribute, data: data, props: props });
        this._checkAttributeArray(attribute, attributeName);
      } else {
        logFunctions.onUpdate({
          level: LOG_DETAIL_PRIORITY,
          message: attributeName + ' missing update function',
          id: this.id
        });
      }
      var timeMs = Math.round(new Date() - timeStart);
      var time = timeMs + 'ms';
      logFunctions.onUpdate({
        level: LOG_DETAIL_PRIORITY,
        message: attributeName + ' updated ' + numInstances + ' ' + time,
        id: this.id
      });

      attribute.needsUpdate = false;
      attribute.changed = true;
      this.needsRedraw = true;
    }
    /* eslint-enable max-statements */

  }, {
    key: '_updateBufferViaStandardAccessor',
    value: function _updateBufferViaStandardAccessor(_ref15) {
      var attribute = _ref15.attribute,
          data = _ref15.data,
          props = _ref15.props;
      var accessor = attribute.accessor,
          value = attribute.value,
          size = attribute.size;

      var accessorFunc = props[accessor];

      (0, _assert2.default)(typeof accessorFunc === 'function', 'accessor "' + accessor + '" is not a function');

      var _attribute$defaultVal = attribute.defaultValue,
          defaultValue = _attribute$defaultVal === undefined ? [0, 0, 0, 0] : _attribute$defaultVal;

      defaultValue = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          var objectValue = accessorFunc(object);
          objectValue = Array.isArray(objectValue) ? objectValue : [objectValue];
          /* eslint-disable no-fallthrough, default-case */
          switch (size) {
            case 4:
              value[i + 3] = Number.isFinite(objectValue[3]) ? objectValue[3] : defaultValue[3];
            case 3:
              value[i + 2] = Number.isFinite(objectValue[2]) ? objectValue[2] : defaultValue[2];
            case 2:
              value[i + 1] = Number.isFinite(objectValue[1]) ? objectValue[1] : defaultValue[1];
            case 1:
              value[i + 0] = Number.isFinite(objectValue[0]) ? objectValue[0] : defaultValue[0];
          }
          i += size;
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
  }, {
    key: '_checkAttributeArray',
    value: function _checkAttributeArray(attribute, attributeName) {
      var value = attribute.value;

      if (value && value.length >= 4) {
        var valid = Number.isFinite(value[0]) && Number.isFinite(value[1]) && Number.isFinite(value[2]) && Number.isFinite(value[3]);
        if (!valid) {
          throw new Error('Illegal attribute generated for ' + attributeName);
        }
      }
    }

    /**
     * Update attribute transition to the current timestamp
     * Returns `true` if any transition is in progress
     */

  }, {
    key: 'updateTransition',
    value: function updateTransition() {
      var attributeTransitionManger = this.attributeTransitionManger;

      var transitionUpdated = attributeTransitionManger.setCurrentTime(Date.now());
      this.needsRedraw = this.needsRedraw || transitionUpdated;
      return transitionUpdated;
    }
  }]);

  return AttributeManager;
}();

exports.default = AttributeManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9hdHRyaWJ1dGUtbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJnbEFycmF5RnJvbVR5cGUiLCJMT0dfU1RBUlRfRU5EX1BSSU9SSVRZIiwiTE9HX0RFVEFJTF9QUklPUklUWSIsIm5vb3AiLCJnbFR5cGUiLCJjbGFtcGVkIiwiRkxPQVQiLCJGbG9hdDMyQXJyYXkiLCJVTlNJR05FRF9TSE9SVCIsIlVOU0lHTkVEX1NIT1JUXzVfNl81IiwiVU5TSUdORURfU0hPUlRfNF80XzRfNCIsIlVOU0lHTkVEX1NIT1JUXzVfNV81XzEiLCJVaW50MTZBcnJheSIsIlVOU0lHTkVEX0lOVCIsIlVpbnQzMkFycmF5IiwiVU5TSUdORURfQllURSIsIlVpbnQ4Q2xhbXBlZEFycmF5IiwiVWludDhBcnJheSIsIkJZVEUiLCJJbnQ4QXJyYXkiLCJTSE9SVCIsIkludDE2QXJyYXkiLCJJTlQiLCJJbnQzMkFycmF5IiwiRXJyb3IiLCJsb2dGdW5jdGlvbnMiLCJzYXZlZE1lc3NhZ2VzIiwidGltZVN0YXJ0Iiwib25Mb2ciLCJsZXZlbCIsIm1lc3NhZ2UiLCJsb2ciLCJvblVwZGF0ZVN0YXJ0IiwiaWQiLCJudW1JbnN0YW5jZXMiLCJEYXRlIiwib25VcGRhdGUiLCJwdXNoIiwib25VcGRhdGVFbmQiLCJ0aW1lTXMiLCJNYXRoIiwicm91bmQiLCJ0aW1lIiwiZ3JvdXAiLCJjb2xsYXBzZWQiLCJncm91cEVuZCIsIkF0dHJpYnV0ZU1hbmFnZXIiLCJ1bmRlZmluZWQiLCJnbCIsImF0dHJpYnV0ZXMiLCJ1cGRhdGVUcmlnZ2VycyIsImFjY2Vzc29ycyIsImFsbG9jZWRJbnN0YW5jZXMiLCJuZWVkc1JlZHJhdyIsInVzZXJEYXRhIiwic3RhdHMiLCJhdHRyaWJ1dGVUcmFuc2l0aW9uTWFuZ2VyIiwiT2JqZWN0Iiwic2VhbCIsInVwZGF0ZXJzIiwiX2FkZCIsImF0dHJpYnV0ZU5hbWVBcnJheSIsImkiLCJsZW5ndGgiLCJuYW1lIiwidHJpZ2dlck5hbWUiLCJpbnZhbGlkYXRlZEF0dHJpYnV0ZXMiLCJfaW52YWxpZGF0ZVRyaWdnZXIiLCJpZGVudGlmaWVyIiwiYXR0cmlidXRlTmFtZSIsIm5lZWRzVXBkYXRlIiwia2V5cyIsImpvaW4iLCJ3YXJuIiwiZm9yRWFjaCIsImF0dHJpYnV0ZSIsImRhdGEiLCJ0cmFuc2l0aW9ucyIsInByb3BzIiwiYnVmZmVycyIsImNvbnRleHQiLCJpZ25vcmVVbmtub3duQXR0cmlidXRlcyIsIl9jaGVja0V4dGVybmFsQnVmZmVycyIsIl9zZXRFeHRlcm5hbEJ1ZmZlcnMiLCJfYW5hbHl6ZUJ1ZmZlcnMiLCJfdXBkYXRlQnVmZmVycyIsInRpbWVFbmQiLCJ1cGRhdGUiLCJ0cmFuc2l0aW9uIiwiY2xlYXJDaGFuZ2VkRmxhZ3MiLCJnZXRBdHRyaWJ1dGVzIiwiY2hhbmdlZEF0dHJpYnV0ZXMiLCJjaGFuZ2VkIiwiaGFzQXR0cmlidXRlIiwiY2xlYXJSZWRyYXdGbGFncyIsInJlZHJhdyIsImluc3RhbmNlZCIsIl9leHRyYVByb3BzIiwibmV3QXR0cmlidXRlcyIsImFzc2lnbiIsImlzR2VuZXJpYyIsImlzSW5kZXhlZCIsImVsZW1lbnRzIiwic2l6ZSIsInZhbHVlIiwiYXR0cmlidXRlRGF0YSIsInRhcmdldCIsImlzRXh0ZXJuYWxCdWZmZXIiLCJuZWVkc0FsbG9jIiwiX3ZhbGlkYXRlQXR0cmlidXRlRGVmaW5pdGlvbiIsIl9tYXBVcGRhdGVUcmlnZ2Vyc1RvQXR0cmlidXRlcyIsInRyaWdnZXJzIiwiYWNjZXNzb3IiLCJBcnJheSIsImlzQXJyYXkiLCJhY2Nlc3Nvck5hbWUiLCJoYXNVcGRhdGVyIiwibm9BbGxvYyIsImJ1ZmZlck1hcCIsImJ1ZmZlciIsIkFycmF5VHlwZSIsInR5cGUiLCJhdXRvIiwiYWxsb2NDb3VudCIsIm1heCIsIl91cGRhdGVCdWZmZXIiLCJjYWxsIiwiX2NoZWNrQXR0cmlidXRlQXJyYXkiLCJfdXBkYXRlQnVmZmVyVmlhU3RhbmRhcmRBY2Nlc3NvciIsImFjY2Vzc29yRnVuYyIsImRlZmF1bHRWYWx1ZSIsIm9iamVjdCIsIm9iamVjdFZhbHVlIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJ2YWxpZCIsInRyYW5zaXRpb25VcGRhdGVkIiwic2V0Q3VycmVudFRpbWUiLCJub3ciXSwibWFwcGluZ3MiOiI7Ozs7OztxakJBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7OztRQWNnQkEsZSxHQUFBQSxlOztBQWJoQjs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7QUFFQSxJQUFNQyx5QkFBeUIsQ0FBL0I7QUFDQSxJQUFNQyxzQkFBc0IsQ0FBNUI7O0FBRUEsU0FBU0MsSUFBVCxHQUFnQixDQUFFOztBQUVsQjtBQUNPLFNBQVNILGVBQVQsQ0FBeUJJLE1BQXpCLEVBQXdEO0FBQUEsaUZBQUosRUFBSTtBQUFBLDBCQUF0QkMsT0FBc0I7QUFBQSxNQUF0QkEsT0FBc0IsZ0NBQVosSUFBWTs7QUFDN0Q7QUFDQSxVQUFRRCxNQUFSO0FBQ0UsU0FBSyxTQUFHRSxLQUFSO0FBQ0UsYUFBT0MsWUFBUDtBQUNGLFNBQUssU0FBR0MsY0FBUjtBQUNBLFNBQUssU0FBR0Msb0JBQVI7QUFDQSxTQUFLLFNBQUdDLHNCQUFSO0FBQ0EsU0FBSyxTQUFHQyxzQkFBUjtBQUNFLGFBQU9DLFdBQVA7QUFDRixTQUFLLFNBQUdDLFlBQVI7QUFDRSxhQUFPQyxXQUFQO0FBQ0YsU0FBSyxTQUFHQyxhQUFSO0FBQ0UsYUFBT1YsVUFBVVcsaUJBQVYsR0FBOEJDLFVBQXJDO0FBQ0YsU0FBSyxTQUFHQyxJQUFSO0FBQ0UsYUFBT0MsU0FBUDtBQUNGLFNBQUssU0FBR0MsS0FBUjtBQUNFLGFBQU9DLFVBQVA7QUFDRixTQUFLLFNBQUdDLEdBQVI7QUFDRSxhQUFPQyxVQUFQO0FBQ0Y7QUFDRSxZQUFNLElBQUlDLEtBQUosQ0FBVSxrQ0FBVixDQUFOO0FBbkJKO0FBcUJEO0FBQ0Q7O0FBRUE7QUFDQSxJQUFNQyxlQUFlO0FBQ25CQyxpQkFBZSxJQURJO0FBRW5CQyxhQUFXLElBRlE7O0FBSW5CQyxTQUFPLHNCQUFzQjtBQUFBLFFBQXBCQyxLQUFvQixTQUFwQkEsS0FBb0I7QUFBQSxRQUFiQyxPQUFhLFNBQWJBLE9BQWE7O0FBQzNCLGtCQUFJQyxHQUFKLENBQVFGLEtBQVIsRUFBZUMsT0FBZjtBQUNELEdBTmtCO0FBT25CRSxpQkFBZSw4QkFBK0I7QUFBQSxRQUE3QkgsS0FBNkIsU0FBN0JBLEtBQTZCO0FBQUEsUUFBdEJJLEVBQXNCLFNBQXRCQSxFQUFzQjtBQUFBLFFBQWxCQyxZQUFrQixTQUFsQkEsWUFBa0I7O0FBQzVDVCxpQkFBYUMsYUFBYixHQUE2QixFQUE3QjtBQUNBRCxpQkFBYUUsU0FBYixHQUF5QixJQUFJUSxJQUFKLEVBQXpCO0FBQ0QsR0FWa0I7QUFXbkJDLFlBQVUseUJBQXNCO0FBQUEsUUFBcEJQLEtBQW9CLFNBQXBCQSxLQUFvQjtBQUFBLFFBQWJDLE9BQWEsU0FBYkEsT0FBYTs7QUFDOUIsUUFBSUwsYUFBYUMsYUFBakIsRUFBZ0M7QUFDOUJELG1CQUFhQyxhQUFiLENBQTJCVyxJQUEzQixDQUFnQ1AsT0FBaEM7QUFDRDtBQUNGLEdBZmtCO0FBZ0JuQlEsZUFBYSw0QkFBK0I7QUFBQSxRQUE3QlQsS0FBNkIsU0FBN0JBLEtBQTZCO0FBQUEsUUFBdEJJLEVBQXNCLFNBQXRCQSxFQUFzQjtBQUFBLFFBQWxCQyxZQUFrQixTQUFsQkEsWUFBa0I7O0FBQzFDLFFBQU1LLFNBQVNDLEtBQUtDLEtBQUwsQ0FBVyxJQUFJTixJQUFKLEtBQWFWLGFBQWFFLFNBQXJDLENBQWY7QUFDQSxRQUFNZSxPQUFVSCxNQUFWLE9BQU47QUFDQSxrQkFBSUksS0FBSixDQUFVZCxLQUFWLDhCQUEyQ0ssWUFBM0Msc0JBQXdFRCxFQUF4RSxZQUFpRlMsSUFBakYsRUFBeUY7QUFDdkZFLGlCQUFXO0FBRDRFLEtBQXpGO0FBSDBDO0FBQUE7QUFBQTs7QUFBQTtBQU0xQywyQkFBc0JuQixhQUFhQyxhQUFuQyw4SEFBa0Q7QUFBQSxZQUF2Q0ksT0FBdUM7O0FBQ2hELHNCQUFJQyxHQUFKLENBQVFGLEtBQVIsRUFBZUMsT0FBZjtBQUNEO0FBUnlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBUzFDLGtCQUFJZSxRQUFKLENBQWFoQixLQUFiLDhCQUE4Q0ssWUFBOUMsc0JBQTJFRCxFQUEzRSxZQUFvRlMsSUFBcEY7QUFDQWpCLGlCQUFhQyxhQUFiLEdBQTZCLElBQTdCO0FBQ0Q7QUEzQmtCLENBQXJCOztJQThCcUJvQixnQjs7OztBQUNuQjs7Ozs7Ozs7Ozs7Ozs7NkNBY2tGO0FBQUEsc0ZBQUosRUFBSTtBQUFBLFVBQW5EbEIsS0FBbUQsU0FBbkRBLEtBQW1EO0FBQUEsVUFBNUNJLGFBQTRDLFNBQTVDQSxhQUE0QztBQUFBLFVBQTdCSSxRQUE2QixTQUE3QkEsUUFBNkI7QUFBQSxVQUFuQkUsV0FBbUIsU0FBbkJBLFdBQW1COztBQUNoRixVQUFJVixVQUFVbUIsU0FBZCxFQUF5QjtBQUN2QnRCLHFCQUFhRyxLQUFiLEdBQXFCQSxTQUFTekIsSUFBOUI7QUFDRDtBQUNELFVBQUk2QixrQkFBa0JlLFNBQXRCLEVBQWlDO0FBQy9CdEIscUJBQWFPLGFBQWIsR0FBNkJBLGlCQUFpQjdCLElBQTlDO0FBQ0Q7QUFDRCxVQUFJaUMsYUFBYVcsU0FBakIsRUFBNEI7QUFDMUJ0QixxQkFBYVcsUUFBYixHQUF3QkEsWUFBWWpDLElBQXBDO0FBQ0Q7QUFDRCxVQUFJbUMsZ0JBQWdCUyxTQUFwQixFQUErQjtBQUM3QnRCLHFCQUFhYSxXQUFiLEdBQTJCQSxlQUFlbkMsSUFBMUM7QUFDRDtBQUNGOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUNBLDRCQUFZNkMsRUFBWixFQUFpRDtBQUFBLG9GQUFKLEVBQUk7QUFBQSx5QkFBaENmLEVBQWdDO0FBQUEsUUFBaENBLEVBQWdDLDRCQUEzQixtQkFBMkI7O0FBQUE7O0FBQy9DLFNBQUtBLEVBQUwsR0FBVUEsRUFBVjtBQUNBLFNBQUtlLEVBQUwsR0FBVUEsRUFBVjs7QUFFQSxTQUFLQyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixFQUF0QjtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixDQUFDLENBQXpCO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixJQUFuQjs7QUFFQSxTQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0EsU0FBS0MsS0FBTCxHQUFhLG9CQUFVLEVBQUN0QixJQUFJLE1BQUwsRUFBVixDQUFiOztBQUVBLFNBQUt1Qix5QkFBTCxHQUFpQyx5Q0FBK0JSLEVBQS9CLEVBQW1DO0FBQ2xFZixVQUFPQSxFQUFQO0FBRGtFLEtBQW5DLENBQWpDOztBQUlBO0FBQ0F3QixXQUFPQyxJQUFQLENBQVksSUFBWjtBQUNEOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBb0JJVCxVLEVBQTJCO0FBQUEsVUFBZlUsUUFBZSx1RUFBSixFQUFJOztBQUM3QixXQUFLQyxJQUFMLENBQVVYLFVBQVYsRUFBc0JVLFFBQXRCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7MkJBVU9FLGtCLEVBQW9CO0FBQ3pCLFdBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRCxtQkFBbUJFLE1BQXZDLEVBQStDRCxHQUEvQyxFQUFvRDtBQUNsRCxZQUFNRSxPQUFPSCxtQkFBbUJDLENBQW5CLENBQWI7QUFDQSxZQUFJLEtBQUtiLFVBQUwsQ0FBZ0JlLElBQWhCLE1BQTBCakIsU0FBOUIsRUFBeUM7QUFDdkMsaUJBQU8sS0FBS0UsVUFBTCxDQUFnQmUsSUFBaEIsQ0FBUDtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7Ozs7OytCQUdXQyxXLEVBQWE7QUFDdEIsVUFBTUMsd0JBQXdCLEtBQUtDLGtCQUFMLENBQXdCRixXQUF4QixDQUE5Qjs7QUFFQTtBQUNBeEMsbUJBQWFHLEtBQWIsQ0FBbUI7QUFDakJDLGVBQU8zQixtQkFEVTtBQUVqQjRCLDZDQUFtQ29DLHFCQUFuQyxVQUE2REQsV0FBN0QsY0FBaUYsS0FBS2hDLEVBRnJFO0FBR2pCQSxZQUFJLEtBQUttQztBQUhRLE9BQW5CO0FBS0Q7OztvQ0FFZTtBQUNkLFdBQUssSUFBTUMsYUFBWCxJQUE0QixLQUFLcEIsVUFBakMsRUFBNkM7QUFDM0MsYUFBS0EsVUFBTCxDQUFnQm9CLGFBQWhCLEVBQStCQyxXQUEvQixHQUE2QyxJQUE3QztBQUNEOztBQUVEO0FBQ0E3QyxtQkFBYUcsS0FBYixDQUFtQjtBQUNqQkMsZUFBTzNCLG1CQURVO0FBRWpCNEIscURBQTJDLEtBQUtHLEVBRi9CO0FBR2pCQSxZQUFJLEtBQUttQztBQUhRLE9BQW5CO0FBS0Q7Ozt1Q0FFa0JILFcsRUFBYTtBQUFBLFVBQ3ZCaEIsVUFEdUIsR0FDTyxJQURQLENBQ3ZCQSxVQUR1QjtBQUFBLFVBQ1hDLGNBRFcsR0FDTyxJQURQLENBQ1hBLGNBRFc7O0FBRTlCLFVBQU1nQix3QkFBd0JoQixlQUFlZSxXQUFmLENBQTlCOztBQUVBLFVBQUksQ0FBQ0MscUJBQUwsRUFBNEI7QUFDMUIsWUFBSXBDLGlEQUErQ21DLFdBQS9DLGFBQWtFLEtBQUtoQyxFQUF2RSxPQUFKO0FBQ0FILHdDQUE4QjJCLE9BQU9jLElBQVAsQ0FBWXRCLFVBQVosRUFBd0J1QixJQUF4QixDQUE2QixJQUE3QixDQUE5QjtBQUNBLHNCQUFJQyxJQUFKLENBQVMzQyxPQUFULEVBQWtCb0MscUJBQWxCO0FBQ0QsT0FKRCxNQUlPO0FBQ0xBLDhCQUFzQlEsT0FBdEIsQ0FBOEIsZ0JBQVE7QUFDcEMsY0FBTUMsWUFBWTFCLFdBQVdlLElBQVgsQ0FBbEI7QUFDQSxjQUFJVyxTQUFKLEVBQWU7QUFDYkEsc0JBQVVMLFdBQVYsR0FBd0IsSUFBeEI7QUFDRDtBQUNGLFNBTEQ7QUFNRDtBQUNELGFBQU9KLHFCQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQXNCUTtBQUFBLHNGQUFKLEVBQUk7QUFBQSxVQVBOVSxJQU9NLFNBUE5BLElBT007QUFBQSxVQU5OMUMsWUFNTSxTQU5OQSxZQU1NO0FBQUEsVUFMTjJDLFdBS00sU0FMTkEsV0FLTTtBQUFBLDhCQUpOQyxLQUlNO0FBQUEsVUFKTkEsS0FJTSwrQkFKRSxFQUlGO0FBQUEsZ0NBSE5DLE9BR007QUFBQSxVQUhOQSxPQUdNLGlDQUhJLEVBR0o7QUFBQSxnQ0FGTkMsT0FFTTtBQUFBLFVBRk5BLE9BRU0saUNBRkksRUFFSjtBQUFBLHdDQUROQyx1QkFDTTtBQUFBLFVBRE5BLHVCQUNNLHlDQURvQixLQUNwQjs7QUFDTjtBQUNBLFdBQUtDLHFCQUFMLENBQTJCLEVBQUNILGdCQUFELEVBQVVFLGdEQUFWLEVBQTNCO0FBQ0EsV0FBS0UsbUJBQUwsQ0FBeUJKLE9BQXpCOztBQUVBO0FBQ0EsVUFBSSxLQUFLSyxlQUFMLENBQXFCLEVBQUNsRCwwQkFBRCxFQUFyQixDQUFKLEVBQTBDO0FBQ3hDVCxxQkFBYU8sYUFBYixDQUEyQixFQUFDSCxPQUFPNUIsc0JBQVIsRUFBZ0NnQyxJQUFJLEtBQUtBLEVBQXpDLEVBQTZDQywwQkFBN0MsRUFBM0I7QUFDQSxhQUFLcUIsS0FBTCxDQUFXNUIsU0FBWDtBQUNBLGFBQUswRCxjQUFMLENBQW9CLEVBQUNuRCwwQkFBRCxFQUFlMEMsVUFBZixFQUFxQkUsWUFBckIsRUFBNEJFLGdCQUE1QixFQUFwQjtBQUNBLGFBQUt6QixLQUFMLENBQVcrQixPQUFYO0FBQ0E3RCxxQkFBYWEsV0FBYixDQUF5QixFQUFDVCxPQUFPNUIsc0JBQVIsRUFBZ0NnQyxJQUFJLEtBQUtBLEVBQXpDLEVBQTZDQywwQkFBN0MsRUFBekI7QUFDRDs7QUFFRCxXQUFLc0IseUJBQUwsQ0FBK0IrQixNQUEvQixDQUFzQyxLQUFLdEMsVUFBM0MsRUFBdUQ0QixXQUF2RDtBQUNEOztBQUVEOzs7Ozs7OztvQ0FLZ0I7QUFDZCxhQUFPLEtBQUs1QixVQUFaO0FBQ0Q7O0FBRUQ7Ozs7Ozs7O2dEQUtzRTtBQUFBLG1DQUFoRHVDLFVBQWdEO0FBQUEsVUFBaERBLFVBQWdELG9DQUFuQyxLQUFtQztBQUFBLHdDQUE1QkMsaUJBQTRCO0FBQUEsVUFBNUJBLGlCQUE0Qix5Q0FBUixLQUFRO0FBQUEsVUFDN0R4QyxVQUQ2RCxHQUNwQixJQURvQixDQUM3REEsVUFENkQ7QUFBQSxVQUNqRE8seUJBRGlELEdBQ3BCLElBRG9CLENBQ2pEQSx5QkFEaUQ7OztBQUdwRSxVQUFJZ0MsVUFBSixFQUFnQjtBQUNkLGVBQU9oQywwQkFBMEJrQyxhQUExQixFQUFQO0FBQ0Q7O0FBRUQsVUFBTUMsb0JBQW9CLEVBQTFCO0FBQ0EsV0FBSyxJQUFNdEIsYUFBWCxJQUE0QnBCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0wQixZQUFZMUIsV0FBV29CLGFBQVgsQ0FBbEI7QUFDQSxZQUFJTSxVQUFVaUIsT0FBZCxFQUF1QjtBQUNyQmpCLG9CQUFVaUIsT0FBVixHQUFvQmpCLFVBQVVpQixPQUFWLElBQXFCLENBQUNILGlCQUExQzs7QUFFQTtBQUNBLGNBQUksQ0FBQ2pDLDBCQUEwQnFDLFlBQTFCLENBQXVDeEIsYUFBdkMsQ0FBTCxFQUE0RDtBQUMxRHNCLDhCQUFrQnRCLGFBQWxCLElBQW1DTSxTQUFuQztBQUNEO0FBQ0Y7QUFDRjtBQUNELGFBQU9nQixpQkFBUDtBQUNEOztBQUVEOzs7Ozs7Ozs7Ozs7cUNBU2dEO0FBQUEsdUZBQUosRUFBSTtBQUFBLHlDQUFoQ0csZ0JBQWdDO0FBQUEsVUFBaENBLGdCQUFnQyx5Q0FBYixLQUFhOztBQUM5QyxVQUFNQyxTQUFTLEtBQUsxQyxXQUFwQjtBQUNBLFdBQUtBLFdBQUwsR0FBbUIsS0FBS0EsV0FBTCxJQUFvQixDQUFDeUMsZ0JBQXhDO0FBQ0EsYUFBT0MsVUFBVSxLQUFLOUQsRUFBdEI7QUFDRDs7QUFFRDs7Ozs7Ozs7cUNBSzhCO0FBQUEsVUFBZjhELE1BQWUsdUVBQU4sSUFBTTs7QUFDNUIsV0FBSzFDLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7QUFFQTs7Ozs7Ozs7aUNBS2FKLFUsRUFBMkI7QUFBQSxVQUFmVSxRQUFlLHVFQUFKLEVBQUk7O0FBQ3RDLFdBQUtDLElBQUwsQ0FBVVgsVUFBVixFQUFzQlUsUUFBdEIsRUFBZ0MsRUFBQ3FDLFdBQVcsQ0FBWixFQUFoQztBQUNEOztBQUVEOztBQUVBOzs7Ozs7O21DQUllO0FBQ2IsYUFBTyxLQUFLOUMsY0FBWjtBQUNEOztBQUVEOztBQUVBOzs7O3lCQUNLRCxVLEVBQTZDO0FBQUEsVUFBakNVLFFBQWlDLHVFQUF0QixFQUFzQjs7QUFBQSxVQUFsQnNDLFdBQWtCLHVFQUFKLEVBQUk7O0FBQ2hELFVBQU1DLGdCQUFnQixFQUF0Qjs7QUFFQSxXQUFLLElBQU03QixhQUFYLElBQTRCcEIsVUFBNUIsRUFBd0M7QUFDdEM7QUFDQTtBQUNBO0FBQ0EsWUFBSW9CLGlCQUFpQlYsUUFBckIsRUFBK0I7QUFDN0JWLHFCQUFXb0IsYUFBWCxJQUE0QlosT0FBTzBDLE1BQVAsQ0FDMUIsRUFEMEIsRUFFMUJsRCxXQUFXb0IsYUFBWCxDQUYwQixFQUcxQlYsU0FBU1UsYUFBVCxDQUgwQixDQUE1QjtBQUtEOztBQUVELFlBQU1NLFlBQVkxQixXQUFXb0IsYUFBWCxDQUFsQjs7QUFFQSxZQUFNK0IsWUFBWXpCLFVBQVV5QixTQUFWLElBQXVCLEtBQXpDO0FBQ0EsWUFBTUMsWUFBWTFCLFVBQVUwQixTQUFWLElBQXVCMUIsVUFBVTJCLFFBQW5EO0FBQ0EsWUFBTUMsT0FBUTVCLFVBQVUyQixRQUFWLElBQXNCLENBQXZCLElBQTZCM0IsVUFBVTRCLElBQXBEO0FBQ0EsWUFBTUMsUUFBUTdCLFVBQVU2QixLQUFWLElBQW1CLElBQWpDOztBQUVBO0FBQ0EsWUFBTUMsZ0JBQWdCaEQsT0FBTzBDLE1BQVAsQ0FDcEI7QUFDRTtBQUNBTyxrQkFBUTNELFNBRlY7QUFHRU8sb0JBQVUsRUFIWixDQUdlO0FBSGYsU0FEb0I7QUFNcEI7QUFDQXFCLGlCQVBvQixFQVFwQjtBQUNFO0FBQ0FnQyw0QkFBa0IsS0FGcEI7QUFHRUMsc0JBQVksS0FIZDtBQUlFdEMsdUJBQWEsS0FKZjtBQUtFc0IsbUJBQVMsS0FMWDs7QUFPRTtBQUNBUSw4QkFSRjtBQVNFQyw4QkFURjtBQVVFRSxvQkFWRjtBQVdFQztBQVhGLFNBUm9CLEVBcUJwQlAsV0FyQm9CLENBQXRCO0FBdUJBO0FBQ0F4QyxlQUFPQyxJQUFQLENBQVkrQyxhQUFaOztBQUVBO0FBQ0EsYUFBS0ksNEJBQUwsQ0FBa0N4QyxhQUFsQyxFQUFpRG9DLGFBQWpEOztBQUVBO0FBQ0FQLHNCQUFjN0IsYUFBZCxJQUErQm9DLGFBQS9CO0FBQ0Q7O0FBRURoRCxhQUFPMEMsTUFBUCxDQUFjLEtBQUtsRCxVQUFuQixFQUErQmlELGFBQS9COztBQUVBLFdBQUtZLDhCQUFMO0FBQ0Q7O0FBRUQ7Ozs7cURBQ2lDO0FBQUE7O0FBQy9CLFVBQU1DLFdBQVcsRUFBakI7O0FBRCtCLGlDQUdwQjFDLGFBSG9CO0FBSTdCLFlBQU1NLFlBQVksTUFBSzFCLFVBQUwsQ0FBZ0JvQixhQUFoQixDQUFsQjtBQUo2QixZQUt4QjJDLFFBTHdCLEdBS1pyQyxTQUxZLENBS3hCcUMsUUFMd0I7O0FBTzdCOztBQUNBRCxpQkFBUzFDLGFBQVQsSUFBMEIsQ0FBQ0EsYUFBRCxDQUExQjs7QUFFQTtBQUNBLFlBQUksT0FBTzJDLFFBQVAsS0FBb0IsUUFBeEIsRUFBa0M7QUFDaENBLHFCQUFXLENBQUNBLFFBQUQsQ0FBWDtBQUNEO0FBQ0QsWUFBSUMsTUFBTUMsT0FBTixDQUFjRixRQUFkLENBQUosRUFBNkI7QUFDM0JBLG1CQUFTdEMsT0FBVCxDQUFpQix3QkFBZ0I7QUFDL0IsZ0JBQUksQ0FBQ3FDLFNBQVNJLFlBQVQsQ0FBTCxFQUE2QjtBQUMzQkosdUJBQVNJLFlBQVQsSUFBeUIsRUFBekI7QUFDRDtBQUNESixxQkFBU0ksWUFBVCxFQUF1QjlFLElBQXZCLENBQTRCZ0MsYUFBNUI7QUFDRCxXQUxEO0FBTUQ7QUFyQjRCOztBQUcvQixXQUFLLElBQU1BLGFBQVgsSUFBNEIsS0FBS3BCLFVBQWpDLEVBQTZDO0FBQUEsY0FBbENvQixhQUFrQztBQW1CNUM7O0FBRUQsV0FBS25CLGNBQUwsR0FBc0I2RCxRQUF0QjtBQUNEOzs7aURBRTRCMUMsYSxFQUFlTSxTLEVBQVc7QUFDckQsNEJBQ0VBLFVBQVU0QixJQUFWLElBQWtCLENBQWxCLElBQXVCNUIsVUFBVTRCLElBQVYsSUFBa0IsQ0FEM0MsZ0NBRThCbEMsYUFGOUI7O0FBS0E7QUFDQSxVQUFNK0MsYUFDSnpDLFVBQVUwQyxPQUFWLElBQ0EsT0FBTzFDLFVBQVVZLE1BQWpCLEtBQTRCLFVBRDVCLElBRUEsT0FBT1osVUFBVXFDLFFBQWpCLEtBQThCLFFBSGhDO0FBSUEsVUFBSSxDQUFDSSxVQUFMLEVBQWlCO0FBQ2YsY0FBTSxJQUFJNUYsS0FBSixnQkFBdUI2QyxhQUF2QixpQ0FBTjtBQUNEO0FBQ0Y7O0FBRUQ7QUFDQTs7Ozs0Q0FDNEU7QUFBQSx1RkFBSixFQUFJO0FBQUEsa0NBQXJEVSxPQUFxRDtBQUFBLFVBQXJEQSxPQUFxRCxrQ0FBM0MsRUFBMkM7QUFBQSx5Q0FBdkNFLHVCQUF1QztBQUFBLFVBQXZDQSx1QkFBdUMseUNBQWIsS0FBYTs7QUFBQSxVQUNuRWhDLFVBRG1FLEdBQ3JELElBRHFELENBQ25FQSxVQURtRTs7QUFFMUUsV0FBSyxJQUFNb0IsYUFBWCxJQUE0QlUsT0FBNUIsRUFBcUM7QUFDbkMsWUFBTUosWUFBWTFCLFdBQVdvQixhQUFYLENBQWxCO0FBQ0EsWUFBSSxDQUFDTSxTQUFELElBQWMsQ0FBQ00sdUJBQW5CLEVBQTRDO0FBQzFDLGdCQUFNLElBQUl6RCxLQUFKLDZCQUFvQzZDLGFBQXBDLENBQU47QUFDRDtBQUNEO0FBQ0E7QUFDRDtBQUNGOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7d0NBQ29CaUQsUyxFQUFXO0FBQUEsVUFDdEJyRSxVQURzQixHQUNNLElBRE4sQ0FDdEJBLFVBRHNCO0FBQUEsVUFDVmYsWUFEVSxHQUNNLElBRE4sQ0FDVkEsWUFEVTs7QUFHN0I7O0FBQ0EsV0FBSyxJQUFNbUMsYUFBWCxJQUE0QnBCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0wQixZQUFZMUIsV0FBV29CLGFBQVgsQ0FBbEI7QUFDQSxZQUFNa0QsU0FBU0QsVUFBVWpELGFBQVYsQ0FBZjtBQUNBTSxrQkFBVWdDLGdCQUFWLEdBQTZCLEtBQTdCO0FBQ0EsWUFBSVksTUFBSixFQUFZO0FBQ1YsY0FBTUMsWUFBWXhILGdCQUFnQjJFLFVBQVU4QyxJQUFWLElBQWtCLFNBQUduSCxLQUFyQyxDQUFsQjtBQUNBLGNBQUksRUFBRWlILGtCQUFrQkMsU0FBcEIsQ0FBSixFQUFvQztBQUNsQyxrQkFBTSxJQUFJaEcsS0FBSixnQkFBdUI2QyxhQUF2Qix5QkFBd0RtRCxVQUFVeEQsSUFBbEUsQ0FBTjtBQUNEO0FBQ0QsY0FBSVcsVUFBVStDLElBQVYsSUFBa0JILE9BQU94RCxNQUFQLElBQWlCN0IsZUFBZXlDLFVBQVU0QixJQUFoRSxFQUFzRTtBQUNwRSxrQkFBTSxJQUFJL0UsS0FBSixDQUFVLGlEQUFWLENBQU47QUFDRDs7QUFFRG1ELG9CQUFVZ0MsZ0JBQVYsR0FBNkIsSUFBN0I7QUFDQWhDLG9CQUFVTCxXQUFWLEdBQXdCLEtBQXhCO0FBQ0EsY0FBSUssVUFBVTZCLEtBQVYsS0FBb0JlLE1BQXhCLEVBQWdDO0FBQzlCNUMsc0JBQVU2QixLQUFWLEdBQWtCZSxNQUFsQjtBQUNBNUMsc0JBQVVpQixPQUFWLEdBQW9CLElBQXBCO0FBQ0EsaUJBQUt2QyxXQUFMLEdBQW1CLElBQW5CO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRDs7QUFFQTs7Ozs7Ozs0Q0FJZ0M7QUFBQSxVQUFmbkIsWUFBZSxVQUFmQSxZQUFlO0FBQUEsVUFDdkJlLFVBRHVCLEdBQ1QsSUFEUyxDQUN2QkEsVUFEdUI7O0FBRTlCLDRCQUFPZixpQkFBaUJhLFNBQXhCLEVBQW1DLDBCQUFuQzs7QUFFQTtBQUNBLFVBQUl1QixjQUFjLEtBQWxCOztBQUVBLFdBQUssSUFBTUQsYUFBWCxJQUE0QnBCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0wQixZQUFZMUIsV0FBV29CLGFBQVgsQ0FBbEI7QUFDQSxZQUFJLENBQUNNLFVBQVVnQyxnQkFBZixFQUFpQztBQUMvQjtBQUNBLGNBQU1DLGFBQ0pqQyxVQUFVNkIsS0FBVixLQUFvQixJQUFwQixJQUE0QjdCLFVBQVU2QixLQUFWLENBQWdCekMsTUFBaEIsR0FBeUJZLFVBQVU0QixJQUFuQyxHQUEwQ3JFLFlBRHhFO0FBRUEsY0FBSTBFLGVBQWVqQyxVQUFVWSxNQUFWLElBQW9CWixVQUFVcUMsUUFBN0MsQ0FBSixFQUE0RDtBQUMxRHJDLHNCQUFVaUMsVUFBVixHQUF1QixJQUF2QjtBQUNBdEMsMEJBQWMsSUFBZDtBQUNEO0FBQ0QsY0FBSUssVUFBVUwsV0FBZCxFQUEyQjtBQUN6QkEsMEJBQWMsSUFBZDtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxhQUFPQSxXQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7OztBQVlBOzs7OzJDQUNxRDtBQUFBLFVBQXJDcEMsWUFBcUMsVUFBckNBLFlBQXFDO0FBQUEsVUFBdkIwQyxJQUF1QixVQUF2QkEsSUFBdUI7QUFBQSxVQUFqQkUsS0FBaUIsVUFBakJBLEtBQWlCO0FBQUEsVUFBVkUsT0FBVSxVQUFWQSxPQUFVO0FBQUEsVUFDNUMvQixVQUQ0QyxHQUM5QixJQUQ4QixDQUM1Q0EsVUFENEM7O0FBR25EOztBQUNBLFVBQU0wRSxhQUFhbkYsS0FBS29GLEdBQUwsQ0FBUzFGLFlBQVQsRUFBdUIsQ0FBdkIsQ0FBbkI7O0FBRUEsV0FBSyxJQUFNbUMsYUFBWCxJQUE0QnBCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0wQixZQUFZMUIsV0FBV29CLGFBQVgsQ0FBbEI7O0FBRUE7QUFDQSxZQUFJTSxVQUFVaUMsVUFBZCxFQUEwQjtBQUN4QixjQUFNWSxZQUFZeEgsZ0JBQWdCMkUsVUFBVThDLElBQVYsSUFBa0IsU0FBR25ILEtBQXJDLENBQWxCO0FBQ0FxRSxvQkFBVTZCLEtBQVYsR0FBa0IsSUFBSWdCLFNBQUosQ0FBYzdDLFVBQVU0QixJQUFWLEdBQWlCb0IsVUFBL0IsQ0FBbEI7QUFDQWxHLHVCQUFhVyxRQUFiLENBQXNCO0FBQ3BCUCxtQkFBTzNCLG1CQURhO0FBRXBCNEIscUJBQVl1QyxhQUFaLG1CQUF1Q3NELFVBRm5CO0FBR3BCMUYsZ0JBQUksS0FBS0E7QUFIVyxXQUF0QjtBQUtBMEMsb0JBQVVpQyxVQUFWLEdBQXVCLEtBQXZCO0FBQ0FqQyxvQkFBVUwsV0FBVixHQUF3QixJQUF4QjtBQUNEO0FBQ0Y7O0FBRUQsV0FBSyxJQUFNRCxjQUFYLElBQTRCcEIsVUFBNUIsRUFBd0M7QUFDdEMsWUFBTTBCLGFBQVkxQixXQUFXb0IsY0FBWCxDQUFsQjtBQUNBO0FBQ0EsWUFBSU0sV0FBVUwsV0FBZCxFQUEyQjtBQUN6QixlQUFLdUQsYUFBTCxDQUFtQixFQUFDbEQscUJBQUQsRUFBWU4sNkJBQVosRUFBMkJuQywwQkFBM0IsRUFBeUMwQyxVQUF6QyxFQUErQ0UsWUFBL0MsRUFBc0RFLGdCQUF0RCxFQUFuQjtBQUNEO0FBQ0Y7O0FBRUQsV0FBSzVCLGdCQUFMLEdBQXdCdUUsVUFBeEI7QUFDRDs7OzBDQUU2RTtBQUFBLFVBQS9EaEQsU0FBK0QsVUFBL0RBLFNBQStEO0FBQUEsVUFBcEROLGFBQW9ELFVBQXBEQSxhQUFvRDtBQUFBLFVBQXJDbkMsWUFBcUMsVUFBckNBLFlBQXFDO0FBQUEsVUFBdkIwQyxJQUF1QixVQUF2QkEsSUFBdUI7QUFBQSxVQUFqQkUsS0FBaUIsVUFBakJBLEtBQWlCO0FBQUEsVUFBVkUsT0FBVSxVQUFWQSxPQUFVO0FBQUEsVUFDckVPLE1BRHFFLEdBQ2pEWixTQURpRCxDQUNyRVksTUFEcUU7QUFBQSxVQUM3RHlCLFFBRDZELEdBQ2pEckMsU0FEaUQsQ0FDN0RxQyxRQUQ2RDs7O0FBRzVFLFVBQU1yRixZQUFZLElBQUlRLElBQUosRUFBbEI7QUFDQSxVQUFJb0QsTUFBSixFQUFZO0FBQ1Y7QUFDQUEsZUFBT3VDLElBQVAsQ0FBWTlDLE9BQVosRUFBcUJMLFNBQXJCLEVBQWdDLEVBQUNDLFVBQUQsRUFBT0UsWUFBUCxFQUFjNUMsMEJBQWQsRUFBaEM7QUFDQSxhQUFLNkYsb0JBQUwsQ0FBMEJwRCxTQUExQixFQUFxQ04sYUFBckM7QUFDRCxPQUpELE1BSU8sSUFBSTJDLFFBQUosRUFBYztBQUNuQjtBQUNBLGFBQUtnQixnQ0FBTCxDQUFzQyxFQUFDckQsb0JBQUQsRUFBWUMsVUFBWixFQUFrQkUsWUFBbEIsRUFBdEM7QUFDQSxhQUFLaUQsb0JBQUwsQ0FBMEJwRCxTQUExQixFQUFxQ04sYUFBckM7QUFDRCxPQUpNLE1BSUE7QUFDTDVDLHFCQUFhVyxRQUFiLENBQXNCO0FBQ3BCUCxpQkFBTzNCLG1CQURhO0FBRXBCNEIsbUJBQVl1QyxhQUFaLDZCQUZvQjtBQUdwQnBDLGNBQUksS0FBS0E7QUFIVyxTQUF0QjtBQUtEO0FBQ0QsVUFBTU0sU0FBU0MsS0FBS0MsS0FBTCxDQUFXLElBQUlOLElBQUosS0FBYVIsU0FBeEIsQ0FBZjtBQUNBLFVBQU1lLE9BQVVILE1BQVYsT0FBTjtBQUNBZCxtQkFBYVcsUUFBYixDQUFzQjtBQUNwQlAsZUFBTzNCLG1CQURhO0FBRXBCNEIsaUJBQVl1QyxhQUFaLGlCQUFxQ25DLFlBQXJDLFNBQXFEUSxJQUZqQztBQUdwQlQsWUFBSSxLQUFLQTtBQUhXLE9BQXRCOztBQU1BMEMsZ0JBQVVMLFdBQVYsR0FBd0IsS0FBeEI7QUFDQUssZ0JBQVVpQixPQUFWLEdBQW9CLElBQXBCO0FBQ0EsV0FBS3ZDLFdBQUwsR0FBbUIsSUFBbkI7QUFDRDtBQUNEOzs7OzZEQUUyRDtBQUFBLFVBQXpCc0IsU0FBeUIsVUFBekJBLFNBQXlCO0FBQUEsVUFBZEMsSUFBYyxVQUFkQSxJQUFjO0FBQUEsVUFBUkUsS0FBUSxVQUFSQSxLQUFRO0FBQUEsVUFDbERrQyxRQURrRCxHQUN6QnJDLFNBRHlCLENBQ2xEcUMsUUFEa0Q7QUFBQSxVQUN4Q1IsS0FEd0MsR0FDekI3QixTQUR5QixDQUN4QzZCLEtBRHdDO0FBQUEsVUFDakNELElBRGlDLEdBQ3pCNUIsU0FEeUIsQ0FDakM0QixJQURpQzs7QUFFekQsVUFBTTBCLGVBQWVuRCxNQUFNa0MsUUFBTixDQUFyQjs7QUFFQSw0QkFBTyxPQUFPaUIsWUFBUCxLQUF3QixVQUEvQixpQkFBd0RqQixRQUF4RDs7QUFKeUQsa0NBTXJCckMsU0FOcUIsQ0FNcER1RCxZQU5vRDtBQUFBLFVBTXBEQSxZQU5vRCx5Q0FNckMsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLENBTnFDOztBQU96REEscUJBQWVqQixNQUFNQyxPQUFOLENBQWNnQixZQUFkLElBQThCQSxZQUE5QixHQUE2QyxDQUFDQSxZQUFELENBQTVEO0FBQ0EsVUFBSXBFLElBQUksQ0FBUjtBQVJ5RDtBQUFBO0FBQUE7O0FBQUE7QUFTekQsOEJBQXFCYyxJQUFyQixtSUFBMkI7QUFBQSxjQUFoQnVELE1BQWdCOztBQUN6QixjQUFJQyxjQUFjSCxhQUFhRSxNQUFiLENBQWxCO0FBQ0FDLHdCQUFjbkIsTUFBTUMsT0FBTixDQUFja0IsV0FBZCxJQUE2QkEsV0FBN0IsR0FBMkMsQ0FBQ0EsV0FBRCxDQUF6RDtBQUNBO0FBQ0Esa0JBQVE3QixJQUFSO0FBQ0UsaUJBQUssQ0FBTDtBQUNFQyxvQkFBTTFDLElBQUksQ0FBVixJQUFldUUsT0FBT0MsUUFBUCxDQUFnQkYsWUFBWSxDQUFaLENBQWhCLElBQWtDQSxZQUFZLENBQVosQ0FBbEMsR0FBbURGLGFBQWEsQ0FBYixDQUFsRTtBQUNGLGlCQUFLLENBQUw7QUFDRTFCLG9CQUFNMUMsSUFBSSxDQUFWLElBQWV1RSxPQUFPQyxRQUFQLENBQWdCRixZQUFZLENBQVosQ0FBaEIsSUFBa0NBLFlBQVksQ0FBWixDQUFsQyxHQUFtREYsYUFBYSxDQUFiLENBQWxFO0FBQ0YsaUJBQUssQ0FBTDtBQUNFMUIsb0JBQU0xQyxJQUFJLENBQVYsSUFBZXVFLE9BQU9DLFFBQVAsQ0FBZ0JGLFlBQVksQ0FBWixDQUFoQixJQUFrQ0EsWUFBWSxDQUFaLENBQWxDLEdBQW1ERixhQUFhLENBQWIsQ0FBbEU7QUFDRixpQkFBSyxDQUFMO0FBQ0UxQixvQkFBTTFDLElBQUksQ0FBVixJQUFldUUsT0FBT0MsUUFBUCxDQUFnQkYsWUFBWSxDQUFaLENBQWhCLElBQWtDQSxZQUFZLENBQVosQ0FBbEMsR0FBbURGLGFBQWEsQ0FBYixDQUFsRTtBQVJKO0FBVUFwRSxlQUFLeUMsSUFBTDtBQUNEO0FBeEJ3RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBeUIxRDs7O3lDQUVvQjVCLFMsRUFBV04sYSxFQUFlO0FBQUEsVUFDdENtQyxLQURzQyxHQUM3QjdCLFNBRDZCLENBQ3RDNkIsS0FEc0M7O0FBRTdDLFVBQUlBLFNBQVNBLE1BQU16QyxNQUFOLElBQWdCLENBQTdCLEVBQWdDO0FBQzlCLFlBQU13RSxRQUNKRixPQUFPQyxRQUFQLENBQWdCOUIsTUFBTSxDQUFOLENBQWhCLEtBQ0E2QixPQUFPQyxRQUFQLENBQWdCOUIsTUFBTSxDQUFOLENBQWhCLENBREEsSUFFQTZCLE9BQU9DLFFBQVAsQ0FBZ0I5QixNQUFNLENBQU4sQ0FBaEIsQ0FGQSxJQUdBNkIsT0FBT0MsUUFBUCxDQUFnQjlCLE1BQU0sQ0FBTixDQUFoQixDQUpGO0FBS0EsWUFBSSxDQUFDK0IsS0FBTCxFQUFZO0FBQ1YsZ0JBQU0sSUFBSS9HLEtBQUosc0NBQTZDNkMsYUFBN0MsQ0FBTjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7Ozs7Ozt1Q0FJbUI7QUFBQSxVQUNWYix5QkFEVSxHQUNtQixJQURuQixDQUNWQSx5QkFEVTs7QUFFakIsVUFBTWdGLG9CQUFvQmhGLDBCQUEwQmlGLGNBQTFCLENBQXlDdEcsS0FBS3VHLEdBQUwsRUFBekMsQ0FBMUI7QUFDQSxXQUFLckYsV0FBTCxHQUFtQixLQUFLQSxXQUFMLElBQW9CbUYsaUJBQXZDO0FBQ0EsYUFBT0EsaUJBQVA7QUFDRDs7Ozs7O2tCQXRtQmtCMUYsZ0IiLCJmaWxlIjoiYXR0cmlidXRlLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5pbXBvcnQgU3RhdHMgZnJvbSAnLi9zdGF0cyc7XG5pbXBvcnQgbG9nIGZyb20gJy4uL3V0aWxzL2xvZyc7XG5pbXBvcnQge0dMfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuaW1wb3J0IEF0dHJpYnV0ZVRyYW5zaXRpb25NYW5hZ2VyIGZyb20gJy4vYXR0cmlidXRlLXRyYW5zaXRpb24tbWFuYWdlcic7XG5cbmNvbnN0IExPR19TVEFSVF9FTkRfUFJJT1JJVFkgPSAxO1xuY29uc3QgTE9HX0RFVEFJTF9QUklPUklUWSA9IDI7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2xBcnJheUZyb21UeXBlKGdsVHlwZSwge2NsYW1wZWQgPSB0cnVlfSA9IHt9KSB7XG4gIC8vIFNvcnRlZCBpbiBzb21lIG9yZGVyIG9mIGxpa2VsaWhvb2QgdG8gcmVkdWNlIGFtb3VudCBvZiBjb21wYXJpc29uc1xuICBzd2l0Y2ggKGdsVHlwZSkge1xuICAgIGNhc2UgR0wuRkxPQVQ6XG4gICAgICByZXR1cm4gRmxvYXQzMkFycmF5O1xuICAgIGNhc2UgR0wuVU5TSUdORURfU0hPUlQ6XG4gICAgY2FzZSBHTC5VTlNJR05FRF9TSE9SVF81XzZfNTpcbiAgICBjYXNlIEdMLlVOU0lHTkVEX1NIT1JUXzRfNF80XzQ6XG4gICAgY2FzZSBHTC5VTlNJR05FRF9TSE9SVF81XzVfNV8xOlxuICAgICAgcmV0dXJuIFVpbnQxNkFycmF5O1xuICAgIGNhc2UgR0wuVU5TSUdORURfSU5UOlxuICAgICAgcmV0dXJuIFVpbnQzMkFycmF5O1xuICAgIGNhc2UgR0wuVU5TSUdORURfQllURTpcbiAgICAgIHJldHVybiBjbGFtcGVkID8gVWludDhDbGFtcGVkQXJyYXkgOiBVaW50OEFycmF5O1xuICAgIGNhc2UgR0wuQllURTpcbiAgICAgIHJldHVybiBJbnQ4QXJyYXk7XG4gICAgY2FzZSBHTC5TSE9SVDpcbiAgICAgIHJldHVybiBJbnQxNkFycmF5O1xuICAgIGNhc2UgR0wuSU5UOlxuICAgICAgcmV0dXJuIEludDMyQXJyYXk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGRlZHVjZSB0eXBlIGZyb20gYXJyYXknKTtcbiAgfVxufVxuLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5ICovXG5cbi8vIERlZmF1bHQgbG9nZ2Vyc1xuY29uc3QgbG9nRnVuY3Rpb25zID0ge1xuICBzYXZlZE1lc3NhZ2VzOiBudWxsLFxuICB0aW1lU3RhcnQ6IG51bGwsXG5cbiAgb25Mb2c6ICh7bGV2ZWwsIG1lc3NhZ2V9KSA9PiB7XG4gICAgbG9nLmxvZyhsZXZlbCwgbWVzc2FnZSk7XG4gIH0sXG4gIG9uVXBkYXRlU3RhcnQ6ICh7bGV2ZWwsIGlkLCBudW1JbnN0YW5jZXN9KSA9PiB7XG4gICAgbG9nRnVuY3Rpb25zLnNhdmVkTWVzc2FnZXMgPSBbXTtcbiAgICBsb2dGdW5jdGlvbnMudGltZVN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgfSxcbiAgb25VcGRhdGU6ICh7bGV2ZWwsIG1lc3NhZ2V9KSA9PiB7XG4gICAgaWYgKGxvZ0Z1bmN0aW9ucy5zYXZlZE1lc3NhZ2VzKSB7XG4gICAgICBsb2dGdW5jdGlvbnMuc2F2ZWRNZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcbiAgb25VcGRhdGVFbmQ6ICh7bGV2ZWwsIGlkLCBudW1JbnN0YW5jZXN9KSA9PiB7XG4gICAgY29uc3QgdGltZU1zID0gTWF0aC5yb3VuZChuZXcgRGF0ZSgpIC0gbG9nRnVuY3Rpb25zLnRpbWVTdGFydCk7XG4gICAgY29uc3QgdGltZSA9IGAke3RpbWVNc31tc2A7XG4gICAgbG9nLmdyb3VwKGxldmVsLCBgVXBkYXRlZCBhdHRyaWJ1dGVzIGZvciAke251bUluc3RhbmNlc30gaW5zdGFuY2VzIGluICR7aWR9IGluICR7dGltZX1gLCB7XG4gICAgICBjb2xsYXBzZWQ6IHRydWVcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbG9nRnVuY3Rpb25zLnNhdmVkTWVzc2FnZXMpIHtcbiAgICAgIGxvZy5sb2cobGV2ZWwsIG1lc3NhZ2UpO1xuICAgIH1cbiAgICBsb2cuZ3JvdXBFbmQobGV2ZWwsIGBVcGRhdGVkIGF0dHJpYnV0ZXMgZm9yICR7bnVtSW5zdGFuY2VzfSBpbnN0YW5jZXMgaW4gJHtpZH0gaW4gJHt0aW1lfWApO1xuICAgIGxvZ0Z1bmN0aW9ucy5zYXZlZE1lc3NhZ2VzID0gbnVsbDtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXR0cmlidXRlTWFuYWdlciB7XG4gIC8qKlxuICAgKiBTZXRzIGxvZyBmdW5jdGlvbnMgdG8gaGVscCB0cmFjZSBvciB0aW1lIGF0dHJpYnV0ZSB1cGRhdGVzLlxuICAgKiBEZWZhdWx0IGxvZ2dpbmcgdXNlcyBkZWNrIGxvZ2dlci5cbiAgICpcbiAgICogYG9uTG9nYCBpcyBjYWxsZWQgZm9yIGVhY2ggYXR0cmlidXRlLlxuICAgKlxuICAgKiBUbyBlbmFibGUgZGV0YWlsZWQgY29udHJvbCBvZiB0aW1taW5nIGFuZCBlLmcuIGhpZXJhcmNoaWNhbCBsb2dnaW5nLFxuICAgKiBob29rcyBhcmUgYWxzbyBwcm92aWRlZCBmb3IgdXBkYXRlIHN0YXJ0IGFuZCBlbmQuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0c11cbiAgICogQHBhcmFtIHtTdHJpbmd9IFtvcHRzLm9uTG9nPV0gLSBjYWxsZWQgdG8gcHJpbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IFtvcHRzLm9uVXBkYXRlU3RhcnQ9XSAtIGNhbGxlZCBiZWZvcmUgdXBkYXRlKCkgc3RhcnRzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0cy5vblVwZGF0ZUVuZD1dIC0gY2FsbGVkIGFmdGVyIHVwZGF0ZSgpIGVuZHNcbiAgICovXG4gIHN0YXRpYyBzZXREZWZhdWx0TG9nRnVuY3Rpb25zKHtvbkxvZywgb25VcGRhdGVTdGFydCwgb25VcGRhdGUsIG9uVXBkYXRlRW5kfSA9IHt9KSB7XG4gICAgaWYgKG9uTG9nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ0Z1bmN0aW9ucy5vbkxvZyA9IG9uTG9nIHx8IG5vb3A7XG4gICAgfVxuICAgIGlmIChvblVwZGF0ZVN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ0Z1bmN0aW9ucy5vblVwZGF0ZVN0YXJ0ID0gb25VcGRhdGVTdGFydCB8fCBub29wO1xuICAgIH1cbiAgICBpZiAob25VcGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbG9nRnVuY3Rpb25zLm9uVXBkYXRlID0gb25VcGRhdGUgfHwgbm9vcDtcbiAgICB9XG4gICAgaWYgKG9uVXBkYXRlRW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ0Z1bmN0aW9ucy5vblVwZGF0ZUVuZCA9IG9uVXBkYXRlRW5kIHx8IG5vb3A7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogQXV0b21hdGVkIGF0dHJpYnV0ZSBnZW5lcmF0aW9uIGFuZCBtYW5hZ2VtZW50LiBTdWl0YWJsZSB3aGVuIGEgc2V0IG9mXG4gICAqIHZlcnRleCBzaGFkZXIgYXR0cmlidXRlcyBhcmUgZ2VuZXJhdGVkIGJ5IGl0ZXJhdGlvbiBvdmVyIGEgZGF0YSBhcnJheSxcbiAgICogYW5kIHVwZGF0ZXMgdG8gdGhlc2UgYXR0cmlidXRlcyBhcmUgbmVlZGVkIGVpdGhlciB3aGVuIHRoZSBkYXRhIGl0c2VsZlxuICAgKiBjaGFuZ2VzLCBvciB3aGVuIG90aGVyIGRhdGEgcmVsZXZhbnQgdG8gdGhlIGNhbGN1bGF0aW9ucyBjaGFuZ2UuXG4gICAqXG4gICAqIC0gRmlyc3QgdGhlIGFwcGxpY2F0aW9uIHJlZ2lzdGVycyBkZXNjcmlwdGlvbnMgb2YgaXRzIGR5bmFtaWMgdmVydGV4XG4gICAqICAgYXR0cmlidXRlcyB1c2luZyBBdHRyaWJ1dGVNYW5hZ2VyLmFkZCgpLlxuICAgKiAtIFRoZW4sIHdoZW4gYW55IGNoYW5nZSB0aGF0IGFmZmVjdHMgYXR0cmlidXRlcyBpcyBkZXRlY3RlZCBieSB0aGVcbiAgICogICBhcHBsaWNhdGlvbiwgdGhlIGFwcCB3aWxsIGNhbGwgQXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlKCkuXG4gICAqIC0gRmluYWxseSBiZWZvcmUgaXQgcmVuZGVycywgaXQgY2FsbHMgQXR0cmlidXRlTWFuYWdlci51cGRhdGUoKSB0b1xuICAgKiAgIGVuc3VyZSB0aGF0IGF0dHJpYnV0ZXMgYXJlIGF1dG9tYXRpY2FsbHkgcmVidWlsdCBpZiBhbnl0aGluZyBoYXMgYmVlblxuICAgKiAgIGludmFsaWRhdGVkLlxuICAgKlxuICAgKiBUaGUgYXBwbGljYXRpb24gcHJvdmlkZWQgdXBkYXRlIGZ1bmN0aW9ucyBkZXNjcmliZSBob3cgYXR0cmlidXRlc1xuICAgKiBzaG91bGQgYmUgdXBkYXRlZCBmcm9tIGEgZGF0YSBhcnJheSBhbmQgYXJlIGV4cGVjdGVkIHRvIHRyYXZlcnNlXG4gICAqIHRoYXQgZGF0YSBhcnJheSAob3IgaXRlcmFibGUpIGFuZCBmaWxsIGluIHRoZSBhdHRyaWJ1dGUncyB0eXBlZCBhcnJheS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoZSBhdHRyaWJ1dGUgbWFuYWdlciBpbnRlbnRpb25hbGx5IGRvZXMgbm90IGRvIGFkdmFuY2VkXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24sIGJ1dCBpbnN0ZWFkIG1ha2VzIGl0IGVhc3kgdG8gYnVpbGQgc3VjaCBkZXRlY3Rpb25cbiAgICogYnkgb2ZmZXJpbmcgdGhlIGFiaWxpdHkgdG8gXCJpbnZhbGlkYXRlXCIgZWFjaCBhdHRyaWJ1dGUgc2VwYXJhdGVseS5cbiAgICpcbiAgICogU3VtbWFyeTpcbiAgICogLSBrZWVwcyB0cmFjayBvZiB2YWxpZCBzdGF0ZSBmb3IgZWFjaCBhdHRyaWJ1dGVcbiAgICogLSBhdXRvIHJlYWxsb2NhdGVzIGF0dHJpYnV0ZXMgd2hlbiBuZWVkZWRcbiAgICogLSBhdXRvIHVwZGF0ZXMgYXR0cmlidXRlcyB3aXRoIHJlZ2lzdGVyZWQgdXBkYXRlciBmdW5jdGlvbnNcbiAgICogLSBhbGxvd3Mgb3ZlcnJpZGluZyB3aXRoIGFwcGxpY2F0aW9uIHN1cHBsaWVkIGJ1ZmZlcnNcbiAgICpcbiAgICogTGltaXRhdGlvbnM6XG4gICAqIC0gVGhlcmUgYXJlIGN1cnJlbnRseSBubyBwcm92aXNpb25zIGZvciBvbmx5IGludmFsaWRhdGluZyBhIHJhbmdlIG9mXG4gICAqICAgaW5kaWNlcyBpbiBhbiBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BzXVxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3Byb3BzLmlkXSAtIGlkZW50aWZpZXIgKGZvciBkZWJ1Z2dpbmcpXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwge2lkID0gJ2F0dHJpYnV0ZS1tYW5hZ2VyJ30gPSB7fSkge1xuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLmdsID0gZ2w7XG5cbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLnVwZGF0ZVRyaWdnZXJzID0ge307XG4gICAgdGhpcy5hY2Nlc3NvcnMgPSB7fTtcbiAgICB0aGlzLmFsbG9jZWRJbnN0YW5jZXMgPSAtMTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcblxuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICB0aGlzLnN0YXRzID0gbmV3IFN0YXRzKHtpZDogJ2F0dHInfSk7XG5cbiAgICB0aGlzLmF0dHJpYnV0ZVRyYW5zaXRpb25NYW5nZXIgPSBuZXcgQXR0cmlidXRlVHJhbnNpdGlvbk1hbmFnZXIoZ2wsIHtcbiAgICAgIGlkOiBgJHtpZH0tdHJhbnNpdGlvbnNgXG4gICAgfSk7XG5cbiAgICAvLyBGb3IgZGVidWdnaW5nIHNhbml0eSwgcHJldmVudCB1bmluaXRpYWxpemVkIG1lbWJlcnNcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGF0dHJpYnV0ZXNcbiAgICogVGFrZXMgYSBtYXAgb2YgYXR0cmlidXRlIGRlc2NyaXB0b3Igb2JqZWN0c1xuICAgKiAtIGtleXMgYXJlIGF0dHJpYnV0ZSBuYW1lc1xuICAgKiAtIHZhbHVlcyBhcmUgb2JqZWN0cyB3aXRoIGF0dHJpYnV0ZSBmaWVsZHNcbiAgICpcbiAgICogYXR0cmlidXRlLnNpemUgLSBudW1iZXIgb2YgZWxlbWVudHMgcGVyIG9iamVjdFxuICAgKiBhdHRyaWJ1dGUudXBkYXRlciAtIG51bWJlciBvZiBlbGVtZW50c1xuICAgKiBhdHRyaWJ1dGUuaW5zdGFuY2VkPTAgLSBpcyB0aGlzIGlzIGFuIGluc3RhbmNlZCBhdHRyaWJ1dGUgKGEuay5hLiBkaXZpc29yKVxuICAgKiBhdHRyaWJ1dGUubm9BbGxvYz1mYWxzZSAtIGlmIHRoaXMgYXR0cmlidXRlIHNob3VsZCBub3QgYmUgYWxsb2NhdGVkXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGF0dHJpYnV0ZU1hbmFnZXIuYWRkKHtcbiAgICogICBwb3NpdGlvbnM6IHtzaXplOiAyLCB1cGRhdGU6IGNhbGN1bGF0ZVBvc2l0aW9uc31cbiAgICogICBjb2xvcnM6IHtzaXplOiAzLCB1cGRhdGU6IGNhbGN1bGF0ZUNvbG9yc31cbiAgICogfSk7XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIC0gYXR0cmlidXRlIG1hcCAoc2VlIGFib3ZlKVxuICAgKiBAcGFyYW0ge09iamVjdH0gdXBkYXRlcnMgLSBzZXBhcmF0ZSBtYXAgb2YgdXBkYXRlIGZ1bmN0aW9ucyAoZGVwcmVjYXRlZClcbiAgICovXG4gIGFkZChhdHRyaWJ1dGVzLCB1cGRhdGVycyA9IHt9KSB7XG4gICAgdGhpcy5fYWRkKGF0dHJpYnV0ZXMsIHVwZGF0ZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGF0dHJpYnV0ZXNcbiAgICogVGFrZXMgYW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWVzIGFuZCBkZWxldGUgdGhlbSBmcm9tXG4gICAqIHRoZSBhdHRyaWJ1dGUgbWFwIGlmIHRoZXkgZXhpc3RzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFsncG9zaXRpb24nXSk7XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVOYW1lQXJyYXkgLSBhdHRyaWJ1dGUgbmFtZSBhcnJheSAoc2VlIGFib3ZlKVxuICAgKi9cbiAgcmVtb3ZlKGF0dHJpYnV0ZU5hbWVBcnJheSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cmlidXRlTmFtZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuYW1lID0gYXR0cmlidXRlTmFtZUFycmF5W2ldO1xuICAgICAgaWYgKHRoaXMuYXR0cmlidXRlc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyogTWFya3MgYW4gYXR0cmlidXRlIGZvciB1cGRhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRyaWdnZXJOYW1lOiBhdHRyaWJ1dGUgb3IgYWNjZXNzb3IgbmFtZVxuICAgKi9cbiAgaW52YWxpZGF0ZSh0cmlnZ2VyTmFtZSkge1xuICAgIGNvbnN0IGludmFsaWRhdGVkQXR0cmlidXRlcyA9IHRoaXMuX2ludmFsaWRhdGVUcmlnZ2VyKHRyaWdnZXJOYW1lKTtcblxuICAgIC8vIEZvciBwZXJmb3JtYW5jZSB0dW5pbmdcbiAgICBsb2dGdW5jdGlvbnMub25Mb2coe1xuICAgICAgbGV2ZWw6IExPR19ERVRBSUxfUFJJT1JJVFksXG4gICAgICBtZXNzYWdlOiBgaW52YWxpZGF0ZWQgYXR0cmlidXRlcyAke2ludmFsaWRhdGVkQXR0cmlidXRlc30gKCR7dHJpZ2dlck5hbWV9KSBmb3IgJHt0aGlzLmlkfWAsXG4gICAgICBpZDogdGhpcy5pZGVudGlmaWVyXG4gICAgfSk7XG4gIH1cblxuICBpbnZhbGlkYXRlQWxsKCkge1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXS5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHR1bmluZ1xuICAgIGxvZ0Z1bmN0aW9ucy5vbkxvZyh7XG4gICAgICBsZXZlbDogTE9HX0RFVEFJTF9QUklPUklUWSxcbiAgICAgIG1lc3NhZ2U6IGBpbnZhbGlkYXRlZCBhbGwgYXR0cmlidXRlcyBmb3IgJHt0aGlzLmlkfWAsXG4gICAgICBpZDogdGhpcy5pZGVudGlmaWVyXG4gICAgfSk7XG4gIH1cblxuICBfaW52YWxpZGF0ZVRyaWdnZXIodHJpZ2dlck5hbWUpIHtcbiAgICBjb25zdCB7YXR0cmlidXRlcywgdXBkYXRlVHJpZ2dlcnN9ID0gdGhpcztcbiAgICBjb25zdCBpbnZhbGlkYXRlZEF0dHJpYnV0ZXMgPSB1cGRhdGVUcmlnZ2Vyc1t0cmlnZ2VyTmFtZV07XG5cbiAgICBpZiAoIWludmFsaWRhdGVkQXR0cmlidXRlcykge1xuICAgICAgbGV0IG1lc3NhZ2UgPSBgaW52YWxpZGF0aW5nIG5vbi1leGlzdGVudCB0cmlnZ2VyICR7dHJpZ2dlck5hbWV9IGZvciAke3RoaXMuaWR9XFxuYDtcbiAgICAgIG1lc3NhZ2UgKz0gYFZhbGlkIHRyaWdnZXJzOiAke09iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmpvaW4oJywgJyl9YDtcbiAgICAgIGxvZy53YXJuKG1lc3NhZ2UsIGludmFsaWRhdGVkQXR0cmlidXRlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGludmFsaWRhdGVkQXR0cmlidXRlcy5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAoYXR0cmlidXRlKSB7XG4gICAgICAgICAgYXR0cmlidXRlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBpbnZhbGlkYXRlZEF0dHJpYnV0ZXM7XG4gIH1cblxuICAvKipcbiAgICogRW5zdXJlIGFsbCBhdHRyaWJ1dGUgYnVmZmVycyBhcmUgdXBkYXRlZCBmcm9tIHByb3BzIG9yIGRhdGEuXG4gICAqXG4gICAqIE5vdGU6IEFueSBwcmVhbGxvY2F0ZWQgYnVmZmVycyBpbiBcImJ1ZmZlcnNcIiBtYXRjaGluZyByZWdpc3RlcmVkIGF0dHJpYnV0ZVxuICAgKiBuYW1lcyB3aWxsIGJlIHVzZWQuIE5vIHVwZGF0ZSB3aWxsIGhhcHBlbiBpbiB0aGlzIGNhc2UuXG4gICAqIE5vdGU6IENhbGxzIG9uVXBkYXRlU3RhcnQgYW5kIG9uVXBkYXRlRW5kIGxvZyBjYWxsYmFja3MgYmVmb3JlIGFuZCBhZnRlci5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLmRhdGEgLSBkYXRhIChpdGVyYWJsZSBvYmplY3QpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLm51bUluc3RhbmNlcyAtIGNvdW50IG9mIGRhdGFcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMuYnVmZmVycyA9IHt9IC0gcHJlLWFsbG9jYXRlZCBidWZmZXJzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLnByb3BzIC0gcGFzc2VkIHRvIHVwZGF0ZXJzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLmNvbnRleHQgLSBVc2VkIGFzIFwidGhpc1wiIGNvbnRleHQgZm9yIHVwZGF0ZXJzXG4gICAqL1xuICB1cGRhdGUoe1xuICAgIGRhdGEsXG4gICAgbnVtSW5zdGFuY2VzLFxuICAgIHRyYW5zaXRpb25zLFxuICAgIHByb3BzID0ge30sXG4gICAgYnVmZmVycyA9IHt9LFxuICAgIGNvbnRleHQgPSB7fSxcbiAgICBpZ25vcmVVbmtub3duQXR0cmlidXRlcyA9IGZhbHNlXG4gIH0gPSB7fSkge1xuICAgIC8vIEZpcnN0IGFwcGx5IGFueSBhcHBsaWNhdGlvbiBwcm92aWRlZCBidWZmZXJzXG4gICAgdGhpcy5fY2hlY2tFeHRlcm5hbEJ1ZmZlcnMoe2J1ZmZlcnMsIGlnbm9yZVVua25vd25BdHRyaWJ1dGVzfSk7XG4gICAgdGhpcy5fc2V0RXh0ZXJuYWxCdWZmZXJzKGJ1ZmZlcnMpO1xuXG4gICAgLy8gT25seSBpbml0aWF0ZSBhbGxvYy91cGRhdGUgKGFuZCBsb2dnaW5nKSBpZiBhY3R1YWxseSBuZWVkZWRcbiAgICBpZiAodGhpcy5fYW5hbHl6ZUJ1ZmZlcnMoe251bUluc3RhbmNlc30pKSB7XG4gICAgICBsb2dGdW5jdGlvbnMub25VcGRhdGVTdGFydCh7bGV2ZWw6IExPR19TVEFSVF9FTkRfUFJJT1JJVFksIGlkOiB0aGlzLmlkLCBudW1JbnN0YW5jZXN9KTtcbiAgICAgIHRoaXMuc3RhdHMudGltZVN0YXJ0KCk7XG4gICAgICB0aGlzLl91cGRhdGVCdWZmZXJzKHtudW1JbnN0YW5jZXMsIGRhdGEsIHByb3BzLCBjb250ZXh0fSk7XG4gICAgICB0aGlzLnN0YXRzLnRpbWVFbmQoKTtcbiAgICAgIGxvZ0Z1bmN0aW9ucy5vblVwZGF0ZUVuZCh7bGV2ZWw6IExPR19TVEFSVF9FTkRfUFJJT1JJVFksIGlkOiB0aGlzLmlkLCBudW1JbnN0YW5jZXN9KTtcbiAgICB9XG5cbiAgICB0aGlzLmF0dHJpYnV0ZVRyYW5zaXRpb25NYW5nZXIudXBkYXRlKHRoaXMuYXR0cmlidXRlcywgdHJhbnNpdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYWxsIGF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuICAgKiBOb3RlOiBGb3JtYXQgbWF0Y2hlcyBsdW1hLmdsIE1vZGVsL1Byb2dyYW0uc2V0QXR0cmlidXRlcygpXG4gICAqIEByZXR1cm4ge09iamVjdH0gYXR0cmlidXRlcyAtIGRlc2NyaXB0b3JzXG4gICAqL1xuICBnZXRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBjaGFuZ2VkIGF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuICAgKiBUaGlzIGluZGljYXRlcyB3aGljaCBXZWJHTEJ1Z2dlcnMgbmVlZCB0byBiZSB1cGRhdGVkXG4gICAqIEByZXR1cm4ge09iamVjdH0gYXR0cmlidXRlcyAtIGRlc2NyaXB0b3JzXG4gICAqL1xuICBnZXRDaGFuZ2VkQXR0cmlidXRlcyh7dHJhbnNpdGlvbiA9IGZhbHNlLCBjbGVhckNoYW5nZWRGbGFncyA9IGZhbHNlfSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzLCBhdHRyaWJ1dGVUcmFuc2l0aW9uTWFuZ2VyfSA9IHRoaXM7XG5cbiAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZVRyYW5zaXRpb25NYW5nZXIuZ2V0QXR0cmlidXRlcygpO1xuICAgIH1cblxuICAgIGNvbnN0IGNoYW5nZWRBdHRyaWJ1dGVzID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBpZiAoYXR0cmlidXRlLmNoYW5nZWQpIHtcbiAgICAgICAgYXR0cmlidXRlLmNoYW5nZWQgPSBhdHRyaWJ1dGUuY2hhbmdlZCAmJiAhY2xlYXJDaGFuZ2VkRmxhZ3M7XG5cbiAgICAgICAgLy8gT25seSByZXR1cm4gbm9uLXRyYW5zaXRpb24gYXR0cmlidXRlc1xuICAgICAgICBpZiAoIWF0dHJpYnV0ZVRyYW5zaXRpb25NYW5nZXIuaGFzQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpKSB7XG4gICAgICAgICAgY2hhbmdlZEF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNoYW5nZWRBdHRyaWJ1dGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHJlZHJhdyBmbGFnLCBvcHRpb25hbGx5IGNsZWFyaW5nIGl0LlxuICAgKiBSZWRyYXcgZmxhZyB3aWxsIGJlIHNldCBpZiBhbnkgYXR0cmlidXRlcyBhdHRyaWJ1dGVzIGNoYW5nZWQgc2luY2VcbiAgICogZmxhZyB3YXMgbGFzdCBjbGVhcmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdHNdXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0cy5jbGVhclJlZHJhd0ZsYWdzPWZhbHNlXSAtIHdoZXRoZXIgdG8gY2xlYXIgdGhlIGZsYWdcbiAgICogQHJldHVybiB7ZmFsc2V8U3RyaW5nfSAtIHJlYXNvbiBhIHJlZHJhdyBpcyBuZWVkZWQuXG4gICAqL1xuICBnZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFncyA9IGZhbHNlfSA9IHt9KSB7XG4gICAgY29uc3QgcmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdztcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdyAmJiAhY2xlYXJSZWRyYXdGbGFncztcbiAgICByZXR1cm4gcmVkcmF3ICYmIHRoaXMuaWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmVkcmF3IGZsYWcuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVkcmF3PXRydWVcbiAgICogQHJldHVybiB7QXR0cmlidXRlTWFuYWdlcn0gLSBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIERFUFJFQ0FURUQgTUVUSE9EU1xuXG4gIC8qKlxuICAgKiBBZGRzIGF0dHJpYnV0ZXNcbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgLSBhdHRyaWJ1dGUgbWFwIChzZWUgYWJvdmUpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB1cGRhdGVycyAtIHNlcGFyYXRlIG1hcCBvZiB1cGRhdGUgZnVuY3Rpb25zIChkZXByZWNhdGVkKVxuICAgKi9cbiAgYWRkSW5zdGFuY2VkKGF0dHJpYnV0ZXMsIHVwZGF0ZXJzID0ge30pIHtcbiAgICB0aGlzLl9hZGQoYXR0cmlidXRlcywgdXBkYXRlcnMsIHtpbnN0YW5jZWQ6IDF9KTtcbiAgfVxuXG4gIC8vIFBST1RFQ1RFRCBNRVRIT0RTIC0gT25seSB0byBiZSB1c2VkIGJ5IGNvbGxhYm9yYXRpbmcgY2xhc3Nlcywgbm90IGJ5IGFwcHNcblxuICAvKipcbiAgICogUmV0dXJucyBvYmplY3QgY29udGFpbmluZyBhbGwgYWNjZXNzb3JzIGFzIGtleXMsIHdpdGggbm9uLW51bGwgdmFsdWVzXG4gICAqIEByZXR1cm4ge09iamVjdH0gLSBhY2Nlc3NvcnMgb2JqZWN0XG4gICAqL1xuICBnZXRBY2Nlc3NvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVHJpZ2dlcnM7XG4gIH1cblxuICAvLyBQUklWQVRFIE1FVEhPRFNcblxuICAvLyBVc2VkIHRvIHJlZ2lzdGVyIGFuIGF0dHJpYnV0ZVxuICBfYWRkKGF0dHJpYnV0ZXMsIHVwZGF0ZXJzID0ge30sIF9leHRyYVByb3BzID0ge30pIHtcbiAgICBjb25zdCBuZXdBdHRyaWJ1dGVzID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgLy8gc3VwcG9ydCBmb3Igc2VwYXJhdGUgdXBkYXRlIGZ1bmN0aW9uIG1hcFxuICAgICAgLy8gRm9yIG5vdywganVzdCBjb3B5IGFueSBhdHRyaWJ1dGVzIGZyb20gdGhhdCBtYXAgaW50byB0aGUgbWFpbiBtYXBcbiAgICAgIC8vIFRPRE8gLSBBdHRyaWJ1dGUgbWFwcyBhcmUgYSBkZXByZWNhdGVkIGZlYXR1cmUsIHJlbW92ZVxuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgaW4gdXBkYXRlcnMpIHtcbiAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAge30sXG4gICAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSxcbiAgICAgICAgICB1cGRhdGVyc1thdHRyaWJ1dGVOYW1lXVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICBjb25zdCBpc0dlbmVyaWMgPSBhdHRyaWJ1dGUuaXNHZW5lcmljIHx8IGZhbHNlO1xuICAgICAgY29uc3QgaXNJbmRleGVkID0gYXR0cmlidXRlLmlzSW5kZXhlZCB8fCBhdHRyaWJ1dGUuZWxlbWVudHM7XG4gICAgICBjb25zdCBzaXplID0gKGF0dHJpYnV0ZS5lbGVtZW50cyAmJiAxKSB8fCBhdHRyaWJ1dGUuc2l6ZTtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlLnZhbHVlIHx8IG51bGw7XG5cbiAgICAgIC8vIEluaXRpYWxpemUgdGhlIGF0dHJpYnV0ZSBkZXNjcmlwdG9yLCB3aXRoIFdlYkdMIGFuZCBtZXRhZGF0YSBmaWVsZHNcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZURhdGEgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICB7XG4gICAgICAgICAgLy8gRW5zdXJlIHRoYXQgZmllbGRzIGFyZSBwcmVzZW50IGJlZm9yZSBPYmplY3Quc2VhbCgpXG4gICAgICAgICAgdGFyZ2V0OiB1bmRlZmluZWQsXG4gICAgICAgICAgdXNlckRhdGE6IHt9IC8vIFJlc2VydmVkIGZvciBhcHBsaWNhdGlvblxuICAgICAgICB9LFxuICAgICAgICAvLyBNZXRhZGF0YVxuICAgICAgICBhdHRyaWJ1dGUsXG4gICAgICAgIHtcbiAgICAgICAgICAvLyBTdGF0ZVxuICAgICAgICAgIGlzRXh0ZXJuYWxCdWZmZXI6IGZhbHNlLFxuICAgICAgICAgIG5lZWRzQWxsb2M6IGZhbHNlLFxuICAgICAgICAgIG5lZWRzVXBkYXRlOiBmYWxzZSxcbiAgICAgICAgICBjaGFuZ2VkOiBmYWxzZSxcblxuICAgICAgICAgIC8vIEx1bWEgZmllbGRzXG4gICAgICAgICAgaXNHZW5lcmljLFxuICAgICAgICAgIGlzSW5kZXhlZCxcbiAgICAgICAgICBzaXplLFxuICAgICAgICAgIHZhbHVlXG4gICAgICAgIH0sXG4gICAgICAgIF9leHRyYVByb3BzXG4gICAgICApO1xuICAgICAgLy8gU2FuaXR5IC0gbm8gYXBwIGZpZWxkcyBvbiBvdXIgYXR0cmlidXRlcy4gVXNlIHVzZXJEYXRhIGluc3RlYWQuXG4gICAgICBPYmplY3Quc2VhbChhdHRyaWJ1dGVEYXRhKTtcblxuICAgICAgLy8gQ2hlY2sgYWxsIGZpZWxkcyBhbmQgZ2VuZXJhdGUgaGVscGZ1bCBlcnJvciBtZXNzYWdlc1xuICAgICAgdGhpcy5fdmFsaWRhdGVBdHRyaWJ1dGVEZWZpbml0aW9uKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZURhdGEpO1xuXG4gICAgICAvLyBBZGQgdG8gYm90aCBhdHRyaWJ1dGVzIGxpc3QgKGZvciByZWdpc3RyYXRpb24gd2l0aCBtb2RlbClcbiAgICAgIG5ld0F0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGVEYXRhO1xuICAgIH1cblxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5hdHRyaWJ1dGVzLCBuZXdBdHRyaWJ1dGVzKTtcblxuICAgIHRoaXMuX21hcFVwZGF0ZVRyaWdnZXJzVG9BdHRyaWJ1dGVzKCk7XG4gIH1cblxuICAvLyBidWlsZCB1cGRhdGVUcmlnZ2VyIG5hbWUgdG8gYXR0cmlidXRlIG5hbWUgbWFwcGluZ1xuICBfbWFwVXBkYXRlVHJpZ2dlcnNUb0F0dHJpYnV0ZXMoKSB7XG4gICAgY29uc3QgdHJpZ2dlcnMgPSB7fTtcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGxldCB7YWNjZXNzb3J9ID0gYXR0cmlidXRlO1xuXG4gICAgICAvLyBCYWNrYXJkcyBjb21wYXRpYmlsaXR5OiBhbGxvdyBhdHRyaWJ1dGUgbmFtZSB0byBiZSB1c2VkIGFzIHVwZGF0ZSB0cmlnZ2VyIGtleVxuICAgICAgdHJpZ2dlcnNbYXR0cmlidXRlTmFtZV0gPSBbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIC8vIHVzZSBhY2Nlc3NvciBuYW1lIGFzIHVwZGF0ZSB0cmlnZ2VyIGtleVxuICAgICAgaWYgKHR5cGVvZiBhY2Nlc3NvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYWNjZXNzb3IgPSBbYWNjZXNzb3JdO1xuICAgICAgfVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYWNjZXNzb3IpKSB7XG4gICAgICAgIGFjY2Vzc29yLmZvckVhY2goYWNjZXNzb3JOYW1lID0+IHtcbiAgICAgICAgICBpZiAoIXRyaWdnZXJzW2FjY2Vzc29yTmFtZV0pIHtcbiAgICAgICAgICAgIHRyaWdnZXJzW2FjY2Vzc29yTmFtZV0gPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdHJpZ2dlcnNbYWNjZXNzb3JOYW1lXS5wdXNoKGF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVRyaWdnZXJzID0gdHJpZ2dlcnM7XG4gIH1cblxuICBfdmFsaWRhdGVBdHRyaWJ1dGVEZWZpbml0aW9uKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZSkge1xuICAgIGFzc2VydChcbiAgICAgIGF0dHJpYnV0ZS5zaXplID49IDEgJiYgYXR0cmlidXRlLnNpemUgPD0gNCxcbiAgICAgIGBBdHRyaWJ1dGUgZGVmaW5pdGlvbiBmb3IgJHthdHRyaWJ1dGVOYW1lfSBpbnZhbGlkIHNpemVgXG4gICAgKTtcblxuICAgIC8vIENoZWNrIHRoYXQgZWl0aGVyICdhY2Nlc3Nvcicgb3IgJ3VwZGF0ZScgaXMgYSB2YWxpZCBmdW5jdGlvblxuICAgIGNvbnN0IGhhc1VwZGF0ZXIgPVxuICAgICAgYXR0cmlidXRlLm5vQWxsb2MgfHxcbiAgICAgIHR5cGVvZiBhdHRyaWJ1dGUudXBkYXRlID09PSAnZnVuY3Rpb24nIHx8XG4gICAgICB0eXBlb2YgYXR0cmlidXRlLmFjY2Vzc29yID09PSAnc3RyaW5nJztcbiAgICBpZiAoIWhhc1VwZGF0ZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0cmlidXRlICR7YXR0cmlidXRlTmFtZX0gbWlzc2luZyB1cGRhdGUgb3IgYWNjZXNzb3JgKTtcbiAgICB9XG4gIH1cblxuICAvLyBDaGVja3MgdGhhdCBhbnkgYXR0cmlidXRlIGJ1ZmZlcnMgaW4gcHJvcHMgYXJlIHZhbGlkXG4gIC8vIE5vdGU6IFRoaXMgaXMganVzdCB0byBoZWxwIGFwcCBjYXRjaCBtaXN0YWtlc1xuICBfY2hlY2tFeHRlcm5hbEJ1ZmZlcnMoe2J1ZmZlcnMgPSB7fSwgaWdub3JlVW5rbm93bkF0dHJpYnV0ZXMgPSBmYWxzZX0gPSB7fSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGJ1ZmZlcnMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBpZiAoIWF0dHJpYnV0ZSAmJiAhaWdub3JlVW5rbm93bkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGF0dHJpYnV0ZSBwcm9wICR7YXR0cmlidXRlTmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIC8vIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlcnNbYXR0cmlidXRlTmFtZV07XG4gICAgICAvLyBUT0RPIC0gY2hlY2sgYnVmZmVyIHR5cGVcbiAgICB9XG4gIH1cblxuICAvLyBTZXQgdGhlIGJ1ZmZlcnMgZm9yIHRoZSBzdXBwbGllZCBhdHRyaWJ1dGVzXG4gIC8vIFVwZGF0ZSBhdHRyaWJ1dGUgYnVmZmVycyBmcm9tIGFueSBhdHRyaWJ1dGVzIGluIHByb3BzXG4gIC8vIERldGFjaCBhbnkgcHJldmlvdXNseSBzZXQgYnVmZmVycywgbWFya2luZyBhbGxcbiAgLy8gQXR0cmlidXRlcyBmb3IgYXV0byBhbGxvY2F0aW9uXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIF9zZXRFeHRlcm5hbEJ1ZmZlcnMoYnVmZmVyTWFwKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZXMsIG51bUluc3RhbmNlc30gPSB0aGlzO1xuXG4gICAgLy8gQ29weSB0aGUgcmVmcyBvZiBhbnkgc3VwcGxpZWQgYnVmZmVycyBpbiB0aGUgcHJvcHNcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlck1hcFthdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGF0dHJpYnV0ZS5pc0V4dGVybmFsQnVmZmVyID0gZmFsc2U7XG4gICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IEFycmF5VHlwZSA9IGdsQXJyYXlGcm9tVHlwZShhdHRyaWJ1dGUudHlwZSB8fCBHTC5GTE9BVCk7XG4gICAgICAgIGlmICghKGJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5VHlwZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF0dHJpYnV0ZSAke2F0dHJpYnV0ZU5hbWV9IG11c3QgYmUgb2YgdHlwZSAke0FycmF5VHlwZS5uYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRyaWJ1dGUuYXV0byAmJiBidWZmZXIubGVuZ3RoIDw9IG51bUluc3RhbmNlcyAqIGF0dHJpYnV0ZS5zaXplKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBdHRyaWJ1dGUgcHJvcCBhcnJheSBtdXN0IG1hdGNoIGxlbmd0aCBhbmQgc2l6ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlLmlzRXh0ZXJuYWxCdWZmZXIgPSB0cnVlO1xuICAgICAgICBhdHRyaWJ1dGUubmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS52YWx1ZSAhPT0gYnVmZmVyKSB7XG4gICAgICAgICAgYXR0cmlidXRlLnZhbHVlID0gYnVmZmVyO1xuICAgICAgICAgIGF0dHJpYnV0ZS5jaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgLyogQ2hlY2tzIHRoYXQgdHlwZWQgYXJyYXlzIGZvciBhdHRyaWJ1dGVzIGFyZSBiaWcgZW5vdWdoXG4gICAqIHNldHMgYWxsb2MgZmxhZyBpZiBub3RcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBhbnkgdXBkYXRlcyBhcmUgbmVlZGVkXG4gICAqL1xuICBfYW5hbHl6ZUJ1ZmZlcnMoe251bUluc3RhbmNlc30pIHtcbiAgICBjb25zdCB7YXR0cmlidXRlc30gPSB0aGlzO1xuICAgIGFzc2VydChudW1JbnN0YW5jZXMgIT09IHVuZGVmaW5lZCwgJ251bUluc3RhbmNlcyBub3QgZGVmaW5lZCcpO1xuXG4gICAgLy8gVHJhY2sgd2hldGhlciBhbnkgYWxsb2NhdGlvbnMgb3IgdXBkYXRlcyBhcmUgbmVlZGVkXG4gICAgbGV0IG5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGlmICghYXR0cmlidXRlLmlzRXh0ZXJuYWxCdWZmZXIpIHtcbiAgICAgICAgLy8gRG8gd2UgbmVlZCB0byByZWFsbG9jYXRlIHRoZSBhdHRyaWJ1dGUncyB0eXBlZCBhcnJheT9cbiAgICAgICAgY29uc3QgbmVlZHNBbGxvYyA9XG4gICAgICAgICAgYXR0cmlidXRlLnZhbHVlID09PSBudWxsIHx8IGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggLyBhdHRyaWJ1dGUuc2l6ZSA8IG51bUluc3RhbmNlcztcbiAgICAgICAgaWYgKG5lZWRzQWxsb2MgJiYgKGF0dHJpYnV0ZS51cGRhdGUgfHwgYXR0cmlidXRlLmFjY2Vzc29yKSkge1xuICAgICAgICAgIGF0dHJpYnV0ZS5uZWVkc0FsbG9jID0gdHJ1ZTtcbiAgICAgICAgICBuZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5uZWVkc1VwZGF0ZSkge1xuICAgICAgICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZWVkc1VwZGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBDYWxscyB1cGRhdGUgb24gYW55IGJ1ZmZlcnMgdGhhdCBuZWVkIHVwZGF0ZVxuICAgKiBUT0RPPyAtIElmIGFwcCBzdXBwbGllZCBhbGwgYXR0cmlidXRlcywgbm8gbmVlZCB0byBpdGVyYXRlIG92ZXIgZGF0YVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMuZGF0YSAtIGRhdGEgKGl0ZXJhYmxlIG9iamVjdClcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMubnVtSW5zdGFuY2VzIC0gY291bnQgb2YgZGF0YVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy5idWZmZXJzID0ge30gLSBwcmUtYWxsb2NhdGVkIGJ1ZmZlcnNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMucHJvcHMgLSBwYXNzZWQgdG8gdXBkYXRlcnNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMuY29udGV4dCAtIFVzZWQgYXMgXCJ0aGlzXCIgY29udGV4dCBmb3IgdXBkYXRlcnNcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBjb21wbGV4aXR5ICovXG4gIF91cGRhdGVCdWZmZXJzKHtudW1JbnN0YW5jZXMsIGRhdGEsIHByb3BzLCBjb250ZXh0fSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzfSA9IHRoaXM7XG5cbiAgICAvLyBBbGxvY2F0ZSBhdCBsZWFzdCBvbmUgZWxlbWVudCB0byBlbnN1cmUgYSB2YWxpZCBidWZmZXJcbiAgICBjb25zdCBhbGxvY0NvdW50ID0gTWF0aC5tYXgobnVtSW5zdGFuY2VzLCAxKTtcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICAvLyBBbGxvY2F0ZSBhIG5ldyB0eXBlZCBhcnJheSBpZiBuZWVkZWRcbiAgICAgIGlmIChhdHRyaWJ1dGUubmVlZHNBbGxvYykge1xuICAgICAgICBjb25zdCBBcnJheVR5cGUgPSBnbEFycmF5RnJvbVR5cGUoYXR0cmlidXRlLnR5cGUgfHwgR0wuRkxPQVQpO1xuICAgICAgICBhdHRyaWJ1dGUudmFsdWUgPSBuZXcgQXJyYXlUeXBlKGF0dHJpYnV0ZS5zaXplICogYWxsb2NDb3VudCk7XG4gICAgICAgIGxvZ0Z1bmN0aW9ucy5vblVwZGF0ZSh7XG4gICAgICAgICAgbGV2ZWw6IExPR19ERVRBSUxfUFJJT1JJVFksXG4gICAgICAgICAgbWVzc2FnZTogYCR7YXR0cmlidXRlTmFtZX0gYWxsb2NhdGVkICR7YWxsb2NDb3VudH1gLFxuICAgICAgICAgIGlkOiB0aGlzLmlkXG4gICAgICAgIH0pO1xuICAgICAgICBhdHRyaWJ1dGUubmVlZHNBbGxvYyA9IGZhbHNlO1xuICAgICAgICBhdHRyaWJ1dGUubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgLy8gQ2FsbCB1cGRhdGVyIGZ1bmN0aW9uIGlmIG5lZWRlZFxuICAgICAgaWYgKGF0dHJpYnV0ZS5uZWVkc1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl91cGRhdGVCdWZmZXIoe2F0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSwgbnVtSW5zdGFuY2VzLCBkYXRhLCBwcm9wcywgY29udGV4dH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb2NlZEluc3RhbmNlcyA9IGFsbG9jQ291bnQ7XG4gIH1cblxuICBfdXBkYXRlQnVmZmVyKHthdHRyaWJ1dGUsIGF0dHJpYnV0ZU5hbWUsIG51bUluc3RhbmNlcywgZGF0YSwgcHJvcHMsIGNvbnRleHR9KSB7XG4gICAgY29uc3Qge3VwZGF0ZSwgYWNjZXNzb3J9ID0gYXR0cmlidXRlO1xuXG4gICAgY29uc3QgdGltZVN0YXJ0ID0gbmV3IERhdGUoKTtcbiAgICBpZiAodXBkYXRlKSB7XG4gICAgICAvLyBDdXN0b20gdXBkYXRlciAtIHR5cGljYWxseSBmb3Igbm9uLWluc3RhbmNlZCBsYXllcnNcbiAgICAgIHVwZGF0ZS5jYWxsKGNvbnRleHQsIGF0dHJpYnV0ZSwge2RhdGEsIHByb3BzLCBudW1JbnN0YW5jZXN9KTtcbiAgICAgIHRoaXMuX2NoZWNrQXR0cmlidXRlQXJyYXkoYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lKTtcbiAgICB9IGVsc2UgaWYgKGFjY2Vzc29yKSB7XG4gICAgICAvLyBTdGFuZGFyZCB1cGRhdGVyXG4gICAgICB0aGlzLl91cGRhdGVCdWZmZXJWaWFTdGFuZGFyZEFjY2Vzc29yKHthdHRyaWJ1dGUsIGRhdGEsIHByb3BzfSk7XG4gICAgICB0aGlzLl9jaGVja0F0dHJpYnV0ZUFycmF5KGF0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ0Z1bmN0aW9ucy5vblVwZGF0ZSh7XG4gICAgICAgIGxldmVsOiBMT0dfREVUQUlMX1BSSU9SSVRZLFxuICAgICAgICBtZXNzYWdlOiBgJHthdHRyaWJ1dGVOYW1lfSBtaXNzaW5nIHVwZGF0ZSBmdW5jdGlvbmAsXG4gICAgICAgIGlkOiB0aGlzLmlkXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgdGltZU1zID0gTWF0aC5yb3VuZChuZXcgRGF0ZSgpIC0gdGltZVN0YXJ0KTtcbiAgICBjb25zdCB0aW1lID0gYCR7dGltZU1zfW1zYDtcbiAgICBsb2dGdW5jdGlvbnMub25VcGRhdGUoe1xuICAgICAgbGV2ZWw6IExPR19ERVRBSUxfUFJJT1JJVFksXG4gICAgICBtZXNzYWdlOiBgJHthdHRyaWJ1dGVOYW1lfSB1cGRhdGVkICR7bnVtSW5zdGFuY2VzfSAke3RpbWV9YCxcbiAgICAgIGlkOiB0aGlzLmlkXG4gICAgfSk7XG5cbiAgICBhdHRyaWJ1dGUubmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICBhdHRyaWJ1dGUuY2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRydWU7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIF91cGRhdGVCdWZmZXJWaWFTdGFuZGFyZEFjY2Vzc29yKHthdHRyaWJ1dGUsIGRhdGEsIHByb3BzfSkge1xuICAgIGNvbnN0IHthY2Nlc3NvciwgdmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGNvbnN0IGFjY2Vzc29yRnVuYyA9IHByb3BzW2FjY2Vzc29yXTtcblxuICAgIGFzc2VydCh0eXBlb2YgYWNjZXNzb3JGdW5jID09PSAnZnVuY3Rpb24nLCBgYWNjZXNzb3IgXCIke2FjY2Vzc29yfVwiIGlzIG5vdCBhIGZ1bmN0aW9uYCk7XG5cbiAgICBsZXQge2RlZmF1bHRWYWx1ZSA9IFswLCAwLCAwLCAwXX0gPSBhdHRyaWJ1dGU7XG4gICAgZGVmYXVsdFZhbHVlID0gQXJyYXkuaXNBcnJheShkZWZhdWx0VmFsdWUpID8gZGVmYXVsdFZhbHVlIDogW2RlZmF1bHRWYWx1ZV07XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGxldCBvYmplY3RWYWx1ZSA9IGFjY2Vzc29yRnVuYyhvYmplY3QpO1xuICAgICAgb2JqZWN0VmFsdWUgPSBBcnJheS5pc0FycmF5KG9iamVjdFZhbHVlKSA/IG9iamVjdFZhbHVlIDogW29iamVjdFZhbHVlXTtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWZhbGx0aHJvdWdoLCBkZWZhdWx0LWNhc2UgKi9cbiAgICAgIHN3aXRjaCAoc2l6ZSkge1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgdmFsdWVbaSArIDNdID0gTnVtYmVyLmlzRmluaXRlKG9iamVjdFZhbHVlWzNdKSA/IG9iamVjdFZhbHVlWzNdIDogZGVmYXVsdFZhbHVlWzNdO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgdmFsdWVbaSArIDJdID0gTnVtYmVyLmlzRmluaXRlKG9iamVjdFZhbHVlWzJdKSA/IG9iamVjdFZhbHVlWzJdIDogZGVmYXVsdFZhbHVlWzJdO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgdmFsdWVbaSArIDFdID0gTnVtYmVyLmlzRmluaXRlKG9iamVjdFZhbHVlWzFdKSA/IG9iamVjdFZhbHVlWzFdIDogZGVmYXVsdFZhbHVlWzFdO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgdmFsdWVbaSArIDBdID0gTnVtYmVyLmlzRmluaXRlKG9iamVjdFZhbHVlWzBdKSA/IG9iamVjdFZhbHVlWzBdIDogZGVmYXVsdFZhbHVlWzBdO1xuICAgICAgfVxuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxuXG4gIF9jaGVja0F0dHJpYnV0ZUFycmF5KGF0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSkge1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgaWYgKHZhbHVlICYmIHZhbHVlLmxlbmd0aCA+PSA0KSB7XG4gICAgICBjb25zdCB2YWxpZCA9XG4gICAgICAgIE51bWJlci5pc0Zpbml0ZSh2YWx1ZVswXSkgJiZcbiAgICAgICAgTnVtYmVyLmlzRmluaXRlKHZhbHVlWzFdKSAmJlxuICAgICAgICBOdW1iZXIuaXNGaW5pdGUodmFsdWVbMl0pICYmXG4gICAgICAgIE51bWJlci5pc0Zpbml0ZSh2YWx1ZVszXSk7XG4gICAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSWxsZWdhbCBhdHRyaWJ1dGUgZ2VuZXJhdGVkIGZvciAke2F0dHJpYnV0ZU5hbWV9YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhdHRyaWJ1dGUgdHJhbnNpdGlvbiB0byB0aGUgY3VycmVudCB0aW1lc3RhbXBcbiAgICogUmV0dXJucyBgdHJ1ZWAgaWYgYW55IHRyYW5zaXRpb24gaXMgaW4gcHJvZ3Jlc3NcbiAgICovXG4gIHVwZGF0ZVRyYW5zaXRpb24oKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZVRyYW5zaXRpb25NYW5nZXJ9ID0gdGhpcztcbiAgICBjb25zdCB0cmFuc2l0aW9uVXBkYXRlZCA9IGF0dHJpYnV0ZVRyYW5zaXRpb25NYW5nZXIuc2V0Q3VycmVudFRpbWUoRGF0ZS5ub3coKSk7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXcgfHwgdHJhbnNpdGlvblVwZGF0ZWQ7XG4gICAgcmV0dXJuIHRyYW5zaXRpb25VcGRhdGVkO1xuICB9XG59XG4iXX0=