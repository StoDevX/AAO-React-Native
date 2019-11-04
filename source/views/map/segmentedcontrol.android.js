// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {Button} from 'react-native-paper'

type Props = {
	onValueChange: string => any,
	selectedIndex: number,
	values: Array<string>,
}

export class SegmentedControl extends React.Component<Props> {
	_handleIndexChange = index =>
		this.props.onValueChange(this.props.values[index])

	render() {
		return (
			<View style={styles.buttonContainer}>
				{this.props.values.map((val, i) => {
					let selected = i === this.props.selectedIndex
					let onPress = () => this._handleIndexChange(i)
					return (
						<Button
							key={val}
							compact={true}
							onPress={onPress}
							primary={selected}
							raised={true}
							style={styles.button}
						>
							{val}
						</Button>
					)
				})}
			</View>
		)
	}
}

const styles = StyleSheet.create({
	buttonContainer: {
		flexDirection: 'row',
	},
	button: {
		flexGrow: 1,
	},
})
