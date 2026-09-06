import {describe, expect, test} from '@jest/globals'
import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {GRADIENT_NAMES, resolveGradient} from '@frogpond/colors'
import {load} from 'js-yaml'

const DATA_DIR = join(__dirname, '../../../../data/contact-info')

type ContactFile = {icon?: unknown; gradient?: unknown}

const contacts: [string, ContactFile][] = readdirSync(DATA_DIR)
	.filter((file) => file.endsWith('.yaml'))
	.map((file) => [file, load(readFileSync(join(DATA_DIR, file), 'utf-8')) as ContactFile])

describe('contact-info data', () => {
	test('there are contacts to check', () => {
		expect(contacts.length).toBeGreaterThan(0)
	})

	test.each(contacts)('%s names an SF Symbol', (_file, contact) => {
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
