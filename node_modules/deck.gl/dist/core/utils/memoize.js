"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = memoize;
function isEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a)) {
    // Special treatment for arrays: compare 1-level deep
    // This is to support equality of matrix/coordinate props
    var len = a.length;
    if (!b || b.length !== len) {
      return false;
    }

    for (var i = 0; i < len; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Speed up consecutive function calls by caching the result of calls with identical input
 * https://en.wikipedia.org/wiki/Memoization
 * @param {function} compute - the function to be memoized
 */
function memoize(compute) {
  var cachedArgs = {};
  var cachedResult = void 0;

  return function (args) {
    for (var key in args) {
      if (!isEqual(args[key], cachedArgs[key])) {
        cachedResult = compute(args);
        cachedArgs = args;
        break;
      }
    }
    return cachedResult;
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL3V0aWxzL21lbW9pemUuanMiXSwibmFtZXMiOlsibWVtb2l6ZSIsImlzRXF1YWwiLCJhIiwiYiIsIkFycmF5IiwiaXNBcnJheSIsImxlbiIsImxlbmd0aCIsImkiLCJjb21wdXRlIiwiY2FjaGVkQXJncyIsImNhY2hlZFJlc3VsdCIsImtleSIsImFyZ3MiXSwibWFwcGluZ3MiOiI7Ozs7O2tCQTJCd0JBLE87QUEzQnhCLFNBQVNDLE9BQVQsQ0FBaUJDLENBQWpCLEVBQW9CQyxDQUFwQixFQUF1QjtBQUNyQixNQUFJRCxNQUFNQyxDQUFWLEVBQWE7QUFDWCxXQUFPLElBQVA7QUFDRDtBQUNELE1BQUlDLE1BQU1DLE9BQU4sQ0FBY0gsQ0FBZCxDQUFKLEVBQXNCO0FBQ3BCO0FBQ0E7QUFDQSxRQUFNSSxNQUFNSixFQUFFSyxNQUFkO0FBQ0EsUUFBSSxDQUFDSixDQUFELElBQU1BLEVBQUVJLE1BQUYsS0FBYUQsR0FBdkIsRUFBNEI7QUFDMUIsYUFBTyxLQUFQO0FBQ0Q7O0FBRUQsU0FBSyxJQUFJRSxJQUFJLENBQWIsRUFBZ0JBLElBQUlGLEdBQXBCLEVBQXlCRSxHQUF6QixFQUE4QjtBQUM1QixVQUFJTixFQUFFTSxDQUFGLE1BQVNMLEVBQUVLLENBQUYsQ0FBYixFQUFtQjtBQUNqQixlQUFPLEtBQVA7QUFDRDtBQUNGO0FBQ0QsV0FBTyxJQUFQO0FBQ0Q7QUFDRCxTQUFPLEtBQVA7QUFDRDs7QUFFRDs7Ozs7QUFLZSxTQUFTUixPQUFULENBQWlCUyxPQUFqQixFQUEwQjtBQUN2QyxNQUFJQyxhQUFhLEVBQWpCO0FBQ0EsTUFBSUMscUJBQUo7O0FBRUEsU0FBTyxnQkFBUTtBQUNiLFNBQUssSUFBTUMsR0FBWCxJQUFrQkMsSUFBbEIsRUFBd0I7QUFDdEIsVUFBSSxDQUFDWixRQUFRWSxLQUFLRCxHQUFMLENBQVIsRUFBbUJGLFdBQVdFLEdBQVgsQ0FBbkIsQ0FBTCxFQUEwQztBQUN4Q0QsdUJBQWVGLFFBQVFJLElBQVIsQ0FBZjtBQUNBSCxxQkFBYUcsSUFBYjtBQUNBO0FBQ0Q7QUFDRjtBQUNELFdBQU9GLFlBQVA7QUFDRCxHQVREO0FBVUQiLCJmaWxlIjoibWVtb2l6ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGlzRXF1YWwoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgLy8gU3BlY2lhbCB0cmVhdG1lbnQgZm9yIGFycmF5czogY29tcGFyZSAxLWxldmVsIGRlZXBcbiAgICAvLyBUaGlzIGlzIHRvIHN1cHBvcnQgZXF1YWxpdHkgb2YgbWF0cml4L2Nvb3JkaW5hdGUgcHJvcHNcbiAgICBjb25zdCBsZW4gPSBhLmxlbmd0aDtcbiAgICBpZiAoIWIgfHwgYi5sZW5ndGggIT09IGxlbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFNwZWVkIHVwIGNvbnNlY3V0aXZlIGZ1bmN0aW9uIGNhbGxzIGJ5IGNhY2hpbmcgdGhlIHJlc3VsdCBvZiBjYWxscyB3aXRoIGlkZW50aWNhbCBpbnB1dFxuICogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWVtb2l6YXRpb25cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXB1dGUgLSB0aGUgZnVuY3Rpb24gdG8gYmUgbWVtb2l6ZWRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWVtb2l6ZShjb21wdXRlKSB7XG4gIGxldCBjYWNoZWRBcmdzID0ge307XG4gIGxldCBjYWNoZWRSZXN1bHQ7XG5cbiAgcmV0dXJuIGFyZ3MgPT4ge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGFyZ3MpIHtcbiAgICAgIGlmICghaXNFcXVhbChhcmdzW2tleV0sIGNhY2hlZEFyZ3Nba2V5XSkpIHtcbiAgICAgICAgY2FjaGVkUmVzdWx0ID0gY29tcHV0ZShhcmdzKTtcbiAgICAgICAgY2FjaGVkQXJncyA9IGFyZ3M7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkUmVzdWx0O1xuICB9O1xufVxuIl19