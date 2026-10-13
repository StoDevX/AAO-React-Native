import * as React from 'react'
import {type Href, Redirect} from 'expo-router'

import {useCampusId} from '../../source/features/campus/store'
import {cafeTabsOf} from '../../source/features/menus/menu-tabs'

/**
 * Gives `/menus` a typed route. It's no tab of the bar, so the tabs open on
 * the campus's first café instead and this never draws; should it draw, it
 * goes there itself.
 */
export default function MenusIndex(): React.ReactNode {
	let first = cafeTabsOf(useCampusId())[0]
	return <Redirect href={`/menus/${first.name}` as Href} />
}
