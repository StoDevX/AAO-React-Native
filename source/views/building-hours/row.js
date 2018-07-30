// @flow

import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import mem from 'mem'
import {Badge} from '../components/badge'
import type moment from 'moment'
import type {BuildingType} from './types'
import * as c from '../components/colors'
import {Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {getDetailedBuildingStatus, getShortBuildingStatus} from './lib'
import {age} from '@frogpond/age'

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
		color: c.iosDisabledText,
	},
	accessoryBadge: {
		marginLeft: 4,
	},
	bold: {
		fontWeight: 'bold',
	},
})

const BG_COLORS = {
	Open: c.moneyGreen,
	Closed: c.salmon,
}

const FG_COLORS = {
	Open: c.hollyGreen,
	Closed: c.brickRed,
}

type Props = {
	info: BuildingType,
	name: string,
	now: moment,
	onPress: BuildingType => any,
}

function deriveState(info: BuildingType, now: moment) {
	const openStatus = getShortBuildingStatus(info, now)
	const hours = getDetailedBuildingStatus(info, now)

	const accentBg = BG_COLORS[openStatus] || c.goldenrod
	const accentText = FG_COLORS[openStatus] || 'rgb(130, 82, 45)'

	return {
		openStatus,
		hours,
		accentBg,
		accentText,
	}
}

let memDeriveState = mem(deriveState, {maxAge: age.minutes(2)})

export class BuildingRow extends React.Component<Props> {
	render() {
		const {info, name, onPress, now} = this.props
		const {openStatus, hours, accentBg, accentText} = memDeriveState(info, now)

		return (
			<ListRow arrowPosition="center" onPress={() => onPress(info)}>
				<Row style={styles.title}>
					<Title lines={1} style={styles.titleText}>
						<Text>{name}</Text>
						{info.abbreviation ? <Text> ({info.abbreviation})</Text> : null}
						{info.subtitle ? (
							<Text style={styles.subtitleText}> {info.subtitle}</Text>
						) : null}
					</Title>

					{!info.isNotice ? (
						<Badge
							accentColor={accentBg}
							style={styles.accessoryBadge}
							text={openStatus}
							textColor={accentText}
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
}

const BuildingTimeSlot = (props: {
	label: ?string,
	status: string,
	highlight: boolean,
}) => {
	let {label, status, highlight} = props

	// we don't want to show the 'Hours' label, since almost every row has it
	const showLabel = label && label !== 'Hours'

	return (
		<Text>
			{showLabel ? (
				<Text style={highlight && styles.bold}>{label}: </Text>
			) : null}
			<Text style={highlight && styles.bold}>{status}</Text>
		</Text>
	)
}
