// @flow
import * as React from 'react'
import {NoticeView} from '@frogpond/notice'

type Props = {
	mode: 'bug' | 'normal',
}

export class ListEmpty extends React.PureComponent<Props> {
	render() {
		return <NoticeView text="List is empty" />
	}
}
