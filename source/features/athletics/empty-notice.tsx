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

	let message: string
	switch (selectedSection) {
		case Constants.YESTERDAY:
		case Constants.TODAY:
			message = `No games ${selectedSection.toLowerCase()}`
			break
		case Constants.UPCOMING:
			message = `No ${selectedSection.toLowerCase()} games`
			break
		default: {
			const exhaustive: never = selectedSection
			throw new Error(`Unhandled section: ${String(exhaustive)}`)
		}
	}

	if (showChangeFiltersMessage) {
		message = `${message}. Try changing the filters?`
	}

	return <NoticeView style={styles.notice} text={message} />
}

const styles = StyleSheet.create({
	notice: {
		backgroundColor: c.transparent,
	},
})
