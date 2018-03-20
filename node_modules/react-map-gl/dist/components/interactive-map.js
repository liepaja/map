'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _react = require('react');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _staticMap = require('./static-map');

var _staticMap2 = _interopRequireDefault(_staticMap);

var _mapState = require('../utils/map-state');

var _viewportMercatorProject = require('viewport-mercator-project');

var _viewportMercatorProject2 = _interopRequireDefault(_viewportMercatorProject);

var _transitionManager = require('../utils/transition-manager');

var _transitionManager2 = _interopRequireDefault(_transitionManager);

var _mjolnir = require('mjolnir.js');

var _mapControls = require('../utils/map-controls');

var _mapControls2 = _interopRequireDefault(_mapControls);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _deprecateWarn = require('../utils/deprecate-warn');

var _deprecateWarn2 = _interopRequireDefault(_deprecateWarn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var propTypes = (0, _assign2.default)({}, _staticMap2.default.propTypes, {
  // Additional props on top of StaticMap

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
  // TransitionInterpolator instance, can be used to perform custom transitions.
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
  // Multitouch zoom
  touchZoom: _propTypes2.default.bool,
  // Multitouch rotate
  touchRotate: _propTypes2.default.bool,
  // Keyboard
  keyboard: _propTypes2.default.bool,

  /**
     * Called when the map is hovered over.
     * @callback
     * @param {Object} event - The mouse event.
     * @param {[Number, Number]} event.lngLat - The coordinates of the pointer
     * @param {Array} event.features - The features under the pointer, using Mapbox's
     * queryRenderedFeatures API:
     * https://www.mapbox.com/mapbox-gl-js/api/#Map#queryRenderedFeatures
     * To make a layer interactive, set the `interactive` property in the
     * layer style to `true`. See Mapbox's style spec
     * https://www.mapbox.com/mapbox-gl-style-spec/#layer-interactive
     */
  onHover: _propTypes2.default.func,
  /**
    * Called when the map is clicked.
    * @callback
    * @param {Object} event - The mouse event.
    * @param {[Number, Number]} event.lngLat - The coordinates of the pointer
    * @param {Array} event.features - The features under the pointer, using Mapbox's
    * queryRenderedFeatures API:
    * https://www.mapbox.com/mapbox-gl-js/api/#Map#queryRenderedFeatures
    * To make a layer interactive, set the `interactive` property in the
    * layer style to `true`. See Mapbox's style spec
    * https://www.mapbox.com/mapbox-gl-style-spec/#layer-interactive
    */
  onClick: _propTypes2.default.func,

  /** Radius to detect features around a clicked point. Defaults to 0. */
  clickRadius: _propTypes2.default.number,

  /** Accessor that returns a cursor style to show interactive state */
  getCursor: _propTypes2.default.func,

  /** Advanced features */
  // Contraints for displaying the map. If not met, then the map is hidden.
  // Experimental! May be changed in minor version updates.
  visibilityConstraints: _propTypes2.default.shape({
    minZoom: _propTypes2.default.number,
    maxZoom: _propTypes2.default.number,
    minPitch: _propTypes2.default.number,
    maxPitch: _propTypes2.default.number
  }),
  // A map control instance to replace the default map controls
  // The object must expose one property: `events` as an array of subscribed
  // event names; and two methods: `setState(state)` and `handle(event)`
  mapControls: _propTypes2.default.shape({
    events: _propTypes2.default.arrayOf(_propTypes2.default.string),
    handleEvent: _propTypes2.default.func
  })
});

var getDefaultCursor = function getDefaultCursor(_ref) {
  var isDragging = _ref.isDragging,
      isHovering = _ref.isHovering;
  return isDragging ? _config2.default.CURSOR.GRABBING : isHovering ? _config2.default.CURSOR.POINTER : _config2.default.CURSOR.GRAB;
};

var defaultProps = (0, _assign2.default)({}, _staticMap2.default.defaultProps, _mapState.MAPBOX_LIMITS, _transitionManager2.default.defaultProps, {
  onViewportChange: null,
  onClick: null,
  onHover: null,

  scrollZoom: true,
  dragPan: true,
  dragRotate: true,
  doubleClickZoom: true,

  clickRadius: 0,
  getCursor: getDefaultCursor,

  visibilityConstraints: _mapState.MAPBOX_LIMITS
});

var childContextTypes = {
  viewport: _propTypes2.default.instanceOf(_viewportMercatorProject2.default),
  isDragging: _propTypes2.default.bool,
  eventManager: _propTypes2.default.object
};

var InteractiveMap = function (_PureComponent) {
  (0, _inherits3.default)(InteractiveMap, _PureComponent);
  (0, _createClass3.default)(InteractiveMap, null, [{
    key: 'supported',
    value: function supported() {
      return _staticMap2.default.supported();
    }
  }]);

  function InteractiveMap(props) {
    (0, _classCallCheck3.default)(this, InteractiveMap);

    // Check for deprecated props
    var _this = (0, _possibleConstructorReturn3.default)(this, (InteractiveMap.__proto__ || (0, _getPrototypeOf2.default)(InteractiveMap)).call(this, props));

    (0, _deprecateWarn2.default)(props);

    _this.state = {
      // Whether the cursor is down
      isDragging: false,
      // Whether the cursor is over a clickable feature
      isHovering: false
    };

    // If props.mapControls is not provided, fallback to default MapControls instance
    // Cannot use defaultProps here because it needs to be per map instance
    _this._mapControls = props.mapControls || new _mapControls2.default();

    _this._eventManager = new _mjolnir.EventManager(null, { rightButton: true });

    _this.getMap = _this.getMap.bind(_this);
    _this.queryRenderedFeatures = _this.queryRenderedFeatures.bind(_this);
    _this._checkVisibilityConstraints = _this._checkVisibilityConstraints.bind(_this);
    _this._getFeatures = _this._getFeatures.bind(_this);
    _this._onInteractiveStateChange = _this._onInteractiveStateChange.bind(_this);
    _this._getPos = _this._getPos.bind(_this);
    _this._onMouseMove = _this._onMouseMove.bind(_this);
    _this._onMouseClick = _this._onMouseClick.bind(_this);
    _this._eventCanvasLoaded = _this._eventCanvasLoaded.bind(_this);
    _this._staticMapLoaded = _this._staticMapLoaded.bind(_this);
    return _this;
  }

  (0, _createClass3.default)(InteractiveMap, [{
    key: 'getChildContext',
    value: function getChildContext() {
      return {
        viewport: new _viewportMercatorProject2.default(this.props),
        isDragging: this.state.isDragging,
        eventManager: this._eventManager
      };
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var eventManager = this._eventManager;

      // Register additional event handlers for click and hover
      eventManager.on('mousemove', this._onMouseMove);
      eventManager.on('click', this._onMouseClick);

      this._mapControls.setOptions((0, _assign2.default)({}, this.props, {
        onStateChange: this._onInteractiveStateChange,
        eventManager: eventManager
      }));

      this._transitionManager = new _transitionManager2.default(this.props);
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps) {
      this._mapControls.setOptions(nextProps);
      this._transitionManager.processViewportChange(nextProps);
    }
  }, {
    key: 'getMap',
    value: function getMap() {
      return this._map ? this._map.getMap() : null;
    }
  }, {
    key: 'queryRenderedFeatures',
    value: function queryRenderedFeatures(geometry, options) {
      return this._map.queryRenderedFeatures(geometry, options);
    }

    // Checks a visibilityConstraints object to see if the map should be displayed

  }, {
    key: '_checkVisibilityConstraints',
    value: function _checkVisibilityConstraints(props) {
      var capitalize = function capitalize(s) {
        return s[0].toUpperCase() + s.slice(1);
      };

      var visibilityConstraints = props.visibilityConstraints;

      for (var propName in props) {
        var capitalizedPropName = capitalize(propName);
        var minPropName = 'min' + capitalizedPropName;
        var maxPropName = 'max' + capitalizedPropName;

        if (minPropName in visibilityConstraints && props[propName] < visibilityConstraints[minPropName]) {
          return false;
        }
        if (maxPropName in visibilityConstraints && props[propName] > visibilityConstraints[maxPropName]) {
          return false;
        }
      }
      return true;
    }
  }, {
    key: '_getFeatures',
    value: function _getFeatures(_ref2) {
      var pos = _ref2.pos,
          radius = _ref2.radius;

      var features = void 0;
      if (radius) {
        // Radius enables point features, like marker symbols, to be clicked.
        var size = radius;
        var bbox = [[pos[0] - size, pos[1] + size], [pos[0] + size, pos[1] - size]];
        features = this._map.queryRenderedFeatures(bbox);
      } else {
        features = this._map.queryRenderedFeatures(pos);
      }
      return features;
    }
  }, {
    key: '_onInteractiveStateChange',
    value: function _onInteractiveStateChange(_ref3) {
      var _ref3$isDragging = _ref3.isDragging,
          isDragging = _ref3$isDragging === undefined ? false : _ref3$isDragging;

      if (isDragging !== this.state.isDragging) {
        this.setState({ isDragging: isDragging });
      }
    }

    // HOVER AND CLICK

  }, {
    key: '_getPos',
    value: function _getPos(event) {
      var _event$offsetCenter = event.offsetCenter,
          x = _event$offsetCenter.x,
          y = _event$offsetCenter.y;

      return [x, y];
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      if (!this.state.isDragging) {
        var pos = this._getPos(event);
        var features = this._getFeatures({ pos: pos, radius: this.props.clickRadius });

        var isHovering = features && features.length > 0;
        if (isHovering !== this.state.isHovering) {
          this.setState({ isHovering: isHovering });
        }

        if (this.props.onHover) {
          var viewport = new _viewportMercatorProject2.default(this.props);
          event.lngLat = viewport.unproject(pos);
          event.features = features;

          this.props.onHover(event);
        }
      }
    }
  }, {
    key: '_onMouseClick',
    value: function _onMouseClick(event) {
      if (this.props.onClick) {
        var pos = this._getPos(event);
        var viewport = new _viewportMercatorProject2.default(this.props);
        event.lngLat = viewport.unproject(pos);
        event.features = this._getFeatures({ pos: pos, radius: this.props.clickRadius });

        this.props.onClick(event);
      }
    }
  }, {
    key: '_eventCanvasLoaded',
    value: function _eventCanvasLoaded(ref) {
      // This will be called with `null` after unmount, releasing event manager resource
      this._eventManager.setElement(ref);
    }
  }, {
    key: '_staticMapLoaded',
    value: function _staticMapLoaded(ref) {
      this._map = ref;
    }
  }, {
    key: 'render',
    value: function render() {
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
        ref: this._eventCanvasLoaded,
        style: eventCanvasStyle
      }, (0, _react.createElement)(_staticMap2.default, (0, _assign2.default)({}, this.props, this._transitionManager && this._transitionManager.getViewportInTransition(), {
        visible: this._checkVisibilityConstraints(this.props),
        ref: this._staticMapLoaded,
        children: this.props.children
      })));
    }
  }]);
  return InteractiveMap;
}(_react.PureComponent);

