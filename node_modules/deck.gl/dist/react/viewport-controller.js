'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _mjolnir = require('mjolnir.js');

var _core = require('../core');

var _cursors = require('./utils/cursors');

var _cursors2 = _interopRequireDefault(_cursors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ViewportControls = _core.experimental.ViewportControls,
    TransitionManager = _core.experimental.TransitionManager;


var propTypes = {
  viewportState: _propTypes2.default.func,
  state: _propTypes2.default.object,

  /** Viewport props */
  /** The width of the map. */
  width: _propTypes2.default.number.isRequired,
  /** The height of the map. */
  height: _propTypes2.default.number.isRequired,
  /** The longitude of the center of the map. */
  longitude: _propTypes2.default.number.isRequired,
  /** The latitude of the center of the map. */
  latitude: _propTypes2.default.number.isRequired,
  /** The tile zoom level of the map. */
  zoom: _propTypes2.default.number.isRequired,
  /** Specify the bearing of the viewport */
  bearing: _propTypes2.default.number,
  /** Specify the pitch of the viewport */
  pitch: _propTypes2.default.number,
  /** Altitude of the viewport camera. Default 1.5 "screen heights" */
  // Note: Non-public API, see https://github.com/mapbox/mapbox-gl-js/issues/1137
  altitude: _propTypes2.default.number,
  // Camera position for FirstPersonViewport
  position: _propTypes2.default.array,

  /** Viewport constraints */
  // Max zoom level
  maxZoom: _propTypes2.default.number,
  // Min zoom level
  minZoom: _propTypes2.default.number,
  // Max pitch in degrees
  maxPitch: _propTypes2.default.number,
  // Min pitch in degrees
  minPitch: _propTypes2.default.number,

  /**
   * `onViewportChange` callback is fired when the user interacted with the
   * map. The object passed to the callback contains viewport properties
   * such as `longitude`, `latitude`, `zoom` etc.
   */
  onViewportChange: _propTypes2.default.func,

  /** Viewport transition **/
  // transition duration for viewport change
  transitionDuration: _propTypes2.default.number,
  // an instance of ViewportTransitionInterpolator, can be used to perform custom transitions.
  transitionInterpolator: _propTypes2.default.object,
  // type of interruption of current transition on update.
  transitionInterruption: _propTypes2.default.number,
  // easing function
  transitionEasing: _propTypes2.default.func,
  // transition status update functions
  onTransitionStart: _propTypes2.default.func,
  onTransitionInterrupt: _propTypes2.default.func,
  onTransitionEnd: _propTypes2.default.func,

  /** Enables control event handling */
  // Scroll to zoom
  scrollZoom: _propTypes2.default.bool,
  // Drag to pan
  dragPan: _propTypes2.default.bool,
  // Drag to rotate
  dragRotate: _propTypes2.default.bool,
  // Double click to zoom
  doubleClickZoom: _propTypes2.default.bool,
  // Pinch to zoom / rotate
  touchZoomRotate: _propTypes2.default.bool,

  /** Accessor that returns a cursor style to show interactive state */
  getCursor: _propTypes2.default.func,

  // A map control instance to replace the default map controls
  // The object must expose one property: `events` as an array of subscribed
  // event names; and two methods: `setState(state)` and `handle(event)`
  controls: _propTypes2.default.shape({
    events: _propTypes2.default.arrayOf(_propTypes2.default.string),
    handleEvent: _propTypes2.default.func
  })
};

var getDefaultCursor = function getDefaultCursor(_ref) {
  var isDragging = _ref.isDragging;
  return isDragging ? _cursors2.default.GRABBING : _cursors2.default.GRAB;
};

var defaultProps = Object.assign({}, TransitionManager.defaultProps, {
  onViewportChange: null,

  scrollZoom: true,
  dragPan: true,
  dragRotate: true,
  doubleClickZoom: true,
  touchZoomRotate: true,

  getCursor: getDefaultCursor
});

var ViewportController = function (_Component) {
  _inherits(ViewportController, _Component);

  function ViewportController(props) {
    _classCallCheck(this, ViewportController);

    var _this = _possibleConstructorReturn(this, (ViewportController.__proto__ || Object.getPrototypeOf(ViewportController)).call(this, props));

    _this.state = {
      isDragging: false // Whether the cursor is down
    };
    return _this;
  }

  _createClass(ViewportController, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._eventManager = new _mjolnir.EventManager(this.eventCanvas);

      // If props.controls is not provided, fallback to default MapControls instance
      // Cannot use defaultProps here because it needs to be per map instance
      this._controls = this.props.controls || new ViewportControls(this.props.viewportState);

      this._controls.setOptions(Object.assign({}, this.props, {
        onStateChange: this._onInteractiveStateChange.bind(this),
        eventManager: this._eventManager
      }));

      this._transitionManger = new TransitionManager(this.props);
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      if (this._transitionManger) {
        var transitionTriggered = this._transitionManger.processViewportChange(nextProps);
        // Skip this render to avoid jump during viewport transitions.
        return !transitionTriggered;
      }
      return true;
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps) {
      if (this._controls) {
        this._controls.setOptions(nextProps);
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._eventManager.destroy();
    }
  }, {
    key: '_onInteractiveStateChange',
    value: function _onInteractiveStateChange(_ref2) {
      var _ref2$isDragging = _ref2.isDragging,
          isDragging = _ref2$isDragging === undefined ? false : _ref2$isDragging;

      if (isDragging !== this.state.isDragging) {
        this.setState({ isDragging: isDragging });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          width = _props.width,
          height = _props.height,
          getCursor = _props.getCursor;


      var eventCanvasStyle = {
        width: width,
        height: height,
        position: 'relative',
        cursor: getCursor(this.state)
      };

      return (0, _react.createElement)('div', {
        key: 'map-controls',
        ref: function ref(c) {
          return _this2.eventCanvas = c;
        },
        style: eventCanvasStyle
      }, this.props.children);
    }
  }]);

  return ViewportController;
}(_react.Component);

