/* eslint-env jest */

const { device, init } = require('detox')

beforeAll(async () => {
	await init()
	await device.launchApp()
})
