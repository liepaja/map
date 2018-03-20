'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _deck = require('deck.gl');

var _luma = require('luma.gl');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _meshLayerVertex = require('./mesh-layer-vertex.glsl');

var _meshLayerVertex2 = _interopRequireDefault(_meshLayerVertex);

var _meshLayerVertex3 = require('./mesh-layer-vertex-64.glsl');

var _meshLayerVertex4 = _interopRequireDefault(_meshLayerVertex3);

var _meshLayerFragment = require('./mesh-layer-fragment.glsl');

var _meshLayerFragment2 = _interopRequireDefault(_meshLayerFragment);

var _project64utils = require('../shaderlib/project64utils/project64utils');

var _project64utils2 = _interopRequireDefault(_project64utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Note: This file will either be moved back to deck.gl or reformatted to web-monorepo standards
// Disabling lint temporarily to facilitate copying code in and out of this repo
/* eslint-disable */

// Copyright (c) 2015 Uber Technologies, Inc.
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

var fp64LowPart = _deck.experimental.fp64LowPart,
    enable64bitSupport = _deck.experimental.enable64bitSupport;


function degreeToRadian(degree) {
  return degree * Math.PI / 180;
}

/*
 * Load image data into luma.gl Texture2D objects
 * @param {WebGLContext} gl
 * @param {String|Texture2D|HTMLImageElement|Uint8ClampedArray} src - source of image data
 *   can be url string, Texture2D object, HTMLImageElement or pixel array
 * @returns {Promise} resolves to an object with name -> texture mapping
 */
function getTexture(gl, src, opts) {
  if (typeof src === 'string') {
    // Url, load the image
    return (0, _luma.loadTextures)(gl, Object.assign({ urls: [src] }, opts)).then(function (textures) {
      return textures[0];
    }).catch(function (error) {
      throw new Error('Could not load texture from ' + src + ': ' + error);
    });
  }
  return new Promise(function (resolve) {
    return resolve(getTextureFromData(gl, src, opts));
  });
}

/*
 * Convert image data into texture
 * @returns {Texture2D} texture
 */
function getTextureFromData(gl, data, opts) {
  if (data instanceof _luma.Texture2D) {
    return data;
  }
  return new _luma.Texture2D(gl, Object.assign({ data: data }, opts));
}

var defaultProps = {
  mesh: null,
  texture: null,
  sizeScale: 1,

  // TODO - parameters should be merged, not completely overridden
  parameters: {
    depthTest: true,
    depthFunc: _luma.GL.LEQUAL
  },
  fp64: false,
  // Optional settings for 'lighting' shader module
  lightSettings: {
    lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.0, 5000],
    ambientRatio: 0.05,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [2.0, 0.0, 0.0, 0.0],
    numberOfLights: 2
  },

  getPosition: function getPosition(x) {
    return x.position;
  },
  getAngleDegreesCW: function getAngleDegreesCW(x) {
    return x.angle || 0;
  },
  getColor: function getColor(x) {
    return x.color || [0, 0, 0, 255];
  }
};

