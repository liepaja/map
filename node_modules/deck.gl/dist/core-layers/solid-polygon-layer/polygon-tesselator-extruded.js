'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PolygonTesselatorExtruded = undefined;

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

var _polygon = require('./polygon');

var Polygon = _interopRequireWildcard(_polygon);

var _core = require('../../core');

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fp64LowPart = _core.experimental.fp64LowPart,
    fillArray = _core.experimental.fillArray;


function getPickingColor(index) {
  return [index + 1 & 255, index + 1 >> 8 & 255, index + 1 >> 8 >> 8 & 255];
}

function arrayPush(array, values) {
  var length = values.length;
  var offset = array.length;

  for (var index = 0; index < length; index++) {
    array[offset++] = values[index];
  }
  return array;
}

function flatten(values, level) {
  var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (level > 1) {
    values.forEach(function (v) {
      return flatten(v, level - 1, result);
    });
  } else {
    arrayPush(result, values);
  }
  return result;
}

var DEFAULT_COLOR = [0, 0, 0, 255]; // Black

var PolygonTesselatorExtruded = exports.PolygonTesselatorExtruded = function () {
  function PolygonTesselatorExtruded(_ref) {
    var polygons = _ref.polygons,
        _ref$getHeight = _ref.getHeight,
        getHeight = _ref$getHeight === undefined ? function (x) {
      return 1000;
    } : _ref$getHeight,
        _ref$getColor = _ref.getColor,
        getColor = _ref$getColor === undefined ? function (x) {
      return DEFAULT_COLOR;
    } : _ref$getColor,
        _ref$wireframe = _ref.wireframe,
        wireframe = _ref$wireframe === undefined ? false : _ref$wireframe,
        _ref$fp = _ref.fp64,
        fp64 = _ref$fp === undefined ? false : _ref$fp;

    _classCallCheck(this, PolygonTesselatorExtruded);

    this.fp64 = fp64;

    // Expensive operation, convert all polygons to arrays
    polygons = polygons.map(function (complexPolygon, polygonIndex) {
      var height = getHeight(polygonIndex) || 0;
      return Polygon.normalize(complexPolygon).map(function (polygon) {
        return polygon.map(function (coord) {
          return [coord[0], coord[1], height];
        });
      });
    });

    var groupedVertices = polygons;
    this.groupedVertices = polygons;
    var pointCount = getPointCount(polygons);
    this.pointCount = pointCount;
    this.wireframe = wireframe;

    this.attributes = {};

    var positionsJS = calculatePositionsJS({ groupedVertices: groupedVertices, pointCount: pointCount, wireframe: wireframe });
    Object.assign(this.attributes, {
      positions: calculatePositions(positionsJS, this.fp64),
      indices: calculateIndices({ groupedVertices: groupedVertices, wireframe: wireframe }),
      normals: calculateNormals({ groupedVertices: groupedVertices, pointCount: pointCount, wireframe: wireframe }),
      // colors: calculateColors({groupedVertices, wireframe, getColor}),
      pickingColors: calculatePickingColors({ groupedVertices: groupedVertices, pointCount: pointCount, wireframe: wireframe })
    });
  }

  _createClass(PolygonTesselatorExtruded, [{
    key: 'indices',
    value: function indices() {
      return this.attributes.indices;
    }
  }, {
    key: 'positions',
    value: function positions() {
      return this.attributes.positions;
    }
  }, {
    key: 'normals',
    value: function normals() {
      return this.attributes.normals;
    }
  }, {
    key: 'colors',
    value: function colors() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$getColor = _ref2.getColor,
          getColor = _ref2$getColor === undefined ? function (x) {
        return DEFAULT_COLOR;
      } : _ref2$getColor;

      var groupedVertices = this.groupedVertices,
          pointCount = this.pointCount,
          wireframe = this.wireframe;

      return calculateColors({ groupedVertices: groupedVertices, pointCount: pointCount, wireframe: wireframe, getColor: getColor });
    }
  }, {
    key: 'pickingColors',
    value: function pickingColors() {
      return this.attributes.pickingColors;
    }

    // updateTriggers: {
    //   positions: ['getHeight'],
    //   colors: ['getColors']
    //   pickingColors: 'none'
    // }

  }]);

  return PolygonTesselatorExtruded;
}();

// Count number of points in a list of complex polygons


function getPointCount(polygons) {
  return polygons.reduce(function (points, polygon) {
    return points + Polygon.getVertexCount(polygon);
  }, 0);
}

function calculateIndices(_ref3) {
  var groupedVertices = _ref3.groupedVertices,
      _ref3$wireframe = _ref3.wireframe,
      wireframe = _ref3$wireframe === undefined ? false : _ref3$wireframe;

  // adjust index offset for multiple polygons
  var multiplier = wireframe ? 2 : 5;
  var offsets = [];
  groupedVertices.reduce(function (vertexIndex, vertices) {
    offsets.push(vertexIndex);
    return vertexIndex + Polygon.getVertexCount(vertices) * multiplier;
  }, 0);

  var indices = groupedVertices.map(function (vertices, polygonIndex) {
    return wireframe ? // 1. get sequentially ordered indices of each polygons wireframe
    // 2. offset them by the number of indices in previous polygons
    calculateContourIndices(vertices, offsets[polygonIndex]) : // 1. get triangulated indices for the internal areas
    // 2. offset them by the number of indices in previous polygons
    calculateSurfaceIndices(vertices, offsets[polygonIndex]);
  });

  return new Uint32Array(flatten(indices, 2));
}

