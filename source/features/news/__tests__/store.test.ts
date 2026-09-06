import {useNewsFilterStore} from '../store'

beforeEach(() => {
	useNewsFilterStore.setState({selectedSource: 'stolaf', selectedCategory: null})
})

test('starts on St. Olaf News with no category selected', () => {
	let {selectedSource, selectedCategory} = useNewsFilterStore.getState()
	expect(selectedSource).toBe('stolaf')
	expect(selectedCategory).toBeNull()
})

test('select sets the source and the category together', () => {
	let {select} = useNewsFilterStore.getState()
	select('mess', 'Sports')
	let {selectedSource, selectedCategory} = useNewsFilterStore.getState()
	expect(selectedSource).toBe('mess')
	expect(selectedCategory).toBe('Sports')
})

test('select with null clears the category but keeps the source', () => {
	useNewsFilterStore.setState({selectedSource: 'mess', selectedCategory: 'Sports'})
	let {select} = useNewsFilterStore.getState()
	select('mess', null)
	let {selectedSource, selectedCategory} = useNewsFilterStore.getState()
	expect(selectedSource).toBe('mess')
	expect(selectedCategory).toBeNull()
})

test('select can switch source and category at once', () => {
	useNewsFilterStore.setState({selectedSource: 'stolaf', selectedCategory: 'Academics'})
	let {select} = useNewsFilterStore.getState()
	select('mess', 'Sports')
	let {selectedSource, selectedCategory} = useNewsFilterStore.getState()
	expect(selectedSource).toBe('mess')
	expect(selectedCategory).toBe('Sports')
})
