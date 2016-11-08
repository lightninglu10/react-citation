'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = citationRender;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function citationRender(CitationFormat) {
  return function (_React$Component) {
    _inherits(Citation, _React$Component);

    function Citation(props) {
      _classCallCheck(this, Citation);

      var _this = _possibleConstructorReturn(this, (Citation.__proto__ || Object.getPrototypeOf(Citation)).call(this, props));

      _this.render_citation = _this.render_citation.bind(_this);
      _this.format = _this.format.bind(_this);
      return _this;
    }

    _createClass(Citation, [{
      key: 'affix',
      value: function affix(value, prefix, suffix) {
        return value ? prefix + value + suffix : '';
      }
    }, {
      key: 'format',
      value: function format(value) {
        var formatters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [function (value) {
          return value;
        }];

        return formatters.map(function (formatter) {
          return formatter(value);
        }, value);
      }
    }, {
      key: 'render_citation',
      value: function render_citation(mappings) {
        var affix = this.affix;
        var props = this.props;
        var format = this.format;
        return _react2.default.createElement(
          'span',
          { 'class': 'citation' },
          mappings.map(function (field, i) {
            var field_name = Object.keys(field)[0];
            var config = field[field_name];
            return affix(format(props[field_name], config.formatters), config.prefix, config.suffix);
          })
        );
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement(CitationFormat, _extends({}, this.props, { render_citation: this.render_citation }));
      }
    }]);

    return Citation;
  }(_react2.default.Component);
}