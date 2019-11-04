// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {fetch} from '@frogpond/fetch'
import * as c from '@frogpond/colors'
import type {TopLevelViewPropsType} from '../types'
import type {Building, FeatureCollection, Feature} from './types'
import {MAP_DATA_URL, MAPBOX_CARLETON_STYLE} from './urls'
import {BuildingPicker} from './picker'
import {BuildingInfo} from './info'
import {Overlay} from './overlay'
import Mapbox from '@mapbox/react-native-mapbox-gl'
import {MAPBOX_API_KEY} from '../../lib/constants'
import pointInPolygon from '@turf/boolean-point-in-polygon'

Mapbox.setAccessToken(MAPBOX_API_KEY)

type MapboxEvent = {
	geometry: {
		coordinates: [number, number],
		type: string,
	},
	properties: {
		screenPointY: number,
		screenPointX: number,
	},
	type: string,
}

type Props = TopLevelViewPropsType

type State = {|
	features: Array<Feature<Building>>,
	visibleMarkers: Array<string>,
	selectedBuilding: ?Feature<Building>,
	overlaySize: 'min' | 'mid' | 'max',
	category: string,
|}

const originalCenterpoint = [-93.15488752015, 44.460800862266]

export class MapView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'Campus Map',
		headerBackTitle: 'Map',
	}

	state = {
		features: [],
		visibleMarkers: [],
		selectedBuilding: null,
		overlaySize: 'mid',
		category: 'Buildings',
	}

	componentDidMount() {
		this.fetchData()
	}

	_map: ?Mapbox.MapView = null

	fetchData = async () => {
		const data: FeatureCollection<Building> = await fetch(MAP_DATA_URL).json()

		this.setState(() => ({
			features: data.features,
			visibleMarkers: [],
		}))
	}

	buildingToMarker = (f: Feature<Building>) => {
		let point = f.geometry.geometries.find(geo => geo.type === 'Point')
		if (!point) {
			return
		}

		return (
			<Mapbox.PointAnnotation
				key={f.id}
				coordinate={point.coordinates}
				id={f.id}
			>
				<View style={styles.annotationContainer}>
					<View style={styles.annotationFill} />
				</View>
			</Mapbox.PointAnnotation>
		)
	}

	handlePress = (ev: MapboxEvent) => {
		const coords = ev.geometry.coordinates
		const featurePoint = this.lookupBuildingByCoordinates(coords)

		if (!featurePoint || !featurePoint.id) {
			return
		}

		this.highlightBuildingById(featurePoint.id)
	}

	lookupBuildingByCoordinates = ([lng, lat]: [number, number]) => {
		const searchPoint = {
			type: 'Feature',
			geometry: {type: 'Point', coordinates: [lng, lat]},
		}

		return this.state.features.find(feat => {
			let poly = feat.geometry.geometries.find(geo => geo.type === 'Polygon')
			if (!poly) {
				return false
			}
			return pointInPolygon(searchPoint, poly)
		})
	}

	onTouchOutline = (id: string) => {
		this.highlightBuildingById(id)
		this.setOverlayMid()
	}

	highlightBuildingById = (id: string) => {
		const match = this.state.features.find(b => b.id === id)
		if (!match) {
			return
		}

		let point = match.geometry.geometries.find(geo => geo.type === 'Point')
		if (!point) {
			return
		}

		this.setState(
			() => ({
				visibleMarkers: [id],
				selectedBuilding: match,
			}),
			() => {
				if (!this._map || !point) {
					return
				}

				let coordinates: [number, number] = (point.coordinates: any)

				const latitude =
					this.state.overlaySize === 'min'
						? // case 1: overlay is collapsed; center in viewport
						  coordinates[1]
						: // case 2: overlay is open; center above overlay
						  coordinates[1] - 0.0005

				this._map.setCamera({
					centerCoordinate: [coordinates[0], latitude],
					zoom: 17,
				})
			},
		)
	}

	onPickerSelect = (id: string) => {
		this.highlightBuildingById(id)
		this.setOverlayMid()
	}
	onPickerFocus = () => this.setOverlayMax()
	onPickerCancel = () => this.setOverlayMid()

	onInfoOverlayClose = () => {
		this.setState(() => ({
			selectedBuilding: null,
			visibleMarkers: [],
		}))
		this.setOverlayMid()
	}

	setOverlayMax = () => this.setState(() => ({overlaySize: 'max'}))
	setOverlayMid = () => this.setState(() => ({overlaySize: 'mid'}))
	setOverlayMin = () => this.setState(() => ({overlaySize: 'min'}))

	onOverlaySizeChange = (size: 'min' | 'mid' | 'max') => {
		this.setState(() => ({overlaySize: size}))
	}

	handleCategoryChange = (name: string) => {
		this.setState(() => ({category: name}))
	}

	render() {
		let features = this.state.features
		return (
			<View style={StyleSheet.absoluteFill}>
				<Mapbox.MapView
					ref={ref => (this._map = ref)}
					centerCoordinate={originalCenterpoint}
					logoEnabled={false}
					onPress={this.handlePress}
					showUserLocation={true}
					style={styles.map}
					styleURL={MAPBOX_CARLETON_STYLE}
					zoomLevel={15}
				>
					{features
						.filter(f => this.state.visibleMarkers.includes(f.id))
						.map(this.buildingToMarker)}
				</Mapbox.MapView>

				<Overlay
					onSizeChange={this.onOverlaySizeChange}
					size={this.state.overlaySize}
				>
					{this.state.selectedBuilding ? (
						<BuildingInfo
							feature={this.state.selectedBuilding}
							navigation={this.props.navigation}
							onClose={this.onInfoOverlayClose}
							overlaySize={this.state.overlaySize}
						/>
					) : (
						<BuildingPicker
							category={this.state.category}
							features={features}
							onCancel={this.onPickerCancel}
							onCategoryChange={this.handleCategoryChange}
							onFocus={this.onPickerFocus}
							onSelect={this.onPickerSelect}
							overlaySize={this.state.overlaySize}
						/>
					)}
				</Overlay>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject,
	},
	annotationContainer: {
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: c.white,
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