exports.default = ViewportController;


ViewportController.displayName = 'ViewportController';
ViewportController.propTypes = propTypes;
ViewportController.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZWFjdC92aWV3cG9ydC1jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbIlZpZXdwb3J0Q29udHJvbHMiLCJUcmFuc2l0aW9uTWFuYWdlciIsInByb3BUeXBlcyIsInZpZXdwb3J0U3RhdGUiLCJmdW5jIiwic3RhdGUiLCJvYmplY3QiLCJ3aWR0aCIsIm51bWJlciIsImlzUmVxdWlyZWQiLCJoZWlnaHQiLCJsb25naXR1ZGUiLCJsYXRpdHVkZSIsInpvb20iLCJiZWFyaW5nIiwicGl0Y2giLCJhbHRpdHVkZSIsInBvc2l0aW9uIiwiYXJyYXkiLCJtYXhab29tIiwibWluWm9vbSIsIm1heFBpdGNoIiwibWluUGl0Y2giLCJvblZpZXdwb3J0Q2hhbmdlIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvbkludGVycG9sYXRvciIsInRyYW5zaXRpb25JbnRlcnJ1cHRpb24iLCJ0cmFuc2l0aW9uRWFzaW5nIiwib25UcmFuc2l0aW9uU3RhcnQiLCJvblRyYW5zaXRpb25JbnRlcnJ1cHQiLCJvblRyYW5zaXRpb25FbmQiLCJzY3JvbGxab29tIiwiYm9vbCIsImRyYWdQYW4iLCJkcmFnUm90YXRlIiwiZG91YmxlQ2xpY2tab29tIiwidG91Y2hab29tUm90YXRlIiwiZ2V0Q3Vyc29yIiwiY29udHJvbHMiLCJzaGFwZSIsImV2ZW50cyIsImFycmF5T2YiLCJzdHJpbmciLCJoYW5kbGVFdmVudCIsImdldERlZmF1bHRDdXJzb3IiLCJpc0RyYWdnaW5nIiwiR1JBQkJJTkciLCJHUkFCIiwiZGVmYXVsdFByb3BzIiwiT2JqZWN0IiwiYXNzaWduIiwiVmlld3BvcnRDb250cm9sbGVyIiwicHJvcHMiLCJfZXZlbnRNYW5hZ2VyIiwiZXZlbnRDYW52YXMiLCJfY29udHJvbHMiLCJzZXRPcHRpb25zIiwib25TdGF0ZUNoYW5nZSIsIl9vbkludGVyYWN0aXZlU3RhdGVDaGFuZ2UiLCJiaW5kIiwiZXZlbnRNYW5hZ2VyIiwiX3RyYW5zaXRpb25NYW5nZXIiLCJuZXh0UHJvcHMiLCJuZXh0U3RhdGUiLCJ0cmFuc2l0aW9uVHJpZ2dlcmVkIiwicHJvY2Vzc1ZpZXdwb3J0Q2hhbmdlIiwiZGVzdHJveSIsInNldFN0YXRlIiwiZXZlbnRDYW52YXNTdHlsZSIsImN1cnNvciIsImtleSIsInJlZiIsImMiLCJzdHlsZSIsImNoaWxkcmVuIiwiZGlzcGxheU5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFFQTs7QUFDQTs7QUFHQTs7Ozs7Ozs7Ozs7O0lBRk9BLGdCLHNCQUFBQSxnQjtJQUFrQkMsaUIsc0JBQUFBLGlCOzs7QUFJekIsSUFBTUMsWUFBWTtBQUNoQkMsaUJBQWUsb0JBQVVDLElBRFQ7QUFFaEJDLFNBQU8sb0JBQVVDLE1BRkQ7O0FBSWhCO0FBQ0E7QUFDQUMsU0FBTyxvQkFBVUMsTUFBVixDQUFpQkMsVUFOUjtBQU9oQjtBQUNBQyxVQUFRLG9CQUFVRixNQUFWLENBQWlCQyxVQVJUO0FBU2hCO0FBQ0FFLGFBQVcsb0JBQVVILE1BQVYsQ0FBaUJDLFVBVlo7QUFXaEI7QUFDQUcsWUFBVSxvQkFBVUosTUFBVixDQUFpQkMsVUFaWDtBQWFoQjtBQUNBSSxRQUFNLG9CQUFVTCxNQUFWLENBQWlCQyxVQWRQO0FBZWhCO0FBQ0FLLFdBQVMsb0JBQVVOLE1BaEJIO0FBaUJoQjtBQUNBTyxTQUFPLG9CQUFVUCxNQWxCRDtBQW1CaEI7QUFDQTtBQUNBUSxZQUFVLG9CQUFVUixNQXJCSjtBQXNCaEI7QUFDQVMsWUFBVSxvQkFBVUMsS0F2Qko7O0FBeUJoQjtBQUNBO0FBQ0FDLFdBQVMsb0JBQVVYLE1BM0JIO0FBNEJoQjtBQUNBWSxXQUFTLG9CQUFVWixNQTdCSDtBQThCaEI7QUFDQWEsWUFBVSxvQkFBVWIsTUEvQko7QUFnQ2hCO0FBQ0FjLFlBQVUsb0JBQVVkLE1BakNKOztBQW1DaEI7Ozs7O0FBS0FlLG9CQUFrQixvQkFBVW5CLElBeENaOztBQTBDaEI7QUFDQTtBQUNBb0Isc0JBQW9CLG9CQUFVaEIsTUE1Q2Q7QUE2Q2hCO0FBQ0Fp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TCxDQUFXd0MsVUFBOUIsRUFBMEM7QUFDeEMsYUFBS3NCLFFBQUwsQ0FBYyxFQUFDdEIsc0JBQUQsRUFBZDtBQUNEO0FBQ0Y7Ozs2QkFFUTtBQUFBOztBQUFBLG1CQUM0QixLQUFLTyxLQURqQztBQUFBLFVBQ0E3QyxLQURBLFVBQ0FBLEtBREE7QUFBQSxVQUNPRyxNQURQLFVBQ09BLE1BRFA7QUFBQSxVQUNlMkIsU0FEZixVQUNlQSxTQURmOzs7QUFHUCxVQUFNK0IsbUJBQW1CO0FBQ3ZCN0Qsb0JBRHVCO0FBRXZCRyxzQkFGdUI7QUFHdkJPLGtCQUFVLFVBSGE7QUFJdkJvRCxnQkFBUWhDLFVBQVUsS0FBS2hDLEtBQWY7QUFKZSxPQUF6Qjs7QUFPQSxhQUFPLDBCQUNMLEtBREssRUFFTDtBQUNFaUUsYUFBSyxjQURQO0FBRUVDLGFBQUs7QUFBQSxpQkFBTSxPQUFLakIsV0FBTCxHQUFtQmtCLENBQXpCO0FBQUEsU0FGUDtBQUdFQyxlQUFPTDtBQUhULE9BRkssRUFPTCxLQUFLaEIsS0FBTCxDQUFXc0IsUUFQTixDQUFQO0FBU0Q7Ozs7OztrQkF0RWtCdkIsa0I7OztBQXlFckJBLG1CQUFtQndCLFdBQW5CLEdBQWlDLG9CQUFqQztBQUNBeEIsbUJBQW1CakQsU0FBbkIsR0FBK0JBLFNBQS9CO0FBQ0FpRCxtQkFBbUJILFlBQW5CLEdBQWtDQSxZQUFsQyIsImZpbGUiOiJ2aWV3cG9ydC1jb250cm9sbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb25lbnQsIGNyZWF0ZUVsZW1lbnR9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5cbmltcG9ydCB7RXZlbnRNYW5hZ2VyfSBmcm9tICdtam9sbmlyLmpzJztcbmltcG9ydCB7ZXhwZXJpbWVudGFsfSBmcm9tICcuLi9jb3JlJztcbmNvbnN0IHtWaWV3cG9ydENvbnRyb2xzLCBUcmFuc2l0aW9uTWFuYWdlcn0gPSBleHBlcmltZW50YWw7XG5cbmltcG9ydCBDVVJTT1IgZnJvbSAnLi91dGlscy9jdXJzb3JzJztcblxuY29uc3QgcHJvcFR5cGVzID0ge1xuICB2aWV3cG9ydFN0YXRlOiBQcm9wVHlwZXMuZnVuYyxcbiAgc3RhdGU6IFByb3BUeXBlcy5vYmplY3QsXG5cbiAgLyoqIFZpZXdwb3J0IHByb3BzICovXG4gIC8qKiBUaGUgd2lkdGggb2YgdGhlIG1hcC4gKi9cbiAgd2lkdGg6IFByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIG1hcC4gKi9cbiAgaGVpZ2h0OiBQcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gIC8qKiBUaGUgbG9uZ2l0dWRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIG1hcC4gKi9cbiAgbG9uZ2l0dWRlOiBQcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gIC8qKiBUaGUgbGF0aXR1ZGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgbWFwLiAqL1xuICBsYXRpdHVkZTogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAvKiogVGhlIHRpbGUgem9vbSBsZXZlbCBvZiB0aGUgbWFwLiAqL1xuICB6b29tOiBQcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gIC8qKiBTcGVjaWZ5IHRoZSBiZWFyaW5nIG9mIHRoZSB2aWV3cG9ydCAqL1xuICBiZWFyaW5nOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvKiogU3BlY2lmeSB0aGUgcGl0Y2ggb2YgdGhlIHZpZXdwb3J0ICovXG4gIHBpdGNoOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvKiogQWx0aXR1ZGUgb2YgdGhlIHZpZXdwb3J0IGNhbWVyYS4gRGVmYXVsdCAxLjUgXCJzY3JlZW4gaGVpZ2h0c1wiICovXG4gIC8vIE5vdGU6IE5vbi1wdWJsaWMgQVBJLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcGJveC9tYXBib3gtZ2wtanMvaXNzdWVzLzExMzdcbiAgYWx0aXR1ZGU6IFByb3BUeXBlcy5udW1iZXIsXG4gIC8vIENhbWVyYSBwb3NpdGlvbiBmb3IgRmlyc3RQZXJzb25WaWV3cG9ydFxuICBwb3NpdGlvbjogUHJvcFR5cGVzLmFycmF5LFxuXG4gIC8qKiBWaWV3cG9ydCBjb25zdHJhaW50cyAqL1xuICAvLyBNYXggem9vbSBsZXZlbFxuICBtYXhab29tOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvLyBNaW4gem9vbSBsZXZlbFxuICBtaW5ab29tOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvLyBNYXggcGl0Y2ggaW4gZGVncmVlc1xuICBtYXhQaXRjaDogUHJvcFR5cGVzLm51bWJlcixcbiAgLy8gTWluIHBpdGNoIGluIGRlZ3JlZXNcbiAgbWluUGl0Y2g6IFByb3BUeXBlcy5udW1iZXIsXG5cbiAgLyoqXG4gICAqIGBvblZpZXdwb3J0Q2hhbmdlYCBjYWxsYmFjayBpcyBmaXJlZCB3aGVuIHRoZSB1c2VyIGludGVyYWN0ZWQgd2l0aCB0aGVcbiAgICogbWFwLiBUaGUgb2JqZWN0IHBhc3NlZCB0byB0aGUgY2FsbGJhY2sgY29udGFpbnMgdmlld3BvcnQgcHJvcGVydGllc1xuICAgKiBzdWNoIGFzIGBsb25naXR1ZGVgLCBgbGF0aXR1ZGVgLCBgem9vbWAgZXRjLlxuICAgKi9cbiAgb25WaWV3cG9ydENoYW5nZTogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgLyoqIFZpZXdwb3J0IHRyYW5zaXRpb24gKiovXG4gIC8vIHRyYW5zaXRpb24gZHVyYXRpb24gZm9yIHZpZXdwb3J0IGNoYW5nZVxuICB0cmFuc2l0aW9uRHVyYXRpb246IFByb3BUeXBlcy5udW1iZXIsXG4gIC8vIGFuIGluc3RhbmNlIG9mIFZpZXdwb3J0VHJhbnNpdGlvbkludGVycG9sYXRvciwgY2FuIGJlIHVzZWQgdG8gcGVyZm9ybSBjdXN0b20gdHJhbnNpdGlvbnMuXG4gIHRyYW5zaXRpb25JbnRlcnBvbGF0b3I6IFByb3BUeXBlcy5vYmplY3QsXG4gIC8vIHR5cGUgb2YgaW50ZXJydXB0aW9uIG9mIGN1cnJlbnQgdHJhbnNpdGlvbiBvbiB1cGRhdGUuXG4gIHRyYW5zaXRpb25JbnRlcnJ1cHRpb246IFByb3BUeXBlcy5udW1iZXIsXG4gIC8vIGVhc2luZyBmdW5jdGlvblxuICB0cmFuc2l0aW9uRWFzaW5nOiBQcm9wVHlwZXMuZnVuYyxcbiAgLy8gdHJhbnNpdGlvbiBzdGF0dXMgdXBkYXRlIGZ1bmN0aW9uc1xuICBvblRyYW5zaXRpb25TdGFydDogUHJvcFR5cGVzLmZ1bmMsXG4gIG9uVHJhbnNpdGlvbkludGVycnVwdDogUHJvcFR5cGVzLmZ1bmMsXG4gIG9uVHJhbnNpdGlvbkVuZDogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgLyoqIEVuYWJsZXMgY29udHJvbCBldmVudCBoYW5kbGluZyAqL1xuICAvLyBTY3JvbGwgdG8gem9vbVxuICBzY3JvbGxab29tOiBQcm9wVHlwZXMuYm9vbCxcbiAgLy8gRHJhZyB0byBwYW5cbiAgZHJhZ1BhbjogUHJvcFR5cGVzLmJvb2wsXG4gIC8vIERyYWcgdG8gcm90YXRlXG4gIGRyYWdSb3RhdGU6IFByb3BUeXBlcy5ib29sLFxuICAvLyBEb3VibGUgY2xpY2sgdG8gem9vbVxuICBkb3VibGVDbGlja1pvb206IFByb3BUeXBlcy5ib29sLFxuICAvLyBQaW5jaCB0byB6b29tIC8gcm90YXRlXG4gIHRvdWNoWm9vbVJvdGF0ZTogUHJvcFR5cGVzLmJvb2wsXG5cbiAgLyoqIEFjY2Vzc29yIHRoYXQgcmV0dXJucyBhIGN1cnNvciBzdHlsZSB0byBzaG93IGludGVyYWN0aXZlIHN0YXRlICovXG4gIGdldEN1cnNvcjogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgLy8gQSBtYXAgY29udHJvbCBpbnN0YW5jZSB0byByZXBsYWNlIHRoZSBkZWZhdWx0IG1hcCBjb250cm9sc1xuICAvLyBUaGUgb2JqZWN0IG11c3QgZXhwb3NlIG9uZSBwcm9wZXJ0eTogYGV2ZW50c2AgYXMgYW4gYXJyYXkgb2Ygc3Vic2NyaWJlZFxuICAvLyBldmVudCBuYW1lczsgYW5kIHR3byBtZXRob2RzOiBgc2V0U3RhdGUoc3RhdGUpYCBhbmQgYGhhbmRsZShldmVudClgXG4gIGNvbnRyb2xzOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgIGV2ZW50czogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnN0cmluZyksXG4gICAgaGFuZGxlRXZlbnQ6IFByb3BUeXBlcy5mdW5jXG4gIH0pXG59O1xuXG5jb25zdCBnZXREZWZhdWx0Q3Vyc29yID0gKHtpc0RyYWdnaW5nfSkgPT4gKGlzRHJhZ2dpbmcgPyBDVVJTT1IuR1JBQkJJTkcgOiBDVVJTT1IuR1JBQik7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIFRyYW5zaXRpb25NYW5hZ2VyLmRlZmF1bHRQcm9wcywge1xuICBvblZpZXdwb3J0Q2hhbmdlOiBudWxsLFxuXG4gIHNjcm9sbFpvb206IHRydWUsXG4gIGRyYWdQYW46IHRydWUsXG4gIGRyYWdSb3RhdGU6IHRydWUsXG4gIGRvdWJsZUNsaWNrWm9vbTogdHJ1ZSxcbiAgdG91Y2hab29tUm90YXRlOiB0cnVlLFxuXG4gIGdldEN1cnNvcjogZ2V0RGVmYXVsdEN1cnNvclxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZpZXdwb3J0Q29udHJvbGxlciBleHRlbmRzIENvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGlzRHJhZ2dpbmc6IGZhbHNlIC8vIFdoZXRoZXIgdGhlIGN1cnNvciBpcyBkb3duXG4gICAgfTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuX2V2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5ldmVudENhbnZhcyk7XG5cbiAgICAvLyBJZiBwcm9wcy5jb250cm9scyBpcyBub3QgcHJvdmlkZWQsIGZhbGxiYWNrIHRvIGRlZmF1bHQgTWFwQ29udHJvbHMgaW5zdGFuY2VcbiAgICAvLyBDYW5ub3QgdXNlIGRlZmF1bHRQcm9wcyBoZXJlIGJlY2F1c2UgaXQgbmVlZHMgdG8gYmUgcGVyIG1hcCBpbnN0YW5jZVxuICAgIHRoaXMuX2NvbnRyb2xzID0gdGhpcy5wcm9wcy5jb250cm9scyB8fCBuZXcgVmlld3BvcnRDb250cm9scyh0aGlzLnByb3BzLnZpZXdwb3J0U3RhdGUpO1xuXG4gICAgdGhpcy5fY29udHJvbHMuc2V0T3B0aW9ucyhcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIHRoaXMucHJvcHMsIHtcbiAgICAgICAgb25TdGF0ZUNoYW5nZTogdGhpcy5fb25JbnRlcmFjdGl2ZVN0YXRlQ2hhbmdlLmJpbmQodGhpcyksXG4gICAgICAgIGV2ZW50TWFuYWdlcjogdGhpcy5fZXZlbnRNYW5hZ2VyXG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLl90cmFuc2l0aW9uTWFuZ2VyID0gbmV3IFRyYW5zaXRpb25NYW5hZ2VyKHRoaXMucHJvcHMpO1xuICB9XG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgaWYgKHRoaXMuX3RyYW5zaXRpb25NYW5nZXIpIHtcbiAgICAgIGNvbnN0IHRyYW5zaXRpb25UcmlnZ2VyZWQgPSB0aGlzLl90cmFuc2l0aW9uTWFuZ2VyLnByb2Nlc3NWaWV3cG9ydENoYW5nZShuZXh0UHJvcHMpO1xuICAgICAgLy8gU2tpcCB0aGlzIHJlbmRlciB0byBhdm9pZCBqdW1wIGR1cmluZyB2aWV3cG9ydCB0cmFuc2l0aW9ucy5cbiAgICAgIHJldHVybiAhdHJhbnNpdGlvblRyaWdnZXJlZDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb21wb25lbnRXaWxsVXBkYXRlKG5leHRQcm9wcykge1xuICAgIGlmICh0aGlzLl9jb250cm9scykge1xuICAgICAgdGhpcy5fY29udHJvbHMuc2V0T3B0aW9ucyhuZXh0UHJvcHMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX2V2ZW50TWFuYWdlci5kZXN0cm95KCk7XG4gIH1cblxuICBfb25JbnRlcmFjdGl2ZVN0YXRlQ2hhbmdlKHtpc0RyYWdnaW5nID0gZmFsc2V9KSB7XG4gICAgaWYgKGlzRHJhZ2dpbmcgIT09IHRoaXMuc3RhdGUuaXNEcmFnZ2luZykge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNEcmFnZ2luZ30pO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodCwgZ2V0Q3Vyc29yfSA9IHRoaXMucHJvcHM7XG5cbiAgICBjb25zdCBldmVudENhbnZhc1N0eWxlID0ge1xuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgIGN1cnNvcjogZ2V0Q3Vyc29yKHRoaXMuc3RhdGUpXG4gICAgfTtcblxuICAgIHJldHVybiBjcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7XG4gICAgICAgIGtleTogJ21hcC1jb250cm9scycsXG4gICAgICAgIHJlZjogYyA9PiAodGhpcy5ldmVudENhbnZhcyA9IGMpLFxuICAgICAgICBzdHlsZTogZXZlbnRDYW52YXNTdHlsZVxuICAgICAgfSxcbiAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICApO1xuICB9XG59XG5cblZpZXdwb3J0Q29udHJvbGxlci5kaXNwbGF5TmFtZSA9ICdWaWV3cG9ydENvbnRyb2xsZXInO1xuVmlld3BvcnRDb250cm9sbGVyLnByb3BUeXBlcyA9IHByb3BUeXBlcztcblZpZXdwb3J0Q29udHJvbGxlci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=