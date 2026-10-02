import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {describe, test} from 'node:test'
import {load} from 'js-yaml'
import {diffSchedule, parseSchedule, postContent, renderSchedule} from './ksto-schedule.mjs'

let response = JSON.parse(
	readFileSync(new URL('fixtures/ksto-schedule/now-playing.json', import.meta.url), 'utf8'),
)

/** A script in the post's own shape, with every hour off air unless `slots` names a show. */
function script({shows = ['Morning Show'], slots = {}, days = [0, 1, 2, 3, 4, 5, 6]} = {}) {
	let showList = shows.map((name) => `{ name: ${JSON.stringify(name)} }`).join(',\n')
	let table = days
		.map((day) => {
			let hours = Array.from({length: 24}, (_, hour) => {
				let name = slots[`${day}:${hour}`]
				return `${hour}: ${name ? `showDefs.getShow(${JSON.stringify(name)})` : 'noShow'}`
			})
			return `${day}: {\n${hours.join(',\n')}\n}`
		})
		.join(',\n')
	return `
		let noShow = { name: "KSTO RADIO", genre: "", poster: "" };
		let shows = [${showList}];
		let showDefs = new Map();
		let nowPlaying = {${table}};
		document.getElementById("now-playing").textContent = nowPlaying[0][0].name;
	`
}

describe('postContent', () => {
	test('takes the schedule script and the UTC edit time from the API response', () => {
		let {script: found, updated} = postContent(response)
		assert.match(found, /let nowPlaying = \{/u)
		assert.equal(updated, '2026-03-22T16:24:01Z')
	})

	test('finds the script however its tags are cased or spaced', () => {
		let {script: found} = postContent({
			modified_gmt: '2026-03-22T16:24:01',
			content: {rendered: '<SCRIPT type="text/javascript">let nowPlaying = {}</script >'},
		})
		assert.equal(found, 'let nowPlaying = {}')
	})

	test('refuses a response without the modified time', () => {
		assert.throws(
			() => postContent({content: {rendered: '<script>let nowPlaying = {}</script>'}}),
			{
				message: /modified_gmt/u,
			},
		)
	})

	test('refuses a post with no schedule script', () => {
		assert.throws(
			() =>
				postContent({modified_gmt: '2026-03-22T16:24:01', content: {rendered: '<p>On break</p>'}}),
			{message: /found 0/u},
		)
	})
})

describe('parseSchedule', () => {
	let published = parseSchedule(postContent(response).script)

	test('finds every scheduled hour on the published post', () => {
		assert.equal(published.length, 52)
	})

	test('reads the station hour, not the reader’s: Friday at 2pm is the golf cart show', () => {
		assert.deepEqual(
			published.find((slot) => slot.title === 'Guys in Golf Carts Doing Gags'),
			{
				day: 'friday',
				start: '14:00',
				end: '15:00',
				title: 'Guys in Golf Carts Doing Gags',
				genre: undefined,
				poster:
					'https://www.kstoradio.org/wp-content/uploads/sites/1178/2025/10/3-GUYS-1-GOLF-CART-MANY-GAGS-6.jpg',
			},
		)
	})

	test('keeps image posters and drops the PDFs the app cannot draw', () => {
		let poster = (title) => published.find((slot) => slot.title === title)?.poster
		assert.equal(poster('Radio Free Northfield'), undefined)
		assert.match(poster('LIGHTS OUT with Ella'), /\.jpg$/u)
	})

	test('lists the week from Monday, in order of start', () => {
		assert.equal(published[0].day, 'monday')
		assert.equal(published.at(-1).day, 'sunday')
	})

	test('joins neighbouring hours of one show into one slot', () => {
		let slots = parseSchedule(
			script({slots: {'1:8': 'Morning Show', '1:9': 'Morning Show', '1:11': 'Morning Show'}}),
		)
		assert.deepEqual(
			slots.map(({day, start, end}) => `${day} ${start}–${end}`),
			['monday 08:00–10:00', 'monday 11:00–12:00'],
		)
	})

	test('ends a show in the last hour of the day at 24:00', () => {
		let [slot] = parseSchedule(script({slots: {'0:23': 'Morning Show'}}))
		assert.equal(slot.end, '24:00')
	})

	test('looks shows up the way the post does, ignoring case and spacing', () => {
		let [slot] = parseSchedule(script({slots: {'2:10': '  morning SHOW '}}))
		assert.equal(slot.title, 'Morning Show')
	})

	test('refuses a day that is missing', () => {
		assert.throws(() => parseSchedule(script({days: [0, 1, 2, 3, 4, 5]})), {message: /saturday/u})
	})

	test('refuses an hour naming a show the post never defines', () => {
		assert.throws(() => parseSchedule(script({slots: {'3:12': 'Ghost Hour'}})), {
			message: /Ghost Hour/u,
		})
	})

	test('refuses an hour it does not understand, rather than guess', () => {
		let odd = script().replace('5: noShow', '5: pickAShow()')
		assert.throws(() => parseSchedule(odd), {message: /neither noShow nor/u})
	})

	test('drops a poster that is not an https image', () => {
		let [slot] = parseSchedule(
			script({slots: {'1:8': 'Morning Show'}}).replace(
				'{ name: "Morning Show" }',
				'{ name: "Morning Show", poster: "http://example.com/a.jpg" }',
			),
		)
		assert.equal(slot.poster, undefined)
	})

	test('refuses a script that does not parse', () => {
		assert.throws(() => parseSchedule('let nowPlaying = {'), {message: /does not parse/u})
	})
})

describe('renderSchedule', () => {
	let slots = [
		{day: 'friday', start: '14:00', end: '15:00', title: "Ale's hour"},
		{day: 'sunday', start: '23:00', end: '24:00', title: 'yes', genre: 'Jazz'},
	]

	test('writes a file that reads back as the same schedule', () => {
		let read = load(renderSchedule({updated: '2026-03-22T16:24:01Z', slots}))
		assert.deepEqual(read, {
			updated: '2026-03-22T16:24:01Z',
			timezone: 'America/Chicago',
			shows: slots,
		})
	})

	test('quotes every title, so one that looks like a boolean stays a string', () => {
		assert.match(renderSchedule({updated: '2026-03-22T16:24:01Z', slots}), /title: 'yes'/u)
	})
})

describe('diffSchedule', () => {
	test('names the slots each side has that the other lacks', () => {
		let a = {day: 'monday', start: '09:00', end: '10:00', title: 'A'}
		let b = {day: 'monday', start: '10:00', end: '11:00', title: 'B'}
		assert.deepEqual(diffSchedule([a], [b]), {
			added: ['monday 10:00–11:00 B'],
			removed: ['monday 09:00–10:00 A'],
		})
	})
})

test('data/ksto-schedule.yaml is laid out as the scrape writes it', () => {
	let file = readFileSync(new URL('../data/ksto-schedule.yaml', import.meta.url), 'utf8')
	let {updated, shows} = load(file)
	assert.equal(renderSchedule({updated, slots: shows}), file)
})
