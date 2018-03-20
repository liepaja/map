'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.diffProps = diffProps;
exports.compareProps = compareProps;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Returns an object with "change flags", either false or strings indicating reason for change
function diffProps(props, oldProps) {
  // First check if any props have changed (ignore props that will be examined separately)
  var propsChangedReason = compareProps({
    newProps: props,
    oldProps: oldProps,
    ignoreProps: { data: null, updateTriggers: null }
  });

  // Now check if any data related props have changed
  var dataChangedReason = diffDataProps(props, oldProps);

  // Check update triggers to determine if any attributes need regeneration
  // Note - if data has changed, all attributes will need regeneration, so skip this step
  var updateTriggersChangedReason = false;
  if (!dataChangedReason) {
    updateTriggersChangedReason = diffUpdateTriggers(props, oldProps);
  }

  return {
    dataChanged: dataChangedReason,
    propsChanged: propsChangedReason,
    updateTriggersChanged: updateTriggersChangedReason
  };
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * @param {Object} opt.oldProps - object with old key/value pairs
 * @param {Object} opt.newProps - object with new key/value pairs
 * @param {Object} opt.ignoreProps={} - object, keys that should not be compared
 * @returns {null|String} - null when values of all keys are strictly equal.
 *   if unequal, returns a string explaining what changed.
 */
/* eslint-disable max-statements, max-depth, complexity */
function compareProps() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      newProps = _ref.newProps,
      oldProps = _ref.oldProps,
      _ref$ignoreProps = _ref.ignoreProps,
      ignoreProps = _ref$ignoreProps === undefined ? {} : _ref$ignoreProps,
      _ref$shallowComparePr = _ref.shallowCompareProps,
      shallowCompareProps = _ref$shallowComparePr === undefined ? {} : _ref$shallowComparePr,
      _ref$triggerName = _ref.triggerName,
      triggerName = _ref$triggerName === undefined ? 'props' : _ref$triggerName;

  (0, _assert2.default)(oldProps !== undefined && newProps !== undefined, 'compareProps args');

  // shallow equality => deep equality
  if (oldProps === newProps) {
    return null;
  }

  // TODO - do we need these checks? Should never happen...
  if ((typeof newProps === 'undefined' ? 'undefined' : _typeof(newProps)) !== 'object' || newProps === null) {
    return triggerName + ' changed shallowly';
  }

  if ((typeof oldProps === 'undefined' ? 'undefined' : _typeof(oldProps)) !== 'object' || oldProps === null) {
    return triggerName + ' changed shallowly';
  }

  // Test if new props different from old props
  for (var key in oldProps) {
    if (!(key in ignoreProps)) {
      if (!(key in newProps)) {
        return triggerName + '.' + key + ' dropped: ' + oldProps[key] + ' -> undefined';
      }

      // If object has an equals function, invoke it
      var equals = newProps[key] && oldProps[key] && newProps[key].equals;
      if (equals && !equals.call(newProps[key], oldProps[key])) {
        return triggerName + '.' + key + ' changed deeply: ' + oldProps[key] + ' -> ' + newProps[key];
      }

      // If both new and old value are functions, ignore differences
      if (key in shallowCompareProps) {
        var type = _typeof(newProps[key]);
        if (type === 'function' && typeof oldProps[key] === 'function') {
          equals = true;
        }
      }

      if (!equals && oldProps[key] !== newProps[key]) {
        return triggerName + '.' + key + ' changed shallowly: ' + oldProps[key] + ' -> ' + newProps[key];
      }
    }
  }

  // Test if any new props have been added
  for (var _key in newProps) {
    if (!(_key in ignoreProps)) {
      if (!(_key in oldProps)) {
        return triggerName + '.' + _key + ' added: undefined -> ' + newProps[_key];
      }
    }
  }

  return null;
}
/* eslint-enable max-statements, max-depth, complexity */

// HELPERS

