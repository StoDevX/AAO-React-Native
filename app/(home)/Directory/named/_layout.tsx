import * as React from 'react'
import {Stack} from 'expo-router'

/**
 * The contact sheet's own navigation stack.
 *
 * A formSheet route draws no header of its own from the stack presenting it,
 * so the contact's name needs a stack inside the sheet to sit in.
 */
export default function DirectoryNamedLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
