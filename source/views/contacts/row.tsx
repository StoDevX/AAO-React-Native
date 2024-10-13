import * as React from 'react'
import type {ContactType} from './types'
import {ListRow, Detail, Title} from '@frogpond/lists'
import {Column, Row} from '@frogpond/layout'

interface Props {
	onPress: (contact: ContactType) => void
	contact: ContactType
}

export const ContactRow = (props: Props): React.JSX.Element => {
	let {contact, onPress} = props

	let _onPress = () => { onPress(contact); }

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
