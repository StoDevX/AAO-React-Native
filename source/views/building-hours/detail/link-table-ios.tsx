/**
 * @flow
 *
 * <LinkTable/> renders the table of building-related links.
 */

import * as React from 'react'
import {TableView, Section} from 'react-native-tableview-simple'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {openUrl} from '@frogpond/open-url'
import type {BuildingLinkType} from '../types'

type Props = {
	links: BuildingLinkType[]
}

export function LinkTable(props: Props): React.ReactElement {
	return (
		<TableView>
			<Section header="RESOURCES">
				{props.links.map((link, i) => (
					<PushButtonCell
						key={i}
						onPress={() => openUrl(link.url.toString())}
						title={link.title}
					/>
				))}
			</Section>
		</TableView>
	)
}
