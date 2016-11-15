import React from 'react'
import CitationCoins from './cite-citation-coins'
import CitationChicago from './cite-citation-chicago'
import CitationMla from './cite-citation-mla'
import CitationWikipedia from './cite-citation-wikipedia'

export default class Citation extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    let fields = this.props.fields
    return (
        <div className="citation">
          <p><CitationCoins {...fields} /></p>
          <h3>Chicago Style</h3>
          <p><CitationChicago {...fields} /></p>
          <h3>MLA Style</h3>
          <p><CitationMla {...fields} /></p>
          <h3>Wikipedia Style</h3>
          <p><CitationWikipedia {...fields} /></p>
        </div>
      )
  }
}

const propTypes = {
  fields: React.PropTypes.array,
  mapping: React.PropTypes.object
}

CitationChicago.propTypes = propTypes