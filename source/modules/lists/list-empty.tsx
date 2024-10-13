import * as React from 'react'
import {NoticeView} from '../notice'

interface Props {
	mode: 'bug' | 'normal'
}

export const emptyList: readonly never[] = []

export function ListEmpty(_props: Props): React.JSX.Element {
	return <NoticeView text="List is empty" />
}
