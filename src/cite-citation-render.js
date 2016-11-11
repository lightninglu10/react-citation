import React from 'react'

export default function citationRender(CitationFormat) {
  return class Citation extends React.Component {
    constructor(props) {
      super(props)
      this.render_citation = this.render_citation.bind(this)
      this._format = this._format.bind(this)
      this.override_mappings = this.override_mappings.bind(this)
      this._override_mapping = this._override_mapping.bind(this)
      this._values = this._values.bind(this)
    }

    override_mappings(mappings) {
      return mappings.map( (mapping) => { 
        return this._override_mapping(mapping)[0]
      })
      return mapped
    }
    
    render_citation(mappings) {
      return (<span class="citation">
                <div dangerouslySetInnerHTML={this._values(mappings)} />
              </span>)
    }

    _values(mappings) {
      let affix  = this._affix
      let format = this._format
      let props  = this.props
      let values = []
      mappings.map(function(field, i) {
        let field_name = Object.keys(field)[0]
        let config     = field[field_name]
        let formatted  = format(props.field_values[field_name], config.formatters)
        values.push(affix(formatted, config.prefix, config.suffix))
      })
      return {__html: values.join('') }
    }

    _affix(value, prefix, suffix) {
      return (value) ? prefix + value + suffix : ''
    }

    _format(value, formatters = [(value) => value]) {
      return formatters.map(function(formatter) { 
          return formatter(value) 
        }, value)
    }

    _override_mapping(mapping) {
      return this.props.mappings.map(function(mapping_override) {
        if (mapping[Object.keys(mapping_override)[0]]) {
          return mapping_override
        } else {
          return mapping
        }
      })
    }

    render() {
      return <CitationFormat {...this.props} 
                override_mappings={this.override_mappings}
                render_citation={this.render_citation} />
    }
  }
}