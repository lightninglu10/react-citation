import React from 'react'

const Thumbnail = props => (<div className="row">
                              <div className="col-md-2">
                                <a className="thumbnail" hgref={props.url}>
                                  <img src={props.src} /><span className="glyphicon glyphicon-download-alt"></span> {props.text}
                                </a>
                              </div>
                            </div>)

const propTypes = {
  url: React.PropTypes.string.isRequired,
  src: React.PropTypes.string.isRequired,
  text: React.PropTypes.string
}

Thumbnail.propTypes = propTypes

export default Thumbnail

