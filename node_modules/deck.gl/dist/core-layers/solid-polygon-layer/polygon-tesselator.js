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

var _earcut = require('earcut');

var _earcut2 = _interopRequireDefault(_earcut);

var _core = require('../../core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fp64LowPart = _core.experimental.fp64LowPart,
    flattenVertices = _core.experimental.flattenVertices,
    fillArray = _core.experimental.fillArray;

// Maybe deck.gl or luma.gl needs to export this

function getPickingColor(index) {
  return [(index + 1) % 256, Math.floor((index + 1) / 256) % 256, Math.floor((index + 1) / 256 / 256) % 256];
}

var DEFAULT_COLOR = [0, 0, 0, 255]; // Black

// This class is set up to allow querying one attribute at a time
// the way the AttributeManager expects it

var PolygonTesselator = exports.PolygonTesselator = function () {
  function PolygonTesselator(_ref) {
    var polygons = _ref.polygons,
        _ref$fp = _ref.fp64,
        fp64 = _ref$fp === undefined ? false : _ref$fp;

    _classCallCheck(this, PolygonTesselator);

    // Normalize all polygons
    this.polygons = polygons.map(function (polygon) {
      return Polygon.normalize(polygon);
    });
    // Count all polygon vertices
    this.pointCount = getPointCount(this.polygons);
    this.fp64 = fp64;
  }

  _createClass(PolygonTesselator, [{
    key: 'indices',
    value: function indices() {
      var polygons = this.polygons,
          indexCount = this.indexCount;

      return calculateIndices({ polygons: polygons, indexCount: indexCount });
    }
  }, {
    key: 'positions',
    value: function positions() {
      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculatePositions({ polygons: polygons, pointCount: pointCount, fp64: this.fp64 });
    }
  }, {
    key: 'normals',
    value: function normals() {
      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculateNormals({ polygons: polygons, pointCount: pointCount });
    }
  }, {
    key: 'colors',
    value: function colors() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$getColor = _ref2.getColor,
          getColor = _ref2$getColor === undefined ? function (x) {
        return DEFAULT_COLOR;
      } : _ref2$getColor;

      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculateColors({ polygons: polygons, pointCount: pointCount, getColor: getColor });
    }
  }, {
    key: 'pickingColors',
    value: function pickingColors() {
      var polygons = this.polygons,
          pointCount = this.pointCount;

      return calculatePickingColors({ polygons: polygons, pointCount: pointCount });
    }

    // getAttribute({size, accessor}) {
    //   const {polygons, pointCount} = this;
    //   return calculateAttribute({polygons, pointCount, size, accessor});
    // }

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

// Returns the offset of each hole polygon in the flattened array for that polygon
function getHoleIndices(complexPolygon) {
  var holeIndices = null;
  if (complexPolygon.length > 1) {
    var polygonStartIndex = 0;
    holeIndices = [];
    complexPolygon.forEach(function (polygon) {
      polygonStartIndex += polygon.length;
      holeIndices.push(polygonStartIndex);
    });
    // Last element points to end of the flat array, remove it
    holeIndices.pop();
  }
  return holeIndices;
}

function calculateIndices(_ref3) {
  var polygons = _ref3.polygons,
      _ref3$IndexType = _ref3.IndexType,
      IndexType = _ref3$IndexType === undefined ? Uint32Array : _ref3$IndexType;

  // Calculate length of index array (3 * number of triangles)
  var indexCount = 3 * getTriangleCount(polygons);
  var offsets = getPolygonOffsets(polygons);

  // Allocate the attribute
  // TODO it's not the index count but the vertex count that must be checked
  if (IndexType === Uint16Array && indexCount > 65535) {
    throw new Error("Vertex count exceeds browser's limit");
  }
  var attribute = new IndexType(indexCount);

  // 1. get triangulated indices for the internal areas
  // 2. offset them by the number of indices in previous polygons
  var i = 0;
  polygons.forEach(function (polygon, polygonIndex) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = calculateSurfaceIndices(polygon)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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

/*
 * Get vertex indices for drawing complexPolygon mesh
 * @private
 * @param {[Number,Number,Number][][]} complexPolygon
 * @returns {[Number]} indices
 */
function calculateSurfaceIndices(complexPolygon) {
  // Prepare an array of hole indices as expected by earcut
  var holeIndices = getHoleIndices(complexPolygon);
  // Flatten the polygon as expected by earcut
  var verts = flattenVertices(complexPolygon);
  // Let earcut triangulate the polygon
  return (0, _earcut2.default)(verts, holeIndices, 3);
}

function calculatePositions(_ref4) {
  var polygons = _ref4.polygons,
      pointCount = _ref4.pointCount,
      fp64 = _ref4.fp64;

  // Flatten out all the vertices of all the sub subPolygons
  var attribute = new Float32Array(pointCount * 3);
  var attributeLow = void 0;
  if (fp64) {
    // We only need x, y component
    attributeLow = new Float32Array(pointCount * 2);
  }
  var i = 0;
  var j = 0;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = polygons[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var polygon = _step2.value;

      // eslint-disable-next-line
      Polygon.forEachVertex(polygon, function (vertex) {
        var x = vertex[0];
        var y = vertex[1];
        var z = vertex[2] || 0;
        attribute[i++] = x;
        attribute[i++] = y;
        attribute[i++] = z;
        if (fp64) {
          attributeLow[j++] = fp64LowPart(x);
          attributeLow[j++] = fp64LowPart(y);
        }
      });
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

  return { positions: attribute, positions64xyLow: attributeLow };
}

function calculateNormals(_ref5) {
  var polygons = _ref5.polygons,
      pointCount = _ref5.pointCount;

  // TODO - use generic vertex attribute?
  var attribute = new Float32Array(pointCount * 3);
  // normals is not used in flat polygon shader
  // fillArray({target: attribute, source: [0, 0, 1], start: 0, count: pointCount});
  return attribute;
}

function calculateColors(_ref6) {
  var polygons = _ref6.polygons,
      pointCount = _ref6.pointCount,
      getColor = _ref6.getColor;

  var attribute = new Uint8ClampedArray(pointCount * 4);
  var i = 0;
  polygons.forEach(function (complexPolygon, polygonIndex) {
    // Calculate polygon color
    var color = getColor(polygonIndex);
    color[3] = Number.isFinite(color[3]) ? color[3] : 255;

    var vertexCount = Polygon.getVertexCount(complexPolygon);
    fillArray({ target: attribute, source: color, start: i, count: vertexCount });
    i += color.length * vertexCount;
  });
  return attribute;
}

function calculatePickingColors(_ref7) {
  var polygons = _ref7.polygons,
      pointCount = _ref7.pointCount;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlLWxheWVycy9zb2xpZC1wb2x5Z29uLWxheWVyL3BvbHlnb24tdGVzc2VsYXRvci5qcyJdLCJuYW1lcyI6WyJQb2x5Z29uIiwiZnA2NExvd1BhcnQiLCJmbGF0dGVuVmVydGljZXMiLCJmaWxsQXJyYXkiLCJnZXRQaWNraW5nQ29sb3IiLCJpbmRleCIsIk1hdGgiLCJmbG9vciIsIkRFRkFVTFRfQ09MT1IiLCJQb2x5Z29uVGVzc2VsYXRvciIsInBvbHlnb25zIiwiZnA2NCIsIm1hcCIsIm5vcm1hbGl6ZSIsInBvbHlnb24iLCJwb2ludENvdW50IiwiZ2V0UG9pbnRDb3VudCIsImluZGV4Q291bnQiLCJjYWxjdWxhdGVJbmRpY2VzIiwiY2FsY3VsYXRlUG9zaXRpb25zIiwiY2FsY3VsYXRlTm9ybWFscyIsImdldENvbG9yIiwiY2FsY3VsYXRlQ29sb3JzIiwiY2FsY3VsYXRlUGlja2luZ0NvbG9ycyIsInJlZHVjZSIsInBvaW50cyIsImdldFZlcnRleENvdW50IiwiZ2V0VHJpYW5nbGVDb3VudCIsInRyaWFuZ2xlcyIsImdldFBvbHlnb25PZmZzZXRzIiwib2Zmc2V0cyIsIkFycmF5IiwibGVuZ3RoIiwib2Zmc2V0IiwiZm9yRWFjaCIsImkiLCJnZXRIb2xlSW5kaWNlcyIsImNvbXBsZXhQb2x5Z29uIiwiaG9sZUluZGljZXMiLCJwb2x5Z29uU3RhcnRJbmRleCIsInB1c2giLCJwb3AiLCJJbmRleFR5cGUiLCJVaW50MzJBcnJheSIsIlVpbnQxNkFycmF5IiwiRXJyb3IiLCJhdHRyaWJ1dGUiLCJwb2x5Z29uSW5kZXgiLCJjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyIsInZlcnRzIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlTG93IiwiaiIsImZvckVhY2hWZXJ0ZXgiLCJ4IiwidmVydGV4IiwieSIsInoiLCJwb3NpdGlvbnMiLCJwb3NpdGlvbnM2NHh5TG93IiwiVWludDhDbGFtcGVkQXJyYXkiLCJjb2xvciIsIk51bWJlciIs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LGlCQUFKLENBQXNCN0MsYUFBYSxDQUFuQyxDQUFsQjtBQUNBLE1BQUlvQixJQUFJLENBQVI7QUFDQXpCLFdBQVN3QixPQUFULENBQWlCLFVBQUNHLGNBQUQsRUFBaUJVLFlBQWpCLEVBQWtDO0FBQ2pELFFBQU1jLFFBQVF6RCxnQkFBZ0IyQyxZQUFoQixDQUFkO0FBQ0EsUUFBTWlCLGNBQWNoRSxRQUFRMEIsY0FBUixDQUF1QlcsY0FBdkIsQ0FBcEI7QUFDQWxDLGNBQVUsRUFBQzhELFFBQVFuQixTQUFULEVBQW9Cb0IsUUFBUUwsS0FBNUIsRUFBbUNNLE9BQU9oQyxDQUExQyxFQUE2Q2lDLE9BQU9KLFdBQXBELEVBQVY7QUFDQTdCLFNBQUswQixNQUFNN0IsTUFBTixHQUFlZ0MsV0FBcEI7QUFDRCxHQUxEO0FBTUEsU0FBT2xCLFNBQVA7QUFDRCIsImZpbGUiOiJwb2x5Z29uLXRlc3NlbGF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLy8gSGFuZGxlcyB0ZXNzZWxhdGlvbiBvZiBwb2x5Z29ucyB3aXRoIGhvbGVzXG4vLyAtIDJEIHN1cmZhY2VzXG4vLyAtIDJEIG91dGxpbmVzXG4vLyAtIDNEIHN1cmZhY2VzICh0b3AgYW5kIHNpZGVzIG9ubHkpXG4vLyAtIDNEIHdpcmVmcmFtZXMgKG5vdCB5ZXQpXG5pbXBvcnQgKiBhcyBQb2x5Z29uIGZyb20gJy4vcG9seWdvbic7XG5pbXBvcnQgZWFyY3V0IGZyb20gJ2VhcmN1dCc7XG5pbXBvcnQge2V4cGVyaW1lbnRhbH0gZnJvbSAnLi4vLi4vY29yZSc7XG5jb25zdCB7ZnA2NExvd1BhcnQsIGZsYXR0ZW5WZXJ0aWNlcywgZmlsbEFycmF5fSA9IGV4cGVyaW1lbnRhbDtcblxuLy8gTWF5YmUgZGVjay5nbCBvciBsdW1hLmdsIG5lZWRzIHRvIGV4cG9ydCB0aGlzXG5mdW5jdGlvbiBnZXRQaWNraW5nQ29sb3IoaW5kZXgpIHtcbiAgcmV0dXJuIFtcbiAgICAoaW5kZXggKyAxKSAlIDI1NixcbiAgICBNYXRoLmZsb29yKChpbmRleCArIDEpIC8gMjU2KSAlIDI1NixcbiAgICBNYXRoLmZsb29yKChpbmRleCArIDEpIC8gMjU2IC8gMjU2KSAlIDI1NlxuICBdO1xufVxuXG5jb25zdCBERUZBVUxUX0NPTE9SID0gWzAsIDAsIDAsIDI1NV07IC8vIEJsYWNrXG5cbi8vIFRoaXMgY2xhc3MgaXMgc2V0IHVwIHRvIGFsbG93IHF1ZXJ5aW5nIG9uZSBhdHRyaWJ1dGUgYXQgYSB0aW1lXG4vLyB0aGUgd2F5IHRoZSBBdHRyaWJ1dGVNYW5hZ2VyIGV4cGVjdHMgaXRcbmV4cG9ydCBjbGFzcyBQb2x5Z29uVGVzc2VsYXRvciB7XG4gIGNvbnN0cnVjdG9yKHtwb2x5Z29ucywgZnA2NCA9IGZhbHNlfSkge1xuICAgIC8vIE5vcm1hbGl6ZSBhbGwgcG9seWdvbnNcbiAgICB0aGlzLnBvbHlnb25zID0gcG9seWdvbnMubWFwKHBvbHlnb24gPT4gUG9seWdvbi5ub3JtYWxpemUocG9seWdvbikpO1xuICAgIC8vIENvdW50IGFsbCBwb2x5Z29uIHZlcnRpY2VzXG4gICAgdGhpcy5wb2ludENvdW50ID0gZ2V0UG9pbnRDb3VudCh0aGlzLnBvbHlnb25zKTtcbiAgICB0aGlzLmZwNjQgPSBmcDY0O1xuICB9XG5cbiAgaW5kaWNlcygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIGluZGV4Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlSW5kaWNlcyh7cG9seWdvbnMsIGluZGV4Q291bnR9KTtcbiAgfVxuXG4gIHBvc2l0aW9ucygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlUG9zaXRpb25zKHtwb2x5Z29ucywgcG9pbnRDb3VudCwgZnA2NDogdGhpcy5mcDY0fSk7XG4gIH1cblxuICBub3JtYWxzKCkge1xuICAgIGNvbnN0IHtwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuICAgIHJldHVybiBjYWxjdWxhdGVOb3JtYWxzKHtwb2x5Z29ucywgcG9pbnRDb3VudH0pO1xuICB9XG5cbiAgY29sb3JzKHtnZXRDb2xvciA9IHggPT4gREVGQVVMVF9DT0xPUn0gPSB7fSkge1xuICAgIGNvbnN0IHtwb2x5Z29ucywgcG9pbnRDb3VudH0gPSB0aGlzO1xuICAgIHJldHVybiBjYWxjdWxhdGVDb2xvcnMoe3BvbHlnb25zLCBwb2ludENvdW50LCBnZXRDb2xvcn0pO1xuICB9XG5cbiAgcGlja2luZ0NvbG9ycygpIHtcbiAgICBjb25zdCB7cG9seWdvbnMsIHBvaW50Q291bnR9ID0gdGhpcztcbiAgICByZXR1cm4gY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnR9KTtcbiAgfVxuXG4gIC8vIGdldEF0dHJpYnV0ZSh7c2l6ZSwgYWNjZXNzb3J9KSB7XG4gIC8vICAgY29uc3Qge3BvbHlnb25zLCBwb2ludENvdW50fSA9IHRoaXM7XG4gIC8vICAgcmV0dXJuIGNhbGN1bGF0ZUF0dHJpYnV0ZSh7cG9seWdvbnMsIHBvaW50Q291bnQsIHNpemUsIGFjY2Vzc29yfSk7XG4gIC8vIH1cbn1cblxuLy8gQ291bnQgbnVtYmVyIG9mIHBvaW50cyBpbiBhIGxpc3Qgb2YgY29tcGxleCBwb2x5Z29uc1xuZnVuY3Rpb24gZ2V0UG9pbnRDb3VudChwb2x5Z29ucykge1xuICByZXR1cm4gcG9seWdvbnMucmVkdWNlKChwb2ludHMsIHBvbHlnb24pID0+IHBvaW50cyArIFBvbHlnb24uZ2V0VmVydGV4Q291bnQocG9seWdvbiksIDApO1xufVxuXG4vLyBDT3VudCBudW1iZXIgb2YgdHJpYW5nbGVzIGluIGEgbGlzdCBvZiBjb21wbGV4IHBvbHlnb25zXG5mdW5jdGlvbiBnZXRUcmlhbmdsZUNvdW50KHBvbHlnb25zKSB7XG4gIHJldHVybiBwb2x5Z29ucy5yZWR1Y2UoKHRyaWFuZ2xlcywgcG9seWdvbikgPT4gdHJpYW5nbGVzICsgUG9seWdvbi5nZXRUcmlhbmdsZUNvdW50KHBvbHlnb24pLCAwKTtcbn1cblxuLy8gUmV0dXJucyB0aGUgb2Zmc2V0cyBvZiBlYWNoIGNvbXBsZXggcG9seWdvbiBpbiB0aGUgY29tYmluZWQgYXJyYXkgb2YgYWxsIHBvbHlnb25zXG5mdW5jdGlvbiBnZXRQb2x5Z29uT2Zmc2V0cyhwb2x5Z29ucykge1xuICBjb25zdCBvZmZzZXRzID0gbmV3IEFycmF5KHBvbHlnb25zLmxlbmd0aCArIDEpO1xuICBvZmZzZXRzWzBdID0gMDtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIHBvbHlnb25zLmZvckVhY2goKHBvbHlnb24sIGkpID0+IHtcbiAgICBvZmZzZXQgKz0gUG9seWdvbi5nZXRWZXJ0ZXhDb3VudChwb2x5Z29uKTtcbiAgICBvZmZzZXRzW2kgKyAxXSA9IG9mZnNldDtcbiAgfSk7XG4gIHJldHVybiBvZmZzZXRzO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBvZmZzZXQgb2YgZWFjaCBob2xlIHBvbHlnb24gaW4gdGhlIGZsYXR0ZW5lZCBhcnJheSBmb3IgdGhhdCBwb2x5Z29uXG5mdW5jdGlvbiBnZXRIb2xlSW5kaWNlcyhjb21wbGV4UG9seWdvbikge1xuICBsZXQgaG9sZUluZGljZXMgPSBudWxsO1xuICBpZiAoY29tcGxleFBvbHlnb24ubGVuZ3RoID4gMSkge1xuICAgIGxldCBwb2x5Z29uU3RhcnRJbmRleCA9IDA7XG4gICAgaG9sZUluZGljZXMgPSBbXTtcbiAgICBjb21wbGV4UG9seWdvbi5mb3JFYWNoKHBvbHlnb24gPT4ge1xuICAgICAgcG9seWdvblN0YXJ0SW5kZXggKz0gcG9seWdvbi5sZW5ndGg7XG4gICAgICBob2xlSW5kaWNlcy5wdXNoKHBvbHlnb25TdGFydEluZGV4KTtcbiAgICB9KTtcbiAgICAvLyBMYXN0IGVsZW1lbnQgcG9pbnRzIHRvIGVuZCBvZiB0aGUgZmxhdCBhcnJheSwgcmVtb3ZlIGl0XG4gICAgaG9sZUluZGljZXMucG9wKCk7XG4gIH1cbiAgcmV0dXJuIGhvbGVJbmRpY2VzO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVJbmRpY2VzKHtwb2x5Z29ucywgSW5kZXhUeXBlID0gVWludDMyQXJyYXl9KSB7XG4gIC8vIENhbGN1bGF0ZSBsZW5ndGggb2YgaW5kZXggYXJyYXkgKDMgKiBudW1iZXIgb2YgdHJpYW5nbGVzKVxuICBjb25zdCBpbmRleENvdW50ID0gMyAqIGdldFRyaWFuZ2xlQ291bnQocG9seWdvbnMpO1xuICBjb25zdCBvZmZzZXRzID0gZ2V0UG9seWdvbk9mZnNldHMocG9seWdvbnMpO1xuXG4gIC8vIEFsbG9jYXRlIHRoZSBhdHRyaWJ1dGVcbiAgLy8gVE9ETyBpdCdzIG5vdCB0aGUgaW5kZXggY291bnQgYnV0IHRoZSB2ZXJ0ZXggY291bnQgdGhhdCBtdXN0IGJlIGNoZWNrZWRcbiAgaWYgKEluZGV4VHlwZSA9PT0gVWludDE2QXJyYXkgJiYgaW5kZXhDb3VudCA+IDY1NTM1KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVmVydGV4IGNvdW50IGV4Y2VlZHMgYnJvd3NlcidzIGxpbWl0XCIpO1xuICB9XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBJbmRleFR5cGUoaW5kZXhDb3VudCk7XG5cbiAgLy8gMS4gZ2V0IHRyaWFuZ3VsYXRlZCBpbmRpY2VzIGZvciB0aGUgaW50ZXJuYWwgYXJlYXNcbiAgLy8gMi4gb2Zmc2V0IHRoZW0gYnkgdGhlIG51bWJlciBvZiBpbmRpY2VzIGluIHByZXZpb3VzIHBvbHlnb25zXG4gIGxldCBpID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgocG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgZm9yIChjb25zdCBpbmRleCBvZiBjYWxjdWxhdGVTdXJmYWNlSW5kaWNlcyhwb2x5Z29uKSkge1xuICAgICAgYXR0cmlidXRlW2krK10gPSBpbmRleCArIG9mZnNldHNbcG9seWdvbkluZGV4XTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG5cbi8qXG4gKiBHZXQgdmVydGV4IGluZGljZXMgZm9yIGRyYXdpbmcgY29tcGxleFBvbHlnb24gbWVzaFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7W051bWJlcixOdW1iZXIsTnVtYmVyXVtdW119IGNvbXBsZXhQb2x5Z29uXG4gKiBAcmV0dXJucyB7W051bWJlcl19IGluZGljZXNcbiAqL1xuZnVuY3Rpb24gY2FsY3VsYXRlU3VyZmFjZUluZGljZXMoY29tcGxleFBvbHlnb24pIHtcbiAgLy8gUHJlcGFyZSBhbiBhcnJheSBvZiBob2xlIGluZGljZXMgYXMgZXhwZWN0ZWQgYnkgZWFyY3V0XG4gIGNvbnN0IGhvbGVJbmRpY2VzID0gZ2V0SG9sZUluZGljZXMoY29tcGxleFBvbHlnb24pO1xuICAvLyBGbGF0dGVuIHRoZSBwb2x5Z29uIGFzIGV4cGVjdGVkIGJ5IGVhcmN1dFxuICBjb25zdCB2ZXJ0cyA9IGZsYXR0ZW5WZXJ0aWNlcyhjb21wbGV4UG9seWdvbik7XG4gIC8vIExldCBlYXJjdXQgdHJpYW5ndWxhdGUgdGhlIHBvbHlnb25cbiAgcmV0dXJuIGVhcmN1dCh2ZXJ0cywgaG9sZUluZGljZXMsIDMpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVQb3NpdGlvbnMoe3BvbHlnb25zLCBwb2ludENvdW50LCBmcDY0fSkge1xuICAvLyBGbGF0dGVuIG91dCBhbGwgdGhlIHZlcnRpY2VzIG9mIGFsbCB0aGUgc3ViIHN1YlBvbHlnb25zXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDMpO1xuICBsZXQgYXR0cmlidXRlTG93O1xuICBpZiAoZnA2NCkge1xuICAgIC8vIFdlIG9ubHkgbmVlZCB4LCB5IGNvbXBvbmVudFxuICAgIGF0dHJpYnV0ZUxvdyA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDIpO1xuICB9XG4gIGxldCBpID0gMDtcbiAgbGV0IGogPSAwO1xuICBmb3IgKGNvbnN0IHBvbHlnb24gb2YgcG9seWdvbnMpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICBQb2x5Z29uLmZvckVhY2hWZXJ0ZXgocG9seWdvbiwgdmVydGV4ID0+IHtcbiAgICAgIGNvbnN0IHggPSB2ZXJ0ZXhbMF07XG4gICAgICBjb25zdCB5ID0gdmVydGV4WzFdO1xuICAgICAgY29uc3QgeiA9IHZlcnRleFsyXSB8fCAwO1xuICAgICAgYXR0cmlidXRlW2krK10gPSB4O1xuICAgICAgYXR0cmlidXRlW2krK10gPSB5O1xuICAgICAgYXR0cmlidXRlW2krK10gPSB6O1xuICAgICAgaWYgKGZwNjQpIHtcbiAgICAgICAgYXR0cmlidXRlTG93W2orK10gPSBmcDY0TG93UGFydCh4KTtcbiAgICAgICAgYXR0cmlidXRlTG93W2orK10gPSBmcDY0TG93UGFydCh5KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4ge3Bvc2l0aW9uczogYXR0cmlidXRlLCBwb3NpdGlvbnM2NHh5TG93OiBhdHRyaWJ1dGVMb3d9O1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVOb3JtYWxzKHtwb2x5Z29ucywgcG9pbnRDb3VudH0pIHtcbiAgLy8gVE9ETyAtIHVzZSBnZW5lcmljIHZlcnRleCBhdHRyaWJ1dGU/XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBGbG9hdDMyQXJyYXkocG9pbnRDb3VudCAqIDMpO1xuICAvLyBub3JtYWxzIGlzIG5vdCB1c2VkIGluIGZsYXQgcG9seWdvbiBzaGFkZXJcbiAgLy8gZmlsbEFycmF5KHt0YXJnZXQ6IGF0dHJpYnV0ZSwgc291cmNlOiBbMCwgMCwgMV0sIHN0YXJ0OiAwLCBjb3VudDogcG9pbnRDb3VudH0pO1xuICByZXR1cm4gYXR0cmlidXRlO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVDb2xvcnMoe3BvbHlnb25zLCBwb2ludENvdW50LCBnZXRDb2xvcn0pIHtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHBvaW50Q291bnQgKiA0KTtcbiAgbGV0IGkgPSAwO1xuICBwb2x5Z29ucy5mb3JFYWNoKChjb21wbGV4UG9seWdvbiwgcG9seWdvbkluZGV4KSA9PiB7XG4gICAgLy8gQ2FsY3VsYXRlIHBvbHlnb24gY29sb3JcbiAgICBjb25zdCBjb2xvciA9IGdldENvbG9yKHBvbHlnb25JbmRleCk7XG4gICAgY29sb3JbM10gPSBOdW1iZXIuaXNGaW5pdGUoY29sb3JbM10pID8gY29sb3JbM10gOiAyNTU7XG5cbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IFBvbHlnb24uZ2V0VmVydGV4Q291bnQoY29tcGxleFBvbHlnb24pO1xuICAgIGZpbGxBcnJheSh7dGFyZ2V0OiBhdHRyaWJ1dGUsIHNvdXJjZTogY29sb3IsIHN0YXJ0OiBpLCBjb3VudDogdmVydGV4Q291bnR9KTtcbiAgICBpICs9IGNvbG9yLmxlbmd0aCAqIHZlcnRleENvdW50O1xuICB9KTtcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlUGlja2luZ0NvbG9ycyh7cG9seWdvbnMsIHBvaW50Q291bnR9KSB7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShwb2ludENvdW50ICogMyk7XG4gIGxldCBpID0gMDtcbiAgcG9seWdvbnMuZm9yRWFjaCgoY29tcGxleFBvbHlnb24sIHBvbHlnb25JbmRleCkgPT4ge1xuICAgIGNvbnN0IGNvbG9yID0gZ2V0UGlja2luZ0NvbG9yKHBvbHlnb25JbmRleCk7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSBQb2x5Z29uLmdldFZlcnRleENvdW50KGNvbXBsZXhQb2x5Z29uKTtcbiAgICBmaWxsQXJyYXkoe3RhcmdldDogYXR0cmlidXRlLCBzb3VyY2U6IGNvbG9yLCBzdGFydDogaSwgY291bnQ6IHZlcnRleENvdW50fSk7XG4gICAgaSArPSBjb2xvci5sZW5ndGggKiB2ZXJ0ZXhDb3VudDtcbiAgfSk7XG4gIHJldHVybiBhdHRyaWJ1dGU7XG59XG4iXX0=