import React from 'react'

const CiteThumbnail = props =>  (
                                  <div className="row">
                                    <div className="col-md-2">
                                      <a className="thumbnail" href={props.url}>
                                        <img src={props.src} /><span className="glyphicon glyphicon-download-alt"></span> {props.text}
                                      </a>
                                    </div>
                                  </div>
                                ) 

const propTypes = {
  url: React.PropTypes.string.isRequired,
  src: React.PropTypes.string.isRequired,
  text: React.PropTypes.string
}

CiteThumbnail.propTypes = propTypes

export default CiteThumbnail

