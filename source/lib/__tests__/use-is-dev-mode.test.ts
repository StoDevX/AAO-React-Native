import {renderHook} from '@testing-library/react-native'

import {useIsDevMode} from '../use-is-dev-mode'

const mockIsDebugBuild = jest.fn(() => false)
const mockOverride = jest.fn(() => false)

jest.mock('@frogpond/constants', () => ({
	isDebugBuild: () => mockIsDebugBuild(),
}))

jest.mock('react-redux', () => ({
	useSelector: () => mockOverride(),
}))

async function devMode({
	debugBuild,
	toggle,
}: {
	debugBuild: boolean
	toggle: boolean
}): Promise<boolean> {
	mockIsDebugBuild.mockReturnValue(debugBuild)
	mockOverride.mockReturnValue(toggle)
	let {result} = await renderHook(() => useIsDevMode())
	return result.current
}

describe('useIsDevMode', () => {
	// Every 2.9 release candidate counts as a debug build, and its testers
	// should see what a store build shows until they turn dev mode on.
	it('is off in a debug build until the toggle turns it on', async () => {
		expect(await devMode({debugBuild: true, toggle: false})).toBe(false)
		expect(await devMode({debugBuild: true, toggle: true})).toBe(true)
	})

	it('is off in a store build until the toggle turns it on', async () => {
		expect(await devMode({debugBuild: false, toggle: false})).toBe(false)
		expect(await devMode({debugBuild: false, toggle: true})).toBe(true)
	})
})
