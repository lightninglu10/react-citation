import React from 'react';

import CiteNavigation from './cite-navigation';
import Details from './cite-details';
import Citation from './cite-citation';
import Download from './cite-download';
import Transcript from './cite-transcript';

class ReactCitation extends React.Component {

  constructor(props) {
    super(props);
    this._viewer = this._viewer.bind(this);
  }

  _viewer() {
    return <Citation fields={this.props.items.fields} citationType={this.props.citationType} />;
  }

  render() {
    return (
      <div>
        <div className={`cite-citation`}>
          {this._viewer()}
        </div>
      </div>
    );
  }
}

const propTypes = {
  items: React.PropTypes.array.isRequired,
};

ReactCitation.propTypes = propTypes;

export default ReactCitation;
