import * as React from 'react'
import {Stack} from 'expo-router'
import {requiresSection} from '../../../source/features/campus/section-gate'

/**
 * The line sheet's own navigation stack.
 *
 * A formSheet route needs a stack of its own for its screens to get a back
 * button — a flat sibling route pushed while the sheet is up renders inside it
 * with no way back out.
 */
function TransitLineLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}

export default requiresSection(
	'transit',
	{title: 'Transit', noun: 'transit', systemImage: 'bus'},
	TransitLineLayout,
)
