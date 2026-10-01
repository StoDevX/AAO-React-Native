import * as React from 'react'
import {Stack} from 'expo-router'

/**
 * The nutrition sheet's own navigation stack.
 *
 * `DETAIL_SHEET` hides the outer stack's header, so the sheet needs a stack of
 * its own to draw the dish's name as its title.
 */
export default function MenuItemDetailLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