// The comparison of the data prop requires special handling
// the dataComparator should be used if supplied
function diffDataProps(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  // Support optional app defined comparison of data
  var dataComparator = props.dataComparator;

  if (dataComparator) {
    if (!dataComparator(props.data, oldProps.data)) {
      return 'Data comparator detected a change';
    }
    // Otherwise, do a shallow equal on props
  } else if (props.data !== oldProps.data) {
    return 'A new data container was supplied';
  }

  return null;
}

// Checks if any update triggers have changed
// also calls callback to invalidate attributes accordingly.
function diffUpdateTriggers(props, oldProps) {
  if (oldProps === null) {
    return 'oldProps is null, initial diff';
  }

  // If the 'all' updateTrigger fires, ignore testing others
  if ('all' in props.updateTriggers) {
    var diffReason = diffUpdateTrigger(oldProps, props, 'all');
    if (diffReason) {
      return { all: true };
    }
  }

  var triggerChanged = {};
  var reason = false;
  // If the 'all' updateTrigger didn't fire, need to check all others
  for (var triggerName in props.updateTriggers) {
    if (triggerName !== 'all') {
      var _diffReason = diffUpdateTrigger(oldProps, props, triggerName);
      if (_diffReason) {
        triggerChanged[triggerName] = true;
        reason = triggerChanged;
      }
    }
  }

  return reason;
}

