import {describe, expect, jest, test} from '@jest/globals'

import {filePath} from '../catalog-file'

jest.mock('expo-file-system', () => ({File: jest.fn(), Paths: {}}))

describe('filePath', () => {
	// SQLite's attach takes a path; expo-file-system hands out percent-encoded URIs.
	test('turns a file URI into the path SQLite opens', () => {
		let file = {uri: 'file:///var/mobile/Containers/Data/My%20App/Documents/course-catalog.db'}
		expect(filePath(file as never)).toBe(
			'/var/mobile/Containers/Data/My App/Documents/course-catalog.db',
		)
	})
})
