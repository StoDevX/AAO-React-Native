import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import * as faqs from '../views/faqs'
import * as settings from '../views/settings/'
import {
	BonAppPickerView as DevBonAppPickerView,
	DevBonAppNavigationOptions,
} from '../views/menus/dev-bonapp-picker'

import {MainTabNavigator} from './main-tabs'
import {
	RootStackParamList,
	SettingsStackParamList,
	ComponentLibraryStackParamList,
} from './types'
import {NavigationKey as Debug} from '../views/settings/screens/debug'
import {toLaxTitleCase} from '@frogpond/titlecase'

const Stack = createNativeStackNavigator<RootStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const ComponentLibraryStack =
	createNativeStackNavigator<ComponentLibraryStackParamList>()

const SettingsStackScreens = () => {
	return (
		<SettingsStack.Navigator
			screenOptions={{gestureEnabled: true, headerBackTitle: ''}}
		>
			{/* user */}
			<SettingsStack.Group>
				<SettingsStack.Screen
					component={settings.SettingsView}
					name="SettingsRoot"
					options={settings.SettingsNavigationOptions}
				/>
				<SettingsStack.Screen
					component={faqs.View}
					name="Faq"
					options={faqs.NavigationOptions}
				/>
				<SettingsStack.Screen component={settings.CreditsView} name="Credits" />
				<SettingsStack.Screen component={settings.PrivacyView} name="Privacy" />
				<SettingsStack.Screen component={settings.LegalView} name="Legal" />
			</SettingsStack.Group>

			{/* developer */}
			<SettingsStack.Group>
				<SettingsStack.Screen
					component={settings.APITestView}
					name="APITest"
					options={settings.APITestNavigationOptions}
				/>
				<SettingsStack.Screen
					component={settings.APITestDetailView}
					name="APITestDetail"
					options={settings.APITestDetailNavigationOptions}
				/>
				<SettingsStack.Screen
					component={DevBonAppPickerView}
					name="BonAppPicker"
					options={DevBonAppNavigationOptions}
				/>
				<SettingsStack.Screen
					component={settings.DebugRootView}
					name={Debug}
					options={({
						route: {
							params: {keyPath},
						},
					}) => ({title: toLaxTitleCase(keyPath?.[keyPath?.length - 1])})}
				/>
				<SettingsStack.Screen
					component={settings.NetworkLoggerView}
					name="NetworkLogger"
					options={settings.NetworkLoggerNavigationOptions}
				/>
				<SettingsStack.Screen
					component={settings.BannerBuilderView}
					name="BannerBuilder"
					options={settings.BannerBuilderNavigationOptions}
				/>
			</SettingsStack.Group>
		</SettingsStack.Navigator>
	)
}

const ComponentLibraryStackScreens = () => {
	return (
		<ComponentLibraryStack.Navigator
			screenOptions={{gestureEnabled: true, headerBackTitle: ''}}
		>
			<ComponentLibraryStack.Screen
				component={settings.ComponentLibrary}
				name="ComponentLibraryRoot"
				options={settings.ComponentLibraryNavigationOptions}
			/>
			<ComponentLibraryStack.Screen
				component={settings.BadgeLibrary}
				name="BadgeLibrary"
				options={{title: 'Badges'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.ButtonLibrary}
				name="ButtonLibrary"
				options={{title: 'Buttons'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.ColorsLibrary}
				name={settings.ColorsLibraryNavigationKey}
				options={{title: 'Colors'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.ContextMenuLibrary}
				name="ContextMenuLibrary"
				options={{title: 'Context Menus'}}
			/>
			<ComponentLibraryStack.Screen
				component={settings.FaqBannerLibrary}
				name="FaqBannerLibrary"
				options={settings.FaqBannerNavigationOptions}
			/>
		</ComponentLibraryStack.Navigator>
	)
}

export const RootStack = (): React.ReactNode => (
	<Stack.Navigator
		initialRouteName="HomeRoot"
		screenOptions={{headerShown: false}}
	>
		<Stack.Screen component={MainTabNavigator} name="HomeRoot" />
		<SettingsStack.Screen
			component={SettingsStackScreens}
			name="Settings"
			options={{presentation: 'modal'}}
		/>
		<ComponentLibraryStack.Screen
			component={ComponentLibraryStackScreens}
			name="ComponentLibrary"
			options={{presentation: 'modal'}}
		/>
	</Stack.Navigator>
)
