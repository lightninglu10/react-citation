import React from 'react'
import Thumbnail from '../src/cite-thumbnail'

export default class Download extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    let { fields }  = this.props
    return (
        <div>
          {fields.map(function(field, i) {
            return <Thumbnail key={i} {...field} text="Download"/>
          })}
        </div>
      )
  }
}

const propTypes = {
  fields: React.PropTypes.array.isRequired
}

Download.propTypes = propTypes