// Calculate a flat position array in JS - can be mapped to 32 or 64 bit typed arrays
// Remarks:
// * each top vertex is on 3 surfaces
// * each bottom vertex is on 2 surfaces
function calculatePositionsJS(_ref4) {
  var groupedVertices = _ref4.groupedVertices,
      pointCount = _ref4.pointCount,
      _ref4$wireframe = _ref4.wireframe,
      wireframe = _ref4$wireframe === undefined ? false : _ref4$wireframe;

  var multiplier = wireframe ? 2 : 5;
  var positions = new Float32Array(pointCount * 3 * multiplier);
  var vertexIndex = 0;

  groupedVertices.forEach(function (vertices) {
    var topVertices = flatten(vertices, 3);

    var baseVertices = topVertices.slice(0);
    var i = topVertices.length - 1;
    while (i > 0) {
      baseVertices[i] = 0;
      i -= 3;
    }
    var len = topVertices.length;

    if (wireframe) {
      fillArray({ target: positions, source: topVertices, start: vertexIndex });
      fillArray({ target: positions, source: baseVertices, start: vertexIndex + len });
    } else {
      fillArray({ target: positions, source: topVertices, start: vertexIndex, count: 3 });
      fillArray({
        target: positions,
        source: baseVertices,
        start: vertexIndex + len * 3,
        count: 2
      });
    }
    vertexIndex += len * multiplier;
  });

  return positions;
}

function calculatePositions(positionsJS, fp64) {
  var positionLow = void 0;
  if (fp64) {
    // We only need x, y component
    var vertexCount = positionsJS.length / 3;
    positionLow = new Float32Array(vertexCount * 2);
    for (var i = 0; i < vertexCount; i++) {
      positionLow[i * 2 + 0] = fp64LowPart(positionsJS[i * 3 + 0]);
      positionLow[i * 2 + 1] = fp64LowPart(positionsJS[i * 3 + 1]);
    }
  }
  return { positions: positionsJS, positions64xyLow: positionLow };
}

function calculateNormals(_ref5) {
  var groupedVertices = _ref5.groupedVertices,
      pointCount = _ref5.pointCount,
      wireframe = _ref5.wireframe;

  var up = [0, 0, 1];
  var multiplier = wireframe ? 2 : 5;

  var normals = new Float32Array(pointCount * 3 * multiplier);
  var vertexIndex = 0;

  if (wireframe) {
    return fillArray({ target: normals, source: up, count: pointCount * multiplier });
  }

  groupedVertices.map(function (vertices, polygonIndex) {
    var vertexCount = Polygon.getVertexCount(vertices);

    fillArray({ target: normals, source: up, start: vertexIndex, count: vertexCount });
    vertexIndex += vertexCount * 3;

    var sideNormalsForward = [];
    var sideNormalsBackward = [];

    vertices.forEach(function (polygon) {
      var sideNormals = calculateSideNormals(polygon);
      var firstNormal = sideNormals.slice(0, 3);

      arrayPush(sideNormalsForward, sideNormals);
      arrayPush(sideNormalsForward, firstNormal);

      arrayPush(sideNormalsBackward, firstNormal);
      arrayPush(sideNormalsBackward, sideNormals);
    });

    fillArray({
      target: normals,
      start: vertexIndex,
      count: 2,
      source: sideNormalsForward.concat(sideNormalsBackward)
    });
    vertexIndex += vertexCount * 3 * 4;
  });

  return normals;
}

function calculateSideNormals(vertices) {
  var normals = [];

  var lastVertice = null;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = vertices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var vertice = _step.value;

      if (lastVertice) {
        // vertex[i-1], vertex[i]
        var n = getNormal(lastVertice, vertice);
        arrayPush(normals, n);
      }
      lastVertice = vertice;
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

  return normals;
}

function calculateColors(_ref6) {
  var groupedVertices = _ref6.groupedVertices,
      pointCount = _ref6.pointCount,
      getColor = _ref6.getColor,
      _ref6$wireframe = _ref6.wireframe,
      wireframe = _ref6$wireframe === undefined ? false : _ref6$wireframe;

  var multiplier = wireframe ? 2 : 5;
  var colors = new Uint8ClampedArray(pointCount * 4 * multiplier);
  var vertexIndex = 0;

  groupedVertices.forEach(function (complexPolygon, polygonIndex) {
    var color = getColor(polygonIndex);
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;

    var numVertices = Polygon.getVertexCount(complexPolygon);

    fillArray({ target: colors, source: color, start: vertexIndex, count: numVertices * multiplier });
    vertexIndex += color.length * numVertices * multiplier;
  });

  return colors;
}

function calculatePickingColors(_ref7) {
  var groupedVertices = _ref7.groupedVertices,
      pointCount = _ref7.pointCount,
      _ref7$wireframe = _ref7.wireframe,
      wireframe = _ref7$wireframe === undefined ? false : _ref7$wireframe;

  var multiplier = wireframe ? 2 : 5;
  var colors = new Uint8ClampedArray(pointCount * 3 * multiplier);
  var vertexIndex = 0;

  groupedVertices.forEach(function (vertices, polygonIndex) {
    var numVertices = Polygon.getVertexCount(vertices);
    var color = getPickingColor(polygonIndex);

    fillArray({ target: colors, source: color, start: vertexIndex, count: numVertices * multiplier });
    vertexIndex += color.length * numVertices * multiplier;
  });
  return colors;
}

function calculateContourIndices(vertices, offset) {
  var stride = Polygon.getVertexCount(vertices);
  var indices = [];

  vertices.forEach(function (polygon) {
    indices.push(offset);
    var numVertices = polygon.length;

    // polygon top
    // use vertex pairs for GL.LINES => [0, 1, 1, 2, 2, ..., n-1, n-1, 0]
    for (var i = 1; i < numVertices - 1; i++) {
      indices.push(i + offset, i + offset);
    }
    indices.push(offset);

    // polygon sides
    for (var _i = 0; _i < numVertices - 1; _i++) {
      indices.push(_i + offset, _i + stride + offset);
    }

    offset += numVertices;
  });

  return indices;
}

