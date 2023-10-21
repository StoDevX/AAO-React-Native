import * as React from 'react'
import {Image, ScrollView, StyleSheet} from 'react-native'

import {SolidBadge as Badge} from '@frogpond/badge'
import {ListFooter} from '@frogpond/lists'

import {images as buildingImages} from '../../../../images/spaces'
import {getShortBuildingStatus, hoursBackgroundColors} from '../lib'
import type {BuildingType} from '../types'
import {Header} from './header'
import {LinkTable} from './link-table'
import {ScheduleTable} from './schedule-table'
import type {Moment} from 'moment-timezone'

const styles = StyleSheet.create({
	image: {
		width: undefined,
		height: 100,
	},
})

type Props = {
	info: BuildingType
	now: Moment
	onProblemReport: () => void
}

export const BuildingDetail = React.memo((props: Props): JSX.Element => {
	let {info, now, onProblemReport} = props

	let headerImage =
		info.image && buildingImages.has(info.image)
			? buildingImages.get(info.image)
			: null

	let openStatus = getShortBuildingStatus(info, now)
	let schedules = info.schedule || []
	let links = info.links || []

	return (
		<ScrollView>
			{headerImage ? (
				<Image
					accessibilityIgnoresInvertColors={true}
					resizeMode="cover"
					source={headerImage}
					style={styles.image}
				/>
			) : null}

			<Header building={info} />
			<Badge
				accentColor={hoursBackgroundColors[openStatus]}
				status={openStatus}
			/>
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
})
