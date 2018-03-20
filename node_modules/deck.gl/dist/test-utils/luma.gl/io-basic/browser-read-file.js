'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readFile = readFile;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var window = require('global/window'); // A browser implementation of the Node.js `fs.readFile` method

var File = window.File;

/**
 * File reader function for the browser, intentionally similar
 * to node's fs.readFile API, however returns a Promise rather than
 * callbacks
 *
 * @param {File|Blob} file  HTML File or Blob object to read as string
 * @returns {Promise.string}  Resolves to a string containing file contents
 */
function readFile(file) {
  return new Promise(function (resolve, reject) {
    try {
      (0, _assert2.default)(File, 'window.File not defined. Must run under browser.');
      (0, _assert2.default)(file instanceof File, 'parameter must be a File object');

      var reader = new window.FileReader();

      reader.onerror = function (e) {
        return reject(new Error(getFileErrorMessage(e)));
      };
      reader.onabort = function () {
        return reject(new Error('Read operation was aborted.'));
      };
      reader.onload = function () {
        return resolve(reader.result);
      };

      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
}

// NOTES ON ERROR HANDLING
//
// Prepared to externalize error message texts
//
// The weird thing about the FileReader API is that the error definitions
// are only available on the error event instance that is passed to the
// handler. Thus we need to create definitions that are avialble outside
// the handler.
//
// https://developer.mozilla.org/en-US/docs/Web/API/FileReader
//
// Side Note: To complicate matters, there are also a DOMError string set on
// filereader object (error property). Not clear how or if these map
// to the event error codes. These strings are not currently used by this api.
//
// https://developer.mozilla.org/en-US/docs/Web/API/DOMError

function getFileErrorMessage(e) {
  // Map event's error codes to static error codes so that we can
  // externalize error code to error message mapping
  switch (e.target.error.code) {
    case e.target.error.NOT_FOUND_ERR:
      return 'File not found';
    case e.target.error.NOT_READABLE_ERR:
      return 'File not readable';
    case e.target.error.ABORT_ERR:
      return 'Aborted';
    case e.target.error.SECURITY_ERR:
      return 'File locked';
    case e.target.error.ENCODING_ERR:
      return 'File too long';
    default:
      return 'Read error';
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvYnJvd3Nlci1yZWFkLWZpbGUuanMiXSwibmFtZXMiOlsicmVhZEZpbGUiLCJ3aW5kb3ciLCJyZXF1aXJlIiwiRmlsZSIsImZpbGUiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJvbmVycm9yIiwiRXJyb3IiLCJnZXRGaWxlRXJyb3JNZXNzYWdlIiwiZSIsIm9uYWJvcnQiLCJvbmxvYWQiLCJyZXN1bHQiLCJyZWFkQXNUZXh0IiwiZXJyb3IiLCJ0YXJnZXQiLCJjb2RlIiwiTk9UX0ZPVU5EX0VSUiIsIk5PVF9SRUFEQUJMRV9FUlIiLCJBQk9SVF9FUlIiLCJTRUNVUklUWV9FUlIiLCJFTkNPRElOR19FUlIiXSwibWFwcGluZ3MiOiI7Ozs7O1FBZWdCQSxRLEdBQUFBLFE7O0FBYmhCOzs7Ozs7QUFFQSxJQUFNQyxTQUFTQyxRQUFRLGVBQVIsQ0FBZixDLENBSkE7O0FBS0EsSUFBTUMsT0FBT0YsT0FBT0UsSUFBcEI7O0FBRUE7Ozs7Ozs7O0FBUU8sU0FBU0gsUUFBVCxDQUFrQkksSUFBbEIsRUFBd0I7QUFDN0IsU0FBTyxJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ3RDLFFBQUk7QUFDRiw0QkFBT0osSUFBUCxFQUFhLGtEQUFiO0FBQ0EsNEJBQU9DLGdCQUFnQkQsSUFBdkIsRUFBNkIsaUNBQTdCOztBQUVBLFVBQU1LLFNBQVMsSUFBSVAsT0FBT1EsVUFBWCxFQUFmOztBQUVBRCxhQUFPRSxPQUFQLEdBQWlCO0FBQUEsZUFBS0gsT0FBTyxJQUFJSSxLQUFKLENBQVVDLG9CQUFvQkMsQ0FBcEIsQ0FBVixDQUFQLENBQUw7QUFBQSxPQUFqQjtBQUNBTCxhQUFPTSxPQUFQLEdBQWlCO0FBQUEsZUFBTVAsT0FBTyxJQUFJSSxLQUFKLENBQVUsNkJBQVYsQ0FBUCxDQUFOO0FBQUEsT0FBakI7QUFDQUgsYUFBT08sTUFBUCxHQUFnQjtBQUFBLGVBQU1ULFFBQVFFLE9BQU9RLE1BQWYsQ0FBTjtBQUFBLE9BQWhCOztBQUVBUixhQUFPUyxVQUFQLENBQWtCYixJQUFsQjtBQUNELEtBWEQsQ0FXRSxPQUFPYyxLQUFQLEVBQWM7QUFDZFgsYUFBT1csS0FBUDtBQUNEO0FBQ0YsR0FmTSxDQUFQO0FBZ0JEOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNOLG1CQUFULENBQTZCQyxDQUE3QixFQUFnQztBQUM5QjtBQUNBO0FBQ0EsVUFBUUEsRUFBRU0sTUFBRixDQUFTRCxLQUFULENBQWVFLElBQXZCO0FBQ0UsU0FBS1AsRUFBRU0sTUFBRixDQUFTRCxLQUFULENBQWVHLGFBQXBCO0FBQ0UsYUFBTyxnQkFBUDtBQUNGLFNBQUtSLEVBQUVNLE1BQUYsQ0FBU0QsS0FBVCxDQUFlSSxnQkFBcEI7QUFDRSxhQUFPLG1CQUFQO0FBQ0YsU0FBS1QsRUFBRU0sTUFBRixDQUFTRCxLQUFULENBQWVLLFNBQXBCO0FBQ0UsYUFBTyxTQUFQO0FBQ0YsU0FBS1YsRUFBRU0sTUFBRixDQUFTRCxLQUFULENBQWVNLFlBQXBCO0FBQ0UsYUFBTyxhQUFQO0FBQ0YsU0FBS1gsRUFBRU0sTUFBRixDQUFTRCxLQUFULENBQWVPLFlBQXBCO0FBQ0UsYUFBTyxlQUFQO0FBQ0Y7QUFDRSxhQUFPLFlBQVA7QUFaSjtBQWNEIiwiZmlsZSI6ImJyb3dzZXItcmVhZC1maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQSBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIHRoZSBOb2RlLmpzIGBmcy5yZWFkRmlsZWAgbWV0aG9kXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3Qgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpO1xuY29uc3QgRmlsZSA9IHdpbmRvdy5GaWxlO1xuXG4vKipcbiAqIEZpbGUgcmVhZGVyIGZ1bmN0aW9uIGZvciB0aGUgYnJvd3NlciwgaW50ZW50aW9uYWxseSBzaW1pbGFyXG4gKiB0byBub2RlJ3MgZnMucmVhZEZpbGUgQVBJLCBob3dldmVyIHJldHVybnMgYSBQcm9taXNlIHJhdGhlciB0aGFuXG4gKiBjYWxsYmFja3NcbiAqXG4gKiBAcGFyYW0ge0ZpbGV8QmxvYn0gZmlsZSAgSFRNTCBGaWxlIG9yIEJsb2Igb2JqZWN0IHRvIHJlYWQgYXMgc3RyaW5nXG4gKiBAcmV0dXJucyB7UHJvbWlzZS5zdHJpbmd9ICBSZXNvbHZlcyB0byBhIHN0cmluZyBjb250YWluaW5nIGZpbGUgY29udGVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlKGZpbGUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXNzZXJ0KEZpbGUsICd3aW5kb3cuRmlsZSBub3QgZGVmaW5lZC4gTXVzdCBydW4gdW5kZXIgYnJvd3Nlci4nKTtcbiAgICAgIGFzc2VydChmaWxlIGluc3RhbmNlb2YgRmlsZSwgJ3BhcmFtZXRlciBtdXN0IGJlIGEgRmlsZSBvYmplY3QnKTtcblxuICAgICAgY29uc3QgcmVhZGVyID0gbmV3IHdpbmRvdy5GaWxlUmVhZGVyKCk7XG5cbiAgICAgIHJlYWRlci5vbmVycm9yID0gZSA9PiByZWplY3QobmV3IEVycm9yKGdldEZpbGVFcnJvck1lc3NhZ2UoZSkpKTtcbiAgICAgIHJlYWRlci5vbmFib3J0ID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignUmVhZCBvcGVyYXRpb24gd2FzIGFib3J0ZWQuJykpO1xuICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG5cbiAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIE5PVEVTIE9OIEVSUk9SIEhBTkRMSU5HXG4vL1xuLy8gUHJlcGFyZWQgdG8gZXh0ZXJuYWxpemUgZXJyb3IgbWVzc2FnZSB0ZXh0c1xuLy9cbi8vIFRoZSB3ZWlyZCB0aGluZyBhYm91dCB0aGUgRmlsZVJlYWRlciBBUEkgaXMgdGhhdCB0aGUgZXJyb3IgZGVmaW5pdGlvbnNcbi8vIGFyZSBvbmx5IGF2YWlsYWJsZSBvbiB0aGUgZXJyb3IgZXZlbnQgaW5zdGFuY2UgdGhhdCBpcyBwYXNzZWQgdG8gdGhlXG4vLyBoYW5kbGVyLiBUaHVzIHdlIG5lZWQgdG8gY3JlYXRlIGRlZmluaXRpb25zIHRoYXQgYXJlIGF2aWFsYmxlIG91dHNpZGVcbi8vIHRoZSBoYW5kbGVyLlxuLy9cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9GaWxlUmVhZGVyXG4vL1xuLy8gU2lkZSBOb3RlOiBUbyBjb21wbGljYXRlIG1hdHRlcnMsIHRoZXJlIGFyZSBhbHNvIGEgRE9NRXJyb3Igc3RyaW5nIHNldCBvblxuLy8gZmlsZXJlYWRlciBvYmplY3QgKGVycm9yIHByb3BlcnR5KS4gTm90IGNsZWFyIGhvdyBvciBpZiB0aGVzZSBtYXBcbi8vIHRvIHRoZSBldmVudCBlcnJvciBjb2Rlcy4gVGhlc2Ugc3RyaW5ncyBhcmUgbm90IGN1cnJlbnRseSB1c2VkIGJ5IHRoaXMgYXBpLlxuLy9cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9ET01FcnJvclxuXG5mdW5jdGlvbiBnZXRGaWxlRXJyb3JNZXNzYWdlKGUpIHtcbiAgLy8gTWFwIGV2ZW50J3MgZXJyb3IgY29kZXMgdG8gc3RhdGljIGVycm9yIGNvZGVzIHNvIHRoYXQgd2UgY2FuXG4gIC8vIGV4dGVybmFsaXplIGVycm9yIGNvZGUgdG8gZXJyb3IgbWVzc2FnZSBtYXBwaW5nXG4gIHN3aXRjaCAoZS50YXJnZXQuZXJyb3IuY29kZSkge1xuICAgIGNhc2UgZS50YXJnZXQuZXJyb3IuTk9UX0ZPVU5EX0VSUjpcbiAgICAgIHJldHVybiAnRmlsZSBub3QgZm91bmQnO1xuICAgIGNhc2UgZS50YXJnZXQuZXJyb3IuTk9UX1JFQURBQkxFX0VSUjpcbiAgICAgIHJldHVybiAnRmlsZSBub3QgcmVhZGFibGUnO1xuICAgIGNhc2UgZS50YXJnZXQuZXJyb3IuQUJPUlRfRVJSOlxuICAgICAgcmV0dXJuICdBYm9ydGVkJztcbiAgICBjYXNlIGUudGFyZ2V0LmVycm9yLlNFQ1VSSVRZX0VSUjpcbiAgICAgIHJldHVybiAnRmlsZSBsb2NrZWQnO1xuICAgIGNhc2UgZS50YXJnZXQuZXJyb3IuRU5DT0RJTkdfRVJSOlxuICAgICAgcmV0dXJuICdGaWxlIHRvbyBsb25nJztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdSZWFkIGVycm9yJztcbiAgfVxufVxuIl19