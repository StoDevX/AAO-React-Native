import {migrate, useNewsFilterStore} from '../store'

beforeEach(() => {
	useNewsFilterStore.setState({selectedCategories: {}})
})

test('starts with no category selected for any source', () => {
	let {selectedCategories} = useNewsFilterStore.getState()
	expect(selectedCategories).toStrictEqual({})
})

test('select sets the category for that source', () => {
	let {select} = useNewsFilterStore.getState()
	select('mess', 'Sports')
	expect(useNewsFilterStore.getState().selectedCategories['mess']).toBe('Sports')
})

test('select leaves the other source alone', () => {
	useNewsFilterStore.setState({selectedCategories: {stolaf: 'Academics'}})
	let {select} = useNewsFilterStore.getState()
	select('mess', 'Sports')
	expect(useNewsFilterStore.getState().selectedCategories['stolaf']).toBe('Academics')
})

test('select with null clears only that source', () => {
	useNewsFilterStore.setState({selectedCategories: {mess: 'Sports', stolaf: 'Academics'}})
	let {select} = useNewsFilterStore.getState()
	select('mess', null)
	let {selectedCategories} = useNewsFilterStore.getState()
	expect(selectedCategories['mess']).toBeNull()
	expect(selectedCategories['stolaf']).toBe('Academics')
})

test('migrate drops a saved filter from before the split', () => {
	let old = {selectedSource: 'mess', selectedCategory: 'Sports'}
	expect(migrate(old, 1)).toStrictEqual({selectedCategories: {}})
})
