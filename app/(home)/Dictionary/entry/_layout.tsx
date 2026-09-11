import * as React from 'react'
import {Stack} from 'expo-router'

/**
 * The entry sheet's own navigation stack.
 *
 * A formSheet route needs a stack of its own for its screens to get a back
 * button — a flat sibling route pushed while the sheet is up renders inside it
 * with no way back out.
 */
export default function DictionaryEntryLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
