// @flow
import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {type FilterType} from './types'
import {FilterSection} from './section'
import {TableView} from 'react-native-tableview-simple'

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})

type Props = {
	navigation: {
		state: {
			params: {|
				+title: string,
				+initialFilters: Array<FilterType>,
				+onDismiss: (filters: Array<FilterType>) => mixed,
			|},
		},
		addListener: (
			ev: string,
			(payload: mixed) => mixed,
		) => {remove: () => void},
	},
}

type State = {
	filters: Array<FilterType>,
}

export class FilterView extends React.Component<Props, State> {
	static navigationOptions({navigation}: Props) {
		let {title} = navigation.state.params
		return {title}
	}

	state = {
		filters: [],
	}

	static getDerivedStateFromProps(props: Props) {
		let {initialFilters: filters} = props.navigation.state.params
		return {filters}
	}

	componentDidMount() {
		this._subscription = this.props.navigation.addListener('willBlur', () => {
			let {onDismiss} = this.props.navigation.state.params
			if (onDismiss) {
				onDismiss(this.state.filters)
			}
		})
	}

	componentWillUnmount() {
		this._subscription && this._subscription.remove()
	}

	_subscription: ?{remove: () => void} = null

	onFilterChanged = (filter: FilterType) => {
		// replace the changed filter in the array, maintaining position
		this.setState(state => {
			let edited = state.filters.map(f => (f.key !== filter.key ? f : filter))
			return {filters: edited}
		})
	}

	render() {
		const contents = this.state.filters.map(filter => (
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
