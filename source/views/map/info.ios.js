// @flow

import * as React from 'react'
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	ScrollView,
	TouchableHighlight,
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
import {ListRow, Title} from '@frogpond/lists'
import {openUrl} from '@frogpond/open-url'
import {Touchable} from '@frogpond/touchable'

type Props = {
	feature: Feature<Building>,
	onClose: () => any,
	overlaySize: 'min' | 'mid' | 'max',
	navigation: any,
}

export class BuildingInfo extends React.Component<Props> {
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
						<PlaceTitle>
							{building.name}
							{building.nickname ? (
								<PlaceNickname> ({building.nickname})</PlaceNickname>
							) : null}
						</PlaceTitle>
						<PlaceSubtitle>{category}</PlaceSubtitle>
					</Column>
					<CloseButton onPress={this.onClose} />
				</Row>

				<ScrollView
					contentContainerStyle={styles.container}
					contentInsetAdjustmentBehavior="automatic"
					scrollEnabled={this.props.overlaySize === 'max'}
					style={styles.scroll}
				>
					{photos.length ? (
						<Section paddingTop={0}>
							<ScrollView
								horizontal={true}
								scrollEnabled={this.props.overlaySize === 'max'}
							>
								{photos.map(href => (
									<Image key={href} source={{uri: href}} style={styles.photo} />
								))}
							</ScrollView>
						</Section>
					) : null}

					{building.address ? (
						<Section>
							<Row alignItems="center">
								<Column flex={1}>
									<SectionTitle>Address</SectionTitle>
									<SectionContent>{building.address}</SectionContent>
								</Column>
								<CopyText
									render={({copied, copy}) => (
										<OutlineButton
											disabled={copied}
											onPress={() => building.address && copy(building.address)}
											title={copied ? 'Copied' : 'Copy'}
										/>
									)}
								/>
							</Row>
						</Section>
					) : null}

					{building.description ? (
						<Section>
							<SectionTitle>Description</SectionTitle>
							<SectionSelectableContent>
								{building.description}
							</SectionSelectableContent>
						</Section>
					) : null}

					{departments.length ? (
						<Section>
							<SectionListTitle>Departments</SectionListTitle>
							<View>
								{departments.map(d => (
									<SectionListItem
										key={d.label}
										href={d.href}
										label={d.label}
									/>
								))}
							</View>
						</Section>
					) : null}

					{offices.length ? (
						<Section>
							<SectionListTitle>Offices</SectionListTitle>
							<View>
								{offices.map(d => (
									<SectionListItem
										key={d.label}
										href={d.href}
										label={d.label}
									/>
								))}
							</View>
						</Section>
					) : null}

					{coordinates ? (
						<Section>
							<Row alignItems="center">
								<Column flex={1}>
									<SectionTitle>Coordinates</SectionTitle>
									<SectionContent>{coordinates.join(', ')}</SectionContent>
								</Column>
								<CopyText
									render={({copied, copy}) => (
										<OutlineButton
											disabled={copied}
											onPress={() => copy((coordinates: any).join(', '))}
											title={copied ? 'Copied' : 'Copy'}
										/>
									)}
								/>
							</Row>
						</Section>
					) : null}

					<Section>
						<Row alignItems="center">
							<Column flex={1}>
								<SectionTitle>Found an issue?</SectionTitle>
								<SectionContent>Let us know!</SectionContent>
							</Column>
							<OutlineButton
								onPress={this.openReportScreen}
								title="Report an Issue"
							/>
						</Row>
					</Section>
				</ScrollView>
			</React.Fragment>
		)
	}
}

const PlaceTitle = glamorous.text({fontSize: 20, fontWeight: '700'})
const PlaceNickname = glamorous(PlaceTitle)({
	fontWeight: '400',
	color: c.iosDisabledText,
	marginLeft: 11,
})
const PlaceSubtitle = glamorous.text({fontSize: 16})

const Section = glamorous.view({
	paddingVertical: 12,
	borderBottomWidth: StyleSheet.hairlineWidth,
	borderBottomColor: c.black75Percent,
})
const SectionTitle = glamorous.text({fontWeight: '700'})
const SectionContent = glamorous.text()
const SectionSelectableContent = ({children}) => (
	<TextInput dataDetectorTypes="all" editable={false} multiline={true}>
		{children}
	</TextInput>
)

const SectionListTitle = glamorous(SectionTitle)({
	paddingBottom: 8,
})

const OutlineButton = (props: {
	title: string,
	onPress: () => any,
	disabled?: boolean,
}) => (
	<Touchable
		accessibilityTraits="button"
		disabled={props.disabled}
		onPress={props.onPress}
		style={[
			styles.outlineButton,
			props.disabled && styles.outlineButtonDisabled,
		]}
	>
		<Text
			style={[
				styles.outlineButtonText,
				props.disabled && styles.outlineButtonTextDisabled,
			]}
		>
			{props.title}
		</Text>
	</Touchable>
)

class CopyText extends React.Component<
	{render: ({copied: boolean, copy: string => any}) => React.Node},
	{copied: boolean},
> {
	state = {
		copied: false,
	}

	onCopy = (text: string) => {
		Clipboard.setString(text)
		this.setState(() => ({copied: true}))
	}

	render() {
		return this.props.render({copied: this.state.copied, copy: this.onCopy})
	}
}

const SectionListItem = ({href, label}) => {
	return (
		<ListRow
			contentContainerStyle={styles.listItem}
			onPress={() => openUrl(href)}
		>
			<Title style={styles.listItemText}>{label}</Title>
		</ListRow>
	)
}

const CloseButton = ({onPress}) => (
	<TouchableHighlight
		accessibilityTraits="button"
		onPress={onPress}
		style={styles.closeButton}
		underlayColor={c.black50Percent}
	>
		<Text style={styles.closeButtonText}>×</Text>
	</TouchableHighlight>
)

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 12,
	},
	scroll: {
		height: Dimensions.get('window').height - 66 - 66,
	},
	closeButton: {
		width: 24,
		height: 24,
		borderRadius: 24,
		backgroundColor: c.semitransparentGray,
		alignItems: 'center',
		justifyContent: 'center',
	},
	closeButtonText: {
		color: c.white,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: -2,
	},
	photo: {
		width: 265,
		height: 200,
	},
	listItem: {
		paddingLeft: 0,
	},
	listItemText: {
		fontSize: 15,
	},
	outlineButton: {
		borderWidth: 1,
		borderColor: c.infoBlue,
		paddingVertical: 4,
		paddingHorizontal: 6,
		borderRadius: 4,
		marginLeft: 4,
	},
	outlineButtonDisabled: {
		borderColor: c.iosDisabledText,
	},
	outlineButtonText: {
		fontWeight: 'bold',
		color: c.infoBlue,
	},
	outlineButtonTextDisabled: {
		color: c.iosDisabledText,
	},
})
