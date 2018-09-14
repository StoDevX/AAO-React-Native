// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import type moment from 'moment'
import type {UnprocessedBusLine} from './types'
import Mapbox from '@mapbox/react-native-mapbox-gl'
import {NoticeView} from '@frogpond/notice'
import {getScheduleForNow, processBusLine} from './lib'
import uniqBy from 'lodash/uniqBy'
import {Timer} from '@frogpond/timer'
import * as c from '@frogpond/colors'
import {MAPBOX_OLAF_STYLE} from './urls'

const MAPBOX_API_KEY = '' // set me
Mapbox.setAccessToken(MAPBOX_API_KEY)

const originalCenterpoint = [-93.17014753996669, 44.44946671480875]
const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
	map: {...StyleSheet.absoluteFillObject},
	annotationContainer: {
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: c.black,
		shadowOffset: {width: 0, height: 1},
		shadowColor: c.black,
		shadowOpacity: 0.2,
	},
	annotationFill: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: c.olevilleGold,
		transform: [{scale: 0.6}],
	},
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
	const lineToDisplay = props.navigation.state.params.line

	return (
		<Timer
			interval={60000}
			moment={true}
			render={({now}) => <Map line={lineToDisplay} now={now} />}
			timezone={TIMEZONE}
		/>
	)
}

type Props = {|
	line: UnprocessedBusLine,
	now: moment,
|}

class Map extends React.Component<Props, State> {
	static navigationOptions = (args: {
		navigation: {state: {params: {line: UnprocessedBusLine}}},
	}) => ({
		title: `${args.navigation.state.params.line.line} Map`,
	})

	_map: ?Mapbox.MapView = null

	render() {
		const lineToDisplay = this.props.line
		const now = this.props.now

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
			const msg = `No coordinates have been provided for today's (${today}) schedule on the "${
				lineToDisplay.line
			}" line`
			return <NoticeView text={msg} />
		}

		const markers = uniqBy(entriesWithCoordinates, ({name}) => name)

		return (
			<View style={StyleSheet.absoluteFill}>
				<Mapbox.MapView
					ref={ref => (this._map = ref)}
					centerCoordinate={originalCenterpoint}
					loadingEnabled={true}
					logoEnabled={false}
					showUserLocation={true}
					style={styles.map}
					styleURL={MAPBOX_OLAF_STYLE}
					zoomLevel={12}
				>
					{markers.map(({name, coordinates: [lat, lng] = []}, i) => (
						// we know from entriesWithCoordinates that all of these will have
						// coordinates; I just can't convince flow of that without a default value
						<Mapbox.PointAnnotation
							key={i}
							coordinate={[lng, lat]}
							id={name}
							// description={marker.description}
							// TODO: add "next arrival" time as the description
						>
							<View style={styles.annotationContainer}>
								<View style={styles.annotationFill} />
							</View>
						</Mapbox.PointAnnotation>
					))}
				</Mapbox.MapView>
			</View>
		)
	}
}
