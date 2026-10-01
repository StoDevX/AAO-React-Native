import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@expo/ui/swift-ui'
import {Stack} from 'expo-router'
import {DetailRow, DisclosureRow} from '../../source/components/rows'
import {LibraryWrapper} from '../../source/features/settings/screens/overview/component-library/base/library-wrapper'

/**
 * `DisclosureRow` and `DetailRow` are themselves list rows, so wrapping each
 * one in `Example`'s title-plus-hosted-content layout would nest a row inside
 * a row. Plain `Section`s with descriptive titles read the way this app's own
 * screens do instead.
 */
const DisclosureRowExamples = (): React.ReactNode => (
	<Section title="DisclosureRow">
		<DisclosureRow
			destination="push"
			onPress={() => Alert.alert('Push', 'Pushes another screen in this navigation stack.')}
			title="Push — chevron.right"
		/>
		<DisclosureRow
			destination="action"
			onPress={() => Alert.alert('Action', 'The row is the thing, and tapping does it.')}
			title="Action — tinted title, no accessory"
		/>
		<DisclosureRow
			destination="external"
			onPress={() => Alert.alert('External', 'Points at a document somewhere else.')}
			title="External — arrow.up.right"
		/>
	</Section>
)

const DetailRowExamples = (): React.ReactNode => (
	<Section title="DetailRow">
		<DetailRow
			destination="push"
			label="Push"
			onPress={() => Alert.alert('Push', 'Pushes another screen in this navigation stack.')}
			value="chevron.right"
		/>
		<DetailRow
			destination="action"
			label="Action"
			onPress={() => Alert.alert('Action', 'The row is the thing, and tapping does it.')}
			value="tinted, no accessory"
		/>
		<DetailRow
			destination="external"
			label="External"
			onPress={() => Alert.alert('External', 'Points at a document somewhere else.')}
			value="arrow.up.right"
		/>
		<DetailRow label="No onPress" value="static, no accessory" />
	</Section>
)

export default function RowLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Rows</Stack.Title>
			<LibraryWrapper>
				<>
					<DisclosureRowExamples />
					<DetailRowExamples />
				</>
			</LibraryWrapper>
		</>
	)
}
