import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {ActionRow} from '../../../../source/components/rows'
import {SyncedTextField} from '../../../../source/components/synced-text-field'
import {useBuildingReport} from '../../../../source/features/building-hours/report/context'
import {useDismissOnce} from '../../../../source/lib/use-dismiss-once'

/**
 * One of a venue's links: what it is called, and where it goes.
 *
 * The URL is taken as typed. Every report is read by a person before any data
 * changes, and that person can add a missing scheme -- refusing to submit over
 * one would strand a reporter on a half-height sheet.
 */
export default function BuildingLinkEditorPage(): React.ReactNode {
	let {linkIndex: linkIndexParam} = useLocalSearchParams<{linkIndex: string}>()
	let linkIndex = Number(linkIndexParam)

	let dismiss = useDismissOnce()
	let {draft, edit} = useBuildingReport()
	let link = draft?.links?.[linkIndex] ?? {title: '', url: ''}

	let editTitle = (title: string) => {
		edit({type: 'UPDATE_LINK', linkIndex, data: {title}})
	}

	let editUrl = (url: string) => {
		edit({type: 'UPDATE_LINK', linkIndex, data: {url}})
	}

	let deleteLink = () => {
		edit({type: 'DELETE_LINK', linkIndex})
		dismiss()
	}

	return (
		<>
			<Stack.Title>Edit Link</Stack.Title>

			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						<SyncedTextField
							autocapitalization="words"
							onChangeText={editTitle}
							placeholder="Title"
							value={link.title}
						/>
						<SyncedTextField
							autocapitalization="never"
							onChangeText={editUrl}
							placeholder="URL"
							value={link.url}
						/>
					</Section>

					<Section>
						<ActionRow destructive={true} onPress={deleteLink} title="Remove" />
					</Section>
				</List>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
