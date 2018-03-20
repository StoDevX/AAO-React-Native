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
		onLeave?: (filters: FilterType[]) => any,
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

type Props = ReactProps & ReduxStateProps

class FilterViewComponent extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: Props) => {
		return {
			title: navigation.state.params.title,
		}
	}

	componentWillUnmount() {
		if (this.props.navigation.state.params.onLeave) {
			console.log('DEBUG')
			this.props.navigation.state.params.onLeave(this.props.filters)
		}
	}

	onFilterChanged = (filter: FilterType) => {
		const {onChange} = this.props.navigation.state.params
		// replace the changed filter in the array, maintaining position
		let result = this.props.filters.map(
			f => (f.key !== filter.key ? f : filter),
		)
		onChange(result)
	}

	render() {
		const contents = this.props.filters.map(filter => (
			<FilterSection
				key={filter.key}
				filter={filter}
				onChange={this.onFilterChanged}
			/>
		))

		return (
			<ScrollView style={styles.container}>
				<TableView>{contents}</TableView>
			</ScrollView>
		)
	}
}

// const mapStateToProps = (
// 	state: ReduxState,
// 	actualProps: ReactProps,
// ): ReduxStateProps => {
// 	return {
// 		filters: get(state, actualProps.navigation.state.params.pathToFilters, []),
// 	}
// }

function mapState(state: ReduxState, actualProps: ReactProps): ReduxStateProps {
	return {
		filters: get(state, actualProps.navigation.state.params.pathToFilters, []),
	}
}

export const ConnectedFilterView = connect(mapState)(FilterViewComponent)
