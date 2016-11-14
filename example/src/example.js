import React from 'react'
import ReactDOM from 'react-dom'
import ReactCitation  from 'react-citation'

let date = new Date();

var App = React.createClass({
	render () {
    const items = 
        [
          {
            focus: true,
            type: 'details',
            label: 'Details',
            fields: 
              [
                {
                  label: 'Title',
                  delimiter: ', ',
                  field_values: [
                    {text: 'Daemon', url: 'https://www.amazon.com/DAEMON-Daniel-Suarez/dp/0451228731'}
                  ]
                },
                {
                  label: 'Creator',
                  field_values: [
                    {text: 'Daniel Suarez'}
                  ]
                }
              ]
            },
          {
            focus: false,
            type: 'citation',
            label: 'Citation',
            fields: 
              {
                mappings: [{}],
                field_values:
                  {
                    creator: 'Fred',
                    ref_name: 'University of Minnesota',
                    creation_date: '09/01/2001',
                    title: 'Fred and his dog',
                    type: 'image',
                    description: 'A boy and his dog',
                    subject: ['dogs', 'cats'],
                    contributing_organization: 'Fred and co',
                    url: 'http://www.example.com/fred',
                    current_date: Date.now()
                  }
              }
            },
            {
              focus: false,
              type: 'download',
              label: 'Download',
              fields: 
                [
                  {
                    src: 'http://lib-mdl-dev.oit.umn.edu/thumbnails/irrc:1744',
                    url: 'http://reflections.mndigital.org/utils/getstream/collection/irrc/id/1744'
                  },
                  {
                    src: 'http://lib-mdl-dev.oit.umn.edu/thumbnails/irrc:1746',
                    url: 'http://reflections.mndigital.org/utils/getstream/collection/irrc/id/1746'
                  },
                  {
                    src: 'http://lib-mdl-dev.oit.umn.edu/thumbnails/irrc:1747',
                    url: 'http://reflections.mndigital.org/utils/getstream/collection/irrc/id/1747'
                  }
                ]
              }
          ]
		return (<div><ReactCitation items={items} /></div>
		);
	}
});

ReactDOM.render(<App />, document.getElementById('app'));
