import * as React from 'react'

import {CafeTabs} from '../../../source/features/menus/cafe-tabs'

/** St. Olaf's cafés, on Carleton. */
export default function StOlafMenusLayout(): React.ReactNode {
	return <CafeTabs campus="edu.stolaf" />
}
