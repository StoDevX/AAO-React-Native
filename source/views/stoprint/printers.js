// @flow

import React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {connect} from 'react-redux'
import {type ReduxState} from '../../flux'
import {ListEmpty} from '../components/list'
import {updatePrinters} from '../../flux/parts/stoprint'
import type {Printer} from './types'
import {
	ListRow,
	ListSeparator,
	ListSectionHeader,
	Detail,
	Title,
} from '../components/list'
import type {TopLevelViewPropsType} from '../types'
import delay from 'delay'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'

const styles = StyleSheet.create({
	list: {},
})

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	+printers: Array<Printer>,
	+recentPrinters: Array<Printer>,
	+popularPrinters: Array<Printer>,
	+error: ?string,
	+loading: boolean,
}

type ReduxDispatchProps = {
	updatePrinters: () => any,
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

class PrintReleaseView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Printers',
	}

	componentWillMount = () => {
		this.refresh()
	}

	refresh = async (): any => {
		let start = Date.now()

		await this.fetchData()
		// console.log('data returned')

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
	}

	fetchData = () => this.props.updatePrinters()

	keyExtractor = (item: Printer) => item.printerName

	openPrintConfirmation = () =>
		this.props.navigation.navigate('PrintJobReleaseConfirmationView')

	renderItem = ({item}: {item: Printer}) => (
		<ListRow onPress={this.openPrintConfirmation}>
			<Title>{item.printerName}</Title>
			<Detail>{item.location}</Detail>
		</ListRow>
	)

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	render() {
		const allWithLocations = this.props.printers.map(j => ({
			...j,
			location: j.location || 'Unknown Building',
		}))

		const allGrouped = groupBy(
			allWithLocations,
			j =>
				/^[A-Z]+ \d+/.test(j.location)
					? j.location.split(/\s+/)[0]
					: j.location,
		)

		const groupedByBuilding = toPairs(allGrouped).map(([title, data]) => ({
			title,
			data,
		}))

		groupedByBuilding.sort(
			(a, b) =>
				a.title === '' && b.title !== '' ? 1 : a.title.localeCompare(b.title),
		)

		const grouped = this.props.printers.length
			? [
					{title: 'Recent', data: this.props.recentPrinters},
					{title: 'Popular', data: this.props.popularPrinters},
					...groupedByBuilding,
			  ]
			: []

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.props.loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={grouped}
				style={styles.list}
			/>
		)
	}
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	return {
		printers: state.stoprint ? state.stoprint.printers : [],
		recentPrinters: state.stoprint ? state.stoprint.recentPrinters : [],
		popularPrinters: state.stoprint ? state.stoprint.popularPrinters : [],
		error: state.stoprint ? state.stoprint.error : null,
		loading: state.stoprint ? state.stoprint.loadingPrinters : false,
	}
}

function mapDispatchToProps(dispatch): ReduxDispatchProps {
	return {
		updatePrinters: () => dispatch(updatePrinters()),
	}
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(PrintReleaseView)
