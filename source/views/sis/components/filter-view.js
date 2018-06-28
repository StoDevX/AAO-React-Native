// @flow
import * as React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import {Section} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../../types'
import type {FilterType} from '../../components/filter'
import {PushButtonCell} from '../../components/cells/push-button'
import * as c from '../../components/colors'

type ReactProps = TopLevelViewPropsType

type Props = ReactProps & {
	screenProps: {filters: FilterType[]},
}

export class AllFiltersView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'All Filters',
	}

	openFilterDetail = (filter: FilterType) => {
		this.props.navigation.navigate('FilterDetailView', {filter: filter})
	}

	render() {
		console.log(this.props)
		const {filters} = this.props.screenProps
		const filterCells = filters.map(filter => (
			<PushButtonCell
				key={filter.spec.title}
				onPress={() => {
					this.openFilterDetail(filter)
				}}
				title={filter.spec.title}
			/>
		))

		return (
			<ScrollView style={styles.container}>
				<Section sectionPaddingBottom={0} sectionPaddingTop={0}>
					{filterCells}
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
