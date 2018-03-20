'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _luma = require('luma.gl');

var _attributeTransitionModel = require('./attribute-transition-model');

var _attributeTransitionModel2 = _interopRequireDefault(_attributeTransitionModel);

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TRANSITION_STATE = {
  NONE: 0,
  PENDING: 1,
  STARTED: 2,
  ENDED: 3
};

var noop = function noop() {};

var AttributeTransitionManager = function () {
  function AttributeTransitionManager(gl, _ref) {
    var id = _ref.id;

    _classCallCheck(this, AttributeTransitionManager);

    this.id = id;
    this.gl = gl;

    this.isSupported = _luma.TransformFeedback.isSupported(gl);

    this.attributeTransitions = {};
    this.needsRedraw = false;
    this.model = null;

    if (this.isSupported) {
      this.transformFeedback = new _luma.TransformFeedback(gl);
    } else {
      _log2.default.warn(0, 'WebGL2 not supported by this browser. Transition animation is disabled.');
    }
  }

  /* Public methods */

  // Called when attribute manager updates
  // Check the latest attributes for updates.


  _createClass(AttributeTransitionManager, [{
    key: 'update',
    value: function update(attributes) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this.opts = opts;

      if (!this.isSupported) {
        return;
      }

      var needsNewModel = false;
      var attributeTransitions = this.attributeTransitions;

      var changedTransitions = {};

      for (var attributeName in attributes) {
        var transition = this._updateAttribute(attributeName, attributes[attributeName]);

        if (transition) {
          if (!attributeTransitions[attributeName]) {
            // New animated attribute is added
            attributeTransitions[attributeName] = transition;
            needsNewModel = true;
          }
          changedTransitions[attributeName] = transition;
        }
      }

      for (var _attributeName in attributeTransitions) {
        var attribute = attributes[_attributeName];

        if (!attribute || !attribute.transition) {
          // Animated attribute has been removed
          delete attributeTransitions[_attributeName];
          needsNewModel = true;
        }
      }

      if (needsNewModel) {
        this._createModel();
      } else if (this.model) {
        this.model.setTransitions(changedTransitions);
      }
    }

    // Returns `true` if attribute is transition-enabled

  }, {
    key: 'hasAttribute',
    value: function hasAttribute(attributeName) {
      return attributeName in this.attributeTransitions;
    }

    // Get all the animated attributes

  }, {
    key: 'getAttributes',
    value: function getAttributes() {
      var animatedAttributes = {};

      for (var attributeName in this.attributeTransitions) {
        var transition = this.attributeTransitions[attributeName];

        if (transition.buffer) {
          animatedAttributes[attributeName] = transition.buffer;
        }
      }

      return animatedAttributes;
    }

    /* eslint-disable max-statements */
    // Called every render cycle, run transform feedback
    // Returns `true` if anything changes

  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime(currentTime) {
      if (!this.model) {
        return false;
      }

      var uniforms = {};
      var buffers = {};

      var needsRedraw = this.needsRedraw;
      this.needsRedraw = false;

      for (var attributeName in this.attributeTransitions) {
        var transition = this.attributeTransitions[attributeName];

        buffers[transition.bufferIndex] = transition.buffer;

        var time = 1;
        if (transition.state === TRANSITION_STATE.PENDING) {
          transition.startTime = currentTime;
          transition.state = TRANSITION_STATE.STARTED;
          transition.onStart(transition);
        }

        if (transition.state === TRANSITION_STATE.STARTED) {
          time = (currentTime - transition.startTime) / transition.duration;
          if (time >= 1) {
            time = 1;
            transition.state = TRANSITION_STATE.ENDED;
            transition.onEnd(transition);
          }
          needsRedraw = true;
        }

        uniforms[transition.name + 'Time'] = transition.easing(time);
      }

      if (needsRedraw) {
        this._runTransformFeedback({ uniforms: uniforms, buffers: buffers });
      }

      return needsRedraw;
    }
    /* eslint-enable max-statements */

    /* Private methods */

    // Check an attributes for updates
    // Returns a transition object if a new transition is triggered.

  }, {
    key: '_updateAttribute',
    value: function _updateAttribute(attributeName, attribute) {
      var settings = this._getTransitionSettings(attribute);

      if (settings) {
        var hasChanged = void 0;
        var transition = this.attributeTransitions[attributeName];
        if (transition) {
          hasChanged = attribute.changed;
        } else {
          // New animated attributes have been added
          transition = { name: attributeName, attribute: attribute };
          hasChanged = true;
        }

        if (hasChanged) {
          this._triggerTransition(transition, settings);
          return transition;
        }
      }

      return null;
    }

    // Redraw the transform feedback

  }, {
    key: '_runTransformFeedback',
    value: function _runTransformFeedback(_ref2) {
      var uniforms = _ref2.uniforms,
          buffers = _ref2.buffers;
      var model = this.model,
          transformFeedback = this.transformFeedback;


      transformFeedback.bindBuffers(buffers, {});

      model.draw({
        uniforms: uniforms,
        transformFeedback: transformFeedback,
        parameters: _defineProperty({}, _luma.GL.RASTERIZER_DISCARD, true)
      });
    }

    // Create a model for the transform feedback

  }, {
    key: '_createModel',
    value: function _createModel() {
      if (this.model) {
        this.model.destroy();
      }

      this.model = new _attributeTransitionModel2.default(this.gl, {
        id: this.id,
        transitions: this.attributeTransitions
      });
    }

    // get current values of an attribute, clipped/padded to the size of the new buffer

  }, {
    key: '_getCurrentAttributeState',
    value: function _getCurrentAttributeState(transition) {
      var attribute = transition.attribute,
          buffer = transition.buffer;
      var value = attribute.value,
          type = attribute.type,
          size = attribute.size;


      if (buffer) {
        // If new buffer is bigger than old buffer, back fill with destination values
        var oldBufferData = new Float32Array(value);
        buffer.getData({ dstData: oldBufferData });
        // Hack/Xiaoji: WebGL2 throws error if TransformFeedback does not render to
        // a buffer of type Float32Array.
        // Therefore we need to read data as a Float32Array then re-cast to attribute type
        if (!(value instanceof Float32Array)) {
          oldBufferData = new value.constructor(oldBufferData);
        }
        return { size: size, type: type, value: oldBufferData };
      }
      return { size: size, type: type, value: value };
    }

    // Returns transition settings object if transition is enabled, otherwise `null`

  }, {
    key: '_getTransitionSettings',
    value: function _getTransitionSettings(attribute) {
      var opts = this.opts;
      var transition = attribute.transition,
          accessor = attribute.accessor;


      if (!transition) {
        return null;
      }

      return Array.isArray(accessor) ? accessor.map(function (a) {
        return opts[a];
      }).find(Boolean) : opts[accessor];
    }

    // Normalizes transition settings object, merge with default settings

  }, {
    key: '_normalizeTransitionSettings',
    value: function _normalizeTransitionSettings(settings) {
      // Shorthand: use duration instead of parameter object
      if (Number.isFinite(settings)) {
        settings = { duration: settings };
      }

      // Check if settings is valid
      (0, _assert2.default)(settings && settings.duration > 0);

      return {
        duration: settings.duration,
        easing: settings.easing || function (t) {
          return t;
        },
        onStart: settings.onStart || noop,
        onEnd: settings.onEnd || noop,
        onInterrupt: settings.onInterrupt || noop
      };
    }

    // Start a new transition using the current settings
    // Updates transition state and from/to buffer

  }, {
    key: '_triggerTransition',
    value: function _triggerTransition(transition, settings) {
      this.needsRedraw = true;

      var attribute = transition.attribute,
          buffer = transition.buffer;
      var value = attribute.value,
          size = attribute.size;


      var transitionSettings = this._normalizeTransitionSettings(settings);

      var needsNewBuffer = !buffer || transition.bufferSize < value.length;

      // Attribute descriptor to transition from
      // _getCurrentAttributeState must be called before the current buffer is deleted
      var fromState = this._getCurrentAttributeState(transition);

      // Attribute descriptor to transition to
      // Pre-converting to buffer to reuse in the case where no transition is needed
      var toState = new _luma.Buffer(this.gl, { size: size, data: value });

      if (needsNewBuffer) {
        if (buffer) {
          buffer.delete();
        }

        transition.buffer = new _luma.Buffer(this.gl, {
          size: size,
          instanced: attribute.instanced,
          // WebGL2 throws error if `value` is not cast to Float32Array:
          // `transformfeedback buffers : buffer or buffer range not large enough`
          data: new Float32Array(value.length),
          usage: _luma.GL.DYNAMIC_COPY
        });
        transition.bufferSize = value.length;
      }

      Object.assign(transition, transitionSettings);
      transition.fromState = fromState;
      transition.toState = toState;

      // Reset transition state
      if (transition.state === TRANSITION_STATE.STARTED) {
        transition.onInterrupt(transition);
      }
      transition.state = TRANSITION_STATE.PENDING;
    }
  }]);

  return AttributeTransitionManager;
}();

