// @flow
import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {type FilterType} from './types'
import {type ReduxState} from '../../../flux'
import {FilterSection} from './section'
import {TableView} from 'react-native-tableview-simple'
import {connect} from 'react-redux'
import get from 'lodash/get'

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})

type NavigationState = {
	params: {
		title: string,
		pathToFilters: string[],
		onChange: (x: FilterType[]) => any,
	},
}

type ReactProps = {
	navigation: {
		state: NavigationState,
	},
}

type ReduxStateProps = {
	filters: FilterType[],
}

type PropsType = ReactProps & ReduxStateProps

export function FilterViewComponent({filters, navigation}: PropsType) {
	const {onChange} = navigation.state.params

	const onFilterChanged = (filter: FilterType) => {
		// replace the changed filter in the array, maintaining position
		let result = filters.map(f => (f.key !== filter.key ? f : filter))
		onChange(result)
	}

	const contents = filters.map(filter => (
		<FilterSection
			key={filter.key}
			filter={filter}
			onChange={onFilterChanged}
		/>
	))

	return (
		<ScrollView style={styles.container}>
			<TableView>{contents}</TableView>
		</ScrollView>
	)
}
FilterViewComponent.navigationOptions = ({navigation}) => {
	return {
		title: navigation.state.params.title,
	}
}

const mapStateToProps = (
	state: ReduxState,
	actualProps: ReactProps,
): ReduxStateProps => {
	return {
		filters: get(state, actualProps.navigation.state.params.pathToFilters, []),
	}
}

export const FilterView = connect(mapStateToProps)(FilterViewComponent)
