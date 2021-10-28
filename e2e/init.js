/* eslint-env jest */
/* global device */

import {init, cleanup} from 'detox'
import {getEnv} from 'jest-jasmine2'
import {detox as config} from '../package.json'
import adapter, {
	beforeEach as beforeEachDetox,
	afterAll as afterAllDetox,
} from 'detox/runners/jest/adapter'

jest.setTimeout(120000)

beforeAll(async () => {
	await init(config, {launchApp: false})
	getEnv().addReporter(adapter)
})

beforeEach(async () => {
	await beforeEachDetox()
	await device.relaunchApp({delete: true})
})

afterAll(async () => {
	await afterAllDetox()
	await cleanup()
})
