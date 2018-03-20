'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _viewportControls = require('./viewport-controls');

var _viewportControls2 = _interopRequireDefault(_viewportControls);

var _mapState = require('./map-state');

var _mapState2 = _interopRequireDefault(_mapState);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2015 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var MapControls = function (_ViewportControls) {
  _inherits(MapControls, _ViewportControls);

  /**
   * @classdesc
   * A class that handles events and updates mercator style viewport parameters
   */
  function MapControls(options) {
    _classCallCheck(this, MapControls);

    return _possibleConstructorReturn(this, (MapControls.__proto__ || Object.getPrototypeOf(MapControls)).call(this, _mapState2.default, options));
  }

  // Default handler for the `panmove` event.


  _createClass(MapControls, [{
    key: '_onPan',
    value: function _onPan(event) {
      return this.isFunctionKeyPressed(event) ? this._onPanRotate(event) : this._onPanMove(event);
    }
  }]);

  return MapControls;
}(_viewportControls2.default);

exports.default = MapControls;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2NvbnRyb2xsZXJzL21hcC1jb250cm9scy5qcyJdLCJuYW1lcyI6WyJNYXBDb250cm9scyIsIm9wdGlvbnMiLCJldmVudCIsImlzRnVuY3Rpb25LZXlQcmVzc2VkIiwiX29uUGFuUm90YXRlIiwiX29uUGFuTW92ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFvQkE7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUFyQkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBS3FCQSxXOzs7QUFDbkI7Ozs7QUFJQSx1QkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBLHlJQUNIQSxPQURHO0FBRXBCOztBQUVEOzs7OzsyQkFDT0MsSyxFQUFPO0FBQ1osYUFBTyxLQUFLQyxvQkFBTCxDQUEwQkQsS0FBMUIsSUFBbUMsS0FBS0UsWUFBTCxDQUFrQkYsS0FBbEIsQ0FBbkMsR0FBOEQsS0FBS0csVUFBTCxDQUFnQkgsS0FBaEIsQ0FBckU7QUFDRDs7Ozs7O2tCQVprQkYsVyIsImZpbGUiOiJtYXAtY29udHJvbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cblxuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQgVmlld3BvcnRDb250cm9scyBmcm9tICcuL3ZpZXdwb3J0LWNvbnRyb2xzJztcbmltcG9ydCBNYXBTdGF0ZSBmcm9tICcuL21hcC1zdGF0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hcENvbnRyb2xzIGV4dGVuZHMgVmlld3BvcnRDb250cm9scyB7XG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIEEgY2xhc3MgdGhhdCBoYW5kbGVzIGV2ZW50cyBhbmQgdXBkYXRlcyBtZXJjYXRvciBzdHlsZSB2aWV3cG9ydCBwYXJhbWV0ZXJzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoTWFwU3RhdGUsIG9wdGlvbnMpO1xuICB9XG5cbiAgLy8gRGVmYXVsdCBoYW5kbGVyIGZvciB0aGUgYHBhbm1vdmVgIGV2ZW50LlxuICBfb25QYW4oZXZlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5pc0Z1bmN0aW9uS2V5UHJlc3NlZChldmVudCkgPyB0aGlzLl9vblBhblJvdGF0ZShldmVudCkgOiB0aGlzLl9vblBhbk1vdmUoZXZlbnQpO1xuICB9XG59XG4iXX0=