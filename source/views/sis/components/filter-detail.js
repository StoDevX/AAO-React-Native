// @flow
import * as React from 'react'
import {Section} from 'react-native-tableview-simple'
import {ScrollView, Text, StyleSheet} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type {FilterType} from '../../components/filter'
import * as c from '../../components/colors'
import {FilterSection} from '../../components/filter/section'

type ReactProps = TopLevelViewPropsType

type Props = ReactProps & {
	navigation?: {state: {params: {filter: FilterType}}},
	screenProps?: {filter: FilterType},
}

export class FilterDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation, screenProps}: any) => {
		const filter = navigation.state.params
			? navigation.state.params.filter
			: screenProps.filter
		return {
			title: filter.spec.title,
		}
	}

	onFilterChanged = () => {
		console.log('Filter Changed')
	}

	render() {
		const filter = this.props.navigation.state.params
			? this.props.navigation.state.params.filter
			: this.props.screenProps.filter

		return (
			<ScrollView style={styles.container}>
				<Section sectionPaddingBottom={0} sectionPaddingTop={0}>
					<FilterSection
						key={filter.key}
						filter={filter}
						onChange={this.onFilterChanged}
					/>
				</Section>
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
})
