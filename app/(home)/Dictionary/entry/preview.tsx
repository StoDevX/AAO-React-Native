import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import {Stack} from 'expo-router'
import {NoticeView} from '@frogpond/notice'

import {EntryDiff} from '../../../../source/features/dictionary/entry-diff'
import {diffEntry} from '../../../../source/features/dictionary/lib/diff'
import {startDraft} from '../../../../source/features/dictionary/lib/draft'
import {useDictionaryDraftStore} from '../../../../source/features/dictionary/store'

const styles = StyleSheet.create({
	host: {flex: 1},
})

export default function DictionaryPreviewPage(): React.ReactNode {
	let {original, draft} = useDictionaryDraftStore()

	// Both sides go through `startDraft`, which numbers a given entry the same
	// way every time -- so the diff can match senses by id rather than guess.
	let diff = React.useMemo(
		() => (original && draft ? diffEntry(startDraft(original), draft) : null),
		[original, draft],
	)

	if (!diff) {
		return <NoticeView text="There is nothing to preview." />
	}

	return (
		<>
			<Stack.Title>Preview</Stack.Title>
			<Host style={styles.host}>
				<EntryDiff diff={diff} />
			</Host>
		</>
	)
}
