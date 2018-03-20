'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _layer = require('./layer');

var _layer2 = _interopRequireDefault(_layer);

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

var _flatten = require('../utils/flatten');

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


var CompositeLayer = function (_Layer) {
  _inherits(CompositeLayer, _Layer);

  function CompositeLayer(props) {
    _classCallCheck(this, CompositeLayer);

    return _possibleConstructorReturn(this, (CompositeLayer.__proto__ || Object.getPrototypeOf(CompositeLayer)).call(this, props));
  }

  _createClass(CompositeLayer, [{
    key: 'getSubLayers',
    value: function getSubLayers() {
      return this.internalState.subLayers || [];
    }

    // initializeState is usually not needed for composite layers
    // Provide empty definition to disable check for missing definition

  }, {
    key: 'initializeState',
    value: function initializeState() {}

    // called to augment the info object that is bubbled up from a sublayer
    // override Layer.getPickingInfo() because decoding / setting uniform do
    // not apply to a composite layer.
    // @return null to cancel event

  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref) {
      var info = _ref.info;

      return info;
    }

    // Implement to generate subLayers

  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      return null;
    }

    // Returns sub layer props for a specific sublayer

  }, {
    key: 'getSubLayerProps',
    value: function getSubLayerProps(sublayerProps) {
      var _props = this.props,
          opacity = _props.opacity,
          pickable = _props.pickable,
          visible = _props.visible,
          parameters = _props.parameters,
          getPolygonOffset = _props.getPolygonOffset,
          highlightedObjectIndex = _props.highlightedObjectIndex,
          autoHighlight = _props.autoHighlight,
          highlightColor = _props.highlightColor,
          coordinateSystem = _props.coordinateSystem,
          coordinateOrigin = _props.coordinateOrigin,
          modelMatrix = _props.modelMatrix;

      var newProps = {
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        parameters: parameters,
        getPolygonOffset: getPolygonOffset,
        highlightedObjectIndex: highlightedObjectIndex,
        autoHighlight: autoHighlight,
        highlightColor: highlightColor,
        coordinateSystem: coordinateSystem,
        coordinateOrigin: coordinateOrigin,
        modelMatrix: modelMatrix
      };

      if (sublayerProps) {
        Object.assign(newProps, sublayerProps, {
          id: this.props.id + '-' + sublayerProps.id,
          updateTriggers: Object.assign({
            all: this.props.updateTriggers.all
          }, sublayerProps.updateTriggers)
        });
      }

      return newProps;
    }

    // Called by layer manager to render subLayers

  }, {
    key: '_renderLayers',
    value: function _renderLayers() {
      var subLayers = this.internalState.subLayers;

      if (subLayers && !this.needsUpdate()) {
        _log2.default.log(3, 'Composite layer reused subLayers ' + this, this.internalState.subLayers);
      } else {
        subLayers = this.renderLayers();
        // Flatten the returned array, removing any null, undefined or false
        // this allows layers to render sublayers conditionally
        // (see CompositeLayer.renderLayers docs)
        subLayers = (0, _flatten.flatten)(subLayers, { filter: Boolean });
        this.internalState.subLayers = subLayers;
        _log2.default.log(2, 'Composite layer rendered new subLayers ' + this, subLayers);
      }

      // populate reference to parent layer (this layer)
      // NOTE: needs to be done even when reusing layers as the parent may have changed
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = subLayers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var layer = _step.value;

          layer.parentLayer = this;
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
    key: 'isComposite',
    get: function get() {
      return true;
    }
  }]);

  return CompositeLayer;
}(_layer2.default);

exports.default = CompositeLayer;


