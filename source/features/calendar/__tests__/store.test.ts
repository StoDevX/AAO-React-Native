import {useCalendarFilterStore} from '../store'

beforeEach(() => {
	useCalendarFilterStore.setState({selectedCategory: null})
})

test('starts with no category selected', () => {
	let {selectedCategory} = useCalendarFilterStore.getState()
	expect(selectedCategory).toBeNull()
})

test('selectCategory sets the category', () => {
	let {selectCategory} = useCalendarFilterStore.getState()
	selectCategory('Music Events')
	let {selectedCategory} = useCalendarFilterStore.getState()
	expect(selectedCategory).toBe('Music Events')
})

test('selectCategory can change to a different category', () => {
	useCalendarFilterStore.setState({selectedCategory: 'Music Events'})
	let {selectCategory} = useCalendarFilterStore.getState()
	selectCategory('Lectures')
	let {selectedCategory} = useCalendarFilterStore.getState()
	expect(selectedCategory).toBe('Lectures')
})

test('selectCategory with null clears the selection', () => {
	useCalendarFilterStore.setState({selectedCategory: 'Music Events'})
	let {selectCategory} = useCalendarFilterStore.getState()
	selectCategory(null)
	let {selectedCategory} = useCalendarFilterStore.getState()
	expect(selectedCategory).toBeNull()
})
