/* eslint-env jest */
// @flow

import 'react-native'
import * as React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import {CellToggle} from '../toggle'
import noop from 'lodash/noop'

const shallow = component => {
  const r = new ReactShallowRenderer()
  r.render(component)
  return r.getRenderOutput()
}

test('renders', () => {
  const tree = shallow(
    <CellToggle label="Label" onChange={noop} value={true} />,
  )

  expect(tree).toMatchSnapshot()
})

test('renders the given label into the Cell', () => {
  const label = 'A Label I Am'

  const tree = shallow(
    <CellToggle label={label} onChange={noop} value={true} />,
  )

  expect(tree).toMatchSnapshot()
})

xtest('calls the given function when the Switch is pressed', () => {
  const cb = jest.fn()

  const tree = shallow(<CellToggle label="Label" onChange={cb} value={true} />)

  tree
    .find('Cell')
    .prop('cellAccessoryView')
    .props.onValueChange()

  expect(cb).toHaveBeenCalled()
})
