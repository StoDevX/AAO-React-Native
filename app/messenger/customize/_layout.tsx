import * as React from 'react'
import {Stack} from 'expo-router'

/** The Messenger's Customize sheet's own navigation stack, as Home's Customize has. */
export default function MessengerCustomizeLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
