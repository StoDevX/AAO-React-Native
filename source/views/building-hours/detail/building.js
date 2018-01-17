/**
 * @flow
 *
 * <Building /> controls the structure of the detail view.
 */

import * as React from 'react'
import {ScrollView, StyleSheet, Platform, Image} from 'react-native'
import {buildingImages} from '../../../../images/building-images'
import type {BuildingType} from '../types'
import moment from 'moment-timezone'
import * as c from '../../components/colors'
import {getShortBuildingStatus} from '../lib'

import {Badge} from './badge'
import {Header} from './header'
import {ScheduleTable} from './schedule-table'
import {ListFooter} from '../../components/list'

const styles = StyleSheet.create({
	container: {
		alignItems: 'stretch',
		...Platform.select({
			android: {
				backgroundColor: c.androidLightBackground,
			},
			ios: {
				backgroundColor: c.iosLightBackground,
			},
		}),
	},
	image: {
		width: null,
		height: 100,
	},
})

type Props = {
	info: BuildingType,
	now: moment,
	onProblemReport: () => any,
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
		const {info, now, onProblemReport} = this.props

		const headerImage =
			info.image && buildingImages.hasOwnProperty(info.image)
				? buildingImages[info.image]
				: null
		const openStatus = getShortBuildingStatus(info, now)
		const schedules = info.schedule || []

		return (
			<ScrollView contentContainerStyle={styles.container}>
				{headerImage ? (
					<Image resizeMode="cover" source={headerImage} style={styles.image} />
				) : null}

				<Header building={info} />
				<Badge status={openStatus} />
				<ScheduleTable
					now={now}
					onProblemReport={onProblemReport}
					schedules={schedules}
				/>

				<ListFooter
					title={
						'Building hours subject to change without notice\n\nData collected by the humans of All About Olaf'
					}
				/>
			</ScrollView>
		)
	}
}
