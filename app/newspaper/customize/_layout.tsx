import * as React from 'react'
import {Stack} from 'expo-router'

/** A paper's Customize sheet's own navigation stack, as Home's Customize has. */
export default function NewspaperCustomizeLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
