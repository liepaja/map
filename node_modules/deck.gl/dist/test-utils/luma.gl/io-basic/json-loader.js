'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.loadModel = loadModel;
exports.parseModel = parseModel;

var _browserLoadFile = require('./browser-load-file');

var _webgl = require('../webgl');

var _core = require('../core');

var _geometry = require('../geometry');

// Loads a simple JSON format
function loadModel(gl) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return (0, _browserLoadFile.loadFile)(opts).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1),
        file = _ref2[0];

    return parseModel(gl, Object.assign({ file: file }, opts));
  });
}

function parseModel(gl) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var file = opts.file,
      _opts$program = opts.program,
      program = _opts$program === undefined ? new _webgl.Program(gl) : _opts$program;

  var json = typeof file === 'string' ? parseJSON(file) : file;
  // Remove any attributes so that we can create a geometry
  // TODO - change format to put these in geometry sub object?
  var attributes = {};
  var modelOptions = {};
  for (var key in json) {
    var value = json[key];
    if (Array.isArray(value)) {
      attributes[key] = key === 'indices' ? new Uint16Array(value) : new Float32Array(value);
    } else {
      modelOptions[key] = value;
    }
  }

  return new _core.Model(gl, Object.assign({ program: program, geometry: new _geometry.Geometry({ attributes: attributes }) }, modelOptions, opts));
}

