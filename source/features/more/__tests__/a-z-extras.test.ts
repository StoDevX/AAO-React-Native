import {parseAToZExtras, parseStolafAToZ} from '../parsers/a-z-extras'

test('drops a malformed group while keeping its valid siblings', () => {
	const parsed = parseStolafAToZ({
		az_nav: {
			menu_items: [
				{letter: 'A', values: [{label: 'Alpha', url: 'https://stolaf.edu/alpha'}]},
				'garbage',
				{letter: 'M', values: [{label: 'Music', url: 'https://stolaf.edu/music'}]},
			],
		},
	})
	expect(parsed.map((group) => group.title)).toStrictEqual(['A', 'M'])
})

test('throws when every group in a non-empty list is malformed', () => {
	expect(() =>
		parseStolafAToZ({az_nav: {menu_items: ['garbage', 42, null, {foo: 'bar'}]}}),
	).toThrow()
})

test('returns an empty list when the upstream legitimately publishes no groups', () => {
	expect(parseStolafAToZ({az_nav: {menu_items: []}})).toStrictEqual([])
})

test('extras: throws when every group in a non-empty list is malformed', () => {
	expect(() => parseAToZExtras({data: ['garbage', 42, null, {foo: 'bar'}]})).toThrow()
})

test('extras: returns an empty list when there legitimately are no extras', () => {
	expect(parseAToZExtras({data: []})).toStrictEqual([])
})

test('throws when every value across every group is malformed', () => {
	// Every group parses, so the group-level guard does not fire -- but every
	// value inside every group fails URL validation, so this must still throw
	// rather than render N groups of `data: []`.
	expect(() =>
		parseStolafAToZ({
			az_nav: {
				menu_items: [
					{letter: 'A', values: [{label: '', url: 'not a url'}]},
					{letter: 'M', values: [{label: 'Music', url: 'also not a url'}]},
				],
			},
		}),
	).toThrow()
})
