import * as React from 'react'
import {TableView, Section} from '@frogpond/tableview'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const ComponentLibrary = (): JSX.Element => {

	return (
		<TableView>
			<Section>
			</Section>
		</TableView>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Component Library',
}
