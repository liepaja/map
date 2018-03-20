'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fp64ify = fp64ify;
exports.fp64ifyMatrix4 = fp64ifyMatrix4;
exports.fp64LowPart = fp64LowPart;
exports.enable64bitSupport = enable64bitSupport;

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _constants = require('../lib/constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO - utils should not import from lib

/*
 * Frequently used small math utils: bundlers, especially webpack,
 * adds a thunk around every exported function that adds enough overhead to pull down performance.
 * It may be worth it to also export these as part of an object.
 */
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

// TODO - move to shaderlib utilities
function fp64ify(a) {
  var array = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var startIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  var hiPart = Math.fround(a);
  var loPart = a - Math.fround(a);
  array[startIndex] = hiPart;
  array[startIndex + 1] = loPart;
  return array;
}

// calculate WebGL 64 bit matrix (transposed "Float64Array")
function fp64ifyMatrix4(matrix) {
  // Transpose the projection matrix to column major for GLSL.
  var matrixFP64 = new Float32Array(32);
  for (var i = 0; i < 4; ++i) {
    for (var j = 0; j < 4; ++j) {
      var index = i * 4 + j;
      fp64ify(matrix[j * 4 + i], matrixFP64, index * 2);
    }
  }
  return matrixFP64;
}

function fp64LowPart(a) {
  return a - Math.fround(a);
}

function enable64bitSupport(props) {
  if (props.fp64) {
    if (props.coordinateSystem === _constants.COORDINATE_SYSTEM.LNGLAT) {
      return true;
    }
    _log2.default.once(0, '64-bit mode only works with coordinateSystem set to\n      COORDINATE_SYSTEM.LNGLAT. Rendering in 32-bit mode instead');
  }

  return false;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3V0aWxzL2ZwNjQuanMiXSwibmFtZXMiOlsiZnA2NGlmeSIsImZwNjRpZnlNYXRyaXg0IiwiZnA2NExvd1BhcnQiLCJlbmFibGU2NGJpdFN1cHBvcnQiLCJhIiwiYXJyYXkiLCJzdGFydEluZGV4IiwiaGlQYXJ0IiwiTWF0aCIsImZyb3VuZCIsImxvUGFydCIsIm1hdHJpeCIsIm1hdHJpeEZQNjQiLCJGbG9hdDMyQXJyYXkiLCJpIiwiaiIsImluZGV4IiwicHJvcHMiLCJmcDY0IiwiY29vcmRpbmF0ZVN5c3RlbSIsIkxOR0xBVCIsIm9uY2UiXSwibWFwcGluZ3MiOiI7Ozs7O1FBNkJnQkEsTyxHQUFBQSxPO1FBU0FDLGMsR0FBQUEsYztRQVlBQyxXLEdBQUFBLFc7UUFJQUMsa0IsR0FBQUEsa0I7O0FBakNoQjs7OztBQUNBOzs7O0FBQW9EOztBQUVwRDs7Ozs7QUF4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFTTyxTQUFTSCxPQUFULENBQWlCSSxDQUFqQixFQUFnRDtBQUFBLE1BQTVCQyxLQUE0Qix1RUFBcEIsRUFBb0I7QUFBQSxNQUFoQkMsVUFBZ0IsdUVBQUgsQ0FBRzs7QUFDckQsTUFBTUMsU0FBU0MsS0FBS0MsTUFBTCxDQUFZTCxDQUFaLENBQWY7QUFDQSxNQUFNTSxTQUFTTixJQUFJSSxLQUFLQyxNQUFMLENBQVlMLENBQVosQ0FBbkI7QUFDQUMsUUFBTUMsVUFBTixJQUFvQkMsTUFBcEI7QUFDQUYsUUFBTUMsYUFBYSxDQUFuQixJQUF3QkksTUFBeEI7QUFDQSxTQUFPTCxLQUFQO0FBQ0Q7O0FBRUQ7QUFDTyxTQUFTSixjQUFULENBQXdCVSxNQUF4QixFQUFnQztBQUNyQztBQUNBLE1BQU1DLGFBQWEsSUFBSUMsWUFBSixDQUFpQixFQUFqQixDQUFuQjtBQUNBLE9BQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLENBQXBCLEVBQXVCLEVBQUVBLENBQXpCLEVBQTRCO0FBQzFCLFNBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLENBQXBCLEVBQXVCLEVBQUVBLENBQXpCLEVBQTRCO0FBQzFCLFVBQU1DLFFBQVFGLElBQUksQ0FBSixHQUFRQyxDQUF0QjtBQUNBZixjQUFRVyxPQUFPSSxJQUFJLENBQUosR0FBUUQsQ0FBZixDQUFSLEVBQTJCRixVQUEzQixFQUF1Q0ksUUFBUSxDQUEvQztBQUNEO0FBQ0Y7QUFDRCxTQUFPSixVQUFQO0FBQ0Q7O0FBRU0sU0FBU1YsV0FBVCxDQUFxQkUsQ0FBckIsRUFBd0I7QUFDN0IsU0FBT0EsSUFBSUksS0FBS0MsTUFBTCxDQUFZTCxDQUFaLENBQVg7QUFDRDs7QUFFTSxTQUFTRCxrQkFBVCxDQUE0QmMsS0FBNUIsRUFBbUM7QUFDeEMsTUFBSUEsTUFBTUMsSUFBVixFQUFnQjtBQUNkLFFBQUlELE1BQU1FLGdCQUFOLEtBQTJCLDZCQUFrQkMsTUFBakQsRUFBeUQ7QUFDdkQsYUFBTyxJQUFQO0FBQ0Q7QUFDRCxrQkFBSUMsSUFBSixDQUNFLENBREY7QUFLRDs7QUFFRCxTQUFPLEtBQVA7QUFDRCIsImZpbGUiOiJmcDY0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbi8vIFRPRE8gLSBtb3ZlIHRvIHNoYWRlcmxpYiB1dGlsaXRpZXNcbmltcG9ydCBsb2cgZnJvbSAnLi9sb2cnO1xuaW1wb3J0IHtDT09SRElOQVRFX1NZU1RFTX0gZnJvbSAnLi4vbGliL2NvbnN0YW50cyc7IC8vIFRPRE8gLSB1dGlscyBzaG91bGQgbm90IGltcG9ydCBmcm9tIGxpYlxuXG4vKlxuICogRnJlcXVlbnRseSB1c2VkIHNtYWxsIG1hdGggdXRpbHM6IGJ1bmRsZXJzLCBlc3BlY2lhbGx5IHdlYnBhY2ssXG4gKiBhZGRzIGEgdGh1bmsgYXJvdW5kIGV2ZXJ5IGV4cG9ydGVkIGZ1bmN0aW9uIHRoYXQgYWRkcyBlbm91Z2ggb3ZlcmhlYWQgdG8gcHVsbCBkb3duIHBlcmZvcm1hbmNlLlxuICogSXQgbWF5IGJlIHdvcnRoIGl0IHRvIGFsc28gZXhwb3J0IHRoZXNlIGFzIHBhcnQgb2YgYW4gb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZnA2NGlmeShhLCBhcnJheSA9IFtdLCBzdGFydEluZGV4ID0gMCkge1xuICBjb25zdCBoaVBhcnQgPSBNYXRoLmZyb3VuZChhKTtcbiAgY29uc3QgbG9QYXJ0ID0gYSAtIE1hdGguZnJvdW5kKGEpO1xuICBhcnJheVtzdGFydEluZGV4XSA9IGhpUGFydDtcbiAgYXJyYXlbc3RhcnRJbmRleCArIDFdID0gbG9QYXJ0O1xuICByZXR1cm4gYXJyYXk7XG59XG5cbi8vIGNhbGN1bGF0ZSBXZWJHTCA2NCBiaXQgbWF0cml4ICh0cmFuc3Bvc2VkIFwiRmxvYXQ2NEFycmF5XCIpXG5leHBvcnQgZnVuY3Rpb24gZnA2NGlmeU1hdHJpeDQobWF0cml4KSB7XG4gIC8vIFRyYW5zcG9zZSB0aGUgcHJvamVjdGlvbiBtYXRyaXggdG8gY29sdW1uIG1ham9yIGZvciBHTFNMLlxuICBjb25zdCBtYXRyaXhGUDY0ID0gbmV3IEZsb2F0MzJBcnJheSgzMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCA0OyArK2opIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gaSAqIDQgKyBqO1xuICAgICAgZnA2NGlmeShtYXRyaXhbaiAqIDQgKyBpXSwgbWF0cml4RlA2NCwgaW5kZXggKiAyKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdHJpeEZQNjQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcDY0TG93UGFydChhKSB7XG4gIHJldHVybiBhIC0gTWF0aC5mcm91bmQoYSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGU2NGJpdFN1cHBvcnQocHJvcHMpIHtcbiAgaWYgKHByb3BzLmZwNjQpIHtcbiAgICBpZiAocHJvcHMuY29vcmRpbmF0ZVN5c3RlbSA9PT0gQ09PUkRJTkFURV9TWVNURU0uTE5HTEFUKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgbG9nLm9uY2UoXG4gICAgICAwLFxuICAgICAgYDY0LWJpdCBtb2RlIG9ubHkgd29ya3Mgd2l0aCBjb29yZGluYXRlU3lzdGVtIHNldCB0b1xuICAgICAgQ09PUkRJTkFURV9TWVNURU0uTE5HTEFULiBSZW5kZXJpbmcgaW4gMzItYml0IG1vZGUgaW5zdGVhZGBcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19