CompositeLayer.layerName = 'CompositeLayer';
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9jb21wb3NpdGUtbGF5ZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zaXRlTGF5ZXIiLCJwcm9wcyIsImludGVybmFsU3RhdGUiLCJzdWJMYXllcnMiLCJpbmZvIiwic3VibGF5ZXJQcm9wcyIsIm9wYWNpdHkiLCJwaWNrYWJsZSIsInZpc2libGUiLCJwYXJhbWV0ZXJzIiwiZ2V0UG9seWdvbk9mZnNldCIsImhpZ2hsaWdodGVkT2JqZWN0SW5kZXgiLCJhdXRvSGlnaGxpZ2h0IiwiaGlnaGxpZ2h0Q29sb3IiLCJjb29yZGluYXRlU3lzdGVtIiwiY29vcmRpbmF0ZU9yaWdpbiIsIm1vZGVsTWF0cml4IiwibmV3UHJvcHMiLCJPYmplY3QiLCJhc3NpZ24iLCJpZCIsInVwZGF0ZVRyaWdnZXJzIiwiYWxsIiwibmVlZHNVcGRhdGUiLCJsb2ciLCJyZW5kZXJMYXllcnMiLCJmaWx0ZXIiLCJCb29sZWFuIiwibGF5ZXIiLCJwYXJlbnRMYXllciIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFtQkE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7OzsrZUFyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztJQUtxQkEsYzs7O0FBQ25CLDBCQUFZQyxLQUFaLEVBQW1CO0FBQUE7O0FBQUEsMkhBQ1hBLEtBRFc7QUFFbEI7Ozs7bUNBTWM7QUFDYixhQUFPLEtBQUtDLGFBQUwsQ0FBbUJDLFNBQW5CLElBQWdDLEVBQXZDO0FBQ0Q7O0FBRUQ7QUFDQTs7OztzQ0FDa0IsQ0FBRTs7QUFFcEI7QUFDQTtBQUNBO0FBQ0E7Ozs7eUNBQ3VCO0FBQUEsVUFBUEMsSUFBTyxRQUFQQSxJQUFPOztBQUNyQixhQUFPQSxJQUFQO0FBQ0Q7O0FBRUQ7Ozs7bUNBQ2U7QUFDYixhQUFPLElBQVA7QUFDRDs7QUFFRDs7OztxQ0FDaUJDLGEsRUFBZTtBQUFBLG1CQWExQixLQUFLSixLQWJxQjtBQUFBLFVBRTVCSyxPQUY0QixVQUU1QkEsT0FGNEI7QUFBQSxVQUc1QkMsUUFINEIsVUFHNUJBLFFBSDRCO0FBQUEsVUFJNUJDLE9BSjRCLFVBSTVCQSxPQUo0QjtBQUFBLFVBSzVCQyxVQUw0QixVQUs1QkEsVUFMNEI7QUFBQSxVQU01QkMsZ0JBTjRCLFVBTTVCQSxnQkFONEI7QUFBQSxVQU81QkMsc0JBUDRCLFVBTzVCQSxzQkFQNEI7QUFBQSxVQVE1QkMsYUFSNEIsVUFRNUJBLGFBUjRCO0FBQUEsVUFTNUJDLGNBVDRCLFVBUzVCQSxjQVQ0QjtBQUFBLFVBVTVCQyxnQkFWNEIsVUFVNUJBLGdCQVY0QjtBQUFBLFVBVzVCQyxnQkFYNEIsVUFXNUJBLGdCQVg0QjtBQUFBLFVBWTVCQyxXQVo0QixVQVk1QkEsV0FaNEI7O0FBYzlCLFVBQU1DLFdBQVc7QUFDZlgsd0JBRGU7QUFFZkMsMEJBRmU7QUFHZkMsd0JBSGU7QUFJZkMsOEJBSmU7QUFLZkMsMENBTGU7QUFNZkMsc0RBTmU7QUFPZkMsb0NBUGU7QUFRZkMsc0NBUmU7QUFTZkMsMENBVGU7QUFVZkMsMENBVmU7QUFXZkM7QUFYZSxPQUFqQjs7QUFjQSxVQUFJWCxhQUFKLEVBQW1CO0FBQ2pCYSxlQUFPQyxNQUFQLENBQWNGLFFBQWQsRUFBd0JaLGFBQXhCLEVBQXVDO0FBQ3JDZSxjQUFPLEtBQUtuQixLQUFMLENBQVdtQixFQUFsQixTQUF3QmYsY0FBY2UsRUFERDtBQUVyQ0MsMEJBQWdCSCxPQUFPQyxNQUFQLENBQ2Q7QUFDRUcsaUJBQUssS0FBS3JCLEtBQUwsQ0FBV29CLGNBQVgsQ0FBMEJDO0FBRGpDLFdBRGMsRUFJZGpCLGNBQWNnQixjQUpBO0FBRnFCLFNBQXZDO0FBU0Q7O0FBRUQsYUFBT0osUUFBUDtBQUNEOztBQUVEOzs7O29DQUNnQjtBQUFBLFVBQ1RkLFNBRFMsR0FDSSxLQUFLRCxhQURULENBQ1RDLFNBRFM7O0FBRWQsVUFBSUEsYUFBYSxDQUFDLEtBQUtvQixXQUFMLEVBQWxCLEVBQXNDO0FBQ3BDLHNCQUFJQyxHQUFKLENBQVEsQ0FBUix3Q0FBK0MsSUFBL0MsRUFBdUQsS0FBS3RCLGFBQUwsQ0FBbUJDLFNBQTFFO0FBQ0QsT0FGRCxNQUVPO0FBQ0xBLG9CQUFZLEtBQUtzQixZQUFMLEVBQVo7QUFDQTtBQUNBO0FBQ0E7QUFDQXRCLG9CQUFZLHNCQUFRQSxTQUFSLEVBQW1CLEVBQUN1QixRQUFRQyxPQUFULEVBQW5CLENBQVo7QUFDQSxhQUFLekIsYUFBTCxDQUFtQkMsU0FBbkIsR0FBK0JBLFNBQS9CO0FBQ0Esc0JBQUlxQixHQUFKLENBQVEsQ0FBUiw4Q0FBcUQsSUFBckQsRUFBNkRyQixTQUE3RDtBQUNEOztBQUVEO0FBQ0E7QUFmYztBQUFBO0FBQUE7O0FBQUE7QUFnQmQsNkJBQW9CQSxTQUFwQiw4SEFBK0I7QUFBQSxjQUFwQnlCLEtBQW9COztBQUM3QkEsZ0JBQU1DLFdBQU4sR0FBb0IsSUFBcEI7QUFDRDtBQWxCYTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBbUJmOzs7d0JBekZpQjtBQUNoQixhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQVBrQjdCLGM7OztBQWlHckJBLGVBQWU4QixTQUFmLEdBQTJCLGdCQUEzQiIsImZpbGUiOiJjb21wb3NpdGUtbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cbmltcG9ydCBMYXllciBmcm9tICcuL2xheWVyJztcbmltcG9ydCBsb2cgZnJvbSAnLi4vdXRpbHMvbG9nJztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi4vdXRpbHMvZmxhdHRlbic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBvc2l0ZUxheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgfVxuXG4gIGdldCBpc0NvbXBvc2l0ZSgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGdldFN1YkxheWVycygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnRlcm5hbFN0YXRlLnN1YkxheWVycyB8fCBbXTtcbiAgfVxuXG4gIC8vIGluaXRpYWxpemVTdGF0ZSBpcyB1c3VhbGx5IG5vdCBuZWVkZWQgZm9yIGNvbXBvc2l0ZSBsYXllcnNcbiAgLy8gUHJvdmlkZSBlbXB0eSBkZWZpbml0aW9uIHRvIGRpc2FibGUgY2hlY2sgZm9yIG1pc3NpbmcgZGVmaW5pdGlvblxuICBpbml0aWFsaXplU3RhdGUoKSB7fVxuXG4gIC8vIGNhbGxlZCB0byBhdWdtZW50IHRoZSBpbmZvIG9iamVjdCB0aGF0IGlzIGJ1YmJsZWQgdXAgZnJvbSBhIHN1YmxheWVyXG4gIC8vIG92ZXJyaWRlIExheWVyLmdldFBpY2tpbmdJbmZvKCkgYmVjYXVzZSBkZWNvZGluZyAvIHNldHRpbmcgdW5pZm9ybSBkb1xuICAvLyBub3QgYXBwbHkgdG8gYSBjb21wb3NpdGUgbGF5ZXIuXG4gIC8vIEByZXR1cm4gbnVsbCB0byBjYW5jZWwgZXZlbnRcbiAgZ2V0UGlja2luZ0luZm8oe2luZm99KSB7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvLyBJbXBsZW1lbnQgdG8gZ2VuZXJhdGUgc3ViTGF5ZXJzXG4gIHJlbmRlckxheWVycygpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFJldHVybnMgc3ViIGxheWVyIHByb3BzIGZvciBhIHNwZWNpZmljIHN1YmxheWVyXG4gIGdldFN1YkxheWVyUHJvcHMoc3VibGF5ZXJQcm9wcykge1xuICAgIGNvbnN0IHtcbiAgICAgIG9wYWNpdHksXG4gICAgICBwaWNrYWJsZSxcbiAgICAgIHZpc2libGUsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgZ2V0UG9seWdvbk9mZnNldCxcbiAgICAgIGhpZ2hsaWdodGVkT2JqZWN0SW5kZXgsXG4gICAgICBhdXRvSGlnaGxpZ2h0LFxuICAgICAgaGlnaGxpZ2h0Q29sb3IsXG4gICAgICBjb29yZGluYXRlU3lzdGVtLFxuICAgICAgY29vcmRpbmF0ZU9yaWdpbixcbiAgICAgIG1vZGVsTWF0cml4XG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgbmV3UHJvcHMgPSB7XG4gICAgICBvcGFjaXR5LFxuICAgICAgcGlja2FibGUsXG4gICAgICB2aXNpYmxlLFxuICAgICAgcGFyYW1ldGVycyxcbiAgICAgIGdldFBvbHlnb25PZmZzZXQsXG4gICAgICBoaWdobGlnaHRlZE9iamVjdEluZGV4LFxuICAgICAgYXV0b0hpZ2hsaWdodCxcbiAgICAgIGhpZ2hsaWdodENvbG9yLFxuICAgICAgY29vcmRpbmF0ZVN5c3RlbSxcbiAgICAgIGNvb3JkaW5hdGVPcmlnaW4sXG4gICAgICBtb2RlbE1hdHJpeFxuICAgIH07XG5cbiAgICBpZiAoc3VibGF5ZXJQcm9wcykge1xuICAgICAgT2JqZWN0LmFzc2lnbihuZXdQcm9wcywgc3VibGF5ZXJQcm9wcywge1xuICAgICAgICBpZDogYCR7dGhpcy5wcm9wcy5pZH0tJHtzdWJsYXllclByb3BzLmlkfWAsXG4gICAgICAgIHVwZGF0ZVRyaWdnZXJzOiBPYmplY3QuYXNzaWduKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFsbDogdGhpcy5wcm9wcy51cGRhdGVUcmlnZ2Vycy5hbGxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1YmxheWVyUHJvcHMudXBkYXRlVHJpZ2dlcnNcbiAgICAgICAgKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld1Byb3BzO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGJ5IGxheWVyIG1hbmFnZXIgdG8gcmVuZGVyIHN1YkxheWVyc1xuICBfcmVuZGVyTGF5ZXJzKCkge1xuICAgIGxldCB7c3ViTGF5ZXJzfSA9IHRoaXMuaW50ZXJuYWxTdGF0ZTtcbiAgICBpZiAoc3ViTGF5ZXJzICYmICF0aGlzLm5lZWRzVXBkYXRlKCkpIHtcbiAgICAgIGxvZy5sb2coMywgYENvbXBvc2l0ZSBsYXllciByZXVzZWQgc3ViTGF5ZXJzICR7dGhpc31gLCB0aGlzLmludGVybmFsU3RhdGUuc3ViTGF5ZXJzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3ViTGF5ZXJzID0gdGhpcy5yZW5kZXJMYXllcnMoKTtcbiAgICAgIC8vIEZsYXR0ZW4gdGhlIHJldHVybmVkIGFycmF5LCByZW1vdmluZyBhbnkgbnVsbCwgdW5kZWZpbmVkIG9yIGZhbHNlXG4gICAgICAvLyB0aGlzIGFsbG93cyBsYXllcnMgdG8gcmVuZGVyIHN1YmxheWVycyBjb25kaXRpb25hbGx5XG4gICAgICAvLyAoc2VlIENvbXBvc2l0ZUxheWVyLnJlbmRlckxheWVycyBkb2NzKVxuICAgICAgc3ViTGF5ZXJzID0gZmxhdHRlbihzdWJMYXllcnMsIHtmaWx0ZXI6IEJvb2xlYW59KTtcbiAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZS5zdWJMYXllcnMgPSBzdWJMYXllcnM7XG4gICAgICBsb2cubG9nKDIsIGBDb21wb3NpdGUgbGF5ZXIgcmVuZGVyZWQgbmV3IHN1YkxheWVycyAke3RoaXN9YCwgc3ViTGF5ZXJzKTtcbiAgICB9XG5cbiAgICAvLyBwb3B1bGF0ZSByZWZlcmVuY2UgdG8gcGFyZW50IGxheWVyICh0aGlzIGxheWVyKVxuICAgIC8vIE5PVEU6IG5lZWRzIHRvIGJlIGRvbmUgZXZlbiB3aGVuIHJldXNpbmcgbGF5ZXJzIGFzIHRoZSBwYXJlbnQgbWF5IGhhdmUgY2hhbmdlZFxuICAgIGZvciAoY29uc3QgbGF5ZXIgb2Ygc3ViTGF5ZXJzKSB7XG4gICAgICBsYXllci5wYXJlbnRMYXllciA9IHRoaXM7XG4gICAgfVxuICB9XG59XG5cbkNvbXBvc2l0ZUxheWVyLmxheWVyTmFtZSA9ICdDb21wb3NpdGVMYXllcic7XG4iXX0=