function parseJSON(file) {
  try {
    return JSON.parse(file);
  } catch (error) {
    throw new Error('Failed to parse JSON: ' + error);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvanNvbi1sb2FkZXIuanMiXSwibmFtZXMiOlsibG9hZE1vZGVsIiwicGFyc2VNb2RlbCIsImdsIiwib3B0cyIsInRoZW4iLCJmaWxlIiwiT2JqZWN0IiwiYXNzaWduIiwicHJvZ3JhbSIsImpzb24iLCJwYXJzZUpTT04iLCJhdHRyaWJ1dGVzIiwibW9kZWxPcHRpb25zIiwia2V5IiwidmFsdWUiLCJBcnJheSIsImlzQXJyYXkiLCJVaW50MTZBcnJheSIsIkZsb2F0MzJBcnJheSIsImdlb21ldHJ5IiwiSlNPTiIsInBhcnNlIiwiZXJyb3IiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFNZ0JBLFMsR0FBQUEsUztRQUlBQyxVLEdBQUFBLFU7O0FBVmhCOztBQUNBOztBQUNBOztBQUNBOztBQUVBO0FBQ08sU0FBU0QsU0FBVCxDQUFtQkUsRUFBbkIsRUFBa0M7QUFBQSxNQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQ3ZDLFNBQU8sK0JBQVNBLElBQVQsRUFBZUMsSUFBZixDQUFvQjtBQUFBO0FBQUEsUUFBRUMsSUFBRjs7QUFBQSxXQUFZSixXQUFXQyxFQUFYLEVBQWVJLE9BQU9DLE1BQVAsQ0FBYyxFQUFDRixVQUFELEVBQWQsRUFBc0JGLElBQXRCLENBQWYsQ0FBWjtBQUFBLEdBQXBCLENBQVA7QUFDRDs7QUFFTSxTQUFTRixVQUFULENBQW9CQyxFQUFwQixFQUFtQztBQUFBLE1BQVhDLElBQVcsdUVBQUosRUFBSTtBQUFBLE1BQ2pDRSxJQURpQyxHQUNFRixJQURGLENBQ2pDRSxJQURpQztBQUFBLHNCQUNFRixJQURGLENBQzNCSyxPQUQyQjtBQUFBLE1BQzNCQSxPQUQyQixpQ0FDakIsbUJBQVlOLEVBQVosQ0FEaUI7O0FBRXhDLE1BQU1PLE9BQU8sT0FBT0osSUFBUCxLQUFnQixRQUFoQixHQUEyQkssVUFBVUwsSUFBVixDQUEzQixHQUE2Q0EsSUFBMUQ7QUFDQTtBQUNBO0FBQ0EsTUFBTU0sYUFBYSxFQUFuQjtBQUNBLE1BQU1DLGVBQWUsRUFBckI7QUFDQSxPQUFLLElBQU1DLEdBQVgsSUFBa0JKLElBQWxCLEVBQXdCO0FBQ3RCLFFBQU1LLFFBQVFMLEtBQUtJLEdBQUwsQ0FBZDtBQUNBLFFBQUlFLE1BQU1DLE9BQU4sQ0FBY0YsS0FBZCxDQUFKLEVBQTBCO0FBQ3hCSCxpQkFBV0UsR0FBWCxJQUFrQkEsUUFBUSxTQUFSLEdBQW9CLElBQUlJLFdBQUosQ0FBZ0JILEtBQWhCLENBQXBCLEdBQTZDLElBQUlJLFlBQUosQ0FBaUJKLEtBQWpCLENBQS9EO0FBQ0QsS0FGRCxNQUVPO0FBQ0xGLG1CQUFhQyxHQUFiLElBQW9CQyxLQUFwQjtBQUNEO0FBQ0Y7O0FBRUQsU0FBTyxnQkFDTFosRUFESyxFQUVMSSxPQUFPQyxNQUFQLENBQWMsRUFBQ0MsZ0JBQUQsRUFBVVcsVUFBVSx1QkFBYSxFQUFDUixzQkFBRCxFQUFiLENBQXBCLEVBQWQsRUFBK0RDLFlBQS9ELEVBQTZFVCxJQUE3RSxDQUZLLENBQVA7QUFJRDs7QUFFRCxTQUFTTyxTQUFULENBQW1CTCxJQUFuQixFQUF5QjtBQUN2QixNQUFJO0FBQ0YsV0FBT2UsS0FBS0MsS0FBTCxDQUFXaEIsSUFBWCxDQUFQO0FBQ0QsR0FGRCxDQUVFLE9BQU9pQixLQUFQLEVBQWM7QUFDZCxVQUFNLElBQUlDLEtBQUosNEJBQW1DRCxLQUFuQyxDQUFOO0FBQ0Q7QUFDRiIsImZpbGUiOiJqc29uLWxvYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7bG9hZEZpbGV9IGZyb20gJy4vYnJvd3Nlci1sb2FkLWZpbGUnO1xuaW1wb3J0IHtQcm9ncmFtfSBmcm9tICcuLi93ZWJnbCc7XG5pbXBvcnQge01vZGVsfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7R2VvbWV0cnl9IGZyb20gJy4uL2dlb21ldHJ5JztcblxuLy8gTG9hZHMgYSBzaW1wbGUgSlNPTiBmb3JtYXRcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTW9kZWwoZ2wsIG9wdHMgPSB7fSkge1xuICByZXR1cm4gbG9hZEZpbGUob3B0cykudGhlbigoW2ZpbGVdKSA9PiBwYXJzZU1vZGVsKGdsLCBPYmplY3QuYXNzaWduKHtmaWxlfSwgb3B0cykpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTW9kZWwoZ2wsIG9wdHMgPSB7fSkge1xuICBjb25zdCB7ZmlsZSwgcHJvZ3JhbSA9IG5ldyBQcm9ncmFtKGdsKX0gPSBvcHRzO1xuICBjb25zdCBqc29uID0gdHlwZW9mIGZpbGUgPT09ICdzdHJpbmcnID8gcGFyc2VKU09OKGZpbGUpIDogZmlsZTtcbiAgLy8gUmVtb3ZlIGFueSBhdHRyaWJ1dGVzIHNvIHRoYXQgd2UgY2FuIGNyZWF0ZSBhIGdlb21ldHJ5XG4gIC8vIFRPRE8gLSBjaGFuZ2UgZm9ybWF0IHRvIHB1dCB0aGVzZSBpbiBnZW9tZXRyeSBzdWIgb2JqZWN0P1xuICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gIGNvbnN0IG1vZGVsT3B0aW9ucyA9IHt9O1xuICBmb3IgKGNvbnN0IGtleSBpbiBqc29uKSB7XG4gICAgY29uc3QgdmFsdWUgPSBqc29uW2tleV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBhdHRyaWJ1dGVzW2tleV0gPSBrZXkgPT09ICdpbmRpY2VzJyA/IG5ldyBVaW50MTZBcnJheSh2YWx1ZSkgOiBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kZWxPcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3IE1vZGVsKFxuICAgIGdsLFxuICAgIE9iamVjdC5hc3NpZ24oe3Byb2dyYW0sIGdlb21ldHJ5OiBuZXcgR2VvbWV0cnkoe2F0dHJpYnV0ZXN9KX0sIG1vZGVsT3B0aW9ucywgb3B0cylcbiAgKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VKU09OKGZpbGUpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShmaWxlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBwYXJzZSBKU09OOiAke2Vycm9yfWApO1xuICB9XG59XG4iXX0=