/* eslint-env jest */
import {applyFilters, applySpecialsFilter, applyStationsFilter, applyDietaryFilter} from '../apply-filters'

describe('applySpecialsFilter', () => {
  it('applies the filter to a list of items', () => {
    let items = [{special: true}, {special: false}, {special: true}]
    let filters = [{key: 'specials', value: true}]

    let actual = applySpecialsFilter(items, filters)
    let expected = [{special: true}, {special: true}]

    expect(actual).toEqual(expected)
  })

  it('does not apply the filter when the filter is disabled', () => {
    let items = [{special: true}, {special: false}, {special: false}]
    let filters = [{key: 'specials', type: 'toggle', value: false}]

    let actual = applySpecialsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })

  it('does not apply when the filter is not given', () => {
    let items = [{special: true}, {special: false}, {special: false}]
    let filters = []

    let actual = applySpecialsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })
})

describe('applyStationsFilter', () => {
  it('applies the filter to a list of items', () => {
    let items = [{station: 'a'}, {station: 'b'}, {station: 'a'}]
    let filters = [{key: 'stations', type: 'list', options: ['a', 'b'], value: ['a']}]

    let actual = applyStationsFilter(items, filters)
    let expected = [{station: 'b'}]

    expect(actual).toEqual(expected)
  })

  it('does not apply the filter when the filter is disabled', () => {
    let items = [{station: 'a'}, {station: 'b'}, {station: 'a'}]
    let filters = [{key: 'stations', options: ['a', 'b'], value: ['a', 'b']}]

    let actual = applyStationsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })

  it('does not apply when the filter is not given', () => {
    let items = [{station: 'a'}, {station: 'b'}, {station: 'a'}]
    let filters = []

    let actual = applyStationsFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })
})

describe('applyDietaryFilter', () => {
  it('applies the filter to a list of items', () => {
    let items = [{'cor_icon': {'1': 'a'}}, {'cor_icon': {'1': 'b'}}, {'cor_icon': {'1': 'a'}}]
    let filters = [{key: 'restrictions', type: 'list', options: ['a', 'b'], value: ['a']}]

    let actual = applyDietaryFilter(items, filters)
    let expected = [{'cor_icon': {'1': 'b'}}]

    expect(actual).toEqual(expected)
  })

  it('removes items with no diretary restrictions when the filter is enabled', () => {
    let items = [{'cor_icon': {}}, {'cor_icon': {'1': 'b'}}, {'cor_icon': {'1': 'a'}}]
    let filters = [{key: 'restrictions', type: 'list', options: ['a', 'b', 'c'], value: ['c']}]

    let actual = applyDietaryFilter(items, filters)
    let expected = [{'cor_icon': {'1': 'b'}}, {'cor_icon': {'1': 'a'}}]

    expect(actual).toEqual(expected)
  })

  it('does not apply the filter when the filter is disabled', () => {
    let items = [{'cor_icon': {}}, {'cor_icon': {'1': 'a'}}, {'cor_icon': {'1': 'a'}}, {'cor_icon': {'1': 'a'}}]
    let filters = [{key: 'restrictions', type: 'list', options: ['a', 'b'], value: ['a', 'b']}]

    let actual = applyDietaryFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })

  it('does not apply when the filter is not given', () => {
    let items = [{'cor_icon': {}}, {'cor_icon': {'1': 'a'}}, {'cor_icon': {'1': 'a'}}, {'cor_icon': {'1': 'a'}}]
    let filters = []

    let actual = applyDietaryFilter(items, filters)
    let expected = items

    expect(actual).toEqual(expected)
  })
})

describe('applyFilters', () => {
  it('applies the filters to a list of items', () => {
    let items = [
      {special: true, station: 'a', 'cor_icon': {'1': 'a'}},
      {special: false, station: 'b', 'cor_icon': {'1': 'b'}},
      {special: true, station: 'a', 'cor_icon': {'1': 'c'}},
    ]
    let filters = [
      {key: 'specials', value: true},
      {key: 'stations', type: 'list', options: ['a', 'b'], value: ['b']},
      {key: 'restrictions', type: 'list', options: ['a', 'b', 'c'], value: ['a']},
    ]

    let actual = applyFilters(items, filters)
    let expected = [
      {special: true, station: 'a', 'cor_icon': {'1': 'c'}},
    ]

    expect(actual).toEqual(expected)
  })
})
