'use strict';

require('../../../src/headless');

var _io = require('../../../src/io');

var _setup = require('../../setup');

var _setup2 = _interopRequireDefault(_setup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable quotes */
var PNG_BITS = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=';
/* eslint-enable quotes */

var DATA_URL = 'data:image/png;base64,' + PNG_BITS;

(0, _setup2.default)('io#read-image', function (t) {
  (0, _io.loadImage)(DATA_URL).then(function (image) {
    t.equals(image.width, 2, 'width');
    t.equals(image.height, 2, 'height');
    t.end();
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvdGVzdC9yZWFkLWltYWdlLnNwZWMuanMiXSwibmFtZXMiOlsiUE5HX0JJVFMiLCJEQVRBX1VSTCIsInRoZW4iLCJ0IiwiZXF1YWxzIiwiaW1hZ2UiLCJ3aWR0aCIsImhlaWdodCIsImVuZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUE7QUFDQSxJQUFNQSxxSEFBTjtBQUdBOztBQUVBLElBQU1DLHNDQUFvQ0QsUUFBMUM7O0FBRUEscUJBQUssZUFBTCxFQUFzQixhQUFLO0FBQ3pCLHFCQUFVQyxRQUFWLEVBQW9CQyxJQUFwQixDQUF5QixpQkFBUztBQUNoQ0MsTUFBRUMsTUFBRixDQUFTQyxNQUFNQyxLQUFmLEVBQXNCLENBQXRCLEVBQXlCLE9BQXpCO0FBQ0FILE1BQUVDLE1BQUYsQ0FBU0MsTUFBTUUsTUFBZixFQUF1QixDQUF2QixFQUEwQixRQUExQjtBQUNBSixNQUFFSyxHQUFGO0FBQ0QsR0FKRDtBQUtELENBTkQiLCJmaWxlIjoicmVhZC1pbWFnZS5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuLi8uLi8uLi9zcmMvaGVhZGxlc3MnO1xuaW1wb3J0IHtsb2FkSW1hZ2V9IGZyb20gJy4uLy4uLy4uL3NyYy9pbyc7XG5pbXBvcnQgdGVzdCBmcm9tICcuLi8uLi9zZXR1cCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIHF1b3RlcyAqL1xuY29uc3QgUE5HX0JJVFMgPSBgXFxcbmlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBSUFBQUFDQ0FZQUFBQnl0ZzBrQUFBQUZFbEVRVlFJVzJQOHpcXFxuL0QvUHdNREF3TWpqQUVBUU93Ri9XMURwNTRBQUFBQVNVVk9SSzVDWUlJPWA7XG4vKiBlc2xpbnQtZW5hYmxlIHF1b3RlcyAqL1xuXG5jb25zdCBEQVRBX1VSTCA9IGBkYXRhOmltYWdlL3BuZztiYXNlNjQsJHtQTkdfQklUU31gO1xuXG50ZXN0KCdpbyNyZWFkLWltYWdlJywgdCA9PiB7XG4gIGxvYWRJbWFnZShEQVRBX1VSTCkudGhlbihpbWFnZSA9PiB7XG4gICAgdC5lcXVhbHMoaW1hZ2Uud2lkdGgsIDIsICd3aWR0aCcpO1xuICAgIHQuZXF1YWxzKGltYWdlLmhlaWdodCwgMiwgJ2hlaWdodCcpO1xuICAgIHQuZW5kKCk7XG4gIH0pO1xufSk7XG4iXX0=