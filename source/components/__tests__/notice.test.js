/* eslint-env jest */
// @flow

import 'react-native'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import {NoticeView} from '../notice'

const shallow = component => {
  const r = new ReactShallowRenderer()
  r.render(component)
  return r.getRenderOutput()
}

test('renders the given text', () => {
  const tree = shallow(<NoticeView text="A Label I Am" />)
  expect(tree).toMatchSnapshot()
})

test('renders a button, if given', () => {
  const tree = shallow(<NoticeView text="Label" buttonText="Button" />)
  expect(tree).toMatchSnapshot()
})

test('shows an ActivityIndicator if given [spinner]', () => {
  const tree = shallow(<NoticeView text="Label" spinner={true} />)
  expect(tree).toMatchSnapshot()
})
