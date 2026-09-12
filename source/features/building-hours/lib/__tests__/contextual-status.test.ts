import moment from 'moment-timezone'
import {contextualStatus} from '../contextual-status'
import type {BuildingType} from '../../types'

const timezone = 'America/Chicago'

function makeBuilding(schedule: BuildingType['schedule']): BuildingType {
	return {
		name: 'Test Building',
		category: 'Test',
		schedule,
	}
}

describe('contextualStatus', () => {
	it('returns "Open until X" when open', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '8:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 14:00', timezone) // Monday 2pm
		let result = contextualStatus(building, now)
		expect(result.short).toBe('Open until 8 PM')
	})

	it('returns "Closes in X min" when almost closed', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '8:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 19:45', timezone) // Monday 7:45pm
		let result = contextualStatus(building, now)
		expect(result.short).toMatch(/Closes in \d+ min/u)
	})

	it('returns "Opens at X" when closed but opens later today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '11:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 14:00', timezone) // Monday 2pm
		let result = contextualStatus(building, now)
		expect(result.short).toBe('Opens at 5 PM')
	})

	it('names the earliest opening today, not the first one listed', () => {
		// The shape of data/building-hours/1-2-pause-kitchen.yaml: a delivery set
		// written before the kitchen's own hours, because it is the notable one
		// rather than the early one. Reading the row in file order put "Opens at
		// 7 PM" on screen all morning. Kept as a fixture rather than read from
		// the file, since marking that set not physically open is a separate
		// change and would stop the real file exercising this.
		let building = makeBuilding([
			{
				title: 'On Campus Pizza Delivery',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00pm', to: '12:00am'}],
			},
			{
				title: 'Hours',
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '11:00am', to: '2:00pm'},
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '12:00am'},
				],
			},
		])

		expect(contextualStatus(building, moment.tz('2026-09-07 10:00', timezone)).short).toBe(
			'Opens at 11 AM',
		)
		// And again once the first window has passed: the answer moves to the
		// kitchen's evening window, still not the delivery one.
		expect(contextualStatus(building, moment.tz('2026-09-07 14:30', timezone)).short).toBe(
			'Opens at 5 PM',
		)
	})

	it('names the earliest opening when one set lists its rows out of order', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Mo'], from: '5:00pm', to: '8:00pm'},
					{days: ['Mo'], from: '9:00am', to: '12:00pm'},
				],
			},
		])
		let now = moment.tz('2026-09-07 08:00', timezone) // Monday 8am

		expect(contextualStatus(building, now).short).toBe('Opens at 9 AM')
	})

	it('returns "Opens in X min" when almost open', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '5:00pm', to: '11:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 16:45', timezone) // Monday 4:45pm
		let result = contextualStatus(building, now)
		expect(result.short).toMatch(/Opens in \d+ min/u)
	})

	it('reports the window carried over from last night', () => {
		// data/building-hours/8-bc.yaml: Buntrock runs to 1am on Friday and
		// Saturday nights, so Sunday at 12:30am sits inside Saturday's window.
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Su', 'Mo', 'Tu', 'We', 'Th'], from: '7:00am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '7:00am', to: '1:00am'},
				],
			},
		])
		let now = moment.tz('2026-09-13 00:30', timezone) // Sunday 12:30am
		expect(contextualStatus(building, now).short).toBe('Closes in 30 min')
	})

	it('does not report a window that no night of the week is running', () => {
		// Thursday's window ended at midnight, so Friday at 12:30am is closed
		// even though Friday's own window also runs past midnight.
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [
					{days: ['Su', 'Mo', 'Tu', 'We', 'Th'], from: '7:00am', to: '12:00am'},
					{days: ['Fr', 'Sa'], from: '7:00am', to: '1:00am'},
				],
			},
		])
		let now = moment.tz('2026-09-11 00:30', timezone) // Friday 12:30am
		expect(contextualStatus(building, now).short).toBe('Opens at 7 AM')
	})

	it('returns "Closed" when nothing opens again today', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-12 14:00', timezone) // Saturday 2pm
		let result = contextualStatus(building, now)
		expect(result.short).toBe('Closed')
	})

	it('counts down to a chapel closure', () => {
		// data/building-hours/3-1-post-office.yaml; Monday chapel is 10:10-10:30am.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:00', timezone) // Monday, ten minutes out

		expect(contextualStatus(building, now)).toEqual({
			short: 'Chapel in 10 min',
			long: 'Closes for chapel in 10 minutes',
		})
	})

	it('says minute in the singular with one minute left', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:09', timezone)

		expect(contextualStatus(building, now)).toEqual({
			short: 'Chapel in 1 min',
			long: 'Closes for chapel in 1 minute',
		})
	})

	it("names the day's real close before the countdown starts", () => {
		// The whole reason chapel stays an overlay: at 9:55 this building is open
		// until five, not until chapel.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 09:55', timezone)

		expect(contextualStatus(building, now).short).toBe('Open until 5 PM')
	})

	it('says when a chapel closure lifts', () => {
		// data/building-hours/3-1-post-office.yaml; Monday chapel is 10:10-10:30am.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:15', timezone)

		expect(contextualStatus(building, now).short).toBe('Reopens at 10:30 AM')
	})

	it('counts down the last ten minutes of chapel', () => {
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}],
			},
		])
		let now = moment.tz('2026-09-07 10:22', timezone)

		expect(contextualStatus(building, now).short).toBe('Reopens in 8 min')
	})

	it('points at the next real opening when the building will not resume', () => {
		// data/building-hours/7-2-health-services.yaml; Thursday chapel runs to
		// 12:35pm, but the 9:00-11:30am window is over by then.
		let building = makeBuilding([
			{
				title: 'Hours',
				closedForChapelTime: true,
				hours: [
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '9:00am', to: '11:30am'},
					{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '1:00pm', to: '4:00pm'},
				],
			},
		])
		let now = moment.tz('2026-09-10 11:15', timezone)

		expect(contextualStatus(building, now).short).toBe('Opens at 1 PM')
	})

	it('names the service when only the service is open', () => {
		// data/building-hours/7-3-sarn.yaml; the advocate line runs 8pm to 8am.
		let building = makeBuilding([
			{title: 'Office', hours: [{days: ['Tu'], from: '7:00pm', to: '8:00pm'}]},
			{
				title: 'Phone',
				isPhysicallyOpen: false,
				status: {symbol: 'phone.circle', name: 'Phone'},
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '8:00pm', to: '8:00am'}],
			},
		])
		let now = moment.tz('2026-09-08 22:00', timezone) // Tuesday 10pm

		expect(contextualStatus(building, now).short).toBe('Phone until 8 AM')
	})

	it('prefers a service open now over a door that opens later', () => {
		// SARN's line runs overnight; its office opens at 10:10am. At 3am the line
		// is what you can actually reach, so the row must not point at the office.
		let building = makeBuilding([
			{title: 'Office', hours: [{days: ['We'], from: '10:10am', to: '10:30am'}]},
			{
				title: 'Phone',
				isPhysicallyOpen: false,
				status: {symbol: 'phone.circle', name: 'Phone'},
				hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '8:00pm', to: '8:00am'}],
			},
		])
		let now = moment.tz('2026-09-09 03:00', timezone) // Wednesday 3am

		expect(contextualStatus(building, now).short).toBe('Phone until 8 AM')
	})
})
