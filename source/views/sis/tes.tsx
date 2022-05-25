import * as React from 'react'
import {openUrl} from '@frogpond/open-url'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

export const TESView = (): JSX.Element => (
	<NoticeView
		buttonText="Open TES"
		header="Time Entry System"
		icon="compass"
		iconColor={c.blue}
		onPress={() => openUrl('https://www.stolaf.edu/apps/tes/')}
		text="The St. Olaf Time Entry System (TES) is the place to report your work hours, for both students and hourly staff."
	/>
)
