import * as React from 'react'
import {ScrollView, View, StyleSheet} from 'react-native'

import {AllViews} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {openUrl} from '@frogpond/open-url'
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

function HomePage(): React.JSX.Element {
	let navigation = useNavigation()
	let allViews = AllViews().filter((view) => !view.disabled ?? true)
	let columns = partitionByIndex(allViews)

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<View style={styles.cells}>
				{columns.map((contents, i) => (
					<Column key={i} style={styles.column}>
						{contents.map((view) => (
							<HomeScreenButton
								key={view.type === 'view' ? view.view : view.title}
								onPress={() => {
									if (view.type === 'url') {
										return openUrl(view.url)
									} else if (view.type === 'view') {
										navigation.navigate(view.view); return;
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