exports.default = InteractiveMap;


InteractiveMap.displayName = 'InteractiveMap';
InteractiveMap.propTypes = propTypes;
InteractiveMap.defaultProps = defaultProps;
InteractiveMap.childContextTypes = childContextTypes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21wb25lbnRzL2ludGVyYWN0aXZlLW1hcC5qcyJdLCJuYW1lcyI6WyJwcm9wVHlwZXMiLCJtYXhab29tIiwibnVtYmVyIiwibWluWm9vbSIsIm1heFBpdGNoIiwibWluUGl0Y2giLCJvblZpZXdwb3J0Q2hhbmdlIiwiZnVuYyIsInRyYW5zaXRpb25EdXJhdGlvbiIsInRyYW5zaXRpb25JbnRlcnBvbGF0b3IiLCJvYmplY3QiLCJ0cmFuc2l0aW9uSW50ZXJydXB0aW9uIiwidHJhbnNpdGlvbkVhc2luZyIsIm9uVHJhbnNpdGlvblN0YXJ0Iiwib25UcmFuc2l0aW9uSW50ZXJydXB0Iiwib25UcmFuc2l0aW9uRW5kIiwic2Nyb2xsWm9vbSIsImJvb2wiLCJkcmFnUGFuIiwiZHJhZ1JvdGF0ZSIsImRvdWJsZUNsaWNrWm9vbSIsInRvdWNoWm9vbSIsInRvdWNoUm90YXRlIiwia2V5Ym9hcmQiLCJvbkhvdmVyIiwib25DbGljayIsImNsaWNrUmFkaXVzIiwiZ2V0Q3Vyc29yIiwidmlzaWJpbGl0eUNvbnN0cmFpbnRzIiwic2hhcGUiLCJtYXBDb250cm9scyIsImV2ZW50cyIsImFycmF5T2YiLCJzdHJpbmciLCJoYW5kbGVFdmVudCIsImdldERlZmF1bHRDdXJzb3IiLCJpc0RyYWdnaW5nIiwiaXNIb3ZlcmluZyIsIkNVUlNPUiIsIkdSQUJCSU5HIiwiUE9JTlRFUiIsIkdSQUIiLCJkZWZhdWx0UHJvcHMiLCJjaGlsZENvbnRleHRUeXBlcyIsInZpZXdwb3J0IiwiaW5zdGFuY2VPZiIsImV2ZW50TWFuYWdlciIsIkludGVyYWN0aXZlTWFwIiwic3VwcG9ydGVkIiwicHJvcHMiLCJzdGF0ZSIsIl9tYXBDb250cm9scyIsIl9ldmVudE1hbmFnZXIiLCJyaWdodEJ1dHRvbiIsImdldE1hcCIsImJpbmQiLCJxdWVyeVJlbmRlcmVkRmVhdHVyZXMiLCJfY2hlY2tWaXNpYmlsaXR5Q29uc3RyYWludHMiLCJfZ2V0RmVhdHVyZXMiLCJfb25JbnRlcmFjdGl2ZVN0YXRlQ2hhbmdlIiwiX2dldFBvcyIsIl9vbk1vdXNlTW92ZSIsIl9vbk1vdXNlQ2xpY2siLCJfZXZlbnRDYW52YXNMb2FkZWQiLCJfc3RhdGljTWFwTG9hZGVkIiwib24iLCJzZXRPcHRpb25zIiwib25TdGF0ZUNoYW5nZSIsIl90cmFuc2l0aW9uTWFuYWdlciIsIm5leHRQcm9wcyIsInByb2Nlc3NWaWV3cG9ydENoYW5nZSIsIl9tYXAiLCJnZW9tZXRyeSIsIm9wdGlvbnMiLCJjYXBpdGFsaXplIiwicyIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJwcm9wTmFtZSIsImNhcGl0YWxpemVkUHJvcE5hbWUiLCJtaW5Qcm9wTmFtZSIsIm1heFByb3BOYW1lIiwicG9zIiwicmFkaXVzIiwiZmVhdHVyZXMiLCJzaXplIiwiYmJveCIsInNldFN0YXRlIiwiZXZlbnQiLCJvZmZzZXRDZW50ZXIiLCJ4IiwieSIsImxlbmd0aCIsImxuZ0xhdCIsInVucHJvamVjdCIsInJlZiIsInNldEVsZW1lbnQiLCJ3aWR0aCIsImhlaWdodCIsImV2ZW50Q2FudmFzU3R5bGUiLCJwb3NpdGlvbiIsImN1cnNvciIsImtleSIsInN0eWxlIiwiZ2V0Vmlld3BvcnRJblRyYW5zaXRpb24iLCJ2aXNpYmxlIiwiY2hpbGRyZW4iLCJkaXNwbGF5TmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOztBQUNBOzs7O0FBRUE7Ozs7QUFFQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLFlBQVksc0JBQWMsRUFBZCxFQUFrQixvQkFBVUEsU0FBNUIsRUFBdUM7QUFDdkQ7O0FBRUE7QUFDQTtBQUNBQyxXQUFTLG9CQUFVQyxNQUxvQztBQU12RDtBQUNBQyxXQUFTLG9CQUFVRCxNQVBvQztBQVF2RDtBQUNBRSxZQUFVLG9CQUFVRixNQVRtQztBQVV2RDtBQUNBRyxZQUFVLG9CQUFVSCxNQVhtQzs7QUFhdkQ7Ozs7O0FBS0FJLG9CQUFrQixvQkFBVUMsSUFsQjJCOztBQW9CdkQ7QUFDQTtBQUNBQyxzQkFBb0Isb0JBQVVOLE1BdEJ5QjtBQXVCdkQ7QUFDQU8sMEJBQXdCLG9CQUFVQyxNQXhCcUI7QUF5QnZEO0FBQ0FDLDBCQUF3QixvQkFBVVQsTUExQnFCO0FBMkJ2RDtBQUNBVSxvQkFBa0Isb0JBQVVMLElBNUIyQjtBQTZCdkQ7QUFDQU0scUJBQW1CLG9CQUFVTixJQTlCMEI7QUErQnZETyx5QkFBdUIsb0JBQVVQLElBL0JzQjtBQWdDdkRRLG1CQUFpQixvQkFBVVIsSUFoQzRCOztBQWtDdkQ7QUFDQTtBQUNBUyxjQUFZLG9CQUFVQyxJQXBDaUM7QUFxQ3ZEO0FBQ0FDLFdBQVMsb0JBQVVELElBdENvQztBQXVDdkQ7QUFDQUUsY0FBWSxvQkFBVUYsSUF4Q2lDO0FBeUN2RDtBQUNBRyxtQkFBaUIsb0JBQVVILElBMUM0QjtBQTJDdkQ7QUFDQUksYUFBVyxvQkFBVUosSUE1Q2tDO0FBNkN2RDtBQUNBSyxlQUFhLG9CQUFVTCxJQTlDZ0M7QUErQ3ZEO0FBQ0FNLFlBQVUsb0JBQVVOLElBaERtQzs7QUFrRHhEOzs7Ozs7Ozs7Ozs7QUFZQ08sV0FBUyxvQkFBVWpCLElBOURvQztBQStEdkQ7Ozs7Ozs7Ozs7OztBQVlBa0IsV0FBUyxvQkFBVWxCLElBM0VvQzs7QUE2RXZEO0FBQ0FtQixlQUFhLG9CQUFVeEIsTUE5RWdDOztBQWdGdkQ7QUFDQXlCLGFBQVcsb0JBQVVwQixJQWpGa0M7O0FBbUZ2RDtBQUNBO0FBQ0E7QUFDQXFCLHlCQUF1QixvQkFBVUMsS0FBVixDQUFnQjtBQUNyQzFCLGFBQVMsb0JBQVVELE1BRGtCO0FBRXJDRCxhQUFTLG9CQUFVQyxNQUZrQjtBQUdyQ0csY0FBVSxvQkFBVUgsTUFIaUI7QUFJckNFLGNBQVUsb0JBQVVGO0FBSmlCLEdBQWhCLENBdEZnQztBQTRGdkQ7QUFDQTtBQUNBO0FBQ0E0QixlQUFhLG9CQUFVRCxLQUFWLENBQWdCO0FBQzNCRSxZQUFRLG9CQUFVQyxPQUFWLENBQWtCLG9CQUFVQyxNQUE1QixDQURtQjtBQUUzQkMsaUJBQWEsb0JBQVUzQjtBQUZJLEdBQWhCO0FBL0YwQyxDQUF2QyxDQUFsQjs7QUFxR0EsSUFBTTRCLG1CQUFtQixTQUFuQkEsZ0JBQW1CO0FBQUEsTUFBRUMsVUFBRixRQUFFQSxVQUFGO0FBQUEsTUFBY0MsVUFBZCxRQUFjQSxVQUFkO0FBQUEsU0FBOEJELGFBQ3JELGlCQUFPRSxNQUFQLENBQWNDLFFBRHVDLEdBRXBERixhQUFhLGlCQUFPQyxNQUFQLENBQWNFLE9BQTNCLEdBQXFDLGlCQUFPRixNQUFQLENBQWNHLElBRjdCO0FBQUEsQ0FBekI7O0FBSUEsSUFBTUMsZUFBZSxzQkFBYyxFQUFkLEVBQ25CLG9CQUFVQSxZQURTLDJCQUNvQiw0QkFBa0JBLFlBRHRDLEVBRW5CO0FBQ0VwQyxvQkFBa0IsSUFEcEI7QUFFRW1CLFdBQVMsSUFGWDtBQUdFRCxXQUFTLElBSFg7O0FBS0VSLGNBQVksSUFMZDtBQU1FRSxXQUFTLElBTlg7QUFPRUMsY0FBWSxJQVBkO0FBUUVDLG1CQUFpQixJQVJuQjs7QUFVRU0sZUFBYSxDQVZmO0FBV0VDLGFBQVdRLGdCQVhiOztBQWFFUDtBQWJGLENBRm1CLENBQXJCOztBQW1CQSxJQUFNZSxvQkFBb0I7QUFDeEJDLFlBQVUsb0JBQVVDLFVBQVYsbUNBRGM7QUFFeEJULGNBQVksb0JBQVVuQixJQUZFO0FBR3hCNkIsZ0JBQWMsb0JBQVVwQztBQUhBLENBQTFCOztJQU1xQnFDLGM7Ozs7Z0NBRUE7QUFDakIsYUFBTyxvQkFBVUMsU0FBVixFQUFQO0FBQ0Q7OztBQUVELDBCQUFZQyxLQUFaLEVBQW1CO0FBQUE7O0FBRWpCO0FBRmlCLHNKQUNYQSxLQURXOztBQUdqQixpQ0FBY0EsS0FBZDs7QUFFQSxVQUFLQyxLQUFMLEdBQWE7QUFDWDtBQUNBZCxrQkFBWSxLQUZEO0FBR1g7QUFDQUMsa0JBQVk7QUFKRCxLQUFiOztBQU9BO0FBQ0E7QUFDQSxVQUFLYyxZQUFMLEdBQW9CRixNQUFNbkIsV0FBTixJQUFxQiwyQkFBekM7O0FBRUEsVUFBS3NCLGFBQUwsR0FBcUIsMEJBQWlCLElBQWpCLEVBQXVCLEVBQUNDLGFBQWEsSUFBZCxFQUF2QixDQUFyQjs7QUFFQSxVQUFLQyxNQUFMLEdBQWMsTUFBS0EsTUFBTCxDQUFZQyxJQUFaLE9BQWQ7QUFDQSxVQUFLQyxxQkFBTCxHQUE2QixNQUFLQSxxQkFBTCxDQUEyQkQsSUFBM0IsT0FBN0I7QUFDQSxVQUFLRSwyQkFBTCxHQUFtQyxNQUFLQSwyQkFBTCxDQUFpQ0YsSUFBakMsT0FBbkM7QUFDQSxVQUFLRyxZQUFMLEdBQW9CLE1BQUtBLFlBQUwsQ0FBa0JILElBQWxCLE9BQXBCO0FBQ0EsVUFBS0kseUJBQUwsR0FBaUMsTUFBS0EseUJBQUwsQ0FBK0JKLElBQS9CLE9BQWpDO0FBQ0EsVUFBS0ssT0FBTCxHQUFlLE1BQUtBLE9BQUwsQ0FBYUwsSUFBYixPQUFmO0FBQ0EsVUFBS00sWUFBTCxHQUFvQixNQUFLQSxZQUFMLENBQWtCTixJQUFsQixPQUFwQjtBQUNBLFVBQUtPLGFBQUwsR0FBcUIsTUFBS0EsYUFBTCxDQUFtQlAsSUFBbkIsT0FBckI7QUFDQSxVQUFLUSxrQkFBTCxHQUEwQixNQUFLQSxrQkFBTCxDQUF3QlIsSUFBeEIsT0FBMUI7QUFDQSxVQUFLUyxnQkFBTCxHQUF3QixNQUFLQSxnQkFBTCxDQUFzQlQsSUFBdEIsT0FBeEI7QUEzQmlCO0FBNEJsQjs7OztzQ0FFaUI7QUFDaEIsYUFBTztBQUNMWCxrQkFBVSxzQ0FBd0IsS0FBS0ssS0FBN0IsQ0FETDtBQUVMYixvQkFBWSxLQUFLYyxLQUFMLENBQVdkLFVBRmxCO0FBR0xVLHNCQUFjLEtBQUtNO0FBSGQsT0FBUDtBQUtEOzs7d0NBRW1CO0FBQ2xCLFVBQU1OLGVBQWUsS0FBS00sYUFBMUI7O0FBRUE7QUFDQU4sbUJBQWFtQixFQUFiLENBQWdCLFdBQWhCLEVBQTZCLEtBQUtKLFlBQWxDO0FBQ0FmLG1CQUFhbUIsRUFBYixDQUFnQixPQUFoQixFQUF5QixLQUFLSCxhQUE5Qjs7QUFFQSxXQUFLWCxZQUFMLENBQWtCZSxVQUFsQixDQUE2QixzQkFBYyxFQUFkLEVBQWtCLEtBQUtqQixLQUF2QixFQUE4QjtBQUN6RGtCLHVCQUFlLEtBQUtSLHlCQURxQztBQUV6RGI7QUFGeUQsT0FBOUIsQ0FBN0I7O0FBS0EsV0FBS3NCLGtCQUFMLEdBQTBCLGdDQUFzQixLQUFLbkIsS0FBM0IsQ0FBMUI7QUFDRDs7O3dDQUVtQm9CLFMsRUFBVztBQUM3QixXQUFLbEIsWUFBTCxDQUFrQmUsVUFBbEIsQ0FBNkJHLFNBQTdCO0FBQ0EsV0FBS0Qsa0JBQUwsQ0FBd0JFLHFCQUF4QixDQUE4Q0QsU0FBOUM7QUFDRDs7OzZCQUVRO0FBQ1AsYUFBTyxLQUFLRSxJQUFMLEdBQVksS0FBS0EsSUFBTCxDQUFVakIsTUFBVixFQUFaLEdBQWlDLElBQXhDO0FBQ0Q7OzswQ0FFcUJrQixRLEVBQVVDLE8sRUFBUztBQUN2QyxhQUFPLEtBQUtGLElBQUwsQ0FBVWYscUJBQVYsQ0FBZ0NnQixRQUFoQyxFQUEwQ0MsT0FBMUMsQ0FBUDtBQUNEOztBQUVEOzs7O2dEQUM0QnhCLEssRUFBTztBQUNqQyxVQUFNeUIsYUFBYSxTQUFiQSxVQUFhO0FBQUEsZUFBS0MsRUFBRSxDQUFGLEVBQUtDLFdBQUwsS0FBcUJELEVBQUVFLEtBQUYsQ0FBUSxDQUFSLENBQTFCO0FBQUEsT0FBbkI7O0FBRGlDLFVBRzFCakQscUJBSDBCLEdBR0RxQixLQUhDLENBRzFCckIscUJBSDBCOztBQUlqQyxXQUFLLElBQU1rRCxRQUFYLElBQXVCN0IsS0FBdkIsRUFBOEI7QUFDNUIsWUFBTThCLHNCQUFzQkwsV0FBV0ksUUFBWCxDQUE1QjtBQUNBLFlBQU1FLHNCQUFvQkQsbUJBQTFCO0FBQ0EsWUFBTUUsc0JBQW9CRixtQkFBMUI7O0FBRUEsWUFBSUMsZUFBZXBELHFCQUFmLElBQ0ZxQixNQUFNNkIsUUFBTixJQUFrQmxELHNCQUFzQm9ELFdBQXRCLENBRHBCLEVBQ3dEO0FBQ3RELGlCQUFPLEtBQVA7QUFDRDtBQUNELFlBQUlDLGVBQWVyRCxxQkFBZixJQUNGcUIsTUFBTTZCLFFBQU4sSUFBa0JsRCxzQkFBc0JxRCxXQUF0QixDQURwQixFQUN3RDtBQUN0RCxpQkFBTyxLQUFQO0FBQ0Q7QUFDRjtBQUNELGFBQU8sSUFBUDtBQUNEOzs7d0NBRTJCO0FBQUEsVUFBZEMsR0FBYyxTQUFkQSxHQUFjO0FBQUEsVUFBVEMsTUFBUyxTQUFUQSxNQUFTOztBQUMxQixVQUFJQyxpQkFBSjtBQUNBLFVBQUlELE1BQUosRUFBWTtBQUNWO0FBQ0EsWUFBTUUsT0FBT0YsTUFBYjtBQUNBLFlBQU1HLE9BQU8sQ0FBQyxDQUFDSixJQUFJLENBQUosSUFBU0csSUFBVixFQUFnQkgsSUFBSSxDQUFKLElBQVNHLElBQXpCLENBQUQsRUFBaUMsQ0FBQ0gsSUFBSSxDQUFKLElBQVNHLElBQVYsRUFBZ0JILElBQUksQ0FBSixJQUFTRyxJQUF6QixDQUFqQyxDQUFiO0FBQ0FELG1CQUFXLEtBQUtiLElBQUwsQ0FBVWYscUJBQVYsQ0FBZ0M4QixJQUFoQyxDQUFYO0FBQ0QsT0FMRCxNQUtPO0FBQ0xGLG1CQUFXLEtBQUtiLElBQUwsQ0FBVWYscUJBQVYsQ0FBZ0MwQixHQUFoQyxDQUFYO0FBQ0Q7QUFDRCxhQUFPRSxRQUFQO0FBQ0Q7OztxREFFK0M7QUFBQSxtQ0FBckJoRCxVQUFxQjtBQUFBLFVBQXJCQSxVQUFxQixvQ0FBUixLQUFROztBQUM5QyxVQUFJQSxlQUFlLEtBQUtjLEtBQUwsQ0FBV2QsVUFBOUIsRUFBMEM7QUFDeEMsYUFBS21ELFFBQUwsQ0FBYyxFQUFDbkQsc0JBQUQsRUFBZDtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7NEJBQ1FvRCxLLEVBQU87QUFBQSxnQ0FDa0JBLEtBRGxCLENBQ05DLFlBRE07QUFBQSxVQUNTQyxDQURULHVCQUNTQSxDQURUO0FBQUEsVUFDWUMsQ0FEWix1QkFDWUEsQ0FEWjs7QUFFYixhQUFPLENBQUNELENBQUQsRUFBSUMsQ0FBSixDQUFQO0FBQ0Q7OztpQ0FFWUgsSyxFQUFPO0FBQ2xCLFVBQUksQ0FBQyxLQUFLdEMsS0FBTCxDQUFXZCxVQUFoQixFQUE0QjtBQUMxQixZQUFNOEMsTUFBTSxLQUFLdEIsT0FBTCxDQUFhNEIsS0FBYixDQUFaO0FBQ0EsWUFBTUosV0FBVyxLQUFLMUIsWUFBTCxDQUFrQixFQUFDd0IsUUFBRCxFQUFNQyxRQUFRLEtBQUtsQyxLQUFMLENBQVd2QixXQUF6QixFQUFsQixDQUFqQjs7QUFFQSxZQUFNVyxhQUFhK0MsWUFBWUEsU0FBU1EsTUFBVCxHQUFrQixDQUFqRDtBQUNBLFlBQUl2RCxlQUFlLEtBQUthLEtBQUwsQ0FBV2IsVUFBOUIsRUFBMEM7QUFDeEMsZUFBS2tELFFBQUwsQ0FBYyxFQUFDbEQsc0JBQUQsRUFBZDtBQUNEOztBQUVELFlBQUksS0FBS1ksS0FBTCxDQUFXekIsT0FBZixFQUF3QjtBQUN0QixjQUFNb0IsV0FBVyxzQ0FBd0IsS0FBS0ssS0FBN0IsQ0FBakI7QUFDQXVDLGdCQUFNSyxNQUFOLEdBQWVqRCxTQUFTa0QsU0FBVCxDQUFtQlosR0FBbkIsQ0FBZjtBQUNBTSxnQkFBTUosUUFBTixHQUFpQkEsUUFBakI7O0FBRUEsZUFBS25DLEtBQUwsQ0FBV3pCLE9BQVgsQ0FBbUJnRSxLQUFuQjtBQUNEO0FBQ0Y7QUFDRjs7O2tDQUVhQSxLLEVBQU87QUFDbkIsVUFBSSxLQUFLdkMsS0FBTCxDQUFXeEIsT0FBZixFQUF3QjtBQUN0QixZQUFNeUQsTUFBTSxLQUFLdEIsT0FBTCxDQUFhNEIsS0FBYixDQUFaO0FBQ0EsWUFBTTVDLFdBQVcsc0NBQXdCLEtBQUtLLEtBQTdCLENBQWpCO0FBQ0F1QyxjQUFNSyxNQUFOLEdBQWVqRCxTQUFTa0QsU0FBVCxDQUFtQlosR0FBbkIsQ0FBZjtBQUNBTSxjQUFNSixRQUFOLEdBQWlCLEtBQUsxQixZQUFMLENBQWtCLEVBQUN3QixRQUFELEVBQU1DLFFBQVEsS0FBS2xDLEtBQUwsQ0FBV3ZCLFdBQXpCLEVBQWxCLENBQWpCOztBQUVBLGFBQUt1QixLQUFMLENBQVd4QixPQUFYLENBQW1CK0QsS0FBbkI7QUFDRDtBQUNGOzs7dUNBRWtCTyxHLEVBQUs7QUFDdEI7QUFDQSxXQUFLM0MsYUFBTCxDQUFtQjRDLFVBQW5CLENBQThCRCxHQUE5QjtBQUNEOzs7cUNBRWdCQSxHLEVBQUs7QUFDcEIsV0FBS3hCLElBQUwsR0FBWXdCLEdBQVo7QUFDRDs7OzZCQUVRO0FBQUEsbUJBQzRCLEtBQUs5QyxLQURqQztBQUFBLFVBQ0FnRCxLQURBLFVBQ0FBLEtBREE7QUFBQSxVQUNPQyxNQURQLFVBQ09BLE1BRFA7QUFBQSxVQUNldkUsU0FEZixVQUNlQSxTQURmOzs7QUFHUCxVQUFNd0UsbUJBQW1CO0FBQ3ZCRixvQkFEdUI7QUFFdkJDLHNCQUZ1QjtBQUd2QkUsa0JBQVUsVUFIYTtBQUl2QkMsZ0JBQVExRSxVQUFVLEtBQUt1QixLQUFmO0FBSmUsT0FBekI7O0FBT0EsYUFDRSwwQkFBYyxLQUFkLEVBQXFCO0FBQ25Cb0QsYUFBSyxjQURjO0FBRW5CUCxhQUFLLEtBQUtoQyxrQkFGUztBQUduQndDLGVBQU9KO0FBSFksT0FBckIsRUFLRSwrQ0FBeUIsc0JBQWMsRUFBZCxFQUFrQixLQUFLbEQsS0FBdkIsRUFDdkIsS0FBS21CLGtCQUFMLElBQTJCLEtBQUtBLGtCQUFMLENBQXdCb0MsdUJBQXhCLEVBREosRUFFdkI7QUFDRUMsaUJBQVMsS0FBS2hELDJCQUFMLENBQWlDLEtBQUtSLEtBQXRDLENBRFg7QUFFRThDLGFBQUssS0FBSy9CLGdCQUZaO0FBR0UwQyxrQkFBVSxLQUFLekQsS0FBTCxDQUFXeUQ7QUFIdkIsT0FGdUIsQ0FBekIsQ0FMRixDQURGO0FBZ0JEOzs7OztrQkF6TGtCM0QsYzs7O0FBNExyQkEsZUFBZTRELFdBQWYsR0FBNkIsZ0JBQTdCO0FBQ0E1RCxlQUFlL0MsU0FBZixHQUEyQkEsU0FBM0I7QUFDQStDLGVBQWVMLFlBQWYsR0FBOEJBLFlBQTlCO0FBQ0FLLGVBQWVKLGlCQUFmLEdBQW1DQSxpQkFBbkMiLCJmaWxlIjoiaW50ZXJhY3RpdmUtbWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtQdXJlQ29tcG9uZW50LCBjcmVhdGVFbGVtZW50fSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuXG5pbXBvcnQgU3RhdGljTWFwIGZyb20gJy4vc3RhdGljLW1hcCc7XG5pbXBvcnQge01BUEJPWF9MSU1JVFN9IGZyb20gJy4uL3V0aWxzL21hcC1zdGF0ZSc7XG5pbXBvcnQgV2ViTWVyY2F0b3JWaWV3cG9ydCBmcm9tICd2aWV3cG9ydC1tZXJjYXRvci1wcm9qZWN0JztcblxuaW1wb3J0IFRyYW5zaXRpb25NYW5hZ2VyIGZyb20gJy4uL3V0aWxzL3RyYW5zaXRpb24tbWFuYWdlcic7XG5cbmltcG9ydCB7RXZlbnRNYW5hZ2VyfSBmcm9tICdtam9sbmlyLmpzJztcbmltcG9ydCBNYXBDb250cm9scyBmcm9tICcuLi91dGlscy9tYXAtY29udHJvbHMnO1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IGRlcHJlY2F0ZVdhcm4gZnJvbSAnLi4vdXRpbHMvZGVwcmVjYXRlLXdhcm4nO1xuXG5jb25zdCBwcm9wVHlwZXMgPSBPYmplY3QuYXNzaWduKHt9LCBTdGF0aWNNYXAucHJvcFR5cGVzLCB7XG4gIC8vIEFkZGl0aW9uYWwgcHJvcHMgb24gdG9wIG9mIFN0YXRpY01hcFxuXG4gIC8qKiBWaWV3cG9ydCBjb25zdHJhaW50cyAqL1xuICAvLyBNYXggem9vbSBsZXZlbFxuICBtYXhab29tOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvLyBNaW4gem9vbSBsZXZlbFxuICBtaW5ab29tOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvLyBNYXggcGl0Y2ggaW4gZGVncmVlc1xuICBtYXhQaXRjaDogUHJvcFR5cGVzLm51bWJlcixcbiAgLy8gTWluIHBpdGNoIGluIGRlZ3JlZXNcbiAgbWluUGl0Y2g6IFByb3BUeXBlcy5udW1iZXIsXG5cbiAgLyoqXG4gICAqIGBvblZpZXdwb3J0Q2hhbmdlYCBjYWxsYmFjayBpcyBmaXJlZCB3aGVuIHRoZSB1c2VyIGludGVyYWN0ZWQgd2l0aCB0aGVcbiAgICogbWFwLiBUaGUgb2JqZWN0IHBhc3NlZCB0byB0aGUgY2FsbGJhY2sgY29udGFpbnMgdmlld3BvcnQgcHJvcGVydGllc1xuICAgKiBzdWNoIGFzIGBsb25naXR1ZGVgLCBgbGF0aXR1ZGVgLCBgem9vbWAgZXRjLlxuICAgKi9cbiAgb25WaWV3cG9ydENoYW5nZTogUHJvcFR5cGVzLmZ1bmMsXG5cbiAgLyoqIFZpZXdwb3J0IHRyYW5zaXRpb24gKiovXG4gIC8vIHRyYW5zaXRpb24gZHVyYXRpb24gZm9yIHZpZXdwb3J0IGNoYW5nZVxuICB0cmFuc2l0aW9uRHVyYXRpb246IFByb3BUeXBlcy5udW1iZXIsXG4gIC8vIFRyYW5zaXRpb25JbnRlcnBvbGF0b3IgaW5zdGFuY2UsIGNhbiBiZSB1c2VkIHRvIHBlcmZvcm0gY3VzdG9tIHRyYW5zaXRpb25zLlxuICB0cmFuc2l0aW9uSW50ZXJwb2xhdG9yOiBQcm9wVHlwZXMub2JqZWN0LFxuICAvLyB0eXBlIG9mIGludGVycnVwdGlvbiBvZiBjdXJyZW50IHRyYW5zaXRpb24gb24gdXBkYXRlLlxuICB0cmFuc2l0aW9uSW50ZXJydXB0aW9uOiBQcm9wVHlwZXMubnVtYmVyLFxuICAvLyBlYXNpbmcgZnVuY3Rpb25cbiAgdHJhbnNpdGlvbkVhc2luZzogUHJvcFR5cGVzLmZ1bmMsXG4gIC8vIHRyYW5zaXRpb24gc3RhdHVzIHVwZGF0ZSBmdW5jdGlvbnNcbiAgb25UcmFuc2l0aW9uU3RhcnQ6IFByb3BUeXBlcy5mdW5jLFxuICBvblRyYW5zaXRpb25JbnRlcnJ1cHQ6IFByb3BUeXBlcy5mdW5jLFxuICBvblRyYW5zaXRpb25FbmQ6IFByb3BUeXBlcy5mdW5jLFxuXG4gIC8qKiBFbmFibGVzIGNvbnRyb2wgZXZlbnQgaGFuZGxpbmcgKi9cbiAgLy8gU2Nyb2xsIHRvIHpvb21cbiAgc2Nyb2xsWm9vbTogUHJvcFR5cGVzLmJvb2wsXG4gIC8vIERyYWcgdG8gcGFuXG4gIGRyYWdQYW46IFByb3BUeXBlcy5ib29sLFxuICAvLyBEcmFnIHRvIHJvdGF0ZVxuICBkcmFnUm90YXRlOiBQcm9wVHlwZXMuYm9vbCxcbiAgLy8gRG91YmxlIGNsaWNrIHRvIHpvb21cbiAgZG91YmxlQ2xpY2tab29tOiBQcm9wVHlwZXMuYm9vbCxcbiAgLy8gTXVsdGl0b3VjaCB6b29tXG4gIHRvdWNoWm9vbTogUHJvcFR5cGVzLmJvb2wsXG4gIC8vIE11bHRpdG91Y2ggcm90YXRlXG4gIHRvdWNoUm90YXRlOiBQcm9wVHlwZXMuYm9vbCxcbiAgLy8gS2V5Ym9hcmRcbiAga2V5Ym9hcmQ6IFByb3BUeXBlcy5ib29sLFxuXG4gLyoqXG4gICAgKiBDYWxsZWQgd2hlbiB0aGUgbWFwIGlzIGhvdmVyZWQgb3Zlci5cbiAgICAqIEBjYWxsYmFja1xuICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gVGhlIG1vdXNlIGV2ZW50LlxuICAgICogQHBhcmFtIHtbTnVtYmVyLCBOdW1iZXJdfSBldmVudC5sbmdMYXQgLSBUaGUgY29vcmRpbmF0ZXMgb2YgdGhlIHBvaW50ZXJcbiAgICAqIEBwYXJhbSB7QXJyYXl9IGV2ZW50LmZlYXR1cmVzIC0gVGhlIGZlYXR1cmVzIHVuZGVyIHRoZSBwb2ludGVyLCB1c2luZyBNYXBib3gnc1xuICAgICogcXVlcnlSZW5kZXJlZEZlYXR1cmVzIEFQSTpcbiAgICAqIGh0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LWdsLWpzL2FwaS8jTWFwI3F1ZXJ5UmVuZGVyZWRGZWF0dXJlc1xuICAgICogVG8gbWFrZSBhIGxheWVyIGludGVyYWN0aXZlLCBzZXQgdGhlIGBpbnRlcmFjdGl2ZWAgcHJvcGVydHkgaW4gdGhlXG4gICAgKiBsYXllciBzdHlsZSB0byBgdHJ1ZWAuIFNlZSBNYXBib3gncyBzdHlsZSBzcGVjXG4gICAgKiBodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1zdHlsZS1zcGVjLyNsYXllci1pbnRlcmFjdGl2ZVxuICAgICovXG4gIG9uSG92ZXI6IFByb3BUeXBlcy5mdW5jLFxuICAvKipcbiAgICAqIENhbGxlZCB3aGVuIHRoZSBtYXAgaXMgY2xpY2tlZC5cbiAgICAqIEBjYWxsYmFja1xuICAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gVGhlIG1vdXNlIGV2ZW50LlxuICAgICogQHBhcmFtIHtbTnVtYmVyLCBOdW1iZXJdfSBldmVudC5sbmdMYXQgLSBUaGUgY29vcmRpbmF0ZXMgb2YgdGhlIHBvaW50ZXJcbiAgICAqIEBwYXJhbSB7QXJyYXl9IGV2ZW50LmZlYXR1cmVzIC0gVGhlIGZlYXR1cmVzIHVuZGVyIHRoZSBwb2ludGVyLCB1c2luZyBNYXBib3gnc1xuICAgICogcXVlcnlSZW5kZXJlZEZlYXR1cmVzIEFQSTpcbiAgICAqIGh0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LWdsLWpzL2FwaS8jTWFwI3F1ZXJ5UmVuZGVyZWRGZWF0dXJlc1xuICAgICogVG8gbWFrZSBhIGxheWVyIGludGVyYWN0aXZlLCBzZXQgdGhlIGBpbnRlcmFjdGl2ZWAgcHJvcGVydHkgaW4gdGhlXG4gICAgKiBsYXllciBzdHlsZSB0byBgdHJ1ZWAuIFNlZSBNYXBib3gncyBzdHlsZSBzcGVjXG4gICAgKiBodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC1nbC1zdHlsZS1zcGVjLyNsYXllci1pbnRlcmFjdGl2ZVxuICAgICovXG4gIG9uQ2xpY2s6IFByb3BUeXBlcy5mdW5jLFxuXG4gIC8qKiBSYWRpdXMgdG8gZGV0ZWN0IGZlYXR1cmVzIGFyb3VuZCBhIGNsaWNrZWQgcG9pbnQuIERlZmF1bHRzIHRvIDAuICovXG4gIGNsaWNrUmFkaXVzOiBQcm9wVHlwZXMubnVtYmVyLFxuXG4gIC8qKiBBY2Nlc3NvciB0aGF0IHJldHVybnMgYSBjdXJzb3Igc3R5bGUgdG8gc2hvdyBpbnRlcmFjdGl2ZSBzdGF0ZSAqL1xuICBnZXRDdXJzb3I6IFByb3BUeXBlcy5mdW5jLFxuXG4gIC8qKiBBZHZhbmNlZCBmZWF0dXJlcyAqL1xuICAvLyBDb250cmFpbnRzIGZvciBkaXNwbGF5aW5nIHRoZSBtYXAuIElmIG5vdCBtZXQsIHRoZW4gdGhlIG1hcCBpcyBoaWRkZW4uXG4gIC8vIEV4cGVyaW1lbnRhbCEgTWF5IGJlIGNoYW5nZWQgaW4gbWlub3IgdmVyc2lvbiB1cGRhdGVzLlxuICB2aXNpYmlsaXR5Q29uc3RyYWludHM6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgbWluWm9vbTogUHJvcFR5cGVzLm51bWJlcixcbiAgICBtYXhab29tOiBQcm9wVHlwZXMubnVtYmVyLFxuICAgIG1pblBpdGNoOiBQcm9wVHlwZXMubnVtYmVyLFxuICAgIG1heFBpdGNoOiBQcm9wVHlwZXMubnVtYmVyXG4gIH0pLFxuICAvLyBBIG1hcCBjb250cm9sIGluc3RhbmNlIHRvIHJlcGxhY2UgdGhlIGRlZmF1bHQgbWFwIGNvbnRyb2xzXG4gIC8vIFRoZSBvYmplY3QgbXVzdCBleHBvc2Ugb25lIHByb3BlcnR5OiBgZXZlbnRzYCBhcyBhbiBhcnJheSBvZiBzdWJzY3JpYmVkXG4gIC8vIGV2ZW50IG5hbWVzOyBhbmQgdHdvIG1ldGhvZHM6IGBzZXRTdGF0ZShzdGF0ZSlgIGFuZCBgaGFuZGxlKGV2ZW50KWBcbiAgbWFwQ29udHJvbHM6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgZXZlbnRzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuc3RyaW5nKSxcbiAgICBoYW5kbGVFdmVudDogUHJvcFR5cGVzLmZ1bmNcbiAgfSlcbn0pO1xuXG5jb25zdCBnZXREZWZhdWx0Q3Vyc29yID0gKHtpc0RyYWdnaW5nLCBpc0hvdmVyaW5nfSkgPT4gaXNEcmFnZ2luZyA/XG4gIGNvbmZpZy5DVVJTT1IuR1JBQkJJTkcgOlxuICAoaXNIb3ZlcmluZyA/IGNvbmZpZy5DVVJTT1IuUE9JTlRFUiA6IGNvbmZpZy5DVVJTT1IuR1JBQik7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sXG4gIFN0YXRpY01hcC5kZWZhdWx0UHJvcHMsIE1BUEJPWF9MSU1JVFMsIFRyYW5zaXRpb25NYW5hZ2VyLmRlZmF1bHRQcm9wcyxcbiAge1xuICAgIG9uVmlld3BvcnRDaGFuZ2U6IG51bGwsXG4gICAgb25DbGljazogbnVsbCxcbiAgICBvbkhvdmVyOiBudWxsLFxuXG4gICAgc2Nyb2xsWm9vbTogdHJ1ZSxcbiAgICBkcmFnUGFuOiB0cnVlLFxuICAgIGRyYWdSb3RhdGU6IHRydWUsXG4gICAgZG91YmxlQ2xpY2tab29tOiB0cnVlLFxuXG4gICAgY2xpY2tSYWRpdXM6IDAsXG4gICAgZ2V0Q3Vyc29yOiBnZXREZWZhdWx0Q3Vyc29yLFxuXG4gICAgdmlzaWJpbGl0eUNvbnN0cmFpbnRzOiBNQVBCT1hfTElNSVRTXG4gIH1cbik7XG5cbmNvbnN0IGNoaWxkQ29udGV4dFR5cGVzID0ge1xuICB2aWV3cG9ydDogUHJvcFR5cGVzLmluc3RhbmNlT2YoV2ViTWVyY2F0b3JWaWV3cG9ydCksXG4gIGlzRHJhZ2dpbmc6IFByb3BUeXBlcy5ib29sLFxuICBldmVudE1hbmFnZXI6IFByb3BUeXBlcy5vYmplY3Rcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEludGVyYWN0aXZlTWFwIGV4dGVuZHMgUHVyZUNvbXBvbmVudCB7XG5cbiAgc3RhdGljIHN1cHBvcnRlZCgpIHtcbiAgICByZXR1cm4gU3RhdGljTWFwLnN1cHBvcnRlZCgpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgLy8gQ2hlY2sgZm9yIGRlcHJlY2F0ZWQgcHJvcHNcbiAgICBkZXByZWNhdGVXYXJuKHByb3BzKTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAvLyBXaGV0aGVyIHRoZSBjdXJzb3IgaXMgZG93blxuICAgICAgaXNEcmFnZ2luZzogZmFsc2UsXG4gICAgICAvLyBXaGV0aGVyIHRoZSBjdXJzb3IgaXMgb3ZlciBhIGNsaWNrYWJsZSBmZWF0dXJlXG4gICAgICBpc0hvdmVyaW5nOiBmYWxzZVxuICAgIH07XG5cbiAgICAvLyBJZiBwcm9wcy5tYXBDb250cm9scyBpcyBub3QgcHJvdmlkZWQsIGZhbGxiYWNrIHRvIGRlZmF1bHQgTWFwQ29udHJvbHMgaW5zdGFuY2VcbiAgICAvLyBDYW5ub3QgdXNlIGRlZmF1bHRQcm9wcyBoZXJlIGJlY2F1c2UgaXQgbmVlZHMgdG8gYmUgcGVyIG1hcCBpbnN0YW5jZVxuICAgIHRoaXMuX21hcENvbnRyb2xzID0gcHJvcHMubWFwQ29udHJvbHMgfHwgbmV3IE1hcENvbnRyb2xzKCk7XG5cbiAgICB0aGlzLl9ldmVudE1hbmFnZXIgPSBuZXcgRXZlbnRNYW5hZ2VyKG51bGwsIHtyaWdodEJ1dHRvbjogdHJ1ZX0pO1xuXG4gICAgdGhpcy5nZXRNYXAgPSB0aGlzLmdldE1hcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMucXVlcnlSZW5kZXJlZEZlYXR1cmVzID0gdGhpcy5xdWVyeVJlbmRlcmVkRmVhdHVyZXMuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9jaGVja1Zpc2liaWxpdHlDb25zdHJhaW50cyA9IHRoaXMuX2NoZWNrVmlzaWJpbGl0eUNvbnN0cmFpbnRzLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fZ2V0RmVhdHVyZXMgPSB0aGlzLl9nZXRGZWF0dXJlcy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX29uSW50ZXJhY3RpdmVTdGF0ZUNoYW5nZSA9IHRoaXMuX29uSW50ZXJhY3RpdmVTdGF0ZUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX2dldFBvcyA9IHRoaXMuX2dldFBvcy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX29uTW91c2VNb3ZlID0gdGhpcy5fb25Nb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9vbk1vdXNlQ2xpY2sgPSB0aGlzLl9vbk1vdXNlQ2xpY2suYmluZCh0aGlzKTtcbiAgICB0aGlzLl9ldmVudENhbnZhc0xvYWRlZCA9IHRoaXMuX2V2ZW50Q2FudmFzTG9hZGVkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fc3RhdGljTWFwTG9hZGVkID0gdGhpcy5fc3RhdGljTWFwTG9hZGVkLmJpbmQodGhpcyk7XG4gIH1cblxuICBnZXRDaGlsZENvbnRleHQoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZpZXdwb3J0OiBuZXcgV2ViTWVyY2F0b3JWaWV3cG9ydCh0aGlzLnByb3BzKSxcbiAgICAgIGlzRHJhZ2dpbmc6IHRoaXMuc3RhdGUuaXNEcmFnZ2luZyxcbiAgICAgIGV2ZW50TWFuYWdlcjogdGhpcy5fZXZlbnRNYW5hZ2VyXG4gICAgfTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IGV2ZW50TWFuYWdlciA9IHRoaXMuX2V2ZW50TWFuYWdlcjtcblxuICAgIC8vIFJlZ2lzdGVyIGFkZGl0aW9uYWwgZXZlbnQgaGFuZGxlcnMgZm9yIGNsaWNrIGFuZCBob3ZlclxuICAgIGV2ZW50TWFuYWdlci5vbignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpO1xuICAgIGV2ZW50TWFuYWdlci5vbignY2xpY2snLCB0aGlzLl9vbk1vdXNlQ2xpY2spO1xuXG4gICAgdGhpcy5fbWFwQ29udHJvbHMuc2V0T3B0aW9ucyhPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLCB7XG4gICAgICBvblN0YXRlQ2hhbmdlOiB0aGlzLl9vbkludGVyYWN0aXZlU3RhdGVDaGFuZ2UsXG4gICAgICBldmVudE1hbmFnZXJcbiAgICB9KSk7XG5cbiAgICB0aGlzLl90cmFuc2l0aW9uTWFuYWdlciA9IG5ldyBUcmFuc2l0aW9uTWFuYWdlcih0aGlzLnByb3BzKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGUobmV4dFByb3BzKSB7XG4gICAgdGhpcy5fbWFwQ29udHJvbHMuc2V0T3B0aW9ucyhuZXh0UHJvcHMpO1xuICAgIHRoaXMuX3RyYW5zaXRpb25NYW5hZ2VyLnByb2Nlc3NWaWV3cG9ydENoYW5nZShuZXh0UHJvcHMpO1xuICB9XG5cbiAgZ2V0TWFwKCkge1xuICAgIHJldHVybiB0aGlzLl9tYXAgPyB0aGlzLl9tYXAuZ2V0TWFwKCkgOiBudWxsO1xuICB9XG5cbiAgcXVlcnlSZW5kZXJlZEZlYXR1cmVzKGdlb21ldHJ5LCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuX21hcC5xdWVyeVJlbmRlcmVkRmVhdHVyZXMoZ2VvbWV0cnksIG9wdGlvbnMpO1xuICB9XG5cbiAgLy8gQ2hlY2tzIGEgdmlzaWJpbGl0eUNvbnN0cmFpbnRzIG9iamVjdCB0byBzZWUgaWYgdGhlIG1hcCBzaG91bGQgYmUgZGlzcGxheWVkXG4gIF9jaGVja1Zpc2liaWxpdHlDb25zdHJhaW50cyhwcm9wcykge1xuICAgIGNvbnN0IGNhcGl0YWxpemUgPSBzID0+IHNbMF0udG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSk7XG5cbiAgICBjb25zdCB7dmlzaWJpbGl0eUNvbnN0cmFpbnRzfSA9IHByb3BzO1xuICAgIGZvciAoY29uc3QgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgIGNvbnN0IGNhcGl0YWxpemVkUHJvcE5hbWUgPSBjYXBpdGFsaXplKHByb3BOYW1lKTtcbiAgICAgIGNvbnN0IG1pblByb3BOYW1lID0gYG1pbiR7Y2FwaXRhbGl6ZWRQcm9wTmFtZX1gO1xuICAgICAgY29uc3QgbWF4UHJvcE5hbWUgPSBgbWF4JHtjYXBpdGFsaXplZFByb3BOYW1lfWA7XG5cbiAgICAgIGlmIChtaW5Qcm9wTmFtZSBpbiB2aXNpYmlsaXR5Q29uc3RyYWludHMgJiZcbiAgICAgICAgcHJvcHNbcHJvcE5hbWVdIDwgdmlzaWJpbGl0eUNvbnN0cmFpbnRzW21pblByb3BOYW1lXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAobWF4UHJvcE5hbWUgaW4gdmlzaWJpbGl0eUNvbnN0cmFpbnRzICYmXG4gICAgICAgIHByb3BzW3Byb3BOYW1lXSA+IHZpc2liaWxpdHlDb25zdHJhaW50c1ttYXhQcm9wTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIF9nZXRGZWF0dXJlcyh7cG9zLCByYWRpdXN9KSB7XG4gICAgbGV0IGZlYXR1cmVzO1xuICAgIGlmIChyYWRpdXMpIHtcbiAgICAgIC8vIFJhZGl1cyBlbmFibGVzIHBvaW50IGZlYXR1cmVzLCBsaWtlIG1hcmtlciBzeW1ib2xzLCB0byBiZSBjbGlja2VkLlxuICAgICAgY29uc3Qgc2l6ZSA9IHJhZGl1cztcbiAgICAgIGNvbnN0IGJib3ggPSBbW3Bvc1swXSAtIHNpemUsIHBvc1sxXSArIHNpemVdLCBbcG9zWzBdICsgc2l6ZSwgcG9zWzFdIC0gc2l6ZV1dO1xuICAgICAgZmVhdHVyZXMgPSB0aGlzLl9tYXAucXVlcnlSZW5kZXJlZEZlYXR1cmVzKGJib3gpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmZWF0dXJlcyA9IHRoaXMuX21hcC5xdWVyeVJlbmRlcmVkRmVhdHVyZXMocG9zKTtcbiAgICB9XG4gICAgcmV0dXJuIGZlYXR1cmVzO1xuICB9XG5cbiAgX29uSW50ZXJhY3RpdmVTdGF0ZUNoYW5nZSh7aXNEcmFnZ2luZyA9IGZhbHNlfSkge1xuICAgIGlmIChpc0RyYWdnaW5nICE9PSB0aGlzLnN0YXRlLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2lzRHJhZ2dpbmd9KTtcbiAgICB9XG4gIH1cblxuICAvLyBIT1ZFUiBBTkQgQ0xJQ0tcbiAgX2dldFBvcyhldmVudCkge1xuICAgIGNvbnN0IHtvZmZzZXRDZW50ZXI6IHt4LCB5fX0gPSBldmVudDtcbiAgICByZXR1cm4gW3gsIHldO1xuICB9XG5cbiAgX29uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzRHJhZ2dpbmcpIHtcbiAgICAgIGNvbnN0IHBvcyA9IHRoaXMuX2dldFBvcyhldmVudCk7XG4gICAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMuX2dldEZlYXR1cmVzKHtwb3MsIHJhZGl1czogdGhpcy5wcm9wcy5jbGlja1JhZGl1c30pO1xuXG4gICAgICBjb25zdCBpc0hvdmVyaW5nID0gZmVhdHVyZXMgJiYgZmVhdHVyZXMubGVuZ3RoID4gMDtcbiAgICAgIGlmIChpc0hvdmVyaW5nICE9PSB0aGlzLnN0YXRlLmlzSG92ZXJpbmcpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNIb3ZlcmluZ30pO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5wcm9wcy5vbkhvdmVyKSB7XG4gICAgICAgIGNvbnN0IHZpZXdwb3J0ID0gbmV3IFdlYk1lcmNhdG9yVmlld3BvcnQodGhpcy5wcm9wcyk7XG4gICAgICAgIGV2ZW50LmxuZ0xhdCA9IHZpZXdwb3J0LnVucHJvamVjdChwb3MpO1xuICAgICAgICBldmVudC5mZWF0dXJlcyA9IGZlYXR1cmVzO1xuXG4gICAgICAgIHRoaXMucHJvcHMub25Ib3ZlcihldmVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX29uTW91c2VDbGljayhldmVudCkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgIGNvbnN0IHBvcyA9IHRoaXMuX2dldFBvcyhldmVudCk7XG4gICAgICBjb25zdCB2aWV3cG9ydCA9IG5ldyBXZWJNZXJjYXRvclZpZXdwb3J0KHRoaXMucHJvcHMpO1xuICAgICAgZXZlbnQubG5nTGF0ID0gdmlld3BvcnQudW5wcm9qZWN0KHBvcyk7XG4gICAgICBldmVudC5mZWF0dXJlcyA9IHRoaXMuX2dldEZlYXR1cmVzKHtwb3MsIHJhZGl1czogdGhpcy5wcm9wcy5jbGlja1JhZGl1c30pO1xuXG4gICAgICB0aGlzLnByb3BzLm9uQ2xpY2soZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIF9ldmVudENhbnZhc0xvYWRlZChyZWYpIHtcbiAgICAvLyBUaGlzIHdpbGwgYmUgY2FsbGVkIHdpdGggYG51bGxgIGFmdGVyIHVubW91bnQsIHJlbGVhc2luZyBldmVudCBtYW5hZ2VyIHJlc291cmNlXG4gICAgdGhpcy5fZXZlbnRNYW5hZ2VyLnNldEVsZW1lbnQocmVmKTtcbiAgfVxuXG4gIF9zdGF0aWNNYXBMb2FkZWQocmVmKSB7XG4gICAgdGhpcy5fbWFwID0gcmVmO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0LCBnZXRDdXJzb3J9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IGV2ZW50Q2FudmFzU3R5bGUgPSB7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgY3Vyc29yOiBnZXRDdXJzb3IodGhpcy5zdGF0ZSlcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIGNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcbiAgICAgICAga2V5OiAnbWFwLWNvbnRyb2xzJyxcbiAgICAgICAgcmVmOiB0aGlzLl9ldmVudENhbnZhc0xvYWRlZCxcbiAgICAgICAgc3R5bGU6IGV2ZW50Q2FudmFzU3R5bGVcbiAgICAgIH0sXG4gICAgICAgIGNyZWF0ZUVsZW1lbnQoU3RhdGljTWFwLCBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLFxuICAgICAgICAgIHRoaXMuX3RyYW5zaXRpb25NYW5hZ2VyICYmIHRoaXMuX3RyYW5zaXRpb25NYW5hZ2VyLmdldFZpZXdwb3J0SW5UcmFuc2l0aW9uKCksXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmlzaWJsZTogdGhpcy5fY2hlY2tWaXNpYmlsaXR5Q29uc3RyYWludHModGhpcy5wcm9wcyksXG4gICAgICAgICAgICByZWY6IHRoaXMuX3N0YXRpY01hcExvYWRlZCxcbiAgICAgICAgICAgIGNoaWxkcmVuOiB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgfVxuICAgICAgICApKVxuICAgICAgKVxuICAgICk7XG4gIH1cbn1cblxuSW50ZXJhY3RpdmVNYXAuZGlzcGxheU5hbWUgPSAnSW50ZXJhY3RpdmVNYXAnO1xuSW50ZXJhY3RpdmVNYXAucHJvcFR5cGVzID0gcHJvcFR5cGVzO1xuSW50ZXJhY3RpdmVNYXAuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuSW50ZXJhY3RpdmVNYXAuY2hpbGRDb250ZXh0VHlwZXMgPSBjaGlsZENvbnRleHRUeXBlcztcbiJdfQ==