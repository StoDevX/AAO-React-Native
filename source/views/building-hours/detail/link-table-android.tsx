/**
 * <LinkTable/> renders the table of building-related links.
 */

import * as React from 'react'
import {StyleSheet} from 'react-native'

import {openUrl} from '@frogpond/open-url'
import {Card} from '@frogpond/silly-card'
import {ButtonCell} from '@frogpond/tableview/cells'

import type {BuildingLinkType} from '../types'

type Props = {
	links: BuildingLinkType[]
}

export function LinkTable(props: Props): React.ReactElement {
	return (
		<Card header="Resources" style={styles.scheduleContainer}>
			{props.links.map((link, i) => (
				<ButtonCell
					key={i}
					onPress={() => openUrl(link.url.toString())}
					title={link.title}
				/>
			))}
		</Card>
	)
}

const styles = StyleSheet.create({
	scheduleContainer: {
		marginBottom: 20,
	},
})
