// @flow

import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {Badge} from '../components/badge'
import isEqual from 'lodash/isEqual'
import type momentT from 'moment'
import type {BuildingType} from './types'
import * as c from '../components/colors'
import {Row} from '../components/layout'
import {ListRow, Detail, Title} from '../components/list'
import {getDetailedBuildingStatus, getShortBuildingStatus} from './lib'

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
	now: momentT,
	onPress: BuildingType => any,
}

type State = {
	now: momentT,
	openStatus: string,
	hours: Array<any>,
	accentBg: string,
	accentText: string,
}

function deriveStateFromProps(props: Props) {
		const openStatus = getShortBuildingStatus(props.info, props.now)
		const hours = getDetailedBuildingStatus(props.info, props.now)

		const accentBg = BG_COLORS[openStatus] || c.goldenrod
		const accentText = FG_COLORS[openStatus] || 'rgb(130, 82, 45)'

		return {
			now: props.now,
			openStatus,
			hours,
			accentBg,
			accentText,
		}
	}

export class BuildingRow extends React.Component<Props, State> {
	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		if (prevState.now.isSame(nextProps.now, 'minute')) {
			return null
		}

		return deriveStateFromProps(nextProps)
	}

	state = deriveStateFromProps(this.props)

	shouldComponentUpdate(nextProps: Props, nextState: State) {
		// We won't check the time in shouldComponentUpdate, because we really
		// only care if the building status has changed, and this is called after
		// setStateFromProps runs.
		return (
			this.props.name !== nextProps.name ||
			this.props.info !== nextProps.info ||
			this.props.onPress !== nextProps.onPress ||
			this.state.openStatus !== nextState.openStatus ||
			!isEqual(this.state.hours, nextState.hours)
		)
	}

	onPress = () => {
		this.props.onPress(this.props.info)
	}

	render() {
		const {info, name} = this.props
		const {openStatus, hours, accentBg, accentText} = this.state

		return (
			<ListRow arrowPosition="center" onPress={this.onPress}>
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

const BuildingTimeSlot = ({
	label,
	status,
	highlight,
}: {
	label: ?string,
	status: string,
	highlight: boolean,
}) => {
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
