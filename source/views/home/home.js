// @flow

import * as React from 'react'
import {ScrollView, View, StyleSheet, StatusBar} from 'react-native'
import {SafeAreaView} from 'react-navigation'

import {getTheme} from '@frogpond/app-theme'
import {type TopLevelViewPropsType} from '../types'
import {type ViewType} from '../views'
import {allViews} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl, openUrlInBrowser} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'

type Props = TopLevelViewPropsType & {
	views: Array<ViewType>,
}

export default function HomePage({navigation, views = allViews}: Props) {
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
							{contents.map(view => (
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
									testID={'homescreen-button-' + view.view}
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
HomePage.navigationOptions = ({navigation}) => {
	return {
		title: 'All About Olaf',
		headerBackTitle: 'Home',
		headerLeft: <OpenSettingsButton navigation={navigation} />,
	}
}

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
