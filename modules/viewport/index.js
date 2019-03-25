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
	let [window, setWindow] = React.useState(Dimensions.get('window'))

	React.useEffect(() => {
		function handleResizeEvent(event: {window: WindowDimensions}) {
			setWindow(event.window)
		}

		Dimensions.addEventListener('change', handleResizeEvent)

		return () => Dimensions.removeEventListener('change', handleResizeEvent)
	})

	return window
}
