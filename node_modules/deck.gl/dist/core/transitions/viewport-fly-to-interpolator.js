'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _transitionInterpolator = require('./transition-interpolator');

var _transitionInterpolator2 = _interopRequireDefault(_transitionInterpolator);

var _transitionUtils = require('./transition-utils');

var _viewportMercatorProject = require('viewport-mercator-project');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VIEWPORT_TRANSITION_PROPS = ['longitude', 'latitude', 'zoom', 'bearing', 'pitch'];
var REQUIRED_PROPS = ['latitude', 'longitude', 'zoom', 'width', 'height'];
var LINEARLY_INTERPOLATED_PROPS = ['bearing', 'pitch'];

/**
 * This class adapts mapbox-gl-js Map#flyTo animation so it can be used in
 * react/redux architecture.
 * mapbox-gl-js flyTo : https://www.mapbox.com/mapbox-gl-js/api/#map#flyto.
 * It implements “Smooth and efficient zooming and panning.” algorithm by
 * "Jarke J. van Wijk and Wim A.A. Nuij"
 */

var ViewportFlyToInterpolator = function (_TransitionInterpolat) {
  _inherits(ViewportFlyToInterpolator, _TransitionInterpolat);

  function ViewportFlyToInterpolator() {
    _classCallCheck(this, ViewportFlyToInterpolator);

    var _this = _possibleConstructorReturn(this, (ViewportFlyToInterpolator.__proto__ || Object.getPrototypeOf(ViewportFlyToInterpolator)).call(this));

    _this.propNames = VIEWPORT_TRANSITION_PROPS;
    return _this;
  }

  _createClass(ViewportFlyToInterpolator, [{
    key: 'initializeProps',
    value: function initializeProps(startProps, endProps) {
      var startViewportProps = {};
      var endViewportProps = {};

      // Check minimum required props
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = REQUIRED_PROPS[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          var startValue = startProps[key];
          var endValue = endProps[key];
          (0, _assert2.default)((0, _transitionUtils.isValid)(startValue) && (0, _transitionUtils.isValid)(endValue), key + ' must be supplied for transition');
          startViewportProps[key] = startValue;
          endViewportProps[key] = (0, _transitionUtils.getEndValueByShortestPath)(key, startValue, endValue);
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

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = LINEARLY_INTERPOLATED_PROPS[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _key = _step2.value;

          var _startValue = startProps[_key] || 0;
          var _endValue = endProps[_key] || 0;
          startViewportProps[_key] = _startValue;
          endViewportProps[_key] = (0, _transitionUtils.getEndValueByShortestPath)(_key, _startValue, _endValue);
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

      return {
        start: startViewportProps,
        end: endViewportProps
      };
    }
  }, {
    key: 'interpolateProps',
    value: function interpolateProps(startProps, endProps, t) {
      var viewport = (0, _viewportMercatorProject.flyToViewport)(startProps, endProps, t);

      // Linearly interpolate 'bearing' and 'pitch' if exist.
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = LINEARLY_INTERPOLATED_PROPS[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var key = _step3.value;

          viewport[key] = (0, _transitionUtils.lerp)(startProps[key], endProps[key], t);
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

      return viewport;
    }
  }]);

  return ViewportFlyToInterpolator;
}(_transitionInterpolator2.default);

exports.default = ViewportFlyToInterpolator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3RyYW5zaXRpb25zL3ZpZXdwb3J0LWZseS10by1pbnRlcnBvbGF0b3IuanMiXSwibmFtZXMiOlsiVklFV1BPUlRfVFJBTlNJVElPTl9QUk9QUyIsIlJFUVVJUkVEX1BST1BTIiwiTElORUFSTFlfSU5URVJQT0xBVEVEX1BST1BTIiwiVmlld3BvcnRGbHlUb0ludGVycG9sYXRvciIsInByb3BOYW1lcyIsInN0YXJ0UHJvcHMiLCJlbmRQcm9wcyIsInN0YXJ0Vmlld3BvcnRQcm9wcyIsImVuZFZpZXdwb3J0UHJvcHMiLCJrZXkiLCJzdGFydFZhbHVlIiwiZW5kVmFsdWUiLCJzdGFydCIsImVuZCIsInQiLCJ2aWV3cG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUVBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSw0QkFBNEIsQ0FBQyxXQUFELEVBQWMsVUFBZCxFQUEwQixNQUExQixFQUFrQyxTQUFsQyxFQUE2QyxPQUE3QyxDQUFsQztBQUNBLElBQU1DLGlCQUFpQixDQUFDLFVBQUQsRUFBYSxXQUFiLEVBQTBCLE1BQTFCLEVBQWtDLE9BQWxDLEVBQTJDLFFBQTNDLENBQXZCO0FBQ0EsSUFBTUMsOEJBQThCLENBQUMsU0FBRCxFQUFZLE9BQVosQ0FBcEM7O0FBRUE7Ozs7Ozs7O0lBT3FCQyx5Qjs7O0FBQ25CLHVDQUFjO0FBQUE7O0FBQUE7O0FBRVosVUFBS0MsU0FBTCxHQUFpQkoseUJBQWpCO0FBRlk7QUFHYjs7OztvQ0FFZUssVSxFQUFZQyxRLEVBQVU7QUFDcEMsVUFBTUMscUJBQXFCLEVBQTNCO0FBQ0EsVUFBTUMsbUJBQW1CLEVBQXpCOztBQUVBO0FBSm9DO0FBQUE7QUFBQTs7QUFBQTtBQUtwQyw2QkFBa0JQLGNBQWxCLDhIQUFrQztBQUFBLGNBQXZCUSxHQUF1Qjs7QUFDaEMsY0FBTUMsYUFBYUwsV0FBV0ksR0FBWCxDQUFuQjtBQUNBLGNBQU1FLFdBQVdMLFNBQVNHLEdBQVQsQ0FBakI7QUFDQSxnQ0FBTyw4QkFBUUMsVUFBUixLQUF1Qiw4QkFBUUMsUUFBUixDQUE5QixFQUFvREYsR0FBcEQ7QUFDQUYsNkJBQW1CRSxHQUFuQixJQUEwQkMsVUFBMUI7QUFDQUYsMkJBQWlCQyxHQUFqQixJQUF3QixnREFBMEJBLEdBQTFCLEVBQStCQyxVQUEvQixFQUEyQ0MsUUFBM0MsQ0FBeEI7QUFDRDtBQVhtQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQWFwQyw4QkFBa0JULDJCQUFsQixtSUFBK0M7QUFBQSxjQUFwQ08sSUFBb0M7O0FBQzdDLGNBQU1DLGNBQWFMLFdBQVdJLElBQVgsS0FBbUIsQ0FBdEM7QUFDQSxjQUFNRSxZQUFXTCxTQUFTRyxJQUFULEtBQWlCLENBQWxDO0FBQ0FGLDZCQUFtQkUsSUFBbkIsSUFBMEJDLFdBQTFCO0FBQ0FGLDJCQUFpQkMsSUFBakIsSUFBd0IsZ0RBQTBCQSxJQUExQixFQUErQkMsV0FBL0IsRUFBMkNDLFNBQTNDLENBQXhCO0FBQ0Q7QUFsQm1DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBb0JwQyxhQUFPO0FBQ0xDLGVBQU9MLGtCQURGO0FBRUxNLGFBQUtMO0FBRkEsT0FBUDtBQUlEOzs7cUNBRWdCSCxVLEVBQVlDLFEsRUFBVVEsQyxFQUFHO0FBQ3hDLFVBQU1DLFdBQVcsNENBQWNWLFVBQWQsRUFBMEJDLFFBQTFCLEVBQW9DUSxDQUFwQyxDQUFqQjs7QUFFQTtBQUh3QztBQUFBO0FBQUE7O0FBQUE7QUFJeEMsOEJBQWtCWiwyQkFBbEIsbUlBQStDO0FBQUEsY0FBcENPLEdBQW9DOztBQUM3Q00sbUJBQVNOLEdBQVQsSUFBZ0IsMkJBQUtKLFdBQVdJLEdBQVgsQ0FBTCxFQUFzQkgsU0FBU0csR0FBVCxDQUF0QixFQUFxQ0ssQ0FBckMsQ0FBaEI7QUFDRDtBQU51QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQVF4QyxhQUFPQyxRQUFQO0FBQ0Q7Ozs7OztrQkF6Q2tCWix5QiIsImZpbGUiOiJ2aWV3cG9ydC1mbHktdG8taW50ZXJwb2xhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRyYW5zaXRpb25JbnRlcnBvbGF0b3IgZnJvbSAnLi90cmFuc2l0aW9uLWludGVycG9sYXRvcic7XG5pbXBvcnQge2lzVmFsaWQsIGxlcnAsIGdldEVuZFZhbHVlQnlTaG9ydGVzdFBhdGh9IGZyb20gJy4vdHJhbnNpdGlvbi11dGlscyc7XG5cbmltcG9ydCB7Zmx5VG9WaWV3cG9ydH0gZnJvbSAndmlld3BvcnQtbWVyY2F0b3ItcHJvamVjdCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IFZJRVdQT1JUX1RSQU5TSVRJT05fUFJPUFMgPSBbJ2xvbmdpdHVkZScsICdsYXRpdHVkZScsICd6b29tJywgJ2JlYXJpbmcnLCAncGl0Y2gnXTtcbmNvbnN0IFJFUVVJUkVEX1BST1BTID0gWydsYXRpdHVkZScsICdsb25naXR1ZGUnLCAnem9vbScsICd3aWR0aCcsICdoZWlnaHQnXTtcbmNvbnN0IExJTkVBUkxZX0lOVEVSUE9MQVRFRF9QUk9QUyA9IFsnYmVhcmluZycsICdwaXRjaCddO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgYWRhcHRzIG1hcGJveC1nbC1qcyBNYXAjZmx5VG8gYW5pbWF0aW9uIHNvIGl0IGNhbiBiZSB1c2VkIGluXG4gKiByZWFjdC9yZWR1eCBhcmNoaXRlY3R1cmUuXG4gKiBtYXBib3gtZ2wtanMgZmx5VG8gOiBodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1qcy9hcGkvI21hcCNmbHl0by5cbiAqIEl0IGltcGxlbWVudHMg4oCcU21vb3RoIGFuZCBlZmZpY2llbnQgem9vbWluZyBhbmQgcGFubmluZy7igJ0gYWxnb3JpdGhtIGJ5XG4gKiBcIkphcmtlIEouIHZhbiBXaWprIGFuZCBXaW0gQS5BLiBOdWlqXCJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmlld3BvcnRGbHlUb0ludGVycG9sYXRvciBleHRlbmRzIFRyYW5zaXRpb25JbnRlcnBvbGF0b3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucHJvcE5hbWVzID0gVklFV1BPUlRfVFJBTlNJVElPTl9QUk9QUztcbiAgfVxuXG4gIGluaXRpYWxpemVQcm9wcyhzdGFydFByb3BzLCBlbmRQcm9wcykge1xuICAgIGNvbnN0IHN0YXJ0Vmlld3BvcnRQcm9wcyA9IHt9O1xuICAgIGNvbnN0IGVuZFZpZXdwb3J0UHJvcHMgPSB7fTtcblxuICAgIC8vIENoZWNrIG1pbmltdW0gcmVxdWlyZWQgcHJvcHNcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBSRVFVSVJFRF9QUk9QUykge1xuICAgICAgY29uc3Qgc3RhcnRWYWx1ZSA9IHN0YXJ0UHJvcHNba2V5XTtcbiAgICAgIGNvbnN0IGVuZFZhbHVlID0gZW5kUHJvcHNba2V5XTtcbiAgICAgIGFzc2VydChpc1ZhbGlkKHN0YXJ0VmFsdWUpICYmIGlzVmFsaWQoZW5kVmFsdWUpLCBgJHtrZXl9IG11c3QgYmUgc3VwcGxpZWQgZm9yIHRyYW5zaXRpb25gKTtcbiAgICAgIHN0YXJ0Vmlld3BvcnRQcm9wc1trZXldID0gc3RhcnRWYWx1ZTtcbiAgICAgIGVuZFZpZXdwb3J0UHJvcHNba2V5XSA9IGdldEVuZFZhbHVlQnlTaG9ydGVzdFBhdGgoa2V5LCBzdGFydFZhbHVlLCBlbmRWYWx1ZSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgTElORUFSTFlfSU5URVJQT0xBVEVEX1BST1BTKSB7XG4gICAgICBjb25zdCBzdGFydFZhbHVlID0gc3RhcnRQcm9wc1trZXldIHx8IDA7XG4gICAgICBjb25zdCBlbmRWYWx1ZSA9IGVuZFByb3BzW2tleV0gfHwgMDtcbiAgICAgIHN0YXJ0Vmlld3BvcnRQcm9wc1trZXldID0gc3RhcnRWYWx1ZTtcbiAgICAgIGVuZFZpZXdwb3J0UHJvcHNba2V5XSA9IGdldEVuZFZhbHVlQnlTaG9ydGVzdFBhdGgoa2V5LCBzdGFydFZhbHVlLCBlbmRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXJ0OiBzdGFydFZpZXdwb3J0UHJvcHMsXG4gICAgICBlbmQ6IGVuZFZpZXdwb3J0UHJvcHNcbiAgICB9O1xuICB9XG5cbiAgaW50ZXJwb2xhdGVQcm9wcyhzdGFydFByb3BzLCBlbmRQcm9wcywgdCkge1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gZmx5VG9WaWV3cG9ydChzdGFydFByb3BzLCBlbmRQcm9wcywgdCk7XG5cbiAgICAvLyBMaW5lYXJseSBpbnRlcnBvbGF0ZSAnYmVhcmluZycgYW5kICdwaXRjaCcgaWYgZXhpc3QuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgTElORUFSTFlfSU5URVJQT0xBVEVEX1BST1BTKSB7XG4gICAgICB2aWV3cG9ydFtrZXldID0gbGVycChzdGFydFByb3BzW2tleV0sIGVuZFByb3BzW2tleV0sIHQpO1xuICAgIH1cblxuICAgIHJldHVybiB2aWV3cG9ydDtcbiAgfVxufVxuIl19