import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {composeSchedule, parseWeeklySchedule} from './bonapp-schedule.mjs'

let fixture = (slug) =>
	readFileSync(new URL(`fixtures/bonapp/${slug}.html`, import.meta.url), 'utf8')

let STAV = {
	dayparts: {Breakfast: 'Breakfast', Brunch: 'Lunch', Lunch: 'Lunch', Dinner: 'Dinner'},
	skip: ['Continuous Dining'],
}

let CAGE = {
	dayparts: {'The Cage': 'Hours', Breakfast: 'Continental Breakfast Meal Swipe'},
	notes: {Hours: 'The kitchen stops cooking at 8 p.m.'},
}

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

test('composes Stav in the shape the data files use', () => {
	let block = composeSchedule(parseWeeklySchedule(fixture('stav-hall')), STAV)
	assert.equal(
		block,
		`schedule:
  - title: Breakfast
    hours:
      - {days: [Mo, Tu, We, Th, Fr], from: '7:15am', to: '9:45am'}
      - {days: [Sa], from: '8:00am', to: '9:30am'}
      - {days: [Su], from: '9:00am', to: '10:30am'}

  - title: Lunch
    hours:
      - {days: [Mo, Tu, We, Th, Fr], from: '10:30am', to: '2:00pm'}
      - {days: [Sa], from: '11:00am', to: '1:30pm'}
      - {days: [Su], from: '10:30am', to: '1:30pm'}

  - title: Dinner
    hours:
      - {days: [Mo, Tu, We, Th], from: '4:30pm', to: '8:00pm'}
      - {days: [Fr, Sa, Su], from: '4:30pm', to: '7:30pm'}

`,
	)
})

test('orders rows by first day, not by start time', () => {
	// Saturday brunch starts at 11:00 and Sunday brunch at 10:30, so sorting by
	// start time would put Sunday above Saturday and contradict every other file
	// in data/building-hours.
	let block = composeSchedule(parseWeeklySchedule(fixture('stav-hall')), STAV)
	let lunch = block.slice(block.indexOf('title: Lunch'))
	assert.ok(lunch.indexOf('[Sa]') < lunch.indexOf('[Su]'))
})

test('merges Brunch into Lunch rather than making a second section', () => {
	let block = composeSchedule(parseWeeklySchedule(fixture('stav-hall')), STAV)
	assert.ok(!block.includes('Brunch'))
	assert.equal(block.match(/- title:/gu).length, 3)
})

test('drops a skipped daypart', () => {
	let block = composeSchedule(parseWeeklySchedule(fixture('stav-hall')), STAV)
	assert.ok(!block.includes('Continuous'))
	// Continuous Dining is the only thing running to 10:30am or from 2:00pm.
	assert.ok(!block.includes("to: '10:30am'}\n      - {days: [Mo, Tu, We, Th, Fr], from: '2:00pm'"))
})

test('sections follow the dayparts map, not the page', () => {
	// The Cage's page lists Sunday Breakfast first; our file leads with Hours.
	let block = composeSchedule(parseWeeklySchedule(fixture('the-cage')), CAGE)
	assert.ok(block.indexOf('title: Hours') < block.indexOf('title: Continental'))
})

test('emits the hand-written note from the overrides', () => {
	let block = composeSchedule(parseWeeklySchedule(fixture('the-cage')), CAGE)
	assert.ok(
		block.includes(
			'  - title: Hours\n    notes: The kitchen stops cooking at 8 p.m.\n    hours:\n',
		),
	)
})

test('throws on a daypart that is neither mapped nor skipped', () => {
	let rows = [{daypart: 'Second Breakfast', days: ['Mo'], from: '9:00am', to: '10:00am'}]
	assert.throws(() => composeSchedule(rows, STAV), /Second Breakfast/u)
})
