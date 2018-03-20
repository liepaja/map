'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PolygonTesselator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

// Handles tesselation of polygons with holes
// - 2D surfaces
// - 2D outlines
// - 3D surfaces (top and sides only)
// - 3D wireframes (not yet)


var _polygon = require('./polygon');

var Polygon = _interopRequireWildcard(_polygon);

var _deck = require('deck.gl');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fillArray = _deck.experimental.fillArray,
    fp64LowPart = _deck.experimental.fp64LowPart;

// Maybe deck.gl or luma.gl needs to export this

function getPickingColor(index) {
  index++;
  return [index & 255, index >> 8 & 255, index >> 16 & 255];
}

var DEFAULT_COLOR = [0, 0, 0, 255]; // Black

// This class is set up to allow querying one attribute at a time
// the way the AttributeManager expects it

var PolygonTesselator = exports.PolygonTesselator = function () {
  function PolygonTesselator(_ref) {
    var polygons = _ref.polygons,
        IndexType = _ref.IndexType;

    _classCallCheck(this, PolygonTesselator);

    // Normalize all polygons
    polygons = polygons.map(function (polygon) {
      return Polygon.normalize(polygon);
    });

    // Count all polygon vertices
    var pointCount = getPointCount(polygons);

    this.polygons = polygons;
    this.pointCount = pointCount;
    this.IndexType = IndexType;

    // TODO: dynamically decide IndexType in tesselator?
    // Check if the vertex count excedes index type limit
    if (IndexType === Uint16Array && pointCount > 65535) {
      throw new Error("Vertex count exceeds browser's limit");
    }

    this.attributes = {
      pickingColors: calculatePickingColors({ polygons: polygons, pointCount: pointCount })
    };
  }

  _createClass(PolygonTesselator, [{
    key: 'updatePositions',
    value: function updatePositions(_ref2) {
      var fp64 = _ref2.fp64,
          extruded = _ref2.extruded;
      var attributes = this.attributes,
          polygons = this.polygons,
          pointCount = this.pointCount;


      attributes.positions = attributes.positions || new Float32Array(pointCount * 3);
      attributes.nextPositions = attributes.nextPositions || new Float32Array(pointCount * 3);

      if (fp64) {
        // We only need x, y component
        attributes.positions64xyLow = attributes.positions64xyLow || new Float32Array(pointCount * 2);
        attributes.nextPositions64xyLow = attributes.nextPositions64xyLow || new Float32Array(pointCount * 2);
      }

      _updatePositions({ cache: attributes, polygons: polygons, extruded: extruded, fp64: fp64 });
    }
  }, {
    key: 'indices',
    value: function indices() {
      var polygons = this.polygons,
          IndexType = this.IndexType;

      return calculateIndices({ polygons: polygons, IndexType: IndexType });
    }
  }, {
    key: 'positions',
    value: function positions() {
      return this.attributes.positions;
    }
  }, {
    key: 'positions64xyLow',
    value: function positions64xyLow() {
      return this.attributes.positions64xyLow;
    }
  }, {
    key: 'nextPositions',
    value: function nextPositions() {
      return this.attributes.nextPositions;
    }
  }, {
    key: 'nextPositions64xyLow',
    value: function nextPositions64xyLow() {
      return this.attributes.nextPositions64xyLow;
    }
  }, {
    key: 'elevations',
    value: function elevations() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref3$key = _ref3.key,
          key = _ref3$key === undefined ? 'elevations' : _ref3$key,
          _ref3$getElevation = _ref3.getElevation,
          getElevation = _ref3$getElevation === undefined ? function (x) {
        return 100;
      } : _ref3$getElevation;

      var attributes = this.attributes,
          polygons = this.polygons,
          pointCount = this.pointCount;

      var values = updateElevations({ cache: attributes[key], polygons: polygons, pointCount: pointCount, getElevation: getElevation });
      attributes[key] = values;
      return values;
    }
  }, {
    key: 'colors',
    value: function colors() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref4$key = _ref4.key,
          key = _ref4$key === undefined ? 'colors' : _ref4$key,
          _ref4$getColor = _ref4.getColor,
          getColor = _ref4$getColor === undefined ? function (x) {
        return DEFAULT_COLOR;
      } : _ref4$getColor;

      var attributes = this.attributes,
          polygons = this.polygons,
          pointCount = this.pointCount;

      var values = updateColors({ cache: attributes[key], polygons: polygons, pointCount: pointCount, getColor: getColor });
      attributes[key] = values;
      return values;
    }
  }, {
    key: 'pickingColors',
    value: function pickingColors() {
      return this.attributes.pickingColors;
    }
  }]);

  return PolygonTesselator;
}();

// Count number of points in a list of complex polygons


