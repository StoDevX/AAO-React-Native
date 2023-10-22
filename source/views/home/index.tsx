import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {Column} from '@frogpond/layout'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {openUrl} from '@frogpond/open-url'

import {partitionByIndex} from '../../lib/partition-by-index'
import {AllViews} from '../views'
import {CELL_MARGIN, HomeScreenButton} from './button'
import {UnofficialAppNotice} from './notice'

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
