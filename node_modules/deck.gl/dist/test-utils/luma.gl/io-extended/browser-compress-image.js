'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compressImage = compressImage;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Note: through adds stream support

/*
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image}  image - Image or Canvas
 * @param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 */
// Image loading/saving for browser
/* global document, HTMLCanvasElement, Image */

/* global process, Buffer */
function compressImage(image, type) {
  if (image instanceof HTMLCanvasElement) {
    var _canvas = image;
    return _canvas.toDataURL(type);
  }

  (0, _assert2.default)(image instanceof Image, 'getImageData accepts image or canvas');
  var canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  // Get raw image data
  var data = canvas.toDataURL(type || 'png').replace(/^data:image\/(png|jpg);base64,/, '');

  // Dump data into stream and return
  var result = (0, _through2.default)();
  process.nextTick(function () {
    return result.end(new Buffer(data, 'base64'));
  });
  return result;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tZXh0ZW5kZWQvYnJvd3Nlci1jb21wcmVzcy1pbWFnZS5qcyJdLCJuYW1lcyI6WyJjb21wcmVzc0ltYWdlIiwiaW1hZ2UiLCJ0eXBlIiwiSFRNTENhbnZhc0VsZW1lbnQiLCJjYW52YXMiLCJ0b0RhdGFVUkwiLCJJbWFnZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsIndpZHRoIiwiaGVpZ2h0IiwiZ2V0Q29udGV4dCIsImRyYXdJbWFnZSIsImRhdGEiLCJyZXBsYWNlIiwicmVzdWx0IiwicHJvY2VzcyIsIm5leHRUaWNrIiwiZW5kIiwiQnVmZmVyIl0sIm1hcHBpbmdzIjoiOzs7OztRQWVnQkEsYSxHQUFBQSxhOztBQVhoQjs7OztBQUNBOzs7Ozs7QUFBK0I7O0FBRS9COzs7Ozs7OztBQVBBO0FBQ0E7O0FBRUE7QUFZTyxTQUFTQSxhQUFULENBQXVCQyxLQUF2QixFQUE4QkMsSUFBOUIsRUFBb0M7QUFDekMsTUFBSUQsaUJBQWlCRSxpQkFBckIsRUFBd0M7QUFDdEMsUUFBTUMsVUFBU0gsS0FBZjtBQUNBLFdBQU9HLFFBQU9DLFNBQVAsQ0FBaUJILElBQWpCLENBQVA7QUFDRDs7QUFFRCx3QkFBT0QsaUJBQWlCSyxLQUF4QixFQUErQixzQ0FBL0I7QUFDQSxNQUFNRixTQUFTRyxTQUFTQyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUosU0FBT0ssS0FBUCxHQUFlUixNQUFNUSxLQUFyQjtBQUNBTCxTQUFPTSxNQUFQLEdBQWdCVCxNQUFNUyxNQUF0QjtBQUNBTixTQUFPTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCQyxTQUF4QixDQUFrQ1gsS0FBbEMsRUFBeUMsQ0FBekMsRUFBNEMsQ0FBNUM7O0FBRUE7QUFDQSxNQUFNWSxPQUFPVCxPQUFPQyxTQUFQLENBQWlCSCxRQUFRLEtBQXpCLEVBQWdDWSxPQUFoQyxDQUF3QyxnQ0FBeEMsRUFBMEUsRUFBMUUsQ0FBYjs7QUFFQTtBQUNBLE1BQU1DLFNBQVMsd0JBQWY7QUFDQUMsVUFBUUMsUUFBUixDQUFpQjtBQUFBLFdBQU1GLE9BQU9HLEdBQVAsQ0FBVyxJQUFJQyxNQUFKLENBQVdOLElBQVgsRUFBaUIsUUFBakIsQ0FBWCxDQUFOO0FBQUEsR0FBakI7QUFDQSxTQUFPRSxNQUFQO0FBQ0QiLCJmaWxlIjoiYnJvd3Nlci1jb21wcmVzcy1pbWFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEltYWdlIGxvYWRpbmcvc2F2aW5nIGZvciBicm93c2VyXG4vKiBnbG9iYWwgZG9jdW1lbnQsIEhUTUxDYW52YXNFbGVtZW50LCBJbWFnZSAqL1xuXG4vKiBnbG9iYWwgcHJvY2VzcywgQnVmZmVyICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgdGhyb3VnaCBmcm9tICd0aHJvdWdoJzsgLy8gTm90ZTogdGhyb3VnaCBhZGRzIHN0cmVhbSBzdXBwb3J0XG5cbi8qXG4gKiBSZXR1cm5zIGRhdGEgYnl0ZXMgcmVwcmVzZW50aW5nIGEgY29tcHJlc3NlZCBpbWFnZSBpbiBQTkcgb3IgSlBHIGZvcm1hdCxcbiAqIFRoaXMgZGF0YSBjYW4gYmUgc2F2ZWQgdXNpbmcgZmlsZSBzeXN0ZW0gKGYpIG1ldGhvZHMgb3JcbiAqIHVzZWQgaW4gYSByZXF1ZXN0LlxuICogQHBhcmFtIHtJbWFnZX0gIGltYWdlIC0gSW1hZ2Ugb3IgQ2FudmFzXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0LnR5cGU9J3BuZycgLSBwbmcsIGpwZyBvciBpbWFnZS9wbmcsIGltYWdlL2pwZyBhcmUgdmFsaWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHQuZGF0YVVSST0gLSBXaGV0aGVyIHRvIGluY2x1ZGUgYSBkYXRhIFVSSSBoZWFkZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXByZXNzSW1hZ2UoaW1hZ2UsIHR5cGUpIHtcbiAgaWYgKGltYWdlIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICBjb25zdCBjYW52YXMgPSBpbWFnZTtcbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCh0eXBlKTtcbiAgfVxuXG4gIGFzc2VydChpbWFnZSBpbnN0YW5jZW9mIEltYWdlLCAnZ2V0SW1hZ2VEYXRhIGFjY2VwdHMgaW1hZ2Ugb3IgY2FudmFzJyk7XG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcblxuICAvLyBHZXQgcmF3IGltYWdlIGRhdGFcbiAgY29uc3QgZGF0YSA9IGNhbnZhcy50b0RhdGFVUkwodHlwZSB8fCAncG5nJykucmVwbGFjZSgvXmRhdGE6aW1hZ2VcXC8ocG5nfGpwZyk7YmFzZTY0LC8sICcnKTtcblxuICAvLyBEdW1wIGRhdGEgaW50byBzdHJlYW0gYW5kIHJldHVyblxuICBjb25zdCByZXN1bHQgPSB0aHJvdWdoKCk7XG4gIHByb2Nlc3MubmV4dFRpY2soKCkgPT4gcmVzdWx0LmVuZChuZXcgQnVmZmVyKGRhdGEsICdiYXNlNjQnKSkpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuIl19