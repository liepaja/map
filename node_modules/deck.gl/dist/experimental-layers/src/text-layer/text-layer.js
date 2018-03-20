'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _deck = require('deck.gl');

var _multiIconLayer = require('./multi-icon-layer/multi-icon-layer');

var _multiIconLayer2 = _interopRequireDefault(_multiIconLayer);

var _fontAtlas = require('./font-atlas');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

var DEFAULT_COLOR = [0, 0, 0, 255];
var TEXT_ANCHOR = {
  start: 1,
  middle: 0,
  end: -1
};
var ALIGNMENT_BASELINE = {
  top: 1,
  center: 0,
  bottom: -1
};
// currently the font family is invisible to the user
var FONT_FAMILY = '"Lucida Console", Monaco, monospace';

var defaultProps = {
  getText: function getText(x) {
    return x.text;
  },
  getPosition: function getPosition(x) {
    return x.coordinates;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },
  getSize: function getSize(x) {
    return x.size || 32;
  },
  getAngle: function getAngle(x) {
    return x.angle || 0;
  },
  getTextAnchor: function getTextAnchor(x) {
    return x.textAnchor || 'middle';
  },
  getAlignmentBaseline: function getAlignmentBaseline(x) {
    return x.alignmentBaseline || 'center';
  },
  getPixelOffset: function getPixelOffset(x) {
    return x.pixelOffset || [0, 0];
  },
  fp64: false
};

var TextLayer = function (_CompositeLayer) {
  _inherits(TextLayer, _CompositeLayer);

  function TextLayer() {
    _classCallCheck(this, TextLayer);

    return _possibleConstructorReturn(this, (TextLayer.__proto__ || Object.getPrototypeOf(TextLayer)).apply(this, arguments));
  }

  _createClass(TextLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      var gl = this.context.gl;

      var _makeFontAtlas = (0, _fontAtlas.makeFontAtlas)(gl, FONT_FAMILY),
          mapping = _makeFontAtlas.mapping,
          texture = _makeFontAtlas.texture;

      this.state = {
        iconAtlas: texture,
        iconMapping: mapping
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged || changeFlags.updateTriggersChanged.getText) {
        this.transformStringToLetters();
      }
    }
  }, {
    key: 'transformStringToLetters',
    value: function transformStringToLetters() {
      var _props = this.props,
          data = _props.data,
          getText = _props.getText,
          getPosition = _props.getPosition;

      if (!data || data.length === 0) {
        return;
      }

      var transformedData = data.map(function (val) {
        var text = getText(val);
        var letters = Array.from(text);
        var position = getPosition(val);
        if (!text) {
          return [];
        }
        return letters.map(function (letter, i) {
          return Object.assign({}, val, { text: letter, position: position, index: i, len: text.length });
        });
      }).reduce(function (prev, curr) {
        return [].concat(_toConsumableArray(prev), _toConsumableArray(curr));
      });

      this.setState({ data: transformedData });
    }
  }, {
    key: 'getAnchorXFromTextAnchor',
    value: function getAnchorXFromTextAnchor(textAnchor) {
      if (!TEXT_ANCHOR.hasOwnProperty(textAnchor)) {
        throw new Error('Invalid text anchor parameter: ' + textAnchor);
      }
      return TEXT_ANCHOR[textAnchor];
    }
  }, {
    key: 'getAnchorYFromAlignmentBaseline',
    value: function getAnchorYFromAlignmentBaseline(alignmentBaseline) {
      if (!ALIGNMENT_BASELINE.hasOwnProperty(alignmentBaseline)) {
        throw new Error('Invalid alignment baseline parameter: ' + alignmentBaseline);
      }
      return ALIGNMENT_BASELINE[alignmentBaseline];
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var _this2 = this;

      var _state = this.state,
          data = _state.data,
          iconAtlas = _state.iconAtlas,
          iconMapping = _state.iconMapping;


      if (!iconMapping || !iconAtlas || !data) {
        return null;
      }

      var _props2 = this.props,
          getColor = _props2.getColor,
          getSize = _props2.getSize,
          getAngle = _props2.getAngle,
          getTextAnchor = _props2.getTextAnchor,
          getAlignmentBaseline = _props2.getAlignmentBaseline,
          getPixelOffset = _props2.getPixelOffset,
          fp64 = _props2.fp64;


      return [new _multiIconLayer2.default(this.getSubLayerProps({
        id: 'text-multi-icon-layer',
        data: data,
        iconAtlas: iconAtlas,
        iconMapping: iconMapping,
        getIcon: function getIcon(d) {
          return d.text;
        },
        getPosition: function getPosition(d) {
          return d.position;
        },
        getIndexOfIcon: function getIndexOfIcon(d) {
          return d.index;
        },
        getNumOfIcon: function getNumOfIcon(d) {
          return d.len;
        },
        getColor: getColor,
        getSize: getSize,
        getAngle: getAngle,
        getAnchorX: function getAnchorX(d) {
          return _this2.getAnchorXFromTextAnchor(getTextAnchor(d));
        },
        getAnchorY: function getAnchorY(d) {
          return _this2.getAnchorYFromAlignmentBaseline(getAlignmentBaseline(d));
        },
        getPixelOffset: getPixelOffset,
        fp64: fp64,
        updateTriggers: {
          getAngle: getAngle,
          getColor: getColor,
          getSize: getSize
        }
      }))];
    }
  }]);

  return TextLayer;
}(_deck.CompositeLayer);

