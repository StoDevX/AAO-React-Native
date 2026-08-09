import * as React from 'react'
import {Platform} from 'react-native'

import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {TableView, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import type {NavigationProp} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from 'expo-router'
import type {LegacyRootParamList} from '../../../../../navigation/types'

export const ComponentLibrary = (): React.ReactNode => {
	const navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

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
					onPress={() => navigation.navigate('ColorsLibrary')}
					title="Colors"
				/>
				<PushButtonCell
					onPress={() => navigation.navigate('ContextMenuLibrary')}
					title="Context Menus"
				/>
				<PushButtonCell
					onPress={() => navigation.navigate('FaqBannerLibrary')}
					title="FAQ Banners"
				/>
			</Section>
		</TableView>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Component Library',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
}
