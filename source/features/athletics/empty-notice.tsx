import * as React from 'react'
import {StyleSheet} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {selectShowChangeFiltersMessage, useFilterStore} from './store'

/** Stands in for the list when the sport filter leaves no game to show. */
export function EmptyListNotice(): React.ReactNode {
	const showChangeFiltersMessage = useFilterStore(selectShowChangeFiltersMessage)

	return (
		<NoticeView
			description={showChangeFiltersMessage ? 'Try changing the filters.' : undefined}
			style={styles.notice}
			systemImage="sportscourt"
			title="No Games"
		/>
	)
}

const styles = StyleSheet.create({
	notice: {
		backgroundColor: c.transparent,
	},
})
