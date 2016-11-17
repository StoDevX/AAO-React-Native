// @flow
import React from 'react'
import renderer from 'react/lib/ReactTestRenderer'
import {dayMoment} from './moment.helper'

import {BuildingView} from '../building'

it('renders a building', () => {
  const now = dayMoment('Fri 11:00')
  const info = {
    image: 'building',
    name: 'Building',
    times: {
      hours: {
        Fri: ['10:00', '16:00'],
      },
    },
  }

  const component = renderer.create(
    <BuildingView
      image={0}
      name={info.name}
      info={info}
      now={now}
    />
  )

  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})
