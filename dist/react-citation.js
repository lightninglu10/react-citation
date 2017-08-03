(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.reactCitation = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationChicago = function (_React$Component) {
  _inherits(CitationChicago, _React$Component);

  function CitationChicago(props) {
    _classCallCheck(this, CitationChicago);

    return _possibleConstructorReturn(this, (CitationChicago.__proto__ || Object.getPrototypeOf(CitationChicago)).call(this, props));
  }

  _createClass(CitationChicago, [{
    key: 'mappings',
    value: function mappings() {
      var map = [{ creator: { prefix: '', suffix: '.' } }, { creation_date: { prefix: ' ', suffix: '. ' } }, { title: { prefix: '"', suffix: '." ' } }, { contributing_organization: { prefix: ' ', suffix: ', ' } }, { current_date: { prefix: 'Accessed ', suffix: '. ', formatters: [this.format_date] } }, { url: { prefix: '', suffix: '' } }];
      return map;
    }
  }, {
    key: 'format_date',
    value: function format_date(timestamp) {
      var date = new Date(timestamp);
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var month = months[date.getMonth()];
      var year = date.getFullYear();
      var day = date.getDate();
      return month + ' ' + day + ', ' + year;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render_citation({ mappings: this.mappings() });
    }
  }]);

  return CitationChicago;
}(_react2.default.Component);

var propTypes = {
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.string,
  contributing_organization: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationChicago.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationChicago);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-citation-render":4}],2:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationCoins = function (_React$Component) {
  _inherits(CitationCoins, _React$Component);

  function CitationCoins(props) {
    _classCallCheck(this, CitationCoins);

    var _this = _possibleConstructorReturn(this, (CitationCoins.__proto__ || Object.getPrototypeOf(CitationCoins)).call(this, props));

    _this.mappings = _this.mappings.bind(_this);
    return _this;
  }

  _createClass(CitationCoins, [{
    key: 'mulitvalue_field',
    value: function mulitvalue_field(values) {
      values.join(',');
    }
  }, {
    key: 'mappings',
    value: function mappings() {
      var defaultMapping = [{ creator: { prefix: '&amp;rft.creator', suffix: '', formatters: [encodeURIComponent] } }, { creation_date: { prefix: ' ', suffix: '.', formatters: [encodeURIComponent] } }, { title: { prefix: '&amp;rft.title=', suffix: '', formatters: [encodeURIComponent] } }, { description: { prefix: '&amp;rft.description=', suffix: '', formatters: [encodeURIComponent] } }, { subject: { prefix: '&amp;rft.subject=', suffix: '', formatters: [this.mulitvalue_field, encodeURIComponent] } }, { description: { prefix: '&amp;rft.description=', suffix: '', formatters: [encodeURIComponent] } }, { contributing_organization: { prefix: 'publisher', suffix: '', formatters: [encodeURIComponent] } }, { type: { prefix: '&amp;rft.type=', suffix: '', formatters: [encodeURIComponent] } }, { format: { prefix: '&amp;rft.format=', suffix: '', formatters: [encodeURIComponent] } }, { rights: { prefix: '&amp;rft.rights=', suffix: '', formatters: [encodeURIComponent] } }, { url: { prefix: '&amp;rft.identifier=', suffix: '', formatters: [encodeURIComponent] } }];
      return this.props.override_mappings(defaultMapping);
    }
  }, {
    key: 'render',
    value: function render() {
      var title = "ctx_ver=Z39.88-2004&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Adc";
      return this.props.render_citation({ prefix: '<span className="Z3988" title=' + title, suffix: '</span>', mappings: this.mappings(), render_html: true });
    }
  }]);

  return CitationCoins;
}(_react2.default.Component);

