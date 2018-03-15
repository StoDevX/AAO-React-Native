// @flow

import * as React from 'react'
import {ScrollView, StyleSheet, StatusBar} from 'react-native'

import zip from 'lodash/zip'
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
// import Packery from './packery'

type ReactProps = TopLevelViewPropsType & {
	views: Array<ViewType>,
}
type ReduxStateProps = {
	order: Array<string>,
	inactiveViews: Array<string>,
}

type Props = ReactProps & ReduxStateProps

function packMetroGrid(views, {columns, containerWidth, gutter}) {
	const cell = (containerWidth - gutter / (columns - 1)) / columns

	const colSpan = {
		1: cell * 1 + gutter * 0,
		2: cell * 2 + gutter * 1,
		3: cell * 3 + gutter * 2,
		4: cell * 4 + gutter * 3,
	}

	const rowSpan = {
		1: colSpan[1],
		2: colSpan[2],
		3: colSpan[3],
		4: colSpan[4],
	}

	const top = {
		1: cell * 0 + gutter * 0,
		2: cell * 1 + gutter * 1,
		3: cell * 2 + gutter * 2,
		4: cell * 3 + gutter * 3,
		5: cell * 4 + gutter * 4,
		6: cell * 5 + gutter * 5,
		7: cell * 6 + gutter * 6,
		8: cell * 7 + gutter * 7,
	}

	const left = {
		1: cell * 0 + gutter * 0,
		2: cell * 1 + gutter * 1,
		3: cell * 2 + gutter * 2,
		4: cell * 3 + gutter * 3,
	}

	return views
		.map(v => {
			switch (v.id) {
				case 'MenusView':
					return {top: 1, left: 1, width: 1, height: 1}
				case 'DirectoryView':
					return {top: 1, left: 2, width: 1, height: 1}
				case '/me/balances/':
					return {top: 1, left: 3, width: 2, height: 2}
				case 'RadioView':
					return {top: 2, left: 1, width: 1, height: 1}
				case 'MoodleView':
					return {top: 2, left: 2, width: 1, height: 1}

				case '/dictionary/term-of-the-day/':
					return {top: 3, left: 1, width: 3, height: 2}
				case 'StudentOrgsView':
					return {top: 3, left: 4, width: 1, height: 1}
				case 'MapView':
					return {top: 4, left: 4, width: 1, height: 1}

				case 'SISView':
					return {top: 5, left: 1, width: 2, height: 1}
				case 'CalendarView':
					return {top: 5, left: 3, width: 2, height: 1}

				case 'BuildingHoursView':
					return {top: 6, left: 1, width: 1, height: 1}
				case 'StreamingView':
					return {top: 6, left: 2, width: 1, height: 1}
				case 'WeeklyMovieView':
					return {top: 6, left: 3, width: 1, height: 1}
				case 'ContactsView':
					return {top: 6, left: 4, width: 1, height: 1}

				case 'NewsView':
					return {top: 7, left: 3, width: 1, height: 1}
				case 'TransportationView':
					return {top: 7, left: 4, width: 1, height: 1}
				case '/transit/upcoming/?route=northfield-express':
					return {top: 7, left: 1, width: 2, height: 2}
				case 'HelpView':
					return {top: 8, left: 3, width: 1, height: 1}
				case 'DictionaryView':
					return {top: 8, left: 4, width: 1, height: 1}

				default:
					return {top: 1, left: 1, width: 1, height: 1}
			}
		})
		.map(v => ({
			top: top[v.top],
			left: left[v.left],
			width: colSpan[v.width],
			height: rowSpan[v.height],
		}))
}

function HomePage({navigation, order, inactiveViews, views = allViews}: Props) {
	const items = packMetroGrid(
		views.map(v => ({width: v.size.width, height: v.size.height, id: v.view})),
		{columns: 4, containerWidth: 327.5, gutter: CELL_MARGIN},
	)

	const layoutables = zip(views, items)

	return (
		<React.Fragment>
			<ScrollView contentContainerStyle={styles.cells} style={{flex: 1}}>
				{layoutables.map(([view, layout]) => {
					if (view.type === 'view' || view.type === 'url') {
						return (
							<HomeScreenButton key={view.view} view={view} layout={layout} />
						)
					} else if (view.type === 'widget') {
						return (
							<HomeScreenWidget key={view.view} view={view} layout={layout} />
						)
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
		position: 'relative',
		padding: CELL_MARGIN,
	},
})
