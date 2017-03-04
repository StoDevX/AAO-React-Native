/* eslint-env jest */
// @flow

import React from 'react'
import {shallow} from 'enzyme'

import {NoticeView} from '../notice'

test('renders', () => {
  const tree = shallow(
    <NoticeView
      text='A Message'
    />
  )

  expect(tree).toMatchSnapshot()
})

test('renders the given text', () => {
  const label = 'A Label I Am'

  const tree = shallow(
    <NoticeView
      text={label}
    />
  )

  expect(tree.find('Text').prop('children')).toBe(label)
})

test('renders the given text', () => {
  const button = 'Button'

  const tree = shallow(
    <NoticeView
      text='Label'
      buttonText={button}
    />
  )

  expect(tree.find('Button').length).toBe(1)
  expect(tree.find('Button').prop('title')).toBe(button)
})

test('shows an ActivityIndicator if given [spinner]', () => {
  const tree = shallow(
    <NoticeView
      text='Label'
      spinner={true}
    />
  )

  expect(tree.find('ActivityIndicator').length).toBe(1)
})
