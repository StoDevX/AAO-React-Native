import * as React from 'react'
import {useRouter} from 'expo-router'

import {DebugView} from './list'
import {getAtKeyPath} from './get-at-key-path'
import {useAppSelector} from '../../../../redux'

type Props = {
	keyPath: string[]
}

export const DebugKeyPathScreen = ({keyPath}: Props): React.ReactNode => {
	let router = useRouter()
	let reduxState = useAppSelector((state) => state)
	let slice = getAtKeyPath(reduxState, keyPath)

	let onDrillDown = (key: string | number) => {
		router.push({
			pathname: '/Debug/[...keyPath]',
			params: {keyPath: [...keyPath, String(key)]},
		})
	}

	return <DebugView onDrillDown={onDrillDown} state={slice} />
}
