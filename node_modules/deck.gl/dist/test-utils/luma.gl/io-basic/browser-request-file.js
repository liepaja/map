'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.loadFile = loadFile;
exports.requestFile = requestFile;

var _pathPrefix = require('./path-prefix');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function loadFile(url, opts) {
  if (typeof url !== 'string' && !opts) {
    // TODO - warn for deprecated mode
    opts = url;
    url = opts.url;
  }
  var pathPrefix = (0, _pathPrefix.getPathPrefix)();
  opts.url = pathPrefix ? pathPrefix + url : url;
  return requestFile(opts);
}

// Supports loading (requesting) assets with XHR (XmlHttpRequest)
/* eslint-disable guard-for-in, complexity, no-try-catch */

/* global XMLHttpRequest */
function noop() {}

var XHR_STATES = {
  UNINITIALIZED: 0,
  LOADING: 1,
  LOADED: 2,
  INTERACTIVE: 3,
  COMPLETED: 4
};

var XHR = function () {
  function XHR(_ref) {
    var url = _ref.url,
        _ref$path = _ref.path,
        path = _ref$path === undefined ? null : _ref$path,
        _ref$method = _ref.method,
        method = _ref$method === undefined ? 'GET' : _ref$method,
        _ref$asynchronous = _ref.asynchronous,
        asynchronous = _ref$asynchronous === undefined ? true : _ref$asynchronous,
        _ref$noCache = _ref.noCache,
        noCache = _ref$noCache === undefined ? false : _ref$noCache,
        _ref$sendAsBinary = _ref.sendAsBinary,
        sendAsBinary = _ref$sendAsBinary === undefined ? false : _ref$sendAsBinary,
        _ref$responseType = _ref.responseType,
        responseType = _ref$responseType === undefined ? false : _ref$responseType,
        _ref$onProgress = _ref.onProgress,
        onProgress = _ref$onProgress === undefined ? noop : _ref$onProgress,
        _ref$onError = _ref.onError,
        onError = _ref$onError === undefined ? noop : _ref$onError,
        _ref$onAbort = _ref.onAbort,
        onAbort = _ref$onAbort === undefined ? noop : _ref$onAbort,
        _ref$onComplete = _ref.onComplete,
        onComplete = _ref$onComplete === undefined ? noop : _ref$onComplete;

    _classCallCheck(this, XHR);

    this.url = path ? path.join(path, url) : url;
    this.method = method;
    this.async = asynchronous;
    this.noCache = noCache;
    this.sendAsBinary = sendAsBinary;
    this.responseType = responseType;

    this.req = new XMLHttpRequest();

    this.req.onload = function (e) {
      return onComplete(e);
    };
    this.req.onerror = function (e) {
      return onError(e);
    };
    this.req.onabort = function (e) {
      return onAbort(e);
    };
    this.req.onprogress = function (e) {
      if (e.lengthComputable) {
        onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        onProgress(e, -1);
      }
    };
  }

  _createClass(XHR, [{
    key: 'setRequestHeader',
    value: function setRequestHeader(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    }

    // /* eslint-disable max-statements */

  }, {
    key: 'sendAsync',
    value: function sendAsync() {
      var _this = this;

      var body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.body || null;

      return new Promise(function (resolve, reject) {
        try {
          var req = _this.req,
              method = _this.method,
              noCache = _this.noCache,
              sendAsBinary = _this.sendAsBinary,
              responseType = _this.responseType;


          var url = noCache ? _this.url + (_this.url.indexOf('?') >= 0 ? '&' : '?') + Date.now() : _this.url;

          req.open(method, url, _this.async);

          if (responseType) {
            req.responseType = responseType;
          }

          if (_this.async) {
            req.onreadystatechange = function (e) {
              if (req.readyState === XHR_STATES.COMPLETED) {
                if (req.status === 200) {
                  resolve(req.responseType ? req.response : req.responseText);
                } else {
                  reject(new Error(req.status + ': ' + url));
                }
              }
            };
          }

          if (sendAsBinary) {
            req.sendAsBinary(body);
          } else {
            req.send(body);
          }

          if (!_this.async) {
            if (req.status === 200) {
              resolve(req.responseType ? req.response : req.responseText);
            } else {
              reject(new Error(req.status + ': ' + url));
            }
          }
        } catch (error) {
          reject(error);
        }
      });
    }
    /* eslint-enable max-statements */

  }]);

  return XHR;
}();

