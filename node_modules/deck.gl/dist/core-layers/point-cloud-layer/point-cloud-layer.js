'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _core = require('../../core');

var _luma = require('luma.gl');

var _pointCloudLayerVertex = require('./point-cloud-layer-vertex.glsl');

var _pointCloudLayerVertex2 = _interopRequireDefault(_pointCloudLayerVertex);

var _pointCloudLayerVertex3 = require('./point-cloud-layer-vertex-64.glsl');

var _pointCloudLayerVertex4 = _interopRequireDefault(_pointCloudLayerVertex3);

var _pointCloudLayerFragment = require('./point-cloud-layer-fragment.glsl');

var _pointCloudLayerFragment2 = _interopRequireDefault(_pointCloudLayerFragment);

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

var fp64LowPart = _core.experimental.fp64LowPart,
    enable64bitSupport = _core.experimental.enable64bitSupport;


var DEFAULT_COLOR = [0, 0, 0, 255];

var defaultProps = {
  radiusPixels: 10, //  point radius in pixels
  fp64: false,

  getPosition: function getPosition(x) {
    return x.position;
  },
  getNormal: function getNormal(x) {
    return x.normal;
  },
  getColor: function getColor(x) {
    return x.color || DEFAULT_COLOR;
  },

  lightSettings: {
    lightsPosition: [0, 0, 5000, -1000, 1000, 8000, 5000, -5000, 1000],
    ambientRatio: 0.2,
    diffuseRatio: 0.6,
    specularRatio: 0.8,
    lightsStrength: [1.0, 0.0, 0.8, 0.0, 0.4, 0.0],
    numberOfLights: 3
  }
};

