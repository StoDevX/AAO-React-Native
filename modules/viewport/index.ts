import {ScaledSize, useWindowDimensions} from 'react-native'

type Props = {
	render: (dimensions: ScaledSize) => JSX.Element
}

export let Viewport = (props: Props): JSX.Element => {
	let viewport = useWindowDimensions()
	return props.render(viewport)
}
