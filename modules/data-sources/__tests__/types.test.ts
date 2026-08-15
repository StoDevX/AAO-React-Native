import {JrdSchema, ID_PROPERTY, REL_NEWS} from '../types'

const valid = {
	subject: 'https://stolaf.edu',
	links: [
		{
			rel: REL_NEWS,
			href: 'https://example.test/feed',
			type: 'application/vnd.wordpress.v2.posts+json',
			titles: {und: 'Example'},
			properties: {[ID_PROPERTY]: 'example'},
		},
	],
}

test('accepts a well-formed document', () => {
	expect(JrdSchema.parse(valid).links).toHaveLength(1)
})

test('accepts a link with no titles', () => {
	const {titles: _titles, ...rest} = valid.links[0]
	const parsed = JrdSchema.parse({...valid, links: [rest]})
	expect(parsed.links[0].titles).toBeUndefined()
})

test('rejects a link with no id property', () => {
	const link = {...valid.links[0], properties: {}}
	expect(() => JrdSchema.parse({...valid, links: [link]})).toThrow()
})

test('rejects a document with no links array', () => {
	expect(() => JrdSchema.parse({subject: 'https://stolaf.edu'})).toThrow()
})

test('rejects a non-url href', () => {
	const link = {...valid.links[0], href: 'not a url'}
	expect(() => JrdSchema.parse({...valid, links: [link]})).toThrow()
})
