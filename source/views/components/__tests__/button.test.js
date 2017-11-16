/* eslint-env jest */
// @flow

import 'react-native'
import * as React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import {Button} from '../button'

const shallow = component => {
  const r = new ReactShallowRenderer()
  r.render(component)
  return r.getRenderOutput()
}

test('renders', () => {
  const tree = shallow(<Button />)
  expect(tree).toMatchSnapshot()
})

test('can change the title', () => {
  const tree = shallow(<Button title="Title" />)
  expect(tree).toMatchSnapshot()
})

xtest('calls the callback', () => {
  const cb = jest.fn()

  const tree = shallow(<Button onPress={cb} />)
  expect(tree).toMatchSnapshot()

  tree.simulate('press')

  expect(cb).toHaveBeenCalled()
  expect(tree).toMatchSnapshot()
})
