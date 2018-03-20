'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _autobind = require('./utils/autobind');

var _autobind2 = _interopRequireDefault(_autobind);

var _inheritsFrom = require('../core/utils/inherits-from');

var _core = require('../core');

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

var DeckGLJS = _core.experimental.DeckGLJS,
    log = _core.experimental.log;

var DeckGL = function (_React$Component) {
  _inherits(DeckGL, _React$Component);

  function DeckGL(props) {
    _classCallCheck(this, DeckGL);

    var _this = _possibleConstructorReturn(this, (DeckGL.__proto__ || Object.getPrototypeOf(DeckGL)).call(this, props));

    _this.state = {};
    _this.children = [];
    (0, _autobind2.default)(_this);
    return _this;
  }

  _createClass(DeckGL, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.deck = new DeckGLJS(Object.assign({}, this.props, { canvas: this.overlay }));
      this._updateFromProps(this.props);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this._updateFromProps(nextProps);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.deck.finalize();
    }

    // Public API

  }, {
    key: 'queryObject',
    value: function queryObject(opts) {
      log.deprecated('queryObject', 'pickObject');
      return this.deck.pickObject(opts);
    }
  }, {
    key: 'pickObject',
    value: function pickObject(_ref) {
      var x = _ref.x,
          y = _ref.y,
          _ref$radius = _ref.radius,
          radius = _ref$radius === undefined ? 0 : _ref$radius,
          _ref$layerIds = _ref.layerIds,
          layerIds = _ref$layerIds === undefined ? null : _ref$layerIds;

      return this.deck.pickObject({ x: x, y: y, radius: radius, layerIds: layerIds });
    }
  }, {
    key: 'queryVisibleObjects',
    value: function queryVisibleObjects(opts) {
      log.deprecated('queryVisibleObjects', 'pickObjects');
      return this.pickObjects(opts);
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

      return this.deck.pickObjects({ x: x, y: y, width: width, height: height, layerIds: layerIds });
    }

    // Private Helpers

    // Extract any JSX layers from the react children
    // Needs to be called both from initial mount, and when new props arrive

  }, {
    key: '_updateFromProps',
    value: function _updateFromProps(nextProps) {
      // extract any deck.gl layers masquerading as react elements from props.children
      var _extractJSXLayers2 = this._extractJSXLayers(nextProps.children),
          layers = _extractJSXLayers2.layers,
          children = _extractJSXLayers2.children;

      if (this.deck) {
        this.deck.setProps(Object.assign({}, nextProps, {
          // Avoid modifying layers array if no JSX layers were found
          layers: layers ? [].concat(_toConsumableArray(layers), _toConsumableArray(nextProps.layers)) : nextProps.layers
        }));
      }

      this.children = children;
    }

    // extracts any deck.gl layers masquerading as react elements from props.children

  }, {
    key: '_extractJSXLayers',
    value: function _extractJSXLayers(children) {
      var reactChildren = []; // extract real react elements (i.e. not deck.gl layers)
      var layers = null; // extracted layer from react children, will add to deck.gl layer array

      _react2.default.Children.forEach(children, function (reactElement) {
        if (reactElement) {
          // For some reason Children.forEach doesn't filter out `null`s
          var LayerType = reactElement.type;
          if ((0, _inheritsFrom.inheritsFrom)(LayerType, _core.Layer)) {
            var layer = new LayerType(reactElement.props);
            layers = layers || [];
            layers.push(layer);
          } else {
            reactChildren.push(reactElement);
          }
        }
      });

      return { layers: layers, children: reactChildren };
    }

    // Iterate over viewport descriptors and render children associate with viewports
    // at the specified positions
    // TODO - Can we supply a similar function for the non-React case?

  }, {
    key: '_renderChildrenUnderViewports',
    value: function _renderChildrenUnderViewports(children) {
      var _this2 = this;

      // Flatten out nested viewports array
      var viewports = this.deck ? this.deck.getViewports() : [];

      // Build a viewport id to viewport index
      var viewportMap = {};
      viewports.forEach(function (viewport) {
        if (viewport.id) {
          viewportMap[viewport.id] = viewport;
        }
      });

      return children.map(
      // If child specifies props.viewportId, position under viewport, otherwise render as normal
      function (child, i) {
        return child.props.viewportId ? _this2._positionChild({ child: child, viewportMap: viewportMap, i: i }) : child;
      });
    }
  }, {
    key: '_positionChild',
    value: function _positionChild(_ref3) {
      var child = _ref3.child,
          viewportMap = _ref3.viewportMap,
          i = _ref3.i;
      var viewportId = child.props.viewportId;

      var viewport = viewportId && viewportMap[viewportId];

      // Drop (aut-hide) elements with viewportId that are not matched by any current viewport
      if (!viewport) {
        return null;
      }

      // Resolve potentially relative dimensions using the deck.gl container size
      var x = viewport.x,
          y = viewport.y,
          width = viewport.width,
          height = viewport.height;

      // Clone the element with width and height set per viewport

      var newProps = Object.assign({}, child.props, { width: width, height: height });

      // Inject map properties
      // TODO - this is too react-map-gl specific
      Object.assign(newProps, viewport.getMercatorParams(), {
        visible: viewport.isMapSynched()
      });

      var clone = (0, _react.cloneElement)(child, newProps);

      // Wrap it in an absolutely positioning div
      var style = { position: 'absolute', left: x, top: y, width: width, height: height };
      var key = 'viewport-child-' + viewportId + '-' + i;
      return (0, _react.createElement)('div', { key: key, id: key, style: style }, clone);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      // Render the background elements (typically react-map-gl instances)
      // using the viewport descriptors
      var children = this._renderChildrenUnderViewports(this.children);

      // Render deck.gl as last child
      var _props = this.props,
          id = _props.id,
          width = _props.width,
          height = _props.height,
          style = _props.style;

      var deck = (0, _react.createElement)('canvas', {
        ref: function ref(c) {
          return _this3.overlay = c;
        },
        key: 'overlay',
        id: id,
        style: Object.assign({}, { position: 'absolute', left: 0, top: 0, width: width, height: height }, style)
      });
      children.push(deck);

      return (0, _react.createElement)('div', { id: 'deckgl-wrapper' }, children);
    }
  }]);

  return DeckGL;
}(_react2.default.Component);

