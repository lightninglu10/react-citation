import React from 'react'

export default function citationRender(CitationFormat) {
  return class Citation extends React.Component {
    constructor(props) {
      super(props)
      this.render_citation = this.render_citation.bind(this)
      this.format = this.format.bind(this)
    }

    affix(value, prefix, suffix) {
      return (value) ? prefix + value + suffix : ''
    }

    format(value, formatters = [(value) => value]) {
      return formatters.map(function(formatter) { 
          return formatter(value) 
        }, value)
    }

    render_citation(mappings) {
      let affix = this.affix
      let props = this.props
      let format = this.format
      return (<span class="citation">
                {mappings.map(function(field, i) {
                  let field_name = Object.keys(field)[0]
                  let config = field[field_name]
                  return affix(format(props[field_name], config.formatters), config.prefix, config.suffix)
                })}
              </span>)
    }

    render() {
      return <CitationFormat {...this.props} render_citation={this.render_citation} />
    }
  }
}