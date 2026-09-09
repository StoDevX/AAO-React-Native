import * as React from 'react'
import {StyleSheet} from 'react-native'
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
		// report screen. `usePreventRemove`'s guard arms off committed state, not
		// off however far this callback has run: `markSubmitted()`'s zustand write
		// is batched until this handler returns, but a stack action like
		// `popToTop()` fires its `beforeRemove` check synchronously, before the
		// batch flushes -- so the guard would still see `submitted: false` and
		// block the very pop this call just triggered, throwing up a "Discard
		// changes?" alert over a report that already sent. Staying put also keeps
		// the draft alive if the reader cancels out of the Mail compose sheet
		// rather than sending -- `edit.tsx`'s cleanup only drops it when that
		// screen itself unmounts.
		//
		// `markSubmitted()` runs only once the send itself has returned, so a
		// throw from `submitReport` leaves the guard armed rather than stranding
		// it down over a report that never actually went out.
		submitReport(normalizeDraft(startDraft(original)), normalizeDraft(draft))
		markSubmitted()
	}, [draft, markSubmitted, original])

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
