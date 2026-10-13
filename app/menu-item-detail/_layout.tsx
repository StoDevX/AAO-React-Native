import * as React from 'react'
import {Stack} from 'expo-router'
import {requiresSection} from '../../source/features/campus/section-gate'

/**
 * The nutrition sheet's own navigation stack.
 *
 * `DETAIL_SHEET` hides the outer stack's header, so the sheet needs a stack of
 * its own to draw the dish's name as its title.
 */
function MenuItemDetailLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}

export default requiresSection(
	'menus',
	{title: 'Menus', noun: 'dining menus', systemImage: 'fork.knife'},
	MenuItemDetailLayout,
)
