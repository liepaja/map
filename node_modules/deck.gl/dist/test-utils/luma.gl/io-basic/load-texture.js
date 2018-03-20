'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.loadTexture = loadTexture;
exports.loadProgram = loadProgram;
exports.loadTextures = loadTextures;

var _loadFiles = require('./load-files');

var _webgl = require('../webgl');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function noop() {}

function loadTexture(gl, url) {
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var urls = opts.urls,
      _opts$onProgress = opts.onProgress,
      onProgress = _opts$onProgress === undefined ? noop : _opts$onProgress;

  (0, _assert2.default)(typeof url === 'string', 'loadTexture: url must be string');

  return (0, _loadFiles.loadImages)(Object.assign({ urls: urls, onProgress: onProgress }, opts)).then(function (images) {
    return images.map(function (img, i) {
      return new _webgl.Texture2D(gl, Object.assign({ id: urls[i] }, opts, { data: img }));
    });
  });
}

function loadProgram(gl) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var vs = opts.vs,
      fs = opts.fs,
      _opts$onProgress2 = opts.onProgress,
      onProgress = _opts$onProgress2 === undefined ? noop : _opts$onProgress2;

  return (0, _loadFiles.loadFiles)(Object.assign({ urls: [vs, fs], onProgress: onProgress }, opts)).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        vsText = _ref2[0],
        fsText = _ref2[1];

    return new _webgl.Program(gl, Object.assign({ vs: vsText, fs: fsText }, opts));
  });
}

