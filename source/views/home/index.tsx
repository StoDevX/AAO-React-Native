import * as React from 'react'
import {
	ScrollView,
	View,
	StyleSheet,
	StatusBar,
	SafeAreaView,
} from 'react-native'

import {getTheme} from '@frogpond/app-theme'
import {allViews} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

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

function HomePage(): JSX.Element {
	let navigation = useNavigation()
	let columns = partitionByIndex(allViews)

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
										} else if (view.type === 'view') {
											return navigation.navigate(view.view)
										} else {
											throw new Error(`unexpected view type ${view.type}`)
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
	headerRight: (props) => <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
