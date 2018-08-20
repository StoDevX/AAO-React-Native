// @flow

import React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {connect} from 'react-redux'
import {type ReduxState} from '../../flux'
import {updatePrinters} from '../../flux/parts/stoprint'
import type {Printer, PrintJob} from '../../lib/stoprint'
import {
	ListRow,
	ListSeparator,
	ListSectionHeader,
	Detail,
	Title,
} from '../components/list'
import LoadingView from '../components/loading'
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
	+error: ?string,
	+loading: boolean,
	+username: ?string,
}

type ReduxDispatchProps = {
	updatePrinters: () => any,
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

class PrinterListView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Select Printer',
		headerBackTitle: 'Printers',
	}

	componentDidMount = () => {
		this.fetchData()
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

	openPrintRelease = (item: Printer) =>
		this.props.navigation.navigate('PrintJobReleaseView', {
			job: this.props.navigation.state.params.job,
			printer: item,
			username: this.props.username,
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
		if (this.props.loading && this.props.printers.length === 0) {
			return <LoadingView text="Fetching Available Printers…" />
		}
		if (this.props.error) {
			return (
				<StoPrintErrorView
					navigation={this.props.navigation}
					refresh={this.fetchData}
				/>
			)
		}

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
		username: state.settings ? state.settings.username : null,
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