exports.default = AttributeTransitionManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9hdHRyaWJ1dGUtdHJhbnNpdGlvbi1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIlRSQU5TSVRJT05fU1RBVEUiLCJOT05FIiwiUEVORElORyIsIlNUQVJURUQiLCJFTkRFRCIsIm5vb3AiLCJBdHRyaWJ1dGVUcmFuc2l0aW9uTWFuYWdlciIsImdsIiwiaWQiLCJpc1N1cHBvcnRlZCIsImF0dHJpYnV0ZVRyYW5zaXRpb25zIiwibmVlZHNSZWRyYXciLCJtb2RlbCIsInRyYW5zZm9ybUZlZWRiYWNrIiwid2FybiIsImF0dHJpYnV0ZXMiLCJvcHRzIiwibmVlZHNOZXdNb2RlbCIsImNoYW5nZWRUcmFuc2l0aW9ucyIsImF0dHJpYnV0ZU5hbWUiLCJ0cmFuc2l0aW9uIiwiX3VwZGF0ZUF0dHJpYnV0ZSIsImF0dHJpYnV0ZSIsIl9jcmVhdGVNb2RlbCIsInNldFRyYW5zaXRpb25zIiwiYW5pbWF0ZWRBdHRyaWJ1dGVzIiwiYnVmZmVyIiwiY3VycmVudFRpbWUiLCJ1bmlmb3JtcyIsImJ1ZmZlcnMiLCJidWZmZXJJbmRleCIsInRpbWUiLCJzdGF0ZSIsInN0YXJ0VGltZSIsIm9uU3RhcnQiLCJkdXJhdGlvbiIsIm9uRW5kIiwibmFtZSIsImVhc2luZyIsIl9ydW5UcmFuc2Zvcm1GZWVkYmFjayIsInNldHRpbmdzIiwiX2dldFRyYW5zaXRpb25TZXR0aW5ncyIsImhhc0NoYW5nZWQiLCJjaGFuZ2VkIiwiX3RyaWdnZXJUcmFuc2l0aW9uIiwiYmluZEJ1ZmZlcnMiLCJkcmF3IiwicGFyYW1ldGVycyIsIlJBU1RFUklaRVJfRElTQ0FSRCIsImRlc3Ryb3kiLCJ0cmFuc2l0aW9ucyIsInZhbHVlIiwidHlwZSIsInNpemUiLCJvbGRCdWZmZXJEYXRhIiwiRmxvYXQzMkFycmF5IiwiZ2V0RGF0YSIsImRzdERhdGEiLCJjb25zdHJ1Y3RvciIsImFjY2Vzc29yIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiYSIsImZpbmQiLCJCb29sZWFuIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJ0Iiwib25JbnRlcnJ1cHQiLCJ0cmFuc2l0aW9uU2V0dGluZ3MiLCJfbm9ybWFsaXplVHJhbnNpdGlvblNldHRpbmdzIiwibmVlZHNOZXdCdWZmZXIiLCJidWZmZXJTaXplIiwibGVuZ3RoIiwiZnJvbVN0YXRlIiwiX2dldEN1cnJlbnRBdHRyaWJ1dGVTdGF0ZSIsInRvU3RhdGUiLCJkYXRhIiwiZGVsZXRlIiwiaW5zdGFuY2VkIiwidXNhZ2UiLCJEWU5BTUlDX0NPUFkiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7O0FBRUEsSUFBTUEsbUJBQW1CO0FBQ3ZCQyxRQUFNLENBRGlCO0FBRXZCQyxXQUFTLENBRmM7QUFHdkJDLFdBQVMsQ0FIYztBQUl2QkMsU0FBTztBQUpnQixDQUF6Qjs7QUFPQSxJQUFNQyxPQUFPLFNBQVBBLElBQU8sR0FBTSxDQUFFLENBQXJCOztJQUVxQkMsMEI7QUFDbkIsc0NBQVlDLEVBQVosUUFBc0I7QUFBQSxRQUFMQyxFQUFLLFFBQUxBLEVBQUs7O0FBQUE7O0FBQ3BCLFNBQUtBLEVBQUwsR0FBVUEsRUFBVjtBQUNBLFNBQUtELEVBQUwsR0FBVUEsRUFBVjs7QUFFQSxTQUFLRSxXQUFMLEdBQW1CLHdCQUFrQkEsV0FBbEIsQ0FBOEJGLEVBQTlCLENBQW5COztBQUVBLFNBQUtHLG9CQUFMLEdBQTRCLEVBQTVCO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixLQUFuQjtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFiOztBQUVBLFFBQUksS0FBS0gsV0FBVCxFQUFzQjtBQUNwQixXQUFLSSxpQkFBTCxHQUF5Qiw0QkFBc0JOLEVBQXRCLENBQXpCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsb0JBQUlPLElBQUosQ0FBUyxDQUFULEVBQVkseUVBQVo7QUFDRDtBQUNGOztBQUVEOztBQUVBO0FBQ0E7Ozs7OzJCQUNPQyxVLEVBQXVCO0FBQUEsVUFBWEMsSUFBVyx1RUFB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Ozs7O2tCQXhSa0JJLDBCIiwiZmlsZSI6ImF0dHJpYnV0ZS10cmFuc2l0aW9uLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0dMLCBCdWZmZXIsIFRyYW5zZm9ybUZlZWRiYWNrfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCBBdHRyaWJ1dGVUcmFuc2l0aW9uTW9kZWwgZnJvbSAnLi9hdHRyaWJ1dGUtdHJhbnNpdGlvbi1tb2RlbCc7XG5pbXBvcnQgbG9nIGZyb20gJy4uL3V0aWxzL2xvZyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IFRSQU5TSVRJT05fU1RBVEUgPSB7XG4gIE5PTkU6IDAsXG4gIFBFTkRJTkc6IDEsXG4gIFNUQVJURUQ6IDIsXG4gIEVOREVEOiAzXG59O1xuXG5jb25zdCBub29wID0gKCkgPT4ge307XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF0dHJpYnV0ZVRyYW5zaXRpb25NYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHtpZH0pIHtcbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy5pc1N1cHBvcnRlZCA9IFRyYW5zZm9ybUZlZWRiYWNrLmlzU3VwcG9ydGVkKGdsKTtcblxuICAgIHRoaXMuYXR0cmlidXRlVHJhbnNpdGlvbnMgPSB7fTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gZmFsc2U7XG4gICAgdGhpcy5tb2RlbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5pc1N1cHBvcnRlZCkge1xuICAgICAgdGhpcy50cmFuc2Zvcm1GZWVkYmFjayA9IG5ldyBUcmFuc2Zvcm1GZWVkYmFjayhnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZy53YXJuKDAsICdXZWJHTDIgbm90IHN1cHBvcnRlZCBieSB0aGlzIGJyb3dzZXIuIFRyYW5zaXRpb24gYW5pbWF0aW9uIGlzIGRpc2FibGVkLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qIFB1YmxpYyBtZXRob2RzICovXG5cbiAgLy8gQ2FsbGVkIHdoZW4gYXR0cmlidXRlIG1hbmFnZXIgdXBkYXRlc1xuICAvLyBDaGVjayB0aGUgbGF0ZXN0IGF0dHJpYnV0ZXMgZm9yIHVwZGF0ZXMuXG4gIHVwZGF0ZShhdHRyaWJ1dGVzLCBvcHRzID0ge30pIHtcbiAgICB0aGlzLm9wdHMgPSBvcHRzO1xuXG4gICAgaWYgKCF0aGlzLmlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IG5lZWRzTmV3TW9kZWwgPSBmYWxzZTtcbiAgICBjb25zdCB7YXR0cmlidXRlVHJhbnNpdGlvbnN9ID0gdGhpcztcbiAgICBjb25zdCBjaGFuZ2VkVHJhbnNpdGlvbnMgPSB7fTtcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCB0cmFuc2l0aW9uID0gdGhpcy5fdXBkYXRlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0pO1xuXG4gICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICBpZiAoIWF0dHJpYnV0ZVRyYW5zaXRpb25zW2F0dHJpYnV0ZU5hbWVdKSB7XG4gICAgICAgICAgLy8gTmV3IGFuaW1hdGVkIGF0dHJpYnV0ZSBpcyBhZGRlZFxuICAgICAgICAgIGF0dHJpYnV0ZVRyYW5zaXRpb25zW2F0dHJpYnV0ZU5hbWVdID0gdHJhbnNpdGlvbjtcbiAgICAgICAgICBuZWVkc05ld01vZGVsID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjaGFuZ2VkVHJhbnNpdGlvbnNbYXR0cmlidXRlTmFtZV0gPSB0cmFuc2l0aW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVUcmFuc2l0aW9ucykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcblxuICAgICAgaWYgKCFhdHRyaWJ1dGUgfHwgIWF0dHJpYnV0ZS50cmFuc2l0aW9uKSB7XG4gICAgICAgIC8vIEFuaW1hdGVkIGF0dHJpYnV0ZSBoYXMgYmVlbiByZW1vdmVkXG4gICAgICAgIGRlbGV0ZSBhdHRyaWJ1dGVUcmFuc2l0aW9uc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgICAgbmVlZHNOZXdNb2RlbCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5lZWRzTmV3TW9kZWwpIHtcbiAgICAgIHRoaXMuX2NyZWF0ZU1vZGVsKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1vZGVsKSB7XG4gICAgICB0aGlzLm1vZGVsLnNldFRyYW5zaXRpb25zKGNoYW5nZWRUcmFuc2l0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBgdHJ1ZWAgaWYgYXR0cmlidXRlIGlzIHRyYW5zaXRpb24tZW5hYmxlZFxuICBoYXNBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiBhdHRyaWJ1dGVOYW1lIGluIHRoaXMuYXR0cmlidXRlVHJhbnNpdGlvbnM7XG4gIH1cblxuICAvLyBHZXQgYWxsIHRoZSBhbmltYXRlZCBhdHRyaWJ1dGVzXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgY29uc3QgYW5pbWF0ZWRBdHRyaWJ1dGVzID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gdGhpcy5hdHRyaWJ1dGVUcmFuc2l0aW9ucykge1xuICAgICAgY29uc3QgdHJhbnNpdGlvbiA9IHRoaXMuYXR0cmlidXRlVHJhbnNpdGlvbnNbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIGlmICh0cmFuc2l0aW9uLmJ1ZmZlcikge1xuICAgICAgICBhbmltYXRlZEF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB0cmFuc2l0aW9uLmJ1ZmZlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYW5pbWF0ZWRBdHRyaWJ1dGVzO1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgLy8gQ2FsbGVkIGV2ZXJ5IHJlbmRlciBjeWNsZSwgcnVuIHRyYW5zZm9ybSBmZWVkYmFja1xuICAvLyBSZXR1cm5zIGB0cnVlYCBpZiBhbnl0aGluZyBjaGFuZ2VzXG4gIHNldEN1cnJlbnRUaW1lKGN1cnJlbnRUaW1lKSB7XG4gICAgaWYgKCF0aGlzLm1vZGVsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdW5pZm9ybXMgPSB7fTtcbiAgICBjb25zdCBidWZmZXJzID0ge307XG5cbiAgICBsZXQgbmVlZHNSZWRyYXcgPSB0aGlzLm5lZWRzUmVkcmF3O1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0aGlzLmF0dHJpYnV0ZVRyYW5zaXRpb25zKSB7XG4gICAgICBjb25zdCB0cmFuc2l0aW9uID0gdGhpcy5hdHRyaWJ1dGVUcmFuc2l0aW9uc1thdHRyaWJ1dGVOYW1lXTtcblxuICAgICAgYnVmZmVyc1t0cmFuc2l0aW9uLmJ1ZmZlckluZGV4XSA9IHRyYW5zaXRpb24uYnVmZmVyO1xuXG4gICAgICBsZXQgdGltZSA9IDE7XG4gICAgICBpZiAodHJhbnNpdGlvbi5zdGF0ZSA9PT0gVFJBTlNJVElPTl9TVEFURS5QRU5ESU5HKSB7XG4gICAgICAgIHRyYW5zaXRpb24uc3RhcnRUaW1lID0gY3VycmVudFRpbWU7XG4gICAgICAgIHRyYW5zaXRpb24uc3RhdGUgPSBUUkFOU0lUSU9OX1NUQVRFLlNUQVJURUQ7XG4gICAgICAgIHRyYW5zaXRpb24ub25TdGFydCh0cmFuc2l0aW9uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRyYW5zaXRpb24uc3RhdGUgPT09IFRSQU5TSVRJT05fU1RBVEUuU1RBUlRFRCkge1xuICAgICAgICB0aW1lID0gKGN1cnJlbnRUaW1lIC0gdHJhbnNpdGlvbi5zdGFydFRpbWUpIC8gdHJhbnNpdGlvbi5kdXJhdGlvbjtcbiAgICAgICAgaWYgKHRpbWUgPj0gMSkge1xuICAgICAgICAgIHRpbWUgPSAxO1xuICAgICAgICAgIHRyYW5zaXRpb24uc3RhdGUgPSBUUkFOU0lUSU9OX1NUQVRFLkVOREVEO1xuICAgICAgICAgIHRyYW5zaXRpb24ub25FbmQodHJhbnNpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgbmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB1bmlmb3Jtc1tgJHt0cmFuc2l0aW9uLm5hbWV9VGltZWBdID0gdHJhbnNpdGlvbi5lYXNpbmcodGltZSk7XG4gICAgfVxuXG4gICAgaWYgKG5lZWRzUmVkcmF3KSB7XG4gICAgICB0aGlzLl9ydW5UcmFuc2Zvcm1GZWVkYmFjayh7dW5pZm9ybXMsIGJ1ZmZlcnN9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmVlZHNSZWRyYXc7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIC8qIFByaXZhdGUgbWV0aG9kcyAqL1xuXG4gIC8vIENoZWNrIGFuIGF0dHJpYnV0ZXMgZm9yIHVwZGF0ZXNcbiAgLy8gUmV0dXJucyBhIHRyYW5zaXRpb24gb2JqZWN0IGlmIGEgbmV3IHRyYW5zaXRpb24gaXMgdHJpZ2dlcmVkLlxuICBfdXBkYXRlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5fZ2V0VHJhbnNpdGlvblNldHRpbmdzKGF0dHJpYnV0ZSk7XG5cbiAgICBpZiAoc2V0dGluZ3MpIHtcbiAgICAgIGxldCBoYXNDaGFuZ2VkO1xuICAgICAgbGV0IHRyYW5zaXRpb24gPSB0aGlzLmF0dHJpYnV0ZVRyYW5zaXRpb25zW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgaWYgKHRyYW5zaXRpb24pIHtcbiAgICAgICAgaGFzQ2hhbmdlZCA9IGF0dHJpYnV0ZS5jaGFuZ2VkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTmV3IGFuaW1hdGVkIGF0dHJpYnV0ZXMgaGF2ZSBiZWVuIGFkZGVkXG4gICAgICAgIHRyYW5zaXRpb24gPSB7bmFtZTogYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlfTtcbiAgICAgICAgaGFzQ2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChoYXNDaGFuZ2VkKSB7XG4gICAgICAgIHRoaXMuX3RyaWdnZXJUcmFuc2l0aW9uKHRyYW5zaXRpb24sIHNldHRpbmdzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBSZWRyYXcgdGhlIHRyYW5zZm9ybSBmZWVkYmFja1xuICBfcnVuVHJhbnNmb3JtRmVlZGJhY2soe3VuaWZvcm1zLCBidWZmZXJzfSkge1xuICAgIGNvbnN0IHttb2RlbCwgdHJhbnNmb3JtRmVlZGJhY2t9ID0gdGhpcztcblxuICAgIHRyYW5zZm9ybUZlZWRiYWNrLmJpbmRCdWZmZXJzKGJ1ZmZlcnMsIHt9KTtcblxuICAgIG1vZGVsLmRyYXcoe1xuICAgICAgdW5pZm9ybXMsXG4gICAgICB0cmFuc2Zvcm1GZWVkYmFjayxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgW0dMLlJBU1RFUklaRVJfRElTQ0FSRF06IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIG1vZGVsIGZvciB0aGUgdHJhbnNmb3JtIGZlZWRiYWNrXG4gIF9jcmVhdGVNb2RlbCgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCkge1xuICAgICAgdGhpcy5tb2RlbC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5tb2RlbCA9IG5ldyBBdHRyaWJ1dGVUcmFuc2l0aW9uTW9kZWwodGhpcy5nbCwge1xuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICB0cmFuc2l0aW9uczogdGhpcy5hdHRyaWJ1dGVUcmFuc2l0aW9uc1xuICAgIH0pO1xuICB9XG5cbiAgLy8gZ2V0IGN1cnJlbnQgdmFsdWVzIG9mIGFuIGF0dHJpYnV0ZSwgY2xpcHBlZC9wYWRkZWQgdG8gdGhlIHNpemUgb2YgdGhlIG5ldyBidWZmZXJcbiAgX2dldEN1cnJlbnRBdHRyaWJ1dGVTdGF0ZSh0cmFuc2l0aW9uKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZSwgYnVmZmVyfSA9IHRyYW5zaXRpb247XG4gICAgY29uc3Qge3ZhbHVlLCB0eXBlLCBzaXplfSA9IGF0dHJpYnV0ZTtcblxuICAgIGlmIChidWZmZXIpIHtcbiAgICAgIC8vIElmIG5ldyBidWZmZXIgaXMgYmlnZ2VyIHRoYW4gb2xkIGJ1ZmZlciwgYmFjayBmaWxsIHdpdGggZGVzdGluYXRpb24gdmFsdWVzXG4gICAgICBsZXQgb2xkQnVmZmVyRGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpO1xuICAgICAgYnVmZmVyLmdldERhdGEoe2RzdERhdGE6IG9sZEJ1ZmZlckRhdGF9KTtcbiAgICAgIC8vIEhhY2svWGlhb2ppOiBXZWJHTDIgdGhyb3dzIGVycm9yIGlmIFRyYW5zZm9ybUZlZWRiYWNrIGRvZXMgbm90IHJlbmRlciB0b1xuICAgICAgLy8gYSBidWZmZXIgb2YgdHlwZSBGbG9hdDMyQXJyYXkuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byByZWFkIGRhdGEgYXMgYSBGbG9hdDMyQXJyYXkgdGhlbiByZS1jYXN0IHRvIGF0dHJpYnV0ZSB0eXBlXG4gICAgICBpZiAoISh2YWx1ZSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkpIHtcbiAgICAgICAgb2xkQnVmZmVyRGF0YSA9IG5ldyB2YWx1ZS5jb25zdHJ1Y3RvcihvbGRCdWZmZXJEYXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7c2l6ZSwgdHlwZSwgdmFsdWU6IG9sZEJ1ZmZlckRhdGF9O1xuICAgIH1cbiAgICByZXR1cm4ge3NpemUsIHR5cGUsIHZhbHVlfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdHJhbnNpdGlvbiBzZXR0aW5ncyBvYmplY3QgaWYgdHJhbnNpdGlvbiBpcyBlbmFibGVkLCBvdGhlcndpc2UgYG51bGxgXG4gIF9nZXRUcmFuc2l0aW9uU2V0dGluZ3MoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge29wdHN9ID0gdGhpcztcbiAgICBjb25zdCB7dHJhbnNpdGlvbiwgYWNjZXNzb3J9ID0gYXR0cmlidXRlO1xuXG4gICAgaWYgKCF0cmFuc2l0aW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhY2Nlc3NvcikgPyBhY2Nlc3Nvci5tYXAoYSA9PiBvcHRzW2FdKS5maW5kKEJvb2xlYW4pIDogb3B0c1thY2Nlc3Nvcl07XG4gIH1cblxuICAvLyBOb3JtYWxpemVzIHRyYW5zaXRpb24gc2V0dGluZ3Mgb2JqZWN0LCBtZXJnZSB3aXRoIGRlZmF1bHQgc2V0dGluZ3NcbiAgX25vcm1hbGl6ZVRyYW5zaXRpb25TZXR0aW5ncyhzZXR0aW5ncykge1xuICAgIC8vIFNob3J0aGFuZDogdXNlIGR1cmF0aW9uIGluc3RlYWQgb2YgcGFyYW1ldGVyIG9iamVjdFxuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoc2V0dGluZ3MpKSB7XG4gICAgICBzZXR0aW5ncyA9IHtkdXJhdGlvbjogc2V0dGluZ3N9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHNldHRpbmdzIGlzIHZhbGlkXG4gICAgYXNzZXJ0KHNldHRpbmdzICYmIHNldHRpbmdzLmR1cmF0aW9uID4gMCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZHVyYXRpb246IHNldHRpbmdzLmR1cmF0aW9uLFxuICAgICAgZWFzaW5nOiBzZXR0aW5ncy5lYXNpbmcgfHwgKHQgPT4gdCksXG4gICAgICBvblN0YXJ0OiBzZXR0aW5ncy5vblN0YXJ0IHx8IG5vb3AsXG4gICAgICBvbkVuZDogc2V0dGluZ3Mub25FbmQgfHwgbm9vcCxcbiAgICAgIG9uSW50ZXJydXB0OiBzZXR0aW5ncy5vbkludGVycnVwdCB8fCBub29wXG4gICAgfTtcbiAgfVxuXG4gIC8vIFN0YXJ0IGEgbmV3IHRyYW5zaXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgc2V0dGluZ3NcbiAgLy8gVXBkYXRlcyB0cmFuc2l0aW9uIHN0YXRlIGFuZCBmcm9tL3RvIGJ1ZmZlclxuICBfdHJpZ2dlclRyYW5zaXRpb24odHJhbnNpdGlvbiwgc2V0dGluZ3MpIHtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcblxuICAgIGNvbnN0IHthdHRyaWJ1dGUsIGJ1ZmZlcn0gPSB0cmFuc2l0aW9uO1xuICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG5cbiAgICBjb25zdCB0cmFuc2l0aW9uU2V0dGluZ3MgPSB0aGlzLl9ub3JtYWxpemVUcmFuc2l0aW9uU2V0dGluZ3Moc2V0dGluZ3MpO1xuXG4gICAgY29uc3QgbmVlZHNOZXdCdWZmZXIgPSAhYnVmZmVyIHx8IHRyYW5zaXRpb24uYnVmZmVyU2l6ZSA8IHZhbHVlLmxlbmd0aDtcblxuICAgIC8vIEF0dHJpYnV0ZSBkZXNjcmlwdG9yIHRvIHRyYW5zaXRpb24gZnJvbVxuICAgIC8vIF9nZXRDdXJyZW50QXR0cmlidXRlU3RhdGUgbXVzdCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBjdXJyZW50IGJ1ZmZlciBpcyBkZWxldGVkXG4gICAgY29uc3QgZnJvbVN0YXRlID0gdGhpcy5fZ2V0Q3VycmVudEF0dHJpYnV0ZVN0YXRlKHRyYW5zaXRpb24pO1xuXG4gICAgLy8gQXR0cmlidXRlIGRlc2NyaXB0b3IgdG8gdHJhbnNpdGlvbiB0b1xuICAgIC8vIFByZS1jb252ZXJ0aW5nIHRvIGJ1ZmZlciB0byByZXVzZSBpbiB0aGUgY2FzZSB3aGVyZSBubyB0cmFuc2l0aW9uIGlzIG5lZWRlZFxuICAgIGNvbnN0IHRvU3RhdGUgPSBuZXcgQnVmZmVyKHRoaXMuZ2wsIHtzaXplLCBkYXRhOiB2YWx1ZX0pO1xuXG4gICAgaWYgKG5lZWRzTmV3QnVmZmVyKSB7XG4gICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgIGJ1ZmZlci5kZWxldGUoKTtcbiAgICAgIH1cblxuICAgICAgdHJhbnNpdGlvbi5idWZmZXIgPSBuZXcgQnVmZmVyKHRoaXMuZ2wsIHtcbiAgICAgICAgc2l6ZSxcbiAgICAgICAgaW5zdGFuY2VkOiBhdHRyaWJ1dGUuaW5zdGFuY2VkLFxuICAgICAgICAvLyBXZWJHTDIgdGhyb3dzIGVycm9yIGlmIGB2YWx1ZWAgaXMgbm90IGNhc3QgdG8gRmxvYXQzMkFycmF5OlxuICAgICAgICAvLyBgdHJhbnNmb3JtZmVlZGJhY2sgYnVmZmVycyA6IGJ1ZmZlciBvciBidWZmZXIgcmFuZ2Ugbm90IGxhcmdlIGVub3VnaGBcbiAgICAgICAgZGF0YTogbmV3IEZsb2F0MzJBcnJheSh2YWx1ZS5sZW5ndGgpLFxuICAgICAgICB1c2FnZTogR0wuRFlOQU1JQ19DT1BZXG4gICAgICB9KTtcbiAgICAgIHRyYW5zaXRpb24uYnVmZmVyU2l6ZSA9IHZhbHVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBPYmplY3QuYXNzaWduKHRyYW5zaXRpb24sIHRyYW5zaXRpb25TZXR0aW5ncyk7XG4gICAgdHJhbnNpdGlvbi5mcm9tU3RhdGUgPSBmcm9tU3RhdGU7XG4gICAgdHJhbnNpdGlvbi50b1N0YXRlID0gdG9TdGF0ZTtcblxuICAgIC8vIFJlc2V0IHRyYW5zaXRpb24gc3RhdGVcbiAgICBpZiAodHJhbnNpdGlvbi5zdGF0ZSA9PT0gVFJBTlNJVElPTl9TVEFURS5TVEFSVEVEKSB7XG4gICAgICB0cmFuc2l0aW9uLm9uSW50ZXJydXB0KHRyYW5zaXRpb24pO1xuICAgIH1cbiAgICB0cmFuc2l0aW9uLnN0YXRlID0gVFJBTlNJVElPTl9TVEFURS5QRU5ESU5HO1xuICB9XG59XG4iXX0=