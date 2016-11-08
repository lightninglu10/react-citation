import React from 'react'
import citationRender from '../src/cite-citation-render'

@citationRender
export default class CitationChicago extends React.Component {
  constructor(props) {
    super(props)
  }


  mulitvalue_field(values) {
    values.join(',')
  }

  mappings() {
    let map =  
          [
            {creator: {prefix: '&amp;rft.creator', suffix: '', formatters: [encodeURIComponent]}},
            {creation_date: {prefix: ' ', suffix: '.', formatters: [encodeURIComponent]}},
            {title: {prefix: '&amp;rft.title=', suffix: '', formatters: [encodeURIComponent]}},
            {description: {prefix: '&amp;rft.description=', suffix: '', formatters: [encodeURIComponent]}},
            {subject: {prefix: '&amp;rft.subject=', suffix: '' , formatters: [this.mulitvalue_field, encodeURIComponent]}},
            {description: {prefix: '&amp;rft.description=', suffix: '', formatters: [encodeURIComponent]}},
            {contributing_organization: {prefix: 'publisher', suffix: 'Minnesota Digital Library', formatters: [encodeURIComponent]}},
            {type: {prefix: '&amp;rft.type=', suffix: '', formatters: [encodeURIComponent]}},
            {format: {prefix: '&amp;rft.format=', suffix: '', formatters: [encodeURIComponent]}},
            {rights: {prefix: '&amp;rft.rights=', suffix: '', formatters: [encodeURIComponent]}},
            {url: {prefix: '&amp;rft.identifier=', suffix: '', formatters: [encodeURIComponent]}}
          ]
    return map
  }

  render() {
    let mappings = this.mappings()
    let fields = this.props.render_citation(mappings)
    let title = "ctx_ver=Z39.88-2004&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Adc" + fields
    return (<span className="Z3988" title={fields}></span>)
  }
}

const propTypes = {
  creator: React.PropTypes.string,
  creation_date: React.PropTypes.string,
  title: React.PropTypes.string,
  contributing_organization: React.PropTypes.string,
  url: React.PropTypes.string
}

CitationChicago.propTypes = propTypes