exports.default = DeckGL;


DeckGL.propTypes = DeckGLJS.propTypes;
DeckGL.defaultProps = DeckGLJS.defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZWFjdC9kZWNrZ2wuanMiXSwibmFtZXMiOlsiRGVja0dMSlMiLCJsb2ciLCJEZWNrR0wiLCJwcm9wcyIsInN0YXRlIiwiY2hpbGRyZW4iLCJkZWNrIiwiT2JqZWN0IiwiYXNzaWduIiwiY2FudmFzIiwib3ZlcmxheSIsIl91cGRhdGVGcm9tUHJvcHMiLCJuZXh0UHJvcHMiLCJmaW5hbGl6ZSIsIm9wdHMiLCJkZXByZWNhdGVkIiwicGlja09iamVjdCIsIngiLCJ5IiwicmFkaXVzIiwibGF5ZXJJZHMiLCJwaWNrT2JqZWN0cyIsIndpZHRoIiwiaGVpZ2h0IiwiX2V4dHJhY3RKU1hMYXllcnMiLCJsYXllcnMiLCJzZXRQcm9wcyIsInJlYWN0Q2hpbGRyZW4iLCJDaGlsZHJlbiIsImZvckVhY2giLCJyZWFjdEVsZW1lbnQiLCJMYXllclR5cGUiLCJ0eXBlIiwibGF5ZXIiLCJwdXNoIiwidmlld3BvcnRzIiwiZ2V0Vmlld3BvcnRzIiwidmlld3BvcnRNYXAiLCJ2aWV3cG9ydCIsImlkIiwibWFwIiwiY2hpbGQiLCJpIiwidmlld3BvcnRJZCIsIl9wb3NpdGlvbkNoaWxkIiwibmV3UHJvcHMiLCJnZXRNZXJjYXRvclBhcmFtcyIsInZpc2libGUiLCJpc01hcFN5bmNoZWQiLCJjbG9uZSIsInN0eWxlIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwia2V5IiwiX3JlbmRlckNoaWxkcmVuVW5kZXJWaWV3cG9ydHMiLCJyZWYiLCJjIiwiQ29tcG9uZW50IiwicHJvcFR5cGVzIiwiZGVmYXVsdFByb3BzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQW9CQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7K2VBdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQU1PQSxRLHNCQUFBQSxRO0lBQVVDLEcsc0JBQUFBLEc7O0lB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SWpCLEtBTkosVUFNSUEsS0FOSjtBQUFBLFVBTVdDLE1BTlgsVUFNV0EsTUFOWDtBQUFBLFVBTW1CMkIsS0FObkIsVUFNbUJBLEtBTm5COztBQU9QLFVBQU01QyxPQUFPLDBCQUFjLFFBQWQsRUFBd0I7QUFDbkNrRCxhQUFLO0FBQUEsaUJBQU0sT0FBSzlDLE9BQUwsR0FBZStDLENBQXJCO0FBQUEsU0FEOEI7QUFFbkNILGFBQUssU0FGOEI7QUFHbkNmLGNBSG1DO0FBSW5DVyxlQUFPM0MsT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsRUFBQzJDLFVBQVUsVUFBWCxFQUF1QkMsTUFBTSxDQUE3QixFQUFnQ0MsS0FBSyxDQUFyQyxFQUF3Qy9CLFlBQXhDLEVBQStDQyxjQUEvQyxFQUFsQixFQUEwRTJCLEtBQTFFO0FBSjRCLE9BQXhCLENBQWI7QUFNQTdDLGVBQVM2QixJQUFULENBQWM1QixJQUFkOztBQUVBLGFBQU8sMEJBQWMsS0FBZCxFQUFxQixFQUFDaUMsSUFBSSxnQkFBTCxFQUFyQixFQUE2Q2xDLFFBQTdDLENBQVA7QUFDRDs7OztFQXJKaUMsZ0JBQU1xRCxTOztrQkFBckJ4RCxNOzs7QUF3SnJCQSxPQUFPeUQsU0FBUCxHQUFtQjNELFNBQVMyRCxTQUE1QjtBQUNBekQsT0FBTzBELFlBQVAsR0FBc0I1RCxTQUFTNEQsWUFBL0IiLCJmaWxlIjoiZGVja2dsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCBSZWFjdCwge2NyZWF0ZUVsZW1lbnQsIGNsb25lRWxlbWVudH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGF1dG9iaW5kIGZyb20gJy4vdXRpbHMvYXV0b2JpbmQnO1xuaW1wb3J0IHtpbmhlcml0c0Zyb219IGZyb20gJy4uL2NvcmUvdXRpbHMvaW5oZXJpdHMtZnJvbSc7XG5pbXBvcnQge0xheWVyLCBleHBlcmltZW50YWx9IGZyb20gJy4uL2NvcmUnO1xuY29uc3Qge0RlY2tHTEpTLCBsb2d9ID0gZXhwZXJpbWVudGFsO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZWNrR0wgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLnN0YXRlID0ge307XG4gICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuICAgIGF1dG9iaW5kKHRoaXMpO1xuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5kZWNrID0gbmV3IERlY2tHTEpTKE9iamVjdC5hc3NpZ24oe30sIHRoaXMucHJvcHMsIHtjYW52YXM6IHRoaXMub3ZlcmxheX0pKTtcbiAgICB0aGlzLl91cGRhdGVGcm9tUHJvcHModGhpcy5wcm9wcyk7XG4gIH1cblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuICAgIHRoaXMuX3VwZGF0ZUZyb21Qcm9wcyhuZXh0UHJvcHMpO1xuICB9XG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgdGhpcy5kZWNrLmZpbmFsaXplKCk7XG4gIH1cblxuICAvLyBQdWJsaWMgQVBJXG5cbiAgcXVlcnlPYmplY3Qob3B0cykge1xuICAgIGxvZy5kZXByZWNhdGVkKCdxdWVyeU9iamVjdCcsICdwaWNrT2JqZWN0Jyk7XG4gICAgcmV0dXJuIHRoaXMuZGVjay5waWNrT2JqZWN0KG9wdHMpO1xuICB9XG5cbiAgcGlja09iamVjdCh7eCwgeSwgcmFkaXVzID0gMCwgbGF5ZXJJZHMgPSBudWxsfSkge1xuICAgIHJldHVybiB0aGlzLmRlY2sucGlja09iamVjdCh7eCwgeSwgcmFkaXVzLCBsYXllcklkc30pO1xuICB9XG5cbiAgcXVlcnlWaXNpYmxlT2JqZWN0cyhvcHRzKSB7XG4gICAgbG9nLmRlcHJlY2F0ZWQoJ3F1ZXJ5VmlzaWJsZU9iamVjdHMnLCAncGlja09iamVjdHMnKTtcbiAgICByZXR1cm4gdGhpcy5waWNrT2JqZWN0cyhvcHRzKTtcbiAgfVxuXG4gIHBpY2tPYmplY3RzKHt4LCB5LCB3aWR0aCA9IDEsIGhlaWdodCA9IDEsIGxheWVySWRzID0gbnVsbH0pIHtcbiAgICByZXR1cm4gdGhpcy5kZWNrLnBpY2tPYmplY3RzKHt4LCB5LCB3aWR0aCwgaGVpZ2h0LCBsYXllcklkc30pO1xuICB9XG5cbiAgLy8gUHJpdmF0ZSBIZWxwZXJzXG5cbiAgLy8gRXh0cmFjdCBhbnkgSlNYIGxheWVycyBmcm9tIHRoZSByZWFjdCBjaGlsZHJlblxuICAvLyBOZWVkcyB0byBiZSBjYWxsZWQgYm90aCBmcm9tIGluaXRpYWwgbW91bnQsIGFuZCB3aGVuIG5ldyBwcm9wcyBhcnJpdmVcbiAgX3VwZGF0ZUZyb21Qcm9wcyhuZXh0UHJvcHMpIHtcbiAgICAvLyBleHRyYWN0IGFueSBkZWNrLmdsIGxheWVycyBtYXNxdWVyYWRpbmcgYXMgcmVhY3QgZWxlbWVudHMgZnJvbSBwcm9wcy5jaGlsZHJlblxuICAgIGNvbnN0IHtsYXllcnMsIGNoaWxkcmVufSA9IHRoaXMuX2V4dHJhY3RKU1hMYXllcnMobmV4dFByb3BzLmNoaWxkcmVuKTtcblxuICAgIGlmICh0aGlzLmRlY2spIHtcbiAgICAgIHRoaXMuZGVjay5zZXRQcm9wcyhcbiAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgbmV4dFByb3BzLCB7XG4gICAgICAgICAgLy8gQXZvaWQgbW9kaWZ5aW5nIGxheWVycyBhcnJheSBpZiBubyBKU1ggbGF5ZXJzIHdlcmUgZm91bmRcbiAgICAgICAgICBsYXllcnM6IGxheWVycyA/IFsuLi5sYXllcnMsIC4uLm5leHRQcm9wcy5sYXllcnNdIDogbmV4dFByb3BzLmxheWVyc1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICAvLyBleHRyYWN0cyBhbnkgZGVjay5nbCBsYXllcnMgbWFzcXVlcmFkaW5nIGFzIHJlYWN0IGVsZW1lbnRzIGZyb20gcHJvcHMuY2hpbGRyZW5cbiAgX2V4dHJhY3RKU1hMYXllcnMoY2hpbGRyZW4pIHtcbiAgICBjb25zdCByZWFjdENoaWxkcmVuID0gW107IC8vIGV4dHJhY3QgcmVhbCByZWFjdCBlbGVtZW50cyAoaS5lLiBub3QgZGVjay5nbCBsYXllcnMpXG4gICAgbGV0IGxheWVycyA9IG51bGw7IC8vIGV4dHJhY3RlZCBsYXllciBmcm9tIHJlYWN0IGNoaWxkcmVuLCB3aWxsIGFkZCB0byBkZWNrLmdsIGxheWVyIGFycmF5XG5cbiAgICBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCByZWFjdEVsZW1lbnQgPT4ge1xuICAgICAgaWYgKHJlYWN0RWxlbWVudCkge1xuICAgICAgICAvLyBGb3Igc29tZSByZWFzb24gQ2hpbGRyZW4uZm9yRWFjaCBkb2Vzbid0IGZpbHRlciBvdXQgYG51bGxgc1xuICAgICAgICBjb25zdCBMYXllclR5cGUgPSByZWFjdEVsZW1lbnQudHlwZTtcbiAgICAgICAgaWYgKGluaGVyaXRzRnJvbShMYXllclR5cGUsIExheWVyKSkge1xuICAgICAgICAgIGNvbnN0IGxheWVyID0gbmV3IExheWVyVHlwZShyZWFjdEVsZW1lbnQucHJvcHMpO1xuICAgICAgICAgIGxheWVycyA9IGxheWVycyB8fCBbXTtcbiAgICAgICAgICBsYXllcnMucHVzaChsYXllcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVhY3RDaGlsZHJlbi5wdXNoKHJlYWN0RWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7bGF5ZXJzLCBjaGlsZHJlbjogcmVhY3RDaGlsZHJlbn07XG4gIH1cblxuICAvLyBJdGVyYXRlIG92ZXIgdmlld3BvcnQgZGVzY3JpcHRvcnMgYW5kIHJlbmRlciBjaGlsZHJlbiBhc3NvY2lhdGUgd2l0aCB2aWV3cG9ydHNcbiAgLy8gYXQgdGhlIHNwZWNpZmllZCBwb3NpdGlvbnNcbiAgLy8gVE9ETyAtIENhbiB3ZSBzdXBwbHkgYSBzaW1pbGFyIGZ1bmN0aW9uIGZvciB0aGUgbm9uLVJlYWN0IGNhc2U/XG4gIF9yZW5kZXJDaGlsZHJlblVuZGVyVmlld3BvcnRzKGNoaWxkcmVuKSB7XG4gICAgLy8gRmxhdHRlbiBvdXQgbmVzdGVkIHZpZXdwb3J0cyBhcnJheVxuICAgIGNvbnN0IHZpZXdwb3J0cyA9IHRoaXMuZGVjayA/IHRoaXMuZGVjay5nZXRWaWV3cG9ydHMoKSA6IFtdO1xuXG4gICAgLy8gQnVpbGQgYSB2aWV3cG9ydCBpZCB0byB2aWV3cG9ydCBpbmRleFxuICAgIGNvbnN0IHZpZXdwb3J0TWFwID0ge307XG4gICAgdmlld3BvcnRzLmZvckVhY2godmlld3BvcnQgPT4ge1xuICAgICAgaWYgKHZpZXdwb3J0LmlkKSB7XG4gICAgICAgIHZpZXdwb3J0TWFwW3ZpZXdwb3J0LmlkXSA9IHZpZXdwb3J0O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNoaWxkcmVuLm1hcChcbiAgICAgIC8vIElmIGNoaWxkIHNwZWNpZmllcyBwcm9wcy52aWV3cG9ydElkLCBwb3NpdGlvbiB1bmRlciB2aWV3cG9ydCwgb3RoZXJ3aXNlIHJlbmRlciBhcyBub3JtYWxcbiAgICAgIChjaGlsZCwgaSkgPT4gKGNoaWxkLnByb3BzLnZpZXdwb3J0SWQgPyB0aGlzLl9wb3NpdGlvbkNoaWxkKHtjaGlsZCwgdmlld3BvcnRNYXAsIGl9KSA6IGNoaWxkKVxuICAgICk7XG4gIH1cblxuICBfcG9zaXRpb25DaGlsZCh7Y2hpbGQsIHZpZXdwb3J0TWFwLCBpfSkge1xuICAgIGNvbnN0IHt2aWV3cG9ydElkfSA9IGNoaWxkLnByb3BzO1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gdmlld3BvcnRJZCAmJiB2aWV3cG9ydE1hcFt2aWV3cG9ydElkXTtcblxuICAgIC8vIERyb3AgKGF1dC1oaWRlKSBlbGVtZW50cyB3aXRoIHZpZXdwb3J0SWQgdGhhdCBhcmUgbm90IG1hdGNoZWQgYnkgYW55IGN1cnJlbnQgdmlld3BvcnRcbiAgICBpZiAoIXZpZXdwb3J0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZXNvbHZlIHBvdGVudGlhbGx5IHJlbGF0aXZlIGRpbWVuc2lvbnMgdXNpbmcgdGhlIGRlY2suZ2wgY29udGFpbmVyIHNpemVcbiAgICBjb25zdCB7eCwgeSwgd2lkdGgsIGhlaWdodH0gPSB2aWV3cG9ydDtcblxuICAgIC8vIENsb25lIHRoZSBlbGVtZW50IHdpdGggd2lkdGggYW5kIGhlaWdodCBzZXQgcGVyIHZpZXdwb3J0XG4gICAgY29uc3QgbmV3UHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBjaGlsZC5wcm9wcywge3dpZHRoLCBoZWlnaHR9KTtcblxuICAgIC8vIEluamVjdCBtYXAgcHJvcGVydGllc1xuICAgIC8vIFRPRE8gLSB0aGlzIGlzIHRvbyByZWFjdC1tYXAtZ2wgc3BlY2lmaWNcbiAgICBPYmplY3QuYXNzaWduKG5ld1Byb3BzLCB2aWV3cG9ydC5nZXRNZXJjYXRvclBhcmFtcygpLCB7XG4gICAgICB2aXNpYmxlOiB2aWV3cG9ydC5pc01hcFN5bmNoZWQoKVxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvbmUgPSBjbG9uZUVsZW1lbnQoY2hpbGQsIG5ld1Byb3BzKTtcblxuICAgIC8vIFdyYXAgaXQgaW4gYW4gYWJzb2x1dGVseSBwb3NpdGlvbmluZyBkaXZcbiAgICBjb25zdCBzdHlsZSA9IHtwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogeCwgdG9wOiB5LCB3aWR0aCwgaGVpZ2h0fTtcbiAgICBjb25zdCBrZXkgPSBgdmlld3BvcnQtY2hpbGQtJHt2aWV3cG9ydElkfS0ke2l9YDtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudCgnZGl2Jywge2tleSwgaWQ6IGtleSwgc3R5bGV9LCBjbG9uZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gUmVuZGVyIHRoZSBiYWNrZ3JvdW5kIGVsZW1lbnRzICh0eXBpY2FsbHkgcmVhY3QtbWFwLWdsIGluc3RhbmNlcylcbiAgICAvLyB1c2luZyB0aGUgdmlld3BvcnQgZGVzY3JpcHRvcnNcbiAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuX3JlbmRlckNoaWxkcmVuVW5kZXJWaWV3cG9ydHModGhpcy5jaGlsZHJlbik7XG5cbiAgICAvLyBSZW5kZXIgZGVjay5nbCBhcyBsYXN0IGNoaWxkXG4gICAgY29uc3Qge2lkLCB3aWR0aCwgaGVpZ2h0LCBzdHlsZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IGRlY2sgPSBjcmVhdGVFbGVtZW50KCdjYW52YXMnLCB7XG4gICAgICByZWY6IGMgPT4gKHRoaXMub3ZlcmxheSA9IGMpLFxuICAgICAga2V5OiAnb3ZlcmxheScsXG4gICAgICBpZCxcbiAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCB7cG9zaXRpb246ICdhYnNvbHV0ZScsIGxlZnQ6IDAsIHRvcDogMCwgd2lkdGgsIGhlaWdodH0sIHN0eWxlKVxuICAgIH0pO1xuICAgIGNoaWxkcmVuLnB1c2goZGVjayk7XG5cbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudCgnZGl2Jywge2lkOiAnZGVja2dsLXdyYXBwZXInfSwgY2hpbGRyZW4pO1xuICB9XG59XG5cbkRlY2tHTC5wcm9wVHlwZXMgPSBEZWNrR0xKUy5wcm9wVHlwZXM7XG5EZWNrR0wuZGVmYXVsdFByb3BzID0gRGVja0dMSlMuZGVmYXVsdFByb3BzO1xuIl19