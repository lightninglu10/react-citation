import React from 'react'

export default class DetailsFieldValue extends React.Component {
  constructor(props) {
    super(props)
    this._fields = this._fields.bind(this)
  }

  _createMarkup(value) {
    return ({__html: value})
  }

  _fields() {
    return this._createMarkup(`${this.props.text}${this.props.delimiter}`)
  }

  render() {
    return <span dangerouslySetInnerHTML={this._fields()}></span>
  }
}

const propTypes = {
  text: React.PropTypes.string.isRequired,
  delimiter: React.PropTypes.string,
  url: React.PropTypes.string
}

DetailsFieldValue.propTypes = propTypes