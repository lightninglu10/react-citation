import React from 'react'
import citationCitation from '../src/cite-citation-render'
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
          <p><CitationChicago {...fields} /></p>
          <p><CitationMla {...fields} /></p>
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