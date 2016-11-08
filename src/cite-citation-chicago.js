import React from 'react'
import citationRender from '../src/cite-citation-render'

@citationRender
export default class CitationChicago extends React.Component {
  constructor(props) {
    super(props)
  }

  mappings() {
    let map =  
          [
            {creator: {prefix: '', suffix: '.' }},
            {creation_date: {prefix: ' ', suffix: '.' }},
            {title: {prefix: '"', suffix: '." ' }},
            {contributing_organization: {prefix: ' ', suffix: ', ' }},
            {current_date: {prefix: 'Accessed [', suffix: '].' }},
            {url: {prefix: null, suffix: null }}
          ]
    return map
  }

  render() {
    let mappings = this.mappings()
    return this.props.render_citation(mappings)
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