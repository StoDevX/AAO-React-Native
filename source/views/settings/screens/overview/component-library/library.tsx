import * as React from 'react'
import {Platform} from 'react-native'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {Section, TableView} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'

import {NavigationKey as ColorsLibrNavigationKey} from './colors'

export const ComponentLibrary = (): JSX.Element => {
	const navigation = useNavigation()

	return (
		<TableView>
			<Section>
				<PushButtonCell
					onPress={() => navigation.navigate('BadgeLibrary')}
					title="Badges"
				/>
				<PushButtonCell
					onPress={() => navigation.navigate('ButtonLibrary')}
					title="Buttons"
				/>
				<PushButtonCell
					onPress={() => navigation.navigate(ColorsLibrNavigationKey)}
					title="Colors"
				/>
				<PushButtonCell
					onPress={() => navigation.navigate('ContextMenuLibrary')}
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