function drawSurfaceRectangle(targetArray, offset, stride) {
  targetArray.push(offset + stride, offset + stride * 3, offset + stride * 2 + 1, offset + stride * 2 + 1, offset + stride * 3, offset + stride * 4 + 1);
}

function calculateSurfaceIndices(vertices, offset) {
  var stride = Polygon.getVertexCount(vertices);

  var holes = null;
  var holeCount = vertices.length - 1;

  if (holeCount) {
    holes = [];
    var vertexIndex = 0;
    for (var i = 0; i < holeCount; i++) {
      vertexIndex += vertices[i].length;
      holes[i] = vertexIndex;
    }
  }

  var indices = (0, _earcut2.default)(flatten(vertices, 3), holes, 3).map(function (index) {
    return index + offset;
  });

  vertices.forEach(function (polygon) {
    var numVertices = polygon.length;

    // polygon sides
    for (var _i2 = 0; _i2 < numVertices - 1; _i2++) {
      drawSurfaceRectangle(indices, offset + _i2, stride);
    }

    offset += numVertices;
  });

  return indices;
}

// helpers

// get normal vector of line segment
function getNormal(p1, p2) {
  return [p1[1] - p2[1], p2[0] - p1[0], 0];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci1leHRydWRlZC5qcyJdLCJuYW1lcyI6WyJQb2x5Z29uIiwiZnA2NExvd1BhcnQiLCJmaWxsQXJyYXkiLCJnZXRQaWNraW5nQ29sb3IiLCJpbmRleCIsImFycmF5UHVzaCIsImFycmF5IiwidmFsdWVzIiwibGVuZ3RoIiwib2Zmc2V0IiwiZmxhdHRlbiIsImxldmVsIiwicmVzdWx0IiwiZm9yRWFjaCIsInYiLCJERUZBVUxUX0NPTE9SIiwiUG9seWdvblRlc3NlbGF0b3JFeHRydWRlZCIsInBvbHlnb25zIiwiZ2V0SGVpZ2h0IiwiZ2V0Q29sb3IiLCJ3aXJlZnJhbWUiLCJmcDY0IiwibWFwIiwiY29tcGxleFBvbHlnb24iLCJwb2x5Z29uSW5kZXgiLCJoZWlnaHQiLCJub3JtYWxpemUiLCJwb2x5Z29uIiwiY29vcmQiLCJncm91cGVkVmVydGljZXMiLCJwb2ludENvdW50IiwiZ2V0UG9pbnRDb3VudCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbnNKUyIsImNhbGN1bGF0ZVBvc2l0aW9uc0pTIiwiT2JqZWN0IiwiYXNzaWduIiwicG9zaXRpb25zIiwiY2FsY3VsYXRlUG9zaXRpb25zIiwiaW5kaWNlcyIsImNhbGN1bGF0ZUluZGljZXMiLCJub3JtYWxzIiwiY2FsY3VsYXRlTm9ybWFscyIsInBpY2tpbmdDb2xvcnMiLCJjYWxjdWxhdGVQaWNraW5nQ29sb3JzIiwiY2FsY3VsYXRlQ29sb3JzIiwicmVkdWNlIiwicG9pbnRzIiwiZ2V0VmVydGV4Q291bnQiLCJtdWx0aXBsaWVyIiwib2Zmc2V0cyIsInZlcnRleEluZGV4IiwidmVydGljZXMiLCJwdXNoIiwiY2FsY3VsYXRlQ29udG91ckluZGljZXMiLCJjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyIsIlVpbnQzMkFycmF5IiwiRmxvYXQzMkFycmF5IiwidG9wVmVydGljZXMiLCJiYXNlVmVydGljZXMiLCJzbGljZSIsImkiLCJsZW4iLCJ0YXJnZXQiLCJzb3VyY2UiLCJzdGFydCIsImNvdW50IiwicG9zaXRpb25Mb3ciLCJ2ZXJ0ZXhDb3VudCIsInBvc2l0aW9uczY0eHlMb3ciLCJ1cCIsInNpZGVOb3JtYWxzRm9yd2FyZCIsInNpZGVOb3JtYWxzQmFja3dhcmQiLCJzaWRlTm9ybWFscyIsImNhbGN1bGF0ZVNpZGVOb3JtYWxzIiwiZmlyc3ROb3JtYWwiLCJjb25jYXQiLCJsYXN0VmVydGljZSIsInZlcnRpY2UiLCJuIiwiZ2V0Tm9ybWFsIiwiY29sb3JzIiwiVWludDhDbGFtcGVkQXJyYXkiLCJjb2xvciIsIk51bWJlciIsImlzRmluaXRlIiwibnVtVmVydGljZXMiLCJzdHJpZGUiLCJkcmF3U3VyZmFjZVJlY3RhbmdsZSIsInRhcmdldEFycmF5IiwiaG9sZXMiLCJob2xlQ291bnQiLCJwMSIsInAyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7SUFBWUEsTzs7QUFDWjs7QUFFQTs7Ozs7Ozs7OztJQURPQyxXLHNCQUFBQSxXO0lBQWFDLFMsc0JBQUFBLFM7OztBQUdwQixTQUFTQyxlQUFULENBQXlCQyxLQUF6QixFQUFnQztBQUM5QixTQUFPLENBQUVBLFFBQVEsQ0FBVCxHQUFjLEdBQWYsRUFBc0JBLFFBQVEsQ0FBVCxJQUFlLENBQWhCLEdBQXFCLEdBQXpDLEVBQWlEQSxRQUFRLENBQVQsSUFBZSxDQUFoQixJQUFzQixDQUF2QixHQUE0QixHQUExRSxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsU0FBVCxDQUFtQkMsS0FBbkIsRUFBMEJDLE1BQTFCLEVBQWtDO0FBQ2hDLE1BQU1DLFNBQVNELE9BQU9DLE1BQXRCO0FBQ0EsTUFBSUMsU0FBU0gsTUFBTUUsTUFBbkI7O0FBRUEsT0FBSyxJQUFJSixRQUFRLENBQWpCLEVBQW9C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QUVBO0FBQ0EsU0FBU3lDLFNBQVQsQ0FBbUJZLEVBQW5CLEVBQXVCQyxFQUF2QixFQUEyQjtBQUN6QixTQUFPLENBQUNELEdBQUcsQ0FBSCxJQUFRQyxHQUFHLENBQUgsQ0FBVCxFQUFnQkEsR0FBRyxDQUFILElBQVFELEdBQUcsQ0FBSCxDQUF4QixFQUErQixDQUEvQixDQUFQO0FBQ0QiLCJmaWxlIjoicG9seWdvbi10ZXNzZWxhdG9yLWV4dHJ1ZGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCAqIGFzIFBvbHlnb24gZnJvbSAnLi9wb2x5Z29uJztcbmltcG9ydCB7ZXhwZXJpbWVudGFsfSBmcm9tICcuLi8uLi9jb3JlJztcbmNvbnN0IHtmcDY0TG93UGFydCwgZmlsbEFycmF5fSA9IGV4cGVyaW1lbnRhbDtcbmltcG9ydCBlYXJjdXQgZnJvbSAnZWFyY3V0JztcblxuZnVuY3Rpb24gZ2V0UGlja2luZ0NvbG9yKGluZGV4KSB7XG4gIHJldHVybiBbKGluZGV4ICsgMSkgJiAyNTUsICgoaW5kZXggKyAxKSA+PiA4KSAmIDI1NSwgKCgoaW5kZXggKyAxKSA+PiA4KSA+PiA4KSAmIDI1NV07XG59XG5cbmZ1bmN0aW9uIGFycmF5UHVzaChhcnJheSwgdmFsdWVzKSB7XG4gIGNvbnN0IGxlbmd0aCA9IHZhbHVlcy5sZW5ndGg7XG4gIGxldCBvZmZzZXQgPSBhcnJheS5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgIGFycmF5W29mZnNldCsrXSA9IHZhbHVlc1tpbmRleF07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuKHZhbHVlcywgbGV2ZWwsIHJlc3VsdCA9IFtdKSB7XG4gIGlmIChsZXZlbCA+IDEpIHtcbiAgICB2YWx1ZXMuZm9yRWFjaCh2ID0+IGZsYXR0ZW4odiwgbGV2ZWwgLSAxLCByZXN1bHQpKTtcbiAgfSBlbHNlIHtcbiAgICBhcnJheVB1c2gocmVzdWx0LCB2YWx1ZXMpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IERFRkFVTFRfQ09MT1IgPSBbMCwgMCwgMCwgMjU1XTsgLy8gQmxhY2tcblxuZXhwb3J0IGNsYXNzIFBvbHlnb25UZXNzZWxhdG9yRXh0cnVkZWQge1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgcG9seWdvbnMsXG4gICAgZ2V0SGVpZ2h0ID0geCA9PiAxMDAwLFxuICAgIGdldENvbG9yID0geCA9PiBERUZBVUxUX0NPTE9SLFxuICAgIHdpcmVmcmFtZSA9IGZhbHNlLFxuICAgIGZwNjQgPSBmYWxzZVxuICB9KSB7XG4gICAgdGhpcy5mcDY0ID0gZnA2NDtcblxuICAgIC8vIEV4cGVuc2l2ZSBvcGVyYXRpb24sIGNvbnZlcnQgYWxsIHBvbHlnb25zIHRvIGFycmF5c1xuICAgIHBvbHlnb25zID0gcG9seWdvbnMubWFwKChjb21wbGV4UG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgICBjb25zdCBoZWlnaHQgPSBnZXRIZWlnaHQocG9seWdvbkluZGV4KSB8fCAwO1xuICAgICAgcmV0dXJuIFBvbHlnb24ubm9ybWFsaXplKGNvbXBsZXhQb2x5Z29uKS5tYXAocG9seWdvbiA9PlxuICAgICAgICBwb2x5Z29uLm1hcChjb29yZCA9PiBbY29vcmRbMF0sIGNvb3JkWzFdLCBoZWlnaHRdKVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGdyb3VwZWRWZXJ0aWNlcyA9IHBvbHlnb25zO1xuICAgIHRoaXMuZ3JvdXBlZFZlcnRpY2VzID0gcG9seWdvbnM7XG4gICAgY29uc3QgcG9pbnRDb3VudCA9IGdldFBvaW50Q291bnQocG9seWdvbnMpO1xuICAgIHRoaXMucG9pbnRDb3VudCA9IHBvaW50Q291bnQ7XG4gICAgdGhpcy53aXJlZnJhbWUgPSB3aXJlZnJhbWU7XG5cbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcblxuICAgIGNvbnN0IHBvc2l0aW9uc0pTID0gY2FsY3VsYXRlUG9zaXRpb25zSlMoe2dyb3VwZWRWZXJ0aWNlcywgcG9pbnRDb3VudCwgd2lyZWZyYW1lfSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmF0dHJpYnV0ZXMsIHtcbiAgICAgIHBvc2l0aW9uczogY2FsY3VsYXRlUG9zaXRpb25zKHBvc2l0aW9uc0pTLCB0aGlzLmZwNjQpLFxuICAgICAgaW5kaWNlczogY2FsY3VsYXRlSW5kaWNlcyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWV9KSxcbiAgICAgIG5vcm1hbHM6IGNhbGN1bGF0ZU5vcm1hbHMoe2dyb3VwZWRWZXJ0aWNlcywgcG9pbnRDb3VudCwgd2lyZWZyYW1lfSksXG4gICAgICAvLyBjb2xvcnM6IGNhbGN1bGF0ZUNvbG9ycyh7Z3JvdXBlZFZlcnRpY2VzLCB3aXJlZnJhbWUsIGdldENvbG9yfSksXG4gICAgICBwaWNraW5nQ29sb3JzOiBjYWxjdWxhdGVQaWNraW5nQ29sb3JzKHtncm91cGVkVmVydGljZXMsIHBvaW50Q291bnQsIHdpcmVmcmFtZX0pXG4gICAgfSk7XG4gIH1cblxuICBpbmRpY2VzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuaW5kaWNlcztcbiAgfVxuXG4gIHBvc2l0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnBvc2l0aW9ucztcbiAgfVxuXG4gIG5vcm1hbHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5ub3JtYWxzO1xuICB9XG5cbiAgY29sb3JzKHtnZXRDb2xvciA9IHggPT4gREVGQVVMVF9DT0xPUn0gPSB7fSkge1xuICAgIGNvbnN0IHtncm91cGVkVmVydGljZXMsIHBvaW50Q291bnQsIHdpcmVmcmFtZX0gPSB0aGlzO1xuICAgIHJldHVybiBjYWxjdWxhdGVDb2xvcnMoe2dyb3VwZWRWZXJ0aWNlcywgcG9pbnRDb3VudCwgd2lyZWZyYW1lLCBnZXRDb2xvcn0pO1xuICB9XG5cbiAgcGlja2luZ0NvbG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnBpY2tpbmdDb2xvcnM7XG4gIH1cblxuICAvLyB1cGRhdGVUcmlnZ2Vyczoge1xuICAvLyAgIHBvc2l0aW9uczogWydnZXRIZWlnaHQnXSxcbiAgLy8gICBjb2xvcnM6IFsnZ2V0Q29sb3JzJ11cbiAgLy8gICBwaWNraW5nQ29sb3JzOiAnbm9uZSdcbiAgLy8gfVxufVxuXG4vLyBDb3VudCBudW1iZXIgb2YgcG9pbnRzIGluIGEgbGlzdCBvZiBjb21wbGV4IHBvbHlnb25zXG5mdW5jdGlvbiBnZXRQb2ludENvdW50KHBvbHlnb25zKSB7XG4gIHJldHVybiBwb2x5Z29ucy5yZWR1Y2UoKHBvaW50cywgcG9seWdvbikgPT4gcG9pbnRzICsgUG9seWdvbi5nZXRWZXJ0ZXhDb3VudChwb2x5Z29uKSwgMCk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUluZGljZXMoe2dyb3VwZWRWZXJ0aWNlcywgd2lyZWZyYW1lID0gZmFsc2V9KSB7XG4gIC8vIGFkanVzdCBpbmRleCBvZmZzZXQgZm9yIG11bHRpcGxlIHBvbHlnb25zXG4gIGNvbnN0IG11bHRpcGxpZXIgPSB3aXJlZnJhbWUgPyAyIDogNTtcbiAgY29uc3Qgb2Zmc2V0cyA9IFtdO1xuICBncm91cGVkVmVydGljZXMucmVkdWNlKCh2ZXJ0ZXhJbmRleCwgdmVydGljZXMpID0+IHtcbiAgICBvZmZzZXRzLnB1c2godmVydGV4SW5kZXgpO1xuICAgIHJldHVybiB2ZXJ0ZXhJbmRleCArIFBvbHlnb24uZ2V0VmVydGV4Q291bnQodmVydGljZXMpICogbXVsdGlwbGllcjtcbiAgfSwgMCk7XG5cbiAgY29uc3QgaW5kaWNlcyA9IGdyb3VwZWRWZXJ0aWNlcy5tYXAoXG4gICAgKHZlcnRpY2VzLCBwb2x5Z29uSW5kZXgpID0+XG4gICAgICB3aXJlZnJhbWVcbiAgICAgICAgPyAvLyAxLiBnZXQgc2VxdWVudGlhbGx5IG9yZGVyZWQgaW5kaWNlcyBvZiBlYWNoIHBvbHlnb25zIHdpcmVmcmFtZVxuICAgICAgICAgIC8vIDIuIG9mZnNldCB0aGVtIGJ5IHRoZSBudW1iZXIgb2YgaW5kaWNlcyBpbiBwcmV2aW91cyBwb2x5Z29uc1xuICAgICAgICAgIGNhbGN1bGF0ZUNvbnRvdXJJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXRzW3BvbHlnb25JbmRleF0pXG4gICAgICAgIDogLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgICAgICAgICAvLyAyLiBvZmZzZXQgdGhlbSBieSB0aGUgbnVtYmVyIG9mIGluZGljZXMgaW4gcHJldmlvdXMgcG9seWdvbnNcbiAgICAgICAgICBjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyh2ZXJ0aWNlcywgb2Zmc2V0c1twb2x5Z29uSW5kZXhdKVxuICApO1xuXG4gIHJldHVybiBuZXcgVWludDMyQXJyYXkoZmxhdHRlbihpbmRpY2VzLCAyKSk7XG59XG5cbi8vIENhbGN1bGF0ZSBhIGZsYXQgcG9zaXRpb24gYXJyYXkgaW4gSlMgLSBjYW4gYmUgbWFwcGVkIHRvIDMyIG9yIDY0IGJpdCB0eXBlZCBhcnJheXNcbi8vIFJlbWFya3M6XG4vLyAqIGVhY2ggdG9wIHZlcnRleCBpcyBvbiAzIHN1cmZhY2VzXG4vLyAqIGVhY2ggYm90dG9tIHZlcnRleCBpcyBvbiAyIHN1cmZhY2VzXG5mdW5jdGlvbiBjYWxjdWxhdGVQb3NpdGlvbnNKUyh7Z3JvdXBlZFZlcnRpY2VzLCBwb2ludENvdW50LCB3aXJlZnJhbWUgPSBmYWxzZX0pIHtcbiAgY29uc3QgbXVsdGlwbGllciA9IHdpcmVmcmFtZSA/IDIgOiA1O1xuICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KHBvaW50Q291bnQgKiAzICogbXVsdGlwbGllcik7XG4gIGxldCB2ZXJ0ZXhJbmRleCA9IDA7XG5cbiAgZ3JvdXBlZFZlcnRpY2VzLmZvckVhY2godmVydGljZXMgPT4ge1xuICAgIGNvbnN0IHRvcFZlcnRpY2VzID0gZmxhdHRlbih2ZXJ0aWNlcywgMyk7XG5cbiAgICBjb25zdCBiYXNlVmVydGljZXMgPSB0b3BWZXJ0aWNlcy5zbGljZSgwKTtcbiAgICBsZXQgaSA9IHRvcFZlcnRpY2VzLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKGkgPiAwKSB7XG4gICAgICBiYXNlVmVydGljZXNbaV0gPSAwO1xuICAgICAgaSAtPSAzO1xuICAgIH1cbiAgICBjb25zdCBsZW4gPSB0b3BWZXJ0aWNlcy5sZW5ndGg7XG5cbiAgICBpZiAod2lyZWZyYW1lKSB7XG4gICAgICBmaWxsQXJyYXkoe3RhcmdldDogcG9zaXRpb25zLCBzb3VyY2U6IHRvcFZlcnRpY2VzLCBzdGFydDogdmVydGV4SW5kZXh9KTtcbiAgICAgIGZpbGxBcnJheSh7dGFyZ2V0OiBwb3NpdGlvbnMsIHNvdXJjZTogYmFzZVZlcnRpY2VzLCBzdGFydDogdmVydGV4SW5kZXggKyBsZW59KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsbEFycmF5KHt0YXJnZXQ6IHBvc2l0aW9ucywgc291cmNlOiB0b3BWZXJ0aWNlcywgc3RhcnQ6IHZlcnRleEluZGV4LCBjb3VudDogM30pO1xuICAgICAgZmlsbEFycmF5KHtcbiAgICAgICAgdGFyZ2V0OiBwb3NpdGlvbnMsXG4gICAgICAgIHNvdXJjZTogYmFzZVZlcnRpY2VzLFxuICAgICAgICBzdGFydDogdmVydGV4SW5kZXggKyBsZW4gKiAzLFxuICAgICAgICBjb3VudDogMlxuICAgICAgfSk7XG4gICAgfVxuICAgIHZlcnRleEluZGV4ICs9IGxlbiAqIG11bHRpcGxpZXI7XG4gIH0pO1xuXG4gIHJldHVybiBwb3NpdGlvbnM7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVBvc2l0aW9ucyhwb3NpdGlvbnNKUywgZnA2NCkge1xuICBsZXQgcG9zaXRpb25Mb3c7XG4gIGlmIChmcDY0KSB7XG4gICAgLy8gV2Ugb25seSBuZWVkIHgsIHkgY29tcG9uZW50XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSBwb3NpdGlvbnNKUy5sZW5ndGggLyAzO1xuICAgIHBvc2l0aW9uTG93ID0gbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhDb3VudCAqIDIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmVydGV4Q291bnQ7IGkrKykge1xuICAgICAgcG9zaXRpb25Mb3dbaSAqIDIgKyAwXSA9IGZwNjRMb3dQYXJ0KHBvc2l0aW9uc0pTW2kgKiAzICsgMF0pO1xuICAgICAgcG9zaXRpb25Mb3dbaSAqIDIgKyAxXSA9IGZwNjRMb3dQYXJ0KHBvc2l0aW9uc0pTW2kgKiAzICsgMV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge3Bvc2l0aW9uczogcG9zaXRpb25zSlMsIHBvc2l0aW9uczY0eHlMb3c6IHBvc2l0aW9uTG93fTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlTm9ybWFscyh7Z3JvdXBlZFZlcnRpY2VzLCBwb2ludENvdW50LCB3aXJlZnJhbWV9KSB7XG4gIGNvbnN0IHVwID0gWzAsIDAsIDFdO1xuICBjb25zdCBtdWx0aXBsaWVyID0gd2lyZWZyYW1lID8gMiA6IDU7XG5cbiAgY29uc3Qgbm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDMgKiBtdWx0aXBsaWVyKTtcbiAgbGV0IHZlcnRleEluZGV4ID0gMDtcblxuICBpZiAod2lyZWZyYW1lKSB7XG4gICAgcmV0dXJuIGZpbGxBcnJheSh7dGFyZ2V0OiBub3JtYWxzLCBzb3VyY2U6IHVwLCBjb3VudDogcG9pbnRDb3VudCAqIG11bHRpcGxpZXJ9KTtcbiAgfVxuXG4gIGdyb3VwZWRWZXJ0aWNlcy5tYXAoKHZlcnRpY2VzLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQodmVydGljZXMpO1xuXG4gICAgZmlsbEFycmF5KHt0YXJnZXQ6IG5vcm1hbHMsIHNvdXJjZTogdXAsIHN0YXJ0OiB2ZXJ0ZXhJbmRleCwgY291bnQ6IHZlcnRleENvdW50fSk7XG4gICAgdmVydGV4SW5kZXggKz0gdmVydGV4Q291bnQgKiAzO1xuXG4gICAgY29uc3Qgc2lkZU5vcm1hbHNGb3J3YXJkID0gW107XG4gICAgY29uc3Qgc2lkZU5vcm1hbHNCYWNrd2FyZCA9IFtdO1xuXG4gICAgdmVydGljZXMuZm9yRWFjaChwb2x5Z29uID0+IHtcbiAgICAgIGNvbnN0IHNpZGVOb3JtYWxzID0gY2FsY3VsYXRlU2lkZU5vcm1hbHMocG9seWdvbik7XG4gICAgICBjb25zdCBmaXJzdE5vcm1hbCA9IHNpZGVOb3JtYWxzLnNsaWNlKDAsIDMpO1xuXG4gICAgICBhcnJheVB1c2goc2lkZU5vcm1hbHNGb3J3YXJkLCBzaWRlTm9ybWFscyk7XG4gICAgICBhcnJheVB1c2goc2lkZU5vcm1hbHNGb3J3YXJkLCBmaXJzdE5vcm1hbCk7XG5cbiAgICAgIGFycmF5UHVzaChzaWRlTm9ybWFsc0JhY2t3YXJkLCBmaXJzdE5vcm1hbCk7XG4gICAgICBhcnJheVB1c2goc2lkZU5vcm1hbHNCYWNrd2FyZCwgc2lkZU5vcm1hbHMpO1xuICAgIH0pO1xuXG4gICAgZmlsbEFycmF5KHtcbiAgICAgIHRhcmdldDogbm9ybWFscyxcbiAgICAgIHN0YXJ0OiB2ZXJ0ZXhJbmRleCxcbiAgICAgIGNvdW50OiAyLFxuICAgICAgc291cmNlOiBzaWRlTm9ybWFsc0ZvcndhcmQuY29uY2F0KHNpZGVOb3JtYWxzQmFja3dhcmQpXG4gICAgfSk7XG4gICAgdmVydGV4SW5kZXggKz0gdmVydGV4Q291bnQgKiAzICogNDtcbiAgfSk7XG5cbiAgcmV0dXJuIG5vcm1hbHM7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVNpZGVOb3JtYWxzKHZlcnRpY2VzKSB7XG4gIGNvbnN0IG5vcm1hbHMgPSBbXTtcblxuICBsZXQgbGFzdFZlcnRpY2UgPSBudWxsO1xuICBmb3IgKGNvbnN0IHZlcnRpY2Ugb2YgdmVydGljZXMpIHtcbiAgICBpZiAobGFzdFZlcnRpY2UpIHtcbiAgICAgIC8vIHZlcnRleFtpLTFdLCB2ZXJ0ZXhbaV1cbiAgICAgIGNvbnN0IG4gPSBnZXROb3JtYWwobGFzdFZlcnRpY2UsIHZlcnRpY2UpO1xuICAgICAgYXJyYXlQdXNoKG5vcm1hbHMsIG4pO1xuICAgIH1cbiAgICBsYXN0VmVydGljZSA9IHZlcnRpY2U7XG4gIH1cblxuICByZXR1cm4gbm9ybWFscztcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQ29sb3JzKHtncm91cGVkVmVydGljZXMsIHBvaW50Q291bnQsIGdldENvbG9yLCB3aXJlZnJhbWUgPSBmYWxzZX0pIHtcbiAgY29uc3QgbXVsdGlwbGllciA9IHdpcmVmcmFtZSA/IDIgOiA1O1xuICBjb25zdCBjb2xvcnMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkocG9pbnRDb3VudCAqIDQgKiBtdWx0aXBsaWVyKTtcbiAgbGV0IHZlcnRleEluZGV4ID0gMDtcblxuICBncm91cGVkVmVydGljZXMuZm9yRWFjaCgoY29tcGxleFBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGNvbnN0IGNvbG9yID0gZ2V0Q29sb3IocG9seWdvbkluZGV4KTtcbiAgICBjb2xvclszXSA9IE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IDI1NTtcblxuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gUG9seWdvbi5nZXRWZXJ0ZXhDb3VudChjb21wbGV4UG9seWdvbik7XG5cbiAgICBmaWxsQXJyYXkoe3RhcmdldDogY29sb3JzLCBzb3VyY2U6IGNvbG9yLCBzdGFydDogdmVydGV4SW5kZXgsIGNvdW50OiBudW1WZXJ0aWNlcyAqIG11bHRpcGxpZXJ9KTtcbiAgICB2ZXJ0ZXhJbmRleCArPSBjb2xvci5sZW5ndGggKiBudW1WZXJ0aWNlcyAqIG11bHRpcGxpZXI7XG4gIH0pO1xuXG4gIHJldHVybiBjb2xvcnM7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVBpY2tpbmdDb2xvcnMoe2dyb3VwZWRWZXJ0aWNlcywgcG9pbnRDb3VudCwgd2lyZWZyYW1lID0gZmFsc2V9KSB7XG4gIGNvbnN0IG11bHRpcGxpZXIgPSB3aXJlZnJhbWUgPyAyIDogNTtcbiAgY29uc3QgY29sb3JzID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHBvaW50Q291bnQgKiAzICogbXVsdGlwbGllcik7XG4gIGxldCB2ZXJ0ZXhJbmRleCA9IDA7XG5cbiAgZ3JvdXBlZFZlcnRpY2VzLmZvckVhY2goKHZlcnRpY2VzLCBwb2x5Z29uSW5kZXgpID0+IHtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQodmVydGljZXMpO1xuICAgIGNvbnN0IGNvbG9yID0gZ2V0UGlja2luZ0NvbG9yKHBvbHlnb25JbmRleCk7XG5cbiAgICBmaWxsQXJyYXkoe3RhcmdldDogY29sb3JzLCBzb3VyY2U6IGNvbG9yLCBzdGFydDogdmVydGV4SW5kZXgsIGNvdW50OiBudW1WZXJ0aWNlcyAqIG11bHRpcGxpZXJ9KTtcbiAgICB2ZXJ0ZXhJbmRleCArPSBjb2xvci5sZW5ndGggKiBudW1WZXJ0aWNlcyAqIG11bHRpcGxpZXI7XG4gIH0pO1xuICByZXR1cm4gY29sb3JzO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVDb250b3VySW5kaWNlcyh2ZXJ0aWNlcywgb2Zmc2V0KSB7XG4gIGNvbnN0IHN0cmlkZSA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQodmVydGljZXMpO1xuICBjb25zdCBpbmRpY2VzID0gW107XG5cbiAgdmVydGljZXMuZm9yRWFjaChwb2x5Z29uID0+IHtcbiAgICBpbmRpY2VzLnB1c2gob2Zmc2V0KTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHBvbHlnb24ubGVuZ3RoO1xuXG4gICAgLy8gcG9seWdvbiB0b3BcbiAgICAvLyB1c2UgdmVydGV4IHBhaXJzIGZvciBHTC5MSU5FUyA9PiBbMCwgMSwgMSwgMiwgMiwgLi4uLCBuLTEsIG4tMSwgMF1cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG51bVZlcnRpY2VzIC0gMTsgaSsrKSB7XG4gICAgICBpbmRpY2VzLnB1c2goaSArIG9mZnNldCwgaSArIG9mZnNldCk7XG4gICAgfVxuICAgIGluZGljZXMucHVzaChvZmZzZXQpO1xuXG4gICAgLy8gcG9seWdvbiBzaWRlc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaChpICsgb2Zmc2V0LCBpICsgc3RyaWRlICsgb2Zmc2V0KTtcbiAgICB9XG5cbiAgICBvZmZzZXQgKz0gbnVtVmVydGljZXM7XG4gIH0pO1xuXG4gIHJldHVybiBpbmRpY2VzO1xufVxuXG5mdW5jdGlvbiBkcmF3U3VyZmFjZVJlY3RhbmdsZSh0YXJnZXRBcnJheSwgb2Zmc2V0LCBzdHJpZGUpIHtcbiAgdGFyZ2V0QXJyYXkucHVzaChcbiAgICBvZmZzZXQgKyBzdHJpZGUsXG4gICAgb2Zmc2V0ICsgc3RyaWRlICogMyxcbiAgICBvZmZzZXQgKyBzdHJpZGUgKiAyICsgMSxcbiAgICBvZmZzZXQgKyBzdHJpZGUgKiAyICsgMSxcbiAgICBvZmZzZXQgKyBzdHJpZGUgKiAzLFxuICAgIG9mZnNldCArIHN0cmlkZSAqIDQgKyAxXG4gICk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVN1cmZhY2VJbmRpY2VzKHZlcnRpY2VzLCBvZmZzZXQpIHtcbiAgY29uc3Qgc3RyaWRlID0gUG9seWdvbi5nZXRWZXJ0ZXhDb3VudCh2ZXJ0aWNlcyk7XG5cbiAgbGV0IGhvbGVzID0gbnVsbDtcbiAgY29uc3QgaG9sZUNvdW50ID0gdmVydGljZXMubGVuZ3RoIC0gMTtcblxuICBpZiAoaG9sZUNvdW50KSB7XG4gICAgaG9sZXMgPSBbXTtcbiAgICBsZXQgdmVydGV4SW5kZXggPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG9sZUNvdW50OyBpKyspIHtcbiAgICAgIHZlcnRleEluZGV4ICs9IHZlcnRpY2VzW2ldLmxlbmd0aDtcbiAgICAgIGhvbGVzW2ldID0gdmVydGV4SW5kZXg7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaW5kaWNlcyA9IGVhcmN1dChmbGF0dGVuKHZlcnRpY2VzLCAzKSwgaG9sZXMsIDMpLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldCk7XG5cbiAgdmVydGljZXMuZm9yRWFjaChwb2x5Z29uID0+IHtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IHBvbHlnb24ubGVuZ3RoO1xuXG4gICAgLy8gcG9seWdvbiBzaWRlc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVmVydGljZXMgLSAxOyBpKyspIHtcbiAgICAgIGRyYXdTdXJmYWNlUmVjdGFuZ2xlKGluZGljZXMsIG9mZnNldCArIGksIHN0cmlkZSk7XG4gICAgfVxuXG4gICAgb2Zmc2V0ICs9IG51bVZlcnRpY2VzO1xuICB9KTtcblxuICByZXR1cm4gaW5kaWNlcztcbn1cblxuLy8gaGVscGVyc1xuXG4vLyBnZXQgbm9ybWFsIHZlY3RvciBvZiBsaW5lIHNlZ21lbnRcbmZ1bmN0aW9uIGdldE5vcm1hbChwMSwgcDIpIHtcbiAgcmV0dXJuIFtwMVsxXSAtIHAyWzFdLCBwMlswXSAtIHAxWzBdLCAwXTtcbn1cbiJdfQ==