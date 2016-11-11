require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactCitation = require('react-citation');

var _reactCitation2 = _interopRequireDefault(_reactCitation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var date = new Date();

var App = _react2.default.createClass({
  displayName: 'App',
  render: function render() {
    var items = [{
      focus: true,
      type: 'details',
      label: 'Details',
      fields: [{
        label: 'Title',
        delimiter: ', ',
        field_values: [{ text: 'Daemon', url: 'https://www.amazon.com/DAEMON-Daniel-Suarez/dp/0451228731' }]
      }, {
        label: 'Creator',
        field_values: [{ text: 'Daniel Suarez' }]
      }]
    }, {
      focus: false,
      type: 'citation',
      label: 'Citation',
      fields: {
        mappings: [{}],
        field_values: {
          creator: 'Fred',
          ref_name: 'University of Minnesota',
          creation_date: '09/01/2001',
          title: 'Fred and his dog',
          description: 'A boy and his dog',
          subject: ['dogs', 'cats'],
          contributing_organization: 'Fred and co',
          url: 'http://www.example.com/fred',
          current_date: Date.now()
        }
      }
    }];
    return _react2.default.createElement(
      'div',
      null,
      _react2.default.createElement(_reactCitation2.default, { items: items })
    );
  }
});

_reactDom2.default.render(_react2.default.createElement(App, null), document.getElementById('app'));

},{"react":undefined,"react-citation":undefined,"react-dom":undefined}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL3NyYy9leGFtcGxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQUksT0FBTyxJQUFJLElBQUosRUFBWDs7QUFFQSxJQUFJLE1BQU0sZ0JBQU0sV0FBTixDQUFrQjtBQUFBO0FBQzNCLFFBRDJCLG9CQUNqQjtBQUNQLFFBQU0sUUFDRixDQUNFO0FBQ0UsYUFBTyxJQURUO0FBRUUsWUFBTSxTQUZSO0FBR0UsYUFBTyxTQUhUO0FBSUUsY0FDRSxDQUNFO0FBQ0UsZUFBTyxPQURUO0FBRUUsbUJBQVcsSUFGYjtBQUdFLHNCQUFjLENBQ1osRUFBQyxNQUFNLFFBQVAsRUFBaUIsS0FBSywyREFBdEIsRUFEWTtBQUhoQixPQURGLEVBUUU7QUFDRSxlQUFPLFNBRFQ7QUFFRSxzQkFBYyxDQUNaLEVBQUMsTUFBTSxlQUFQLEVBRFk7QUFGaEIsT0FSRjtBQUxKLEtBREYsRUFzQkU7QUFDRSxhQUFPLEtBRFQ7QUFFRSxZQUFNLFVBRlI7QUFHRSxhQUFPLFVBSFQ7QUFJRSxjQUNFO0FBQ0Usa0JBQVUsQ0FBQyxFQUFELENBRFo7QUFFRSxzQkFDRTtBQUNFLG1CQUFTLE1BRFg7QUFFRSxvQkFBVSx5QkFGWjtBQUdFLHlCQUFlLFlBSGpCO0FBSUUsaUJBQU8sa0JBSlQ7QUFLRSx1QkFBYSxtQkFMZjtBQU1FLG1CQUFTLENBQUMsTUFBRCxFQUFTLE1BQVQsQ0FOWDtBQU9FLHFDQUEyQixhQVA3QjtBQVFFLGVBQUssNkJBUlA7QUFTRSx3QkFBYyxLQUFLLEdBQUw7QUFUaEI7QUFISjtBQUxKLEtBdEJGLENBREo7QUE2Q0YsV0FBUTtBQUFBO0FBQUE7QUFBSywrREFBZSxPQUFPLEtBQXRCO0FBQUwsS0FBUjtBQUVBO0FBakQwQixDQUFsQixDQUFWOztBQW9EQSxtQkFBUyxNQUFULENBQWdCLDhCQUFDLEdBQUQsT0FBaEIsRUFBeUIsU0FBUyxjQUFULENBQXdCLEtBQXhCLENBQXpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQgUmVhY3RDaXRhdGlvbiAgZnJvbSAncmVhY3QtY2l0YXRpb24nXG5cbmxldCBkYXRlID0gbmV3IERhdGUoKTtcblxudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyICgpIHtcbiAgICBjb25zdCBpdGVtcyA9IFxuICAgICAgICBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZm9jdXM6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnZGV0YWlscycsXG4gICAgICAgICAgICBsYWJlbDogJ0RldGFpbHMnLFxuICAgICAgICAgICAgZmllbGRzOiBcbiAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVGl0bGUnLFxuICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyOiAnLCAnLFxuICAgICAgICAgICAgICAgICAgZmllbGRfdmFsdWVzOiBbXG4gICAgICAgICAgICAgICAgICAgIHt0ZXh0OiAnRGFlbW9uJywgdXJsOiAnaHR0cHM6Ly93d3cuYW1hem9uLmNvbS9EQUVNT04tRGFuaWVsLVN1YXJlei9kcC8wNDUxMjI4NzMxJ31cbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQ3JlYXRvcicsXG4gICAgICAgICAgICAgICAgICBmaWVsZF92YWx1ZXM6IFtcbiAgICAgICAgICAgICAgICAgICAge3RleHQ6ICdEYW5pZWwgU3VhcmV6J31cbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZm9jdXM6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ2NpdGF0aW9uJyxcbiAgICAgICAgICAgIGxhYmVsOiAnQ2l0YXRpb24nLFxuICAgICAgICAgICAgZmllbGRzOiBcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hcHBpbmdzOiBbe31dLFxuICAgICAgICAgICAgICAgIGZpZWxkX3ZhbHVlczpcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRvcjogJ0ZyZWQnLFxuICAgICAgICAgICAgICAgICAgICByZWZfbmFtZTogJ1VuaXZlcnNpdHkgb2YgTWlubmVzb3RhJyxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25fZGF0ZTogJzA5LzAxLzIwMDEnLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0ZyZWQgYW5kIGhpcyBkb2cnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0EgYm95IGFuZCBoaXMgZG9nJyxcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdDogWydkb2dzJywgJ2NhdHMnXSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJpYnV0aW5nX29yZ2FuaXphdGlvbjogJ0ZyZWQgYW5kIGNvJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5leGFtcGxlLmNvbS9mcmVkJyxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9kYXRlOiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gICAgICAgICAgICBcbiAgICAgICAgICBdXG5cdFx0cmV0dXJuICg8ZGl2PjxSZWFjdENpdGF0aW9uIGl0ZW1zPXtpdGVtc30gLz48L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuUmVhY3RET00ucmVuZGVyKDxBcHAgLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKSk7XG4iXX0=
