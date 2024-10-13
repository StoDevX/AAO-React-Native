import {ScaledSize, useWindowDimensions} from 'react-native'

interface Props {
	render: (dimensions: ScaledSize) => React.JSX.Element
}

export let Viewport = (props: Props): React.JSX.Element => {
	let viewport = useWindowDimensions()
	return props.render(viewport)
}
