import * as React from 'react'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Constants} from './constants'
import {DateSection} from './types'
import {selectShowChangeFiltersMessage, useFilterStore} from './store'

type Props = {
	selectedSection: DateSection
}

export function EmptyListNotice({selectedSection}: Props): React.ReactNode {
	const showChangeFiltersMessage = useFilterStore(
		selectShowChangeFiltersMessage,
	)

	let message: string
	switch (selectedSection) {
		case Constants.YESTERDAY:
		case Constants.TODAY:
			message = `No games ${selectedSection.toLowerCase()}`
			break
		case Constants.UPCOMING:
			message = `No ${selectedSection.toLowerCase()} games`
			break
		default:
			return null
	}

	if (showChangeFiltersMessage) {
		message = `${message}. Try changing the filters?`
	}

	return <NoticeView style={{backgroundColor: c.transparent}} text={message} />
}
