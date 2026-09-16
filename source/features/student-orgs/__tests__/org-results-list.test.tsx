import React from 'react'
import {describe, expect, test, jest} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {OrgResultsList} from '../org-results-list'
import type {OrgSection} from '../search'
import type {StudentOrgType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

function makeOrg(overrides: Partial<StudentOrgType> = {}): StudentOrgType {
	return {
		meetings: '',
		contacts: [],
		advisors: [],
		description: '',
		category: 'Academic',
		lastUpdated: '',
		website: '',
		name: 'Test Org',
		organizationUri: 'test-org',
		memberCount: 0,
		...overrides,
	}
}

function renderList(sections: OrgSection[]) {
	return render(
		<OrgResultsList
			emptyText="No orgs"
			onPressOrg={jest.fn()}
			onRefresh={jest.fn(() => Promise.resolve())}
			sections={sections}
		/>,
	)
}

describe('OrgResultsList', () => {
	// A single section is still given a real title by search.ts's grouping (not
	// just the flat-list sentinel of ''), so this only proves the branch looks
	// at section count, not at whether the title happens to be empty.
	test('hides the section title and jump-list index when there is only one section', async () => {
		let section: OrgSection = {title: 'Z', data: [makeOrg({name: 'Ski Club'})]}

		let {queryByText, queryByLabelText} = await renderList([section])

		expect(queryByText('Z')).toBeNull()
		expect(queryByLabelText('section index Z')).toBeNull()
	})

	test('shows section titles and jump-list indexes when there are multiple sections', async () => {
		let sections: OrgSection[] = [
			{title: 'C', data: [makeOrg({name: 'Chess Club'})]},
			{title: 'S', data: [makeOrg({name: 'Ski Club'})]},
		]

		let {getByText, getByLabelText} = await renderList(sections)

		expect(getByText('C')).toBeTruthy()
		expect(getByText('S')).toBeTruthy()
		expect(getByLabelText('section index C')).toBeTruthy()
		expect(getByLabelText('section index S')).toBeTruthy()
	})
})
