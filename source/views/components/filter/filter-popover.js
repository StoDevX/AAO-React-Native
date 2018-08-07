//@flow
import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import Popover from 'react-native-popover-view'
import {FilterSection} from './section'
import type {FilterType} from './types'
import * as c from '../colors'

type Props = {
	anchor: any,
	filter: FilterType,
	onClosePopover: (filter: FilterType) => any,
	visible: boolean,
}

type State = {
	filter: FilterType,
}

export class FilterPopover extends React.PureComponent<Props, State> {
	state = {
		filter: this.props.filter,
	}

	static getDerivedStateFromProps(props: Props) {
		return {
			filter: props.filter,
		}
	}

	onFilterChanged = (filter: FilterType) => {
		this.setState(() => ({filter: filter}))
	}

	render() {
		const {filter} = this.state
		const {anchor, onClosePopover, visible} = this.props
		return (
			<Popover
        arrowStyle={arrowStyle}
				fromView={anchor}
				isVisible={visible}
				onClose={() => {
					onClosePopover(filter)
				}}
				placement="bottom"
			>
				<View style={styles.popoverContainer}>
					<FilterSection filter={filter} onChange={this.onFilterChanged} />
				</View>
			</Popover>
		)
	}
}

const styles = StyleSheet.create({
  arrow: {
    backgroundColor: c.iosLightBackground,
  },
	popoverContainer: {
		minWidth: 300,
	},
})

const arrowStyle = StyleSheet.flatten(styles.arrow)
