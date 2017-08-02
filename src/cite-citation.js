import React from 'react'
import CitationCoins from './cite-citation-coins'
import CitationChicago from './cite-citation-chicago'
import CitationMla from './cite-citation-mla'
import CitationWikipedia from './cite-citation-wikipedia'

export default class Citation extends React.Component {
  constructor(props) {
    super(props)

    this._citationType = this._citationType.bind(this);
  }

  _citationType() {
    switch (this.props.citationType) {
      case 'chicago':
        return <CitationChicago className="chicago" {...fields} />;
      case 'mla':
        return <CitationMla className="mla" {...fields} />;
      case 'wiki':
        return <CitationWikipedia className="wiki" {...fields} />;
      default:
        return <div>No Viewer Avaialable for type: {item.type}</div>;
    }
  }

  render() {
    let fields = this.props.fields
    return (
        <div className="citation">
          {this._citationType()}
        </div>
      )
  }
}

const propTypes = {
  fields: React.PropTypes.array,
  mapping: React.PropTypes.object
}

CitationChicago.propTypes = propTypes