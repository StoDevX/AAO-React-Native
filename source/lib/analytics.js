// @flow

import {trackEventWithCustomDimensionValues} from '@frogpond/analytics'

// Google requires that custom dimensions be tracked by index, and we only get
// 20 custom dimensions, so I decided to centralize them here.

// "1" was trackMenuFilters, which is no more.

// "2" is trackHomescreenOrder
export function trackHomescreenOrder(order: string[], isDefaultOrder: boolean) {
	trackEventWithCustomDimensionValues(
		'homescreen',
		'reorder',
		{label: isDefaultOrder ? 'default-order' : 'custom-order', value: 1},
		{'2': order.join(', ')},
	)
}

// "3" is trackHomescreenDisabledItem and trackHomescreenReenabledItem (with different values)
export function trackHomescreenDisabledItem(viewName: string) {
	trackEventWithCustomDimensionValues(
		'homescreen',
		'disabled',
		{label: viewName, value: 1},
		{'3': viewName},
	)
}

export function trackHomescreenReenabledItem(viewName: string) {
	trackEventWithCustomDimensionValues(
		'homescreen',
		're-enabled',
		{label: viewName, value: -1},
		{'3': viewName},
	)
}
