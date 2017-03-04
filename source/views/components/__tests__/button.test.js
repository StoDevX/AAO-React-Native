/* eslint-env jest */
// @flow

import React from 'react';
import {shallow} from 'enzyme';

import {Button} from '../button';

test('renders', () => {
  const tree = shallow(<Button />);
  expect(tree).toMatchSnapshot();
});

test('can change the title', () => {
  const tree = shallow(<Button title="Title" />);
  expect(tree).toMatchSnapshot();
});

test('calls the callback', () => {
  const cb = jest.fn();

  const tree = shallow(<Button onPress={cb} />);
  expect(tree).toMatchSnapshot();

  tree.simulate('press');

  expect(cb).toHaveBeenCalled();
  expect(tree).toMatchSnapshot();
});
