import React from 'react'
import renderer from 'react-test-renderer'
import CitationDownload from '../src/cite-download'

describe('CitationDownload Tests', () => {
  it("produces download links", function(){  

    const fields = 
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

    let component = renderer.create(<CitationDownload fields={fields} />)
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})