// @flow

import * as React from 'react'
import {ScrollView, Platform, StatusBar} from 'react-native'
import {SafeAreaView} from 'react-navigation'
import {List} from 'react-native-paper'
import Ionicon from 'react-native-vector-icons/Ionicons'
import {getTheme} from '@frogpond/app-theme'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import {groupedViews, type ViewType} from '../views'
import {type TopLevelViewPropsType} from '../types'
import {trackedOpenUrl, openUrlInBrowser} from '@frogpond/open-url'
import {EditHomeButton, OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'

export default function HomePage({navigation}: TopLevelViewPropsType) {
	let {androidStatusBarColor, statusBarStyle} = getTheme()

	return (
		<ScrollView testID="screen-homescreen">
			<StatusBar
				backgroundColor={androidStatusBarColor}
				barStyle={statusBarStyle}
			/>

			<SafeAreaView>
				<ContentView
					onPress={view => {
						if (view.type === 'url') {
							return trackedOpenUrl({url: view.url, id: view.view})
						} else if (view.type === 'external-url') {
							return openUrlInBrowser({url: view.url, id: view.view})
						} else {
							return navigation.navigate(view.view)
						}
					}}
				/>

				<UnofficialAppNotice />
			</SafeAreaView>
		</ScrollView>
	)
}
HomePage.navigationOptions = ({navigation}) => {
	return {
		title: 'All About Olaf',
		headerBackTitle: 'Home',
		headerLeft: <OpenSettingsButton navigation={navigation} />,
		//headerRight: <EditHomeButton navigation={navigation} />,
	}
}

function IosContent({onPress}: {onPress: ViewType => mixed}) {
	return (
		<TableView>
			{[...groupedViews.entries()].map(([group, items]) => (
				<Section
					key={group}
					header={group.toUpperCase()}
					onActionPress={() => console.warn('pressed')}
					rounded={true}
					withSafeAreaView={false}
					{...(group === 'Menus' ? {action: 'SHOW CARLETON'} : {})}
				>
					{items.map((view, i) => {
						let iconName =
							view.type === 'external-url'
								? 'ios-log-out'
								: view.type === 'url'
								? 'ios-link'
								: 'ios-more'

						let icon = <Ionicon color="#c7c7cc" name={iconName} size={18} />

						return (
							<Cell
								key={view.view + i}
								{...(view.type === 'view'
									? {accessory: 'DisclosureIndicator'}
									: {cellAccessoryView: icon})}
								onPress={() => onPress(view)}
								title={view.title}
							/>
						)
					})}
				</Section>
			))}
		</TableView>
	)
}

function AndroidContent({onPress}: {onPress: ViewType => mixed}) {
	return (
		<>
			{[...groupedViews.entries()].map(([group, items]) => (
				<List.Section key={group}>
					<List.Subheader>{group}</List.Subheader>

					{items.map((view, i) => (
						<List.Item
							key={view.view + i}
							onPress={() => onPress(view)}
							title={view.title}
						/>
					))}
				</List.Section>
			))}
		</>
	)
}

const ContentView = Platform.OS === 'ios' ? IosContent : AndroidContent
