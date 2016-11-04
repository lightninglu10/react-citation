import React from 'react'
import CiteNavigation from './cite-navigation'
import Details from '../src/details'
import ActiveItem from './active-item'


class ReactCitation extends React.Component {
  
  constructor(props) {
    super(props)
    this.state = { items: this.props.items }
    this._player = this._player.bind(this)
  }

  _player() {
    let item = this.props.getActiveItem()
    switch(item.type) {
      case 'details':
        return <Details fields={ item.fields } />
        break
      case 'citation':
        return <div>Citation Here</div>
        break
      default:
        return <div>No Viewer Avaialable for type: "{type}"</div>
    }
  }
 
  render() {
    return (
             <div>
                <CiteNavigation {...this.props} />
                {this._player()}
             </div>
           )
  }
}

const propTypes = {
  items: React.PropTypes.array.isRequired
}

ReactCitation.propTypes = propTypes

export default ActiveItem(ReactCitation)

