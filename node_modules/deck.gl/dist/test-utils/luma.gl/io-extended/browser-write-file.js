'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeFile = writeFile;

var _utils = require('../../utils');

// TODO hack - trick filesaver.js to skip loading under node
/* global global*/
var savedNavigatorExists = 'navigator' in global; // A browser implementation of the Node.js `fs` module's `fs.writeFile` method.

var savedNavigator = global.navigator;
if (!_utils.isBrowser) {
  global.navigator = { userAgent: 'MSIE 9.' };
}

// Need to use `require` to ensure our modification of global code above happens first
var saveAs = require('filesaver.js');

if (!_utils.isBrowser) {
  if (savedNavigatorExists) {
    global.navigator = savedNavigator;
  } else {
    delete global.navigator;
  }
}
// END hack

var window = require('global/window');
var Blob = window.Blob;

/**
 * File system write function for the browser, similar to Node's fs.writeFile
 *
 * Saves a file by downloading it with the given file name.
 *
 * @param {String} file - file name
 * @param {String|Blob} data - data to be written to file
 * @param {String|Object} options -
 * @param {Function} callback - Standard node (err, data) callback
 * @return {Promise} - promise, can be used instead of callback
 */
function writeFile(file, data, options) {
  var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function () {};

  // options is optional
  if (callback === undefined && typeof options === 'function') {
    options = undefined;
    callback = options;
  }
  if (typeof data === 'string') {
    data = new Blob(data);
  }
  return new Promise(function (resolve, reject) {
    var result = void 0;
    try {
      result = saveAs(data, file, options);
    } catch (error) {
      reject(error);
      return callback(error, null);
    }
    resolve();
    return callback(null, result);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tZXh0ZW5kZWQvYnJvd3Nlci13cml0ZS1maWxlLmpzIl0sIm5hbWVzIjpbIndyaXRlRmlsZSIsInNhdmVkTmF2aWdhdG9yRXhpc3RzIiwiZ2xvYmFsIiwic2F2ZWROYXZpZ2F0b3IiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJzYXZlQXMiLCJyZXF1aXJlIiwid2luZG93IiwiQmxvYiIsImZpbGUiLCJkYXRhIiwib3B0aW9ucyIsImNhbGxiYWNrIiwidW5kZWZpbmVkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJyZXN1bHQiLCJlcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFzQ2dCQSxTLEdBQUFBLFM7O0FBcENoQjs7QUFFQTtBQUNBO0FBQ0EsSUFBTUMsdUJBQXVCLGVBQWVDLE1BQTVDLEMsQ0FOQTs7QUFPQSxJQUFNQyxpQkFBaUJELE9BQU9FLFNBQTlCO0FBQ0EsSUFBSSxpQkFBSixFQUFnQjtBQUNkRixTQUFPRSxTQUFQLEdBQW1CLEVBQUNDLFdBQVcsU0FBWixFQUFuQjtBQUNEOztBQUVEO0FBQ0EsSUFBTUMsU0FBU0MsUUFBUSxjQUFSLENBQWY7O0FBRUEsSUFBSSxpQkFBSixFQUFnQjtBQUNkLE1BQUlOLG9CQUFKLEVBQTBCO0FBQ3hCQyxXQUFPRSxTQUFQLEdBQW1CRCxjQUFuQjtBQUNELEdBRkQsTUFFTztBQUNMLFdBQU9ELE9BQU9FLFNBQWQ7QUFDRDtBQUNGO0FBQ0Q7O0FBRUEsSUFBTUksU0FBU0QsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNRSxPQUFPRCxPQUFPQyxJQUFwQjs7QUFFQTs7Ozs7Ozs7Ozs7QUFXTyxTQUFTVCxTQUFULENBQW1CVSxJQUFuQixFQUF5QkMsSUFBekIsRUFBK0JDLE9BQS9CLEVBQTZEO0FBQUEsTUFBckJDLFFBQXFCLHVFQUFWLFlBQU0sQ0FBRSxDQUFFOztBQUNsRTtBQUNBLE1BQUlBLGFBQWFDLFNBQWIsSUFBMEIsT0FBT0YsT0FBUCxLQUFtQixVQUFqRCxFQUE2RDtBQUMzREEsY0FBVUUsU0FBVjtBQUNBRCxlQUFXRCxPQUFYO0FBQ0Q7QUFDRCxNQUFJLE9BQU9ELElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUJBLFdBQU8sSUFBSUYsSUFBSixDQUFTRSxJQUFULENBQVA7QUFDRDtBQUNELFNBQU8sSUFBSUksT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUN0QyxRQUFJQyxlQUFKO0FBQ0EsUUFBSTtBQUNGQSxlQUFTWixPQUFPSyxJQUFQLEVBQWFELElBQWIsRUFBbUJFLE9BQW5CLENBQVQ7QUFDRCxLQUZELENBRUUsT0FBT08sS0FBUCxFQUFjO0FBQ2RGLGFBQU9FLEtBQVA7QUFDQSxhQUFPTixTQUFTTSxLQUFULEVBQWdCLElBQWhCLENBQVA7QUFDRDtBQUNESDtBQUNBLFdBQU9ILFNBQVMsSUFBVCxFQUFlSyxNQUFmLENBQVA7QUFDRCxHQVZNLENBQVA7QUFXRCIsImZpbGUiOiJicm93c2VyLXdyaXRlLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgdGhlIE5vZGUuanMgYGZzYCBtb2R1bGUncyBgZnMud3JpdGVGaWxlYCBtZXRob2QuXG5cbmltcG9ydCB7aXNCcm93c2VyfSBmcm9tICcuLi8uLi91dGlscyc7XG5cbi8vIFRPRE8gaGFjayAtIHRyaWNrIGZpbGVzYXZlci5qcyB0byBza2lwIGxvYWRpbmcgdW5kZXIgbm9kZVxuLyogZ2xvYmFsIGdsb2JhbCovXG5jb25zdCBzYXZlZE5hdmlnYXRvckV4aXN0cyA9ICduYXZpZ2F0b3InIGluIGdsb2JhbDtcbmNvbnN0IHNhdmVkTmF2aWdhdG9yID0gZ2xvYmFsLm5hdmlnYXRvcjtcbmlmICghaXNCcm93c2VyKSB7XG4gIGdsb2JhbC5uYXZpZ2F0b3IgPSB7dXNlckFnZW50OiAnTVNJRSA5Lid9O1xufVxuXG4vLyBOZWVkIHRvIHVzZSBgcmVxdWlyZWAgdG8gZW5zdXJlIG91ciBtb2RpZmljYXRpb24gb2YgZ2xvYmFsIGNvZGUgYWJvdmUgaGFwcGVucyBmaXJzdFxuY29uc3Qgc2F2ZUFzID0gcmVxdWlyZSgnZmlsZXNhdmVyLmpzJyk7XG5cbmlmICghaXNCcm93c2VyKSB7XG4gIGlmIChzYXZlZE5hdmlnYXRvckV4aXN0cykge1xuICAgIGdsb2JhbC5uYXZpZ2F0b3IgPSBzYXZlZE5hdmlnYXRvcjtcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgZ2xvYmFsLm5hdmlnYXRvcjtcbiAgfVxufVxuLy8gRU5EIGhhY2tcblxuY29uc3Qgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpO1xuY29uc3QgQmxvYiA9IHdpbmRvdy5CbG9iO1xuXG4vKipcbiAqIEZpbGUgc3lzdGVtIHdyaXRlIGZ1bmN0aW9uIGZvciB0aGUgYnJvd3Nlciwgc2ltaWxhciB0byBOb2RlJ3MgZnMud3JpdGVGaWxlXG4gKlxuICogU2F2ZXMgYSBmaWxlIGJ5IGRvd25sb2FkaW5nIGl0IHdpdGggdGhlIGdpdmVuIGZpbGUgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZSAtIGZpbGUgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd8QmxvYn0gZGF0YSAtIGRhdGEgdG8gYmUgd3JpdHRlbiB0byBmaWxlXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG9wdGlvbnMgLVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBTdGFuZGFyZCBub2RlIChlcnIsIGRhdGEpIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAtIHByb21pc2UsIGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgY2FsbGJhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZShmaWxlLCBkYXRhLCBvcHRpb25zLCBjYWxsYmFjayA9ICgpID0+IHt9KSB7XG4gIC8vIG9wdGlvbnMgaXMgb3B0aW9uYWxcbiAgaWYgKGNhbGxiYWNrID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgfVxuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgZGF0YSA9IG5ldyBCbG9iKGRhdGEpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gc2F2ZUFzKGRhdGEsIGZpbGUsIG9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9XG4gICAgcmVzb2x2ZSgpO1xuICAgIHJldHVybiBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICB9KTtcbn1cbiJdfQ==