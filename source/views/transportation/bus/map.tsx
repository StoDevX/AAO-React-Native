import * as React from 'react'
// import {StyleSheet} from 'react-native'
import {Text} from 'react-native'
import type {Moment} from 'moment'
import type {UnprocessedBusLine} from './types'
// import MapView from '@mapbox/react-native-mapbox-gl'
import {NoticeView} from '@frogpond/notice'
import {getScheduleForNow, processBusLine} from './lib'
// import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'
import {useMomentTimer} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'

// const styles = StyleSheet.create({
// 	map: {...StyleSheet.absoluteFillObject},
// })

export function BusMap(): JSX.Element {
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let route = useRoute<RouteProp<RootStackParamList, 'BusMapView'>>()
	let {line} = route.params

	return <Map line={line} now={now} />
}

type Props = {
	line: UnprocessedBusLine
	now: Moment
}

type State = {
	region: {
		latitude: number
		latitudeDelta: number
		longitude: number
		longitudeDelta: number
	}
}

class Map extends React.Component<Props, State> {
	static navigationOptions = (args: {
		navigation: {state: {params: {line: UnprocessedBusLine}}}
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
		latitude: number
		latitudeDelta: number
		longitude: number
		longitudeDelta: number
	}) => {
		this.setState((state) => {
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
			(entry) => entry.coordinates,
		)

		if (!entriesWithCoordinates.length) {
			let today = now.format('dddd')
			let msg = `No coordinates have been provided for today's (${today}) schedule on the "${lineToDisplay.line}" line`
			return <NoticeView text={msg} />
		}

		return <Text>Mapbox has been removed.</Text>

		/*
		let markers = uniqBy(entriesWithCoordinates, ({name}) => name)

		return (
			<Text>Mapbox has been removed.</Text>
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
		*/
	}
}
