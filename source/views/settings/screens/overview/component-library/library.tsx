import * as React from 'react'
import {TableView, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const ComponentLibrary = (): JSX.Element => {
	const navigation = useNavigation()

	return (
		<TableView>
			<Section>
				<PushButtonCell
					onPress={() => navigation.navigate('ButtonLibrary')}
					title="Buttons"
				/>
			</Section>
		</TableView>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Component Library',
}