exports.default = TextLayer;


TextLayer.layerName = 'TextLayer';
TextLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwtbGF5ZXJzL3NyYy90ZXh0LWxheWVyL3RleHQtbGF5ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DT0xPUiIsIlRFWFRfQU5DSE9SIiwic3RhcnQiLCJtaWRkbGUiLCJlbmQiLCJBTElHTk1FTlRfQkFTRUxJTkUiLCJ0b3AiLCJjZW50ZXIiLCJib3R0b20iLCJGT05UX0ZBTUlMWSIsImRlZmF1bHRQcm9wcyIsImdldFRleHQiLCJ4IiwidGV4dCIsImdldFBvc2l0aW9uIiwiY29vcmRpbmF0ZXMiLCJnZXRDb2xvciIsImNvbG9yIiwiZ2V0U2l6ZSIsInNpemUiLCJnZXRBbmdsZSIsImFuZ2xlIiwiZ2V0VGV4dEFuY2hvciIsInRleHRBbmNob3IiLCJnZXRBbGlnbm1lbnRCYXNlbGluZSIsImFsaWdubWVudEJhc2VsaW5lIiwiZ2V0UGl4ZWxPZmZzZXQiLCJwaXhlbE9mZnNldCIsImZwNjQiLCJUZXh0TGF5ZXIiLCJnbCIsImNvbnRleHQiLCJtYXBwaW5nIiwidGV4dHVyZSIsInN0YXRlIiwiaWNvbkF0bGFzIiwiaWNvbk1hcHBpbmciLCJwcm9wcyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJkYXRhQ2hhbmdlZCIsInVwZGF0ZVRyaWdnZXJzQ2hhbmdlZCIsInRyYW5zZm9ybVN0cmluZ1RvTGV0dGVycyIsImRhdGEiLCJsZW5ndGgiLCJ0cmFuc2Zvcm1lZERhdGEiLCJtYXAiLCJ2YWwiLCJsZXR0ZXJzIiwiQXJyYXkiLCJmcm9tIiwicG9zaXRpb24iLCJsZXR0ZXIiLCJpIiwiT2JqZWN0IiwiYXNzaWduIiwiaW5kZXgiLCJsZW4iLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsInNldFN0YXRlIiwiaGFzT3duUHJvcGVydHkiLCJFcnJvciIsImdldFN1YkxheWVyUHJvcHMiLCJpZCIsImdldEljb24iLCJkIiwiZ2V0SW5kZXhPZkljb24iLCJnZXROdW1PZkljb24iLCJnZXRBbmNob3JYIiwiZ2V0QW5jaG9yWEZyb21UZXh0QW5jaG9yIiwiZ2V0QW5jaG9yWSIsImdldEFuY2hvcllGcm9tQWxpZ25tZW50QmFzZWxpbmUiLCJ1cGRhdGVUcmlnZ2VycyIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFvQkE7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUF0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBTUEsSUFBTUEsZ0JBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsR0FBVixDQUF0QjtBQUNBLElBQU1DLGNBQWM7QUFDbEJDLFNBQU8sQ0FEVztBQUVsQkMsVUFBUSxDQUZVO0FBR2xCQyxPQUFLLENBQUM7QUFIWSxDQUFwQjtBQUtBLElBQU1DLHFCQUFxQjtBQUN6QkMsT0FBSyxDQURvQjtBQUV6QkMsVUFBUSxDQUZpQjtBQUd6QkMsVUFBUSxDQUFDO0FBSGdCLENBQTNCO0FBS0E7QUFDQSxJQUFNQyxjQUFjLHFDQUFwQjs7QUFFQSxJQUFNQyxlQUFlO0FBQ25CQyxXQUFTO0FBQUEsV0FBS0MsRUFBRUMsSUFBUDtBQUFBLEdBRFU7QUFFbkJDLGVBQWE7QUFBQSxXQUFLRixFQUFFRyxXQUFQO0FBQUEsR0FGTTtBQUduQkMsWUFBVTtBQUFBLFdBQUtKLEVBQUVLLEtBQUYsSUFBV2pCLGFBQWhCO0FBQUEsR0FIUztBQUluQmtCLFdBQVM7QUFBQSxXQUFLTixFQUFFTyxJQUFGLElBQVUsRUFBZjtBQUFBLEdBSlU7QUFLbkJDLFlBQVU7QUFBQSxXQUFLUixFQUFFUyxLQUFGLElBQVcsQ0FBaEI7QUFBQSxHQUxTO0FBTW5CQyxpQkFBZTtBQUFBLFdBQUtWLEVBQUVXLFVBQUYsSUFBZ0IsUUFBckI7QUFBQSxHQU5JO0FBT25CQyx3QkFBc0I7QUFBQSxXQUFLWixFQUFFYSxpQkFBRixJQUF1QixRQUE1QjtBQUFBLEdBUEg7QUFRbkJDLGtCQUFnQjtBQUFB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ZmlsZSI6InRleHQtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtDb21wb3NpdGVMYXllcn0gZnJvbSAnZGVjay5nbCc7XG5pbXBvcnQgTXVsdGlJY29uTGF5ZXIgZnJvbSAnLi9tdWx0aS1pY29uLWxheWVyL211bHRpLWljb24tbGF5ZXInO1xuaW1wb3J0IHttYWtlRm9udEF0bGFzfSBmcm9tICcuL2ZvbnQtYXRsYXMnO1xuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzAsIDAsIDAsIDI1NV07XG5jb25zdCBURVhUX0FOQ0hPUiA9IHtcbiAgc3RhcnQ6IDEsXG4gIG1pZGRsZTogMCxcbiAgZW5kOiAtMVxufTtcbmNvbnN0IEFMSUdOTUVOVF9CQVNFTElORSA9IHtcbiAgdG9wOiAxLFxuICBjZW50ZXI6IDAsXG4gIGJvdHRvbTogLTFcbn07XG4vLyBjdXJyZW50bHkgdGhlIGZvbnQgZmFtaWx5IGlzIGludmlzaWJsZSB0byB0aGUgdXNlclxuY29uc3QgRk9OVF9GQU1JTFkgPSAnXCJMdWNpZGEgQ29uc29sZVwiLCBNb25hY28sIG1vbm9zcGFjZSc7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgZ2V0VGV4dDogeCA9PiB4LnRleHQsXG4gIGdldFBvc2l0aW9uOiB4ID0+IHguY29vcmRpbmF0ZXMsXG4gIGdldENvbG9yOiB4ID0+IHguY29sb3IgfHwgREVGQVVMVF9DT0xPUixcbiAgZ2V0U2l6ZTogeCA9PiB4LnNpemUgfHwgMzIsXG4gIGdldEFuZ2xlOiB4ID0+IHguYW5nbGUgfHwgMCxcbiAgZ2V0VGV4dEFuY2hvcjogeCA9PiB4LnRleHRBbmNob3IgfHwgJ21pZGRsZScsXG4gIGdldEFsaWdubWVudEJhc2VsaW5lOiB4ID0+IHguYWxpZ25tZW50QmFzZWxpbmUgfHwgJ2NlbnRlcicsXG4gIGdldFBpeGVsT2Zmc2V0OiB4ID0+IHgucGl4ZWxPZmZzZXQgfHwgWzAsIDBdLFxuICBmcDY0OiBmYWxzZVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGV4dExheWVyIGV4dGVuZHMgQ29tcG9zaXRlTGF5ZXIge1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB7bWFwcGluZywgdGV4dHVyZX0gPSBtYWtlRm9udEF0bGFzKGdsLCBGT05UX0ZBTUlMWSk7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGljb25BdGxhczogdGV4dHVyZSxcbiAgICAgIGljb25NYXBwaW5nOiBtYXBwaW5nXG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZVN0YXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCB8fCBjaGFuZ2VGbGFncy51cGRhdGVUcmlnZ2Vyc0NoYW5nZWQuZ2V0VGV4dCkge1xuICAgICAgdGhpcy50cmFuc2Zvcm1TdHJpbmdUb0xldHRlcnMoKTtcbiAgICB9XG4gIH1cblxuICB0cmFuc2Zvcm1TdHJpbmdUb0xldHRlcnMoKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFRleHQsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgaWYgKCFkYXRhIHx8IGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNmb3JtZWREYXRhID0gZGF0YVxuICAgICAgLm1hcCh2YWwgPT4ge1xuICAgICAgICBjb25zdCB0ZXh0ID0gZ2V0VGV4dCh2YWwpO1xuICAgICAgICBjb25zdCBsZXR0ZXJzID0gQXJyYXkuZnJvbSh0ZXh0KTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbih2YWwpO1xuICAgICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxldHRlcnMubWFwKChsZXR0ZXIsIGkpID0+XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgdmFsLCB7dGV4dDogbGV0dGVyLCBwb3NpdGlvbiwgaW5kZXg6IGksIGxlbjogdGV4dC5sZW5ndGh9KVxuICAgICAgICApO1xuICAgICAgfSlcbiAgICAgIC5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IFsuLi5wcmV2LCAuLi5jdXJyXSk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtkYXRhOiB0cmFuc2Zvcm1lZERhdGF9KTtcbiAgfVxuXG4gIGdldEFuY2hvclhGcm9tVGV4dEFuY2hvcih0ZXh0QW5jaG9yKSB7XG4gICAgaWYgKCFURVhUX0FOQ0hPUi5oYXNPd25Qcm9wZXJ0eSh0ZXh0QW5jaG9yKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHRleHQgYW5jaG9yIHBhcmFtZXRlcjogJHt0ZXh0QW5jaG9yfWApO1xuICAgIH1cbiAgICByZXR1cm4gVEVYVF9BTkNIT1JbdGV4dEFuY2hvcl07XG4gIH1cblxuICBnZXRBbmNob3JZRnJvbUFsaWdubWVudEJhc2VsaW5lKGFsaWdubWVudEJhc2VsaW5lKSB7XG4gICAgaWYgKCFBTElHTk1FTlRfQkFTRUxJTkUuaGFzT3duUHJvcGVydHkoYWxpZ25tZW50QmFzZWxpbmUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYWxpZ25tZW50IGJhc2VsaW5lIHBhcmFtZXRlcjogJHthbGlnbm1lbnRCYXNlbGluZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIEFMSUdOTUVOVF9CQVNFTElORVthbGlnbm1lbnRCYXNlbGluZV07XG4gIH1cblxuICByZW5kZXJMYXllcnMoKSB7XG4gICAgY29uc3Qge2RhdGEsIGljb25BdGxhcywgaWNvbk1hcHBpbmd9ID0gdGhpcy5zdGF0ZTtcblxuICAgIGlmICghaWNvbk1hcHBpbmcgfHwgIWljb25BdGxhcyB8fCAhZGF0YSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgZ2V0Q29sb3IsXG4gICAgICBnZXRTaXplLFxuICAgICAgZ2V0QW5nbGUsXG4gICAgICBnZXRUZXh0QW5jaG9yLFxuICAgICAgZ2V0QWxpZ25tZW50QmFzZWxpbmUsXG4gICAgICBnZXRQaXhlbE9mZnNldCxcbiAgICAgIGZwNjRcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiBbXG4gICAgICBuZXcgTXVsdGlJY29uTGF5ZXIoXG4gICAgICAgIHRoaXMuZ2V0U3ViTGF5ZXJQcm9wcyh7XG4gICAgICAgICAgaWQ6ICd0ZXh0LW11bHRpLWljb24tbGF5ZXInLFxuICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgaWNvbkF0bGFzLFxuICAgICAgICAgIGljb25NYXBwaW5nLFxuICAgICAgICAgIGdldEljb246IGQgPT4gZC50ZXh0LFxuICAgICAgICAgIGdldFBvc2l0aW9uOiBkID0+IGQucG9zaXRpb24sXG4gICAgICAgICAgZ2V0SW5kZXhPZkljb246IGQgPT4gZC5pbmRleCxcbiAgICAgICAgICBnZXROdW1PZkljb246IGQgPT4gZC5sZW4sXG4gICAgICAgICAgZ2V0Q29sb3IsXG4gICAgICAgICAgZ2V0U2l6ZSxcbiAgICAgICAgICBnZXRBbmdsZSxcbiAgICAgICAgICBnZXRBbmNob3JYOiBkID0+IHRoaXMuZ2V0QW5jaG9yWEZyb21UZXh0QW5jaG9yKGdldFRleHRBbmNob3IoZCkpLFxuICAgICAgICAgIGdldEFuY2hvclk6IGQgPT4gdGhpcy5nZXRBbmNob3JZRnJvbUFsaWdubWVudEJhc2VsaW5lKGdldEFsaWdubWVudEJhc2VsaW5lKGQpKSxcbiAgICAgICAgICBnZXRQaXhlbE9mZnNldCxcbiAgICAgICAgICBmcDY0LFxuICAgICAgICAgIHVwZGF0ZVRyaWdnZXJzOiB7XG4gICAgICAgICAgICBnZXRBbmdsZSxcbiAgICAgICAgICAgIGdldENvbG9yLFxuICAgICAgICAgICAgZ2V0U2l6ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIClcbiAgICBdO1xuICB9XG59XG5cblRleHRMYXllci5sYXllck5hbWUgPSAnVGV4dExheWVyJztcblRleHRMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=