function getPointCount(polygons) {
  return polygons.reduce(function (points, polygon) {
    return points + Polygon.getVertexCount(polygon);
  }, 0);
}

// COunt number of triangles in a list of complex polygons
function getTriangleCount(polygons) {
  return polygons.reduce(function (triangles, polygon) {
    return triangles + Polygon.getTriangleCount(polygon);
  }, 0);
}

// Returns the offsets of each complex polygon in the combined array of all polygons
function getPolygonOffsets(polygons) {
  var offsets = new Array(polygons.length + 1);
  offsets[0] = 0;
  var offset = 0;
  polygons.forEach(function (polygon, i) {
    offset += Polygon.getVertexCount(polygon);
    offsets[i + 1] = offset;
  });
  return offsets;
}

function calculateIndices(_ref5) {
  var polygons = _ref5.polygons,
      _ref5$IndexType = _ref5.IndexType,
      IndexType = _ref5$IndexType === undefined ? Uint32Array : _ref5$IndexType;

  // Calculate length of index array (3 * number of triangles)
  var indexCount = 3 * getTriangleCount(polygons);
  var offsets = getPolygonOffsets(polygons);

  // Allocate the attribute
  var attribute = new IndexType(indexCount);

  // 1. get triangulated indices for the internal areas
  // 2. offset them by the number of indices in previous polygons
  var i = 0;
  polygons.forEach(function (polygon, polygonIndex) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Polygon.getSurfaceIndices(polygon)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var index = _step.value;

        attribute[i++] = index + offsets[polygonIndex];
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
  });

  return attribute;
}

function _updatePositions(_ref6) {
  var _ref6$cache = _ref6.cache,
      positions = _ref6$cache.positions,
      positions64xyLow = _ref6$cache.positions64xyLow,
      nextPositions = _ref6$cache.nextPositions,
      nextPositions64xyLow = _ref6$cache.nextPositions64xyLow,
      polygons = _ref6.polygons,
      extruded = _ref6.extruded,
      fp64 = _ref6.fp64;

  // Flatten out all the vertices of all the sub subPolygons
  var i = 0;
  var nextI = 0;
  var startVertex = null;

  var pushStartVertex = function pushStartVertex(x, y, z, xLow, yLow) {
    if (extruded) {
      // Save first vertex for setting nextPositions at the end of the loop
      startVertex = { x: x, y: y, z: z, xLow: xLow, yLow: yLow };
    }
  };

  var popStartVertex = function popStartVertex() {
    if (startVertex) {
      nextPositions[nextI * 3] = startVertex.x;
      nextPositions[nextI * 3 + 1] = startVertex.y;
      nextPositions[nextI * 3 + 2] = startVertex.z;
      if (fp64) {
        nextPositions64xyLow[nextI * 2] = startVertex.xLow;
        nextPositions64xyLow[nextI * 2 + 1] = startVertex.yLow;
      }
      nextI++;
    }
    startVertex = null;
  };

  polygons.forEach(function (polygon, polygonIndex) {
    Polygon.forEachVertex(polygon, function (vertex, vertexIndex) {
      // eslint-disable-line
      var x = vertex[0];
      var y = vertex[1];
      var z = vertex[2] || 0;
      var xLow = void 0;
      var yLow = void 0;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      if (fp64) {
        xLow = fp64LowPart(x);
        yLow = fp64LowPart(y);
        positions64xyLow[i * 2] = xLow;
        positions64xyLow[i * 2 + 1] = yLow;
      }
      i++;

      if (extruded && vertexIndex > 0) {
        nextPositions[nextI * 3] = x;
        nextPositions[nextI * 3 + 1] = y;
        nextPositions[nextI * 3 + 2] = z;
        if (fp64) {
          nextPositions64xyLow[nextI * 2] = xLow;
          nextPositions64xyLow[nextI * 2 + 1] = yLow;
        }
        nextI++;
      }
      if (vertexIndex === 0) {
        popStartVertex();
        pushStartVertex(x, y, z, xLow, yLow);
      }
    });
  });
  popStartVertex();
}

function updateElevations(_ref7) {
  var cache = _ref7.cache,
      polygons = _ref7.polygons,
      pointCount = _ref7.pointCount,
      getElevation = _ref7.getElevation;

  var elevations = cache || new Float32Array(pointCount);
  var i = 0;
  polygons.forEach(function (complexPolygon, polygonIndex) {
    // Calculate polygon color
    var height = getElevation(polygonIndex);

    var vertexCount = Polygon.getVertexCount(complexPolygon);
    fillArray({ target: elevations, source: [height], start: i, count: vertexCount });
    i += vertexCount;
  });
  return elevations;
}

