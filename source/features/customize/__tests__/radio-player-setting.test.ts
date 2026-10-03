import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import {useRadioStore} from '../../streaming/radio/store'
import {useRadioPlayerSetting} from '../radio-player-setting'
import {reportRadioPlayerChange} from '../telemetry'

jest.mock('../telemetry', () => ({reportRadioPlayerChange: jest.fn()}))

beforeEach(() => {
	jest.clearAllMocks()
	useRadioStore.setState({showOnHome: true})
})

describe('useRadioPlayerSetting', () => {
	it('reads whether Home shows the radio player', async () => {
		let {result} = await renderHook(() => useRadioPlayerSetting())
		expect(result.current[0]).toBe(true)
	})

	it('turns it off and counts the change', async () => {
		let {result} = await renderHook(() => useRadioPlayerSetting())
		await act(() => result.current[1](false))
		expect(useRadioStore.getState().showOnHome).toBe(false)
		expect(reportRadioPlayerChange).toHaveBeenCalledWith(false)
	})
})
