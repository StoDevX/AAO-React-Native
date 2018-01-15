// @flow
import * as React from 'react'
import {NoticeView} from './notice'

type Props = {
    text?: string,
    active?: boolean,
}

export default function LoadingView(props: Props) {
    const {text = 'Loading…', active = true} = props
    return <NoticeView spinner={true} spinnerActive={active} text={text} />
}
export {LoadingView}
