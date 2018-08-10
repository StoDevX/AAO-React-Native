//@flow
import * as React from 'react'
import {StyleSheet, View, TouchableOpacity} from 'react-native'
import Popover from 'react-native-popover-view'
import {FilterSection} from './section'
import type {FilterType} from './types'
import {Touchable, type TouchableUnion} from '../touchable'
import * as c from '../colors'

type Props = {
	anchor: ?React.Ref<TouchableUnion>,
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
				onClose={() => onClosePopover(filter)}
				placement="bottom"
				popoverStyle={popoverContainer}
			>
				<FilterSection filter={filter} onChange={this.onFilterChanged} />
			</Popover>
		)
	}
}

const popoverContainer = {
	minWidth: 200,
	maxWidth: 300,
}

const arrowStyle = {backgroundColor: c.iosLightBackground}
