'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = makeSpy;
// Inspired by https://github.com/popomore/spy
// Attach a spy to the function. The spy has the following methods and fields
//  * restore() - remove spy completely
//  * reset() - reset call count
//  * callCount - number of calls
//  * called - whether spy was called
function makeSpy(obj, func) {
  var methodName = void 0;

  if (!obj && !func) {
    func = function mock() {};
    obj = {};
    methodName = 'spy';
  } else if (typeof obj === 'function' && !func) {
    func = obj;
    obj = {};
    methodName = func.name + '-spy';
  } else {
    methodName = func;
    func = obj[methodName];
  }

  // will not wrap more than once
  if (func.func !== undefined) {
    return func;
  }

  function spy() {
    spy.callCount++;
    spy.called = true;
    /* eslint-disable no-invalid-this */

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return func.apply(this, args);
  }

  spy.reset = function () {
    spy.callCount = 0;
    spy.called = false;
  };

  spy.restore = function () {
    obj[methodName] = func;
  };

  spy.obj = obj;
  spy.methodName = methodName;
  spy.func = func;
  spy.method = func;

  spy.reset();

  obj[methodName] = spy;
  return spy;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL3NyYy9zcHkuanMiXSwibmFtZXMiOlsibWFrZVNweSIsIm9iaiIsImZ1bmMiLCJtZXRob2ROYW1lIiwibW9jayIsIm5hbWUiLCJ1bmRlZmluZWQiLCJzcHkiLCJjYWxsQ291bnQiLCJjYWxsZWQiLCJhcmdzIiwiYXBwbHkiLCJyZXNldCIsInJlc3RvcmUiLCJtZXRob2QiXSwibWFwcGluZ3MiOiI7Ozs7O2tCQU13QkEsTztBQU54QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDZSxTQUFTQSxPQUFULENBQWlCQyxHQUFqQixFQUFzQkMsSUFBdEIsRUFBNEI7QUFDekMsTUFBSUMsbUJBQUo7O0FBRUEsTUFBSSxDQUFDRixHQUFELElBQVEsQ0FBQ0MsSUFBYixFQUFtQjtBQUNqQkEsV0FBTyxTQUFTRSxJQUFULEdBQWdCLENBQUUsQ0FBekI7QUFDQUgsVUFBTSxFQUFOO0FBQ0FFLGlCQUFhLEtBQWI7QUFDRCxHQUpELE1BSU8sSUFBSSxPQUFPRixHQUFQLEtBQWUsVUFBZixJQUE2QixDQUFDQyxJQUFsQyxFQUF3QztBQUM3Q0EsV0FBT0QsR0FBUDtBQUNBQSxVQUFNLEVBQU47QUFDQUUsaUJBQWdCRCxLQUFLRyxJQUFyQjtBQUNELEdBSk0sTUFJQTtBQUNMRixpQkFBYUQsSUFBYjtBQUNBQSxXQUFPRCxJQUFJRSxVQUFKLENBQVA7QUFDRDs7QUFFRDtBQUNBLE1BQUlELEtBQUtBLElBQUwsS0FBY0ksU0FBbEIsRUFBNkI7QUFDM0IsV0FBT0osSUFBUDtBQUNEOztBQUVELFdBQVNLLEdBQVQsR0FBc0I7QUFDcEJBLFFBQUlDLFNBQUo7QUFDQUQsUUFBSUUsTUFBSixHQUFhLElBQWI7QUFDQTs7QUFIb0Isc0NBQU5DLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUlwQixXQUFPUixLQUFLUyxLQUFMLENBQVcsSUFBWCxFQUFpQkQsSUFBakIsQ0FBUDtBQUNEOztBQUVESCxNQUFJSyxLQUFKLEdBQVksWUFBTTtBQUNoQkwsUUFBSUMsU0FBSixHQUFnQixDQUFoQjtBQUNBRCxRQUFJRSxNQUFKLEdBQWEsS0FBYjtBQUNELEdBSEQ7O0FBS0FGLE1BQUlNLE9BQUosR0FBYyxZQUFNO0FBQ2xCWixRQUFJRSxVQUFKLElBQWtCRCxJQUFsQjtBQUNELEdBRkQ7O0FBSUFLLE1BQUlOLEdBQUosR0FBVUEsR0FBVjtBQUNBTSxNQUFJSixVQUFKLEdBQWlCQSxVQUFqQjtBQUNBSSxNQUFJTCxJQUFKLEdBQVdBLElBQVg7QUFDQUssTUFBSU8sTUFBSixHQUFhWixJQUFiOztBQUVBSyxNQUFJSyxLQUFKOztBQUVBWCxNQUFJRSxVQUFKLElBQWtCSSxHQUFsQjtBQUNBLFNBQU9BLEdBQVA7QUFDRCIsImZpbGUiOiJzcHkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vcG9wb21vcmUvc3B5XG4vLyBBdHRhY2ggYSBzcHkgdG8gdGhlIGZ1bmN0aW9uLiBUaGUgc3B5IGhhcyB0aGUgZm9sbG93aW5nIG1ldGhvZHMgYW5kIGZpZWxkc1xuLy8gICogcmVzdG9yZSgpIC0gcmVtb3ZlIHNweSBjb21wbGV0ZWx5XG4vLyAgKiByZXNldCgpIC0gcmVzZXQgY2FsbCBjb3VudFxuLy8gICogY2FsbENvdW50IC0gbnVtYmVyIG9mIGNhbGxzXG4vLyAgKiBjYWxsZWQgLSB3aGV0aGVyIHNweSB3YXMgY2FsbGVkXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYWtlU3B5KG9iaiwgZnVuYykge1xuICBsZXQgbWV0aG9kTmFtZTtcblxuICBpZiAoIW9iaiAmJiAhZnVuYykge1xuICAgIGZ1bmMgPSBmdW5jdGlvbiBtb2NrKCkge307XG4gICAgb2JqID0ge307XG4gICAgbWV0aG9kTmFtZSA9ICdzcHknO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgJiYgIWZ1bmMpIHtcbiAgICBmdW5jID0gb2JqO1xuICAgIG9iaiA9IHt9O1xuICAgIG1ldGhvZE5hbWUgPSBgJHtmdW5jLm5hbWV9LXNweWA7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kTmFtZSA9IGZ1bmM7XG4gICAgZnVuYyA9IG9ialttZXRob2ROYW1lXTtcbiAgfVxuXG4gIC8vIHdpbGwgbm90IHdyYXAgbW9yZSB0aGFuIG9uY2VcbiAgaWYgKGZ1bmMuZnVuYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cblxuICBmdW5jdGlvbiBzcHkoLi4uYXJncykge1xuICAgIHNweS5jYWxsQ291bnQrKztcbiAgICBzcHkuY2FsbGVkID0gdHJ1ZTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cbiAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHNweS5yZXNldCA9ICgpID0+IHtcbiAgICBzcHkuY2FsbENvdW50ID0gMDtcbiAgICBzcHkuY2FsbGVkID0gZmFsc2U7XG4gIH07XG5cbiAgc3B5LnJlc3RvcmUgPSAoKSA9PiB7XG4gICAgb2JqW21ldGhvZE5hbWVdID0gZnVuYztcbiAgfTtcblxuICBzcHkub2JqID0gb2JqO1xuICBzcHkubWV0aG9kTmFtZSA9IG1ldGhvZE5hbWU7XG4gIHNweS5mdW5jID0gZnVuYztcbiAgc3B5Lm1ldGhvZCA9IGZ1bmM7XG5cbiAgc3B5LnJlc2V0KCk7XG5cbiAgb2JqW21ldGhvZE5hbWVdID0gc3B5O1xuICByZXR1cm4gc3B5O1xufVxuIl19