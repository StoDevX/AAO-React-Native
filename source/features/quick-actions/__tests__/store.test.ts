import {DEFAULT_QUICK_ACTIONS} from '../destinations'
import {useQuickActionsStore} from '../store'

let picked = () => useQuickActionsStore.getState().quickActions

beforeEach(() => {
	useQuickActionsStore.setState({quickActions: DEFAULT_QUICK_ACTIONS})
})

test('starts with the defaults', () => {
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})

test('toggle removes a picked destination', () => {
	useQuickActionsStore.getState().toggleQuickAction('Transit')
	expect(picked()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Olaf Messenger'])
})

test('toggle appends an unpicked destination when a slot is free', () => {
	useQuickActionsStore.setState({quickActions: ['Transit']})
	useQuickActionsStore.getState().toggleQuickAction('Calendar')
	expect(picked()).toStrictEqual(['Transit', 'Calendar'])
})

test('toggle ignores a fifth pick', () => {
	useQuickActionsStore.getState().toggleQuickAction('Calendar')
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})

test('toggle ignores an id that names no destination', () => {
	useQuickActionsStore.setState({quickActions: ['Transit']})
	useQuickActionsStore.getState().toggleQuickAction('Nowhere')
	expect(picked()).toStrictEqual(['Transit'])
})

// A tile renamed in a later release must not hold one of the four slots.
test('toggle prunes unknown ids, freeing their slot', () => {
	useQuickActionsStore.setState({
		quickActions: ['Stav Menu', 'Cage Menu', 'Transit', 'Renamed Tile'],
	})
	useQuickActionsStore.getState().toggleQuickAction('Calendar')
	expect(picked()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Transit', 'Calendar'])
})

test('reset restores the defaults', () => {
	useQuickActionsStore.setState({quickActions: ['Calendar']})
	useQuickActionsStore.getState().resetQuickActions()
	expect(picked()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
})
