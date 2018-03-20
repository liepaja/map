'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _iconLayerVertex = require('./icon-layer-vertex.glsl');

var _iconLayerVertex2 = _interopRequireDefault(_iconLayerVertex);

var _iconLayerVertex3 = require('./icon-layer-vertex-64.glsl');

var _iconLayerVertex4 = _interopRequireDefault(_iconLayerVertex3);

var _iconLayerFragment = require('./icon-layer-fragment.glsl');

var _iconLayerFragment2 = _interopRequireDefault(_iconLayerFragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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


var fp64LowPart = _core.experimental.fp64LowPart,
    enable64bitSupport = _core.experimental.enable64bitSupport;


var DEFAULT_COLOR = [0, 0, 0, 255];
var DEFAULT_TEXTURE_MIN_FILTER = _luma.GL.LINEAR_MIPMAP_LINEAR;
// GL.LINEAR is the default value but explicitly set it here
var DEFAULT_TEXTURE_MAG_FILTER = _luma.GL.LINEAR;

/*
 * @param {object} props
 * @param {Texture2D | string} props.iconAtlas - atlas image url or texture
 * @param {object} props.iconMapping - icon names mapped to icon definitions
 * @param {object} props.iconMapping[icon_name].x - x position of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].y - y position of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].width - width of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].height - height of icon on the atlas image
 * @param {object} props.iconMapping[icon_name].anchorX - x anchor of icon on the atlas image,
 *   default to width / 2
 * @param {object} props.iconMapping[icon_name].anchorY - y anchor of icon on the atlas image,
 *   default to height / 2
 * @param {object} props.iconMapping[icon_name].mask - whether icon is treated as a transparency
 *   mask. If true, user defined color is applied. If false, original color from the image is
 *   applied. Default to false.
 * @param {number} props.size - icon size in pixels
 * @param {func} props.getPosition - returns anchor position of the icon, in [lng, lat, z]
 * @param {func} props.getIcon - returns icon name as a string
 * @param {func} props.getSize - returns icon size multiplier as a number
 * @param {func} props.getColor - returns color of the icon in [r, g, b, a]. Only works on icons
 *   with mask: true.
 * @param {func} props.getAngle - returns rotating angle (in degree) of the icon.
 */
var defaultProps = {
  iconAtlas: null,
  iconMapping: {},
  sizeScale: 1,
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getIcon: function getIcon(x) {
    return x.icon;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  getSize: function getSize(x) {
    return x.size || 1;
  },
  getAngle: function getAngle(x) {
    return x.angle || 0;
  }
};

var IconLayer = function (_Layer) {
  _inherits(IconLayer, _Layer);

  function IconLayer() {
    _classCallCheck(this, IconLayer);

    return _possibleConstructorReturn(this, (IconLayer.__proto__ || Object.getPrototypeOf(IconLayer)).apply(this, arguments));
  }

  _createClass(IconLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      return enable64bitSupport(this.props) ? { vs: _iconLayerVertex4.default, fs: _iconLayerFragment2.default, modules: ['project64', 'picking'] } : { vs: _iconLayerVertex2.default, fs: _iconLayerFragment2.default, modules: ['picking'] }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();

      /* eslint-disable max-len */
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          transition: true,
          accessor: 'getPosition',
          update: this.calculateInstancePositions
        },
        instanceSizes: {
          size: 1,
          transition: true,
          accessor: 'getSize',
          update: this.calculateInstanceSizes
        },
        instanceOffsets: { size: 2, accessor: 'getIcon', update: this.calculateInstanceOffsets },
        instanceIconFrames: { size: 4, accessor: 'getIcon', update: this.calculateInstanceIconFrames },
        instanceColorModes: {
          size: 1,
          type: _luma.GL.UNSIGNED_BYTE,
          accessor: 'getIcon',
          update: this.calculateInstanceColorMode
        },
        instanceColors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          transition: true,
          accessor: 'getColor',
          update: this.calculateInstanceColors
        },
        instanceAngles: {
          size: 1,
          transition: true,
          accessor: 'getAngle',
          update: this.calculateInstanceAngles
        }
      });
      /* eslint-enable max-len */
    }
  }, {
    key: 'updateAttribute',
    value: function updateAttribute(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (props.fp64 !== oldProps.fp64) {
        var attributeManager = this.getAttributeManager();
        attributeManager.invalidateAll();

        if (props.fp64 && props.coordinateSystem === _core.COORDINATE_SYSTEM.LNGLAT) {
          attributeManager.addInstanced({
            instancePositions64xyLow: {
              size: 2,
              accessor: 'getPosition',
              update: this.calculateInstancePositions64xyLow
            }
          });
        } else {
          attributeManager.remove(['instancePositions64xyLow']);
        }
      }
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref2) {
      var _this2 = this;

      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          changeFlags = _ref2.changeFlags;

      _get(IconLayer.prototype.__proto__ || Object.getPrototypeOf(IconLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });

      var iconAtlas = props.iconAtlas,
          iconMapping = props.iconMapping;


      if (oldProps.iconMapping !== iconMapping) {
        var attributeManager = this.getAttributeManager();
        attributeManager.invalidate('instanceOffsets');
        attributeManager.invalidate('instanceIconFrames');
        attributeManager.invalidate('instanceColorModes');
      }

      if (oldProps.iconAtlas !== iconAtlas) {
        if (iconAtlas instanceof _luma.Texture2D) {
          var _iconAtlas$setParamet;

          iconAtlas.setParameters((_iconAtlas$setParamet = {}, _defineProperty(_iconAtlas$setParamet, _luma.GL.TEXTURE_MIN_FILTER, DEFAULT_TEXTURE_MIN_FILTER), _defineProperty(_iconAtlas$setParamet, _luma.GL.TEXTURE_MAG_FILTER, DEFAULT_TEXTURE_MAG_FILTER), _iconAtlas$setParamet));
          this.setState({ iconsTexture: iconAtlas });
        } else if (typeof iconAtlas === 'string') {
          (0, _luma.loadTextures)(this.context.gl, {
            urls: [iconAtlas]
          }).then(function (_ref3) {
            var _texture$setParameter;

            var _ref4 = _slicedToArray(_ref3, 1),
                texture = _ref4[0];

            texture.setParameters((_texture$setParameter = {}, _defineProperty(_texture$setParameter, _luma.GL.TEXTURE_MIN_FILTER, DEFAULT_TEXTURE_MIN_FILTER), _defineProperty(_texture$setParameter, _luma.GL.TEXTURE_MAG_FILTER, DEFAULT_TEXTURE_MAG_FILTER), _texture$setParameter));
            _this2.setState({ iconsTexture: texture });
          });
        }
      }

      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'draw',
    value: function draw(_ref5) {
      var uniforms = _ref5.uniforms;
      var sizeScale = this.props.sizeScale;
      var iconsTexture = this.state.iconsTexture;


      if (iconsTexture) {
        this.state.model.render(Object.assign({}, uniforms, {
          iconsTexture: iconsTexture,
          iconsTextureDim: [iconsTexture.width, iconsTexture.height],
          sizeScale: sizeScale
        }));
      }
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      var positions = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1, 0];

      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLE_FAN,
          attributes: {
            positions: new Float32Array(positions)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: 'calculateInstancePositions',
    value: function calculateInstancePositions(attribute) {
      var _props = this.props,
          data = _props.data,
          getPosition = _props.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var position = getPosition(object);
          value[i++] = position[0];
          value[i++] = position[1];
          value[i++] = position[2] || 0;
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
    key: 'calculateInstanceSizes',
    value: function calculateInstanceSizes(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          getSize = _props3.getSize;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          value[i++] = getSize(object);
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
    key: 'calculateInstanceAngles',
    value: function calculateInstanceAngles(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getAngle = _props4.getAngle;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          value[i++] = getAngle(object);
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
  }, {
    key: 'calculateInstanceColors',
    value: function calculateInstanceColors(attribute) {
      var _props5 = this.props,
          data = _props5.data,
          getColor = _props5.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = data[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var object = _step5.value;

          var color = getColor(object);

          value[i++] = color[0];
          value[i++] = color[1];
          value[i++] = color[2];
          value[i++] = isNaN(color[3]) ? 255 : color[3];
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
    }
  }, {
    key: 'calculateInstanceOffsets',
    value: function calculateInstanceOffsets(attribute) {
      var _props6 = this.props,
          data = _props6.data,
          iconMapping = _props6.iconMapping,
          getIcon = _props6.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = data[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var object = _step6.value;

          var icon = getIcon(object);
          var rect = iconMapping[icon] || {};
          value[i++] = rect.width / 2 - rect.anchorX || 0;
          value[i++] = rect.height / 2 - rect.anchorY || 0;
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
    }
  }, {
    key: 'calculateInstanceColorMode',
    value: function calculateInstanceColorMode(attribute) {
      var _props7 = this.props,
          data = _props7.data,
          iconMapping = _props7.iconMapping,
          getIcon = _props7.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = data[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var object = _step7.value;

          var icon = getIcon(object);
          var colorMode = iconMapping[icon] && iconMapping[icon].mask;
          value[i++] = colorMode ? 1 : 0;
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
  }, {
    key: 'calculateInstanceIconFrames',
    value: function calculateInstanceIconFrames(attribute) {
      var _props8 = this.props,
          data = _props8.data,
          iconMapping = _props8.iconMapping,
          getIcon = _props8.getIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = data[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var object = _step8.value;

          var icon = getIcon(object);
          var rect = iconMapping[icon] || {};
          value[i++] = rect.x || 0;
          value[i++] = rect.y || 0;
          value[i++] = rect.width || 0;
          value[i++] = rect.height || 0;
        }
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
    }
  }]);

  return IconLayer;
}(_core.Layer);

exports.default = IconLayer;


IconLayer.layerName = 'IconLayer';
IconLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9pY29uLWxheWVyL2ljb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiZnA2NExvd1BhcnQiLCJlbmFibGU2NGJpdFN1cHBvcnQiLCJERUZBVUxUX0NPTE9SIiwiREVGQVVMVF9URVhUVVJFX01JTl9GSUxURVIiLCJMSU5FQVJfTUlQTUFQX0xJTkVBUiIsIkRFRkFVTFRfVEVYVFVSRV9NQUdfRklMVEVSIiwiTElORUFSIiwiZGVmYXVsdFByb3BzIiwiaWNvbkF0bGFzIiwiaWNvbk1hcHBpbmciLCJzaXplU2NhbGUiLCJmcDY0IiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJnZXRJY29uIiwiaWNvbiIsImdldENvbG9yIiwiY29sb3IiLCJnZXRTaXplIiwic2l6ZSIsImdldEFuZ2xlIiwiYW5nbGUiLCJJY29uTGF5ZXIiLCJwcm9wcyIsInZzIiwiZnMiLCJtb2R1bGVzIiwiYXR0cmlidXRlTWFuYWdlciIsImdldEF0dHJpYnV0ZU1hbmFnZXIiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsInRyYW5zaXRpb24iLCJhY2Nlc3NvciIsInVwZGF0ZSIsImNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zIiwiaW5zdGFuY2VTaXplcyIsImNhbGN1bGF0ZUluc3RhbmNlU2l6ZXMiLCJpbnN0YW5jZU9mZnNldHMiLCJjYWxjdWxhdGVJbnN0YW5jZU9mZnNldHMiLCJpbnN0YW5jZUljb25GcmFtZXMiLCJjYWxjdWxhdGVJbnN0YW5jZUljb25GcmFtZXMiLCJpbnN0YW5jZUNvbG9yTW9kZXMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlQ29sb3JNb2RlIiwiaW5zdGFuY2VDb2xvcnMiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyIsImluc3RhbmNlQW5nbGVzIiwiY2FsY3VsYXRlSW5zdGFuY2VBbmdsZXMiLCJvbGRQcm9wcyIsImNoYW5nZUZsYWdzIiwiaW52YWxpZGF0ZUFsbCIsImNvb3JkaW5hdGVTeXN0ZW0iLCJMTkdMQVQiLCJpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJpbnZhbGlkYXRlIiwic2V0UGFyYW1ldGVycyIsIlRFWFRVUkVfTUlOX0ZJTFRFUiIsIlRFWFRVUkVfTUFHX0ZJTFRFUiIsInNldFN0YXRlIiwiaWNvbnNUZXh0dXJlIiwiY29udGV4dCIsImdsIiwidXJscyIsInRoZW4iLCJ0ZXh0dXJlIiwibW9kZWwiLCJfZ2V0TW9kZWwiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsInN0YXRlIiwicmVuZGVyIiwiT2JqZWN0IiwiYXNzaWduIiwiaWNvbnNUZXh0dXJlRGltIiwid2lkdGgiLCJoZWlnaHQiLCJwb3NpdGlvbnMiLCJnZXRTaGFkZXJzIiwiaWQiLCJnZW9tZXRyeSIsImRyYXdNb2RlIiwiVFJJQU5HTEVfRkFOIiwiYXR0cmlidXRlcyIsIkZsb2F0MzJBcnJheSIsImlzSW5zdGFuY2VkIiwic2hhZGVyQ2FjaGUiLCJhdHRyaWJ1dGUiLCJkYXRhIiwidmFsdWUiLCJpIiwib2JqZWN0IiwicG9pbnQiLCJpc05hTiIsInJlY3QiLCJhbmNob3JYIiwiYW5jaG9yWSIsImNvbG9yTW9kZSIsIm1hc2siLCJ5IiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFtQkE7O0FBRUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7K2VBekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7SUFFT0EsVyxzQkFBQUEsVztJQUFhQyxrQixzQkFBQUEsa0I7OztBQU9wQixJQUFNQyxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQXRCO0FBQ0EsSUFBTUMsNkJBQTZCLFNBQUdDLG9CQUF0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O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBU3JDOzs7Z0RBRTJCVixTLEVBQVc7QUFBQSxvQkFDQSxLQUFLbEUsS0FETDtBQUFBLFVBQzlCbUUsSUFEOEIsV0FDOUJBLElBRDhCO0FBQUEsVUFDeEJsRixXQUR3QixXQUN4QkEsV0FEd0I7QUFBQSxVQUNYTSxPQURXLFdBQ1hBLE9BRFc7QUFBQSxVQUU5QjZFLEtBRjhCLEdBRXJCRixTQUZxQixDQUU5QkUsS0FGOEI7O0FBR3JDLFVBQUlDLElBQUksQ0FBUjtBQUhxQztBQUFBO0FBQUE7O0FBQUE7QUFJckMsOEJBQXFCRixJQUFyQixtSUFBMkI7QUFBQSxjQUFoQkcsTUFBZ0I7O0FBQ3pCLGNBQU05RSxPQUFPRCxRQUFRK0UsTUFBUixDQUFiO0FBQ0EsY0FBTUcsT0FBT3hGLFlBQVlPLElBQVosS0FBcUIsRUFBbEM7QUFDQTRFLGdCQUFNQyxHQUFOLElBQWFJLEtBQUtwRixDQUFMLElBQVUsQ0FBdkI7QUFDQStFLGdCQUFNQyxHQUFOLElBQWFJLEtBQUtLLENBQUwsSUFBVSxDQUF2QjtBQUNBVixnQkFBTUMsR0FBTixJQUFhSSxLQUFLbkIsS0FBTCxJQUFjLENBQTNCO0FBQ0FjLGdCQUFNQyxHQUFOLElBQWFJLEtBQUtsQixNQUFMLElBQWUsQ0FBNUI7QUFDRDtBQVhvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWXRDOzs7Ozs7a0JBdk9rQnhELFM7OztBQTBPckJBLFVBQVVnRixTQUFWLEdBQXNCLFdBQXRCO0FBQ0FoRixVQUFVaEIsWUFBVixHQUF5QkEsWUFBekIiLCJmaWxlIjoiaWNvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuaW1wb3J0IHtDT09SRElOQVRFX1NZU1RFTSwgTGF5ZXIsIGV4cGVyaW1lbnRhbH0gZnJvbSAnLi4vLi4vY29yZSc7XG5jb25zdCB7ZnA2NExvd1BhcnQsIGVuYWJsZTY0Yml0U3VwcG9ydH0gPSBleHBlcmltZW50YWw7XG5pbXBvcnQge0dMLCBNb2RlbCwgR2VvbWV0cnksIFRleHR1cmUyRCwgbG9hZFRleHR1cmVzfSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vaWNvbi1sYXllci12ZXJ0ZXguZ2xzbCc7XG5pbXBvcnQgdnM2NCBmcm9tICcuL2ljb24tbGF5ZXItdmVydGV4LTY0Lmdsc2wnO1xuaW1wb3J0IGZzIGZyb20gJy4vaWNvbi1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuY29uc3QgREVGQVVMVF9URVhUVVJFX01JTl9GSUxURVIgPSBHTC5MSU5FQVJfTUlQTUFQX0xJTkVBUjtcbi8vIEdMLkxJTkVBUiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSBidXQgZXhwbGljaXRseSBzZXQgaXQgaGVyZVxuY29uc3QgREVGQVVMVF9URVhUVVJFX01BR19GSUxURVIgPSBHTC5MSU5FQVI7XG5cbi8qXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHNcbiAqIEBwYXJhbSB7VGV4dHVyZTJEIHwgc3RyaW5nfSBwcm9wcy5pY29uQXRsYXMgLSBhdGxhcyBpbWFnZSB1cmwgb3IgdGV4dHVyZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nIC0gaWNvbiBuYW1lcyBtYXBwZWQgdG8gaWNvbiBkZWZpbml0aW9uc1xuICogQHBhcmFtIHtvYmplY3R9IHByb3BzLmljb25NYXBwaW5nW2ljb25fbmFtZV0ueCAtIHggcG9zaXRpb24gb2YgaWNvbiBvbiB0aGUgYXRsYXMgaW1hZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLnkgLSB5IHBvc2l0aW9uIG9mIGljb24gb24gdGhlIGF0bGFzIGltYWdlXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmdbaWNvbl9uYW1lXS53aWR0aCAtIHdpZHRoIG9mIGljb24gb24gdGhlIGF0bGFzIGltYWdlXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmdbaWNvbl9uYW1lXS5oZWlnaHQgLSBoZWlnaHQgb2YgaWNvbiBvbiB0aGUgYXRsYXMgaW1hZ2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLmFuY2hvclggLSB4IGFuY2hvciBvZiBpY29uIG9uIHRoZSBhdGxhcyBpbWFnZSxcbiAqICAgZGVmYXVsdCB0byB3aWR0aCAvIDJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcy5pY29uTWFwcGluZ1tpY29uX25hbWVdLmFuY2hvclkgLSB5IGFuY2hvciBvZiBpY29uIG9uIHRoZSBhdGxhcyBpbWFnZSxcbiAqICAgZGVmYXVsdCB0byBoZWlnaHQgLyAyXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMuaWNvbk1hcHBpbmdbaWNvbl9uYW1lXS5tYXNrIC0gd2hldGhlciBpY29uIGlzIHRyZWF0ZWQgYXMgYSB0cmFuc3BhcmVuY3lcbiAqICAgbWFzay4gSWYgdHJ1ZSwgdXNlciBkZWZpbmVkIGNvbG9yIGlzIGFwcGxpZWQuIElmIGZhbHNlLCBvcmlnaW5hbCBjb2xvciBmcm9tIHRoZSBpbWFnZSBpc1xuICogICBhcHBsaWVkLiBEZWZhdWx0IHRvIGZhbHNlLlxuICogQHBhcmFtIHtudW1iZXJ9IHByb3BzLnNpemUgLSBpY29uIHNpemUgaW4gcGl4ZWxzXG4gKiBAcGFyYW0ge2Z1bmN9IHByb3BzLmdldFBvc2l0aW9uIC0gcmV0dXJucyBhbmNob3IgcG9zaXRpb24gb2YgdGhlIGljb24sIGluIFtsbmcsIGxhdCwgel1cbiAqIEBwYXJhbSB7ZnVuY30gcHJvcHMuZ2V0SWNvbiAtIHJldHVybnMgaWNvbiBuYW1lIGFzIGEgc3RyaW5nXG4gKiBAcGFyYW0ge2Z1bmN9IHByb3BzLmdldFNpemUgLSByZXR1cm5zIGljb24gc2l6ZSBtdWx0aXBsaWVyIGFzIGEgbnVtYmVyXG4gKiBAcGFyYW0ge2Z1bmN9IHByb3BzLmdldENvbG9yIC0gcmV0dXJucyBjb2xvciBvZiB0aGUgaWNvbiBpbiBbciwgZywgYiwgYV0uIE9ubHkgd29ya3Mgb24gaWNvbnNcbiAqICAgd2l0aCBtYXNrOiB0cnVlLlxuICogQHBhcmFtIHtmdW5jfSBwcm9wcy5nZXRBbmdsZSAtIHJldHVybnMgcm90YXRpbmcgYW5nbGUgKGluIGRlZ3JlZSkgb2YgdGhlIGljb24uXG4gKi9cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgaWNvbkF0bGFzOiBudWxsLFxuICBpY29uTWFwcGluZzoge30sXG4gIHNpemVTY2FsZTogMSxcbiAgZnA2NDogZmFsc2UsXG5cbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZ2V0SWNvbjogeCA9PiB4Lmljb24sXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUixcbiAgZ2V0U2l6ZTogeCA9PiB4LnNpemUgfHwgMSxcbiAgZ2V0QW5nbGU6IHggPT4geC5hbmdsZSB8fCAwXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJY29uTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gIGdldFNoYWRlcnMoKSB7XG4gICAgcmV0dXJuIGVuYWJsZTY0Yml0U3VwcG9ydCh0aGlzLnByb3BzKVxuICAgICAgPyB7dnM6IHZzNjQsIGZzLCBtb2R1bGVzOiBbJ3Byb2plY3Q2NCcsICdwaWNraW5nJ119XG4gICAgICA6IHt2cywgZnMsIG1vZHVsZXM6IFsncGlja2luZyddfTsgLy8gJ3Byb2plY3QnIG1vZHVsZSBhZGRlZCBieSBkZWZhdWx0LlxuICB9XG5cbiAgaW5pdGlhbGl6ZVN0YXRlKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcblxuICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge1xuICAgICAgICBzaXplOiAzLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VTaXplczoge1xuICAgICAgICBzaXplOiAxLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldFNpemUnLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VTaXplc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlT2Zmc2V0czoge3NpemU6IDIsIGFjY2Vzc29yOiAnZ2V0SWNvbicsIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZU9mZnNldHN9LFxuICAgICAgaW5zdGFuY2VJY29uRnJhbWVzOiB7c2l6ZTogNCwgYWNjZXNzb3I6ICdnZXRJY29uJywgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlSWNvbkZyYW1lc30sXG4gICAgICBpbnN0YW5jZUNvbG9yTW9kZXM6IHtcbiAgICAgICAgc2l6ZTogMSxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRJY29uJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlQ29sb3JNb2RlXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc1xuICAgICAgfSxcbiAgICAgIGluc3RhbmNlQW5nbGVzOiB7XG4gICAgICAgIHNpemU6IDEsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0QW5nbGUnLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VBbmdsZXNcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgfVxuXG4gIHVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3QgYXR0cmlidXRlTWFuYWdlciA9IHRoaXMuZ2V0QXR0cmlidXRlTWFuYWdlcigpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlQWxsKCk7XG5cbiAgICAgIGlmIChwcm9wcy5mcDY0ICYmIHByb3BzLmNvb3JkaW5hdGVTeXN0ZW0gPT09IENPT1JESU5BVEVfU1lTVEVNLkxOR0xBVCkge1xuICAgICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICAgICAgaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93OiB7XG4gICAgICAgICAgICBzaXplOiAyLFxuICAgICAgICAgICAgYWNjZXNzb3I6ICdnZXRQb3NpdGlvbicsXG4gICAgICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIucmVtb3ZlKFsnaW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93J10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIHN1cGVyLnVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSk7XG5cbiAgICBjb25zdCB7aWNvbkF0bGFzLCBpY29uTWFwcGluZ30gPSBwcm9wcztcblxuICAgIGlmIChvbGRQcm9wcy5pY29uTWFwcGluZyAhPT0gaWNvbk1hcHBpbmcpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuaW52YWxpZGF0ZSgnaW5zdGFuY2VPZmZzZXRzJyk7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGUoJ2luc3RhbmNlSWNvbkZyYW1lcycpO1xuICAgICAgYXR0cmlidXRlTWFuYWdlci5pbnZhbGlkYXRlKCdpbnN0YW5jZUNvbG9yTW9kZXMnKTtcbiAgICB9XG5cbiAgICBpZiAob2xkUHJvcHMuaWNvbkF0bGFzICE9PSBpY29uQXRsYXMpIHtcbiAgICAgIGlmIChpY29uQXRsYXMgaW5zdGFuY2VvZiBUZXh0dXJlMkQpIHtcbiAgICAgICAgaWNvbkF0bGFzLnNldFBhcmFtZXRlcnMoe1xuICAgICAgICAgIFtHTC5URVhUVVJFX01JTl9GSUxURVJdOiBERUZBVUxUX1RFWFRVUkVfTUlOX0ZJTFRFUixcbiAgICAgICAgICBbR0wuVEVYVFVSRV9NQUdfRklMVEVSXTogREVGQVVMVF9URVhUVVJFX01BR19GSUxURVJcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2ljb25zVGV4dHVyZTogaWNvbkF0bGFzfSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpY29uQXRsYXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGxvYWRUZXh0dXJlcyh0aGlzLmNvbnRleHQuZ2wsIHtcbiAgICAgICAgICB1cmxzOiBbaWNvbkF0bGFzXVxuICAgICAgICB9KS50aGVuKChbdGV4dHVyZV0pID0+IHtcbiAgICAgICAgICB0ZXh0dXJlLnNldFBhcmFtZXRlcnMoe1xuICAgICAgICAgICAgW0dMLlRFWFRVUkVfTUlOX0ZJTFRFUl06IERFRkFVTFRfVEVYVFVSRV9NSU5fRklMVEVSLFxuICAgICAgICAgICAgW0dMLlRFWFRVUkVfTUFHX0ZJTFRFUl06IERFRkFVTFRfVEVYVFVSRV9NQUdfRklMVEVSXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aWNvbnNUZXh0dXJlOiB0ZXh0dXJlfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCB7Z2x9ID0gdGhpcy5jb250ZXh0O1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kZWw6IHRoaXMuX2dldE1vZGVsKGdsKX0pO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUF0dHJpYnV0ZSh7cHJvcHMsIG9sZFByb3BzLCBjaGFuZ2VGbGFnc30pO1xuICB9XG5cbiAgZHJhdyh7dW5pZm9ybXN9KSB7XG4gICAgY29uc3Qge3NpemVTY2FsZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtpY29uc1RleHR1cmV9ID0gdGhpcy5zdGF0ZTtcblxuICAgIGlmIChpY29uc1RleHR1cmUpIHtcbiAgICAgIHRoaXMuc3RhdGUubW9kZWwucmVuZGVyKFxuICAgICAgICBPYmplY3QuYXNzaWduKHt9LCB1bmlmb3Jtcywge1xuICAgICAgICAgIGljb25zVGV4dHVyZSxcbiAgICAgICAgICBpY29uc1RleHR1cmVEaW06IFtpY29uc1RleHR1cmUud2lkdGgsIGljb25zVGV4dHVyZS5oZWlnaHRdLFxuICAgICAgICAgIHNpemVTY2FsZVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0TW9kZWwoZ2wpIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBbLTEsIC0xLCAwLCAtMSwgMSwgMCwgMSwgMSwgMCwgMSwgLTEsIDBdO1xuXG4gICAgcmV0dXJuIG5ldyBNb2RlbChcbiAgICAgIGdsLFxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTaGFkZXJzKCksIHtcbiAgICAgICAgaWQ6IHRoaXMucHJvcHMuaWQsXG4gICAgICAgIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe1xuICAgICAgICAgIGRyYXdNb2RlOiBHTC5UUklBTkdMRV9GQU4sXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucylcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBpc0luc3RhbmNlZDogdHJ1ZSxcbiAgICAgICAgc2hhZGVyQ2FjaGU6IHRoaXMuY29udGV4dC5zaGFkZXJDYWNoZVxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihvYmplY3QpO1xuICAgICAgdmFsdWVbaSsrXSA9IHBvc2l0aW9uWzBdO1xuICAgICAgdmFsdWVbaSsrXSA9IHBvc2l0aW9uWzFdO1xuICAgICAgdmFsdWVbaSsrXSA9IHBvc2l0aW9uWzJdIHx8IDA7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQb3NpdGlvbnM2NHh5TG93KGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gZnA2NExvd1BhcnQocG9zaXRpb25bMF0pO1xuICAgICAgdmFsdWVbaSsrXSA9IGZwNjRMb3dQYXJ0KHBvc2l0aW9uWzFdKTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVNpemVzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRTaXplfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgdmFsdWVbaSsrXSA9IGdldFNpemUob2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUFuZ2xlcyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0QW5nbGV9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICB2YWx1ZVtpKytdID0gZ2V0QW5nbGUob2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Q29sb3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKG9iamVjdCk7XG5cbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclswXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsxXTtcbiAgICAgIHZhbHVlW2krK10gPSBjb2xvclsyXTtcbiAgICAgIHZhbHVlW2krK10gPSBpc05hTihjb2xvclszXSkgPyAyNTUgOiBjb2xvclszXTtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZU9mZnNldHMoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGljb25NYXBwaW5nLCBnZXRJY29ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgaWNvbiA9IGdldEljb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IHJlY3QgPSBpY29uTWFwcGluZ1tpY29uXSB8fCB7fTtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LndpZHRoIC8gMiAtIHJlY3QuYW5jaG9yWCB8fCAwO1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3QuaGVpZ2h0IC8gMiAtIHJlY3QuYW5jaG9yWSB8fCAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JNb2RlKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBpY29uTWFwcGluZywgZ2V0SWNvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIGNvbnN0IGljb24gPSBnZXRJY29uKG9iamVjdCk7XG4gICAgICBjb25zdCBjb2xvck1vZGUgPSBpY29uTWFwcGluZ1tpY29uXSAmJiBpY29uTWFwcGluZ1tpY29uXS5tYXNrO1xuICAgICAgdmFsdWVbaSsrXSA9IGNvbG9yTW9kZSA/IDEgOiAwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlSWNvbkZyYW1lcyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgaWNvbk1hcHBpbmcsIGdldEljb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBpY29uID0gZ2V0SWNvbihvYmplY3QpO1xuICAgICAgY29uc3QgcmVjdCA9IGljb25NYXBwaW5nW2ljb25dIHx8IHt9O1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3QueCB8fCAwO1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3QueSB8fCAwO1xuICAgICAgdmFsdWVbaSsrXSA9IHJlY3Qud2lkdGggfHwgMDtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LmhlaWdodCB8fCAwO1xuICAgIH1cbiAgfVxufVxuXG5JY29uTGF5ZXIubGF5ZXJOYW1lID0gJ0ljb25MYXllcic7XG5JY29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19