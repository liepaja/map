'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _deck = require('deck.gl');

var _multiIconLayerVertex = require('./multi-icon-layer-vertex.glsl');

var _multiIconLayerVertex2 = _interopRequireDefault(_multiIconLayerVertex);

var _multiIconLayerVertex3 = require('./multi-icon-layer-vertex-64.glsl');

var _multiIconLayerVertex4 = _interopRequireDefault(_multiIconLayerVertex3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var enable64bitSupport = _deck.experimental.enable64bitSupport;


var defaultProps = {
  getIndexOfIcon: function getIndexOfIcon(x) {
    return x.index || 0;
  },
  getNumOfIcon: function getNumOfIcon(x) {
    return x.len || 1;
  },
  // 1: left, 0: middle, -1: right
  getAnchorX: function getAnchorX(x) {
    return x.anchorX || 0;
  },
  // 1: top, 0: center, -1: bottom
  getAnchorY: function getAnchorY(x) {
    return x.anchorY || 0;
  },
  getPixelOffset: function getPixelOffset(x) {
    return x.pixelOffset || [0, 0];
  }
};

var MultiIconLayer = function (_IconLayer) {
  _inherits(MultiIconLayer, _IconLayer);

  function MultiIconLayer() {
    _classCallCheck(this, MultiIconLayer);

    return _possibleConstructorReturn(this, (MultiIconLayer.__proto__ || Object.getPrototypeOf(MultiIconLayer)).apply(this, arguments));
  }

  _createClass(MultiIconLayer, [{
    key: 'getShaders',
    value: function getShaders() {
      var multiIconVs = enable64bitSupport(this.props) ? _multiIconLayerVertex4.default : _multiIconLayerVertex2.default;
      return Object.assign({}, _get(MultiIconLayer.prototype.__proto__ || Object.getPrototypeOf(MultiIconLayer.prototype), 'getShaders', this).call(this), {
        vs: multiIconVs
      });
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      _get(MultiIconLayer.prototype.__proto__ || Object.getPrototypeOf(MultiIconLayer.prototype), 'initializeState', this).call(this);

      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instanceIndexOfIcon: {
          size: 1,
          accessor: 'getIndexOfIcon',
          update: this.calculateInstanceIndexOfIcon
        },
        instanceNumOfIcon: {
          size: 1,
          accessor: 'getNumOfIcon',
          update: this.calculateInstanceNumOfIcon
        },
        instancePixelOffset: {
          size: 2,
          accessor: 'getPixelOffset',
          update: this.calculatePixelOffset
        }
      });
    }
  }, {
    key: 'calculateInstanceIndexOfIcon',
    value: function calculateInstanceIndexOfIcon(attribute) {
      var _props = this.props,
          data = _props.data,
          getIndexOfIcon = _props.getIndexOfIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          value[i++] = getIndexOfIcon(object);
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
    key: 'calculateInstanceNumOfIcon',
    value: function calculateInstanceNumOfIcon(attribute) {
      var _props2 = this.props,
          data = _props2.data,
          getNumOfIcon = _props2.getNumOfIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var object = _step2.value;

          value[i++] = getNumOfIcon(object);
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
    key: 'calculateInstanceOffsets',
    value: function calculateInstanceOffsets(attribute) {
      var _props3 = this.props,
          data = _props3.data,
          iconMapping = _props3.iconMapping,
          getIcon = _props3.getIcon,
          getAnchorX = _props3.getAnchorX,
          getAnchorY = _props3.getAnchorY,
          getNumOfIcon = _props3.getNumOfIcon;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var object = _step3.value;

          var icon = getIcon(object);
          var rect = iconMapping[icon] || {};
          value[i++] = rect.width / 2 * getAnchorX(object) * getNumOfIcon(object) || 0;
          value[i++] = rect.height / 2 * getAnchorY(object) || 0;
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
    key: 'calculatePixelOffset',
    value: function calculatePixelOffset(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getPixelOffset = _props4.getPixelOffset;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var object = _step4.value;

          var pixelOffset = getPixelOffset(object);
          value[i++] = pixelOffset[0] || 0;
          value[i++] = pixelOffset[1] || 0;
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

  return MultiIconLayer;
}(_deck.IconLayer);

exports.default = MultiIconLayer;


MultiIconLayer.layerName = 'MultiIconLayer';
MultiIconLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwtbGF5ZXJzL3NyYy90ZXh0LWxheWVyL211bHRpLWljb24tbGF5ZXIvbXVsdGktaWNvbi1sYXllci5qcyJdLCJuYW1lcyI6WyJlbmFibGU2NGJpdFN1cHBvcnQiLCJkZWZhdWx0UHJvcHMiLCJnZXRJbmRleE9mSWNvbiIsIngiLCJpbmRleCIsImdldE51bU9mSWNvbiIsImxlbiIsImdldEFuY2hvclgiLCJhbmNob3JYIiwiZ2V0QW5jaG9yWSIsImFuY2hvclkiLCJnZXRQaXhlbE9mZnNldCIsInBpeGVsT2Zmc2V0IiwiTXVsdGlJY29uTGF5ZXIiLCJtdWx0aUljb25WcyIsInByb3BzIiwiT2JqZWN0IiwiYXNzaWduIiwidnMiLCJhdHRyaWJ1dGVNYW5hZ2VyIiwiZ2V0QXR0cmlidXRlTWFuYWdlciIsImFkZEluc3RhbmNlZCIsImluc3RhbmNlSW5kZXhPZkljb24iLCJzaXplIiwiYWNjZXNzb3IiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZUluZGV4T2ZJY29uIiwiaW5zdGFuY2VOdW1PZkljb24iLCJjYWxjdWxhdGVJbnN0YW5jZU51bU9mSWNvbiIsImluc3RhbmNlUGl4ZWxPZmZzZXQiLCJjYWxjdWxhdGVQaXhlbE9mZnNldCIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsImkiLCJvYmplY3QiLCJpY29uTWFwcGluZyIsImdldEljb24iLCJpY29uIiwicmVjdCIsIndpZHRoIiwiaGVpZ2h0IiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBb0JBOztBQUdBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUdPQSxrQixzQkFBQUEsa0I7OztBQUtQLElBQU1DLGVBQWU7QUFDbkJDLGtCQUFnQjtBQUFBLFdBQUtD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QUNBN0IsZUFBZVosWUFBZixHQUE4QkEsWUFBOUIiLCJmaWxlIjoibXVsdGktaWNvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0ljb25MYXllciwgZXhwZXJpbWVudGFsfSBmcm9tICdkZWNrLmdsJztcbmNvbnN0IHtlbmFibGU2NGJpdFN1cHBvcnR9ID0gZXhwZXJpbWVudGFsO1xuXG5pbXBvcnQgdnMgZnJvbSAnLi9tdWx0aS1pY29uLWxheWVyLXZlcnRleC5nbHNsJztcbmltcG9ydCB2czY0IGZyb20gJy4vbXVsdGktaWNvbi1sYXllci12ZXJ0ZXgtNjQuZ2xzbCc7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgZ2V0SW5kZXhPZkljb246IHggPT4geC5pbmRleCB8fCAwLFxuICBnZXROdW1PZkljb246IHggPT4geC5sZW4gfHwgMSxcbiAgLy8gMTogbGVmdCwgMDogbWlkZGxlLCAtMTogcmlnaHRcbiAgZ2V0QW5jaG9yWDogeCA9PiB4LmFuY2hvclggfHwgMCxcbiAgLy8gMTogdG9wLCAwOiBjZW50ZXIsIC0xOiBib3R0b21cbiAgZ2V0QW5jaG9yWTogeCA9PiB4LmFuY2hvclkgfHwgMCxcbiAgZ2V0UGl4ZWxPZmZzZXQ6IHggPT4geC5waXhlbE9mZnNldCB8fCBbMCwgMF1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE11bHRpSWNvbkxheWVyIGV4dGVuZHMgSWNvbkxheWVyIHtcbiAgZ2V0U2hhZGVycygpIHtcbiAgICBjb25zdCBtdWx0aUljb25WcyA9IGVuYWJsZTY0Yml0U3VwcG9ydCh0aGlzLnByb3BzKSA/IHZzNjQgOiB2cztcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgc3VwZXIuZ2V0U2hhZGVycygpLCB7XG4gICAgICB2czogbXVsdGlJY29uVnNcbiAgICB9KTtcbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICBzdXBlci5pbml0aWFsaXplU3RhdGUoKTtcblxuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmFnZXIgPSB0aGlzLmdldEF0dHJpYnV0ZU1hbmFnZXIoKTtcbiAgICBhdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZUluZGV4T2ZJY29uOiB7XG4gICAgICAgIHNpemU6IDEsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0SW5kZXhPZkljb24nLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VJbmRleE9mSWNvblxuICAgICAgfSxcbiAgICAgIGluc3RhbmNlTnVtT2ZJY29uOiB7XG4gICAgICAgIHNpemU6IDEsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0TnVtT2ZJY29uJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlTnVtT2ZJY29uXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VQaXhlbE9mZnNldDoge1xuICAgICAgICBzaXplOiAyLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldFBpeGVsT2Zmc2V0JyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZVBpeGVsT2Zmc2V0XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZUluZGV4T2ZJY29uKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRJbmRleE9mSWNvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIGRhdGEpIHtcbiAgICAgIHZhbHVlW2krK10gPSBnZXRJbmRleE9mSWNvbihvYmplY3QpO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlTnVtT2ZJY29uKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXROdW1PZkljb259ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7dmFsdWV9ID0gYXR0cmlidXRlO1xuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICB2YWx1ZVtpKytdID0gZ2V0TnVtT2ZJY29uKG9iamVjdCk7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VPZmZzZXRzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBpY29uTWFwcGluZywgZ2V0SWNvbiwgZ2V0QW5jaG9yWCwgZ2V0QW5jaG9yWSwgZ2V0TnVtT2ZJY29ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgaWNvbiA9IGdldEljb24ob2JqZWN0KTtcbiAgICAgIGNvbnN0IHJlY3QgPSBpY29uTWFwcGluZ1tpY29uXSB8fCB7fTtcbiAgICAgIHZhbHVlW2krK10gPSByZWN0LndpZHRoIC8gMiAqIGdldEFuY2hvclgob2JqZWN0KSAqIGdldE51bU9mSWNvbihvYmplY3QpIHx8IDA7XG4gICAgICB2YWx1ZVtpKytdID0gcmVjdC5oZWlnaHQgLyAyICogZ2V0QW5jaG9yWShvYmplY3QpIHx8IDA7XG4gICAgfVxuICB9XG5cbiAgY2FsY3VsYXRlUGl4ZWxPZmZzZXQoYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBpeGVsT2Zmc2V0fSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcGl4ZWxPZmZzZXQgPSBnZXRQaXhlbE9mZnNldChvYmplY3QpO1xuICAgICAgdmFsdWVbaSsrXSA9IHBpeGVsT2Zmc2V0WzBdIHx8IDA7XG4gICAgICB2YWx1ZVtpKytdID0gcGl4ZWxPZmZzZXRbMV0gfHwgMDtcbiAgICB9XG4gIH1cbn1cblxuTXVsdGlJY29uTGF5ZXIubGF5ZXJOYW1lID0gJ011bHRpSWNvbkxheWVyJztcbk11bHRpSWNvbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==