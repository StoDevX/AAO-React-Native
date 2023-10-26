import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

import {OutlineBadge as Badge} from '@frogpond/badge'
import * as c from '@frogpond/colors'
import {Row} from '@frogpond/layout'
import {Detail, ListRow, Title} from '@frogpond/lists'

import {
	getAccentBackgroundColor,
	getDetailedBuildingStatus,
	getShortBuildingStatus,
} from './lib'
import type {BuildingType} from './types'
import type {Moment} from 'moment'

const styles = StyleSheet.create({
	title: {
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	titleText: {
		flex: 1,
	},
	detailWrapper: {
		paddingTop: 3,
	},
	detailRow: {
		paddingTop: 0,
	},
	subtitleText: {
		fontWeight: '400',
		color: c.secondaryLabel,
	},
	accessoryBadge: {
		marginLeft: 4,
	},
	bold: {
		fontWeight: 'bold',
	},
})

type Props = {
	info: BuildingType
	now: Moment
	onPress: () => void
}

export function BuildingRow(props: Props): JSX.Element {
	let {info, now, onPress} = props

	let openStatus = React.useMemo(
		() => getShortBuildingStatus(info, now),
		[now, info],
	)
	let hours = React.useMemo(
		() => getDetailedBuildingStatus(info, now),
		[now, info],
	)

	return (
		<ListRow arrowPosition="center" onPress={onPress}>
			<Row style={styles.title}>
				<Title lines={1} style={styles.titleText}>
					<Text>{info.name}</Text>
					{info.abbreviation ? <Text> ({info.abbreviation})</Text> : null}
					{info.subtitle ? (
						<Text style={styles.subtitleText}> {info.subtitle}</Text>
					) : null}
				</Title>

				{!info.isNotice ? (
					<Badge
						accentColor={getAccentBackgroundColor(openStatus)}
						style={styles.accessoryBadge}
						text={openStatus}
					/>
				) : null}
			</Row>

			<View style={styles.detailWrapper}>
				{info.noticeMessage ? (
					<Detail style={styles.detailRow}>{info.noticeMessage}</Detail>
				) : null}
				{!(info.noticeMessage && info.isNotice)
					? hours.map(({isActive, label, status}, i) => (
							<Detail key={i} style={styles.detailRow}>
								<BuildingTimeSlot
									highlight={hours.length > 1 && isActive}
									label={label}
									status={status}
								/>
							</Detail>
					  ))
					: null}
			</View>
		</ListRow>
	)
}

type BuildingTimeSlotProps = {
	label: string | null
	status: string
	highlight: boolean
}

const BuildingTimeSlot = (props: BuildingTimeSlotProps) => {
	// we don't want to show the 'Hours' label, since almost every row has it
	let showLabel = props.label !== 'Hours'

	return (
		<Text>
			{showLabel ? (
				<Text style={props.highlight && styles.bold}>{props.label}: </Text>
			) : null}
			<Text style={props.highlight && styles.bold}>{props.status}</Text>
		</Text>
	)
}
