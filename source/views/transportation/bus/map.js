// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import type moment from 'moment'
import type {UnprocessedBusLine} from './types'
import MapView from '@mapbox/react-native-mapbox-gl'
import {NoticeView} from '@frogpond/notice'
import {getScheduleForNow, processBusLine} from './lib'
import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'
import {Timer} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'

const styles = StyleSheet.create({
	map: {...StyleSheet.absoluteFillObject},
})

type WrapperProps = {|
	navigation: {
		state: {
			params: {
				line: UnprocessedBusLine,
			},
		},
	},
|}

export function BusMap(props: WrapperProps) {
	let lineToDisplay = props.navigation.state.params.line

	return (
		<Timer
			interval={60000}
			moment={true}
			render={({now}) => <Map line={lineToDisplay} now={now} />}
			timezone={timezone()}
		/>
	)
}

type Props = {|
	line: UnprocessedBusLine,
	now: moment,
|}

type State = {|
	region: {
		latitude: number,
		latitudeDelta: number,
		longitude: number,
		longitudeDelta: number,
	},
|}

class Map extends React.Component<Props, State> {
	static navigationOptions = (args: {
		navigation: {state: {params: {line: UnprocessedBusLine}}},
	}) => ({
		title: `${args.navigation.state.params.line.line} Map`,
	})

	state = {
		region: {
			latitude: 44.44946671480875,
			latitudeDelta: 0.06175530810822494,
			longitude: -93.17014753996669,
			longitudeDelta: 0.05493163793703104,
		},
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

	render() {
		let lineToDisplay = this.props.line
		let now = this.props.now

		let processedLine = processBusLine(lineToDisplay, now)
		let scheduleForToday = getScheduleForNow(processedLine.schedules, now)

		if (!scheduleForToday) {
			let notice = `No schedule was found for today, ${now.format('dddd')}`
			return <NoticeView text={notice} />
		}

		let entriesWithCoordinates = scheduleForToday.timetable.filter(
			entry => entry.coordinates,
		)

		if (!entriesWithCoordinates.length) {
			let today = now.format('dddd')
			let msg = `No coordinates have been provided for today's (${today}) schedule on the "${lineToDisplay.line}" line`
			return <NoticeView text={msg} />
		}

		let markers = uniqBy(entriesWithCoordinates, ({name}) => name)

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
