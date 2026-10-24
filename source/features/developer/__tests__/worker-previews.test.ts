import {describe, expect, test} from '@jest/globals'

import {parsePreviews, previewServerUrl} from '../worker-previews'

describe('previewServerUrl', () => {
	test("points at the campus's Node-compatible routes on the Preview", () => {
		expect(
			previewServerUrl(
				'https://renovate-vitest-ccc-server.frog-pond-d8f.workers.dev',
				'edu.stolaf',
			),
		).toBe('https://renovate-vitest-ccc-server.frog-pond-d8f.workers.dev/edu.stolaf/v1/')
	})

	test('does not double a trailing slash', () => {
		expect(previewServerUrl('https://a-ccc-server.example.dev/', 'edu.carleton')).toBe(
			'https://a-ccc-server.example.dev/edu.carleton/v1/',
		)
	})
})

describe('parsePreviews', () => {
	let preview = {
		number: 1256,
		title: 'Update dependency vitest to v5.0.5',
		branch: 'renovate/vitest-monorepo',
		prUrl: 'https://github.com/frog-pond/ccc-server/pull/1256',
		previewUrl: 'https://renovate-vitest-monorepo-ccc-server.frog-pond-d8f.workers.dev',
	}

	test('keeps previews, including those without a URL', () => {
		let fork = {...preview, number: 1, previewUrl: null}
		expect(parsePreviews([preview, fork])).toEqual([preview, fork])
	})

	test('drops entries missing a field', () => {
		let {branch: _branch, ...noBranch} = preview
		expect(parsePreviews([noBranch, preview])).toEqual([preview])
	})

	test('rejects a body that is not a list, such as the error object', () => {
		expect(() => parsePreviews({message: 'GitHub answered 403'})).toThrow()
	})
})
