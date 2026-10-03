import {Linking} from 'react-native'

jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: false,
	fixtureMode: 'live',
	isChaos: true,
	chaosSeed: 0,
	chaosLaunch: 0,
	chaosMode: 'record',
	chaosFaultRate: 0,
}))

// Neither is globally mocked; loading the real modules under Jest reaches
// into native code that only exists on device.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('expo-calendar/legacy', () => ({createEventInCalendarAsync: jest.fn()}))

import {openUrl} from '@frogpond/open-url'
import {addToCalendar} from '@frogpond/add-to-device-calendar/lib'
import {composeEmail} from '../../components/send-email'
import {memoryLineFile} from '../line-file'
import {setFindingsFile, useChaosFindings} from '../findings'
import {parseLines} from '../tape'

let file = memoryLineFile()
let openURL: jest.SpiedFunction<typeof Linking.openURL>

beforeEach(() => {
	file = memoryLineFile()
	useChaosFindings.setState({latest: '', file: null})
	setFindingsFile(file)
	openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
})

afterEach(() => {
	jest.restoreAllMocks()
})

function kinds(): string[] {
	return parseLines<{kind: string}>(file.readLines()).map((f) => f.kind)
}

test('openUrl hands nothing to iOS', async () => {
	expect(await openUrl('tel:5077863000')).toBe(false)
	expect(openURL).not.toHaveBeenCalled()
	expect(kinds()).toEqual(['out-of-app'])
})

test('composeEmail opens no compose sheet', async () => {
	expect(await composeEmail({to: ['x@stolaf.edu'], attachments: ['file:///a.png']})).toBe(false)
	expect(kinds()).toEqual(['out-of-app'])
})

test('addToCalendar writes no event', async () => {
	let event = {title: 'Chapel'} as Parameters<typeof addToCalendar>[0]
	expect(await addToCalendar(event)).toBe('cancelled')
	expect(kinds()).toEqual(['out-of-app'])
})
