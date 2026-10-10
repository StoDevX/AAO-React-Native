import * as React from 'react'

import {CafeTabs} from '../../../source/features/menus/cafe-tabs'

/** Carleton's cafés, on St. Olaf. */
export default function CarletonMenusLayout(): React.ReactNode {
	return <CafeTabs campus="edu.carleton" />
}
