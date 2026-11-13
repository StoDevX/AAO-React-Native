import * as React from 'react'
import {NoticeView} from '@frogpond/notice'
import {uiCase} from '../../source/lib/ui-case'

type Props = {
	mode: 'bug' | 'normal'
}

export const emptyList: ReadonlyArray<never> = []

export function ListEmpty(_props: Props): React.ReactNode {
	return <NoticeView systemImage="tray" title={uiCase('Nothing Here')} />
}
