// @flow

import * as React from 'react'
import {ScrollView, View, StyleSheet, StatusBar} from 'react-native'
import {SafeAreaView} from 'react-navigation'

import {connect} from 'react-redux'
import {getTheme} from '@frogpond/app-theme'
import sortBy from 'lodash/sortBy'
import {type TopLevelViewPropsType} from '../types'
import {type ViewType} from '../views'
import {type ReduxState} from '../../redux'
import {allViews} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl, openUrlInBrowser} from '@frogpond/open-url'
import {EditHomeButton, OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'

type ReactProps = TopLevelViewPropsType & {
	views: Array<ViewType>,
}
type ReduxStateProps = {
	order: Array<string>,
	inactiveViews: Array<string>,
}

type Props = ReactProps & ReduxStateProps

function HomePage({navigation, order, inactiveViews, views = allViews}: Props) {
	const sortedViews = sortBy(views, view => order.indexOf(view.view))

	const enabledViews = sortedViews.filter(
		view => !inactiveViews.includes(view.view),
	)

	const columns = partitionByIndex(enabledViews)

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
		headerRight: <EditHomeButton navigation={navigation} />,
	}
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	if (!state.homescreen) {
		return {order: [], inactiveViews: []}
	}

	return {
		order: state.homescreen.order,
		inactiveViews: state.homescreen.inactiveViews,
	}
}

export default connect(mapStateToProps)(HomePage)

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
