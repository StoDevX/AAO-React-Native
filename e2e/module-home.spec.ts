import {beforeAll, beforeEach, test} from '@jest/globals'
import {by, device, element, expect} from 'detox'

// launch the app once - do this per-test-file to grant only the permissions
// needed for a given test
beforeAll(async () => {
	await device.launchApp()
})

// in this file, only reload the rn stuff between tests
beforeEach(async () => {
	await device.reloadReactNative()
})

test('should show the home screen', async () => {
	await expect(element(by.id('screen-homescreen'))).toBeVisible()
})