function diffUpdateTrigger(props, oldProps, triggerName) {
  var newTriggers = props.updateTriggers[triggerName] || {};
  var oldTriggers = oldProps.updateTriggers[triggerName] || {};
  var diffReason = compareProps({
    oldProps: oldTriggers,
    newProps: newTriggers,
    triggerName: triggerName
  });
  return diffReason;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpZmVjeWNsZS9wcm9wcy5qcyJdLCJuYW1lcyI6WyJkaWZmUHJvcHMiLCJjb21wYXJlUHJvcHMiLCJwcm9wcyIsIm9sZFByb3BzIiwicHJvcHNDaGFuZ2VkUmVhc29uIiwibmV3UHJvcHMiLCJpZ25vcmVQcm9wcyIsImRhdGEiLCJ1cGRhdGVUcmlnZ2VycyIsImRhdGFDaGFuZ2VkUmVhc29uIiwiZGlmZkRhdGFQcm9wcyIsInVwZGF0ZVRyaWdnZXJzQ2hhbmdlZFJlYXNvbiIsImRpZmZVcGRhdGVUcmlnZ2VycyIsImRhdGFDaGFuZ2VkIiwicHJvcHNDaGFuZ2VkIiwidXBkYXRlVHJpZ2dlcnNDaGFuZ2VkIiwic2hhbGxvd0NvbXBhcmVQcm9wcyIsInRyaWdnZXJOYW1lIiwidW5kZWZpbmVkIiwia2V5IiwiZXF1YWxzIiwiY2FsbCIsInR5cGUiLCJkYXRhQ29tcGFyYXRvciIsImRpZmZSZWFzb24iLCJkaWZmVXBkYXRlVHJpZ2dlciIsImFsbCIsInRyaWdnZXJDaGFuZ2VkIiwicmVhc29uIiwibmV3VHJpZ2dlcnMiLCJvbGRUcmlnZ2VycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFHZ0JBLFMsR0FBQUEsUztRQW1DQUMsWSxHQUFBQSxZOztBQXRDaEI7Ozs7OztBQUVBO0FBQ08sU0FBU0QsU0FBVCxDQUFtQkUsS0FBbkIsRUFBMEJDLFFBQTFCLEVBQW9DO0FBQ3pDO0FBQ0EsTUFBTUMscUJBQXFCSCxhQUFhO0FBQ3RDSSxjQUFVSCxLQUQ0QjtBQUV0Q0Msc0JBRnNDO0FBR3RDRyxpQkFBYSxFQUFDQyxNQUFNLElBQVAsRUFBYUMsZ0JBQWdCLElBQTdCO0FBSHlCLEdBQWIsQ0FBM0I7O0FBTUE7QUFDQSxNQUFNQyxvQkFBb0JDLGNBQWNSLEtBQWQsRUFBcUJDLFFBQXJCLENBQTFCOztBQUVBO0FBQ0E7QUFDQSxNQUFJUSw4QkFBOEIsS0FBbEM7QUFDQSxNQUFJLENBQUNGLGlCQUFMLEVBQXdCO0FBQ3RCRSxrQ0FBOEJDLG1C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LEVBQXlEO0FBQ3ZELE1BQU1ZLGNBQWMzQixNQUFNTSxjQUFOLENBQXFCUyxXQUFyQixLQUFxQyxFQUF6RDtBQUNBLE1BQU1hLGNBQWMzQixTQUFTSyxjQUFULENBQXdCUyxXQUF4QixLQUF3QyxFQUE1RDtBQUNBLE1BQU1PLGFBQWF2QixhQUFhO0FBQzlCRSxjQUFVMkIsV0FEb0I7QUFFOUJ6QixjQUFVd0IsV0FGb0I7QUFHOUJaO0FBSDhCLEdBQWIsQ0FBbkI7QUFLQSxTQUFPTyxVQUFQO0FBQ0QiLCJmaWxlIjoicHJvcHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIFJldHVybnMgYW4gb2JqZWN0IHdpdGggXCJjaGFuZ2UgZmxhZ3NcIiwgZWl0aGVyIGZhbHNlIG9yIHN0cmluZ3MgaW5kaWNhdGluZyByZWFzb24gZm9yIGNoYW5nZVxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZQcm9wcyhwcm9wcywgb2xkUHJvcHMpIHtcbiAgLy8gRmlyc3QgY2hlY2sgaWYgYW55IHByb3BzIGhhdmUgY2hhbmdlZCAoaWdub3JlIHByb3BzIHRoYXQgd2lsbCBiZSBleGFtaW5lZCBzZXBhcmF0ZWx5KVxuICBjb25zdCBwcm9wc0NoYW5nZWRSZWFzb24gPSBjb21wYXJlUHJvcHMoe1xuICAgIG5ld1Byb3BzOiBwcm9wcyxcbiAgICBvbGRQcm9wcyxcbiAgICBpZ25vcmVQcm9wczoge2RhdGE6IG51bGwsIHVwZGF0ZVRyaWdnZXJzOiBudWxsfVxuICB9KTtcblxuICAvLyBOb3cgY2hlY2sgaWYgYW55IGRhdGEgcmVsYXRlZCBwcm9wcyBoYXZlIGNoYW5nZWRcbiAgY29uc3QgZGF0YUNoYW5nZWRSZWFzb24gPSBkaWZmRGF0YVByb3BzKHByb3BzLCBvbGRQcm9wcyk7XG5cbiAgLy8gQ2hlY2sgdXBkYXRlIHRyaWdnZXJzIHRvIGRldGVybWluZSBpZiBhbnkgYXR0cmlidXRlcyBuZWVkIHJlZ2VuZXJhdGlvblxuICAvLyBOb3RlIC0gaWYgZGF0YSBoYXMgY2hhbmdlZCwgYWxsIGF0dHJpYnV0ZXMgd2lsbCBuZWVkIHJlZ2VuZXJhdGlvbiwgc28gc2tpcCB0aGlzIHN0ZXBcbiAgbGV0IHVwZGF0ZVRyaWdnZXJzQ2hhbmdlZFJlYXNvbiA9IGZhbHNlO1xuICBpZiAoIWRhdGFDaGFuZ2VkUmVhc29uKSB7XG4gICAgdXBkYXRlVHJpZ2dlcnNDaGFuZ2VkUmVhc29uID0gZGlmZlVwZGF0ZVRyaWdnZXJzKHByb3BzLCBvbGRQcm9wcyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRhdGFDaGFuZ2VkOiBkYXRhQ2hhbmdlZFJlYXNvbixcbiAgICBwcm9wc0NoYW5nZWQ6IHByb3BzQ2hhbmdlZFJlYXNvbixcbiAgICB1cGRhdGVUcmlnZ2Vyc0NoYW5nZWQ6IHVwZGF0ZVRyaWdnZXJzQ2hhbmdlZFJlYXNvblxuICB9O1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIGVxdWFsaXR5IGJ5IGl0ZXJhdGluZyB0aHJvdWdoIGtleXMgb24gYW4gb2JqZWN0IGFuZCByZXR1cm5pbmcgZmFsc2VcbiAqIHdoZW4gYW55IGtleSBoYXMgdmFsdWVzIHdoaWNoIGFyZSBub3Qgc3RyaWN0bHkgZXF1YWwgYmV0d2VlbiB0aGUgYXJndW1lbnRzLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdC5vbGRQcm9wcyAtIG9iamVjdCB3aXRoIG9sZCBrZXkvdmFsdWUgcGFpcnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHQubmV3UHJvcHMgLSBvYmplY3Qgd2l0aCBuZXcga2V5L3ZhbHVlIHBhaXJzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0Lmlnbm9yZVByb3BzPXt9IC0gb2JqZWN0LCBrZXlzIHRoYXQgc2hvdWxkIG5vdCBiZSBjb21wYXJlZFxuICogQHJldHVybnMge251bGx8U3RyaW5nfSAtIG51bGwgd2hlbiB2YWx1ZXMgb2YgYWxsIGtleXMgYXJlIHN0cmljdGx5IGVxdWFsLlxuICogICBpZiB1bmVxdWFsLCByZXR1cm5zIGEgc3RyaW5nIGV4cGxhaW5pbmcgd2hhdCBjaGFuZ2VkLlxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWRlcHRoLCBjb21wbGV4aXR5ICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZVByb3BzKHtcbiAgbmV3UHJvcHMsXG4gIG9sZFByb3BzLFxuICBpZ25vcmVQcm9wcyA9IHt9LFxuICBzaGFsbG93Q29tcGFyZVByb3BzID0ge30sXG4gIHRyaWdnZXJOYW1lID0gJ3Byb3BzJ1xufSA9IHt9KSB7XG4gIGFzc2VydChvbGRQcm9wcyAhPT0gdW5kZWZpbmVkICYmIG5ld1Byb3BzICE9PSB1bmRlZmluZWQsICdjb21wYXJlUHJvcHMgYXJncycpO1xuXG4gIC8vIHNoYWxsb3cgZXF1YWxpdHkgPT4gZGVlcCBlcXVhbGl0eVxuICBpZiAob2xkUHJvcHMgPT09IG5ld1Byb3BzKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBUT0RPIC0gZG8gd2UgbmVlZCB0aGVzZSBjaGVja3M/IFNob3VsZCBuZXZlciBoYXBwZW4uLi5cbiAgaWYgKHR5cGVvZiBuZXdQcm9wcyAhPT0gJ29iamVjdCcgfHwgbmV3UHJvcHMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gYCR7dHJpZ2dlck5hbWV9IGNoYW5nZWQgc2hhbGxvd2x5YDtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2xkUHJvcHMgIT09ICdvYmplY3QnIHx8IG9sZFByb3BzID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGAke3RyaWdnZXJOYW1lfSBjaGFuZ2VkIHNoYWxsb3dseWA7XG4gIH1cblxuICAvLyBUZXN0IGlmIG5ldyBwcm9wcyBkaWZmZXJlbnQgZnJvbSBvbGQgcHJvcHNcbiAgZm9yIChjb25zdCBrZXkgaW4gb2xkUHJvcHMpIHtcbiAgICBpZiAoIShrZXkgaW4gaWdub3JlUHJvcHMpKSB7XG4gICAgICBpZiAoIShrZXkgaW4gbmV3UHJvcHMpKSB7XG4gICAgICAgIHJldHVybiBgJHt0cmlnZ2VyTmFtZX0uJHtrZXl9IGRyb3BwZWQ6ICR7b2xkUHJvcHNba2V5XX0gLT4gdW5kZWZpbmVkYDtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgb2JqZWN0IGhhcyBhbiBlcXVhbHMgZnVuY3Rpb24sIGludm9rZSBpdFxuICAgICAgbGV0IGVxdWFscyA9IG5ld1Byb3BzW2tleV0gJiYgb2xkUHJvcHNba2V5XSAmJiBuZXdQcm9wc1trZXldLmVxdWFscztcbiAgICAgIGlmIChlcXVhbHMgJiYgIWVxdWFscy5jYWxsKG5ld1Byb3BzW2tleV0sIG9sZFByb3BzW2tleV0pKSB7XG4gICAgICAgIHJldHVybiBgJHt0cmlnZ2VyTmFtZX0uJHtrZXl9IGNoYW5nZWQgZGVlcGx5OiAke29sZFByb3BzW2tleV19IC0+ICR7bmV3UHJvcHNba2V5XX1gO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBib3RoIG5ldyBhbmQgb2xkIHZhbHVlIGFyZSBmdW5jdGlvbnMsIGlnbm9yZSBkaWZmZXJlbmNlc1xuICAgICAgaWYgKGtleSBpbiBzaGFsbG93Q29tcGFyZVByb3BzKSB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgbmV3UHJvcHNba2V5XTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9sZFByb3BzW2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBlcXVhbHMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZXF1YWxzICYmIG9sZFByb3BzW2tleV0gIT09IG5ld1Byb3BzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIGAke3RyaWdnZXJOYW1lfS4ke2tleX0gY2hhbmdlZCBzaGFsbG93bHk6ICR7b2xkUHJvcHNba2V5XX0gLT4gJHtuZXdQcm9wc1trZXldfWA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVGVzdCBpZiBhbnkgbmV3IHByb3BzIGhhdmUgYmVlbiBhZGRlZFxuICBmb3IgKGNvbnN0IGtleSBpbiBuZXdQcm9wcykge1xuICAgIGlmICghKGtleSBpbiBpZ25vcmVQcm9wcykpIHtcbiAgICAgIGlmICghKGtleSBpbiBvbGRQcm9wcykpIHtcbiAgICAgICAgcmV0dXJuIGAke3RyaWdnZXJOYW1lfS4ke2tleX0gYWRkZWQ6IHVuZGVmaW5lZCAtPiAke25ld1Byb3BzW2tleV19YDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbi8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMsIG1heC1kZXB0aCwgY29tcGxleGl0eSAqL1xuXG4vLyBIRUxQRVJTXG5cbi8vIFRoZSBjb21wYXJpc29uIG9mIHRoZSBkYXRhIHByb3AgcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZ1xuLy8gdGhlIGRhdGFDb21wYXJhdG9yIHNob3VsZCBiZSB1c2VkIGlmIHN1cHBsaWVkXG5mdW5jdGlvbiBkaWZmRGF0YVByb3BzKHByb3BzLCBvbGRQcm9wcykge1xuICBpZiAob2xkUHJvcHMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ29sZFByb3BzIGlzIG51bGwsIGluaXRpYWwgZGlmZic7XG4gIH1cblxuICAvLyBTdXBwb3J0IG9wdGlvbmFsIGFwcCBkZWZpbmVkIGNvbXBhcmlzb24gb2YgZGF0YVxuICBjb25zdCB7ZGF0YUNvbXBhcmF0b3J9ID0gcHJvcHM7XG4gIGlmIChkYXRhQ29tcGFyYXRvcikge1xuICAgIGlmICghZGF0YUNvbXBhcmF0b3IocHJvcHMuZGF0YSwgb2xkUHJvcHMuZGF0YSkpIHtcbiAgICAgIHJldHVybiAnRGF0YSBjb21wYXJhdG9yIGRldGVjdGVkIGEgY2hhbmdlJztcbiAgICB9XG4gICAgLy8gT3RoZXJ3aXNlLCBkbyBhIHNoYWxsb3cgZXF1YWwgb24gcHJvcHNcbiAgfSBlbHNlIGlmIChwcm9wcy5kYXRhICE9PSBvbGRQcm9wcy5kYXRhKSB7XG4gICAgcmV0dXJuICdBIG5ldyBkYXRhIGNvbnRhaW5lciB3YXMgc3VwcGxpZWQnO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIENoZWNrcyBpZiBhbnkgdXBkYXRlIHRyaWdnZXJzIGhhdmUgY2hhbmdlZFxuLy8gYWxzbyBjYWxscyBjYWxsYmFjayB0byBpbnZhbGlkYXRlIGF0dHJpYnV0ZXMgYWNjb3JkaW5nbHkuXG5mdW5jdGlvbiBkaWZmVXBkYXRlVHJpZ2dlcnMocHJvcHMsIG9sZFByb3BzKSB7XG4gIGlmIChvbGRQcm9wcyA9PT0gbnVsbCkge1xuICAgIHJldHVybiAnb2xkUHJvcHMgaXMgbnVsbCwgaW5pdGlhbCBkaWZmJztcbiAgfVxuXG4gIC8vIElmIHRoZSAnYWxsJyB1cGRhdGVUcmlnZ2VyIGZpcmVzLCBpZ25vcmUgdGVzdGluZyBvdGhlcnNcbiAgaWYgKCdhbGwnIGluIHByb3BzLnVwZGF0ZVRyaWdnZXJzKSB7XG4gICAgY29uc3QgZGlmZlJlYXNvbiA9IGRpZmZVcGRhdGVUcmlnZ2VyKG9sZFByb3BzLCBwcm9wcywgJ2FsbCcpO1xuICAgIGlmIChkaWZmUmVhc29uKSB7XG4gICAgICByZXR1cm4ge2FsbDogdHJ1ZX07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdHJpZ2dlckNoYW5nZWQgPSB7fTtcbiAgbGV0IHJlYXNvbiA9IGZhbHNlO1xuICAvLyBJZiB0aGUgJ2FsbCcgdXBkYXRlVHJpZ2dlciBkaWRuJ3QgZmlyZSwgbmVlZCB0byBjaGVjayBhbGwgb3RoZXJzXG4gIGZvciAoY29uc3QgdHJpZ2dlck5hbWUgaW4gcHJvcHMudXBkYXRlVHJpZ2dlcnMpIHtcbiAgICBpZiAodHJpZ2dlck5hbWUgIT09ICdhbGwnKSB7XG4gICAgICBjb25zdCBkaWZmUmVhc29uID0gZGlmZlVwZGF0ZVRyaWdnZXIob2xkUHJvcHMsIHByb3BzLCB0cmlnZ2VyTmFtZSk7XG4gICAgICBpZiAoZGlmZlJlYXNvbikge1xuICAgICAgICB0cmlnZ2VyQ2hhbmdlZFt0cmlnZ2VyTmFtZV0gPSB0cnVlO1xuICAgICAgICByZWFzb24gPSB0cmlnZ2VyQ2hhbmdlZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVhc29uO1xufVxuXG5mdW5jdGlvbiBkaWZmVXBkYXRlVHJpZ2dlcihwcm9wcywgb2xkUHJvcHMsIHRyaWdnZXJOYW1lKSB7XG4gIGNvbnN0IG5ld1RyaWdnZXJzID0gcHJvcHMudXBkYXRlVHJpZ2dlcnNbdHJpZ2dlck5hbWVdIHx8IHt9O1xuICBjb25zdCBvbGRUcmlnZ2VycyA9IG9sZFByb3BzLnVwZGF0ZVRyaWdnZXJzW3RyaWdnZXJOYW1lXSB8fCB7fTtcbiAgY29uc3QgZGlmZlJlYXNvbiA9IGNvbXBhcmVQcm9wcyh7XG4gICAgb2xkUHJvcHM6IG9sZFRyaWdnZXJzLFxuICAgIG5ld1Byb3BzOiBuZXdUcmlnZ2VycyxcbiAgICB0cmlnZ2VyTmFtZVxuICB9KTtcbiAgcmV0dXJuIGRpZmZSZWFzb247XG59XG4iXX0=