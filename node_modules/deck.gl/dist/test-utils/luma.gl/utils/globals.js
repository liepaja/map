'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// Purpose: include this in your module to avoids adding dependencies on
// micro modules like 'global' and 'is-browser';

/* global process, window, global, document */
var isBrowser = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) !== 'object' || String(process) !== '[object process]' || process.browser;

module.exports = {
  window: typeof window !== 'undefined' ? window : global,
  global: typeof global !== 'undefined' ? global : window,
  document: typeof document !== 'undefined' ? document : {},
  isBrowser: isBrowser
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZXN0LXV0aWxzL2x1bWEuZ2wvdXRpbHMvZ2xvYmFscy5qcyJdLCJuYW1lcyI6WyJpc0Jyb3dzZXIiLCJwcm9jZXNzIiwiU3RyaW5nIiwiYnJvd3NlciIsIm1vZHVsZSIsImV4cG9ydHMiLCJ3aW5kb3ciLCJnbG9iYWwiLCJkb2N1bWVudCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7O0FBRUE7QUFDQSxJQUFNQSxZQUNKLFFBQU9DLE9BQVAseUNBQU9BLE9BQVAsT0FBbUIsUUFBbkIsSUFBK0JDLE9BQU9ELE9BQVAsTUFBb0Isa0JBQW5ELElBQXlFQSxRQUFRRSxPQURuRjs7QUFHQUMsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxVQUFRLE9BQU9BLE1BQVAsS0FBa0IsV0FBbEIsR0FBZ0NBLE1BQWhDLEdBQXlDQyxNQURsQztBQUVmQSxVQUFRLE9BQU9BLE1BQVAsS0FBa0IsV0FBbEIsR0FBZ0NBLE1BQWhDLEdBQXlDRCxNQUZsQztBQUdmRSxZQUFVLE9BQU9BLFFBQVAsS0FBb0IsV0FBcEIsR0FBa0NBLFFBQWxDLEdBQTZDLEVBSHhDO0FBSWZSO0FBSmUsQ0FBakIiLCJmaWxlIjoiZ2xvYmFscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFB1cnBvc2U6IGluY2x1ZGUgdGhpcyBpbiB5b3VyIG1vZHVsZSB0byBhdm9pZHMgYWRkaW5nIGRlcGVuZGVuY2llcyBvblxuLy8gbWljcm8gbW9kdWxlcyBsaWtlICdnbG9iYWwnIGFuZCAnaXMtYnJvd3Nlcic7XG5cbi8qIGdsb2JhbCBwcm9jZXNzLCB3aW5kb3csIGdsb2JhbCwgZG9jdW1lbnQgKi9cbmNvbnN0IGlzQnJvd3NlciA9XG4gIHR5cGVvZiBwcm9jZXNzICE9PSAnb2JqZWN0JyB8fCBTdHJpbmcocHJvY2VzcykgIT09ICdbb2JqZWN0IHByb2Nlc3NdJyB8fCBwcm9jZXNzLmJyb3dzZXI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB3aW5kb3c6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsLFxuICBnbG9iYWw6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogd2luZG93LFxuICBkb2N1bWVudDogdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50IDoge30sXG4gIGlzQnJvd3NlclxufTtcbiJdfQ==