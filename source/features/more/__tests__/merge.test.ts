import {mergeAToZ} from '../parsers/merge'
import {parseAToZExtras, parseStolafAToZ} from '../parsers/a-z-extras'

const upstream = parseStolafAToZ({
	az_nav: {
		menu_items: [
			{letter: 'A', values: [{label: 'Alpha', url: 'https://stolaf.edu/alpha'}]},
			{letter: 'M', values: [{label: 'Music', url: '/music'}]},
		],
	},
})

test('resolves root-relative urls against stolaf.edu', () => {
	expect(upstream[1].data[0].url).toBe('https://stolaf.edu/music')
})

test('drops entries whose url is unusable', () => {
	const parsed = parseStolafAToZ({
		az_nav: {
			menu_items: [
				{
					letter: 'A',
					values: [
						{label: 'Good', url: 'https://stolaf.edu/good'},
						{label: 'Bad', url: 'not a url'},
						{label: '', url: '  '},
					],
				},
			],
		},
	})
	expect(parsed[0].data.map((v) => v.label)).toStrictEqual(['Good'])
})

test('merges extras into an existing letter and re-sorts it', () => {
	const extras = parseAToZExtras({
		data: [{letter: 'A', values: [{label: 'Aardvark', url: 'https://stolaf.edu/aardvark'}]}],
	})
	const merged = mergeAToZ(upstream, extras)
	expect(merged[0].data.map((v) => v.label)).toStrictEqual(['Aardvark', 'Alpha'])
})

test('creates the letter group when the upstream does not publish it', () => {
	const extras = parseAToZExtras({
		data: [{letter: 'Z', values: [{label: 'Zoom', url: 'https://stolaf.edu/zoom'}]}],
	})
	const merged = mergeAToZ(upstream, extras)
	const z = merged.find((group) => group.title === 'Z')
	expect(z?.data.map((v) => v.label)).toStrictEqual(['Zoom'])
})

test('inserts a created letter group in sorted position', () => {
	const extras = parseAToZExtras({
		data: [{letter: 'B', values: [{label: 'Beta', url: 'https://stolaf.edu/beta'}]}],
	})
	const merged = mergeAToZ(upstream, extras)
	expect(merged.map((group) => group.title)).toStrictEqual(['A', 'B', 'M'])
})

test('renders the upstream alone when there are no extras', () => {
	expect(mergeAToZ(upstream, []).map((group) => group.title)).toStrictEqual(['A', 'M'])
})
