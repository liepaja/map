'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _luma = require('luma.gl');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ATTRIBUTE_MAPPING = {
  1: 'float',
  2: 'vec2',
  3: 'vec3',
  4: 'vec4'
};

function getShaders(transitions) {
  // Build shaders
  var varyings = [];
  var attributeDeclarations = [];
  var uniformsDeclarations = [];
  var varyingDeclarations = [];
  var calculations = [];

  for (var attributeName in transitions) {
    var transition = transitions[attributeName];
    var attributeType = ATTRIBUTE_MAPPING[transition.attribute.size];

    if (attributeType) {
      transition.bufferIndex = varyings.length;
      varyings.push(attributeName);

      attributeDeclarations.push('attribute ' + attributeType + ' ' + attributeName + 'From;');
      attributeDeclarations.push('attribute ' + attributeType + ' ' + attributeName + 'To;');
      uniformsDeclarations.push('uniform float ' + attributeName + 'Time;');
      varyingDeclarations.push('varying ' + attributeType + ' ' + attributeName + ';');
      calculations.push(attributeName + ' = mix(' + attributeName + 'From, ' + attributeName + 'To,\n        ' + attributeName + 'Time);');
    }
  }

  var vs = '\n#define SHADER_NAME feedback-vertex-shader\n' + attributeDeclarations.join('\n') + '\n' + uniformsDeclarations.join('\n') + '\n' + varyingDeclarations.join('\n') + '\n\nvoid main(void) {\n  ' + calculations.join('\n') + '\n  gl_Position = vec4(0.0);\n}\n';

  var fs = '#define SHADER_NAME feedback-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + varyingDeclarations.join('\n') + '\n\nvoid main(void) {\n  gl_FragColor = vec4(0.0);\n}\n';
  return { vs: vs, fs: fs, varyings: varyings };
}

var AttributeTransitionModel = function (_Model) {
  _inherits(AttributeTransitionModel, _Model);

  function AttributeTransitionModel(gl, _ref) {
    var id = _ref.id,
        transitions = _ref.transitions;

    _classCallCheck(this, AttributeTransitionModel);

    var _this = _possibleConstructorReturn(this, (AttributeTransitionModel.__proto__ || Object.getPrototypeOf(AttributeTransitionModel)).call(this, gl, Object.assign({
      id: id,
      geometry: new _luma.Geometry({
        id: id,
        drawMode: _luma.GL.POINTS
      }),
      vertexCount: 0,
      isIndexed: true
    }, getShaders(transitions))));

    _this.setTransitions(transitions);
    return _this;
  }

  // Update attributes and vertex count


  _createClass(AttributeTransitionModel, [{
    key: 'setTransitions',
    value: function setTransitions(transitions) {
      for (var attributeName in transitions) {
        var _setAttributes;

        var _transitions$attribut = transitions[attributeName],
            fromState = _transitions$attribut.fromState,
            toState = _transitions$attribut.toState,
            attribute = _transitions$attribut.attribute;


        this.setAttributes((_setAttributes = {}, _defineProperty(_setAttributes, attributeName + 'From', fromState), _defineProperty(_setAttributes, attributeName + 'To', toState), _setAttributes));

        this.setVertexCount(attribute.value.length / attribute.size);
      }
    }
  }]);

  return AttributeTransitionModel;
}(_luma.Model);