var propTypes = {
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.string,
  description: _react2.default.PropTypes.string,
  contributing_organization: _react2.default.PropTypes.string,
  type: _react2.default.PropTypes.string,
  format: _react2.default.PropTypes.string,
  rights: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationCoins.defaultProps = {
  mappings: [{}]
};

CitationCoins.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationCoins);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-citation-render":4}],3:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationMla = function (_React$Component) {
  _inherits(CitationMla, _React$Component);

  function CitationMla(props) {
    _classCallCheck(this, CitationMla);

    return _possibleConstructorReturn(this, (CitationMla.__proto__ || Object.getPrototypeOf(CitationMla)).call(this, props));
  }

  _createClass(CitationMla, [{
    key: 'italicize',
    value: function italicize(text) {
      return '<i>' + text + '</i>';
    }
  }, {
    key: 'removeProtocols',
    value: function removeProtocols(url) {
      return url.replace(/http:\/\/|https:\/\//i, '');
    }
  }, {
    key: 'format_date',
    value: function format_date(timestamp) {
      var date = new Date(timestamp);
      var months = ['Jan', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
      var month = months[date.getMonth()];
      var year = date.getFullYear();
      var day = date.getDate();
      return day + ' ' + month + ' ' + year;
    }
  }, {
    key: 'mappings',
    value: function mappings() {
      var map = [{ creator: { prefix: '', suffix: '.' } }, { title: { prefix: ' ', suffix: '.', formatters: [this.italicize] } }, { creation_date: { prefix: ' ', suffix: '.' } }, { contributing_organization: { prefix: ' ', suffix: ', ' } }, { url: { prefix: '', suffix: '', formatters: [this.removeProtocols] } }, { current_date: { prefix: ' Accessed ', suffix: '.', formatters: [this.format_date] } }];
      return map;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render_citation({ mappings: this.mappings(), render_html: true });
    }
  }]);

  return CitationMla;
}(_react2.default.Component);

var propTypes = {
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.object,
  contributing_organization: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationMla.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationMla);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-citation-render":4}],4:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = citationRender;

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

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
      _this._format = _this._format.bind(_this);
      _this.override_mappings = _this.override_mappings.bind(_this);
      _this._override_mapping = _this._override_mapping.bind(_this);
      _this._values = _this._values.bind(_this);
      return _this;
    }

    _createClass(Citation, [{
      key: 'override_mappings',
      value: function override_mappings(mappings) {
        var _this2 = this;

        return mappings.map(function (mapping) {
          return _this2._override_mapping(mapping)[0];
        });
        return mapped;
      }
    }, {
      key: 'render_citation',
      value: function render_citation(_ref) {
        var _ref$mappings = _ref.mappings,
            mappings = _ref$mappings === undefined ? [] : _ref$mappings,
            _ref$render_html = _ref.render_html,
            render_html = _ref$render_html === undefined ? false : _ref$render_html,
            _ref$prefix = _ref.prefix,
            prefix = _ref$prefix === undefined ? '' : _ref$prefix,
            _ref$suffix = _ref.suffix,
            suffix = _ref$suffix === undefined ? '' : _ref$suffix;

        if (render_html) {
          return _react2.default.createElement(
            'span',
            null,
            _react2.default.createElement('div', { dangerouslySetInnerHTML: { __html: prefix + this._values(mappings) + suffix } })
          );
        } else {
          return _react2.default.createElement(
            'span',
            null,
            prefix,
            this._values(mappings),
            prefix
          );
        }
      }
    }, {
      key: '_values',
      value: function _values(mappings) {
        var affix = this._affix;
        var format = this._format;
        var props = this.props;
        var values = [];
        mappings.map(function (field, i) {
          var field_name = Object.keys(field)[0];
          var val = props.field_values[field_name];
          if (val) {
            var config = field[field_name];
            var formatted = format(val, config.formatters);
            values.push(affix(formatted, config.prefix, config.suffix));
          }
        });
        return values.join('');
      }
    }, {
      key: '_affix',
      value: function _affix(value, prefix, suffix) {
        return value ? prefix + value + suffix : '';
      }
    }, {
      key: '_format',
      value: function _format(value) {
        var formatters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [function (value) {
          return value;
        }];

        return formatters.map(function (formatter) {
          return formatter(value);
        }, value);
      }
    }, {
      key: '_override_mapping',
      value: function _override_mapping(mapping) {
        return this.props.mappings.map(function (mapping_override) {
          if (mapping[Object.keys(mapping_override)[0]]) {
            return mapping_override;
          } else {
            return mapping;
          }
        });
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement(CitationFormat, _extends({}, this.props, {
          override_mappings: this.override_mappings,
          render_citation: this.render_citation }));
      }
    }]);

    return Citation;
  }(_react2.default.Component);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeCitationRender = require('./cite-citation-render');