function loadTextures(gl) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var urls = opts.urls,
      _opts$onProgress3 = opts.onProgress,
      onProgress = _opts$onProgress3 === undefined ? noop : _opts$onProgress3;

  (0, _assert2.default)(urls.every(function (url) {
    return typeof url === 'string';
  }), 'loadTextures: {urls} must be array of strings');

  return (0, _loadFiles.loadImages)(Object.assign({ urls: urls, onProgress: onProgress }, opts)).then(function (images) {
    return images.map(function (img, i) {
      var params = Array.isArray(opts.parameters) ? opts.parameters[i] : opts.parameters;
      params = params === undefined ? {} : params;
      return new _webgl.Texture2D(gl, Object.assign({ id: urls[i] }, params, { data: img }));
    });
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvbG9hZC10ZXh0dXJlLmpzIl0sIm5hbWVzIjpbImxvYWRUZXh0dXJlIiwibG9hZFByb2dyYW0iLCJsb2FkVGV4dHVyZXMiLCJub29wIiwiZ2wiLCJ1cmwiLCJvcHRzIiwidXJscyIsIm9uUHJvZ3Jlc3MiLCJPYmplY3QiLCJhc3NpZ24iLCJ0aGVuIiwiaW1hZ2VzIiwibWFwIiwiaW1nIiwiaSIsImlkIiwiZGF0YSIsInZzIiwiZnMiLCJ2c1RleHQiLCJmc1RleHQiLCJldmVyeSIsInBhcmFtcyIsIkFycmF5IiwiaXNBcnJheSIsInBhcmFtZXRlcnMiLCJ1bmRlZmluZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1FBTWdCQSxXLEdBQUFBLFc7UUFXQUMsVyxHQUFBQSxXO1FBT0FDLFksR0FBQUEsWTs7QUF4QmhCOztBQUNBOztBQUNBOzs7Ozs7QUFFQSxTQUFTQyxJQUFULEdBQWdCLENBQUU7O0FBRVgsU0FBU0gsV0FBVCxDQUFxQkksRUFBckIsRUFBeUJDLEdBQXpCLEVBQXlDO0FBQUEsTUFBWEMsSUFBVyx1RUFBSixFQUFJO0FBQUEsTUFDdkNDLElBRHVDLEdBQ1pELElBRFksQ0FDdkNDLElBRHVDO0FBQUEseUJBQ1pELElBRFksQ0FDakNFLFVBRGlDO0FBQUEsTUFDakNBLFVBRGlDLG9DQUNwQkwsSUFEb0I7O0FBRTlDLHdCQUFPLE9BQU9FLEdBQVAsS0FBZSxRQUF0QixFQUFnQyxpQ0FBaEM7O0FBRUEsU0FBTywyQkFBV0ksT0FBT0MsTUFBUCxDQUFjLEVBQUNILFVBQUQsRUFBT0Msc0JBQVAsRUFBZCxFQUFrQ0YsSUFBbEMsQ0FBWCxFQUFvREssSUFBcEQsQ0FBeUQ7QUFBQSxXQUM5REMsT0FBT0MsR0FBUCxDQUFXLFVBQUNDLEdBQUQsRUFBTUMsQ0FBTixFQUFZO0FBQ3JCLGFBQU8scUJBQWNYLEVBQWQsRUFBa0JLLE9BQU9DLE1BQVAsQ0FBYyxFQUFDTSxJQUFJVCxLQUFLUSxDQUFMLENBQUwsRUFBZCxFQUE2QlQsSUFBN0IsRUFBbUMsRUFBQ1csTUFBTUgsR0FBUCxFQUFuQyxDQUFsQixDQUFQO0FBQ0QsS0FGRCxDQUQ4RDtBQUFBLEdBQXpELENBQVA7QUFLRDs7QUFFTSxTQUFTYixXQUFULENBQXFCRyxFQUFyQixFQUFvQztBQUFBLE1BQVhFLElBQVcsdUVBQUosRUFBSTtBQUFBLE1BQ2xDWSxFQURrQyxHQUNMWixJQURLLENBQ2xDWSxFQURrQztBQUFBLE1BQzlCQyxFQUQ4QixHQUNMYixJQURLLENBQzlCYSxFQUQ4QjtBQUFBLDBCQUNMYixJQURLLENBQzFCRSxVQUQwQjtBQUFBLE1BQzFCQSxVQUQwQixxQ0FDYkwsSUFEYTs7QUFFekMsU0FBTywwQkFBVU0sT0FBT0MsTUFBUCxDQUFjLEVBQUNILE1BQU0sQ0FBQ1csRUFBRCxFQUFLQyxFQUFMLENBQVAsRUFBaUJYLHNCQUFqQixFQUFkLEVBQTRDRixJQUE1QyxDQUFWLEVBQTZESyxJQUE3RCxDQUNMO0FBQUE7QUFBQSxRQUFFUyxNQUFGO0FBQUEsUUFBVUMsTUFBVjs7QUFBQSxXQUFzQixtQkFBWWpCLEVBQVosRUFBZ0JLLE9BQU9DLE1BQVAsQ0FBYyxFQUFDUSxJQUFJRSxNQUFMLEVBQWFELElBQUlFLE1BQWpCLEVBQWQsRUFBd0NmLElBQXhDLENBQWhCLENBQXRCO0FBQUEsR0FESyxDQUFQO0FBR0Q7O0FBRU0sU0FBU0osWUFBVCxDQUFzQkUsRUFBdEIsRUFBcUM7QUFBQSxNQUFYRSxJQUFXLHVFQUFKLEVBQUk7QUFBQSxNQUNuQ0MsSUFEbUMsR0FDUkQsSUFEUSxDQUNuQ0MsSUFEbUM7QUFBQSwwQkFDUkQsSUFEUSxDQUM3QkUsVUFENkI7QUFBQSxNQUM3QkEsVUFENkIscUNBQ2hCTCxJQURnQjs7QUFFMUMsd0JBQ0VJLEtBQUtlLEtBQUwsQ0FBVztBQUFBLFdBQU8sT0FBT2pCLEdBQVAsS0FBZSxRQUF0QjtBQUFBLEdBQVgsQ0FERixFQUVFLCtDQUZGOztBQUtBLFNBQU8sMkJBQVdJLE9BQU9DLE1BQVAsQ0FBYyxFQUFDSCxVQUFELEVBQU9DLHNCQUFQLEVBQWQsRUFBa0NGLElBQWxDLENBQVgsRUFBb0RLLElBQXBELENBQXlEO0FBQUEsV0FDOURDLE9BQU9DLEdBQVAsQ0FBVyxVQUFDQyxHQUFELEVBQU1DLENBQU4sRUFBWTtBQUNyQixVQUFJUSxTQUFTQyxNQUFNQyxPQUFOLENBQWNuQixLQUFLb0IsVUFBbkIsSUFBaUNwQixLQUFLb0IsVUFBTCxDQUFnQlgsQ0FBaEIsQ0FBakMsR0FBc0RULEtBQUtvQixVQUF4RTtBQUNBSCxlQUFTQSxXQUFXSSxTQUFYLEdBQXVCLEVBQXZCLEdBQTRCSixNQUFyQztBQUNBLGFBQU8scUJBQWNuQixFQUFkLEVBQWtCSyxPQUFPQyxNQUFQLENBQWMsRUFBQ00sSUFBSVQsS0FBS1EsQ0FBTCxDQUFMLEVBQWQsRUFBNkJRLE1BQTdCLEVBQXFDLEVBQUNOLE1BQU1ILEdBQVAsRUFBckMsQ0FBbEIsQ0FBUDtBQUNELEtBSkQsQ0FEOEQ7QUFBQSxHQUF6RCxDQUFQO0FBT0QiLCJmaWxlIjoibG9hZC10ZXh0dXJlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtsb2FkRmlsZXMsIGxvYWRJbWFnZXN9IGZyb20gJy4vbG9hZC1maWxlcyc7XG5pbXBvcnQge1Byb2dyYW0sIFRleHR1cmUyRH0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRUZXh0dXJlKGdsLCB1cmwsIG9wdHMgPSB7fSkge1xuICBjb25zdCB7dXJscywgb25Qcm9ncmVzcyA9IG5vb3B9ID0gb3B0cztcbiAgYXNzZXJ0KHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnLCAnbG9hZFRleHR1cmU6IHVybCBtdXN0IGJlIHN0cmluZycpO1xuXG4gIHJldHVybiBsb2FkSW1hZ2VzKE9iamVjdC5hc3NpZ24oe3VybHMsIG9uUHJvZ3Jlc3N9LCBvcHRzKSkudGhlbihpbWFnZXMgPT5cbiAgICBpbWFnZXMubWFwKChpbWcsIGkpID0+IHtcbiAgICAgIHJldHVybiBuZXcgVGV4dHVyZTJEKGdsLCBPYmplY3QuYXNzaWduKHtpZDogdXJsc1tpXX0sIG9wdHMsIHtkYXRhOiBpbWd9KSk7XG4gICAgfSlcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRQcm9ncmFtKGdsLCBvcHRzID0ge30pIHtcbiAgY29uc3Qge3ZzLCBmcywgb25Qcm9ncmVzcyA9IG5vb3B9ID0gb3B0cztcbiAgcmV0dXJuIGxvYWRGaWxlcyhPYmplY3QuYXNzaWduKHt1cmxzOiBbdnMsIGZzXSwgb25Qcm9ncmVzc30sIG9wdHMpKS50aGVuKFxuICAgIChbdnNUZXh0LCBmc1RleHRdKSA9PiBuZXcgUHJvZ3JhbShnbCwgT2JqZWN0LmFzc2lnbih7dnM6IHZzVGV4dCwgZnM6IGZzVGV4dH0sIG9wdHMpKVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFRleHR1cmVzKGdsLCBvcHRzID0ge30pIHtcbiAgY29uc3Qge3VybHMsIG9uUHJvZ3Jlc3MgPSBub29wfSA9IG9wdHM7XG4gIGFzc2VydChcbiAgICB1cmxzLmV2ZXJ5KHVybCA9PiB0eXBlb2YgdXJsID09PSAnc3RyaW5nJyksXG4gICAgJ2xvYWRUZXh0dXJlczoge3VybHN9IG11c3QgYmUgYXJyYXkgb2Ygc3RyaW5ncydcbiAgKTtcblxuICByZXR1cm4gbG9hZEltYWdlcyhPYmplY3QuYXNzaWduKHt1cmxzLCBvblByb2dyZXNzfSwgb3B0cykpLnRoZW4oaW1hZ2VzID0+XG4gICAgaW1hZ2VzLm1hcCgoaW1nLCBpKSA9PiB7XG4gICAgICBsZXQgcGFyYW1zID0gQXJyYXkuaXNBcnJheShvcHRzLnBhcmFtZXRlcnMpID8gb3B0cy5wYXJhbWV0ZXJzW2ldIDogb3B0cy5wYXJhbWV0ZXJzO1xuICAgICAgcGFyYW1zID0gcGFyYW1zID09PSB1bmRlZmluZWQgPyB7fSA6IHBhcmFtcztcbiAgICAgIHJldHVybiBuZXcgVGV4dHVyZTJEKGdsLCBPYmplY3QuYXNzaWduKHtpZDogdXJsc1tpXX0sIHBhcmFtcywge2RhdGE6IGltZ30pKTtcbiAgICB9KVxuICApO1xufVxuIl19