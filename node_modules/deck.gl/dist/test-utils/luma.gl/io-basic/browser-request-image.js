'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadImage = loadImage;

var _pathPrefix = require('./path-prefix');

/* global Image */

/*
 * Loads images asynchronously
 * image.crossOrigin can be set via opts.crossOrigin, default to 'anonymous'
 * returns a promise tracking the load
 */
function loadImage(url, opts) {
  var pathPrefix = (0, _pathPrefix.getPathPrefix)();
  url = pathPrefix ? pathPrefix + url : url;

  return new Promise(function (resolve, reject) {
    try {
      var image = new Image();
      image.onload = function () {
        return resolve(image);
      };
      image.onerror = function () {
        return reject(new Error('Could not load image ' + url + '.'));
      };
      image.crossOrigin = opts && opts.crossOrigin || 'anonymous';
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvYnJvd3Nlci1yZXF1ZXN0LWltYWdlLmpzIl0sIm5hbWVzIjpbImxvYWRJbWFnZSIsInVybCIsIm9wdHMiLCJwYXRoUHJlZml4IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJpbWFnZSIsIkltYWdlIiwib25sb2FkIiwib25lcnJvciIsIkVycm9yIiwiY3Jvc3NPcmlnaW4iLCJzcmMiLCJlcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFRZ0JBLFMsR0FBQUEsUzs7QUFSaEI7O0FBQ0E7O0FBRUE7Ozs7O0FBS08sU0FBU0EsU0FBVCxDQUFtQkMsR0FBbkIsRUFBd0JDLElBQXhCLEVBQThCO0FBQ25DLE1BQU1DLGFBQWEsZ0NBQW5CO0FBQ0FGLFFBQU1FLGFBQWFBLGFBQWFGLEdBQTFCLEdBQWdDQSxHQUF0Qzs7QUFFQSxTQUFPLElBQUlHLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDdEMsUUFBSTtBQUNGLFVBQU1DLFFBQVEsSUFBSUMsS0FBSixFQUFkO0FBQ0FELFlBQU1FLE1BQU4sR0FBZTtBQUFBLGVBQU1KLFFBQVFFLEtBQVIsQ0FBTjtBQUFBLE9BQWY7QUFDQUEsWUFBTUcsT0FBTixHQUFnQjtBQUFBLGVBQU1KLE9BQU8sSUFBSUssS0FBSiwyQkFBa0NWLEdBQWxDLE9BQVAsQ0FBTjtBQUFBLE9BQWhCO0FBQ0FNLFlBQU1LLFdBQU4sR0FBcUJWLFFBQVFBLEtBQUtVLFdBQWQsSUFBOEIsV0FBbEQ7QUFDQUwsWUFBTU0sR0FBTixHQUFZWixHQUFaO0FBQ0QsS0FORCxDQU1FLE9BQU9hLEtBQVAsRUFBYztBQUNkUixhQUFPUSxLQUFQO0FBQ0Q7QUFDRixHQVZNLENBQVA7QUFXRCIsImZpbGUiOiJicm93c2VyLXJlcXVlc3QtaW1hZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2dldFBhdGhQcmVmaXh9IGZyb20gJy4vcGF0aC1wcmVmaXgnO1xuLyogZ2xvYmFsIEltYWdlICovXG5cbi8qXG4gKiBMb2FkcyBpbWFnZXMgYXN5bmNocm9ub3VzbHlcbiAqIGltYWdlLmNyb3NzT3JpZ2luIGNhbiBiZSBzZXQgdmlhIG9wdHMuY3Jvc3NPcmlnaW4sIGRlZmF1bHQgdG8gJ2Fub255bW91cydcbiAqIHJldHVybnMgYSBwcm9taXNlIHRyYWNraW5nIHRoZSBsb2FkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW1hZ2UodXJsLCBvcHRzKSB7XG4gIGNvbnN0IHBhdGhQcmVmaXggPSBnZXRQYXRoUHJlZml4KCk7XG4gIHVybCA9IHBhdGhQcmVmaXggPyBwYXRoUHJlZml4ICsgdXJsIDogdXJsO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKGltYWdlKTtcbiAgICAgIGltYWdlLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBDb3VsZCBub3QgbG9hZCBpbWFnZSAke3VybH0uYCkpO1xuICAgICAgaW1hZ2UuY3Jvc3NPcmlnaW4gPSAob3B0cyAmJiBvcHRzLmNyb3NzT3JpZ2luKSB8fCAnYW5vbnltb3VzJztcbiAgICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuIl19