/* eslint-env jest */
/* global device */

import { init, cleanup } from 'detox'
import { getEnv } from 'jest-jasmine2'
import { detox as config } from '../package.json'
import adapter, { beforeEach as _beforeEach, afterAll as _afterAll } from 'detox/runners/jest/adapter'

jest.setTimeout(120000)

beforeAll(async () => {
	await init(config, {launchApp: false})
	getEnv().addReporter(adapter)
})

beforeEach(async () => {
	await _beforeEach()
	await device.relaunchApp({delete: true})
})

afterAll(async () => {
	await _afterAll()
	await cleanup()
})