var _citeCitationRender2 = _interopRequireDefault(_citeCitationRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CitationWikipedia = function (_React$Component) {
  _inherits(CitationWikipedia, _React$Component);

  function CitationWikipedia(props) {
    _classCallCheck(this, CitationWikipedia);

    return _possibleConstructorReturn(this, (CitationWikipedia.__proto__ || Object.getPrototypeOf(CitationWikipedia)).call(this, props));
  }

  _createClass(CitationWikipedia, [{
    key: 'removeProtocols',
    value: function removeProtocols(url) {
      return url.replace(/http:\/\/|https:\/\//i, '');
    }
  }, {
    key: 'mappings',
    value: function mappings() {
      var map = [{ ref_name: { prefix: '<ref name=', suffix: '> {{' } }, { url: { prefix: 'cite web | url=', suffix: '' } }, { type: { prefix: ' | title= (', suffix: ') ' } }, { title: { prefix: '', suffix: ',' } }, { creation_date: { prefix: '(', suffix: ')' } }, { creator: { prefix: ' | author=', suffix: '' } }, { current_date: { prefix: ' | accessdate=', suffix: '' } }, { contributing_organization: { prefix: ' | publisher=', suffix: '}} </ref>' } }];
      return map;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render_citation({ mappings: this.mappings() });
    }
  }]);

  return CitationWikipedia;
}(_react2.default.Component);

var propTypes = {
  ref_name: _react2.default.PropTypes.string,
  creator: _react2.default.PropTypes.string,
  creation_date: _react2.default.PropTypes.string,
  title: _react2.default.PropTypes.string,
  contributing_organization: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  mapping: _react2.default.PropTypes.object
};

CitationWikipedia.propTypes = propTypes;

exports.default = (0, _citeCitationRender2.default)(CitationWikipedia);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-citation-render":4}],6:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeCitationCoins = require('./cite-citation-coins');

var _citeCitationCoins2 = _interopRequireDefault(_citeCitationCoins);

var _citeCitationChicago = require('./cite-citation-chicago');

var _citeCitationChicago2 = _interopRequireDefault(_citeCitationChicago);

var _citeCitationMla = require('./cite-citation-mla');

var _citeCitationMla2 = _interopRequireDefault(_citeCitationMla);

var _citeCitationWikipedia = require('./cite-citation-wikipedia');

var _citeCitationWikipedia2 = _interopRequireDefault(_citeCitationWikipedia);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Citation = function (_React$Component) {
  _inherits(Citation, _React$Component);

  function Citation(props) {
    _classCallCheck(this, Citation);

    var _this = _possibleConstructorReturn(this, (Citation.__proto__ || Object.getPrototypeOf(Citation)).call(this, props));

    _this._citationType = _this._citationType.bind(_this);
    return _this;
  }

  _createClass(Citation, [{
    key: '_citationType',
    value: function _citationType() {
      var fields = this.props.fields;
      switch (this.props.citationType) {
        case 'chicago':
          return _react2.default.createElement(_citeCitationChicago2.default, _extends({ className: 'chicago' }, fields));
        case 'mla':
          return _react2.default.createElement(_citeCitationMla2.default, _extends({ className: 'mla' }, fields));
        case 'wiki':
          return _react2.default.createElement(_citeCitationWikipedia2.default, _extends({ className: 'wiki' }, fields));
        default:
          return _react2.default.createElement(
            'div',
            null,
            'No Viewer Avaialable for type: ',
            this.props.citationType
          );
      }
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: 'citation' },
        this._citationType()
      );
    }
  }]);

  return Citation;
}(_react2.default.Component);

exports.default = Citation;


var propTypes = {
  fields: _react2.default.PropTypes.array,
  mapping: _react2.default.PropTypes.object
};

