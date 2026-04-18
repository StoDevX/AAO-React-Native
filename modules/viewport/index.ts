import type React from 'react'
import {ScaledSize, useWindowDimensions} from 'react-native'

type Props = {
	render: (dimensions: ScaledSize) => React.ReactNode
}

export let Viewport = (props: Props): React.ReactNode => {
	let viewport = useWindowDimensions()
	return props.render(viewport)
}
