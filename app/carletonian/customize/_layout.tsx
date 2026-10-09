import * as React from 'react'
import {Stack} from 'expo-router'

/** The Carletonian's Customize sheet's own navigation stack, as the Messenger's has. */
export default function CarletonianCustomizeLayout(): React.ReactNode {
	return <Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}} />
}
