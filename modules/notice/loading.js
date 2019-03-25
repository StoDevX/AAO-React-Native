// @flow
import * as React from 'react'
import {NoticeView} from './notice'

export function LoadingView({text = 'Loading…'}: {text?: string}) {
	return <NoticeView spinner={true} text={text} />
}
