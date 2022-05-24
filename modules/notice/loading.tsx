import * as React from 'react'
import {NoticeView} from './notice'

interface Props {
	text?: string
	icon?: string
}

export function LoadingView({
	text = 'Loading…',
	icon = '',
}: Props): JSX.Element {
	return <NoticeView icon={icon} spinner={true} text={text} />
}
