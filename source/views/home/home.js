// @flow

import * as React from 'react'
import {ScrollView, StyleSheet, StatusBar} from 'react-native'

import {connect} from 'react-redux'
import * as c from '../components/colors'
import sortBy from 'lodash/sortBy'
import {type TopLevelViewPropsType} from '../types'
import {type ViewType} from '../views'
import {type ReduxState} from '../../flux'
import {allViews} from '../views'
import {Column} from '../components/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {HomeScreenWidget} from './widget'
import {trackedOpenUrl} from '../components/open-url'
import {EditHomeButton, OpenSettingsButton} from '../components/nav-buttons'

type ReactProps = TopLevelViewPropsType & {
	views: Array<ViewType>,
}
type ReduxStateProps = {
	order: Array<string>,
	inactiveViews: Array<string>,
}

type Props = ReactProps & ReduxStateProps

function HomePage({navigation, order, inactiveViews, views = allViews}: Props) {
	return (
		<React.Fragment>
			<StatusBar backgroundColor={c.gold} barStyle="light-content" />
			<ScrollView contentContainerStyle={styles.cells} overflow="hidden">
				{views.map(view => {
					if (view.type === 'view' || view.type === 'url') {
						return <HomeScreenButton key={view.view} view={view} />
					} else if (view.type === 'widget') {
						return <HomeScreenWidget key={view.view} view={view} />
					}
				})}
			</ScrollView>
		</React.Fragment>
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
		flexDirection: 'row',
		flexWrap: 'wrap',
		padding: CELL_MARGIN / 2,
		justifyContent: 'space-between',
	},
})
