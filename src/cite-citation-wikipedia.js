import React from 'react'
import citationRender from '../src/cite-citation-render'

@citationRender
export default class CitationMla extends React.Component {
  constructor(props) {
    super(props)
  }

  italicize(text) {
    return '<i>' + text + '</i>'
  }

  removeProtocols(url) {
    return url.replace(/http:\/\/|https:\/\//i, '')
  }

  mappings() {
    let map =  
          [
            {ref_name: {prefix: '<ref name=', suffix: '> {{' }},
            {url: {prefix: 'cite web | url=', suffix: ''}},
            {type: {prefix: ' | title= (', suffix: ')'}},
            {title: {prefix: '', suffix: ','}},
            {creation_date: {prefix: '(', suffix: ')' }},
            {creator: {prefix: ' | author=', suffix: '' }},
            {current_date: {prefix: ' | accessdate=', suffix: '' }},
            {contributing_organization: {prefix: ' | publisher=', suffix: '' }}
          ]
    return map
  }

  wrapper(citation) {
    return citation + '}} </ref>'
  }

  render() {
    return this.props.render_citation(this.mappings())
  }
}

const propTypes = {
  ref_name: React.PropTypes.string, 
  creator: React.PropTypes.string,
  creation_date: React.PropTypes.string,
  title: React.PropTypes.string,
  contributing_organization: React.PropTypes.string,
  url: React.PropTypes.string,
  mapping: React.PropTypes.object
}

CitationMla.propTypes = propTypes