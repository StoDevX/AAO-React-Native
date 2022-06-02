import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {useDispatch, useSelector} from 'react-redux'
import type {ReduxState} from '../../redux'
import {updatePrinters} from '../../redux/parts/stoprint'
import type {Printer} from '../../lib/stoprint'
import {isStoprintMocked} from '../../lib/stoprint'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView} from '@frogpond/notice'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'
import delay from 'delay'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import {StoPrintErrorView} from './components'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'

const styles = StyleSheet.create({
	list: {},
})

type ReduxStateProps = {
	readonly printers: Array<Printer>
	readonly recentPrinters: Array<Printer>
	readonly popularPrinters: Array<Printer>
	readonly colorPrinters: Array<Printer>
	readonly error: string | null
}

type ReduxDispatchProps = {
	updatePrinters: () => void
}

type Props = ReduxDispatchProps & ReduxStateProps

const PrinterListView = (props: Props) => {
	let [initialLoadComplete, setInitialLoadComplete] = React.useState(false)
	let [loading, setLoading] = React.useState(true)

	let navigation = useNavigation()

	let route = useRoute<RouteProp<RootStackParamList, 'PrinterList'>>()
	let {job} = route.params

	let fetchData = React.useCallback(() => props.updatePrinters(), [props])

	React.useEffect(() => {
		async function getData() {
			await fetchData()
			setLoading(false)
			setInitialLoadComplete(true)
		}
		getData()
	}, [fetchData])

	let refresh = async () => {
		let start = Date.now()

		setLoading(true)

		await fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		setLoading(false)
	}

	let openPrintRelease = (item: Printer) =>
		navigation.navigate('PrintJobRelease', {
			job: job,
			printer: item,
		})

	if (props.error) {
		return <StoPrintErrorView refresh={fetchData} statusMessage={props.error} />
	}
	if (loading && !initialLoadComplete) {
		return <LoadingView text="Querying Available Printers…" />
	}
	let colorJob = job.grayscaleFormatted === 'No'

	let availablePrinters = colorJob ? props.colorPrinters : props.printers

	let allWithLocations = availablePrinters.map((j) => ({
		...j,
		location: j.location || 'Unknown Building',
	}))

	let allGrouped = groupBy(allWithLocations, (j) =>
		/^[A-Z]+ \d+/u.test(j.location) ? j.location.split(/\s+/u)[0] : j.location,
	)

	let groupedByBuilding = toPairs(allGrouped).map(([title, data]) => ({
		title,
		data,
	}))

	groupedByBuilding.sort((a, b) =>
		a.title === '' && b.title !== '' ? 1 : a.title.localeCompare(b.title),
	)

	let grouped = props.printers.length
		? [
				{title: 'Recent', data: props.recentPrinters},
				{title: 'Popular', data: props.popularPrinters},
				...groupedByBuilding,
		  ]
		: []

	let availableGrouped = colorJob ? groupedByBuilding : grouped

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			keyExtractor={(item: Printer) => item.printerName}
			onRefresh={refresh}
			refreshing={loading}
			renderItem={({item}: {item: Printer}) => (
				<ListRow onPress={() => openPrintRelease(item)}>
					<Title>{item.printerName}</Title>
					<Detail>{item.location}</Detail>
				</ListRow>
			)}
			renderSectionHeader={({section: {title}}: any) => (
				<ListSectionHeader title={title} />
			)}
			sections={availableGrouped}
			style={styles.list}
		/>
	)
}

export function ConnectedPrinterListView(): JSX.Element {
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
		() => dispatch(updatePrinters()),
		[dispatch],
	)

	return (
		<PrinterListView
			colorPrinters={colorPrinters}
			error={error}
			popularPrinters={popularPrinters}
			printers={printers}
			recentPrinters={recentPrinters}
			updatePrinters={_updatePrinters}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Select Printer',
	headerRight: () => <DebugNoticeButton shouldShow={isStoprintMocked} />,
}
