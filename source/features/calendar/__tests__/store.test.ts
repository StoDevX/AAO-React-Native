import {migrate, useCalendarFilterStore} from '../store'

beforeEach(() => {
	useCalendarFilterStore.setState({filter: null})
})

test('starts with nothing filtered', () => {
	expect(useCalendarFilterStore.getState().filter).toBeNull()
})

test('selects a category', () => {
	useCalendarFilterStore.getState().selectFilter({axis: 'category', value: 'Music'})
	expect(useCalendarFilterStore.getState().filter).toStrictEqual({
		axis: 'category',
		value: 'Music',
	})
})

test('selects an organisation', () => {
	useCalendarFilterStore.getState().selectFilter({axis: 'organization', value: 'Wellness Center'})
	expect(useCalendarFilterStore.getState().filter).toStrictEqual({
		axis: 'organization',
		value: 'Wellness Center',
	})
})

test('choosing an organisation replaces a category, rather than adding to it', () => {
	useCalendarFilterStore.setState({filter: {axis: 'category', value: 'Athletics'}})
	useCalendarFilterStore.getState().selectFilter({axis: 'organization', value: 'Music Department'})
	expect(useCalendarFilterStore.getState().filter).toStrictEqual({
		axis: 'organization',
		value: 'Music Department',
	})
})

test('null clears the filter', () => {
	useCalendarFilterStore.setState({filter: {axis: 'category', value: 'Athletics'}})
	useCalendarFilterStore.getState().selectFilter(null)
	expect(useCalendarFilterStore.getState().filter).toBeNull()
})

test('migrating a persisted category carries the selection over', () => {
	expect(migrate({selectedCategory: 'Athletics'}, 2)).toStrictEqual({
		filter: {axis: 'category', value: 'Athletics'},
	})
})

test('migrating a persisted empty selection stays empty', () => {
	expect(migrate({selectedCategory: null}, 2)).toStrictEqual({filter: null})
})
