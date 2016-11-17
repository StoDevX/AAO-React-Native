// @flow
import React from 'react'
import renderer from 'react/lib/ReactTestRenderer'
import moment from 'moment-timezone'
const m = time => moment.tz(time, 'ddd H:mm', false, 'America/Winnipeg')

import {BuildingView} from '../building'

it('renders a building', () => {
  const now = m('Fri 11:00')
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
