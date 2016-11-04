import React from 'react'
import ReactDOM from 'react-dom'
import ReactCitation  from 'react-citation'

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
              [
                {
                  label: 'Title',
                  delimiter: ', ',
                  field_values: [
                    {text: 'Daemon', url: 'https://www.amazon.com/DAEMON-Daniel-Suarez/dp/0451228731'}
                  ]
                },
                {
                  label: 'Title',
                  delimiter: ', ',
                  field_values: [
                    {text: 'Snow Crash', url: 'https://www.amazon.com/Snow-Crash-Neal-Stephenson/dp/0553380958/ref=sr_1_1?s=books&ie=UTF8&qid=1478114241&sr=1-1&keywords=snowcrash'},
                    {text: 'Ender\'s Game'}
                  ]
                }
              ]
            }            
          ]
		return (<div><ReactCitation items={items} /></div>
		);
	}
});

ReactDOM.render(<App />, document.getElementById('app'));
