import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {parseWeeklySchedule} from './bonapp-schedule.mjs'

let fixture = (slug) =>
	readFileSync(new URL(`fixtures/bonapp/${slug}.html`, import.meta.url), 'utf8')

test('parses every weekly row from Stav Hall', () => {
	let rows = parseWeeklySchedule(fixture('stav-hall'))
	assert.equal(rows.length, 10)
	assert.deepEqual(rows[0], {
		daypart: 'Breakfast',
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
		from: '7:15am',
		to: '9:45am',
	})
	assert.deepEqual(rows[2], {
		daypart: 'Breakfast',
		days: ['Su'],
		from: '9:00am',
		to: '10:30am',
	})
	assert.deepEqual(rows[9], {
		daypart: 'Continuous Dining',
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
		from: '2:00pm',
		to: '4:30pm',
	})
})

test("ignores the today's-hours list, which shares a class but is not a day-part", () => {
	// The Stav fixture carries 13 dotted-leader rows and only 10 day-parts. The
	// three extra belong to the "open now" list above the weekly one, and name
	// no days -- picking them up would invent hours for every day of the week.
	let rows = parseWeeklySchedule(fixture('stav-hall'))
	assert.ok(rows.every((row) => row.days.length > 0))
	assert.ok(!rows.some((row) => row.daypart === ''))
})

test('expands a Mon-Sun range across the whole week', () => {
	let rows = parseWeeklySchedule(fixture('the-cave'))
	assert.deepEqual(rows, [
		{
			daypart: "Grab 'n' Go",
			days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
			from: '9:00am',
			to: '9:00pm',
		},
	])
})

test('reads the Cage, whose daypart is named after the venue', () => {
	let rows = parseWeeklySchedule(fixture('the-cage'))
	assert.deepEqual(rows[0], {
		daypart: 'Breakfast',
		days: ['Su'],
		from: '9:00am',
		to: '10:30am',
	})
	assert.deepEqual(rows[1], {
		daypart: 'The Cage',
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
		from: '7:30am',
		to: '8:00pm',
	})
})

test('throws when the page carries no Weekly Schedule', () => {
	assert.throws(
		() => parseWeeklySchedule('<html><body>Closed for the summer</body></html>'),
		/Weekly Schedule/u,
	)
})

test('throws when the heading is present but no rows parse', () => {
	assert.throws(
		() => parseWeeklySchedule("<p class='current-status'>Weekly Schedule</p><ul></ul>"),
		/no day-part rows/u,
	)
})

test('throws on a time the data schema would reject', () => {
	let html =
		"<p class='current-status'>Weekly Schedule</p>" +
		"<li class='day-part'><span class='pull-left'>Lunch</span>" +
		"<span class='pull-right'>Mon, 25:99 xm - 1:30 pm</span></li>"
	assert.throws(() => parseWeeklySchedule(html), /25:99 xm/u)
})
