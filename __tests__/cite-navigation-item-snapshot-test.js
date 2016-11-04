import React from 'react'
import renderer from 'react-test-renderer'
import CiteNavigationItem from '../src/cite-navigation-item'

describe('CiteNavigation Tests', () => {
  const item = {class_name: "active", text: "Foo"}

  it("renders a navigation item", function(){  
    const component = renderer.create(
      <CiteNavigationItem label="Foo" key="0" class_name="active" setActiveItem={() => {}} />
    )
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})