var MeshLayer = function (_Layer) {
  _inherits(MeshLayer, _Layer);

  function MeshLayer() {
    _classCallCheck(this, MeshLayer);

    return _possibleConstructorReturn(this, (MeshLayer.__proto__ || Object.getPrototypeOf(MeshLayer)).apply(this, arguments));
  }

  _createClass(MeshLayer, [{
    key: 'getShaders',
    value: function getShaders(id) {
      var shaderCache = this.context.shaderCache;

      return enable64bitSupport(this.props) ? { vs: _meshLayerVertex4.default, fs: _meshLayerFragment2.default, modules: [_project64utils2.default, 'picking', 'lighting'], shaderCache: shaderCache } : { vs: _meshLayerVertex2.default, fs: _meshLayerFragment2.default, modules: ['picking', 'lighting'], shaderCache: shaderCache }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          accessor: 'getPosition',
          update: this.calculateInstancePositions
        },
        instanceAngles: {
          size: 1,
          accessor: 'getAngleDegreesCW',
          update: this.calculateInstanceAngles
        },
        instanceColors: { size: 4, accessor: 'getColor', update: this.calculateInstanceColors }
      });
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      var attributeManager = this.getAttributeManager();

      // super.updateState({props, oldProps, changeFlags});
      if (changeFlags.dataChanged) {
        attributeManager.invalidateAll();
      }

      if (changeFlags.propsChanged) {
        this._updateFP64(props, oldProps);

        if (props.sizeScale !== oldProps.sizeScale) {
          var sizeScale = props.sizeScale;

          this.state.model.setUniforms({ sizeScale: sizeScale });
        }

        if (props.texture !== oldProps.texture) {
          if (props.texture) {
            this.loadTexture(props.texture);
          } else {
            // TODO - reset
          }
        }

        if (props.lightSettings !== oldProps.lightSettings) {
          this.state.model.setUniforms(props.lightSettings);
        }
      }
    }
  }, {
    key: '_updateFP64',
    value: function _updateFP64(props, oldProps) {
      if (props.fp64 !== oldProps.fp64) {
        this.setState({ model: this.getModel(this.context.gl) });

        this.state.model.setUniforms({
          sizeScale: props.sizeScale
        });

        var attributeManager = this.getAttributeManager();
        attributeManager.invalidateAll();

        if (enable64bitSupport(this.props)) {
          attributeManager.addInstanced({
            instancePositions64xy: {
              size: 2,
              accessor: 'getPosition',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xy']);
        }
      }
    }
  }, {
    key: 'draw',
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;

      this.state.model.render(uniforms);
    }
  }, {
    key: 'getModel',
    value: function getModel(gl) {
      var isValidMesh = this.props.mesh instanceof _luma.Geometry && this.props.mesh.attributes.positions;
      (0, _assert2.default)(isValidMesh);

      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: this.props.mesh,
        isInstanced: true
      }));
    }
  }, {
    key: 'loadTexture',
    value: function loadTexture(src) {
      var _this2 = this;

      var gl = this.context.gl;
      var model = this.state.model;

      getTexture(gl, src).then(function (texture) {
        model.setUniforms({ sampler1: texture });
        _this2.setNeedsRedraw();
      });
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getPosition = _props.getPosition;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var position = getPosition(point);
          value[i] = position[0];
          value[i + 1] = position[1];
          value[i + 2] = position[2] || 0;
          i += size;
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
  }, {
    key: 'calculateInstancePositions64xyLow',
    value: function calculateInstancePositions64xyLow(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;

          var position = getPosition(point);
          value[i++] = fp64LowPart(position[0]);
          value[i++] = fp64LowPart(position[1]);
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
    key: 'calculateInstanceAngles',
    value: function calculateInstanceAngles(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getAngleDegreesCW = _props3.getAngleDegreesCW;
      var value = attribute.value,
          size = attribute.size;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;

          var angle = getAngleDegreesCW(point);
          value[i] = -degreeToRadian(angle);
          i += size;
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
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getColor = _props4.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var point = _step4.value;

          var color = getColor(point) || DEFAULT_COLOR;
          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? 255 : color[3];
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
    }
  }]);

  return MeshLayer;
}(_deck.Layer);

exports.default = MeshLayer;


