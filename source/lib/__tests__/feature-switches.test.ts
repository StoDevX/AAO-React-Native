import {describe, expect, jest, test} from '@jest/globals'

import {parseFeatureSwitches} from '../feature-switches'

describe('parseFeatureSwitches', () => {
	test('keeps every feature section as published', () => {
		let body = JSON.stringify({data: {radio: {ksto: {enabled: true}}, chat: {}}})
		expect(parseFeatureSwitches(body)).toEqual({radio: {ksto: {enabled: true}}, chat: {}})
	})

	test('reads a body with no data object as no switches, so every feature is off', () => {
		expect(parseFeatureSwitches('{}')).toEqual({})
		expect(parseFeatureSwitches('{"data": []}')).toEqual({})
	})

	test('reads a body that is not JSON as no switches, so every feature is off', () => {
		expect(parseFeatureSwitches('{')).toEqual({})
	})
})

describe('followsFeatureSwitches', () => {
	/** A release build's modules, loaded fresh, as on a new launch. */
	function releaseBuild(): {
		constants: typeof import('@frogpond/constants')
		switches: typeof import('../feature-switches')
	} {
		let previous = process.env.NODE_ENV
		process.env.NODE_ENV = 'production'
		try {
			let loaded: ReturnType<typeof releaseBuild> | undefined
			jest.isolateModules(() => {
				loaded = {
					// oxlint-disable-next-line typescript/no-require-imports
					constants: require('@frogpond/constants') as typeof import('@frogpond/constants'),
					// oxlint-disable-next-line typescript/no-require-imports
					switches: require('../feature-switches') as typeof import('../feature-switches'),
				}
			})
			if (!loaded) throw new Error('the modules did not load')
			return loaded
		} finally {
			process.env.NODE_ENV = previous
		}
	}

	test('reads a version set after it loads, so a beta still ignores the switches', () => {
		let {constants, switches} = releaseBuild()

		constants.setVersionInfo('2.10.0-beta.1')
		expect(switches.followsFeatureSwitches()).toBe(false)

		constants.setVersionInfo('2.10.0')
		expect(switches.followsFeatureSwitches()).toBe(true)
	})
})
