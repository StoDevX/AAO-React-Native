// @flow

import * as React from 'react'
import {NoticeView} from './notice'

type Props = {
	retry?: () => Promise<*>,
}

export function NoDataView({retry}: Props) {
	let noticeProps = {
		header: 'No data',
		spinner: false,
		text: "We didn't get any data.",
	}

	if (retry) {
		return (
			<NoticeView buttonText="Try again?" onPress={retry} {...noticeProps} />
		)
	}

	return <NoticeView {...noticeProps} />
}
