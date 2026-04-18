import * as React from 'react'
import {NoticeView} from './notice'

export function LoadingView({
	text = 'Loading…',
}: {
	text?: string
}): React.ReactNode {
	return <NoticeView spinner={true} text={text} />
}