var PointCloudLayer = function (_Layer) {
  _inherits(PointCloudLayer, _Layer);

  function PointCloudLayer() {
    _classCallCheck(this, PointCloudLayer);

    return _possibleConstructorReturn(this, (PointCloudLayer.__proto__ || Object.getPrototypeOf(PointCloudLayer)).apply(this, arguments));
  }

  _createClass(PointCloudLayer, [{
    key: 'getShaders',
    value: function getShaders(id) {
      var shaderCache = this.context.shaderCache;

      return enable64bitSupport(this.props) ? { vs: _pointCloudLayerVertex4.default, fs: _pointCloudLayerFragment2.default, modules: ['project64', 'lighting', 'picking'], shaderCache: shaderCache } : { vs: _pointCloudLayerVertex2.default, fs: _pointCloudLayerFragment2.default, modules: ['lighting', 'picking'], shaderCache: shaderCache }; // 'project' module added by default.
    }
  }, {
    key: 'initializeState',
    value: function initializeState() {
      /* eslint-disable max-len */
      this.state.attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          transition: true,
          accessor: 'getPosition',
          update: this.calculateInstancePositions
        },
        instanceNormals: {
          size: 3,
          transition: true,
          accessor: 'getNormal',
          defaultValue: 1,
          update: this.calculateInstanceNormals
        },
        instanceColors: {
          size: 4,
          type: _luma.GL.UNSIGNED_BYTE,
          transition: true,
          accessor: 'getColor',
          update: this.calculateInstanceColors
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
      var props = _ref2.props,
          oldProps = _ref2.oldProps,
          changeFlags = _ref2.changeFlags;

      _get(PointCloudLayer.prototype.__proto__ || Object.getPrototypeOf(PointCloudLayer.prototype), 'updateState', this).call(this, { props: props, oldProps: oldProps, changeFlags: changeFlags });
      if (props.fp64 !== oldProps.fp64) {
        var gl = this.context.gl;

        this.setState({ model: this._getModel(gl) });
      }
      this.updateAttribute({ props: props, oldProps: oldProps, changeFlags: changeFlags });
    }
  }, {
    key: 'draw',
    value: function draw(_ref3) {
      var uniforms = _ref3.uniforms;
      var _props = this.props,
          radiusPixels = _props.radiusPixels,
          lightSettings = _props.lightSettings;

      this.state.model.render(Object.assign({}, uniforms, {
        radiusPixels: radiusPixels
      }, lightSettings));
    }
  }, {
    key: '_getModel',
    value: function _getModel(gl) {
      // a triangle that minimally cover the unit circle
      var positions = [];
      for (var i = 0; i < 3; i++) {
        var angle = i / 3 * Math.PI * 2;
        positions.push(Math.cos(angle) * 2, Math.sin(angle) * 2, 0);
      }

      return new _luma.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _luma.Geometry({
          drawMode: _luma.GL.TRIANGLES,
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
      var _props2 = this.props,
          data = _props2.data,
          getPosition = _props2.getPosition;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;

          var position = getPosition(point);
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
      var _props3 = this.props,
          data = _props3.data,
          getPosition = _props3.getPosition;
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
    key: 'calculateInstanceNormals',
    value: function calculateInstanceNormals(attribute) {
      var _props4 = this.props,
          data = _props4.data,
          getNormal = _props4.getNormal;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;

          var normal = getNormal(point);
          value[i++] = normal[0];
          value[i++] = normal[1];
          value[i++] = normal[2];
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
      var _props5 = this.props,
          data = _props5.data,
          getColor = _props5.getColor;
      var value = attribute.value;

      var i = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = data[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var point = _step4.value;

          var color = getColor(point);
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

  return PointCloudLayer;
}(_core.Layer);

exports.default = PointCloudLayer;


PointCloudLayer.layerName = 'PointCloudLayer';
PointCloudLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9wb2ludC1jbG91ZC1sYXllci9wb2ludC1jbG91ZC1sYXllci5qcyJdLCJuYW1lcyI6WyJmcDY0TG93UGFydCIsImVuYWJsZTY0Yml0U3VwcG9ydCIsIkRFRkFVTFRfQ09MT1IiLCJkZWZhdWx0UHJvcHMiLCJyYWRpdXNQaXhlbHMiLCJmcDY0IiwiZ2V0UG9zaXRpb24iLCJ4IiwicG9zaXRpb24iLCJnZXROb3JtYWwiLCJub3JtYWwiLCJnZXRDb2xvciIsImNvbG9yIiwibGlnaHRTZXR0aW5ncyIsImxpZ2h0c1Bvc2l0aW9uIiwiYW1iaWVudFJhdGlvIiwiZGlmZnVzZVJhdGlvIiwic3BlY3VsYXJSYXRpbyIsImxpZ2h0c1N0cmVuZ3RoIiwibnVtYmVyT2ZMaWdodHMiLCJQb2ludENsb3VkTGF5ZXIiLCJpZCIsInNoYWRlckNhY2hlIiwiY29udGV4dCIsInByb3BzIiwidnMiLCJmcyIsIm1vZHVsZXMiLCJzdGF0ZSIsImF0dHJpYnV0ZU1hbmFnZXIiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBvc2l0aW9ucyIsInNpemUiLCJ0cmFuc2l0aW9uIiwiYWNjZXNzb3IiLCJ1cGRhdGUiLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9ucyIsImluc3RhbmNlTm9ybWFscyIsImRlZmF1bHRWYWx1ZSIsImNhbGN1bGF0ZUluc3RhbmNlTm9ybWFscyIsImluc3RhbmNlQ29sb3JzIiwidHlwZSIsIlVOU0lHTkVEX0JZVEUiLCJjYWxjdWxhdGVJbnN0YW5jZUNvbG9ycyIsIm9sZFByb3BzIiwiY2hhbmdlRmxhZ3MiLCJnZXRBdHRyaWJ1dGVNYW5hZ2VyIiwiaW52YWxpZGF0ZUFsbCIsImNvb3JkaW5hdGVTeXN0ZW0iLCJMTkdMQVQiLCJpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3ciLCJyZW1vdmUiLCJnbCIsInNldFN0YXRlIiwibW9kZWwiLCJfZ2V0TW9kZWwiLCJ1cGRhdGVBdHRyaWJ1dGUiLCJ1bmlmb3JtcyIsInJlbmRlciIsIk9iamVjdCIsImFzc2lnbiIsInBvc2l0aW9ucyIsImkiLCJhbmdsZSIsIk1hdGgiLCJQSSIsInB1c2giLCJjb3MiLCJzaW4iLCJnZXRTaGFkZXJzIiwiZ2VvbWV0cnkiLCJkcmF3TW9kZSIsIlRSSUFOR0xFUyIsImF0dHJpYnV0ZXMiLCJGbG9hdDMyQXJyYXkiLCJpc0luc3RhbmNlZCIsImF0dHJpYnV0ZSIsImRhdGEiLCJ2YWx1ZSIsInBvaW50IiwiaXNOYU4iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFvQkE7O0FBRUE7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7OytlQTFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFHT0EsVyxzQkFBQUEsVztJQUFhQyxrQixzQkFBQUEsa0I7OztBQU9wQixJQUFNQyxnQkFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxHQUFWLENBQXRCOztBQUVBLElBQU1DLGVBQWU7QUFDbkJDLGdCQUFjLEVBREssRUFDRDtBQUNsQkMsUUFBTSxLQUZhOztBQUluQkMsZUFBYTtBQUFBLFdBQUtDLEVBQUVDLFFBQVA7QUFBQSxHQUpNO0FBS25CQyxhQUFXO0FBQUEsV0FBS0YsRUFBRUcsTUFBUDtBQUFBLEdBTFE7QUFNbkJDLFlBQVU7QUFBQSxXQUFLSixFQUFFSyxLQUFGLElBQVdWLGFBQWhCO0FBQUEsR0FOUzs7QUFRbkJXLGlCQUFlO0FBQ2JDLG9CQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sSUFBUCxFQUFhLENBQUMsSUFBZCxFQUFvQixJQUFwQixFQUEwQixJQUExQixFQUFnQyxJQUFoQyxFQUFzQyxDQUFDLElBQXZDLEVBQTZDLElBQTdDLENBREg7QUFFYkMsa0JBQWMsR0FGRDtBQUdiQyxrQkFBYyxHQUhEO0FBSWJDLG1CQUFlLEdBSkY7QUFLYkMsb0JBQWdCLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLEVBQTBCLEdBQTFCLENBTEg7QUFNYkMsb0JBQWdCO0FBTkg7QUFSSSxDQUFyQjs7SUFrQnFCQyxlOzs7Ozs7Ozs7OzsrQkFDUkMsRSxFQUFJO0FBQUEsVUFDTkMsV0FETSxHQUNTLEtBQUtDLE9BRGQsQ0FDTkQsV0FETTs7QUFFYixhQUFPckIsbUJBQW1CLEtBQUt1QixLQUF4QixJQUNILEVBQUNDLG1DQUFELEVBQVdDLHFDQUFYLEVBQWVDLFNBQVMsQ0FBQyxXQUFELEVBQWMsVUFBZCxFQUEwQixTQUExQixDQUF4QixFQUE4REwsd0JBQTlELEVBREcsR0FFSCxFQUFDRyxtQ0FBRCxFQUFLQyxxQ0FBTCxFQUFTQyxTQUFTLENBQUMsVUFBRCxFQUFhLFNBQWIsQ0FBbEIsRUFBMkNMLHdCQUEzQyxFQUZKLENBRmEsQ0FJZ0Q7QUFDOUQ7OztzQ0FFaUI7QUFDaEI7QUFDQSxXQUFLTSxLQUFMLENBQVdDLGdCQUFYLENBQTRCQyxZQUE1QixDQUF5QztBQUN2Q0MsMkJBQW1CO0FBQ2pCQyxnQkFBTSxDQURXO0FBRWpCQyxzQkFBWSxJQUZLO0FBR2pCQyxvQkFBVSxhQUhPO0FBSWpCQyxrQkFBUSxLQUFLQztBQUpJLFNBRG9CO0FBT3ZDQyx5QkFBaUI7QUFDZkwsZ0JBQU0sQ0FEUztBQUVmQyxzQkFBWSxJQUZHO0FBR2ZDLG9CQUFVLFdBSEs7QUFJZkksd0JBQWMsQ0FKQztBQUtmSCxrQkFBUSxLQUFLSTtBQUxFLFNBUHNCO0FBY3ZDQyx3QkFBZ0I7QUFDZFIsZ0JBQU0sQ0FEUTtBQUVkUyxnQkFBTSxTQUFHQyxhQUZLO0FBR2RULHNCQUFZLElBSEU7QUFJZEMsb0JBQVUsVUFKSTtBQUtkQyxrQkFBUSxLQUFLUTtBQUxDO0FBZHVCLE9BQXpDO0FBc0JBO0FBQ0Q7OzswQ0FFK0M7QUFBQSxVQUEvQm5CLEtBQStCLFFBQS9CQSxLQUErQjtBQUFBLFVBQXhCb0IsUUFBd0IsUUFBeEJBLFFBQXdCO0FBQUEsVUFBZEMsV0FBYyxRQUFkQSxXQUFjOztBQUM5QyxVQUFJckIsTUFBTW5CLElBQU4sS0FBZXVDLFNBQVN2QyxJQUE1QixFQUFrQztBQUNoQyxZQUFNd0IsbUJBQW1CLEtBQUtpQixtQkFBTCxFQUF6QjtBQUNBakIseUJBQWlCa0IsYUFBakI7O0FBRUEsWUFBSXZCLE1BQU1uQixJQUFOLElBQWNtQixNQUFNd0IsZ0JBQU4sS0FBMkIsd0JBQWtCQyxNQUEvRCxFQUF1RTtBQUNyRXBCLDJCQUFpQkMsWUFBakIsQ0FBOEI7QUFDNUJvQixzQ0FBMEI7QUFDeEJsQixvQkFBTSxDQURrQjtBQUV4QkUsd0JBQVUsYUFGYztBQUd4QkMsc0JBQVEsS0FBS2dCO0FBSFc7QUFERSxXQUE5QjtBQU9ELFNBUkQsTUFRTztBQUNMdEIsMkJBQWlCdUIsTUFBakIsQ0FBd0IsQ0FBQywwQkFBRCxDQUF4QjtBQUNEO0FBQ0Y7QUFDRjs7O3VDQUUyQztBQUFBLFVBQS9CNUIsS0FBK0IsU0FBL0JBLEtBQStCO0FBQUEsVUFBeEJvQixRQUF3QixTQUF4QkEsUUFBd0I7QUFBQSxVQUFkQyxXQUFjLFNBQWRBLFdBQWM7O0FBQzFDLG9JQUFrQixFQUFDckIsWUFBRCxFQUFRb0Isa0JBQVIsRUFBa0JDLHdCQUFsQixFQUFsQjtBQUNBLFVBQUlyQixNQUFNbkIsSUFBTixLQUFldUMsU0FBU3ZDLElBQTVCLEVBQWtDO0FBQUEsWUFDekJnRCxFQUR5QixHQUNuQixLQUFLOUIsT0FEYyxDQUN6QjhCLEVBRHlCOztBQUVoQyxhQUFLQyxRQUFMLENBQWMsRUFBQ0MsT0FBTyxLQUFLQyxTQUFMLENBQWVILEVBQWYsQ0FBUixFQUFkO0FBQ0Q7QUFDRCxXQUFLSSxlQUFMLENBQXFCLEVBQUNqQyxZQUFELEVBQVFvQixrQkFBUixFQUFrQkMsd0JBQWxCLEVBQXJCO0FBQ0Q7OztnQ0FFZ0I7QUFBQSxVQUFYYSxRQUFXLFNBQVhBLFFBQVc7QUFBQSxtQkFDdUIsS0FBS2xDLEtBRDVCO0FBQUEsVUFDUnBCLFlBRFEsVUFDUkEsWUFEUTtBQUFBLFVBQ01TLGFBRE4sVUFDTUEsYUFETjs7QUFFZixXQUFLZSxLQUFMLENBQVcyQixLQUFYLENBQWlCSSxNQUFqQixDQUNFQyxPQUFPQyxNQUFQLENBQ0UsRUFERixFQUVFSCxRQUZGLEVBR0U7QUFDRXREO0FBREYsT0FIRixFQU1FUyxhQU5GLENBREY7QUFVRDs7OzhCQUVTd0MsRSxFQUFJO0FBQ1o7QUFDQSxVQUFNUyxZQUFZLEVBQWxCO0FBQ0EsV0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUksQ0FBcEIsRUFBdUJBLEdBQXZCLEVBQTRCO0FBQzFCLFlBQU1DLFFBQVFELElBQUksQ0FBSixHQUFRRSxLQUFLQyxFQUFiLEdBQWtCLENBQWhDO0FBQ0FKLGtCQUFVSyxJQUFWLENBQWVGLEtBQUtHLEdBQUwsQ0FBU0osS0FBVCxJQUFrQixDQUFqQyxFQUFvQ0MsS0FBS0ksR0FBTCxDQUFTTCxLQUFULElBQWtCLENBQXRELEVBQXlELENBQXpEO0FBQ0Q7O0FBRUQsYUFBTyxnQkFDTFgsRUFESyxFQUVMTyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQixLQUFLUyxVQUFMLEVBQWxCLEVBQXFDO0FBQ25DakQsWUFBSSxLQUFLRyxLQUFMLENBQVdILEVBRG9CO0FBRW5Da0Qsa0JBQVUsbUJBQWE7QUFDckJDLG9CQUFVLFNBQUdDLFNBRFE7QUFFckJDLHNCQUFZO0FBQ1ZaLHVCQUFXLElBQUlhLFlBQUosQ0FBaUJiLFNBQWpCO0FBREQ7QUFGUyxTQUFiLENBRnlCO0FBUW5DYyxxQkFBYSxJQVJzQjtBQVNuQ3RELHFCQUFhLEtBQUtDLE9BQUwsQ0FBYUQ7QUFUUyxPQUFyQyxDQUZLLENBQVA7QUFjRDs7OytDQUUwQnVELFMsRUFBVztBQUFBLG9CQUNSLEtBQUtyRCxLQURHO0FBQUEsVUFDN0JzRCxJQUQ2QixXQUM3QkEsSUFENkI7QUFBQSxVQUN2QnhFLFdBRHVCLFdBQ3ZCQSxXQUR1QjtBQUFBLFVBRTdCeUUsS0FGNkIsR0FFcEJGLFNBRm9CLENBRTdCRSxLQUY2Qjs7QUFHcEMsVUFBSWhCLElBQUksQ0FBUjtBQUhvQztBQUFBO0FBQUE7O0FBQUE7QUFJcEMsNkJBQW9CZSxJQUFwQiw4SEFBMEI7QUFBQSxjQUFmRSxLQUFlOztBQUN4QixjQUFNeEUsV0FBV0YsWUFBWTBFLEtBQVosQ0FBakI7QUFDQUQsZ0JBQU1oQixHQUFOLElBQWF2RCxTQUFTLENBQVQsQ0FBYjtBQUNBdUUsZ0JBQU1oQixHQUFOLElBQWF2RCxTQUFTLENBQVQsQ0FBYjtBQUNBdUUsZ0JBQU1oQixHQUFOLElBQWF2RCxTQUFTLENBQVQsS0FBZSxDQUE1QjtBQUNEO0FBVG1DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFVckM7OztzREFFaUNxRSxTLEVBQVc7QUFBQSxvQkFDZixLQUFLckQsS0FEVTtBQUFBLFVBQ3BDc0QsSUFEb0MsV0FDcENBLElBRG9DO0FBQUEsVUFDOUJ4RSxXQUQ4QixXQUM5QkEsV0FEOEI7QUFBQSxVQUVwQ3lFLEtBRm9DLEdBRTNCRixTQUYyQixDQUVwQ0UsS0FGb0M7O0FBRzNDLFVBQUloQixJQUFJLENBQVI7QUFIMkM7QUFBQTtBQUFBOztBQUFBO0FBSTNDLDhCQUFvQmUsSUFBcEIsbUlBQTBCO0FBQUEsY0FBZkUsS0FBZTs7QUFDeEIsY0FBTXhFLFdBQVdGLFlBQVkwRSxLQUFaLENBQWpCO0FBQ0FELGdCQUFNaEIsR0FBTixJQUFhL0QsWUFBWVEsU0FBUyxDQUFULENBQVosQ0FBYjtBQUNBdUUsZ0JBQU1oQixHQUFOLElBQWEvRCxZQUFZUSxTQUFTLENBQVQsQ0FBWixDQUFiO0FBQ0Q7QUFSMEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVM1Qzs7OzZDQUV3QnFFLFMsRUFBVztBQUFBLG9CQUNSLEtBQUtyRCxLQURHO0FBQUEsVUFDM0JzRCxJQUQyQixXQUMzQkEsSUFEMkI7QUFBQSxVQUNyQnJFLFNBRHFCLFdBQ3JCQSxTQURxQjtBQUFBLFVBRTNCc0UsS0FGMkIsR0FFbEJGLFNBRmtCLENBRTNCRSxLQUYyQjs7QUFHbEMsVUFBSWhCLElBQUksQ0FBUjtBQUhrQztBQUFBO0FBQUE7O0FBQUE7QUFJbEMsOEJBQW9CZSxJQUFwQixtSUFBMEI7QUFBQSxjQUFmRSxLQUFlOztBQUN4QixjQUFNdEUsU0FBU0QsVUFBVXVFLEtBQVYsQ0FBZjtBQUNBRCxnQkFBTWhCLEdBQU4sSUFBYXJELE9BQU8sQ0FBUCxDQUFiO0FBQ0FxRSxnQkFBTWhCLEdBQU4sSUFBYXJELE9BQU8sQ0FBUCxDQUFiO0FBQ0FxRSxnQkFBTWhCLEdBQU4sSUFBYXJELE9BQU8sQ0FBUCxDQUFiO0FBQ0Q7QUFUaUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVVuQzs7OzRDQUV1Qm1FLFMsRUFBVztBQUFBLG9CQUNSLEtBQUtyRCxLQURHO0FBQUEsVUFDMUJzRCxJQUQwQixXQUMxQkEsSUFEMEI7QUFBQSxVQUNwQm5FLFFBRG9CLFdBQ3BCQSxRQURvQjtBQUFBLFVBRTFCb0UsS0FGMEIsR0FFakJGLFNBRmlCLENBRTFCRSxLQUYwQjs7QUFHakMsVUFBSWhCLElBQUksQ0FBUjtBQUhpQztBQUFBO0FBQUE7O0FBQUE7QUFJakMsOEJBQW9CZSxJQUFwQixtSUFBMEI7QUFBQSxjQUFmRSxLQUFlOztBQUN4QixjQUFNcEUsUUFBUUQsU0FBU3FFLEtBQVQsQ0FBZDtBQUNBRCxnQkFBTWhCLEdBQU4sSUFBYW5ELE1BQU0sQ0FBTixDQUFiO0FBQ0FtRSxnQkFBTWhCLEdBQU4sSUFBYW5ELE1BQU0sQ0FBTixDQUFiO0FBQ0FtRSxnQkFBTWhCLEdBQU4sSUFBYW5ELE1BQU0sQ0FBTixDQUFiO0FBQ0FtRSxnQkFBTWhCLEdBQU4sSUFBYWtCLE1BQU1yRSxNQUFNLENBQU4sQ0FBTixJQUFrQixHQUFsQixHQUF3QkEsTUFBTSxDQUFOLENBQXJDO0FBQ0Q7QUFWZ0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVdsQzs7Ozs7O2tCQW5Ka0JRLGU7OztBQXNKckJBLGdCQUFnQjhELFNBQWhCLEdBQTRCLGlCQUE1QjtBQUNBOUQsZ0JBQWdCakIsWUFBaEIsR0FBK0JBLFlBQS9CIiwiZmlsZSI6InBvaW50LWNsb3VkLWxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU0sIExheWVyLCBleHBlcmltZW50YWx9IGZyb20gJy4uLy4uL2NvcmUnO1xuY29uc3Qge2ZwNjRMb3dQYXJ0LCBlbmFibGU2NGJpdFN1cHBvcnR9ID0gZXhwZXJpbWVudGFsO1xuaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHZzIGZyb20gJy4vcG9pbnQtY2xvdWQtbGF5ZXItdmVydGV4Lmdsc2wnO1xuaW1wb3J0IHZzNjQgZnJvbSAnLi9wb2ludC1jbG91ZC1sYXllci12ZXJ0ZXgtNjQuZ2xzbCc7XG5pbXBvcnQgZnMgZnJvbSAnLi9wb2ludC1jbG91ZC1sYXllci1mcmFnbWVudC5nbHNsJztcblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdO1xuXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gIHJhZGl1c1BpeGVsczogMTAsIC8vICBwb2ludCByYWRpdXMgaW4gcGl4ZWxzXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIGdldFBvc2l0aW9uOiB4ID0+IHgucG9zaXRpb24sXG4gIGdldE5vcm1hbDogeCA9PiB4Lm5vcm1hbCxcbiAgZ2V0Q29sb3I6IHggPT4geC5jb2xvciB8fCBERUZBVUxUX0NPTE9SLFxuXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWzAsIDAsIDUwMDAsIC0xMDAwLCAxMDAwLCA4MDAwLCA1MDAwLCAtNTAwMCwgMTAwMF0sXG4gICAgYW1iaWVudFJhdGlvOiAwLjIsXG4gICAgZGlmZnVzZVJhdGlvOiAwLjYsXG4gICAgc3BlY3VsYXJSYXRpbzogMC44LFxuICAgIGxpZ2h0c1N0cmVuZ3RoOiBbMS4wLCAwLjAsIDAuOCwgMC4wLCAwLjQsIDAuMF0sXG4gICAgbnVtYmVyT2ZMaWdodHM6IDNcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9pbnRDbG91ZExheWVyIGV4dGVuZHMgTGF5ZXIge1xuICBnZXRTaGFkZXJzKGlkKSB7XG4gICAgY29uc3Qge3NoYWRlckNhY2hlfSA9IHRoaXMuY29udGV4dDtcbiAgICByZXR1cm4gZW5hYmxlNjRiaXRTdXBwb3J0KHRoaXMucHJvcHMpXG4gICAgICA/IHt2czogdnM2NCwgZnMsIG1vZHVsZXM6IFsncHJvamVjdDY0JywgJ2xpZ2h0aW5nJywgJ3BpY2tpbmcnXSwgc2hhZGVyQ2FjaGV9XG4gICAgICA6IHt2cywgZnMsIG1vZHVsZXM6IFsnbGlnaHRpbmcnLCAncGlja2luZyddLCBzaGFkZXJDYWNoZX07IC8vICdwcm9qZWN0JyBtb2R1bGUgYWRkZWQgYnkgZGVmYXVsdC5cbiAgfVxuXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmFkZEluc3RhbmNlZCh7XG4gICAgICBpbnN0YW5jZVBvc2l0aW9uczoge1xuICAgICAgICBzaXplOiAzLFxuICAgICAgICB0cmFuc2l0aW9uOiB0cnVlLFxuICAgICAgICBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJyxcbiAgICAgICAgdXBkYXRlOiB0aGlzLmNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VOb3JtYWxzOiB7XG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHRyYW5zaXRpb246IHRydWUsXG4gICAgICAgIGFjY2Vzc29yOiAnZ2V0Tm9ybWFsJyxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiAxLFxuICAgICAgICB1cGRhdGU6IHRoaXMuY2FsY3VsYXRlSW5zdGFuY2VOb3JtYWxzXG4gICAgICB9LFxuICAgICAgaW5zdGFuY2VDb2xvcnM6IHtcbiAgICAgICAgc2l6ZTogNCxcbiAgICAgICAgdHlwZTogR0wuVU5TSUdORURfQllURSxcbiAgICAgICAgdHJhbnNpdGlvbjogdHJ1ZSxcbiAgICAgICAgYWNjZXNzb3I6ICdnZXRDb2xvcicsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZUNvbG9yc1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICB9XG5cbiAgdXBkYXRlQXR0cmlidXRlKHtwcm9wcywgb2xkUHJvcHMsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChwcm9wcy5mcDY0ICE9PSBvbGRQcm9wcy5mcDY0KSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVNYW5hZ2VyID0gdGhpcy5nZXRBdHRyaWJ1dGVNYW5hZ2VyKCk7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcblxuICAgICAgaWYgKHByb3BzLmZwNjQgJiYgcHJvcHMuY29vcmRpbmF0ZVN5c3RlbSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HTEFUKSB7XG4gICAgICAgIGF0dHJpYnV0ZU1hbmFnZXIuYWRkSW5zdGFuY2VkKHtcbiAgICAgICAgICBpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3c6IHtcbiAgICAgICAgICAgIHNpemU6IDIsXG4gICAgICAgICAgICBhY2Nlc3NvcjogJ2dldFBvc2l0aW9uJyxcbiAgICAgICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3dcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlTWFuYWdlci5yZW1vdmUoWydpbnN0YW5jZVBvc2l0aW9uczY0eHlMb3cnXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KSB7XG4gICAgc3VwZXIudXBkYXRlU3RhdGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgICBpZiAocHJvcHMuZnA2NCAhPT0gb2xkUHJvcHMuZnA2NCkge1xuICAgICAgY29uc3Qge2dsfSA9IHRoaXMuY29udGV4dDtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe21vZGVsOiB0aGlzLl9nZXRNb2RlbChnbCl9KTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVBdHRyaWJ1dGUoe3Byb3BzLCBvbGRQcm9wcywgY2hhbmdlRmxhZ3N9KTtcbiAgfVxuXG4gIGRyYXcoe3VuaWZvcm1zfSkge1xuICAgIGNvbnN0IHtyYWRpdXNQaXhlbHMsIGxpZ2h0U2V0dGluZ3N9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLnN0YXRlLm1vZGVsLnJlbmRlcihcbiAgICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICB1bmlmb3JtcyxcbiAgICAgICAge1xuICAgICAgICAgIHJhZGl1c1BpeGVsc1xuICAgICAgICB9LFxuICAgICAgICBsaWdodFNldHRpbmdzXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIF9nZXRNb2RlbChnbCkge1xuICAgIC8vIGEgdHJpYW5nbGUgdGhhdCBtaW5pbWFsbHkgY292ZXIgdGhlIHVuaXQgY2lyY2xlXG4gICAgY29uc3QgcG9zaXRpb25zID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGNvbnN0IGFuZ2xlID0gaSAvIDMgKiBNYXRoLlBJICogMjtcbiAgICAgIHBvc2l0aW9ucy5wdXNoKE1hdGguY29zKGFuZ2xlKSAqIDIsIE1hdGguc2luKGFuZ2xlKSAqIDIsIDApO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTW9kZWwoXG4gICAgICBnbCxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U2hhZGVycygpLCB7XG4gICAgICAgIGlkOiB0aGlzLnByb3BzLmlkLFxuICAgICAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgICBkcmF3TW9kZTogR0wuVFJJQU5HTEVTLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgaXNJbnN0YW5jZWQ6IHRydWUsXG4gICAgICAgIHNoYWRlckNhY2hlOiB0aGlzLmNvbnRleHQuc2hhZGVyQ2FjaGVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlUG9zaXRpb25zKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRQb3NpdGlvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMF07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMV07XG4gICAgICB2YWx1ZVtpKytdID0gcG9zaXRpb25bMl0gfHwgMDtcbiAgICB9XG4gIH1cblxuICBjYWxjdWxhdGVJbnN0YW5jZVBvc2l0aW9uczY0eHlMb3coYXR0cmlidXRlKSB7XG4gICAgY29uc3Qge2RhdGEsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFBvc2l0aW9uKHBvaW50KTtcbiAgICAgIHZhbHVlW2krK10gPSBmcDY0TG93UGFydChwb3NpdGlvblswXSk7XG4gICAgICB2YWx1ZVtpKytdID0gZnA2NExvd1BhcnQocG9zaXRpb25bMV0pO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlTm9ybWFscyhhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCB7ZGF0YSwgZ2V0Tm9ybWFsfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZhbHVlfSA9IGF0dHJpYnV0ZTtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCBub3JtYWwgPSBnZXROb3JtYWwocG9pbnQpO1xuICAgICAgdmFsdWVbaSsrXSA9IG5vcm1hbFswXTtcbiAgICAgIHZhbHVlW2krK10gPSBub3JtYWxbMV07XG4gICAgICB2YWx1ZVtpKytdID0gbm9ybWFsWzJdO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZUluc3RhbmNlQ29sb3JzKGF0dHJpYnV0ZSkge1xuICAgIGNvbnN0IHtkYXRhLCBnZXRDb2xvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZX0gPSBhdHRyaWJ1dGU7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgZGF0YSkge1xuICAgICAgY29uc3QgY29sb3IgPSBnZXRDb2xvcihwb2ludCk7XG4gICAgICB2YWx1ZVtpKytdID0gY29sb3JbMF07XG4gICAgICB2YWx1ZVtpKytdID0gY29sb3JbMV07XG4gICAgICB2YWx1ZVtpKytdID0gY29sb3JbMl07XG4gICAgICB2YWx1ZVtpKytdID0gaXNOYU4oY29sb3JbM10pID8gMjU1IDogY29sb3JbM107XG4gICAgfVxuICB9XG59XG5cblBvaW50Q2xvdWRMYXllci5sYXllck5hbWUgPSAnUG9pbnRDbG91ZExheWVyJztcblBvaW50Q2xvdWRMYXllci5kZWZhdWx0UHJvcHMgPSBkZWZhdWx0UHJvcHM7XG4iXX0=