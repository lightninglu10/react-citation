import React from 'react'
import CiteNavigation from './cite-navigation'
import Details from '../src/cite-details'
import ActiveItem from 'react-active-item'
import Citation from './cite-citation'


class ReactCitation extends React.Component {
  
  constructor(props) {
    super(props)
    this._player = this._player.bind(this)
  }

  _player() {
    let item = this.props.getActiveItem()
    switch(item.type) {
      case 'details':
        return <Details fields={ item.fields } />
        break
      case 'citation':
        return <Citation fields={ item.fields } />
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

