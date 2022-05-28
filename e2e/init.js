/* eslint-env jest */

import {device} from 'detox'

beforeAll(async () => {
	await device.launchApp()
})
