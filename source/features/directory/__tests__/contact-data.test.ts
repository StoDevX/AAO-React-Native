import {describe, expect, test} from '@jest/globals'
import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {GRADIENT_NAMES, resolveGradient} from '@frogpond/colors'
import {load} from 'js-yaml'

const DATA_DIR = join(__dirname, '../../../../data/contact-info')

type ContactFile = {title?: unknown; icon?: unknown; gradient?: unknown}

const contacts: [string, ContactFile][] = readdirSync(DATA_DIR)
	.filter((file) => file.endsWith('.yaml'))
	.map((file) => [file, load(readFileSync(join(DATA_DIR, file), 'utf-8')) as ContactFile])

describe('contact-info data', () => {
	test('there are contacts to check', () => {
		expect(contacts.length).toBeGreaterThan(0)
	})

	// title is the join key for the React `key`, the router param,
	// contactByTitleOptions's `.find`, and a UI-test identifier, so a
	// duplicate breaks several of those at once rather than just looking odd.
	test('every contact has a distinct title', () => {
		let titles = contacts.map(([, contact]) => contact.title)
		expect(new Set(titles).size).toBe(titles.length)
	})

	// This only checks the field is a non-empty string, not that it names a
	// real SF Symbol: sf-symbols-typescript ships no runtime value to check
	// it against, and a wrong name draws nothing rather than failing loudly.
	test.each(contacts)('%s names a non-empty icon field', (_file, contact) => {
		expect(typeof contact.icon).toBe('string')
		expect(contact.icon).not.toBe('')
	})

	// validate-data checks the name against the schema's enum, and this checks
	// it against the gradients that actually exist. The two lists are
	// maintained by hand in separate files, so a name can pass the first and
	// still paint the fallback.
	test.each(contacts)('%s names a gradient the app can resolve', (_file, contact) => {
		let {gradient} = contact
		if (Array.isArray(gradient)) {
			expect(resolveGradient(gradient)).toEqual(gradient)
		} else {
			expect(GRADIENT_NAMES).toContain(gradient)
		}
	})
})
