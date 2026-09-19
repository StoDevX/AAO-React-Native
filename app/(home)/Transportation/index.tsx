import * as React from 'react'
import {StyleSheet} from 'react-native'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {ContentUnavailableView, Host, List, Section, Text} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {useMomentTimer} from '@frogpond/timer'

import {DisclosureRow} from '../../../source/components/rows'
import {BUS_FOOTER_MESSAGE} from '../../../source/features/transportation/bus/constants'
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

	let {data: otherModes = []} = useQuery(otherModesGroupedOptions)

	if (busesLoading) {
		return <LoadingView />
	}

	if (busesErrored) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetchBuses}
				text={`A problem occured while loading: ${busError}`}
			/>
		)
	}

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetchBuses()
					}),
				]}
			>
				{busLines.length === 0 ? (
					<ContentUnavailableView
						description="Check back once the college publishes its routes."
						systemImage="bus"
						title="No Bus Lines"
					/>
				) : (
					busLines.map((line) => (
						<BusLineWidget
							key={line.line}
							line={line}
							now={now}
							onPressLine={() => {
								router.push({
									pathname: '/Transportation/line/[line]',
									params: {line: line.line},
								})
							}}
							onPressStop={(stopName) => {
								router.push({
									pathname: '/Transportation/line/stop',
									params: {line: line.line, day: '', stopName},
								})
							}}
						/>
					))
				)}

				{otherModes.map((section) => (
					<Section key={section.title} title={section.title}>
						{section.data.map((mode) => (
							<DisclosureRow
								key={mode.name}
								detail={mode.synopsis}
								onPress={() => openUrl(mode.url)}
								title={mode.name}
							/>
						))}
					</Section>
				))}

				<Section footer={<Text>{BUS_FOOTER_MESSAGE}</Text>}>{null}</Section>
			</List>
		</Host>
	)
}
