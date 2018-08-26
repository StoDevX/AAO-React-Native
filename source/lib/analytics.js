// @flow

import {trackEventWithCustomDimensionValues} from '@frogpond/analytics'
import {stringifyFilters} from '@frogpond/filter/stringify-filters'

// Google requires that custom dimensions be tracked by index, and we only get
// 20 custom dimensions, so I decided to centralize them here.
export function trackMenuFilters(menuName: string, filters: any) {
	trackEventWithCustomDimensionValues(
		'menus',
		'filter',
		{label: menuName, value: 1},
		{'1': stringifyFilters(filters)},
	)
}

export function trackHomescreenOrder(order: string[], isDefaultOrder: boolean) {
	trackEventWithCustomDimensionValues(
		'homescreen',
		'reorder',
		{label: isDefaultOrder ? 'default-order' : 'custom-order', value: 1},
		{'2': order.join(', ')},
	)
}

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