function updateColors(_ref8) {
  var cache = _ref8.cache,
      polygons = _ref8.polygons,
      pointCount = _ref8.pointCount,
      getColor = _ref8.getColor;

  var colors = cache || new Uint8ClampedArray(pointCount * 4);
  var i = 0;
  polygons.forEach(function (complexPolygon, polygonIndex) {
    // Calculate polygon color
    var color = getColor(polygonIndex);
    if (isNaN(color[3])) {
      color[3] = 255;
    }

    var vertexCount = Polygon.getVertexCount(complexPolygon);
    fillArray({ target: colors, source: color, start: i, count: vertexCount });
    i += color.length * vertexCount;
  });
  return colors;
}

function calculatePickingColors(_ref9) {
  var polygons = _ref9.polygons,
      pointCount = _ref9.pointCount;

  var attribute = new Uint8ClampedArray(pointCount * 3);
  var i = 0;
  polygons.forEach(function (complexPolygon, polygonIndex) {
    var color = getPickingColor(polygonIndex);
    var vertexCount = Polygon.getVertexCount(complexPolygon);
    fillArray({ target: attribute, source: color, start: i, count: vertexCount });
    i += color.length * vertexCount;
  });
  return attribute;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9leHBlcmltZW50YWwtbGF5ZXJzL3NyYy9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci5qcyJdLCJuYW1lcyI6WyJQb2x5Z29uIiwiZmlsbEFycmF5IiwiZnA2NExvd1BhcnQiLCJnZXRQaWNraW5nQ29sb3IiLCJpbmRleCIsIkRFRkFVTFRfQ09MT1IiLCJQb2x5Z29uVGVzc2VsYXRvciIsInBvbHlnb25zIiwiSW5kZXhUeXBlIiwibWFwIiwibm9ybWFsaXplIiwicG9seWdvbiIsInBvaW50Q291bnQiLCJnZXRQb2ludENvdW50IiwiVWludDE2QXJyYXkiLCJFcnJvciIsImF0dHJpYnV0ZXMiLCJwaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsImZwNjQiLCJleHRydWRlZCIsInBvc2l0aW9ucyIsIkZsb2F0MzJBcnJheSIsIm5leHRQb3NpdGlvbnMiLCJwb3NpdGlvbnM2NHh5TG93IiwibmV4dFBvc2l0aW9uczY0eHlMb3ciLCJ1cGRhdGVQb3NpdGlvbnMiLCJjYWNoZSIsImNhbGN1bGF0ZUluZGljZXMiLCJrZXkiLCJnZXRFbGV2YXRpb24iLCJ2YWx1ZXMiLCJ1cGRhdGVFbGV2YXRpb25zIiwiZ2V0Q29sb3IiLCJ1cGRhdGVDb2xvcnMiLCJyZWR1Y2UiLCJwb2ludHMiLCJnZXRWZXJ0ZXhDb3VudCIsImdldFRyaWFuZ2xlQ291bnQiLCJ0cmlhbmdsZXMiLCJnZXRQb2x5Z29uT2Zmc2V0cyIsIm9mZnNldHMiLCJBcnJheSIsImxlbmd0aCIsIm9mZnNldCIsImZvckVhY2giLCJpIiwiVWludDMyQXJyYXkiLCJpbmRleENvdW50IiwiYXR0cmlidXRlIiwicG9seWdvbkluZGV4IiwiZ2V0U3VyZmFjZUluZGljZXMiLCJuZXh0SSIsInN0YXJ0VmVydGV4IiwicHVzaFN0YXJ0VmVydGV4IiwieCIsInkiLCJ6IiwieExvdyIsInlMb3ciLCJwb3BTdGFydFZlcnRleCIsImZvckVhY2hWZXJ0ZXgiLCJ2ZXJ0ZXgiLCJ2ZXJ0ZXhJbmRleCIsImVsZXZhdGlvbnMiLCJjb21wbGV4UG9seWdvbiIsImhlaWdodCIsInZlcnRleENvdW50IiwidGFyZ2V0Iiwic291cmNlIiwic3RhcnQiLCJjb3VudCIsImNvbG9ycyIsIlVpbnQ4Q2xhbXBlZEFycmF5IiwiY29sb3IiLCJpc05hTiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0E7O0lBQVlBLE87O0FBQ1o7Ozs7OztJQUNPQyxTLHNCQUFBQSxTO0lBQVdDLFcsc0JBQUFBLFc7O0FBRWxCOztBQUNBLFNBQVNDLGVBQVQsQ0FBeUJDLEtBQXpCLEVBQWdDO0FBQzlCQTtBQUNBLFNBQU8sQ0FBQ0EsUUFBUSxHQUFULEVBQWVBLFNBQVMsQ0FBVixHQUFlLEdBQTdCLEVBQW1DQSxTQUFTLEVBQVYsR0FBZ0IsR0FBbEQsQ0FBUDtBQUNEOztBQUVELElBQU1DLGdCQUFnQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLEdBQVYsQ0FBdEIsQyxDQUFzQzs7QUFFdEM7QUFDQTs7SUFDYUMsaUIsV0FBQUEsaUI7QUFDWCxtQ0FBbUM7QUFBQSxRQUF0QkMsUUFBc0IsUUFBdEJBLFFBQXNCO0FBQUEsUUFBWkMsU0FBWSxRQUFaQSxTQUFZOztBQUFBOztBQUNqQztBQUNBRCxlQUFXQSxTQUFTRSxHQUFULENBQWE7QUFBQSxhQUFXVCxRQUFRVSxTQUFSLENBQWtCQyxPQUFsQixDQUFYO0FBQUEsS0FBYixDQUFYOztBQUVBO0FBQ0EsUUFBTUMsYUFBYUMsY0FBY04sUUFBZCxDQUFuQjs7QUFFQSxTQUFLQSxRQUFMLEdBQWdCQSxRQUFoQjtBQUNBLFNBQUtLLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsU0FBS0osU0FBTCxHQUFpQkEsU0FB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Q21FLFFBQVFJLE1BQVQsRUFBaUJILFFBQVFLLEtBQXpCLEVBQWdDSixPQUFPeEIsQ0FBdkMsRUFBMEN5QixPQUFPSixXQUFqRCxFQUFWO0FBQ0FyQixTQUFLNEIsTUFBTS9CLE1BQU4sR0FBZXdCLFdBQXBCO0FBQ0QsR0FWRDtBQVdBLFNBQU9LLE1BQVA7QUFDRDs7QUFFRCxTQUFTdEQsc0JBQVQsUUFBd0Q7QUFBQSxNQUF2QlgsUUFBdUIsU0FBdkJBLFFBQXVCO0FBQUEsTUFBYkssVUFBYSxTQUFiQSxVQUFhOztBQUN0RCxNQUFNcUMsWUFBWSxJQUFJd0IsaUJBQUosQ0FBc0I3RCxhQUFhLENBQW5DLENBQWxCO0FBQ0EsTUFBSWtDLElBQUksQ0FBUjtBQUNBdkMsV0FBU3NDLE9BQVQsQ0FBaUIsVUFBQ29CLGNBQUQsRUFBaUJmLFlBQWpCLEVBQWtDO0FBQ2pELFFBQU13QixRQUFRdkUsZ0JBQWdCK0MsWUFBaEIsQ0FBZDtBQUNBLFFBQU1pQixjQUFjbkUsUUFBUXFDLGNBQVIsQ0FBdUI0QixjQUF2QixDQUFwQjtBQUNBaEUsY0FBVSxFQUFDbUUsUUFBUW5CLFNBQVQsRUFBb0JvQixRQUFRSyxLQUE1QixFQUFtQ0osT0FBT3hCLENBQTFDLEVBQTZDeUIsT0FBT0osV0FBcEQsRUFBVjtBQUNBckIsU0FBSzRCLE1BQU0vQixNQUFOLEdBQWV3QixXQUFwQjtBQUNELEdBTEQ7QUFNQSxTQUFPbEIsU0FBUDtBQUNEIiwiZmlsZSI6InBvbHlnb24tdGVzc2VsYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG4vLyBIYW5kbGVzIHRlc3NlbGF0aW9uIG9mIHBvbHlnb25zIHdpdGggaG9sZXNcbi8vIC0gMkQgc3VyZmFjZXNcbi8vIC0gMkQgb3V0bGluZXNcbi8vIC0gM0Qgc3VyZmFjZXMgKHRvcCBhbmQgc2lkZXMgb25seSlcbi8vIC0gM0Qgd2lyZWZyYW1lcyAobm90IHlldClcbmltcG9ydCAqIGFzIFBvbHlnb24gZnJvbSAnLi9wb2x5Z29uJztcbmltcG9ydCB7ZXhwZXJpbWVudGFsfSBmcm9tICdkZWNrLmdsJztcbmNvbnN0IHtmaWxsQXJyYXksIGZwNjRMb3dQYXJ0fSA9IGV4cGVyaW1lbnRhbDtcblxuLy8gTWF5YmUgZGVjay5nbCBvciBsdW1hLmdsIG5lZWRzIHRvIGV4cG9ydCB0aGlzXG5mdW5jdGlvbiBnZXRQaWNraW5nQ29sb3IoaW5kZXgpIHtcbiAgaW5kZXgrKztcbiAgcmV0dXJuIFtpbmRleCAmIDI1NSwgKGluZGV4ID4+IDgpICYgMjU1LCAoaW5kZXggPj4gMTYpICYgMjU1XTtcbn1cblxuY29uc3QgREVGQVVMVF9DT0xPUiA9IFswLCAwLCAwLCAyNTVdOyAvLyBCbGFja1xuXG4vLyBUaGlzIGNsYXNzIGlzIHNldCB1cCB0byBhbGxvdyBxdWVyeWluZyBvbmUgYXR0cmlidXRlIGF0IGEgdGltZVxuLy8gdGhlIHdheSB0aGUgQXR0cmlidXRlTWFuYWdlciBleHBlY3RzIGl0XG5leHBvcnQgY2xhc3MgUG9seWdvblRlc3NlbGF0b3Ige1xuICBjb25zdHJ1Y3Rvcih7cG9seWdvbnMsIEluZGV4VHlwZX0pIHtcbiAgICAvLyBOb3JtYWxpemUgYWxsIHBvbHlnb25zXG4gICAgcG9seWdvbnMgPSBwb2x5Z29ucy5tYXAocG9seWdvbiA9PiBQb2x5Z29uLm5vcm1hbGl6ZShwb2x5Z29uKSk7XG5cbiAgICAvLyBDb3VudCBhbGwgcG9seWdvbiB2ZXJ0aWNlc1xuICAgIGNvbnN0IHBvaW50Q291bnQgPSBnZXRQb2ludENvdW50KHBvbHlnb25zKTtcblxuICAgIHRoaXMucG9seWdvbnMgPSBwb2x5Z29ucztcbiAgICB0aGlzLnBvaW50Q291bnQgPSBwb2ludENvdW50O1xuICAgIHRoaXMuSW5kZXhUeXBlID0gSW5kZXhUeXBlO1xuXG4gICAgLy8gVE9ETzogZHluYW1pY2FsbHkgZGVjaWRlIEluZGV4VHlwZSBpbiB0ZXNzZWxhdG9yP1xuICAgIC8vIENoZWNrIGlmIHRoZSB2ZXJ0ZXggY291bnQgZXhjZWRlcyBpbmRleCB0eXBlIGxpbWl0XG4gICAgaWYgKEluZGV4VHlwZSA9PT0gVWludDE2QXJyYXkgJiYgcG9pbnRDb3VudCA+IDY1NTM1KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWZXJ0ZXggY291bnQgZXhjZWVkcyBicm93c2VyJ3MgbGltaXRcIik7XG4gICAgfVxuXG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge1xuICAgICAgcGlja2luZ0NvbG9yczogY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnR9KVxuICAgIH07XG4gIH1cblxuICB1cGRhdGVQb3NpdGlvbnMoe2ZwNjQsIGV4dHJ1ZGVkfSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzLCBwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuXG4gICAgYXR0cmlidXRlcy5wb3NpdGlvbnMgPSBhdHRyaWJ1dGVzLnBvc2l0aW9ucyB8fCBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiAzKTtcbiAgICBhdHRyaWJ1dGVzLm5leHRQb3NpdGlvbnMgPSBhdHRyaWJ1dGVzLm5leHRQb3NpdGlvbnMgfHwgbmV3IEZsb2F0MzJBcnJheShwb2ludENvdW50ICogMyk7XG5cbiAgICBpZiAoZnA2NCkge1xuICAgICAgLy8gV2Ugb25seSBuZWVkIHgsIHkgY29tcG9uZW50XG4gICAgICBhdHRyaWJ1dGVzLnBvc2l0aW9uczY0eHlMb3cgPSBhdHRyaWJ1dGVzLnBvc2l0aW9uczY0eHlMb3cgfHwgbmV3IEZsb2F0MzJBcnJheShwb2ludENvdW50ICogMik7XG4gICAgICBhdHRyaWJ1dGVzLm5leHRQb3NpdGlvbnM2NHh5TG93ID1cbiAgICAgICAgYXR0cmlidXRlcy5uZXh0UG9zaXRpb25zNjR4eUxvdyB8fCBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiAyKTtcbiAgICB9XG5cbiAgICB1cGRhdGVQb3NpdGlvbnMoe2NhY2hlOiBhdHRyaWJ1dGVzLCBwb2x5Z29ucywgZXh0cnVkZWQsIGZwNjR9KTtcbiAgfVxuXG4gIGluZGljZXMoKSB7XG4gICAgY29uc3Qge3BvbHlnb25zLCBJbmRleFR5cGV9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlSW5kaWNlcyh7cG9seWdvbnMsIEluZGV4VHlwZX0pO1xuICB9XG5cbiAgcG9zaXRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMucG9zaXRpb25zO1xuICB9XG4gIHBvc2l0aW9uczY0eHlMb3coKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5wb3NpdGlvbnM2NHh5TG93O1xuICB9XG5cbiAgbmV4dFBvc2l0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLm5leHRQb3NpdGlvbnM7XG4gIH1cbiAgbmV4dFBvc2l0aW9uczY0eHlMb3coKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5uZXh0UG9zaXRpb25zNjR4eUxvdztcbiAgfVxuXG4gIGVsZXZhdGlvbnMoe2tleSA9ICdlbGV2YXRpb25zJywgZ2V0RWxldmF0aW9uID0geCA9PiAxMDB9ID0ge30pIHtcbiAgICBjb25zdCB7YXR0cmlidXRlcywgcG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICBjb25zdCB2YWx1ZXMgPSB1cGRhdGVFbGV2YXRpb25zKHtjYWNoZTogYXR0cmlidXRlc1trZXldLCBwb2x5Z29ucywgcG9pbnRDb3VudCwgZ2V0RWxldmF0aW9ufSk7XG4gICAgYXR0cmlidXRlc1trZXldID0gdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXM7XG4gIH1cblxuICBjb2xvcnMoe2tleSA9ICdjb2xvcnMnLCBnZXRDb2xvciA9IHggPT4gREVGQVVMVF9DT0xPUn0gPSB7fSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzLCBwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuICAgIGNvbnN0IHZhbHVlcyA9IHVwZGF0ZUNvbG9ycyh7Y2FjaGU6IGF0dHJpYnV0ZXNba2V5XSwgcG9seWdvbnMsIHBvaW50Q291bnQsIGdldENvbG9yfSk7XG4gICAgYXR0cmlidXRlc1trZXldID0gdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXM7XG4gIH1cblxuICBwaWNraW5nQ29sb3JzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMucGlja2luZ0NvbG9ycztcbiAgfVxufVxuXG4vLyBDb3VudCBudW1iZXIgb2YgcG9pbnRzIGluIGEgbGlzdCBvZiBjb21wbGV4IHBvbHlnb25zXG5mdW5jdGlvbiBnZXRQb2ludENvdW50KHBvbHlnb25zKSB7XG4gIHJldHVybiBwb2x5Z29ucy5yZWR1Y2UoKHBvaW50cywgcG9seWdvbikgPT4gcG9pbnRzICsgUG9seWdvbi5nZXRWZXJ0ZXhDb3VudChwb2x5Z29uKSwgMCk7XG59XG5cbi8vIENPdW50IG51bWJlciBvZiB0cmlhbmdsZXMgaW4gYSBsaXN0IG9mIGNvbXBsZXggcG9seWdvbnNcbmZ1bmN0aW9uIGdldFRyaWFuZ2xlQ291bnQocG9seWdvbnMpIHtcbiAgcmV0dXJuIHBvbHlnb25zLnJlZHVjZSgodHJpYW5nbGVzLCBwb2x5Z29uKSA9PiB0cmlhbmdsZXMgKyBQb2x5Z29uLmdldFRyaWFuZ2xlQ291bnQocG9seWdvbiksIDApO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBvZmZzZXRzIG9mIGVhY2ggY29tcGxleCBwb2x5Z29uIGluIHRoZSBjb21iaW5lZCBhcnJheSBvZiBhbGwgcG9seWdvbnNcbmZ1bmN0aW9uIGdldFBvbHlnb25PZmZzZXRzKHBvbHlnb25zKSB7XG4gIGNvbnN0IG9mZnNldHMgPSBuZXcgQXJyYXkocG9seWdvbnMubGVuZ3RoICsgMSk7XG4gIG9mZnNldHNbMF0gPSAwO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgocG9seWdvbiwgaSkgPT4ge1xuICAgIG9mZnNldCArPSBQb2x5Z29uLmdldFZlcnRleENvdW50KHBvbHlnb24pO1xuICAgIG9mZnNldHNbaSArIDFdID0gb2Zmc2V0O1xuICB9KTtcbiAgcmV0dXJuIG9mZnNldHM7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUluZGljZXMoe3BvbHlnb25zLCBJbmRleFR5cGUgPSBVaW50MzJBcnJheX0pIHtcbiAgLy8gQ2FsY3VsYXRlIGxlbmd0aCBvZiBpbmRleCBhcnJheSAoMyAqIG51bWJlciBvZiB0cmlhbmdsZXMpXG4gIGNvbnN0IGluZGV4Q291bnQgPSAzICogZ2V0VHJpYW5nbGVDb3VudChwb2x5Z29ucyk7XG4gIGNvbnN0IG9mZnNldHMgPSBnZXRQb2x5Z29uT2Zmc2V0cyhwb2x5Z29ucyk7XG5cbiAgLy8gQWxsb2NhdGUgdGhlIGF0dHJpYnV0ZVxuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgSW5kZXhUeXBlKGluZGV4Q291bnQpO1xuXG4gIC8vIDEuIGdldCB0cmlhbmd1bGF0ZWQgaW5kaWNlcyBmb3IgdGhlIGludGVybmFsIGFyZWFzXG4gIC8vIDIuIG9mZnNldCB0aGVtIGJ5IHRoZSBudW1iZXIgb2YgaW5kaWNlcyBpbiBwcmV2aW91cyBwb2x5Z29uc1xuICBsZXQgaSA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKHBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGZvciAoY29uc3QgaW5kZXggb2YgUG9seWdvbi5nZXRTdXJmYWNlSW5kaWNlcyhwb2x5Z29uKSkge1xuICAgICAgYXR0cmlidXRlW2krK10gPSBpbmRleCArIG9mZnNldHNbcG9seWdvbkluZGV4XTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBvc2l0aW9ucyh7XG4gIGNhY2hlOiB7cG9zaXRpb25zLCBwb3NpdGlvbnM2NHh5TG93LCBuZXh0UG9zaXRpb25zLCBuZXh0UG9zaXRpb25zNjR4eUxvd30sXG4gIHBvbHlnb25zLFxuICBleHRydWRlZCxcbiAgZnA2NFxufSkge1xuICAvLyBGbGF0dGVuIG91dCBhbGwgdGhlIHZlcnRpY2VzIG9mIGFsbCB0aGUgc3ViIHN1YlBvbHlnb25zXG4gIGxldCBpID0gMDtcbiAgbGV0IG5leHRJID0gMDtcbiAgbGV0IHN0YXJ0VmVydGV4ID0gbnVsbDtcblxuICBjb25zdCBwdXNoU3RhcnRWZXJ0ZXggPSAoeCwgeSwgeiwgeExvdywgeUxvdykgPT4ge1xuICAgIGlmIChleHRydWRlZCkge1xuICAgICAgLy8gU2F2ZSBmaXJzdCB2ZXJ0ZXggZm9yIHNldHRpbmcgbmV4dFBvc2l0aW9ucyBhdCB0aGUgZW5kIG9mIHRoZSBsb29wXG4gICAgICBzdGFydFZlcnRleCA9IHt4LCB5LCB6LCB4TG93LCB5TG93fTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgcG9wU3RhcnRWZXJ0ZXggPSAoKSA9PiB7XG4gICAgaWYgKHN0YXJ0VmVydGV4KSB7XG4gICAgICBuZXh0UG9zaXRpb25zW25leHRJICogM10gPSBzdGFydFZlcnRleC54O1xuICAgICAgbmV4dFBvc2l0aW9uc1tuZXh0SSAqIDMgKyAxXSA9IHN0YXJ0VmVydGV4Lnk7XG4gICAgICBuZXh0UG9zaXRpb25zW25leHRJICogMyArIDJdID0gc3RhcnRWZXJ0ZXguejtcbiAgICAgIGlmIChmcDY0KSB7XG4gICAgICAgIG5leHRQb3NpdGlvbnM2NHh5TG93W25leHRJICogMl0gPSBzdGFydFZlcnRleC54TG93O1xuICAgICAgICBuZXh0UG9zaXRpb25zNjR4eUxvd1tuZXh0SSAqIDIgKyAxXSA9IHN0YXJ0VmVydGV4LnlMb3c7XG4gICAgICB9XG4gICAgICBuZXh0SSsrO1xuICAgIH1cbiAgICBzdGFydFZlcnRleCA9IG51bGw7XG4gIH07XG5cbiAgcG9seWdvbnMuZm9yRWFjaCgocG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgUG9seWdvbi5mb3JFYWNoVmVydGV4KHBvbHlnb24sICh2ZXJ0ZXgsIHZlcnRleEluZGV4KSA9PiB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICBjb25zdCB4ID0gdmVydGV4WzBdO1xuICAgICAgY29uc3QgeSA9IHZlcnRleFsxXTtcbiAgICAgIGNvbnN0IHogPSB2ZXJ0ZXhbMl0gfHwgMDtcbiAgICAgIGxldCB4TG93O1xuICAgICAgbGV0IHlMb3c7XG5cbiAgICAgIHBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgcG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgcG9zaXRpb25zW2kgKiAzICsgMl0gPSB6O1xuICAgICAgaWYgKGZwNjQpIHtcbiAgICAgICAgeExvdyA9IGZwNjRMb3dQYXJ0KHgpO1xuICAgICAgICB5TG93ID0gZnA2NExvd1BhcnQoeSk7XG4gICAgICAgIHBvc2l0aW9uczY0eHlMb3dbaSAqIDJdID0geExvdztcbiAgICAgICAgcG9zaXRpb25zNjR4eUxvd1tpICogMiArIDFdID0geUxvdztcbiAgICAgIH1cbiAgICAgIGkrKztcblxuICAgICAgaWYgKGV4dHJ1ZGVkICYmIHZlcnRleEluZGV4ID4gMCkge1xuICAgICAgICBuZXh0UG9zaXRpb25zW25leHRJICogM10gPSB4O1xuICAgICAgICBuZXh0UG9zaXRpb25zW25leHRJICogMyArIDFdID0geTtcbiAgICAgICAgbmV4dFBvc2l0aW9uc1tuZXh0SSAqIDMgKyAyXSA9IHo7XG4gICAgICAgIGlmIChmcDY0KSB7XG4gICAgICAgICAgbmV4dFBvc2l0aW9uczY0eHlMb3dbbmV4dEkgKiAyXSA9IHhMb3c7XG4gICAgICAgICAgbmV4dFBvc2l0aW9uczY0eHlMb3dbbmV4dEkgKiAyICsgMV0gPSB5TG93O1xuICAgICAgICB9XG4gICAgICAgIG5leHRJKys7XG4gICAgICB9XG4gICAgICBpZiAodmVydGV4SW5kZXggPT09IDApIHtcbiAgICAgICAgcG9wU3RhcnRWZXJ0ZXgoKTtcbiAgICAgICAgcHVzaFN0YXJ0VmVydGV4KHgsIHksIHosIHhMb3csIHlMb3cpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiAgcG9wU3RhcnRWZXJ0ZXgoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRWxldmF0aW9ucyh7Y2FjaGUsIHBvbHlnb25zLCBwb2ludENvdW50LCBnZXRFbGV2YXRpb259KSB7XG4gIGNvbnN0IGVsZXZhdGlvbnMgPSBjYWNoZSB8fCBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQpO1xuICBsZXQgaSA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKGNvbXBsZXhQb2x5Z29uLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICAvLyBDYWxjdWxhdGUgcG9seWdvbiBjb2xvclxuICAgIGNvbnN0IGhlaWdodCA9IGdldEVsZXZhdGlvbihwb2x5Z29uSW5kZXgpO1xuXG4gICAgY29uc3QgdmVydGV4Q291bnQgPSBQb2x5Z29uLmdldFZlcnRleENvdW50KGNvbXBsZXhQb2x5Z29uKTtcbiAgICBmaWxsQXJyYXkoe3RhcmdldDogZWxldmF0aW9ucywgc291cmNlOiBbaGVpZ2h0XSwgc3RhcnQ6IGksIGNvdW50OiB2ZXJ0ZXhDb3VudH0pO1xuICAgIGkgKz0gdmVydGV4Q291bnQ7XG4gIH0pO1xuICByZXR1cm4gZWxldmF0aW9ucztcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ29sb3JzKHtjYWNoZSwgcG9seWdvbnMsIHBvaW50Q291bnQsIGdldENvbG9yfSkge1xuICBjb25zdCBjb2xvcnMgPSBjYWNoZSB8fCBuZXcgVWludDhDbGFtcGVkQXJyYXkocG9pbnRDb3VudCAqIDQpO1xuICBsZXQgaSA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKGNvbXBsZXhQb2x5Z29uLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICAvLyBDYWxjdWxhdGUgcG9seWdvbiBjb2xvclxuICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IocG9seWdvbkluZGV4KTtcbiAgICBpZiAoaXNOYU4oY29sb3JbM10pKSB7XG4gICAgICBjb2xvclszXSA9IDI1NTtcbiAgICB9XG5cbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQoY29tcGxleFBvbHlnb24pO1xuICAgIGZpbGxBcnJheSh7dGFyZ2V0OiBjb2xvcnMsIHNvdXJjZTogY29sb3IsIHN0YXJ0OiBpLCBjb3VudDogdmVydGV4Q291bnR9KTtcbiAgICBpICs9IGNvbG9yLmxlbmd0aCAqIHZlcnRleENvdW50O1xuICB9KTtcbiAgcmV0dXJuIGNvbG9ycztcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnR9KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShwb2ludENvdW50ICogMyk7XG4gIGxldCBpID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgoY29tcGxleFBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGNvbnN0IGNvbG9yID0gZ2V0UGlja2luZ0NvbG9yKHBvbHlnb25JbmRleCk7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSBQb2x5Z29uLmdldFZlcnRleENvdW50KGNvbXBsZXhQb2x5Z29uKTtcbiAgICBmaWxsQXJyYXkoe3RhcmdldDogYXR0cmlidXRlLCBzb3VyY2U6IGNvbG9yLCBzdGFydDogaSwgY291bnQ6IHZlcnRleENvdW50fSk7XG4gICAgaSArPSBjb2xvci5sZW5ndGggKiB2ZXJ0ZXhDb3VudDtcbiAgfSk7XG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG4iXX0=