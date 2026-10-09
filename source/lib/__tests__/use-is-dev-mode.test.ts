import {renderHook} from '@testing-library/react-native'

import {useIsDevMode} from '../use-is-dev-mode'

const mockIsDebugBuild = jest.fn(() => false)
const mockOverride = jest.fn((): boolean | null => null)

jest.mock('@frogpond/constants', () => ({
	isDebugBuild: () => mockIsDebugBuild(),
}))

jest.mock('react-redux', () => ({
	useSelector: () => mockOverride(),
}))

async function devMode({
	debugBuild,
	override,
}: {
	debugBuild: boolean
	override: boolean | null
}): Promise<boolean> {
	mockIsDebugBuild.mockReturnValue(debugBuild)
	mockOverride.mockReturnValue(override)
	let {result} = await renderHook(() => useIsDevMode())
	return result.current
}

describe('useIsDevMode', () => {
	it('follows the build until the toggle is used', async () => {
		expect(await devMode({debugBuild: true, override: null})).toBe(true)
		expect(await devMode({debugBuild: false, override: null})).toBe(false)
	})

	// Every 2.9 release candidate counts as a debug build, so the toggle has
	// to be able to turn dev mode off there, not only on.
	it('turns dev mode off in a debug build', async () => {
		expect(await devMode({debugBuild: true, override: false})).toBe(false)
	})

	it('turns dev mode on in a store build', async () => {
		expect(await devMode({debugBuild: false, override: true})).toBe(true)
	})
})
