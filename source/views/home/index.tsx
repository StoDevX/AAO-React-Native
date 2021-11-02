import * as React from 'react'
import {
	ScrollView,
	View,
	StyleSheet,
	StatusBar,
	SafeAreaView,
} from 'react-native'

import {getTheme} from '@frogpond/app-theme'
import type {TopLevelViewPropsType} from '../types'
import type {ViewType} from '../views'
import {allViews} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl, openUrlInBrowser} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../navigation/types'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	cells: {
		marginHorizontal: CELL_MARGIN / 2,
		paddingTop: CELL_MARGIN,

		flexDirection: 'row',
	},
	column: {
		flex: 1,
	},
})

type Props = {
	views: Array<ViewType>
}

function HomePage({views = allViews}: Props): JSX.Element {
	let navigation = useNavigation();
	let columns = partitionByIndex(views)

	let {androidStatusBarColor, statusBarStyle} = getTheme()

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<StatusBar
				backgroundColor={androidStatusBarColor}
				barStyle={statusBarStyle}
			/>

			<SafeAreaView>
				<View style={styles.cells}>
					{columns.map((contents, i) => (
						<Column key={i} style={styles.column}>
							{contents.map((view) => (
								<HomeScreenButton
									key={view.view}
									onPress={() => {
										if (view.type === 'url') {
											return trackedOpenUrl({url: view.url, id: view.view})
										} else if (view.type === 'browser-url') {
											return openUrlInBrowser({url: view.url, id: view.view})
										} else {
											return navigation.navigate(view.view)
										}
									}}
									view={view}
								/>
							))}
						</Column>
					))}
				</View>
			</SafeAreaView>

			<UnofficialAppNotice />
		</ScrollView>
	)
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'All About Olaf',
	headerBackTitle: 'Home',
	headerLeft: (props) =>  <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
