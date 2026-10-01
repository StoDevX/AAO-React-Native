import {useSecretStore} from '../store'

const NOW = 1_800_000_000_000
const MINUTE = 60_000

beforeEach(() => {
	useSecretStore.setState({pressCount: 0, lockedUntil: null})
})

describe('useSecretStore', () => {
	it('starts never pressed and unlocked', () => {
		let {pressCount, lockedUntil} = useSecretStore.getState()
		expect(pressCount).toBe(0)
		expect(lockedUntil).toBeNull()
	})

	it('locks for longer with each press', () => {
		useSecretStore.getState().press(NOW)
		expect(useSecretStore.getState()).toMatchObject({pressCount: 1, lockedUntil: NOW + MINUTE})
		useSecretStore.getState().press(NOW)
		expect(useSecretStore.getState()).toMatchObject({pressCount: 2, lockedUntil: NOW + 5 * MINUTE})
		useSecretStore.getState().press(NOW)
		expect(useSecretStore.getState()).toMatchObject({pressCount: 3, lockedUntil: NOW + 15 * MINUTE})
	})

	it('unlocks without forgetting the presses', () => {
		useSecretStore.getState().press(NOW)
		useSecretStore.getState().press(NOW)
		useSecretStore.getState().unlock()
		expect(useSecretStore.getState()).toMatchObject({pressCount: 2, lockedUntil: null})
	})
})

describe('burial', () => {
	beforeEach(() => {
		useSecretStore.setState({buried: false, lastActiveAt: null})
	})

	it('buries the slab', () => {
		useSecretStore.getState().bury()
		expect(useSecretStore.getState().buried).toBe(true)
	})

	it('counts only time away from the app toward the twelve hours', () => {
		let hour = 60 * MINUTE
		useSecretStore.getState().bury()
		useSecretStore.getState().wake(NOW)
		// Thirteen hours in the app, then a minute away.
		useSecretStore.getState().noteActive(NOW + 13 * hour)
		useSecretStore.getState().wake(NOW + 13 * hour + MINUTE)
		expect(useSecretStore.getState().buried).toBe(true)
		// Then twelve hours away.
		useSecretStore.getState().noteActive(NOW + 14 * hour)
		useSecretStore.getState().wake(NOW + 26 * hour)
		expect(useSecretStore.getState().buried).toBe(false)
	})
})
