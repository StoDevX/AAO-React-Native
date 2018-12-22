// @flow

import * as React from 'react'
import {NoticeView} from './notice'

type Props = {
	error: string | Error,
	retry?: () => Promise<*>,
}

export function DataErrorView({error, retry}: Props) {
	let noticeProps = {
		header: 'Something went wrong',
		spinner: false,
		text: typeof error === 'string' ? error : error.message,
	}

	if (retry) {
		return (
			<NoticeView buttonText="Try again?" onPress={retry} {...noticeProps} />
		)
	}

	return <NoticeView {...noticeProps} />
}
