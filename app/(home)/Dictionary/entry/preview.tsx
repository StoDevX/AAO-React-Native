import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import {Stack, useNavigation} from 'expo-router'
import type {NativeStackNavigationProp} from 'expo-router'
import {NoticeView} from '@frogpond/notice'

import {EntryDiff} from '../../../../source/features/dictionary/entry-diff'
import {diffEntry} from '../../../../source/features/dictionary/lib/diff'
import {normalizeDraft, startDraft} from '../../../../source/features/dictionary/lib/draft'
import {submitReport} from '../../../../source/features/dictionary/report/submit'
import {useDictionaryDraftStore} from '../../../../source/features/dictionary/store'

const styles = StyleSheet.create({
	host: {flex: 1},
})

export default function DictionaryPreviewPage(): React.ReactNode {
	// The default `NavigationProp` covers only the actions every navigator
	// shares -- `popToTop` is specific to a stack, which is what this sheet's
	// own `_layout.tsx` sets up.
	let navigation = useNavigation<NativeStackNavigationProp<ReactNavigation.RootParamList>>()
	let {original, draft, markSubmitted} = useDictionaryDraftStore()

	// Both sides go through `startDraft`, which numbers a given entry the same
	// way every time -- so the diff can match senses by id rather than guess.
	let diff = React.useMemo(
		() => (original && draft ? diffEntry(startDraft(original), draft) : null),
		[original, draft],
	)

	let submit = React.useCallback(() => {
		if (!original || !draft) {
			return
		}

		// Both sides through `normalizeDraft`, so the emailed before/after differs
		// only where the reader actually edited -- not in how the two were built.
		markSubmitted()
		submitReport(normalizeDraft(startDraft(original)), normalizeDraft(draft))
		navigation.popToTop()
	}, [draft, markSubmitted, navigation, original])

	if (!diff) {
		return <NoticeView text="There is nothing to preview." />
	}

	return (
		<>
			<Stack.Title>Preview</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Submit Report"
					icon="paperplane.fill"
					onPress={submit}
				/>
			</Stack.Toolbar>
			<Host style={styles.host}>
				<EntryDiff diff={diff} />
			</Host>
		</>
	)
}
