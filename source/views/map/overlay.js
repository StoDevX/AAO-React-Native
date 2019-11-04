// @flow

import * as React from 'react'
import {View, StyleSheet, Dimensions, Platform} from 'react-native'
import * as c from '@frogpond/colors'
import {GrabberBar} from './grabber'
import Interactable from 'react-native-interactable'
import {isIPhoneX} from './is-x'

type ViewState = 'min' | 'mid' | 'max'

type Props = {
	children: React.Node,
	style?: any,
	size: ViewState,
	onSizeChange: ViewState => any,
}

const screenHeight = Dimensions.get('window').height - 66

export class Overlay extends React.Component<Props> {
	componentDidUpdate(prevProps: Props) {
		if (prevProps.size !== this.props.size) {
			if (!this._view) {
				return
			}

			this._view.snapTo({index: this.positionsOrder.indexOf(this.props.size)})
		}
	}

	positionsOrder = ['max', 'mid', 'min']
	positions = {
		max: 0,
		mid: isIPhoneX ? screenHeight - 370 : screenHeight - 300,
		min: isIPhoneX
			? screenHeight - 129
			: Platform.OS === 'ios'
			? screenHeight - 67
			: screenHeight - 90,
	}

	lookupPosition = (size: ViewState) => this.positions[size]
	resizeMin = () => this.props.onSizeChange('min')
	resizeMid = () => this.props.onSizeChange('mid')
	resizeMax = () => this.props.onSizeChange('max')

	_view: any = null

	onSnap = (ev: {nativeEvent: {index: number, id: ViewState}}) => {
		this.props.onSizeChange(ev.nativeEvent.id)
	}

	render() {
		const {style: outerStyle, size: viewState} = this.props

		let style = [styles.overlay, outerStyle]

		return (
			<View pointerEvents="box-none" style={styles.panelContainer}>
				<Interactable.View
					ref={ref => (this._view = ref)}
					boundaries={{top: 0}}
					initialPosition={{y: this.positions[viewState]}}
					onSnap={this.onSnap}
					snapPoints={[
						{id: 'max', y: this.positions.max},
						{id: 'mid', y: this.positions.mid},
						{id: 'min', y: this.positions.min},
					]}
					verticalOnly={true}
				>
					<View style={style}>
						<GrabberBar />
						{this.props.children}
					</View>
				</Interactable.View>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	panelContainer: StyleSheet.absoluteFillObject,
	overlay: {
		backgroundColor: c.white,
		height: screenHeight,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		shadowColor: c.black,
		shadowOffset: {height: -4},
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
})
