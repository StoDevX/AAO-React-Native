import * as React from 'react'

import {requiresSection} from '../../source/features/campus/section-gate'
import {useCampusId} from '../../source/features/campus/store'
import {CafeTabs} from '../../source/features/menus/cafe-tabs'

/** The active campus's cafés. `/menus` opens on its first. */
function MenusLayout(): React.ReactNode {
	return <CafeTabs campus={useCampusId()} />
}

export default requiresSection(
	'menus',
	{title: 'Menus', noun: 'dining menus', systemImage: 'fork.knife'},
	MenusLayout,
)
