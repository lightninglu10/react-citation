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
          type: 'image',
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL3NyYy9leGFtcGxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQUksT0FBTyxJQUFJLElBQUosRUFBWDs7QUFFQSxJQUFJLE1BQU0sZ0JBQU0sV0FBTixDQUFrQjtBQUFBO0FBQzNCLFFBRDJCLG9CQUNqQjtBQUNQLFFBQU0sUUFDRixDQUNFO0FBQ0UsYUFBTyxJQURUO0FBRUUsWUFBTSxTQUZSO0FBR0UsYUFBTyxTQUhUO0FBSUUsY0FDRSxDQUNFO0FBQ0UsZUFBTyxPQURUO0FBRUUsbUJBQVcsSUFGYjtBQUdFLHNCQUFjLENBQ1osRUFBQyxNQUFNLFFBQVAsRUFBaUIsS0FBSywyREFBdEIsRUFEWTtBQUhoQixPQURGLEVBUUU7QUFDRSxlQUFPLFNBRFQ7QUFFRSxzQkFBYyxDQUNaLEVBQUMsTUFBTSxlQUFQLEVBRFk7QUFGaEIsT0FSRjtBQUxKLEtBREYsRUFzQkU7QUFDRSxhQUFPLEtBRFQ7QUFFRSxZQUFNLFVBRlI7QUFHRSxhQUFPLFVBSFQ7QUFJRSxjQUNFO0FBQ0Usa0JBQVUsQ0FBQyxFQUFELENBRFo7QUFFRSxzQkFDRTtBQUNFLG1CQUFTLE1BRFg7QUFFRSxvQkFBVSx5QkFGWjtBQUdFLHlCQUFlLFlBSGpCO0FBSUUsaUJBQU8sa0JBSlQ7QUFLRSxnQkFBTSxPQUxSO0FBTUUsdUJBQWEsbUJBTmY7QUFPRSxtQkFBUyxDQUFDLE1BQUQsRUFBUyxNQUFULENBUFg7QUFRRSxxQ0FBMkIsYUFSN0I7QUFTRSxlQUFLLDZCQVRQO0FBVUUsd0JBQWMsS0FBSyxHQUFMO0FBVmhCO0FBSEo7QUFMSixLQXRCRixDQURKO0FBOENGLFdBQVE7QUFBQTtBQUFBO0FBQUssK0RBQWUsT0FBTyxLQUF0QjtBQUFMLEtBQVI7QUFFQTtBQWxEMEIsQ0FBbEIsQ0FBVjs7QUFxREEsbUJBQVMsTUFBVCxDQUFnQiw4QkFBQyxHQUFELE9BQWhCLEVBQXlCLFNBQVMsY0FBVCxDQUF3QixLQUF4QixDQUF6QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJ1xuaW1wb3J0IFJlYWN0Q2l0YXRpb24gIGZyb20gJ3JlYWN0LWNpdGF0aW9uJ1xuXG5sZXQgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlciAoKSB7XG4gICAgY29uc3QgaXRlbXMgPSBcbiAgICAgICAgW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZvY3VzOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ2RldGFpbHMnLFxuICAgICAgICAgICAgbGFiZWw6ICdEZXRhaWxzJyxcbiAgICAgICAgICAgIGZpZWxkczogXG4gICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ1RpdGxlJyxcbiAgICAgICAgICAgICAgICAgIGRlbGltaXRlcjogJywgJyxcbiAgICAgICAgICAgICAgICAgIGZpZWxkX3ZhbHVlczogW1xuICAgICAgICAgICAgICAgICAgICB7dGV4dDogJ0RhZW1vbicsIHVybDogJ2h0dHBzOi8vd3d3LmFtYXpvbi5jb20vREFFTU9OLURhbmllbC1TdWFyZXovZHAvMDQ1MTIyODczMSd9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ0NyZWF0b3InLFxuICAgICAgICAgICAgICAgICAgZmllbGRfdmFsdWVzOiBbXG4gICAgICAgICAgICAgICAgICAgIHt0ZXh0OiAnRGFuaWVsIFN1YXJleid9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZvY3VzOiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6ICdjaXRhdGlvbicsXG4gICAgICAgICAgICBsYWJlbDogJ0NpdGF0aW9uJyxcbiAgICAgICAgICAgIGZpZWxkczogXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXBwaW5nczogW3t9XSxcbiAgICAgICAgICAgICAgICBmaWVsZF92YWx1ZXM6XG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0b3I6ICdGcmVkJyxcbiAgICAgICAgICAgICAgICAgICAgcmVmX25hbWU6ICdVbml2ZXJzaXR5IG9mIE1pbm5lc290YScsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0aW9uX2RhdGU6ICcwOS8wMS8yMDAxJyxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdGcmVkIGFuZCBoaXMgZG9nJyxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBIGJveSBhbmQgaGlzIGRvZycsXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3Q6IFsnZG9ncycsICdjYXRzJ10sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyaWJ1dGluZ19vcmdhbml6YXRpb246ICdGcmVkIGFuZCBjbycsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJ2h0dHA6Ly93d3cuZXhhbXBsZS5jb20vZnJlZCcsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfZGF0ZTogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ICAgICAgICAgICAgXG4gICAgICAgICAgXVxuXHRcdHJldHVybiAoPGRpdj48UmVhY3RDaXRhdGlvbiBpdGVtcz17aXRlbXN9IC8+PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cblJlYWN0RE9NLnJlbmRlcig8QXBwIC8+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJykpO1xuIl19
