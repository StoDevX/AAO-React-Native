// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {UnprocessedBusLine} from './types'
import MapView from 'react-native-maps'
import moment from 'moment-timezone'
import {NoticeView} from '../../components/notice'
import type {TopLevelViewPropsType} from '../../types'
import {getScheduleForNow, processBusLine} from './lib'
import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'

const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
	map: {...StyleSheet.absoluteFillObject},
})

type Props = TopLevelViewPropsType & {|
	navigation: {
		state: {
			params: {
				line: UnprocessedBusLine,
			},
		},
	},
|}

type State = {|
	intervalId: number,
	now: moment,
	region: {
		latitude: number,
		latitudeDelta: number,
		longitude: number,
		longitudeDelta: number,
	},
|}

export class BusMap extends React.PureComponent<Props, State> {
	static navigationOptions = (args: {
		navigation: {state: {params: {line: UnprocessedBusLine}}},
	}) => ({
		title: `${args.navigation.state.params.line.line} Map`,
	})

	state = {
		intervalId: 0,
		now: moment.tz(TIMEZONE),
		region: {
			latitude: 44.44946671480875,
			latitudeDelta: 0.06175530810822494,
			longitude: -93.17014753996669,
			longitudeDelta: 0.05493163793703104,
		},
	}

	componentWillMount() {
		// This updates the screen every second, so that the "next bus" times are
		// updated without needing to leave and come back.
		this.setState(() => ({intervalId: setInterval(this.updateTime, 1000)}))
	}

	componentWillUnmount() {
		clearTimeout(this.state.intervalId)
	}

	onRegionChangeComplete = (newRegion: {
		latitude: number,
		latitudeDelta: number,
		longitude: number,
		longitudeDelta: number,
	}) => {
		this.setState(state => {
			if (isEqual(state.region, newRegion)) {
				return
			}

			return {region: newRegion}
		})
	}

	updateTime = () => {
		this.setState(() => ({now: moment.tz(TIMEZONE)}))
	}

	render() {
		const {now} = this.state
		// now = moment.tz('Fri 8:13pm', 'ddd h:mma', true, TIMEZONE)
		const lineToDisplay = this.props.navigation.state.params.line

		const processedLine = processBusLine(lineToDisplay, now)
		const scheduleForToday = getScheduleForNow(processedLine.schedules, now)

		if (!scheduleForToday) {
			const notice = `No schedule was found for today, ${now.format('dddd')}`
			return <NoticeView text={notice} />
		}

		const entriesWithCoordinates = scheduleForToday.timetable.filter(
			entry => entry.coordinates,
		)

		if (!entriesWithCoordinates.length) {
			const today = now.format('dddd')
			const msg = `No coordinates have been provided for today's (${today}) schedule on the "${lineToDisplay}" line`
			return <NoticeView text={msg} />
		}

		const markers = uniqBy(entriesWithCoordinates, ({name}) => name)

		return (
			<MapView
				loadingEnabled={true}
				onRegionChangeComplete={this.onRegionChangeComplete}
				region={this.state.region}
				style={styles.map}
			>
				{markers.map(({name, coordinates: [lat, lng] = []}, i) => (
					// we know from entriesWithCoordinates that all of these will have
					// coordinates; I just can't convince flow of that without a default value
					<MapView.Marker
						key={i}
						coordinate={{lat, lng}}
						title={name}
						// description={marker.description}
						// TODO: add "next arrival" time as the description
					/>
				))}
			</MapView>
		)
	}
}
