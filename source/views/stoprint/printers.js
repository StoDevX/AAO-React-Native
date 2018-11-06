// @flow

import React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {connect} from 'react-redux'
import {type ReduxState} from '../../redux'
import {updatePrinters} from '../../redux/parts/stoprint'
import type {Printer, PrintJob} from '../../lib/stoprint'
import {
	ListRow,
	ListSeparator,
	ListSectionHeader,
	Detail,
	Title,
} from '@frogpond/lists'
import {LoadingView} from '@frogpond/notice'
import type {TopLevelViewPropsType} from '../types'
import delay from 'delay'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import {StoPrintErrorView} from './components'

const styles = StyleSheet.create({
	list: {},
})

type ReactProps = TopLevelViewPropsType & {
	navigation: {state: {params: {job: PrintJob}}},
}

type ReduxStateProps = {
	+printers: Array<Printer>,
	+recentPrinters: Array<Printer>,
	+popularPrinters: Array<Printer>,
	+colorPrinters: Array<Printer>,
	+error: ?string,
}

type ReduxDispatchProps = {
	updatePrinters: () => any,
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

type State = {
	initialLoadComplete: boolean,
	loading: boolean,
}

class PrinterListView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Select Printer',
		headerBackTitle: 'Printers',
	}

	state = {
		initialLoadComplete: false,
		loading: true,
	}

	componentDidMount = () => {
		this.initialLoad()
	}

	initialLoad = async () => {
		await this.fetchData()
		this.setState(() => ({loading: false, initialLoadComplete: true}))
	}

	refresh = async () => {
		let start = Date.now()

		this.setState(() => ({loading: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		this.setState(() => ({loading: false}))
	}

	fetchData = () => this.props.updatePrinters()

	keyExtractor = (item: Printer) => item.printerName

	openPrintRelease = (item: Printer) =>
		this.props.navigation.navigate('PrintJobReleaseView', {
			job: this.props.navigation.state.params.job,
			printer: item,
		})

	renderItem = ({item}: {item: Printer}) => (
		<ListRow onPress={() => this.openPrintRelease(item)}>
			<Title>{item.printerName}</Title>
			<Detail>{item.location}</Detail>
		</ListRow>
	)

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	render() {
		if (this.props.error) {
			return (
				<StoPrintErrorView
					navigation={this.props.navigation}
					refresh={this.fetchData}
					statusMessage={this.props.error}
				/>
			)
		}
		if (this.state.loading && !this.state.initialLoadComplete) {
			return <LoadingView text="Querying Available Printers…" />
		}
		const colorJob =
			this.props.navigation.state.params.job.grayscaleFormatted === 'No'

		const availablePrinters = colorJob
			? this.props.colorPrinters
			: this.props.printers

		const allWithLocations = availablePrinters.map(j => ({
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

		const availableGrouped = colorJob ? groupedByBuilding : grouped

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				keyExtractor={this.keyExtractor}
				onRefresh={(this.refresh: any)}
				refreshing={this.state.loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={availableGrouped}
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
		colorPrinters: state.stoprint ? state.stoprint.colorPrinters : [],
		error: state.stoprint ? state.stoprint.printersError : null,
	}
}

function mapDispatchToProps(dispatch): ReduxDispatchProps {
	return {
		updatePrinters: () => dispatch(updatePrinters()),
	}
}

export const ConnectedPrinterListView = connect(
	mapStateToProps,
	mapDispatchToProps,
)(PrinterListView)
