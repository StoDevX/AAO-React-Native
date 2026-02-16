import * as React from 'react'
import {Platform} from 'react-native'

import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {TableView, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {useNavigation} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const ComponentLibrary = (): React.JSX.Element => {
	const navigation = useNavigation()

	return (
		<TableView>
			<Section>
				<PushButtonCell
					onPress={() =>
						navigation.navigate('settings/screens/overview/component-library/badge')
					}
					title="Badges"
				/>
				<PushButtonCell
					onPress={() =>
						navigation.navigate('settings/screens/overview/component-library/button')
					}
					title="Buttons"
				/>
				<PushButtonCell
					onPress={() =>
						navigation.navigate('settings/screens/overview/component-library/colors')
					}
					title="Colors"
				/>
				<PushButtonCell
					onPress={() =>
						navigation.navigate(
							'settings/screens/overview/component-library/context-menu',
						)
					}
					title="Context Menus"
				/>
			</Section>
		</TableView>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Component Library',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
}

export default ComponentLibrary
