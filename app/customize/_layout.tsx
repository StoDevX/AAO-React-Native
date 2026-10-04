import * as React from 'react'
import {Stack} from 'expo-router'

/**
 * The Customize sheet's own navigation stack, so App Icon and Quick Actions
 * push inside the sheet with a way back.
 */
export default function CustomizeLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
