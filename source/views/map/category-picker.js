// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {SegmentedControl} from './segmentedcontrol'

type Props = {
	categories: Array<string>,
	onChange: string => any,
	selected: string,
}

type State = {
	selectedIndex: number,
}

export class CategoryPicker extends React.Component<Props, State> {
	static getDerivedStateFromProps(nextProps: Props) {
		const index = nextProps.categories.indexOf(nextProps.selected)
		return {selectedIndex: index}
	}

	state = {
		selectedIndex: this.props.categories.indexOf(this.props.selected),
	}

	render() {
		return (
			<View style={styles.picker}>
				<SegmentedControl
					onValueChange={this.props.onChange}
					selectedIndex={this.state.selectedIndex}
					values={this.props.categories}
				/>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	picker: {
		margin: 12,
	},
})
