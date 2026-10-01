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
