import * as React from 'react'
import {
	ImageBackground,
	SafeAreaView,
	ScrollView,
	View,
	StyleSheet,
} from 'react-native'
import {allViews} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {openUrl} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {updateBackgroundImage} from './background'

const styles = StyleSheet.create({
	cells: {
		marginHorizontal: CELL_MARGIN / 2,
		paddingTop: CELL_MARGIN,

		flexDirection: 'row',
	},
	column: {
		flex: 1,
	},
	safearea: {
		flex: 1,
	},
	background: {
		flex: 1,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: -1,
		position: 'absolute',
	},
})

function HomePage(): JSX.Element {
	let navigation = useNavigation()
	let columns = partitionByIndex(allViews)

	return (
		<SafeAreaView style={styles.safearea}>
			<ScrollView
				alwaysBounceHorizontal={false}
				contentInsetAdjustmentBehavior="automatic"
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
			<ImageBackground
				resizeMode="cover"
				source={{uri: backgroundImage}}
				style={styles.background}
			/>
		</SafeAreaView>
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