_citeCitationChicago2.default.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-citation-chicago":1,"./cite-citation-coins":2,"./cite-citation-mla":3,"./cite-citation-wikipedia":5}],7:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DetailsFieldValue = function (_React$Component) {
  _inherits(DetailsFieldValue, _React$Component);

  function DetailsFieldValue(props) {
    _classCallCheck(this, DetailsFieldValue);

    var _this = _possibleConstructorReturn(this, (DetailsFieldValue.__proto__ || Object.getPrototypeOf(DetailsFieldValue)).call(this, props));

    _this._field = _this._field.bind(_this);
    _this._link = _this._link.bind(_this);
    _this._danger = _this._danger.bind(_this);
    _this._delimiter = _this._delimiter.bind(_this);
    _this._text = _this._text.bind(_this);
    return _this;
  }

  _createClass(DetailsFieldValue, [{
    key: '_createMarkup',
    value: function _createMarkup(value) {
      return { __html: value };
    }
  }, {
    key: '_link',
    value: function _link() {
      return '<a href="' + this.props.url + '">' + this.props.text + '</a>';
    }
  }, {
    key: '_field',
    value: function _field() {
      if (this.props.url) {
        return this._danger(this._link());
      } else {
        return this._danger(this.props.text);
      }
    }
  }, {
    key: '_danger',
    value: function _danger(html) {
      return _react2.default.createElement('div', { dangerouslySetInnerHTML: this._createMarkup(html) });
    }
  }, {
    key: '_text',
    value: function _text() {
      return this.props.text == 'undefined' ? this._danger(this.props.text) : '';
    }
  }, {
    key: '_delimiter',
    value: function _delimiter() {
      return this.props.delimiter == 'undefined' ? this._danger(this.props.delimiter) : '';
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'span',
        null,
        this._field(),
        this._delimiter()
      );
    }
  }]);

  return DetailsFieldValue;
}(_react2.default.Component);

exports.default = DetailsFieldValue;


var propTypes = {
  text: _react2.default.PropTypes.string.isRequired,
  delimiter: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string
};

DetailsFieldValue.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeDetailsFieldValue = require('./cite-details-field-value');

var _citeDetailsFieldValue2 = _interopRequireDefault(_citeDetailsFieldValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DetailsField = function (_React$Component) {
  _inherits(DetailsField, _React$Component);

  function DetailsField(props) {
    _classCallCheck(this, DetailsField);

    return _possibleConstructorReturn(this, (DetailsField.__proto__ || Object.getPrototypeOf(DetailsField)).call(this, props));
  }

  _createClass(DetailsField, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          field_values = _props.field_values,
          label = _props.label,
          delimiter = _props.delimiter;

      var field_class = 'detail-field-' + label.replace(/\s/g, '').toLowerCase();
      return _react2.default.createElement(
        'span',
        { className: field_class },
        _react2.default.createElement(
          'dt',
          { className: 'field-label' },
          _react2.default.createElement(
            'label',
            { className: 'label label-default' },
            label,
            ':'
          )
        ),
        _react2.default.createElement(
          'dd',
          { className: 'field-definition' },
          field_values.map(function (field_value, i) {
            delimiter = i < field_values.length - 1 ? delimiter : '';
            return _react2.default.createElement(_citeDetailsFieldValue2.default, { key: i, url: field_value.url, text: field_value.text, delimiter: delimiter });
          })
        )
      );
    }
  }]);

  return DetailsField;
}(_react2.default.Component);

exports.default = DetailsField;


var propTypes = {
  label: _react2.default.PropTypes.string.isRequired,
  delimiter: _react2.default.PropTypes.string,
  url: _react2.default.PropTypes.string,
  field_values: _react2.default.PropTypes.array.isRequired
};

DetailsField.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-details-field-value":7}],9:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeDetailsField = require('./cite-details-field');

