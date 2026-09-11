import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import {Stack} from 'expo-router'
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
		//
		// No navigation here, on purpose -- match `Campus/detail/report.tsx`'s own
		// report screen. `usePreventRemove`'s guard arms off committed React
		// state, not off however far this callback has run: it registers the
		// route from an effect keyed on its own argument, and its `beforeRemove`
		// listener reads the value the last render captured. `markSubmitted()`
		// writes to zustand synchronously, but neither of those sees the new
		// value until React has re-rendered this tree -- while a stack action
		// like `popToTop()` runs its `beforeRemove` check inside the dispatch,
		// well before that. So the guard would still be armed and would block
		// the very pop this call just triggered, throwing up a "Discard changes?"
		// alert over a report that already sent. Staying put also keeps the
		// draft alive if the reader cancels out of the Mail compose sheet rather
		// than sending -- `edit.tsx`'s cleanup only drops it when that screen
		// itself unmounts.
		//
		// `submitReport` dumps YAML and hands off to Mail without a try of its
		// own, and this callback is the press handler of a native toolbar
		// button, with no error boundary anywhere above it -- an escaping throw
		// would be a red box in debug and silence in release, over a preview
		// that still looks exactly like a report that sent, with Submit ready
		// to be pressed again. So say so, and leave `submitted` alone: the
		// draft survives and the guard stays armed over a report that never
		// went out.
		try {
			submitReport(normalizeDraft(startDraft(original)), normalizeDraft(draft))
		} catch {
			Alert.alert(
				'Could not send the report',
				'Something went wrong preparing the email. Your edit is still here — try again.',
			)
			return
		}

		markSubmitted()
	}, [draft, markSubmitted, original])

	if (!diff) {
		return <NoticeView text="There is nothing to preview." />
	}

	return (
		<>
			<Stack.Title>Preview</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button accessibilityLabel="Submit Report" onPress={submit}>
					Submit
				</Stack.Toolbar.Button>
			</Stack.Toolbar>
			<Host style={styles.host}>
				<EntryDiff diff={diff} />
			</Host>
		</>
	)
}
