import {readdirSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {isCampusId} from '../../../campuses'

const APP = join(__dirname, '../../../../app')

/** Folders under app/ named like a campus id: reverse-DNS, with a dot. */
const FOLDERS = readdirSync(APP, {withFileTypes: true})
	.filter((entry) => entry.isDirectory() && /^[a-z]+(\.[a-z-]+)+$/u.test(entry.name))
	.map((entry) => entry.name)

describe('campus folders', () => {
	test('exist', () => {
		expect(FOLDERS).toContain('edu.carleton')
	})

	test.each(FOLDERS)('%s is a registered campus', (folder) => {
		expect(isCampusId(folder)).toBe(true)
	})
})