var _citeDetailsField2 = _interopRequireDefault(_citeDetailsField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Details = function (_React$Component) {
  _inherits(Details, _React$Component);

  function Details(props) {
    _classCallCheck(this, Details);

    return _possibleConstructorReturn(this, (Details.__proto__ || Object.getPrototypeOf(Details)).call(this, props));
  }

  _createClass(Details, [{
    key: 'render',
    value: function render() {
      var fields = this.props.fields;

      return _react2.default.createElement(
        'dl',
        { className: 'row details' },
        fields.map(function (field, i) {
          return _react2.default.createElement(_citeDetailsField2.default, _extends({ key: i }, field));
        })
      );
    }
  }]);

  return Details;
}(_react2.default.Component);

exports.default = Details;


var propTypes = {
  fields: _react2.default.PropTypes.array.isRequired
};

Details.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-details-field":8}],10:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteDownloadSource = function (_React$Component) {
  _inherits(CiteDownloadSource, _React$Component);

  function CiteDownloadSource(props) {
    _classCallCheck(this, CiteDownloadSource);

    return _possibleConstructorReturn(this, (CiteDownloadSource.__proto__ || Object.getPrototypeOf(CiteDownloadSource)).call(this, props));
  }

  _createClass(CiteDownloadSource, [{
    key: "render",
    value: function render() {
      var _props = this.props,
          label = _props.label,
          src = _props.src;

      return _react2.default.createElement(
        "div",
        null,
        _react2.default.createElement(
          "a",
          { href: src },
          _react2.default.createElement("span", { className: "glyphicon glyphicon-download-alt" }),
          " ",
          label
        )
      );
    }
  }]);

  return CiteDownloadSource;
}(_react2.default.Component);

exports.default = CiteDownloadSource;


var propTypes = {
  src: _react2.default.PropTypes.string.isRequired,
  label: _react2.default.PropTypes.string.isRequired
};

CiteDownloadSource.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeThumbnail = require('./cite-thumbnail');

var _citeThumbnail2 = _interopRequireDefault(_citeThumbnail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Download = function (_React$Component) {
  _inherits(Download, _React$Component);

  function Download(props) {
    _classCallCheck(this, Download);

    return _possibleConstructorReturn(this, (Download.__proto__ || Object.getPrototypeOf(Download)).call(this, props));
  }

  _createClass(Download, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          fields = _props.fields,
          label = _props.label;

      return _react2.default.createElement(
        'div',
        { className: 'row' },
        fields.map(function (field, i) {
          return _react2.default.createElement(_citeThumbnail2.default, _extends({ key: i }, field));
        })
      );
    }
  }]);

  return Download;
}(_react2.default.Component);

exports.default = Download;


var propTypes = {
  fields: _react2.default.PropTypes.array.isRequired
};

Download.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-thumbnail":14}],12:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteNavigationItem = function (_React$Component) {
  _inherits(CiteNavigationItem, _React$Component);

  function CiteNavigationItem(props) {
    _classCallCheck(this, CiteNavigationItem);

    return _possibleConstructorReturn(this, (CiteNavigationItem.__proto__ || Object.getPrototypeOf(CiteNavigationItem)).call(this, props));
  }

  _createClass(CiteNavigationItem, [{
    key: "render",
    value: function render() {
      var _props = this.props,
          active = _props.active,
          setActiveItem = _props.setActiveItem,
          label = _props.label;

      return _react2.default.createElement(
        "li",
        { role: "presentation", className: active },
        _react2.default.createElement(
          "a",
          { onClick: setActiveItem, href: "#" },
          label
        )
      );
    }
  }]);

  return CiteNavigationItem;
}(_react2.default.Component);

exports.default = CiteNavigationItem;


var propTypes = {
  label: _react2.default.PropTypes.string.isRequired,
  setActiveItem: _react2.default.PropTypes.func.isRequired,
  class_name: _react2.default.PropTypes.string
};

CiteNavigationItem.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeNavigationItem = require('./cite-navigation-item');

