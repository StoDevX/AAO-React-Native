import assert from 'node:assert/strict'
import {readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync, symlinkSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {tmpdir} from 'node:os'
import {join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, it} from 'node:test'
import {load} from 'js-yaml'
import {parseScheduleData} from './schedule-data.ts'

let fixture = (name) =>
	load(readFileSync(new URL(`fixtures/schedules/${name}.yaml`, import.meta.url), 'utf8'))
let closed = () => [{title: 'Closed', isPhysicallyOpen: false, hours: []}]
let pair = () => ({calendar: fixture('calendar'), spaces: fixture('spaces')})
let parse = ({calendar, spaces}) =>
	parseScheduleData(
		{label: 'calendar.yaml', data: calendar},
		spaces.map((data, index) => ({label: `space-${index}.yaml`, data})),
	)

/** Exercises the public selected-file CLI with the repository's paired calendar. */
function validateSelectedSpace(filename) {
	return spawnSync(
		process.execPath,
		[
			fileURLToPath(new URL('validate-data.mjs', import.meta.url)),
			'--data',
			filename,
			'--schema',
			fileURLToPath(new URL('../data/_schemas/building-hours.yaml', import.meta.url)),
		],
		{encoding: 'utf8'},
	)
}

describe('schedule data contracts', () => {
	it('accepts shorthand, full policies, closures, notes, local overrides and date exceptions', () => {
		let input = pair()
		let before = structuredClone(input)
		let result = parse(input)
		assert.deepEqual(input, before)
		assert.notEqual(result.calendar, input.calendar)
		assert.notEqual(result.spaces[0].data, input.spaces[0])
		assert.equal(result.spaces[0].data.breakSchedule.easter, 'spring')
	})

	it('normalizes every shorthand and omitted-exception schedule while preserving references', () => {
		let input = pair()
		input.spaces[0].breakSchedule.fall = {schedule: closed()}
		let {calendar, spaces} = parse(input)
		assert.deepEqual(calendar.templates.closed, {
			schedule: input.calendar.templates.closed,
			exceptions: [],
		})
		assert.deepEqual(calendar.templates['office-hours'], input.calendar.templates['office-hours'])
		assert.deepEqual(calendar.breaks.winter.defaultSpaceSchedule, {
			...input.calendar.breaks.winter.defaultSpaceSchedule,
			exceptions: [],
		})
		assert.deepEqual(calendar.breaks.interim.defaultSpaceSchedule, {
			schedule: input.calendar.breaks.interim.defaultSpaceSchedule,
			exceptions: [],
		})
		assert.deepEqual(calendar.breaks.spring.templates['spring-only'], {
			schedule: input.calendar.breaks.spring.templates['spring-only'],
			exceptions: [],
		})
		assert.deepEqual(
			calendar.breaks.spring.templates['office-hours'],
			input.calendar.breaks.spring.templates['office-hours'],
		)
		assert.deepEqual(spaces[0].data.breakSchedule.fall, {schedule: closed(), exceptions: []})
		assert.deepEqual(spaces[1].data.breakSchedule.fall, {
			schedule: input.spaces[1].breakSchedule.fall,
			exceptions: [],
		})
		assert.deepEqual(spaces[0].data.breakSchedule.interim, input.spaces[0].breakSchedule.interim)
		assert.equal(calendar.breaks.fall.defaultSpaceSchedule, 'closed')
		assert.equal(spaces[0].data.breakSchedule.winter, 'normal')
		assert.equal(spaces[0].data.breakSchedule.spring, 'office-hours')
		assert.equal(spaces[0].data.breakSchedule.easter, 'spring')
		assert.equal(spaces[1].data.breakSchedule.winter, 'inherit')
		assert.deepEqual(spaces[0].data.schedule, input.spaces[0].schedule)
		assert.deepEqual(spaces[0].data.exceptions, input.spaces[0].exceptions)
	})

	it('accepts all current production data under the replacement schemas', () => {
		let calendar = load(readFileSync(new URL('../data/breaks.yaml', import.meta.url), 'utf8'))
		let dir = new URL('../data/building-hours/', import.meta.url)
		let spaces = readdirSync(dir)
			.filter((name) => name.endsWith('.yaml'))
			.map((name) => ({
				label: name,
				data: load(readFileSync(new URL(name, dir), 'utf8')),
			}))
		assert.doesNotThrow(() => parseScheduleData({label: 'breaks.yaml', data: calendar}, spaces))
	})

	it('allows missing overrides and empty mappings without inventing coverage', () => {
		let input = pair()
		delete input.spaces[0].breakSchedule
		input.spaces[1].breakSchedule = {}
		let {spaces} = parse(input)
		assert.equal(Object.hasOwn(spaces[0].data, 'breakSchedule'), false)
		assert.deepEqual(spaces[1].data.breakSchedule, {})
	})

	it('accepts arbitrary calendar keys when a space uses the matching key', () => {
		let input = pair()
		input.calendar.breaks.readingDay = {name: 'Reading Day', date: '2027-05-18'}
		input.spaces[0].breakSchedule.readingDay = 'normal'
		assert.doesNotThrow(() => parse(input))
	})

	it('keeps cross-file key checks active for an explicitly selected file', () => {
		let dir = mkdtempSync(join(tmpdir(), 'aao-schedule-validation-'))
		try {
			let data = fixture('spaces')[0]
			data.breakSchedule = {fal: 'normal'}
			let path = join(dir, 'hours.yaml')
			writeFileSync(path, JSON.stringify(data))
			let result = validateSelectedSpace(path)
			assert.equal(result.status, 1)
			assert.match(result.stderr, /breakSchedule.fal.*unknown break key/u)
		} finally {
			rmSync(dir, {recursive: true, force: true})
		}
	})

	it('rejects a selected file whose space name duplicates another authored space', () => {
		let dir = mkdtempSync(join(tmpdir(), 'aao-selected-duplicate-'))
		try {
			let data = load(
				readFileSync(new URL('../data/building-hours/1-1-cage.yaml', import.meta.url), 'utf8'),
			)
			let filename = join(dir, 'duplicate.yaml')
			writeFileSync(filename, JSON.stringify(data))
			let result = validateSelectedSpace(filename)
			assert.equal(result.status, 1, result.stderr)
			assert.match(
				result.stderr,
				/duplicate space name.*first defined at building-hours\/1-1-cage.yaml.name/u,
			)
			assert.ok(result.stderr.includes(filename + '.name'))
		} finally {
			rmSync(dir, {recursive: true, force: true})
		}
	})

	for (let form of ['absolute', 'relative', 'symlink']) {
		it('does not count a selected existing space twice through its ' + form + ' path', () => {
			let dir = mkdtempSync(join(tmpdir(), 'aao-selected-existing-'))
			try {
				let original = fileURLToPath(
					new URL('../data/building-hours/1-1-cage.yaml', import.meta.url),
				)
				let filename = original
				if (form === 'relative') filename = relative(process.cwd(), original)
				if (form === 'symlink') {
					filename = join(dir, 'hours.yaml')
					symlinkSync(original, filename)
				}
				let result = validateSelectedSpace(filename)
				assert.equal(result.status, 0, result.stderr)
			} finally {
				rmSync(dir, {recursive: true, force: true})
			}
		})
	}

	it('allows the same exception date in independent policies', () => {
		let input = pair()
		input.spaces[0].breakSchedule.fall = 'office-hours'
		assert.doesNotThrow(() => parse(input))
	})

	it('checks aliases in the target break context, including forward chains', () => {
		let input = pair()
		input.spaces[0].breakSchedule = {winter: 'easter', easter: 'spring', spring: 'spring-only'}
		assert.doesNotThrow(() => parse(input))
	})

	it('permits defaults that use a break-local template', () => {
		let input = pair()
		input.calendar.breaks.spring.defaultSpaceSchedule = 'spring-only'
		input.spaces[0].breakSchedule.spring = 'inherit'
		assert.doesNotThrow(() => parse(input))
	})

	it('accepts nonoverlapping adjacent equal-span intervals', () => {
		let input = pair()
		input.calendar.breaks = {
			first: {name: 'First', start: '2026-03-07', end: '2026-03-09'},
			second: {name: 'Second', start: '2026-03-10', end: '2026-03-12'},
		}
		input.spaces = []
		assert.doesNotThrow(() => parse(input))
	})

	for (let [name, select] of [
		['calendar', ({calendar}) => calendar],
		['break', ({calendar}) => calendar.breaks.fall],
		['global template', ({calendar}) => calendar.templates['office-hours']],
		['local template', ({calendar}) => calendar.breaks.spring.templates['office-hours']],
		['default policy', ({calendar}) => calendar.breaks.winter.defaultSpaceSchedule],
		['space', ({spaces}) => spaces[0]],
		['service', ({spaces}) => spaces[0].schedule[0]],
		['hours row', ({spaces}) => spaces[0].schedule[0].hours[0]],
		['exception', ({spaces}) => spaces[0].exceptions[0]],
		['inline break policy', ({spaces}) => spaces[0].breakSchedule.interim],
	]) {
		it('retains additive metadata on a ' + name, () => {
			let input = pair()
			select(input).futureMetadata = {nested: [1, 2]}
			let before = structuredClone(input)
			let result = parse(input)
			assert.deepEqual(input, before)
			let normalized = {calendar: result.calendar, spaces: result.spaces.map(({data}) => data)}
			assert.deepEqual(select(normalized).futureMetadata, {nested: [1, 2]})
		})
	}

	it('normalizes normal exceptions and keeps normal references and aliases unresolved', () => {
		let input = pair()
		input.spaces[0].breakSchedule = {winter: 'normal', fall: 'winter'}
		let {spaces} = parse(input)
		assert.deepEqual(spaces[0].data.exceptions, input.spaces[0].exceptions)
		assert.deepEqual(spaces[1].data.exceptions, [])
		assert.deepEqual(spaces[0].data.breakSchedule, {winter: 'normal', fall: 'winter'})
	})

	it('keeps a local template as a complete policy without global exceptions', () => {
		let input = pair()
		input.calendar.breaks.spring.templates['office-hours'] = {schedule: closed()}
		input.calendar.breaks.spring.defaultSpaceSchedule = 'office-hours'
		input.spaces[0].breakSchedule = {spring: 'inherit', easter: 'spring'}
		let {calendar, spaces} = parse(input)
		assert.deepEqual(calendar.breaks.spring.templates['office-hours'], {
			schedule: closed(),
			exceptions: [],
		})
		assert.ok(calendar.templates['office-hours'].exceptions.length > 0)
		assert.equal(calendar.breaks.spring.defaultSpaceSchedule, 'office-hours')
		assert.deepEqual(spaces[0].data.breakSchedule, input.spaces[0].breakSchedule)
	})

	it('accepts nested intervals, reusable out-of-range exceptions and an empty calendar', () => {
		let input = pair()
		input.calendar.breaks.fall = {
			...input.calendar.breaks.fall,
			name: 'Outer',
			start: '2026-10-01',
			end: '2026-10-31',
		}
		input.calendar.breaks.inner = {name: 'Inner', date: '2026-10-10'}
		assert.doesNotThrow(() => parse(input))
		assert.doesNotThrow(() => parse({calendar: {timezone: 'UTC', breaks: {}}, spaces: []}))
	})

	it('accepts adjacent breaks after a skipped midnight', () => {
		assert.doesNotThrow(() =>
			parse({
				calendar: {
					timezone: 'America/Santiago',
					breaks: {
						first: {name: 'DST day', date: '2026-09-06'},
						second: {name: 'Next day', date: '2026-09-07'},
					},
				},
				spaces: [],
			}),
		)
	})

	let invalid = (name, mutate, message) =>
		it(name, () => {
			let input = pair()
			mutate(input)
			assert.throws(() => parse(input), message)
		})

	for (let time of ['0:00am', '19:00pm', '9:5am', '01:00am', '12:60pm']) {
		invalid(
			'rejects invalid clock time ' + time,
			({spaces}) => {
				spaces[0].schedule[0].hours[0].from = time
			},
			/pattern/u,
		)
	}
	for (let time of ['1:00am', '9:05am', '12:00pm', '11:59pm']) {
		it('accepts clock time ' + time, () => {
			let input = pair()
			input.spaces[0].schedule[0].hours[0].from = time
			assert.doesNotThrow(() => parse(input))
		})
	}
	for (let name of ['', '   ']) {
		invalid(
			'rejects blank space name ' + JSON.stringify(name),
			({spaces}) => {
				spaces[0].name = name
			},
			/pattern/u,
		)
	}
	invalid(
		'rejects duplicate space names with both locations',
		({spaces}) => {
			spaces[1].name = spaces[0].name
		},
		/space-1.yaml.name: duplicate space name Example office; first defined at space-0.yaml.name/u,
	)
	invalid(
		'rejects duplicate weekdays',
		({spaces}) => {
			spaces[0].schedule[0].hours[0].days = ['Mo', 'Mo']
		},
		/duplicate items/u,
	)
	for (let [start, end] of [
		['2026-10-12', '2026-10-16'],
		['2026-10-07', '2026-10-11'],
	]) {
		invalid(
			'rejects partial overlap starting ' + start,
			({calendar}) => {
				calendar.breaks.other = {name: 'Other', start, end}
			},
			/partially overlaps/u,
		)
	}
	invalid(
		'validates a global template even when locally shadowed everywhere',
		({calendar, spaces}) => {
			spaces.length = 0
			calendar.templates['office-hours'].exceptions.push(
				structuredClone(calendar.templates['office-hours'].exceptions[0]),
			)
		},
		/templates.office-hours.*duplicate exception/u,
	)
	invalid(
		'validates unused local templates',
		({calendar, spaces}) => {
			spaces.length = 0
			calendar.breaks.spring.templates['office-hours'].exceptions[0].date = '2026-04-31'
		},
		/format "date"/u,
	)
	invalid(
		'rejects unused alias cycles without a path from another policy',
		({spaces}) => {
			spaces[0].breakSchedule = {fall: 'normal', winter: 'spring', spring: 'winter'}
		},
		/winter -> spring -> winter/u,
	)
	invalid(
		'rejects equal spans across fall DST',
		({calendar, spaces}) => {
			calendar.breaks = {
				first: {name: 'First', start: '2026-10-31', end: '2026-11-02'},
				second: {name: 'Second', start: '2026-11-02', end: '2026-11-04'},
			}
			spaces.length = 0
		},
		/equal calendar-day span/u,
	)

	invalid(
		'rejects typoed space keys',
		({spaces}) => {
			spaces[0].breakSchedule.fal = 'normal'
		},
		/space-0.yaml.breakSchedule.fal.*unknown break key/u,
	)
	invalid(
		'rejects metadata mis-indented as a break override',
		({spaces}) => {
			spaces[0].breakSchedule.building = 'tomson'
		},
		/breakSchedule.building.*unknown break key/u,
	)
	invalid(
		'rejects unknown template names',
		({spaces}) => {
			spaces[0].breakSchedule.spring = 'typo'
		},
		/unknown template typo/u,
	)
	invalid(
		'does not find a template defined only in another break',
		({spaces}) => {
			spaces[0].breakSchedule.easter = 'spring-only'
		},
		/spring-only in easter's context/u,
	)
	invalid(
		'rejects missing alias targets even when the target break has a default',
		({spaces}) => {
			spaces[0].breakSchedule.easter = 'fall'
			delete spaces[0].breakSchedule.fall
		},
		/breakSchedule.fall.*missing authored alias target/u,
	)
	invalid(
		'rejects self-references',
		({spaces}) => {
			spaces[0].breakSchedule.easter = 'easter'
		},
		/cannot reference itself/u,
	)
	invalid(
		'rejects cycles',
		({spaces}) => {
			spaces[0].breakSchedule = {fall: 'winter', winter: 'spring', spring: 'fall'}
		},
		/fall -> winter -> spring -> fall/u,
	)
	invalid(
		'rejects inherit without a default',
		({spaces}) => {
			spaces[0].breakSchedule.easter = 'inherit'
		},
		/inherit requires a break default/u,
	)
	invalid(
		'checks every entry in an alias chain',
		({spaces}) => {
			spaces[0].breakSchedule.easter = 'spring'
			spaces[0].breakSchedule.spring = 'inherit'
		},
		/breakSchedule.spring.*inherit requires/u,
	)
	invalid(
		'rejects global template names colliding with break keys',
		({calendar}) => {
			calendar.templates.fall = closed()
		},
		/names must be disjoint/u,
	)
	invalid(
		'rejects local template names colliding with any break key',
		({calendar}) => {
			calendar.breaks.spring.templates.fall = closed()
		},
		/names must be disjoint/u,
	)

	for (let name of ['normal', 'inherit']) {
		invalid(
			`reserves ${name} as a break key`,
			({calendar}) => {
				calendar.breaks[name] = {name, date: '2027-05-18'}
			},
			/reserved name/u,
		)
		invalid(
			`reserves ${name} as a global template name`,
			({calendar}) => {
				calendar.templates[name] = closed()
			},
			/reserved name/u,
		)
		invalid(
			`reserves ${name} as a local template name`,
			({calendar}) => {
				calendar.breaks.spring.templates[name] = closed()
			},
			/reserved name/u,
		)
		invalid(
			`rejects ${name} as a default`,
			({calendar}) => {
				calendar.breaks.fall.defaultSpaceSchedule = name
			},
			/defaults cannot use/u,
		)
	}
	invalid(
		'rejects cross-break default references',
		({calendar}) => {
			calendar.breaks.fall.defaultSpaceSchedule = 'winter'
		},
		/defaults cannot use/u,
	)
	invalid(
		'rejects unknown defaults even when no space inherits them',
		({calendar}) => {
			calendar.breaks.fall.defaultSpaceSchedule = 'unknown'
		},
		/unknown template unknown/u,
	)
	invalid(
		'does not accept inherited Object prototype names as templates',
		({spaces}) => {
			spaces[0].breakSchedule.fall = 'toString'
		},
		/unknown template toString/u,
	)
	invalid(
		'rejects references inside global templates',
		({calendar}) => {
			calendar.templates.closed = 'office-hours'
		},
		/calendar.yaml.*templates.*closed/u,
	)
	invalid(
		'rejects references inside local templates',
		({calendar}) => {
			calendar.breaks.spring.templates['spring-only'] = 'office-hours'
		},
		/calendar.yaml.*breaks.*spring.*templates/u,
	)

	for (let [name, select] of [
		['normal schedule', ({spaces}) => spaces[0]],
		['inline break policy', ({spaces}) => spaces[0].breakSchedule.interim],
		['default policy', ({calendar}) => calendar.breaks.winter.defaultSpaceSchedule],
		['global template', ({calendar}) => calendar.templates['office-hours']],
		['local template', ({calendar}) => calendar.breaks.spring.templates['office-hours']],
		['space exception', ({spaces}) => spaces[0].exceptions[0]],
		['break exception', ({spaces}) => spaces[0].breakSchedule.interim.exceptions[0]],
	]) {
		invalid(
			`rejects an empty ${name}`,
			(input) => {
				select(input).schedule = []
			},
			/fewer than 1 items/u,
		)
	}
	invalid(
		'rejects an empty shorthand policy',
		({spaces}) => {
			spaces[0].breakSchedule.fall = []
		},
		/fewer than 1 items/u,
	)
	invalid(
		'rejects an incomplete service block',
		({spaces}) => {
			delete spaces[0].schedule[0].hours
		},
		/required property 'hours'/u,
	)
	invalid(
		'rejects a block without a title',
		({spaces}) => {
			delete spaces[0].schedule[0].title
		},
		/required property 'title'/u,
	)
	invalid(
		'rejects empty hours without a closure or explanation',
		({spaces}) => {
			spaces[0].schedule = [{title: 'Hours', hours: []}]
		},
		/anyOf/u,
	)
	invalid(
		'rejects empty hours with only isPhysicallyOpen true',
		({spaces}) => {
			spaces[0].schedule = [{title: 'Hours', isPhysicallyOpen: true, hours: []}]
		},
		/anyOf/u,
	)
	invalid(
		'rejects blank explanatory notes',
		({spaces}) => {
			spaces[0].schedule = [{title: 'Hours', notes: '   ', hours: []}]
		},
		/pattern/u,
	)

	invalid(
		'rejects empty weekdays',
		({spaces}) => {
			spaces[0].schedule[0].hours[0].days = []
		},
		/fewer than 1 items/u,
	)
	invalid(
		'rejects incomplete hours rows',
		({spaces}) => {
			delete spaces[0].schedule[0].hours[0].from
		},
		/required property 'from'/u,
	)
	invalid(
		'rejects invalid weekdays',
		({spaces}) => {
			spaces[0].schedule[0].hours[0].days = ['Monday']
		},
		/allowed values/u,
	)
	invalid(
		'rejects malformed times',
		({spaces}) => {
			spaces[0].schedule[0].hours[0].from = '25:99am'
		},
		/pattern/u,
	)

	for (let [name, select] of [
		['space', ({spaces}) => spaces[0]],
		['break', ({spaces}) => spaces[0].breakSchedule.interim],
		['template', ({calendar}) => calendar.templates['office-hours']],
	]) {
		invalid(
			`rejects duplicate ${name} exception dates`,
			(input) => {
				let policy = select(input)
				policy.exceptions.push(structuredClone(policy.exceptions[0]))
			},
			/duplicate exception date/u,
		)
		invalid(
			`rejects an invalid ${name} exception date`,
			(input) => {
				select(input).exceptions[0].date = '2026-02-29'
			},
			/format "date"/u,
		)
		invalid(
			`rejects a ${name} exception range`,
			(input) => {
				let entry = select(input).exceptions[0]
				delete entry.date
				entry.start = '2026-10-10'
				entry.end = '2026-10-13'
			},
			/required property 'date'/u,
		)
	}

	invalid(
		'rejects unknown timezones',
		({calendar}) => {
			calendar.timezone = 'Invalid/Timezone'
		},
		/calendar.yaml.timezone/u,
	)
	invalid(
		'rejects missing timezones',
		({calendar}) => {
			delete calendar.timezone
		},
		/required property 'timezone'/u,
	)
	invalid(
		'rejects invalid calendar dates',
		({calendar}) => {
			calendar.breaks.easter.date = '2027-02-29'
		},
		/format "date"/u,
	)
	invalid(
		'rejects timestamp calendar boundaries',
		({calendar}) => {
			calendar.breaks.fall.start = '2026-10-10T00:00:00Z'
		},
		/format "date"/u,
	)
	invalid(
		'rejects reversed intervals',
		({calendar}) => {
			calendar.breaks.fall.end = '2026-10-09'
		},
		/on or before/u,
	)
	invalid(
		'rejects mixed singleton and range forms',
		({calendar}) => {
			calendar.breaks.fall.date = '2026-10-10'
		},
		/oneOf/u,
	)
	invalid(
		'rejects incomplete ranges',
		({calendar}) => {
			delete calendar.breaks.fall.end
		},
		/oneOf/u,
	)
	invalid(
		'rejects missing names',
		({calendar}) => {
			delete calendar.breaks.fall.name
		},
		/required property 'name'/u,
	)
	invalid(
		'rejects normalized duplicate intervals',
		({calendar}) => {
			calendar.breaks.duplicate = {name: 'Duplicate Easter', start: '2027-03-28', end: '2027-03-28'}
		},
		/duplicates the interval of easter/u,
	)
	invalid(
		'rejects overlapping equal calendar spans despite differing DST durations',
		({calendar, spaces}) => {
			calendar.breaks = {
				first: {name: 'First', start: '2026-03-07', end: '2026-03-09'},
				second: {name: 'Second', start: '2026-03-09', end: '2026-03-11'},
			}
			spaces.length = 0
		},
		/overlaps first with an equal calendar-day span/u,
	)
})

describe('server schedule contract fixtures', () => {
	let response = (name) =>
		JSON.parse(readFileSync(new URL(`fixtures/schedules/${name}.json`, import.meta.url), 'utf8'))

	it('keeps complete hours and only the input break keys in canonical responses', () => {
		let {calendar, spaces} = pair()
		let expected = response('spaces-resolved').data
		assert.equal(expected.length, spaces.length)
		for (let [index, actual] of expected.entries()) {
			let {breakSchedule: entries, ...fields} = actual
			let {breakSchedule: inputEntries, ...inputFields} = spaces[index]
			assert.deepEqual(fields, inputFields)
			assert.deepEqual(Object.keys(entries), Object.keys(inputEntries))
			for (let schedule of Object.values(entries)) {
				assert.equal(typeof schedule, 'object')
				assert.equal(Array.isArray(schedule), false)
				assert.ok(Array.isArray(schedule.schedule))
				assert.ok(Array.isArray(schedule.exceptions))
			}
		}
		assert.deepEqual(
			parse({calendar, spaces: expected}).spaces.map(({data}) => data),
			expected.map((space) => ({...space, exceptions: space.exceptions ?? []})),
		)
	})

	it('specifies complete replacements, target-context aliases and independent exceptions', () => {
		let {calendar, spaces} = pair()
		let [office, building] = response('spaces-resolved').data
		let spring = calendar.breaks.spring.templates['office-hours']
		assert.deepEqual(office.breakSchedule.spring, spring)
		assert.deepEqual(office.breakSchedule.easter, spring)
		assert.notDeepEqual(office.breakSchedule.spring, calendar.templates['office-hours'])
		assert.deepEqual(office.breakSchedule.fall, {
			schedule: calendar.templates.closed,
			exceptions: [],
		})
		assert.deepEqual(office.breakSchedule.winter, {
			schedule: spaces[0].schedule,
			exceptions: spaces[0].exceptions,
		})
		assert.deepEqual(office.exceptions, spaces[0].exceptions)
		assert.deepEqual(office.breakSchedule.interim, spaces[0].breakSchedule.interim)
		assert.deepEqual(building.breakSchedule.fall, {
			schedule: spaces[1].breakSchedule.fall,
			exceptions: [],
		})
		assert.deepEqual(building.breakSchedule.winter, {
			...calendar.breaks.winter.defaultSpaceSchedule,
			exceptions: [],
		})
		assert.deepEqual(building.breakSchedule.interim, office.breakSchedule.fall)
		assert.equal(Object.hasOwn(building.breakSchedule, 'easter'), false)
	})

	it('limits the calendar response to its timezone and keyed names and dates', () => {
		let calendar = fixture('calendar')
		let expected = response('calendar-response')
		assert.deepEqual(Object.keys(expected), ['data'])
		assert.deepEqual(Object.keys(expected.data), ['timezone', 'breaks'])
		assert.equal(expected.data.timezone, calendar.timezone)
		assert.deepEqual(Object.keys(expected.data.breaks), Object.keys(calendar.breaks))
		for (let [key, entry] of Object.entries(calendar.breaks)) {
			let {defaultSpaceSchedule: _default, templates: _templates, ...dates} = entry
			assert.deepEqual(expected.data.breaks[key], dates)
		}
		assert.doesNotThrow(() => parse({calendar: expected.data, spaces: []}))
	})
})
