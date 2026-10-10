import * as React from 'react'
import {type Href, Redirect} from 'expo-router'

import {cafeTabsOf} from '../../../source/features/menus/menu-tabs'

/**
 * Gives the folder a typed route. It's no tab of the bar, so the tabs open on
 * Carleton's first café instead and this never draws; should it draw, it goes
 * there itself.
 */
export default function CarletonMenusIndex(): React.ReactNode {
	return (
		<Redirect href={`/edu.stolaf/menus-carleton/${cafeTabsOf('edu.carleton')[0].name}` as Href} />
	)
}
