import * as React from 'react'
import {StyleSheet} from 'react-native'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {ContentUnavailableView, Host, List, Section, Text} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {LoadingView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {useMomentTimer} from '@frogpond/timer'

import {DisclosureRow} from '../../../source/components/rows'
import {BUS_FOOTER_MESSAGE} from '../../../source/features/transportation/bus/constants'
import {visibleBusLines} from '../../../source/features/transportation/bus/lib'
import {busRoutesOptions} from '../../../source/features/transportation/bus/query'
import {BusLineWidget} from '../../../source/features/transportation/bus/widget'
import {otherModesGroupedOptions} from '../../../source/features/transportation/other-modes/query'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/**
 * Every bus line at a glance, then the modes that keep no schedule. One timer
 * drives every widget: a clock per line would have them ticking over at
 * slightly different moments.
 */
export default function TransportationPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})

	let {
		data: busLines = [],
		error: busError,
		refetch: refetchBuses,
		isLoading: busesLoading,
		isError: busesErrored,
	} = useQuery(busRoutesOptions)

	let {
		data: otherModes = [],
		error: otherModesError,
		refetch: refetchOtherModes,
		isLoading: otherModesLoading,
		isError: otherModesErrored,
	} = useQuery(otherModesGroupedOptions)

	let lines = visibleBusLines(busLines)

	// Returns both, rather than firing and forgetting them: SwiftUI's
	// `refreshable` spinner runs until the handler it was given settles, so a
	// void return would stop it the instant the pull ended.
	let refetchAll = React.useCallback(
		() => Promise.all([refetchBuses(), refetchOtherModes()]),
		[refetchBuses, refetchOtherModes],
	)

	// Nothing to draw yet either way, so the whole screen waits.
	if (busesLoading || otherModesLoading) {
		return <LoadingView />
	}

	// Each feed answers for itself, in its own place on the screen. The widgets
	// come from `transit/bus` and the sections below from `transit/modes`, and a
	// failure in one says so where its own content would have been rather than
	// replacing the page -- a bus outage used to be survivable because Other
	// Modes had a tab of its own, and it still is. Pulling the list down retries
	// both, which is the retry these notices would otherwise need a button for.
	let busSection: React.ReactNode
	if (busesErrored) {
		busSection = (
			<ContentUnavailableView
				description={`A problem occured while loading: ${busError}`}
				systemImage="exclamationmark.triangle"
				title="Couldn't Load Bus Lines"
			/>
		)
	} else if (lines.length === 0) {
		busSection = (
			<ContentUnavailableView
				description="Check back once the college publishes its routes."
				systemImage="bus"
				title="No Bus Lines"
			/>
		)
	} else {
		busSection = lines.map((line) => (
			<BusLineWidget
				key={line.line}
				line={line}
				now={now}
				onPress={() => {
					router.navigate({
						pathname: '/Transportation/line/[line]',
						params: {line: line.line},
					})
				}}
			/>
		))
	}

	let otherModesSection: React.ReactNode
	if (otherModesErrored) {
		otherModesSection = (
			<ContentUnavailableView
				description={`A problem occured while loading: ${otherModesError}`}
				systemImage="exclamationmark.triangle"
				title="Couldn't Load Other Modes"
			/>
		)
	} else if (otherModes.length === 0) {
		otherModesSection = (
			<ContentUnavailableView
				description="Check back once the college publishes its transit options."
				systemImage="tram"
				title="No Other Modes"
			/>
		)
	} else {
		otherModesSection = otherModes.map((section) => (
			<Section key={section.title ?? 'uncategorized'} title={section.title}>
				{section.data.map((mode) => (
					<DisclosureRow
						key={mode.name}
						detail={mode.synopsis}
						destination="external"
						onPress={() => openUrl(mode.url)}
						title={mode.name}
					/>
				))}
			</Section>
		))
	}

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetchAll()
					}),
				]}
			>
				{busSection}

				{otherModesSection}

				{/* children is required, but this section has no rows of its own -- only a footer */}
				<Section footer={<Text>{BUS_FOOTER_MESSAGE}</Text>}>{null}</Section>
			</List>
		</Host>
	)
}
