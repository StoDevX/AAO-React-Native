/* eslint-env jest */
// @flow
import {applyFilters, applySpecialsFilter, applyStationsFilter, applyDietaryFilter} from '../apply-filters'
import {item} from './menu-item.mock'

const makeSpecialsFilter = value => ({
  key: 'specials',
  value: value,
  type: 'toggle',
  label: '',
})

const makeStationsFilter = ({options, value}) => ({
  key: 'stations',
  type: 'list',
  options: options,
  value: value,
  label: '',
  multiple: true,
})

const makeRestrictionsFilter = ({options, value}) => ({
  key: 'restrictions',
  type: 'list',
  options: options,
  value: value,
  label: '',
  multiple: true,
})

describe('applySpecialsFilter', () => {
  it('applies the filter to a list of items', () => {
    let items = [item({special: true}), item({special: false}), item({special: true})]
    let filters = [makeSpecialsFilter(true)]

    let actual = applySpecialsFilter(items, filters)
    let expected = [item({special: true}), item({special: true})]

    expect(actual).toEqual(expected)
  })

  it('does not apply the filter when the filter is disabled', () => {
    let items = [item({special: true}), item({special: false}), item({special: false})]
    let filters = [makeSpecialsFilter(false)]

    let actual = applySpecialsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })

  it('does not apply when the filter is not given', () => {
    let items = [item({special: true}), item({special: false}), item({special: false})]
    let filters = []

    let actual = applySpecialsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })
})

describe('applyStationsFilter', () => {
  it('applies the filter to a list of items', () => {
    let items = [item({station: 'a'}), item({station: 'b'}), item({station: 'a'})]
    let filters = [makeStationsFilter({options: ['a', 'b'], value: ['a']})]

    let actual = applyStationsFilter(items, filters)
    let expected = [item({station: 'b'})]

    expect(actual).toEqual(expected)
  })

  it('does not apply the filter when the filter is disabled', () => {
    let items = [item({station: 'a'}), item({station: 'b'}), item({station: 'a'})]
    let filters = [makeStationsFilter({options: ['a', 'b'], value: ['a', 'b']})]

    let actual = applyStationsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })

  it('does not apply when the filter is not given', () => {
    let items = [item({station: 'a'}), item({station: 'b'}), item({station: 'a'})]
    let filters = []

    let actual = applyStationsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })
})

describe('applyDietaryFilter', () => {
  it('applies the filter to a list of items', () => {
    let items = [item({'cor_icon': {'1': 'a'}}), item({'cor_icon': {'1': 'b'}}), item({'cor_icon': {'1': 'a'}})]
    let filters = [makeRestrictionsFilter({options: ['a', 'b'], value: ['a']})]

    let actual = applyDietaryFilter(items, filters)
    let expected = [item({'cor_icon': {'1': 'b'}})]

    expect(actual).toEqual(expected)
  })

  it('removes items with no diretary restrictions when the filter is enabled', () => {
    let items = [item({'cor_icon': {}}), item({'cor_icon': {'1': 'b'}}), item({'cor_icon': {'1': 'a'}})]
    let filters = [makeRestrictionsFilter({options: ['a', 'b', 'c'], value: ['c']})]

    let actual = applyDietaryFilter(items, filters)
    let expected = [item({'cor_icon': {'1': 'b'}}), item({'cor_icon': {'1': 'a'}})]

    expect(actual).toEqual(expected)
  })

  it('does not apply the filter when the filter is disabled', () => {
    let items = [item({'cor_icon': {}}), item({'cor_icon': {'1': 'a'}}), item({'cor_icon': {'1': 'a'}}), item({'cor_icon': {'1': 'a'}})]
    let filters = [makeRestrictionsFilter({options: ['a', 'b'], value: ['a', 'b']})]

    let actual = applyDietaryFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })

  it('does not apply when the filter is not given', () => {
    let items = [item({'cor_icon': {}}), item({'cor_icon': {'1': 'a'}}), item({'cor_icon': {'1': 'a'}}), item({'cor_icon': {'1': 'a'}})]
    let filters = []

    let actual = applyDietaryFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })
})

describe('applyFilters', () => {
  it('applies the filters to a list of items', () => {
    let items = [
      item({special: true, station: 'a', 'cor_icon': {'1': 'a'}}),
      item({special: false, station: 'b', 'cor_icon': {'1': 'b'}}),
      item({special: true, station: 'a', 'cor_icon': {'1': 'c'}}),
    ]
    let filters = [
      makeSpecialsFilter(true),
      makeStationsFilter({options: ['a', 'b'], value: ['b']}),
      makeRestrictionsFilter({options: ['a', 'b', 'c'], value: ['a']}),
    ]

    let actual = applyFilters(items, filters)
    let expected = [
      item({special: true, station: 'a', 'cor_icon': {'1': 'c'}}),
    ]

    expect(actual).toEqual(expected)
  })
})
