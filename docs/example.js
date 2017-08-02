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
        field_values: [{ text: 'Daemon', url: 'https://www.amazon.com/DAEMON-Daniel-Suarez/dp/0451228731' }]
      }, {
        label: 'Creator',
        field_values: [{ text: 'Daniel Suarez' }]
      }, {
        label: 'Flergh',
        delimiter: '<br />',
        field_values: [{ text: 'Blerch', url: 'https://glerpflergdrpdrp.com' }, { text: 'Thwap', url: 'http://thwapperspthhddthhter.com' }]
      }, {
        label: 'Fiscal Sponsor',
        field_values: [{ text: 'Grant provided to the Minnesota Digital Library Coalition through the Library Services and Technology Act (LSTA) and the State Library Services and School Technology unit of the Minnesota Department of Education' }]
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
    }, {
      focus: false,
      type: 'download',
      label: 'Download',
      fields: [{
        thumbnail: 'http://lib-mdl-dev.oit.umn.edu/thumbnails/penn:89',
        sources: [{
          label: 'Download (75x75)',
          src: 'http://reflections.mndigital.org/digital/iiif/penn/89/full/75,75/0/default.jpg'
        }, {
          label: 'Download (150x150)',
          src: 'http://reflections.mndigital.org/digital/iiif/penn/89/full/150,150/0/default.jpg'
        }, {
          label: 'Download (800x800)',
          src: 'http://reflections.mndigital.org/digital/iiif/penn/89/full/800,800/0/default.jpg'
        }]
      }, {
        thumbnail: 'http://lib-mdl-dev.oit.umn.edu/thumbnails/penn:152',
        sources: [{
          label: 'Download (75x75)',
          src: 'http://reflections.mndigital.org/digital/iiif/penn/152/full/75,75/0/default.jpg'
        }, {
          label: 'Download (150x150)',
          src: 'http://reflections.mndigital.org/digital/iiif/penn/152/full/150,150/0/default.jpg'
        }, {
          label: 'Download (800x800)',
          src: 'http://reflections.mndigital.org/digital/iiif/penn/152/full/800,800/0/default.jpg'
        }]
      }, {
        thumbnail: 'http://lib-mdl-dev.oit.umn.edu/thumbnails/nemhc:4971',
        sources: [{
          label: 'Download (75x75)',
          src: 'http://reflections.mndigital.org/digital/iiif/nemhc/4971/full/75,75/0/default.jpg'
        }, {
          label: 'Download (150x150)',
          src: 'http://reflections.mndigital.org/digital/iiif/nemhc/4971/full/150,150/0/default.jpg'
        }, {
          label: 'Download (800x800)',
          src: 'http://reflections.mndigital.org/digital/iiif/nemhc/4971/full/800,800/0/default.jpg'
        }]
      }]
    }, {
      focus: false,
      type: 'transcript',
      label: 'Transcript',
      transcript: 'This is a transcript of something or other'
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL3NyYy9leGFtcGxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQUksT0FBTyxJQUFJLElBQUosRUFBWDs7QUFFQSxJQUFJLE1BQU0sZ0JBQU0sV0FBTixDQUFrQjtBQUFBO0FBQzNCLFFBRDJCLG9CQUNqQjtBQUNQLFFBQU0sUUFDRixDQUNFO0FBQ0UsYUFBTyxJQURUO0FBRUUsWUFBTSxTQUZSO0FBR0UsYUFBTyxTQUhUO0FBSUUsY0FDRSxDQUNFO0FBQ0UsZUFBTyxPQURUO0FBRUUsc0JBQWMsQ0FDWixFQUFDLE1BQU0sUUFBUCxFQUFpQixLQUFLLDJEQUF0QixFQURZO0FBRmhCLE9BREYsRUFPRTtBQUNFLGVBQU8sU0FEVDtBQUVFLHNCQUFjLENBQ1osRUFBQyxNQUFNLGVBQVAsRUFEWTtBQUZoQixPQVBGLEVBYUU7QUFDRSxlQUFPLFFBRFQ7QUFFRSxtQkFBVyxRQUZiO0FBR0Usc0JBQWMsQ0FDWixFQUFDLE1BQU0sUUFBUCxFQUFpQixLQUFLLDhCQUF0QixFQURZLEVBRVosRUFBQyxNQUFNLE9BQVAsRUFBZ0IsS0FBSyxrQ0FBckIsRUFGWTtBQUhoQixPQWJGLEVBcUJFO0FBQ0UsZUFBTyxnQkFEVDtBQUVFLHNCQUFjLENBQ1osRUFBQyxNQUFNLHFOQUFQLEVBRFk7QUFGaEIsT0FyQkY7QUFMSixLQURGLEVBbUNFO0FBQ0UsYUFBTyxLQURUO0FBRUUsWUFBTSxVQUZSO0FBR0UsYUFBTyxVQUhUO0FBSUUsY0FDRTtBQUNFLGtCQUFVLENBQUMsRUFBRCxDQURaO0FBRUUsc0JBQ0U7QUFDRSxtQkFBUyxNQURYO0FBRUUsb0JBQVUseUJBRlo7QUFHRSx5QkFBZSxZQUhqQjtBQUlFLGlCQUFPLGtCQUpUO0FBS0UsZ0JBQU0sT0FMUjtBQU1FLHVCQUFhLG1CQU5mO0FBT0UsbUJBQVMsQ0FBQyxNQUFELEVBQVMsTUFBVCxDQVBYO0FBUUUscUNBQTJCLGFBUjdCO0FBU0UsZUFBSyw2QkFUUDtBQVVFLHdCQUFjLEtBQUssR0FBTDtBQVZoQjtBQUhKO0FBTEosS0FuQ0YsRUF5REk7QUFDRSxhQUFPLEtBRFQ7QUFFRSxZQUFNLFVBRlI7QUFHRSxhQUFPLFVBSFQ7QUFJRSxjQUNFLENBQ0U7QUFDRSxtQkFBVyxtREFEYjtBQUVFLGlCQUFTLENBQ1A7QUFDRSxpQkFBTyxrQkFEVDtBQUVFLGVBQUs7QUFGUCxTQURPLEVBS1A7QUFDRSxpQkFBTyxvQkFEVDtBQUVFLGVBQUs7QUFGUCxTQUxPLEVBU1A7QUFDRSxpQkFBTyxvQkFEVDtBQUVFLGVBQUs7QUFGUCxTQVRPO0FBRlgsT0FERixFQWtCRTtBQUNFLG1CQUFXLG9EQURiO0FBRUUsaUJBQVMsQ0FDUDtBQUNFLGlCQUFPLGtCQURUO0FBRUUsZUFBSztBQUZQLFNBRE8sRUFLUDtBQUNFLGlCQUFPLG9CQURUO0FBRUUsZUFBSztBQUZQLFNBTE8sRUFTUDtBQUNFLGlCQUFPLG9CQURUO0FBRUUsZUFBSztBQUZQLFNBVE87QUFGWCxPQWxCRixFQW1DRTtBQUNFLG1CQUFXLHNEQURiO0FBRUUsaUJBQVMsQ0FDUDtBQUNFLGlCQUFPLGtCQURUO0FBRUUsZUFBSztBQUZQLFNBRE8sRUFLUDtBQUNFLGlCQUFPLG9CQURUO0FBRUUsZUFBSztBQUZQLFNBTE8sRUFTUDtBQUNFLGlCQUFPLG9CQURUO0FBRUUsZUFBSztBQUZQLFNBVE87QUFGWCxPQW5DRjtBQUxKLEtBekRKLEVBb0hNO0FBQ0UsYUFBTyxLQURUO0FBRUUsWUFBTSxZQUZSO0FBR0UsYUFBTyxZQUhUO0FBSUUsa0JBQVk7QUFKZCxLQXBITixDQURKO0FBNEhGLFdBQVE7QUFBQTtBQUFBO0FBQUssK0RBQWUsT0FBTyxLQUF0QjtBQUFMLEtBQVI7QUFFQTtBQWhJMEIsQ0FBbEIsQ0FBVjs7QUFtSUEsbUJBQVMsTUFBVCxDQUFnQiw4QkFBQyxHQUFELE9BQWhCLEVBQXlCLFNBQVMsY0FBVCxDQUF3QixLQUF4QixDQUF6QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJ1xuaW1wb3J0IFJlYWN0Q2l0YXRpb24gIGZyb20gJ3JlYWN0LWNpdGF0aW9uJ1xuXG5sZXQgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlciAoKSB7XG4gICAgY29uc3QgaXRlbXMgPVxuICAgICAgICBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZm9jdXM6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnZGV0YWlscycsXG4gICAgICAgICAgICBsYWJlbDogJ0RldGFpbHMnLFxuICAgICAgICAgICAgZmllbGRzOlxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6ICdUaXRsZScsXG4gICAgICAgICAgICAgICAgICBmaWVsZF92YWx1ZXM6IFtcbiAgICAgICAgICAgICAgICAgICAge3RleHQ6ICdEYWVtb24nLCB1cmw6ICdodHRwczovL3d3dy5hbWF6b24uY29tL0RBRU1PTi1EYW5pZWwtU3VhcmV6L2RwLzA0NTEyMjg3MzEnfVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6ICdDcmVhdG9yJyxcbiAgICAgICAgICAgICAgICAgIGZpZWxkX3ZhbHVlczogW1xuICAgICAgICAgICAgICAgICAgICB7dGV4dDogJ0RhbmllbCBTdWFyZXonfVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6ICdGbGVyZ2gnLFxuICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyOiAnPGJyIC8+JyxcbiAgICAgICAgICAgICAgICAgIGZpZWxkX3ZhbHVlczogW1xuICAgICAgICAgICAgICAgICAgICB7dGV4dDogJ0JsZXJjaCcsIHVybDogJ2h0dHBzOi8vZ2xlcnBmbGVyZ2RycGRycC5jb20nfSxcbiAgICAgICAgICAgICAgICAgICAge3RleHQ6ICdUaHdhcCcsIHVybDogJ2h0dHA6Ly90aHdhcHBlcnNwdGhoZGR0aGh0ZXIuY29tJ31cbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRmlzY2FsIFNwb25zb3InLFxuICAgICAgICAgICAgICAgICAgZmllbGRfdmFsdWVzOiBbXG4gICAgICAgICAgICAgICAgICAgIHt0ZXh0OiAnR3JhbnQgcHJvdmlkZWQgdG8gdGhlIE1pbm5lc290YSBEaWdpdGFsIExpYnJhcnkgQ29hbGl0aW9uIHRocm91Z2ggdGhlIExpYnJhcnkgU2VydmljZXMgYW5kIFRlY2hub2xvZ3kgQWN0IChMU1RBKSBhbmQgdGhlIFN0YXRlIExpYnJhcnkgU2VydmljZXMgYW5kIFNjaG9vbCBUZWNobm9sb2d5IHVuaXQgb2YgdGhlIE1pbm5lc290YSBEZXBhcnRtZW50IG9mIEVkdWNhdGlvbid9XG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZvY3VzOiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6ICdjaXRhdGlvbicsXG4gICAgICAgICAgICBsYWJlbDogJ0NpdGF0aW9uJyxcbiAgICAgICAgICAgIGZpZWxkczpcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hcHBpbmdzOiBbe31dLFxuICAgICAgICAgICAgICAgIGZpZWxkX3ZhbHVlczpcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRvcjogJ0ZyZWQnLFxuICAgICAgICAgICAgICAgICAgICByZWZfbmFtZTogJ1VuaXZlcnNpdHkgb2YgTWlubmVzb3RhJyxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25fZGF0ZTogJzA5LzAxLzIwMDEnLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0ZyZWQgYW5kIGhpcyBkb2cnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0EgYm95IGFuZCBoaXMgZG9nJyxcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdDogWydkb2dzJywgJ2NhdHMnXSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJpYnV0aW5nX29yZ2FuaXphdGlvbjogJ0ZyZWQgYW5kIGNvJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5leGFtcGxlLmNvbS9mcmVkJyxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9kYXRlOiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGZvY3VzOiBmYWxzZSxcbiAgICAgICAgICAgICAgdHlwZTogJ2Rvd25sb2FkJyxcbiAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCcsXG4gICAgICAgICAgICAgIGZpZWxkczpcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbDogJ2h0dHA6Ly9saWItbWRsLWRldi5vaXQudW1uLmVkdS90aHVtYm5haWxzL3Blbm46ODknLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCAoNzV4NzUpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9yZWZsZWN0aW9ucy5tbmRpZ2l0YWwub3JnL2RpZ2l0YWwvaWlpZi9wZW5uLzg5L2Z1bGwvNzUsNzUvMC9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQgKDE1MHgxNTApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9yZWZsZWN0aW9ucy5tbmRpZ2l0YWwub3JnL2RpZ2l0YWwvaWlpZi9wZW5uLzg5L2Z1bGwvMTUwLDE1MC8wL2RlZmF1bHQuanBnJ1xuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCAoODAweDgwMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cDovL3JlZmxlY3Rpb25zLm1uZGlnaXRhbC5vcmcvZGlnaXRhbC9paWlmL3Blbm4vODkvZnVsbC84MDAsODAwLzAvZGVmYXVsdC5qcGcnXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWw6ICdodHRwOi8vbGliLW1kbC1kZXYub2l0LnVtbi5lZHUvdGh1bWJuYWlscy9wZW5uOjE1MicsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0Rvd25sb2FkICg3NXg3NSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cDovL3JlZmxlY3Rpb25zLm1uZGlnaXRhbC5vcmcvZGlnaXRhbC9paWlmL3Blbm4vMTUyL2Z1bGwvNzUsNzUvMC9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQgKDE1MHgxNTApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9yZWZsZWN0aW9ucy5tbmRpZ2l0YWwub3JnL2RpZ2l0YWwvaWlpZi9wZW5uLzE1Mi9mdWxsLzE1MCwxNTAvMC9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQgKDgwMHg4MDApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9yZWZsZWN0aW9ucy5tbmRpZ2l0YWwub3JnL2RpZ2l0YWwvaWlpZi9wZW5uLzE1Mi9mdWxsLzgwMCw4MDAvMC9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbDogJ2h0dHA6Ly9saWItbWRsLWRldi5vaXQudW1uLmVkdS90aHVtYm5haWxzL25lbWhjOjQ5NzEnLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCAoNzV4NzUpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9yZWZsZWN0aW9ucy5tbmRpZ2l0YWwub3JnL2RpZ2l0YWwvaWlpZi9uZW1oYy80OTcxL2Z1bGwvNzUsNzUvMC9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQgKDE1MHgxNTApJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHA6Ly9yZWZsZWN0aW9ucy5tbmRpZ2l0YWwub3JnL2RpZ2l0YWwvaWlpZi9uZW1oYy80OTcxL2Z1bGwvMTUwLDE1MC8wL2RlZmF1bHQuanBnJ1xuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCAoODAweDgwMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cDovL3JlZmxlY3Rpb25zLm1uZGlnaXRhbC5vcmcvZGlnaXRhbC9paWlmL25lbWhjLzQ5NzEvZnVsbC84MDAsODAwLzAvZGVmYXVsdC5qcGcnXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9jdXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHR5cGU6ICd0cmFuc2NyaXB0JyxcbiAgICAgICAgICAgICAgICBsYWJlbDogJ1RyYW5zY3JpcHQnLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6ICdUaGlzIGlzIGEgdHJhbnNjcmlwdCBvZiBzb21ldGhpbmcgb3Igb3RoZXInXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG5cdFx0cmV0dXJuICg8ZGl2PjxSZWFjdENpdGF0aW9uIGl0ZW1zPXtpdGVtc30gLz48L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuUmVhY3RET00ucmVuZGVyKDxBcHAgLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKSk7XG4iXX0=
