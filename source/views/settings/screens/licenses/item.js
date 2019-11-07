// @flow
import React, {Component} from 'react'
import {Image, StyleSheet} from 'react-native'
import {Detail, Title, ListRow} from '@frogpond/lists'
import {Column, Row} from '@frogpond/layout'
import {type LicenseType} from './types'
import {type NavigationScreenProp} from 'react-navigation'

type Props = {
	item: LicenseType,
	navigation: NavigationScreenProp<*>,
}

export class LicenseItem extends Component<Props> {
	render() {
		const {
			key,
			image,
			username,
			licenses,
			name,
			version,
			licenseText,
		} = this.props.item

		let displayUsername = ''
		if (username && key.toLowerCase() !== username.toLowerCase()) {
			displayUsername = `published by ${username}`
		}

		return (
			<ListRow
				arrowPosition="center"
				onPress={() =>
					this.props.navigation.navigate('LicenseDetailView', licenseText)
				}
			>
				<Row alignItems="center">
					{image.length ? (
						<Image
							accessibilityIgnoresInvertColors={true}
							source={{uri: image}}
							style={styles.image}
						/>
					) : null}
					<Column flex={1}>
						<Title lines={2}>{name}</Title>
						<Detail lines={1}>{displayUsername}</Detail>
						<Detail lines={1}>
							{licenses}・{`v${version}`}
						</Detail>
					</Column>
				</Row>
			</ListRow>
		)
	}
}

const styles = StyleSheet.create({
	image: {
		borderRadius: 5,
		marginRight: 15,
		height: 70,
		width: 70,
		aspectRatio: 1,
	},
})
