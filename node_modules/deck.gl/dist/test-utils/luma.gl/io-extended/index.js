'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fs = exports.loadFile = undefined;

var _browserImageIo = require('./browser-image-io');

Object.keys(_browserImageIo).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _browserImageIo[key];
    }
  });
});

var _browserRequest = require('./browser-request');

Object.defineProperty(exports, 'loadFile', {
  enumerable: true,
  get: function get() {
    return _browserRequest.loadFile;
  }
});

var _browserFs = require('./browser-fs');

var fs = _interopRequireWildcard(_browserFs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.fs = fs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tZXh0ZW5kZWQvaW5kZXguanMiXSwibmFtZXMiOlsibG9hZEZpbGUiLCJmcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7Ozs7OzJCQUVRQSxROzs7O0FBRVI7O0lBQVlDLEU7Ozs7UUFDSkEsRSxHQUFBQSxFIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSAnLi9icm93c2VyLWltYWdlLWlvJztcblxuZXhwb3J0IHtsb2FkRmlsZX0gZnJvbSAnLi9icm93c2VyLXJlcXVlc3QnO1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICcuL2Jyb3dzZXItZnMnO1xuZXhwb3J0IHtmc307XG4iXX0=