import * as React from 'react'

import {Column, Row} from '@frogpond/layout'
import {Detail, ListRow, Title} from '@frogpond/lists'

import type {ContactType} from './types'

type Props = {
	onPress: (contact: ContactType) => void
	contact: ContactType
}

export const ContactRow = (props: Props): JSX.Element => {
	let {contact, onPress} = props

	let _onPress = () => onPress(contact)

	return (
		<ListRow arrowPosition="top" onPress={_onPress}>
			<Row alignItems="center">
				<Column flex={1}>
					<Title lines={1}>{contact.title}</Title>
					<Detail lines={1}>{contact.synopsis}</Detail>
				</Column>
			</Row>
		</ListRow>
	)
}