MeshLayer.layerName = 'MeshLayer';
MeshLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwtbGF5ZXJzL3NyYy9tZXNoLWxheWVyL21lc2gtbGF5ZXIuanMiXSwibmFtZXMiOlsiZnA2NExvd1BhcnQiLCJlbmFibGU2NGJpdFN1cHBvcnQiLCJkZWdyZWVUb1JhZGlhbiIsImRlZ3JlZSIsIk1hdGgiLCJQSSIsImdldFRleHR1cmUiLCJnbCIsInNyYyIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJ1cmxzIiwidGhlbiIsInRleHR1cmVzIiwiY2F0Y2giLCJFcnJvciIsImVycm9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJnZXRUZXh0dXJlRnJvbURhdGEiLCJkYXRhIiwiZGVmYXVsdFByb3BzIiwibWVzaCIsInRleHR1cmUiLCJzaXplU2NhbGUiLCJwYXJhbWV0ZXJzIiwiZGVwdGhUZXN0IiwiZGVwdGhGdW5jIiwiTEVRVUFMIiwiZnA2NCIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJnZXRBbmdsZURlZ3JlZXNDVyIsImFuZ2xlIiwiZ2V0Q29sb3IiLCJjb2xvciIsIk1lc2hMYXllciIsImlkIiwic2hhZGVyQ2FjaGUiLCJjb250ZXh0IiwicHJvcHMiLCJ2cyIsImZzIiwibW9kdWxlcyIsImF0dHJpYnV0ZU1hbmFnZXIiLCJnZXRBdHRyaWJ1dGVNYW5hZ2VyIiwiYWRkSW5zdGFuY2VkIiwiaW5zdGFuY2VQb3NpdGlvbnMiLCJzaXplIiwiYWNjZXNzb3IiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyIsImluc3RhbmNlQW5nbGVzIiwiY2FsY3VsYXRlSW5zdGFuY2VBbmdsZXMiLCJpbnN0YW5jZUNvbG9ycyIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzIiwib2xkUHJvcHMiLCJjaGFuZ2VGbGFncyIsImRhdGFDaGFuZ2VkIiwiaW52YWxpZGF0ZUFsbCIsInByb3BzQ2hhbmdlZCIsIl91cGRhdGVGUDY0Iiwic3RhdGUiLCJtb2RlbCIsInNldFVuaWZvcm1zIiwibG9hZFRleHR1cmUiLCJzZXRTdGF0ZSIsImdldE1vZGVsIiwiaW5zdGFuY2VQb3NpdGlvbnM2NHh5IiwiY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93IiwicmVtb3ZlIiwidW5pZm9ybXMiLCJyZW5kZXIiLCJpc1ZhbGlkTWVzaCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbnMiLCJnZXRTaGFkZXJzIiwiZ2VvbWV0cnkiLCJpc0luc3RhbmNlZCIsInNhbXBsZXIxIiwic2V0TmVlZHNSZWRyYXciLCJhdHRyaWJ1dGUiLCJ2YWx1ZSIsImkiLCJwb2ludCIsIkRFRkFVTFRfQ09MT1IiLCJpc05hTiIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUF3QkE7O0FBRUE7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUFoQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQSxXLHNCQUFBQSxXO0lBQWFDLGtCLHNCQUFBQSxrQjs7O0FBU3BCLFNBQVNDLGNBQVQsQ0FBd0JDLE1BQXhCLEVBQWdDO0FBQzlCLFNBQU9BLFNBQVNDLEtBQUtDLEVBQWQsR0FBbUIsR0FBMUI7QUFDRDs7QUFFRDs7Ozs7OztBQU9BLFNBQVNDLFVBQVQsQ0FBb0JDLEVBQXBCLEVBQXdCQyxHQUF4QixFQUE2QkMsSUFBN0IsRUFBbUM7QUFDakMsTUFBSSxPQUFPRCxHQUFQLEtBQWUsUUFBbkIsRUFBNkI7QUFDM0I7QUFDQSxXQUFPLHdCQUFhRCxFQUFiLEVBQWlCRyxPQUFPQyxNQUFQLENBQWMsRUFBQ0MsTUFBTSxDQUFDSixH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Q3hCLGNBQU1qRCxRQUFRRCxTQUFTa0QsS0FBVCxLQUFtQkMsYUFBakM7QUFDQUgsZ0JBQU1DLEdBQU4sSUFBYWhELE1BQU0sQ0FBTixDQUFiO0FBQ0ErQyxnQkFBTUMsR0FBTixJQUFhaEQsTUFBTSxDQUFOLENBQWI7QUFDQStDLGdCQUFNQyxHQUFOLElBQWFoRCxNQUFNLENBQU4sQ0FBYjtBQUNBK0MsZ0JBQU1DLEdBQU4sSUFBYUcsTUFBTW5ELE1BQU0sQ0FBTixDQUFOLElBQWtCLEdBQWxCLEdBQXdCQSxNQUFNLENBQU4sQ0FBckM7QUFDRDtBQVZnQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBV2xDOzs7Ozs7a0JBekprQkMsUzs7O0FBNEpyQkEsVUFBVW1ELFNBQVYsR0FBc0IsV0FBdEI7QUFDQW5ELFVBQVV2QixZQUFWLEdBQXlCQSxZQUF6QiIsImZpbGUiOiJtZXNoLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTm90ZTogVGhpcyBmaWxlIHdpbGwgZWl0aGVyIGJlIG1vdmVkIGJhY2sgdG8gZGVjay5nbCBvciByZWZvcm1hdHRlZCB0byB3ZWItbW9ub3JlcG8gc3RhbmRhcmRzXG4vLyBEaXNhYmxpbmcgbGludCB0ZW1wb3JhcmlseSB0byBmYWNpbGl0YXRlIGNvcHlpbmcgY29kZSBpbiBhbmQgb3V0IG9mIHRoaXMgcmVwb1xuLyogZXNsaW50LWRpc2FibGUgKi9cblxuLy8gQ29weXJpZ2h0IChjKSAyMDE1IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtMYXllciwgQ09PUkRJTkFURV9TWVNURU0sIGV4cGVyaW1lbnRhbH0gZnJvbSAnZGVjay5nbCc7XG5jb25zdCB7ZnA2NExvd1BhcnQsIGVuYWJsZTY0Yml0U3VwcG9ydH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnksIGxvYWRUZXh0dXJlcywgVGV4dHVyZTJEfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuaW1wb3J0IHZzIGZyb20gJy4vbWVzaC1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgdnM2NCBmcm9tICcuL21lc2gtbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGZzIGZyb20gJy4vbWVzaC1sYXllci1mcmFnbWVudC5nbHNsJztcbmltcG9ydCBwcm9qZWN0NjR1dGlscyBmcm9tICcuLi9zaGFkZXJsaWIvcHJvamVjdDY0dXRpbHMvcHJvamVjdDY0dXRpbHMnO1xuXG5mdW5jdGlvbiBkZWdyZWVUb1JhZGlhbihkZWdyZWUpIHtcbiAgcmV0dXJuIGRlZ3JlZSAqIE1hdGguUEkgLyAxODA7XG59XG5cbi8qXG4gKiBMb2FkIGltYWdlIGRhdGEgaW50byBsdW1hLmdsIFRleHR1cmUyRCBvYmplY3RzXG4gKiBAcGFyYW0ge1dlYkdMQ29udGV4dH0gZ2xcbiAqIEBwYXJhbSB7U3RyaW5nfFRleHR1cmUyRHxIVE1MSW1hZ2VFbGVtZW50fFVpbnQ4Q2xhbXBlZEFycmF5fSBzcmMgLSBzb3VyY2Ugb2YgaW1hZ2UgZGF0YVxuICogICBjYW4gYmUgdXJsIHN0cmluZywgVGV4dHVyZTJEIG9iamVjdCwgSFRNTEltYWdlRWxlbWVudCBvciBwaXhlbCBhcnJheVxuICogQHJldHVybnMge1Byb21pc2V9IHJlc29sdmVzIHRvIGFuIG9iamVjdCB3aXRoIG5hbWUgLT4gdGV4dHVyZSBtYXBwaW5nXG4gKi9cbmZ1bmN0aW9uIGdldFRleHR1cmUoZ2wsIHNyYywgb3B0cykge1xuICBpZiAodHlwZW9mIHNyYyA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBVcmwsIGxvYWQgdGhlIGltYWdlXG4gICAgcmV0dXJuIGxvYWRUZXh0dXJlcyhnbCwgT2JqZWN0LmFzc2lnbih7dXJsczogW3NyY119LCBvcHRzKSlcbiAgICAgIC50aGVuKHRleHR1cmVzID0+IHRleHR1cmVzWzBdKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgbG9hZCB0ZXh0dXJlIGZyb20gJHtzcmN9OiAke2Vycm9yfWApO1xuICAgICAgfSk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcmVzb2x2ZShnZXRUZXh0dXJlRnJvbURhdGEoZ2wsIHNyYywgb3B0cykpKTtcbn1cblxuLypcbiAqIENvbnZlcnQgaW1hZ2UgZGF0YSBpbnRvIHRleHR1cmVcbiAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IHRleHR1cmVcbiAqL1xuZnVuY3Rpb24gZ2V0VGV4dHVyZUZyb21EYXRhKGdsLCBkYXRhLCBvcHRzKSB7XG4gIGlmIChkYXRhIGluc3RhbmNlb2YgVGV4dHVyZTJEKSB7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cbiAgcmV0dXJuIG5ldyBUZXh0dXJlMkQoZ2wsIE9iamVjdC5hc3NpZ24oe2RhdGF9LCBvcHRzKSk7XG59XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgbWVzaDogbnVsbCxcbiAgdGV4dHVyZTogbnVsbCxcbiAgc2l6ZVNjYWxlOiAxLFxuXG4gIC8vIFRPRE8gLSBwYXJhbWV0ZXJzIHNob3VsZCBiZSBtZXJnZWQsIG5vdCBjb21wbGV0ZWx5IG92ZXJyaWRkZW5cbiAgcGFyYW1ldGVyczoge1xuICAgIGRlcHRoVGVzdDogdHJ1ZSxcbiAgICBkZXB0aEZ1bmM6IEdMLkxFUVVBTFxuICB9LFxuICBmcDY0OiBmYWxzZSxcbiAgLy8gT3B0aW9uYWwgc2V0dGluZ3MgZm9yICdsaWdodGluZycgc2hhZGVyIG1vZHVsZVxuICBsaWdodFNldHRpbmdzOiB7XG4gICAgbGlnaHRzUG9zaXRpb246IFstMTIyLjQ1LCAzNy43NSwgODAwMCwgLTEyMi4wLCAzOC4wLCA1MDAwXSxcbiAgICBhbWJpZW50UmF0aW86IDAuMDUsXG4gICAgZGlmZnVzZVJhdGlvOiAwLjYsXG4gICAgc3BlY3VsYXJSYXRpbzogMC44LFxuICAgIGxpZ2h0c1N0cmVuZ3RoOiBbMi4wLCAwLjAsIDAuMCwgMC4wXSxcbiAgICBudW1iZXJPZkxpZ2h0czogMlxuICB9LFxuXG4gIGdldFBvc2l0aW9uOiB4ID0+IHgucG9zaXRpb24sXG4gIGdldEFuZ2xlRGVncmVlc0NXOiB4ID0+IHguYW5nbGUgfHwgMCxcbiAgZ2V0Q29sb3I6IHggPT4geC5jb2xvciB8fCBbMCwgMCwgMCwgMjU1XVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVzaExheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKGlkKSB7XG4gICAgY29uc3Qge3NoYWRlckNhY2hlfSA9IHRoaXMuY29udGV4dDtcbiAgICByZXR1cm4gZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpXG4gICAgICA/IHt2czogdnM2NCwgZnMsIG1vZHVsZXM6IFtwcm9qZWN0NjR1dGlscywgJ3BpY2tpbmcnLCAnbGlnaHRpbmcnXSwgc2hhZGVyQ2FjaGV9XG4gICAgICA6IHt2cywgZnMsIG1vZHVsZXM6IFsncGlja2luZycsICdsaWdodGluZyddLCBzaGFkZXJDYWNoZX07IC8vICdwcm9qZWN0JyBtb2R1bGUgYWRkZWQgYnkgZGVmYXVsdC5cbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQb3NpdGlvbnM6IHtcbiAgICAgICAgc2l6ZTogMyxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRQb3NpdGlvbicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlQW5nbGVzOiB7XG4gICAgICAgIHNpemU6IDEsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0QW5nbGVEZWdyZWVzQ1cnLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VBbmdsZXNcbiAgICAgIH0sXG4gICAgICBpbnN0YW5jZUNvbG9yczoge3NpemU6IDQsIGFjY2Vzc29yOiAnZ2V0Q29sb3InLCB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VDb2xvcnN9XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG5cbiAgICAvLyBzdXBlci51cGRhdGVTdGF0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZUZsYWdzLnByb3BzQ2hhbmdlZCkge1xuICAgICAgdGhpcy5fdXBkYXRlRlA2NChwcm9wcywgb2xkUHJvcHMpO1xuXG4gICAgICBpZiAocHJvcHMuc2l6ZVNjYWxlICE9PSBvbGRQcm9wcy5zaXplU2NhbGUpIHtcbiAgICAgICAgY29uc3Qge3NpemVTY2FsZX0gPSBwcm9wcztcbiAgICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRVbmlmb3Jtcyh7c2l6ZVNjYWxlfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9wcy50ZXh0dXJlICE9PSBvbGRQcm9wcy50ZXh0dXJlKSB7XG4gICAgICAgIGlmIChwcm9wcy50ZXh0dXJlKSB7XG4gICAgICAgICAgdGhpcy5sb2FkVGV4dHVyZShwcm9wcy50ZXh0dXJlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUT0RPIC0gcmVzZXRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocHJvcHMubGlnaHRTZXR0aW5ncyAhPT0gb2xkUHJvcHMubGlnaHRTZXR0aW5ncykge1xuICAgICAgICB0aGlzLnN0YXRlLm1vZGVsLnNldFVuaWZvcm1zKHByb3BzLmxpZ2h0U2V0dGluZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVGUDY0KHByb3BzLCBvbGRQcm9wcykge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHttb2RlbDogdGhpcy5nZXRNb2RlbCh0aGlzLmNvbnRleHQuZ2wpfSk7XG5cbiAgICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0VW5pZm9ybXMoe1xuICAgICAgICBzaXplU2NhbGU6IHByb3BzLnNpemVTY2FsZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZUFsbCgpO1xuXG4gICAgICBpZiAoZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0eHk6IHtcbiAgICAgICAgICAgIHNpemU6IDIsXG4gICAgICAgICAgICBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJyxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoWydpbnN0YW5jZVBvc2l0aW9uczY0eHknXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIodW5pZm9ybXMpO1xuICB9XG5cbiAgZ2V0TW9kZWwoZ2wpIHtcbiAgICBjb25zdCBpc1ZhbGlkTWVzaCA9IHRoaXMucHJvcHMubWVzaCBpbnN0YW5jZW9mIEdlb21ldHJ5ICYmIHRoaXMucHJvcHMubWVzaC5hdHRyaWJ1dGVzLnBvc2l0aW9ucztcbiAgICBhc3NlcnQoaXNWYWxpZE1lc2gpO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbChcbiAgICAgIGdsLFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTaGFkZXJzKCksIHtcbiAgICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICAgIGdlb21ldHJ5OiB0aGlzLnByb3BzLm1lc2gsXG4gICAgICAgIGlzSW5zdGFuY2VkOiB0cnVlXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBsb2FkVGV4dHVyZShzcmMpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnN0YXRlO1xuICAgIGdldFRleHR1cmUoZ2wsIHNyYykudGhlbih0ZXh0dXJlID0+IHtcbiAgICAgIG1vZGVsLnNldFVuaWZvcm1zKHtzYW1wbGVyMTogdGV4dHVyZX0pO1xuICAgICAgdGhpcy5zZXROZWVkc1JlZHJhdygpO1xuICAgIH0pO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlLCBzaXplfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2ldID0gcG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpICsgMV0gPSBwb3NpdGlvblsxXTtcbiAgICAgIHZhbHVlW2kgKyAyXSA9IHBvc2l0aW9uWzJdIHx8IDA7XG4gICAgICBpICs9IHNpemU7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gZnA2NExvd1BhcnQocG9zaXRpb25bMF0pO1xuICAgICAgdmFsdWVbaSsrXSA9IGZwNjRMb3dQYXJ0KHBvc2l0aW9uWzFdKTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUFuZ2xlcyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0QW5nbGVEZWdyZWVzQ1d9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGFuZ2xlID0gZ2V0QW5nbGVEZWdyZWVzQ1cocG9pbnQpO1xuICAgICAgdmFsdWVbaV0gPSAtZGVncmVlVG9SYWRpYW4oYW5nbGUpO1xuICAgICAgaSArPSBzaXplO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihwb2ludCkgfHwgREVGQVVMVF9DT0xPUjtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsyXTtcbiAgICAgIHZhbHVlW2krK10gPSBpc05hTihjb2xvclszXSkgPyAyNTUgOiBjb2xvclszXTtcbiAgICB9XG4gIH1cbn1cblxuTWVzaExheWVyLmxheWVyTmFtZSA9ICdNZXNoTGF5ZXInO1xuTWVzaExheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==