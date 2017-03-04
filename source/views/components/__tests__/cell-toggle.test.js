/* eslint-env jest */
// @flow

import React from 'react'
import {shallow} from 'enzyme'

import {CellToggle} from '../cell-toggle'
import noop from 'lodash/noop'

test('renders', () => {
  const tree = shallow(
    <CellToggle
      label='Label'
      value={true}
      onChange={noop}
    />
  )

  expect(tree).toMatchSnapshot()
})

test('renders the given label into the Cell', () => {
  const label = 'A Label I Am'

  const tree = shallow(
    <CellToggle
      label={label}
      value={true}
      onChange={noop}
    />
  )

  expect(tree.find('Cell').prop('title')).toBe(label)
})

test('calls the given function when the Switch is pressed', () => {
  const cb = jest.fn()

  const tree = shallow(
    <CellToggle
      label='Label'
      value={true}
      onChange={cb}
    />
  )

  tree.find('Cell').prop('cellAccessoryView').props.onValueChange()

  expect(cb).toHaveBeenCalled()
})
