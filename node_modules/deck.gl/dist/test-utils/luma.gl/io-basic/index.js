'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseModel = exports.loadModel = exports.loadProgram = exports.loadTextures = exports.loadImages = exports.loadFiles = exports.setPathPrefix = undefined;

var _setPathPrefix = require('./set-path-prefix');

Object.defineProperty(exports, 'setPathPrefix', {
  enumerable: true,
  get: function get() {
    return _setPathPrefix.setPathPrefix;
  }
});

var _loadFiles = require('./load-files');

Object.defineProperty(exports, 'loadFiles', {
  enumerable: true,
  get: function get() {
    return _loadFiles.loadFiles;
  }
});
Object.defineProperty(exports, 'loadImages', {
  enumerable: true,
  get: function get() {
    return _loadFiles.loadImages;
  }
});

var _loadTextures = require('./load-textures');

Object.defineProperty(exports, 'loadTextures', {
  enumerable: true,
  get: function get() {
    return _loadTextures.loadTextures;
  }
});
Object.defineProperty(exports, 'loadProgram', {
  enumerable: true,
  get: function get() {
    return _loadTextures.loadProgram;
  }
});

var _jsonLoader = require('./json-loader');

Object.defineProperty(exports, 'loadModel', {
  enumerable: true,
  get: function get() {
    return _jsonLoader.loadModel;
  }
});
Object.defineProperty(exports, 'parseModel', {
  enumerable: true,
  get: function get() {
    return _jsonLoader.parseModel;
  }
});

var _globals = require('../utils/globals');

// Call a require based helper to select platform to export
if (_globals.isBrowser) {
  module.exports.loadFile = require('browser-request-file');
  module.exports.loadImage = require('browser-request-image');
  module.exports.readFile = require('browser-read-file');
} else {
  var fs = module.require('fs');
  // TODO - needs to be promisified...
  module.exports.readFile = fs && fs.readFile;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvaW5kZXguanMiXSwibmFtZXMiOlsic2V0UGF0aFByZWZpeCIsImxvYWRGaWxlcyIsImxvYWRJbWFnZXMiLCJsb2FkVGV4dHVyZXMiLCJsb2FkUHJvZ3JhbSIsImxvYWRNb2RlbCIsInBhcnNlTW9kZWwiLCJtb2R1bGUiLCJleHBvcnRzIiwibG9hZEZpbGUiLCJyZXF1aXJlIiwibG9hZEltYWdlIiwicmVhZEZpbGUiLCJmcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OzBCQUNRQSxhOzs7Ozs7Ozs7c0JBYUFDLFM7Ozs7OztzQkFBV0MsVTs7Ozs7Ozs7O3lCQUNYQyxZOzs7Ozs7eUJBQWNDLFc7Ozs7Ozs7Ozt1QkFDZEMsUzs7Ozs7O3VCQUFXQyxVOzs7O0FBaEJuQjs7QUFHQTtBQUNBLHdCQUFlO0FBQ2JDLFNBQU9DLE9BQVAsQ0FBZUMsUUFBZixHQUEwQkMsUUFBUSxzQkFBUixDQUExQjtBQUNBSCxTQUFPQyxPQUFQLENBQWVHLFNBQWYsR0FBMkJELFFBQVEsdUJBQVIsQ0FBM0I7QUFDQUgsU0FBT0MsT0FBUCxDQUFlSSxRQUFmLEdBQTBCRixRQUFRLG1CQUFSLENBQTFCO0FBQ0QsQ0FKRCxNQUlPO0FBQ0wsTUFBTUcsS0FBS04sT0FBT0csT0FBUCxDQUFlLElBQWYsQ0FBWDtBQUNBO0FBQ0FILFNBQU9DLE9BQVAsQ0FBZUksUUFBZixHQUEwQkMsTUFBTUEsR0FBR0QsUUFBbkM7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7aXNCcm93c2VyfSBmcm9tICcuLi91dGlscy9nbG9iYWxzJztcbmV4cG9ydCB7c2V0UGF0aFByZWZpeH0gZnJvbSAnLi9zZXQtcGF0aC1wcmVmaXgnO1xuXG4vLyBDYWxsIGEgcmVxdWlyZSBiYXNlZCBoZWxwZXIgdG8gc2VsZWN0IHBsYXRmb3JtIHRvIGV4cG9ydFxuaWYgKGlzQnJvd3Nlcikge1xuICBtb2R1bGUuZXhwb3J0cy5sb2FkRmlsZSA9IHJlcXVpcmUoJ2Jyb3dzZXItcmVxdWVzdC1maWxlJyk7XG4gIG1vZHVsZS5leHBvcnRzLmxvYWRJbWFnZSA9IHJlcXVpcmUoJ2Jyb3dzZXItcmVxdWVzdC1pbWFnZScpO1xuICBtb2R1bGUuZXhwb3J0cy5yZWFkRmlsZSA9IHJlcXVpcmUoJ2Jyb3dzZXItcmVhZC1maWxlJyk7XG59IGVsc2Uge1xuICBjb25zdCBmcyA9IG1vZHVsZS5yZXF1aXJlKCdmcycpO1xuICAvLyBUT0RPIC0gbmVlZHMgdG8gYmUgcHJvbWlzaWZpZWQuLi5cbiAgbW9kdWxlLmV4cG9ydHMucmVhZEZpbGUgPSBmcyAmJiBmcy5yZWFkRmlsZTtcbn1cblxuZXhwb3J0IHtsb2FkRmlsZXMsIGxvYWRJbWFnZXN9IGZyb20gJy4vbG9hZC1maWxlcyc7XG5leHBvcnQge2xvYWRUZXh0dXJlcywgbG9hZFByb2dyYW19IGZyb20gJy4vbG9hZC10ZXh0dXJlcyc7XG5leHBvcnQge2xvYWRNb2RlbCwgcGFyc2VNb2RlbH0gZnJvbSAnLi9qc29uLWxvYWRlcic7XG4iXX0=