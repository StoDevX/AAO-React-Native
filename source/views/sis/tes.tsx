import * as React from 'react'
import {openUrl} from '@frogpond/open-url'
import {NoticeView} from '@frogpond/notice'

export const TESView = (): JSX.Element => (
	<NoticeView
		buttonText="Open TES"
		header="Time Entry System"
		onPress={() => openUrl('https://www.stolaf.edu/apps/tes/')}
		text="The St. Olaf Time Entry System (TES) is the place to report your work hours, for both students and hourly staff."
	/>
)