var _citeNavigationItem2 = _interopRequireDefault(_citeNavigationItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteNavigation = function (_React$Component) {
  _inherits(CiteNavigation, _React$Component);

  function CiteNavigation(props) {
    _classCallCheck(this, CiteNavigation);

    var _this = _possibleConstructorReturn(this, (CiteNavigation.__proto__ || Object.getPrototypeOf(CiteNavigation)).call(this, props));

    _this.active_class = _this.active_class.bind(_this);
    _this.active_index = _this.active_index.bind(_this);
    return _this;
  }

  _createClass(CiteNavigation, [{
    key: 'active_index',
    value: function active_index() {
      return this.props.getActiveItemIndex();
    }
  }, {
    key: 'active_class',
    value: function active_class(i) {
      return this.active_index() == i ? 'active' : '';
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          items = _props.items,
          class_name = _props.class_name,
          setActiveItem = _props.setActiveItem,
          getActiveItem = _props.getActiveItem;

      var active_class = this.active_class;
      var style = {};
      if (!this.props.navigation) {
        style['display'] = 'none';
      }
      return _react2.default.createElement(
        'ul',
        { className: 'citation-navigation ' + class_name, style: style },
        items.map(function (item, i) {
          return _react2.default.createElement(_citeNavigationItem2.default, { label: item.label,
            key: i,
            active: active_class(i),
            setActiveItem: setActiveItem.bind(this, i) });
        })
      );
    }
  }]);

  return CiteNavigation;
}(_react2.default.Component);

exports.default = CiteNavigation;


var propTypes = {
  items: _react2.default.PropTypes.array.isRequired,
  setActiveItem: _react2.default.PropTypes.func.isRequired,
  getActiveItemIndex: _react2.default.PropTypes.func.isRequired,
  class_name: _react2.default.PropTypes.string
};

CiteNavigation.defaultProps = {
  class_name: 'nav nav-pills'
};

CiteNavigation.propTypes = propTypes;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-navigation-item":12}],14:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeDownloadSource = require('./cite-download-source');

var _citeDownloadSource2 = _interopRequireDefault(_citeDownloadSource);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CiteThumbnail = function (_React$Component) {
  _inherits(CiteThumbnail, _React$Component);

  function CiteThumbnail(props) {
    _classCallCheck(this, CiteThumbnail);

    return _possibleConstructorReturn(this, (CiteThumbnail.__proto__ || Object.getPrototypeOf(CiteThumbnail)).call(this, props));
  }

  _createClass(CiteThumbnail, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          thumbnail = _props.thumbnail,
          sources = _props.sources;

      return _react2.default.createElement(
        'div',
        { className: 'col-md-2 download-source' },
        _react2.default.createElement('img', { className: 'thumbnail', src: thumbnail }),
        sources.map(function (source, i) {
          return _react2.default.createElement(_citeDownloadSource2.default, _extends({ key: i }, source));
        })
      );
    }
  }]);

  return CiteThumbnail;
}(_react2.default.Component);

var propTypes = {
  thumbnail: _react2.default.PropTypes.string.isRequired,
  sources: _react2.default.PropTypes.array.isRequired
};

CiteThumbnail.propTypes = propTypes;

exports.default = CiteThumbnail;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-download-source":10}],15:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Transcript = function Transcript(props) {
  return _react2.default.createElement(
    "div",
    { className: "transcript" },
    props.transcript
  );
};

var propTypes = {
  transcript: _react2.default.PropTypes.string.isRequired
};

Transcript.propTypes = propTypes;

exports.default = Transcript;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

var _react2 = _interopRequireDefault(_react);

var _citeNavigation = require('./cite-navigation');

var _citeNavigation2 = _interopRequireDefault(_citeNavigation);

var _citeDetails = require('./cite-details');

var _citeDetails2 = _interopRequireDefault(_citeDetails);

var _citeCitation = require('./cite-citation');

var _citeCitation2 = _interopRequireDefault(_citeCitation);

var _citeDownload = require('./cite-download');

var _citeDownload2 = _interopRequireDefault(_citeDownload);

var _citeTranscript = require('./cite-transcript');

var _citeTranscript2 = _interopRequireDefault(_citeTranscript);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ReactCitation = function (_React$Component) {
  _inherits(ReactCitation, _React$Component);

  function ReactCitation(props) {
    _classCallCheck(this, ReactCitation);

    var _this = _possibleConstructorReturn(this, (ReactCitation.__proto__ || Object.getPrototypeOf(ReactCitation)).call(this, props));

    _this._viewer = _this._viewer.bind(_this);
    return _this;
  }

  _createClass(ReactCitation, [{
    key: '_viewer',
    value: function _viewer() {
      return _react2.default.createElement(_citeCitation2.default, { fields: this.props.items.fields, citationType: this.props.citationType });
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'div',
          { className: 'cite-citation' },
          this._viewer()
        )
      );
    }
  }]);

  return ReactCitation;
}(_react2.default.Component);

var propTypes = {
  items: _react2.default.PropTypes.array.isRequired
};

ReactCitation.propTypes = propTypes;

exports.default = ReactCitation;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cite-citation":6,"./cite-details":9,"./cite-download":11,"./cite-navigation":13,"./cite-transcript":15}]},{},[16])(16)
});