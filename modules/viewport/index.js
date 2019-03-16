// @flow

import * as React from 'react'
import {Dimensions} from 'react-native'

type WindowDimensions = {width: number, height: number}

type Props = {
	render: WindowDimensions => React.Node,
}

type State = {
	viewport: WindowDimensions,
}

export class Viewport extends React.PureComponent<Props, State> {
	state = {
		viewport: Dimensions.get('window'),
	}

	componentDidMount() {
		Dimensions.addEventListener('change', this.handleResizeEvent)
	}

	componentWillUnmount() {
		Dimensions.removeEventListener('change', this.handleResizeEvent)
	}

	handleResizeEvent = (event: {window: WindowDimensions}) => {
		this.setState(() => ({viewport: event.window}))
	}

	render() {
		return this.props.render(this.state.viewport)
	}
}

export function useViewport() {
	let initial = Dimensions.get('window')

	const [width, setWidth] = React.useState(initial.width)
	const [height, setHeight] = React.useState(initial.height)

	let onChange = ({window}) => {
		setWidth(window.width)
		setHeight(window.height)
	}

	React.useEffect(() => {
		Dimensions.addEventListener('change', onChange)

		return () => Dimensions.removeEventListener('change', onChange)
	}, [])

	return {width, height}
}
