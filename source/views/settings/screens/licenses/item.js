// @flow
import React, {Component} from 'react'
import {Detail, Title, ListRow} from '@frogpond/lists'
import {Column} from '@frogpond/layout'
import {type LicenseType} from './types'
import {type NavigationScreenProp} from 'react-navigation'

type Props = {
	item: LicenseType,
	navigation: NavigationScreenProp<*>,
}

export class LicenseItem extends Component<Props> {
	render() {
		const {licenses, name, version, licenseText} = this.props.item

		return (
			<ListRow
				arrowPosition="center"
				onPress={() =>
					this.props.navigation.navigate('LicenseDetailView', licenseText)
				}
			>
				<Column flex={1}>
					<Title lines={2}>{name}</Title>
					<Detail lines={1}>
						{licenses}・{`v${version}`}
					</Detail>
				</Column>
			</ListRow>
		)
	}
}
