import * as React from 'react'
import {ScrollView, StyleSheet, Image} from 'react-native'
import {images as buildingImages} from '../../../../images/spaces'
import type {BuildingType} from '../types'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'
import {getShortBuildingStatus} from '../lib'

import {SolidBadge as Badge} from '@frogpond/badge'
import {Header} from './header'
import {ScheduleTable} from './schedule-table'
import {ListFooter} from '@frogpond/lists'
import {LinkTable} from './link-table'

const styles = StyleSheet.create({
	container: {
		alignItems: 'stretch',
		backgroundColor: c.sectionBgColor,
	},
	image: {
		width: undefined,
		height: 100,
	},
})

type Props = {
	info: BuildingType
	now: Moment
	onProblemReport: () => any
}

const BG_COLORS: Record<string, string> = {
	Open: c.moneyGreen,
	Closed: c.salmon,
}

export class BuildingDetail extends React.Component<Props> {
	shouldComponentUpdate(nextProps: Props) {
		return (
			!this.props.now.isSame(nextProps.now, 'minute') ||
			this.props.info !== nextProps.info ||
			this.props.onProblemReport !== nextProps.onProblemReport
		)
	}

	render() {
		let {info, now, onProblemReport} = this.props

		let headerImage =
			info.image && buildingImages.has(info.image)
				? buildingImages.get(info.image)
				: null

		let openStatus = getShortBuildingStatus(info, now)
		let schedules = info.schedule || []
		let links = info.links || []

		return (
			<ScrollView contentContainerStyle={styles.container}>
				{headerImage ? (
					<Image
						accessibilityIgnoresInvertColors={true}
						resizeMode="cover"
						source={headerImage}
						style={styles.image}
					/>
				) : null}

				<Header building={info} />
				<Badge accentColor={BG_COLORS[openStatus]} status={openStatus} />
				<ScheduleTable
					now={now}
					onProblemReport={onProblemReport}
					schedules={schedules}
				/>

				{links.length ? <LinkTable links={links} /> : null}

				<ListFooter
					title={
						'Building hours subject to change without notice\n\nData collected by the humans of All About Olaf'
					}
				/>
			</ScrollView>
		)
	}
}