function requestFile(opts) {
  var xhr = new XHR(opts);
  return xhr.sendAsync();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvaW8tYmFzaWMvYnJvd3Nlci1yZXF1ZXN0LWZpbGUuanMiXSwibmFtZXMiOlsibG9hZEZpbGUiLCJyZXF1ZXN0RmlsZSIsInVybCIsIm9wdHMiLCJwYXRoUHJlZml4Iiwibm9vcCIsIlhIUl9TVEFURVMiLCJVTklOSVRJQUxJWkVEIiwiTE9BRElORyIsIkxPQURFRCIsIklOVEVSQUNUSVZFIiwiQ09NUExFVEVEIiwiWEhSIiwicGF0aCIsIm1ldGhvZCIsImFzeW5jaHJvbm91cyIsIm5vQ2FjaGUiLCJzZW5kQXNCaW5hcnkiLCJyZXNwb25zZVR5cGUiLCJvblByb2dyZXNzIiwib25FcnJvciIsIm9uQWJvcnQiLCJvbkNvbXBsZXRlIiwiam9pbiIsImFzeW5jIiwicmVxIiwiWE1MSHR0cFJlcXVlc3QiLCJvbmxvYWQiLCJlIiwib25lcnJvciIsIm9uYWJvcnQiLCJvbnByb2dyZXNzIiwibGVuZ3RoQ29tcHV0YWJsZSIsIk1hdGgiLCJyb3VuZCIsImxvYWRlZCIsInRvdGFsIiwiaGVhZGVyIiwidmFsdWUiLCJzZXRSZXF1ZXN0SGVhZGVyIiwiYm9keSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiaW5kZXhPZiIsIkRhdGUiLCJub3ciLCJvcGVuIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsInJlc3BvbnNlIiwicmVzcG9uc2VUZXh0IiwiRXJyb3IiLCJzZW5kIiwiZXJyb3IiLCJ4aHIiLCJzZW5kQXN5bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1FBRWdCQSxRLEdBQUFBLFE7UUFtSEFDLFcsR0FBQUEsVzs7QUFySGhCOzs7O0FBRU8sU0FBU0QsUUFBVCxDQUFrQkUsR0FBbEIsRUFBdUJDLElBQXZCLEVBQTZCO0FBQ2xDLE1BQUksT0FBT0QsR0FBUCxLQUFlLFFBQWYsSUFBMkIsQ0FBQ0MsSUFBaEMsRUFBc0M7QUFDcEM7QUFDQUEsV0FBT0QsR0FBUDtB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QUFrQzFCLElBQUkyQixZQUE5QztBQUNELGFBRkQsTUFFTztBQUNMVCxxQkFBTyxJQUFJVSxLQUFKLENBQWE1QixJQUFJeUIsTUFBakIsVUFBNEJoRCxHQUE1QixDQUFQO0FBQ0Q7QUFDRjtBQUNGLFNBdENELENBc0NFLE9BQU9xRCxLQUFQLEVBQWM7QUFDZFosaUJBQU9ZLEtBQVA7QUFDRDtBQUNGLE9BMUNNLENBQVA7QUEyQ0Q7QUFDRDs7Ozs7OztBQUdLLFNBQVN0RCxXQUFULENBQXFCRSxJQUFyQixFQUEyQjtBQUNoQyxNQUFNcUQsTUFBTSxJQUFJNUMsR0FBSixDQUFRVCxJQUFSLENBQVo7QUFDQSxTQUFPcUQsSUFBSUMsU0FBSixFQUFQO0FBQ0QiLCJmaWxlIjoiYnJvd3Nlci1yZXF1ZXN0LWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2dldFBhdGhQcmVmaXh9IGZyb20gJy4vcGF0aC1wcmVmaXgnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEZpbGUodXJsLCBvcHRzKSB7XG4gIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJyAmJiAhb3B0cykge1xuICAgIC8vIFRPRE8gLSB3YXJuIGZvciBkZXByZWNhdGVkIG1vZGVcbiAgICBvcHRzID0gdXJsO1xuICAgIHVybCA9IG9wdHMudXJsO1xuICB9XG4gIGNvbnN0IHBhdGhQcmVmaXggPSBnZXRQYXRoUHJlZml4KCk7XG4gIG9wdHMudXJsID0gcGF0aFByZWZpeCA/IHBhdGhQcmVmaXggKyB1cmwgOiB1cmw7XG4gIHJldHVybiByZXF1ZXN0RmlsZShvcHRzKTtcbn1cblxuLy8gU3VwcG9ydHMgbG9hZGluZyAocmVxdWVzdGluZykgYXNzZXRzIHdpdGggWEhSIChYbWxIdHRwUmVxdWVzdClcbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiwgY29tcGxleGl0eSwgbm8tdHJ5LWNhdGNoICovXG5cbi8qIGdsb2JhbCBYTUxIdHRwUmVxdWVzdCAqL1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmNvbnN0IFhIUl9TVEFURVMgPSB7XG4gIFVOSU5JVElBTElaRUQ6IDAsXG4gIExPQURJTkc6IDEsXG4gIExPQURFRDogMixcbiAgSU5URVJBQ1RJVkU6IDMsXG4gIENPTVBMRVRFRDogNFxufTtcblxuY2xhc3MgWEhSIHtcbiAgY29uc3RydWN0b3Ioe1xuICAgIHVybCxcbiAgICBwYXRoID0gbnVsbCxcbiAgICBtZXRob2QgPSAnR0VUJyxcbiAgICBhc3luY2hyb25vdXMgPSB0cnVlLFxuICAgIG5vQ2FjaGUgPSBmYWxzZSxcbiAgICAvLyBib2R5ID0gbnVsbCxcbiAgICBzZW5kQXNCaW5hcnkgPSBmYWxzZSxcbiAgICByZXNwb25zZVR5cGUgPSBmYWxzZSxcbiAgICBvblByb2dyZXNzID0gbm9vcCxcbiAgICBvbkVycm9yID0gbm9vcCxcbiAgICBvbkFib3J0ID0gbm9vcCxcbiAgICBvbkNvbXBsZXRlID0gbm9vcFxuICB9KSB7XG4gICAgdGhpcy51cmwgPSBwYXRoID8gcGF0aC5qb2luKHBhdGgsIHVybCkgOiB1cmw7XG4gICAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gICAgdGhpcy5hc3luYyA9IGFzeW5jaHJvbm91cztcbiAgICB0aGlzLm5vQ2FjaGUgPSBub0NhY2hlO1xuICAgIHRoaXMuc2VuZEFzQmluYXJ5ID0gc2VuZEFzQmluYXJ5O1xuICAgIHRoaXMucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlO1xuXG4gICAgdGhpcy5yZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHRoaXMucmVxLm9ubG9hZCA9IGUgPT4gb25Db21wbGV0ZShlKTtcbiAgICB0aGlzLnJlcS5vbmVycm9yID0gZSA9PiBvbkVycm9yKGUpO1xuICAgIHRoaXMucmVxLm9uYWJvcnQgPSBlID0+IG9uQWJvcnQoZSk7XG4gICAgdGhpcy5yZXEub25wcm9ncmVzcyA9IGUgPT4ge1xuICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICBvblByb2dyZXNzKGUsIE1hdGgucm91bmQoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvblByb2dyZXNzKGUsIC0xKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5yZXEuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHNlbmRBc3luYyhib2R5ID0gdGhpcy5ib2R5IHx8IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qge3JlcSwgbWV0aG9kLCBub0NhY2hlLCBzZW5kQXNCaW5hcnksIHJlc3BvbnNlVHlwZX0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IG5vQ2FjaGVcbiAgICAgICAgICA/IHRoaXMudXJsICsgKHRoaXMudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIERhdGUubm93KClcbiAgICAgICAgICA6IHRoaXMudXJsO1xuXG4gICAgICAgIHJlcS5vcGVuKG1ldGhvZCwgdXJsLCB0aGlzLmFzeW5jKTtcblxuICAgICAgICBpZiAocmVzcG9uc2VUeXBlKSB7XG4gICAgICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IHJlc3BvbnNlVHlwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmFzeW5jKSB7XG4gICAgICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFJfU1RBVEVTLkNPTVBMRVRFRCkge1xuICAgICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgJHtyZXEuc3RhdHVzfTogJHt1cmx9YCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZW5kQXNCaW5hcnkpIHtcbiAgICAgICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcS5zZW5kKGJvZHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmFzeW5jKSB7XG4gICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYCR7cmVxLnN0YXR1c306ICR7dXJsfWApKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWVzdEZpbGUob3B0cykge1xuICBjb25zdCB4aHIgPSBuZXcgWEhSKG9wdHMpO1xuICByZXR1cm4geGhyLnNlbmRBc3luYygpO1xufVxuIl19