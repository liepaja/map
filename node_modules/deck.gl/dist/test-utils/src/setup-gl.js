'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _luma = require('luma.gl');

var _headless = require('../luma.gl/headless');

var _headless2 = _interopRequireDefault(_headless);

var _globals = require('../luma.gl/utils/globals');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _luma.setContextDefaults)({
  width: 1,
  height: 1,
  debug: true
  // throwOnFailure: false,
  // throwOnError: false
});

_globals.global.glContext = _globals.global.glContext || (0, _luma.createGLContext)() ||
// TODO - Seems to be an issue in luma.gl
_headless2.default && (0, _headless2.default)(100, 100, {});
// console.log('Context', global.glContext);

exports.default = _globals.global.glContext;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL3NyYy9zZXR1cC1nbC5qcyJdLCJuYW1lcyI6WyJ3aWR0aCIsImhlaWdodCIsImRlYnVnIiwiZ2xDb250ZXh0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFFQTs7OztBQUNBOzs7O0FBRUEsOEJBQW1CO0FBQ2pCQSxTQUFPLENBRFU7QUFFakJDLFVBQVEsQ0FGUztBQUdqQkMsU0FBTztBQUNQO0FBQ0E7QUFMaUIsQ0FBbkI7O0FBUUEsZ0JBQU9DLFNBQVAsR0FDRSxnQkFBT0EsU0FBUCxJQUNBLDRCQURBO0FBRUE7QUFDQyxzQkFBaUIsd0JBQWMsR0FBZCxFQUFtQixHQUFuQixFQUF3QixFQUF4QixDQUpwQjtBQUtBOztrQkFFZSxnQkFBT0EsUyIsImZpbGUiOiJzZXR1cC1nbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7c2V0Q29udGV4dERlZmF1bHRzfSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCB7Y3JlYXRlR0xDb250ZXh0fSBmcm9tICdsdW1hLmdsJztcbmltcG9ydCBjcmVhdGVDb250ZXh0IGZyb20gJy4uL2x1bWEuZ2wvaGVhZGxlc3MnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL2x1bWEuZ2wvdXRpbHMvZ2xvYmFscyc7XG5cbnNldENvbnRleHREZWZhdWx0cyh7XG4gIHdpZHRoOiAxLFxuICBoZWlnaHQ6IDEsXG4gIGRlYnVnOiB0cnVlXG4gIC8vIHRocm93T25GYWlsdXJlOiBmYWxzZSxcbiAgLy8gdGhyb3dPbkVycm9yOiBmYWxzZVxufSk7XG5cbmdsb2JhbC5nbENvbnRleHQgPVxuICBnbG9iYWwuZ2xDb250ZXh0IHx8XG4gIGNyZWF0ZUdMQ29udGV4dCgpIHx8XG4gIC8vIFRPRE8gLSBTZWVtcyB0byBiZSBhbiBpc3N1ZSBpbiBsdW1hLmdsXG4gIChjcmVhdGVDb250ZXh0ICYmIGNyZWF0ZUNvbnRleHQoMTAwLCAxMDAsIHt9KSk7XG4vLyBjb25zb2xlLmxvZygnQ29udGV4dCcsIGdsb2JhbC5nbENvbnRleHQpO1xuXG5leHBvcnQgZGVmYXVsdCBnbG9iYWwuZ2xDb250ZXh0O1xuIl19