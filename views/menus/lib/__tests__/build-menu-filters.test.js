/* eslint-env jest */
// @flow
import {buildMenuFilters} from '../build-menu-filters'
import {item} from './menu-item.mock'

const foodItems = [
  item({station: 'a'}),
  item({station: 'b'}),
  item({station: 'a'}),
  item({station: 'c'}),
]
const corIcons = {
  '1': {label: 'a', icon: null},
  '2': {label: 'b', icon: null},
}

it('should generate an array with three items', () => {
  expect(buildMenuFilters({foodItems, corIcons}).length).toBe(3)
})

it('should include the "specials" filter', () => {
  const result = buildMenuFilters({foodItems, corIcons})
  expect(result.find(item => item.key === 'specials')).toBeTruthy()
})

it('should include the "stations" filter', () => {
  const result = buildMenuFilters({foodItems, corIcons})
  expect(result.find(item => item.key === 'stations')).toBeTruthy()
})

it('should include the "restrictions" filter', () => {
  const result = buildMenuFilters({foodItems, corIcons})
  expect(result.find(item => item.key === 'restrictions')).toBeTruthy()
})

it('should create a uniqued list of stations from the input', () => {
  const result = buildMenuFilters({foodItems, corIcons})
  let stations = result.find(item => item.key === 'stations')
  expect((stations: any).options).toEqual(['a', 'b', 'c'])
})

it('should create a list of labels of the cor icons', () => {
  const result = buildMenuFilters({foodItems, corIcons})
  let restrictions = result.find(item => item.key === 'restrictions')
  expect((restrictions: any).options).toEqual(['a', 'b'])
})
