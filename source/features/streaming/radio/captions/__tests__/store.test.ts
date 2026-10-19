import {beforeEach, describe, expect, test} from '@jest/globals'

import {useRadioStore} from '../../store'
import {useCaptionsStore} from '../store'

function say(text: string): void {
	useCaptionsStore.getState().apply({kind: 'final', text})
}

function lines(): string[] {
	return useCaptionsStore
		.getState()
		.captions.lines.map((line) => (line.marker === 'gap' ? '[gap]' : line.text))
}

describe('useCaptionsStore', () => {
	beforeEach(() => {
		useRadioStore.setState({stationId: 'krlx', playState: 'playing', viewedStationId: 'krlx'})
		useCaptionsStore.getState().clear()
	})

	test('keeps the transcript when the same station is captioned again, marking where it was off', () => {
		useCaptionsStore.getState().begin('krlx')
		say('Good evening')

		useCaptionsStore.getState().begin('krlx')
		useCaptionsStore.getState().begin('krlx')
		say('Welcome back')

		expect(lines()).toEqual(['Good evening', '[gap]', 'Welcome back'])
	})

	test('drops a half-heard line left over from the engine that ended', () => {
		useCaptionsStore.getState().begin('krlx')
		say('Good evening')
		useCaptionsStore.getState().apply({kind: 'volatile', text: 'and now the'})

		useCaptionsStore.getState().begin('krlx')

		expect(useCaptionsStore.getState().captions.live).toBe('')
		expect(lines()).toEqual(['Good evening', '[gap]'])
	})

	test('marks nothing before anything was said', () => {
		useCaptionsStore.getState().begin('krlx')
		useCaptionsStore.getState().begin('krlx')

		expect(lines()).toEqual([])
	})

	test('starts from nothing for another station', () => {
		useCaptionsStore.getState().begin('krlx')
		say('Good evening')

		useCaptionsStore.getState().begin('ksto')

		expect(lines()).toEqual([])
		expect(useCaptionsStore.getState().stationId).toBe('ksto')
	})

	test('is kept while the sheet only shows another station', () => {
		useCaptionsStore.getState().begin('krlx')
		say('Good evening')

		useRadioStore.setState({viewedStationId: 'ksto'})

		expect(lines()).toEqual(['Good evening'])
		expect(useCaptionsStore.getState().stationId).toBe('krlx')
	})

	test('is dropped when the player loads another station', () => {
		useCaptionsStore.getState().begin('krlx')
		say('Good evening')

		useRadioStore.setState({stationId: 'ksto'})

		expect(lines()).toEqual([])
		expect(useCaptionsStore.getState().stationId).toBeNull()
	})

	test('is dropped when the radio stops or unloads, but not when it pauses', () => {
		useCaptionsStore.getState().begin('krlx')
		say('Good evening')

		useRadioStore.setState({playState: 'paused'})
		expect(lines()).toEqual(['Good evening'])

		useRadioStore.setState({playState: 'stopped'})
		expect(lines()).toEqual([])

		useRadioStore.setState({playState: 'playing'})
		useCaptionsStore.getState().begin('krlx')
		say('Again')
		useRadioStore.setState({stationId: null})
		expect(lines()).toEqual([])
	})
})
