/* eslint-env jest */
/* global element, by */

describe('Building Hours editor', () => {
	it('is reachable from home screen', async () => {
		await element(by.id('BuildingHoursView-button')).tap()
		// TODO set this up to randomly pick a button
		await element(by.id('Stav Hall-button')).tap()
		await element(by.text('Suggest an Edit')).tap()
		await expect(element(by.text('Thanks for spotting a problem!'))).toBeVisible()
	})
})
