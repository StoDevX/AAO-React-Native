import {useCalendarFilterStore} from '../store'

beforeEach(() => {
	useCalendarFilterStore.setState({selectedCategories: []})
})

test('starts with no categories selected', () => {
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual([])
})

test('setSelectedCategories replaces the selection', () => {
	let {setSelectedCategories} = useCalendarFilterStore.getState()
	setSelectedCategories(['Music Events', 'Academic Year'])
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual(['Music Events', 'Academic Year'])
})

test('setSelectedCategories can update to a different set', () => {
	useCalendarFilterStore.setState({selectedCategories: ['Music Events', 'Academic Year']})
	let {setSelectedCategories} = useCalendarFilterStore.getState()
	setSelectedCategories(['Lectures'])
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual(['Lectures'])
})

test('clearCategories resets to empty', () => {
	useCalendarFilterStore.setState({selectedCategories: ['Music Events']})
	let {clearCategories} = useCalendarFilterStore.getState()
	clearCategories()
	let {selectedCategories} = useCalendarFilterStore.getState()
	expect(selectedCategories).toStrictEqual([])
})
