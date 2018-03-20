'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.toLowPrecision = toLowPrecision;
/**
 * Covert all numbers in a deep structure to a given precision, allowing
 * reliable float comparisons. Converts data in-place.
 * @param  {mixed} input      Input data
 * @param  {Number} [precision] Desired precision
 * @return {mixed}            Input data, with all numbers converted
 */
function toLowPrecision(input) {
  var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 11;

  /* eslint-disable guard-for-in */
  if (typeof input === 'number') {
    input = Number(input.toPrecision(precision));
  }
  if (Array.isArray(input)) {
    input = input.map(function (item) {
      return toLowPrecision(item, precision);
    });
  }
  if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') {
    for (var key in input) {
      input[key] = toLowPrecision(input[key], precision);
    }
  }
  return input;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL3NyYy9wcmVjaXNpb24uanMiXSwibmFtZXMiOlsidG9Mb3dQcmVjaXNpb24iLCJpbnB1dCIsInByZWNpc2lvbiIsIk51bWJlciIsInRvUHJlY2lzaW9uIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiaXRlbSIsImtleSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFPZ0JBLGMsR0FBQUEsYztBQVBoQjs7Ozs7OztBQU9PLFNBQVNBLGNBQVQsQ0FBd0JDLEtBQXhCLEVBQStDO0FBQUEsTUFBaEJDLFNBQWdCLHVFQUFKLEVBQUk7O0FBQ3BEO0FBQ0EsTUFBSSxPQUFPRCxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzdCQSxZQUFRRSxPQUFPRixNQUFNRyxXQUFOLENBQWtCRixTQUFsQixDQUFQLENBQVI7QUFDRDtBQUNELE1BQUlHLE1BQU1DLE9BQU4sQ0FBY0wsS0FBZCxDQUFKLEVBQTBCO0FBQ3hCQSxZQUFRQSxNQUFNTSxHQUFOLENBQVU7QUFBQSxhQUFRUCxlQUFlUSxJQUFmLEVBQXFCTixTQUFyQixDQUFSO0FBQUEsS0FBVixDQUFSO0FBQ0Q7QUFDRCxNQUFJLFFBQU9ELEtBQVAseUNBQU9BLEtBQVAsT0FBaUIsUUFBckIsRUFBK0I7QUFDN0IsU0FBSyxJQUFNUSxHQUFYLElBQWtCUixLQUFsQixFQUF5QjtBQUN2QkEsWUFBTVEsR0FBTixJQUFhVCxlQUFlQyxNQUFNUSxHQUFOLENBQWYsRUFBMkJQLFNBQTNCLENBQWI7QUFDRDtBQUNGO0FBQ0QsU0FBT0QsS0FBUDtBQUNEIiwiZmlsZSI6InByZWNpc2lvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ292ZXJ0IGFsbCBudW1iZXJzIGluIGEgZGVlcCBzdHJ1Y3R1cmUgdG8gYSBnaXZlbiBwcmVjaXNpb24sIGFsbG93aW5nXG4gKiByZWxpYWJsZSBmbG9hdCBjb21wYXJpc29ucy4gQ29udmVydHMgZGF0YSBpbi1wbGFjZS5cbiAqIEBwYXJhbSAge21peGVkfSBpbnB1dCAgICAgIElucHV0IGRhdGFcbiAqIEBwYXJhbSAge051bWJlcn0gW3ByZWNpc2lvbl0gRGVzaXJlZCBwcmVjaXNpb25cbiAqIEByZXR1cm4ge21peGVkfSAgICAgICAgICAgIElucHV0IGRhdGEsIHdpdGggYWxsIG51bWJlcnMgY29udmVydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xvd1ByZWNpc2lvbihpbnB1dCwgcHJlY2lzaW9uID0gMTEpIHtcbiAgLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG4gIGlmICh0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSB7XG4gICAgaW5wdXQgPSBOdW1iZXIoaW5wdXQudG9QcmVjaXNpb24ocHJlY2lzaW9uKSk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgaW5wdXQgPSBpbnB1dC5tYXAoaXRlbSA9PiB0b0xvd1ByZWNpc2lvbihpdGVtLCBwcmVjaXNpb24pKTtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0Jykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGlucHV0KSB7XG4gICAgICBpbnB1dFtrZXldID0gdG9Mb3dQcmVjaXNpb24oaW5wdXRba2V5XSwgcHJlY2lzaW9uKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlucHV0O1xufVxuIl19