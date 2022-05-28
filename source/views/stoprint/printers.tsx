import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {useDispatch, useSelector} from 'react-redux'
import type {ReduxState} from '../../redux'
import {updatePrinters} from '../../redux/parts/stoprint'
import type {Printer, PrintJob} from '../../lib/stoprint'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
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
	navigation: {state: {params: {job: PrintJob}}}
}

type ReduxStateProps = {
	readonly printers: Array<Printer>
	readonly recentPrinters: Array<Printer>
	readonly popularPrinters: Array<Printer>
	readonly colorPrinters: Array<Printer>
	readonly error?: string
}

type ReduxDispatchProps = {
	updatePrinters: () => any
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

type State = {
	initialLoadComplete: boolean
	loading: boolean
}

class PrinterListView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Select Printer',
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
		let colorJob =
			this.props.navigation.state.params.job.grayscaleFormatted === 'No'

		let availablePrinters = colorJob
			? this.props.colorPrinters
			: this.props.printers

		let allWithLocations = availablePrinters.map((j) => ({
			...j,
			location: j.location || 'Unknown Building',
		}))

		let allGrouped = groupBy(allWithLocations, (j) =>
			/^[A-Z]+ \d+/u.test(j.location)
				? j.location.split(/\s+/u)[0]
				: j.location,
		)

		let groupedByBuilding = toPairs(allGrouped).map(([title, data]) => ({
			title,
			data,
		}))

		groupedByBuilding.sort((a, b) =>
			a.title === '' && b.title !== '' ? 1 : a.title.localeCompare(b.title),
		)

		let grouped = this.props.printers.length
			? [
					{title: 'Recent', data: this.props.recentPrinters},
					{title: 'Popular', data: this.props.popularPrinters},
					...groupedByBuilding,
			  ]
			: []

		let availableGrouped = colorJob ? groupedByBuilding : grouped

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={availableGrouped}
				style={styles.list}
			/>
		)
	}
}

export function ConnectedPrinterListView(props: TopLevelViewPropsType) {
	let dispatch = useDispatch()

	let printers = useSelector(
		(state: ReduxState) => state.stoprint?.printers || [],
	)
	let recentPrinters = useSelector(
		(state: ReduxState) => state.stoprint?.recentPrinters || [],
	)
	let popularPrinters = useSelector(
		(state: ReduxState) => state.stoprint?.popularPrinters || [],
	)
	let colorPrinters = useSelector(
		(state: ReduxState) => state.stoprint?.colorPrinters || [],
	)
	let error = useSelector(
		(state: ReduxState) => state.stoprint?.printersError || null,
	)

	let _updatePrinters = React.useCallback(
		() => () => dispatch(updatePrinters()),
		[dispatch],
	)

	return (
		<PrinterListView
			{...props}
			colorPrinters={colorPrinters}
			error={error}
			popularPrinters={popularPrinters}
			printers={printers}
			recentPrinters={recentPrinters}
			updatePrinters={_updatePrinters}
		/>
	)
}
