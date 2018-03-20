'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadFiles = loadFiles;
exports.loadImages = loadImages;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _browserLoadFile = require('./browser-load-file');

var _browserLoadImage = require('./browser-load-image');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function noop() {}

/*
 * Loads (Requests) multiple files asynchronously
 */
/* eslint-disable guard-for-in, complexity, no-try-catch */
function loadFiles() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var urls = opts.urls,
      _opts$onProgress = opts.onProgress,
      onProgress = _opts$onProgress === undefined ? noop : _opts$onProgress;

  (0, _assert2.default)(urls.every(function (url) {
    return typeof url === 'string';
  }), 'loadImages: {urls} must be array of strings');
  var count = 0;
  return Promise.all(urls.map(function (url) {
    var promise = (0, _browserLoadFile.loadFile)(Object.assign({ url: url }, opts));
    promise.then(function (file) {
      return onProgress({
        progress: ++count / urls.length,
        count: count,
        total: urls.length,
        url: url
      });
    });
    return promise;
  }));
}

/*
 * Loads (requests) multiple images asynchronously
 */
function loadImages() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var urls = opts.urls,
      _opts$onProgress2 = opts.onProgress,
      onProgress = _opts$onProgress2 === undefined ? noop : _opts$onProgress2;

  (0, _assert2.default)(urls.every(function (url) {
    return typeof url === 'string';
  }), 'loadImages: {urls} must be array of strings');
  var count = 0;
  return Promise.all(urls.map(function (url) {
    var promise = (0, _browserLoadImage.loadImage)(url, opts);
    promise.then(function (file) {
      return onProgress({
        progress: ++count / urls.length,
        count: count,
        total: urls.length,
        url: url
      });
    });
    return promise;
  }));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvbG9hZC1maWxlcy5qcyJdLCJuYW1lcyI6WyJsb2FkRmlsZXMiLCJsb2FkSW1hZ2VzIiwibm9vcCIsIm9wdHMiLCJ1cmxzIiwib25Qcm9ncmVzcyIsImV2ZXJ5IiwidXJsIiwiY291bnQiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwicHJvbWlzZSIsIk9iamVjdCIsImFzc2lnbiIsInRoZW4iLCJwcm9ncmVzcyIsImxlbmd0aCIsInRvdGFsIl0sIm1hcHBpbmdzIjoiOzs7OztRQVVnQkEsUyxHQUFBQSxTO1FBdUJBQyxVLEdBQUFBLFU7O0FBaENoQjs7OztBQUNBOztBQUNBOzs7O0FBRUEsU0FBU0MsSUFBVCxHQUFnQixDQUFFOztBQUVsQjs7O0FBUEE7QUFVTyxTQUFTRixTQUFULEdBQThCO0FBQUEsTUFBWEcsSUFBVyx1RUFBSixFQUFJO0FBQUEsTUFDNUJDLElBRDRCLEdBQ0RELElBREMsQ0FDNUJDLElBRDRCO0FBQUEseUJBQ0RELElBREMsQ0FDdEJFLFVBRHNCO0FBQUEsTUFDdEJBLFVBRHNCLG9DQUNUSCxJQURTOztBQUVuQyx3QkFBT0UsS0FBS0UsS0FBTCxDQUFXO0FBQUEsV0FBTyxPQUFPQyxHQUFQLEtBQWUsUUFBdEI7QUFBQSxHQUFYLENBQVAsRUFBbUQsNkNBQW5EO0FBQ0EsTUFBSUMsUUFBUSxDQUFaO0FBQ0EsU0FBT0MsUUFBUUMsR0FBUixDQUNMTixLQUFLTyxHQUFMLENBQVMsZUFBTztBQUNkLFFBQU1DLFVBQVUsK0JBQVNDLE9BQU9DLE1BQVAsQ0FBYyxFQUFDUCxRQUFELEVBQWQsRUFBcUJKLElBQXJCLENBQVQsQ0FBaEI7QUFDQVMsWUFBUUcsSUFBUixDQUFhO0FBQUEsYUFDWFYsV0FBVztBQUNUVyxrQkFBVSxFQUFFUixLQUFGLEdBQVVKLEtBQUthLE1BRGhCO0FBRVRULG9CQUZTO0FBR1RVLGVBQU9kLEtBQUthLE1BSEg7QUFJVFY7QUFKUyxPQUFYLENBRFc7QUFBQSxLQUFiO0FBUUEsV0FBT0ssT0FBUDtBQUNELEdBWEQsQ0FESyxDQUFQO0FBY0Q7O0FBRUQ7OztBQUdPLFNBQVNYLFVBQVQsR0FBK0I7QUFBQSxNQUFYRSxJQUFXLHVFQUFKLEVBQUk7QUFBQSxNQUM3QkMsSUFENkIsR0FDRkQsSUFERSxDQUM3QkMsSUFENkI7QUFBQSwwQkFDRkQsSUFERSxDQUN2QkUsVUFEdUI7QUFBQSxNQUN2QkEsVUFEdUIscUNBQ1ZILElBRFU7O0FBRXBDLHdCQUFPRSxLQUFLRSxLQUFMLENBQVc7QUFBQSxXQUFPLE9BQU9DLEdBQVAsS0FBZSxRQUF0QjtBQUFBLEdBQVgsQ0FBUCxFQUFtRCw2Q0FBbkQ7QUFDQSxNQUFJQyxRQUFRLENBQVo7QUFDQSxTQUFPQyxRQUFRQyxHQUFSLENBQ0xOLEtBQUtPLEdBQUwsQ0FBUyxlQUFPO0FBQ2QsUUFBTUMsVUFBVSxpQ0FBVUwsR0FBVixFQUFlSixJQUFmLENBQWhCO0FBQ0FTLFlBQVFHLElBQVIsQ0FBYTtBQUFBLGFBQ1hWLFdBQVc7QUFDVFcsa0JBQVUsRUFBRVIsS0FBRixHQUFVSixLQUFLYSxNQURoQjtBQUVUVCxvQkFGUztBQUdUVSxlQUFPZCxLQUFLYSxNQUhIO0FBSVRWO0FBSlMsT0FBWCxDQURXO0FBQUEsS0FBYjtBQVFBLFdBQU9LLE9BQVA7QUFDRCxHQVhELENBREssQ0FBUDtBQWNEIiwiZmlsZSI6ImxvYWQtZmlsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4sIGNvbXBsZXhpdHksIG5vLXRyeS1jYXRjaCAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHtsb2FkRmlsZX0gZnJvbSAnLi9icm93c2VyLWxvYWQtZmlsZSc7XG5pbXBvcnQge2xvYWRJbWFnZX0gZnJvbSAnLi9icm93c2VyLWxvYWQtaW1hZ2UnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuLypcbiAqIExvYWRzIChSZXF1ZXN0cykgbXVsdGlwbGUgZmlsZXMgYXN5bmNocm9ub3VzbHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRGaWxlcyhvcHRzID0ge30pIHtcbiAgY29uc3Qge3VybHMsIG9uUHJvZ3Jlc3MgPSBub29wfSA9IG9wdHM7XG4gIGFzc2VydCh1cmxzLmV2ZXJ5KHVybCA9PiB0eXBlb2YgdXJsID09PSAnc3RyaW5nJyksICdsb2FkSW1hZ2VzOiB7dXJsc30gbXVzdCBiZSBhcnJheSBvZiBzdHJpbmdzJyk7XG4gIGxldCBjb3VudCA9IDA7XG4gIHJldHVybiBQcm9taXNlLmFsbChcbiAgICB1cmxzLm1hcCh1cmwgPT4ge1xuICAgICAgY29uc3QgcHJvbWlzZSA9IGxvYWRGaWxlKE9iamVjdC5hc3NpZ24oe3VybH0sIG9wdHMpKTtcbiAgICAgIHByb21pc2UudGhlbihmaWxlID0+XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHByb2dyZXNzOiArK2NvdW50IC8gdXJscy5sZW5ndGgsXG4gICAgICAgICAgY291bnQsXG4gICAgICAgICAgdG90YWw6IHVybHMubGVuZ3RoLFxuICAgICAgICAgIHVybFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH0pXG4gICk7XG59XG5cbi8qXG4gKiBMb2FkcyAocmVxdWVzdHMpIG11bHRpcGxlIGltYWdlcyBhc3luY2hyb25vdXNseVxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEltYWdlcyhvcHRzID0ge30pIHtcbiAgY29uc3Qge3VybHMsIG9uUHJvZ3Jlc3MgPSBub29wfSA9IG9wdHM7XG4gIGFzc2VydCh1cmxzLmV2ZXJ5KHVybCA9PiB0eXBlb2YgdXJsID09PSAnc3RyaW5nJyksICdsb2FkSW1hZ2VzOiB7dXJsc30gbXVzdCBiZSBhcnJheSBvZiBzdHJpbmdzJyk7XG4gIGxldCBjb3VudCA9IDA7XG4gIHJldHVybiBQcm9taXNlLmFsbChcbiAgICB1cmxzLm1hcCh1cmwgPT4ge1xuICAgICAgY29uc3QgcHJvbWlzZSA9IGxvYWRJbWFnZSh1cmwsIG9wdHMpO1xuICAgICAgcHJvbWlzZS50aGVuKGZpbGUgPT5cbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgcHJvZ3Jlc3M6ICsrY291bnQgLyB1cmxzLmxlbmd0aCxcbiAgICAgICAgICBjb3VudCxcbiAgICAgICAgICB0b3RhbDogdXJscy5sZW5ndGgsXG4gICAgICAgICAgdXJsXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfSlcbiAgKTtcbn1cbiJdfQ==