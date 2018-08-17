/* eslint-env jest */
/* global jasmine, device */

const detox = require('detox')
const config = require('../package.json').detox
const adapter = require('detox/runners/jest/adapter')

jest.setTimeout(120000)
jasmine.getEnv().addReporter(adapter)

beforeAll(async () => {
	await detox.init(config, {launchApp: false})
	await device.launchApp({ permissions: { notifications: 'YES' } })
})

beforeEach(async () => {
	await adapter.beforeEach()
})

afterAll(async () => {
	await adapter.afterAll()
	await detox.cleanup()
})
