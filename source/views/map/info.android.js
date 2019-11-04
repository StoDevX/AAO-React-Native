// @flow

import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	Image,
	Clipboard,
	Dimensions,
} from 'react-native'
import glamorous from 'glamorous-native'
import * as c from '@frogpond/colors'
import type {Building, Feature} from './types'
import {parseLinkString} from './types'
import startCase from 'lodash/startCase'
import {Row, Column} from '@frogpond/layout'
import {openUrl} from '@frogpond/open-url'
import {Touchable} from '@frogpond/touchable'
import {
	ListItem,
	ListSection,
	Snackbar,
	Headline,
	Paragraph,
	Subheading,
} from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialIcons'

type Props = {
	feature: Feature<Building>,
	onClose: () => any,
	overlaySize: 'min' | 'mid' | 'max',
	navigation: any,
}

type State = {
	snackbarMessage: string,
	showSnackbar: boolean,
}

export class BuildingInfo extends React.Component<Props, State> {
	state = {
		showSnackbar: false,
		snackbarMessage: '',
	}

	onClose = () => {
		this.props.onClose()
	}

	openReportScreen = () => {
		this.props.navigation.push('MapReporterView', {
			building: this.props.feature.properties,
		})
	}

	makeBuildingCategory = (building: Building) => {
		let blacklist = ['hall', 'house', 'building']
		return building.categories
			.filter(name => !blacklist.includes(name))
			.map(name => startCase(name))
			.join(' • ')
	}

	copy = (toCopy: string, message: string) => {
		Clipboard.setString(toCopy)
		this.setState(() => ({showSnackbar: true, snackbarMessage: message}))
	}

	render() {
		let feature = this.props.feature
		let building = feature.properties
		let category = this.makeBuildingCategory(building)
		let photos = (building.photos || []).map(
			href => `https://carls-app.github.io/map-data/cache/img/${href}`,
		)

		let departments = building.departments.map(parseLinkString)
		let offices = building.offices.map(parseLinkString)

		let coordinates =
			feature.geometry.geometries.find(geo => geo.type === 'Point') || null
		coordinates = coordinates ? coordinates.coordinates : null

		return (
			<React.Fragment>
				<Row
					alignItems="center"
					justifyContent="space-between"
					marginBottom={12}
					style={styles.container}
				>
					<Column>
						<Headline>
							{building.name}
							{building.nickname ? (
								<PlaceNickname> ({building.nickname})</PlaceNickname>
							) : null}
						</Headline>
						<Subheading>{category}</Subheading>
					</Column>
					<CloseButton onPress={this.onClose} />
				</Row>

				<ScrollView
					contentInsetAdjustmentBehavior="automatic"
					scrollEnabled={this.props.overlaySize === 'max'}
					style={styles.scroll}
				>
					{photos.length ? (
						<ScrollView
							contentContainerStyle={styles.container}
							horizontal={true}
							scrollEnabled={this.props.overlaySize === 'max'}
						>
							{photos.map(href => (
								<Image key={href} source={{uri: href}} style={styles.photo} />
							))}
						</ScrollView>
					) : null}

					{building.address || coordinates ? (
						<ListSection title="Location">
							{building.address ? (
								<ListItem
									description={building.address}
									icon="place"
									onPress={() =>
										this.copy((building.address: any), 'Address copied.')
									}
									title="Address"
								/>
							) : null}
							{coordinates ? (
								<ListItem
									description={coordinates.join(', ')}
									icon="directions"
									onPress={() =>
										this.copy(
											(coordinates: any).join(', '),
											'Coordinates copied.',
										)
									}
									title="Coordinates"
								/>
							) : null}
						</ListSection>
					) : null}

					{building.description ? (
						<ListSection title="Description">
							<Paragraph style={styles.container}>
								{building.description}
							</Paragraph>
						</ListSection>
					) : null}

					{departments.length ? (
						<ListSection title="Departments">
							{departments.map(d => (
								<ListItem
									key={d.label}
									icon="local-library"
									onPress={() => openUrl(d.href)}
									title={d.label}
								/>
							))}
						</ListSection>
					) : null}

					{offices.length ? (
						<ListSection title="Offices">
							{offices.map(d => (
								<ListItem
									key={d.label}
									icon="store-mall-directory"
									onPress={() => openUrl(d.href)}
									title={d.label}
								/>
							))}
						</ListSection>
					) : null}

					<ListSection title="Help">
						<ListItem
							description="Let us know!"
							icon="help"
							onPress={this.openReportScreen}
							title="Found an issue?"
						/>
					</ListSection>

					<Snackbar
						onDismiss={() => this.setState(() => ({showSnackbar: false}))}
						visible={this.state.showSnackbar}
					>
						{this.state.snackbarMessage}
					</Snackbar>
				</ScrollView>
			</React.Fragment>
		)
	}
}

const PlaceNickname = glamorous(Headline)({
	color: c.iosDisabledText,
	marginLeft: 11,
})

const CloseButton = ({onPress}) => (
	<Touchable
		accessibilityTraits="button"
		onPress={onPress}
		style={styles.closeButton}
	>
		<Icon name="expand-more" size={24} />
	</Touchable>
)

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
	},
	scroll: {
		height: Dimensions.get('window').height - 66 - 46,
	},
	closeButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 36,
		height: 36,
	},
	photo: {
		width: 265,
		height: 200,
	},
})
