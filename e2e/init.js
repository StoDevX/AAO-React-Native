/* eslint-env jest */
/* global device */

const detox = require('detox')
const jasmine = require('jest-jasmine2')
const config = require('../package.json').detox
const adapter = require('detox/runners/jest/adapter')

jest.setTimeout(120000)

beforeAll(async () => {
	await detox.init(config, {launchApp: false})
	jasmine.getEnv().addReporter(adapter)
})

beforeEach(async () => {
	await adapter.beforeEach()
	await device.relaunchApp({delete: true})
})

afterAll(async () => {
	await adapter.afterAll()
	await detox.cleanup()
})
