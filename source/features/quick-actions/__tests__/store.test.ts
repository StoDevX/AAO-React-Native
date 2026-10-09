import {DEFAULT_CARLETON_QUICK_ACTIONS, DEFAULT_QUICK_ACTIONS} from '../destinations'
import {useQuickActionsStore} from '../store'
import {campusById} from '../../../campuses'

const stolaf = campusById('edu.stolaf')
const carleton = campusById('edu.carleton')

let picked = () => useQuickActionsStore.getState().quickActions

beforeEach(() => {
	useQuickActionsStore.setState({
		quickActions: DEFAULT_QUICK_ACTIONS,
		carletonQuickActions: DEFAULT_CARLETON_QUICK_ACTIONS,
	})
})

test('starts with the defaults', () => {
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})

test('toggle removes a picked destination', () => {
	useQuickActionsStore.getState().toggleQuickAction('Transit', stolaf)
	expect(picked()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Olaf Messenger'])
})

test('toggle appends an unpicked destination when a slot is free', () => {
	useQuickActionsStore.setState({quickActions: ['Transit']})
	useQuickActionsStore.getState().toggleQuickAction('Calendar', stolaf)
	expect(picked()).toStrictEqual(['Transit', 'Calendar'])
})

test('toggle ignores a fifth pick', () => {
	useQuickActionsStore.getState().toggleQuickAction('Calendar', stolaf)
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})

test('toggle ignores an id that names no destination', () => {
	useQuickActionsStore.setState({quickActions: ['Transit']})
	useQuickActionsStore.getState().toggleQuickAction('Nowhere', stolaf)
	expect(picked()).toStrictEqual(['Transit'])
})

// A tile renamed in a later release must not hold one of the four slots.
test('toggle prunes unknown ids, freeing their slot', () => {
	useQuickActionsStore.setState({
		quickActions: ['Stav Menu', 'Cage Menu', 'Transit', 'Renamed Tile'],
	})
	useQuickActionsStore.getState().toggleQuickAction('Calendar', stolaf)
	expect(picked()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Transit', 'Calendar'])
})

test('reset restores the defaults', () => {
	useQuickActionsStore.setState({quickActions: ['Calendar']})
	useQuickActionsStore.getState().resetQuickActions(stolaf)
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})

test("a Carleton pick leaves St. Olaf's alone", () => {
	useQuickActionsStore.getState().toggleQuickAction('SUMO', carleton)
	expect(useQuickActionsStore.getState().carletonQuickActions).toStrictEqual([
		'Menus',
		'Building Hours',
		'Convo',
	])
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})

test("resetting Carleton restores Carleton's defaults alone", () => {
	useQuickActionsStore.setState({quickActions: ['Transit'], carletonQuickActions: ['SUMO']})
	useQuickActionsStore.getState().resetQuickActions(carleton)
	expect(useQuickActionsStore.getState().carletonQuickActions).toStrictEqual(
		DEFAULT_CARLETON_QUICK_ACTIONS,
	)
	expect(picked()).toStrictEqual(['Transit'])
})
