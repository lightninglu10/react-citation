"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CiteThumbnail = function CiteThumbnail(props) {
  return _react2.default.createElement(
    "div",
    { className: "col-md-2 thumb" },
    _react2.default.createElement(
      "a",
      { className: "thumbnail", href: props.url },
      _react2.default.createElement("img", { src: props.src }),
      _react2.default.createElement("span", { className: "glyphicon glyphicon-download-alt" }),
      " ",
      props.label
    )
  );
};

var propTypes = {
  url: _react2.default.PropTypes.string.isRequired,
  src: _react2.default.PropTypes.string.isRequired,
  label: _react2.default.PropTypes.string
};

CiteThumbnail.propTypes = propTypes;

exports.default = CiteThumbnail;