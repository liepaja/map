'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.getInteractiveLayerIds = getInteractiveLayerIds;
exports.setDiffStyle = setDiffStyle;

var _isImmutableMap = require('./is-immutable-map');

var _isImmutableMap2 = _interopRequireDefault(_isImmutableMap);

var _diffStyles2 = require('./diff-styles');

var _diffStyles3 = _interopRequireDefault(_diffStyles2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getInteractiveLayerIds(mapStyle) {
  var interactiveLayerIds = null;

  if ((0, _isImmutableMap2.default)(mapStyle) && mapStyle.has('layers')) {
    interactiveLayerIds = mapStyle.get('layers').filter(function (l) {
      return l.get('interactive');
    }).map(function (l) {
      return l.get('id');
    }).toJS();
  } else if (Array.isArray(mapStyle.layers)) {
    interactiveLayerIds = mapStyle.layers.filter(function (l) {
      return l.interactive;
    }).map(function (l) {
      return l.id;
    });
  }

  return interactiveLayerIds;
}

// Individually update the maps source and layers that have changed if all
// other style props haven't changed. This prevents flicking of the map when
// styles only change sources or layers.
/* eslint-disable max-statements, complexity */
function setDiffStyle(prevStyle, nextStyle, map) {
  var prevKeysMap = prevStyle && styleKeysMap(prevStyle) || {};
  var nextKeysMap = styleKeysMap(nextStyle);
  function styleKeysMap(style) {
    return style.map(function () {
      return true;
    }).delete('layers').delete('sources').toJS();
  }
  function propsOtherThanLayersOrSourcesDiffer() {
    var prevKeysList = (0, _keys2.default)(prevKeysMap);
    var nextKeysList = (0, _keys2.default)(nextKeysMap);
    if (prevKeysList.length !== nextKeysList.length) {
      return true;
    }
    // `nextStyle` and `prevStyle` should not have the same set of props.
    if (nextKeysList.some(function (key) {
      return prevStyle.get(key) !== nextStyle.get(key);
    }
    // But the value of one of those props is different.
    )) {
      return true;
    }
    return false;
  }

  if (!prevStyle || propsOtherThanLayersOrSourcesDiffer()) {
    map.setStyle(nextStyle.toJS());
    return;
  }

  var _diffStyles = (0, _diffStyles3.default)(prevStyle, nextStyle),
      sourcesDiff = _diffStyles.sourcesDiff,
      layersDiff = _diffStyles.layersDiff;

  // TODO: It's rather difficult to determine style diffing in the presence
  // of refs. For now, if any style update has a ref, fallback to no diffing.
  // We can come back to this case if there's a solid usecase.


  if (layersDiff.updates.some(function (node) {
    return node.layer.get('ref');
  })) {
    map.setStyle(nextStyle.toJS());
    return;
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(sourcesDiff.enter), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var enter = _step.value;

      map.addSource(enter.id, enter.source.toJS());
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = (0, _getIterator3.default)(sourcesDiff.update), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var update = _step2.value;

      updateStyleSource(map, update);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = (0, _getIterator3.default)(sourcesDiff.exit), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var exit = _step3.value;

      map.removeSource(exit.id);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = (0, _getIterator3.default)(layersDiff.exiting), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var _exit = _step4.value;

      if (map.style.getLayer(_exit.id)) {
        map.removeLayer(_exit.id);
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = (0, _getIterator3.default)(layersDiff.updates), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var _update = _step5.value;

      if (!_update.enter) {
        // This is an old layer that needs to be updated. Remove the old layer
        // with the same id and add it back again.
        map.removeLayer(_update.id);
      }
      map.addLayer(_update.layer.toJS(), _update.before);
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }
}
/* eslint-enable max-statements, complexity */

// Update a source in the map style
function updateStyleSource(map, update) {
  var newSource = update.source.toJS();
  if (newSource.type === 'geojson') {
    var oldSource = map.getSource(update.id);
    if (oldSource.type === 'geojson') {
      // update data if no other GeoJSONSource options were changed
      var oldOpts = oldSource.workerOptions;
      if ((newSource.maxzoom === undefined || newSource.maxzoom === oldOpts.geojsonVtOptions.maxZoom) && (newSource.buffer === undefined || newSource.buffer === oldOpts.geojsonVtOptions.buffer) && (newSource.tolerance === undefined || newSource.tolerance === oldOpts.geojsonVtOptions.tolerance) && (newSource.cluster === undefined || newSource.cluster === oldOpts.cluster) && (newSource.clusterRadius === undefined || newSource.clusterRadius === oldOpts.superclusterOptions.radius) && (newSource.clusterMaxZoom === undefined || newSource.clusterMaxZoom === oldOpts.superclusterOptions.maxZoom)) {
        oldSource.setData(newSource.data);
        return;
      }
    }
  }

  map.removeSource(update.id);
  map.addSource(update.id, newSource);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zdHlsZS11dGlscy5qcyJdLCJuYW1lcyI6WyJnZXRJbnRlcmFjdGl2ZUxheWVySWRzIiwic2V0RGlmZlN0eWxlIiwibWFwU3R5bGUiLCJpbnRlcmFjdGl2ZUxheWVySWRzIiwiaGFzIiwiZ2V0IiwiZmlsdGVyIiwibCIsIm1hcCIsInRvSlMiLCJBcnJheSIsImlzQXJyYXkiLCJsYXllcnMiLCJpbnRlcmFjdGl2ZSIsImlkIiwicHJldlN0eWxlIiwibmV4dFN0eWxlIiwicHJldktleXNNYXAiLCJzdHlsZUtleXNNYXAiLCJuZXh0S2V5c01hcCIsInN0eWxlIiwiZGVsZXRlIiwicHJvcHNPdGhlclRoYW5MYXllcnNPclNvdXJjZXNEaWZmZXIiLCJwcmV2S2V5c0xpc3QiLCJuZXh0S2V5c0xpc3QiLCJsZW5ndGgiLCJzb21lIiwia2V5Iiwic2V0U3R5bGUiLCJzb3VyY2VzRGlmZiIsImxheWVyc0RpZmYiLCJ1cGRhdGVzIiwibm9kZSIsImxheWVyIiwiZW50ZXIiLCJhZGRTb3VyY2UiLCJzb3VyY2UiLCJ1cGRhdGUiLCJ1cGRhdGVTdHlsZVNvdXJjZSIsImV4aXQiLCJyZW1vdmVTb3VyY2UiLCJleGl0aW5nIiwiZ2V0TGF5ZXIiLCJyZW1vdmVMYXllciIsImFkZExheWVyIiwiYmVmb3JlIiwibmV3U291cmNlIiwidHlwZSIsIm9sZFNvdXJjZSIsImdldFNvdXJjZSIsIm9sZE9wdHMiLCJ3b3JrZXJPcHRpb25zIiwibWF4em9vbSIsInVuZGVmaW5lZCIsImdlb2pzb25WdE9wdGlvbnMiLCJtYXhab29tIiwiYnVmZmVyIiwidG9sZXJhbmNlIiwiY2x1c3RlciIsImNsdXN0ZXJSYWRpdXMiLCJzdXBlcmNsdXN0ZXJPcHRpb25zIiwicmFkaXVzIiwiY2x1c3Rlck1heFpvb20iLCJzZXREYXRhIiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7UUFHZ0JBLHNCLEdBQUFBLHNCO1FBb0JBQyxZLEdBQUFBLFk7O0FBdkJoQjs7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QUNEO0FBQ0Y7QUFDRjs7QUFFRHhELE1BQUlnQyxZQUFKLENBQWlCSCxPQUFPdkIsRUFBeEI7QUFDQU4sTUFBSTJCLFNBQUosQ0FBY0UsT0FBT3ZCLEVBQXJCLEVBQXlCZ0MsU0FBekI7QUFDRCIsImZpbGUiOiJzdHlsZS11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpc0ltbXV0YWJsZU1hcCBmcm9tICcuL2lzLWltbXV0YWJsZS1tYXAnO1xuaW1wb3J0IGRpZmZTdHlsZXMgZnJvbSAnLi9kaWZmLXN0eWxlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnRlcmFjdGl2ZUxheWVySWRzKG1hcFN0eWxlKSB7XG4gIGxldCBpbnRlcmFjdGl2ZUxheWVySWRzID0gbnVsbDtcblxuICBpZiAoaXNJbW11dGFibGVNYXAobWFwU3R5bGUpICYmIG1hcFN0eWxlLmhhcygnbGF5ZXJzJykpIHtcbiAgICBpbnRlcmFjdGl2ZUxheWVySWRzID0gbWFwU3R5bGUuZ2V0KCdsYXllcnMnKVxuICAgICAgLmZpbHRlcihsID0+IGwuZ2V0KCdpbnRlcmFjdGl2ZScpKVxuICAgICAgLm1hcChsID0+IGwuZ2V0KCdpZCcpKVxuICAgICAgLnRvSlMoKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG1hcFN0eWxlLmxheWVycykpIHtcbiAgICBpbnRlcmFjdGl2ZUxheWVySWRzID0gbWFwU3R5bGUubGF5ZXJzLmZpbHRlcihsID0+IGwuaW50ZXJhY3RpdmUpXG4gICAgICAubWFwKGwgPT4gbC5pZCk7XG4gIH1cblxuICByZXR1cm4gaW50ZXJhY3RpdmVMYXllcklkcztcbn1cblxuLy8gSW5kaXZpZHVhbGx5IHVwZGF0ZSB0aGUgbWFwcyBzb3VyY2UgYW5kIGxheWVycyB0aGF0IGhhdmUgY2hhbmdlZCBpZiBhbGxcbi8vIG90aGVyIHN0eWxlIHByb3BzIGhhdmVuJ3QgY2hhbmdlZC4gVGhpcyBwcmV2ZW50cyBmbGlja2luZyBvZiB0aGUgbWFwIHdoZW5cbi8vIHN0eWxlcyBvbmx5IGNoYW5nZSBzb3VyY2VzIG9yIGxheWVycy5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBjb21wbGV4aXR5ICovXG5leHBvcnQgZnVuY3Rpb24gc2V0RGlmZlN0eWxlKHByZXZTdHlsZSwgbmV4dFN0eWxlLCBtYXApIHtcbiAgY29uc3QgcHJldktleXNNYXAgPSBwcmV2U3R5bGUgJiYgc3R5bGVLZXlzTWFwKHByZXZTdHlsZSkgfHwge307XG4gIGNvbnN0IG5leHRLZXlzTWFwID0gc3R5bGVLZXlzTWFwKG5leHRTdHlsZSk7XG4gIGZ1bmN0aW9uIHN0eWxlS2V5c01hcChzdHlsZSkge1xuICAgIHJldHVybiBzdHlsZS5tYXAoKCkgPT4gdHJ1ZSkuZGVsZXRlKCdsYXllcnMnKS5kZWxldGUoJ3NvdXJjZXMnKS50b0pTKCk7XG4gIH1cbiAgZnVuY3Rpb24gcHJvcHNPdGhlclRoYW5MYXllcnNPclNvdXJjZXNEaWZmZXIoKSB7XG4gICAgY29uc3QgcHJldktleXNMaXN0ID0gT2JqZWN0LmtleXMocHJldktleXNNYXApO1xuICAgIGNvbnN0IG5leHRLZXlzTGlzdCA9IE9iamVjdC5rZXlzKG5leHRLZXlzTWFwKTtcbiAgICBpZiAocHJldktleXNMaXN0Lmxlbmd0aCAhPT0gbmV4dEtleXNMaXN0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIGBuZXh0U3R5bGVgIGFuZCBgcHJldlN0eWxlYCBzaG91bGQgbm90IGhhdmUgdGhlIHNhbWUgc2V0IG9mIHByb3BzLlxuICAgIGlmIChuZXh0S2V5c0xpc3Quc29tZShcbiAgICAgIGtleSA9PiBwcmV2U3R5bGUuZ2V0KGtleSkgIT09IG5leHRTdHlsZS5nZXQoa2V5KVxuICAgICAgLy8gQnV0IHRoZSB2YWx1ZSBvZiBvbmUgb2YgdGhvc2UgcHJvcHMgaXMgZGlmZmVyZW50LlxuICAgICkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIXByZXZTdHlsZSB8fCBwcm9wc090aGVyVGhhbkxheWVyc09yU291cmNlc0RpZmZlcigpKSB7XG4gICAgbWFwLnNldFN0eWxlKG5leHRTdHlsZS50b0pTKCkpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHtzb3VyY2VzRGlmZiwgbGF5ZXJzRGlmZn0gPSBkaWZmU3R5bGVzKHByZXZTdHlsZSwgbmV4dFN0eWxlKTtcblxuICAvLyBUT0RPOiBJdCdzIHJhdGhlciBkaWZmaWN1bHQgdG8gZGV0ZXJtaW5lIHN0eWxlIGRpZmZpbmcgaW4gdGhlIHByZXNlbmNlXG4gIC8vIG9mIHJlZnMuIEZvciBub3csIGlmIGFueSBzdHlsZSB1cGRhdGUgaGFzIGEgcmVmLCBmYWxsYmFjayB0byBubyBkaWZmaW5nLlxuICAvLyBXZSBjYW4gY29tZSBiYWNrIHRvIHRoaXMgY2FzZSBpZiB0aGVyZSdzIGEgc29saWQgdXNlY2FzZS5cbiAgaWYgKGxheWVyc0RpZmYudXBkYXRlcy5zb21lKG5vZGUgPT4gbm9kZS5sYXllci5nZXQoJ3JlZicpKSkge1xuICAgIG1hcC5zZXRTdHlsZShuZXh0U3R5bGUudG9KUygpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBmb3IgKGNvbnN0IGVudGVyIG9mIHNvdXJjZXNEaWZmLmVudGVyKSB7XG4gICAgbWFwLmFkZFNvdXJjZShlbnRlci5pZCwgZW50ZXIuc291cmNlLnRvSlMoKSk7XG4gIH1cbiAgZm9yIChjb25zdCB1cGRhdGUgb2Ygc291cmNlc0RpZmYudXBkYXRlKSB7XG4gICAgdXBkYXRlU3R5bGVTb3VyY2UobWFwLCB1cGRhdGUpO1xuICB9XG4gIGZvciAoY29uc3QgZXhpdCBvZiBzb3VyY2VzRGlmZi5leGl0KSB7XG4gICAgbWFwLnJlbW92ZVNvdXJjZShleGl0LmlkKTtcbiAgfVxuICBmb3IgKGNvbnN0IGV4aXQgb2YgbGF5ZXJzRGlmZi5leGl0aW5nKSB7XG4gICAgaWYgKG1hcC5zdHlsZS5nZXRMYXllcihleGl0LmlkKSkge1xuICAgICAgbWFwLnJlbW92ZUxheWVyKGV4aXQuaWQpO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IHVwZGF0ZSBvZiBsYXllcnNEaWZmLnVwZGF0ZXMpIHtcbiAgICBpZiAoIXVwZGF0ZS5lbnRlcikge1xuICAgICAgLy8gVGhpcyBpcyBhbiBvbGQgbGF5ZXIgdGhhdCBuZWVkcyB0byBiZSB1cGRhdGVkLiBSZW1vdmUgdGhlIG9sZCBsYXllclxuICAgICAgLy8gd2l0aCB0aGUgc2FtZSBpZCBhbmQgYWRkIGl0IGJhY2sgYWdhaW4uXG4gICAgICBtYXAucmVtb3ZlTGF5ZXIodXBkYXRlLmlkKTtcbiAgICB9XG4gICAgbWFwLmFkZExheWVyKHVwZGF0ZS5sYXllci50b0pTKCksIHVwZGF0ZS5iZWZvcmUpO1xuICB9XG59XG4vKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzLCBjb21wbGV4aXR5ICovXG5cbi8vIFVwZGF0ZSBhIHNvdXJjZSBpbiB0aGUgbWFwIHN0eWxlXG5mdW5jdGlvbiB1cGRhdGVTdHlsZVNvdXJjZShtYXAsIHVwZGF0ZSkge1xuICBjb25zdCBuZXdTb3VyY2UgPSB1cGRhdGUuc291cmNlLnRvSlMoKTtcbiAgaWYgKG5ld1NvdXJjZS50eXBlID09PSAnZ2VvanNvbicpIHtcbiAgICBjb25zdCBvbGRTb3VyY2UgPSBtYXAuZ2V0U291cmNlKHVwZGF0ZS5pZCk7XG4gICAgaWYgKG9sZFNvdXJjZS50eXBlID09PSAnZ2VvanNvbicpIHtcbiAgICAgIC8vIHVwZGF0ZSBkYXRhIGlmIG5vIG90aGVyIEdlb0pTT05Tb3VyY2Ugb3B0aW9ucyB3ZXJlIGNoYW5nZWRcbiAgICAgIGNvbnN0IG9sZE9wdHMgPSBvbGRTb3VyY2Uud29ya2VyT3B0aW9ucztcbiAgICAgIGlmIChcbiAgICAgICAgKG5ld1NvdXJjZS5tYXh6b29tID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICBuZXdTb3VyY2UubWF4em9vbSA9PT0gb2xkT3B0cy5nZW9qc29uVnRPcHRpb25zLm1heFpvb20pICYmXG4gICAgICAgIChuZXdTb3VyY2UuYnVmZmVyID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICBuZXdTb3VyY2UuYnVmZmVyID09PSBvbGRPcHRzLmdlb2pzb25WdE9wdGlvbnMuYnVmZmVyKSAmJlxuICAgICAgICAobmV3U291cmNlLnRvbGVyYW5jZSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgbmV3U291cmNlLnRvbGVyYW5jZSA9PT0gb2xkT3B0cy5nZW9qc29uVnRPcHRpb25zLnRvbGVyYW5jZSkgJiZcbiAgICAgICAgKG5ld1NvdXJjZS5jbHVzdGVyID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICBuZXdTb3VyY2UuY2x1c3RlciA9PT0gb2xkT3B0cy5jbHVzdGVyKSAmJlxuICAgICAgICAobmV3U291cmNlLmNsdXN0ZXJSYWRpdXMgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgIG5ld1NvdXJjZS5jbHVzdGVyUmFkaXVzID09PSBvbGRPcHRzLnN1cGVyY2x1c3Rlck9wdGlvbnMucmFkaXVzKSAmJlxuICAgICAgICAobmV3U291cmNlLmNsdXN0ZXJNYXhab29tID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICBuZXdTb3VyY2UuY2x1c3Rlck1heFpvb20gPT09IG9sZE9wdHMuc3VwZXJjbHVzdGVyT3B0aW9ucy5tYXhab29tKVxuICAgICAgKSB7XG4gICAgICAgIG9sZFNvdXJjZS5zZXREYXRhKG5ld1NvdXJjZS5kYXRhKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG1hcC5yZW1vdmVTb3VyY2UodXBkYXRlLmlkKTtcbiAgbWFwLmFkZFNvdXJjZSh1cGRhdGUuaWQsIG5ld1NvdXJjZSk7XG59XG4iXX0=