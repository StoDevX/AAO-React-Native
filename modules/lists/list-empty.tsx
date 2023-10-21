import * as React from 'react'

import {NoticeView} from '@frogpond/notice'

type Props = {
	mode: 'bug' | 'normal'
}

export const emptyList: ReadonlyArray<never> = []

export function ListEmpty(_props: Props): JSX.Element {
	return <NoticeView text="List is empty" />
}
