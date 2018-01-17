// @flow
import * as React from 'react'
import * as c from '../../../components/colors'
import {View, StyleSheet, Platform} from 'react-native'
import type {BusStopStatusEnum} from '../lib'

const isAndroid = Platform.OS === 'android'

const styles = StyleSheet.create({
	barContainer: {
		paddingRight: 5,
		width: 45,
		flexDirection: 'column',
		alignItems: 'center',
	},
	bar: {
		flex: 1,
		width: 5,
	},
	dot: {
		height: 15,
		width: 15,
		marginVertical: -10,
		borderRadius: 20,
		zIndex: 1,
	},
	skippingStop: {
		backgroundColor: c.transparent,
		borderColor: c.transparent,
	},
	passedStop: {
		height: 12,
		width: 12,
	},
	beforeStop: {
		borderWidth: 3,
		backgroundColor: c.white,
		height: 18,
		width: 18,
	},
	atStop: {
		height: 20,
		width: 20,
		borderColor: c.white,
		borderWidth: 3,
		backgroundColor: c.white,
	},
})

type Props = {|
	+barColor: string,
	+currentStopColor: string,
	+isFirstChunk: boolean,
	+isLastChunk: boolean,
	+stopStatus: BusStopStatusEnum,
|}

export class ProgressChunk extends React.PureComponent<Props, void> {
	render() {
		const {
			stopStatus,
			barColor,
			currentStopColor,
			isFirstChunk,
			isLastChunk,
		} = this.props

		// To draw the bar, we draw a chunk of the bar, then we draw the dot, then
		// we draw the last chunk of the bar.
		const startBarColor = isAndroid && isFirstChunk ? c.transparent : barColor
		const endBarColor = isAndroid && isLastChunk ? c.transparent : barColor

		return (
			<View style={styles.barContainer}>
				<View style={[styles.bar, {backgroundColor: startBarColor}]} />
				<View
					style={[
						styles.dot,
						stopStatus === 'after' && [
							styles.passedStop,
							{borderColor: barColor, backgroundColor: barColor},
						],
						stopStatus === 'before' && [
							styles.beforeStop,
							{borderColor: barColor},
						],
						stopStatus === 'at' && [
							styles.atStop,
							{borderColor: currentStopColor},
						],
						stopStatus === 'skip' && styles.skippingStop,
					]}
				/>
				<View style={[styles.bar, {backgroundColor: endBarColor}]} />
			</View>
		)
	}
}