exports.default = AttributeTransitionModel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb3JlL2xpYi9hdHRyaWJ1dGUtdHJhbnNpdGlvbi1tb2RlbC5qcyJdLCJuYW1lcyI6WyJBVFRSSUJVVEVfTUFQUElORyIsImdldFNoYWRlcnMiLCJ0cmFuc2l0aW9ucyIsInZhcnlpbmdzIiwiYXR0cmlidXRlRGVjbGFyYXRpb25zIiwidW5pZm9ybXNEZWNsYXJhdGlvbnMiLCJ2YXJ5aW5nRGVjbGFyYXRpb25zIiwiY2FsY3VsYXRpb25zIiwiYXR0cmlidXRlTmFtZSIsInRyYW5zaXRpb24iLCJhdHRyaWJ1dGVUeXBlIiwiYXR0cmlidXRlIiwic2l6ZSIsImJ1ZmZlckluZGV4IiwibGVuZ3RoIiwicHVzaCIsInZzIiwiam9pbiIsImZzIiwiQXR0cmlidXRlVHJhbnNpdGlvbk1vZGVsIiwiZ2wiLCJpZCIsIk9iamVjdCIsImFzc2lnbiIsImdlb21ldHJ5IiwiZHJhd01vZGUiLCJQT0lOVFMiLCJ2ZXJ0ZXhDb3VudCIsImlzSW5kZXhlZCIsInNldFRyYW5zaXRpb25zIiwiZnJvbVN0YXRlIiwidG9TdGF0ZSIsInNldEF0dHJpYnV0ZXMiLCJzZXRWZXJ0ZXhDb3VudCIsInZhbHVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7Ozs7Ozs7O0FBRUEsSUFBTUEsb0JBQW9CO0FBQ3hCLEtBQUcsT0FEcUI7QUFFeEIsS0FBRyxNQUZxQjtBQUd4QixLQUFHLE1BSHFCO0FBSXhCLEtBQUc7QUFKcUIsQ0FBMUI7O0FBT0EsU0FBU0MsVUFBVCxDQUFvQkMsV0FBcEIsRUFBaUM7QUFDL0I7QUFDQSxNQUFNQyxXQUFXLEVBQWpCO0FBQ0EsTUFBTUMsd0JBQXdCLEVBQTlCO0FBQ0EsTUFBTUMsdUJBQXVCLEVBQTdCO0FBQ0EsTUFBTUMsc0JBQXNCLEVBQTVCO0FBQ0EsTUFBTUMsZUFBZSxFQUFyQjs7QUFFQSxPQUFLLElBQU1DLGFBQVgsSUFBNEJOLFdBQTVCLEVBQXlDO0FBQ3ZDLFFBQU1PLGFBQWFQLFlBQVlNLGFBQVosQ0FBbkI7QUFDQSxRQUFNRSxnQkFBZ0JWLGtCQUFrQlMsV0FBV0UsU0FBWCxDQUFxQkMsSUFBdkMsQ0FBdEI7O0FBRUEsUUFBSUYsYUFBSixFQUFtQjtBQUNqQkQsaUJBQVdJLFdBQVgsR0FBeUJWLFNBQVNXLE1BQWxDO0FBQ0FYLGVBQVNZLElBQVQsQ0FBY1AsYUFBZDs7QUFFQUosNEJBQXNCVyxJQUF0QixnQkFBd0NMLGFBQXhDLFNBQXlERixhQUF6RDtBQUNBSiw0QkFBc0JXLElBQXRCLGdCQUF3Q0wsYUFBeEMsU0FBeURGLGFBQXpEO0FBQ0FILDJCQUFxQlUsSUFBckIsb0JBQTJDUCxhQUEzQztBQUNBRiwwQkFBb0JTLElBQXBCLGNBQW9DTCxhQUFwQyxTQUFxREYsYUFBckQ7QUFDQUQsbUJBQWFRLElBQWIsQ0FBcUJQLGFBQXJCLGVBQTRDQSxhQUE1QyxjQUFrRUEsYUFBbEUscUJBQ0lBLGFBREo7QUFFRDtBQUNGOztBQUVELE1BQU1RLHdEQUVOWixzQkFBc0JhLElBQXRCLENBQTJCLElBQTNCLENBRk0sVUFHTloscUJBQXFCWSxJQUFyQixDQUEwQixJQUExQixDQUhNLFVBSU5YLG9CQUFvQlcsSUFBcEIsQ0FBeUIsSUFBekIsQ0FKTSxpQ0FPSlYsYUFBYVUsSUFBYixDQUFrQixJQUFsQixDQVBJLHNDQUFOOztBQVlBLE1BQU1DLDBHQU9OWixvQkFBb0JXLElBQXBCLENBQXlCLElBQXpCLENBUE0sNERBQU47QUFhQSxTQUFPLEVBQUNELE1BQUQsRUFBS0UsTUFBTCxFQUFTZixrQkFBVCxFQUFQO0FBQ0Q7O0lBRW9CZ0Isd0I7OztBQUNuQixvQ0FBWUMsRUFBWixRQUFtQztBQUFBLFFBQWxCQyxFQUFrQixRQUFsQkEsRUFBa0I7QUFBQSxRQUFkbkIsV0FBYyxRQUFkQSxXQUFjOztBQUFBOztBQUFBLG9KQUUvQmtCLEVBRitCLEVBRy9CRSxPQUFPQyxNQUFQLENBQ0U7QUFDRUYsWUFERjtBQUVFRyxnQkFBVSxtQkFBYTtBQUNyQkgsY0FEcUI7QUFFckJJLGtCQUFVLFNBQUdDO0FBRlEsT0FBYixDQUZaO0FBTUVDLG1CQUFhLENBTmY7QUFPRUMsaUJBQVc7QUFQYixLQURGLEVBVUUzQixXQUFXQyxXQUFYLENBVkYsQ0FIK0I7O0FBaUJqQyxVQUFLMkIsY0FBTCxDQUFvQjNCLFdBQXBCO0FBakJpQztBQWtCbEM7O0FBRUQ7Ozs7O21DQUNlQSxXLEVBQWE7QUFDMUIsV0FBSyxJQUFNTSxhQUFYLElBQTRCTixXQUE1QixFQUF5QztBQUFBOztBQUFBLG9DQUNDQSxZQUFZTSxhQUFaLENBREQ7QUFBQSxZQUNoQ3NCLFNBRGdDLHlCQUNoQ0EsU0FEZ0M7QUFBQSxZQUNyQkMsT0FEcUIseUJBQ3JCQSxPQURxQjtBQUFBLFlBQ1pwQixTQURZLHlCQUNaQSxTQURZOzs7QUFHdkMsYUFBS3FCLGFBQUwsdURBQ014QixhQUROLFdBQzRCc0IsU0FENUIsbUNBRU10QixhQUZOLFNBRTBCdUIsT0FGMUI7O0FBS0EsYUFBS0UsY0FBTCxDQUFvQnRCLFVBQVV1QixLQUFWLENBQWdCcEIsTUFBaEIsR0FBeUJILFVBQVVDLElBQXZEO0FBQ0Q7QUFDRjs7Ozs7O2tCQWpDa0JPLHdCIiwiZmlsZSI6ImF0dHJpYnV0ZS10cmFuc2l0aW9uLW1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtHTCwgTW9kZWwsIEdlb21ldHJ5fSBmcm9tICdsdW1hLmdsJztcblxuY29uc3QgQVRUUklCVVRFX01BUFBJTkcgPSB7XG4gIDE6ICdmbG9hdCcsXG4gIDI6ICd2ZWMyJyxcbiAgMzogJ3ZlYzMnLFxuICA0OiAndmVjNCdcbn07XG5cbmZ1bmN0aW9uIGdldFNoYWRlcnModHJhbnNpdGlvbnMpIHtcbiAgLy8gQnVpbGQgc2hhZGVyc1xuICBjb25zdCB2YXJ5aW5ncyA9IFtdO1xuICBjb25zdCBhdHRyaWJ1dGVEZWNsYXJhdGlvbnMgPSBbXTtcbiAgY29uc3QgdW5pZm9ybXNEZWNsYXJhdGlvbnMgPSBbXTtcbiAgY29uc3QgdmFyeWluZ0RlY2xhcmF0aW9ucyA9IFtdO1xuICBjb25zdCBjYWxjdWxhdGlvbnMgPSBbXTtcblxuICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gdHJhbnNpdGlvbnMpIHtcbiAgICBjb25zdCB0cmFuc2l0aW9uID0gdHJhbnNpdGlvbnNbYXR0cmlidXRlTmFtZV07XG4gICAgY29uc3QgYXR0cmlidXRlVHlwZSA9IEFUVFJJQlVURV9NQVBQSU5HW3RyYW5zaXRpb24uYXR0cmlidXRlLnNpemVdO1xuXG4gICAgaWYgKGF0dHJpYnV0ZVR5cGUpIHtcbiAgICAgIHRyYW5zaXRpb24uYnVmZmVySW5kZXggPSB2YXJ5aW5ncy5sZW5ndGg7XG4gICAgICB2YXJ5aW5ncy5wdXNoKGF0dHJpYnV0ZU5hbWUpO1xuXG4gICAgICBhdHRyaWJ1dGVEZWNsYXJhdGlvbnMucHVzaChgYXR0cmlidXRlICR7YXR0cmlidXRlVHlwZX0gJHthdHRyaWJ1dGVOYW1lfUZyb207YCk7XG4gICAgICBhdHRyaWJ1dGVEZWNsYXJhdGlvbnMucHVzaChgYXR0cmlidXRlICR7YXR0cmlidXRlVHlwZX0gJHthdHRyaWJ1dGVOYW1lfVRvO2ApO1xuICAgICAgdW5pZm9ybXNEZWNsYXJhdGlvbnMucHVzaChgdW5pZm9ybSBmbG9hdCAke2F0dHJpYnV0ZU5hbWV9VGltZTtgKTtcbiAgICAgIHZhcnlpbmdEZWNsYXJhdGlvbnMucHVzaChgdmFyeWluZyAke2F0dHJpYnV0ZVR5cGV9ICR7YXR0cmlidXRlTmFtZX07YCk7XG4gICAgICBjYWxjdWxhdGlvbnMucHVzaChgJHthdHRyaWJ1dGVOYW1lfSA9IG1peCgke2F0dHJpYnV0ZU5hbWV9RnJvbSwgJHthdHRyaWJ1dGVOYW1lfVRvLFxuICAgICAgICAke2F0dHJpYnV0ZU5hbWV9VGltZSk7YCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdnMgPSBgXG4jZGVmaW5lIFNIQURFUl9OQU1FIGZlZWRiYWNrLXZlcnRleC1zaGFkZXJcbiR7YXR0cmlidXRlRGVjbGFyYXRpb25zLmpvaW4oJ1xcbicpfVxuJHt1bmlmb3Jtc0RlY2xhcmF0aW9ucy5qb2luKCdcXG4nKX1cbiR7dmFyeWluZ0RlY2xhcmF0aW9ucy5qb2luKCdcXG4nKX1cblxudm9pZCBtYWluKHZvaWQpIHtcbiAgJHtjYWxjdWxhdGlvbnMuam9pbignXFxuJyl9XG4gIGdsX1Bvc2l0aW9uID0gdmVjNCgwLjApO1xufVxuYDtcblxuICBjb25zdCBmcyA9IGBcXFxuI2RlZmluZSBTSEFERVJfTkFNRSBmZWVkYmFjay1mcmFnbWVudC1zaGFkZXJcblxuI2lmZGVmIEdMX0VTXG5wcmVjaXNpb24gaGlnaHAgZmxvYXQ7XG4jZW5kaWZcblxuJHt2YXJ5aW5nRGVjbGFyYXRpb25zLmpvaW4oJ1xcbicpfVxuXG52b2lkIG1haW4odm9pZCkge1xuICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAuMCk7XG59XG5gO1xuICByZXR1cm4ge3ZzLCBmcywgdmFyeWluZ3N9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdHRyaWJ1dGVUcmFuc2l0aW9uTW9kZWwgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKGdsLCB7aWQsIHRyYW5zaXRpb25zfSkge1xuICAgIHN1cGVyKFxuICAgICAgZ2wsXG4gICAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGRyYXdNb2RlOiBHTC5QT0lOVFNcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB2ZXJ0ZXhDb3VudDogMCxcbiAgICAgICAgICBpc0luZGV4ZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U2hhZGVycyh0cmFuc2l0aW9ucylcbiAgICAgIClcbiAgICApO1xuXG4gICAgdGhpcy5zZXRUcmFuc2l0aW9ucyh0cmFuc2l0aW9ucyk7XG4gIH1cblxuICAvLyBVcGRhdGUgYXR0cmlidXRlcyBhbmQgdmVydGV4IGNvdW50XG4gIHNldFRyYW5zaXRpb25zKHRyYW5zaXRpb25zKSB7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHRyYW5zaXRpb25zKSB7XG4gICAgICBjb25zdCB7ZnJvbVN0YXRlLCB0b1N0YXRlLCBhdHRyaWJ1dGV9ID0gdHJhbnNpdGlvbnNbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlcyh7XG4gICAgICAgIFtgJHthdHRyaWJ1dGVOYW1lfUZyb21gXTogZnJvbVN0YXRlLFxuICAgICAgICBbYCR7YXR0cmlidXRlTmFtZX1Ub2BdOiB0b1N0YXRlXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5zZXRWZXJ0ZXhDb3VudChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICAgIH1cbiAgfVxufVxuIl19