import * as React from 'react'
import {StyleSheet} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Constants} from './constants'
import {DateSection} from './types'
import {selectShowChangeFiltersMessage, useFilterStore} from './store'

type Props = {
	selectedSection: DateSection
}

export function EmptyListNotice({selectedSection}: Props): React.ReactNode {
	const showChangeFiltersMessage = useFilterStore(selectShowChangeFiltersMessage)

	let title: string
	switch (selectedSection) {
		case Constants.YESTERDAY:
		case Constants.TODAY:
			title = `No Games ${selectedSection}`
			break
		case Constants.UPCOMING:
			title = `No ${selectedSection} Games`
			break
		default: {
			const exhaustive: never = selectedSection
			throw new Error(`Unhandled section: ${String(exhaustive)}`)
		}
	}

	return (
		<NoticeView
			description={showChangeFiltersMessage ? 'Try changing the filters.' : undefined}
			style={styles.notice}
			systemImage="sportscourt"
			title={title}
		/>
	)
}

const styles = StyleSheet.create({
	notice: {
		backgroundColor: c.transparent,
	},
})
