//@flow
import * as React from 'react'
import Popover from 'react-native-popover-view'
import {FilterSection} from './section'
import type {FilterType} from './types'
import * as c from '@frogpond/colors'

type Props = {
	anchor: React.Ref<*>,
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

	onFilterChanged = (filter: FilterType) => {
		this.setState(() => ({filter: filter}))
	}

	render() {
		const {filter} = this.state
		const {anchor, onClosePopover, visible} = this.props

		if (typeof anchor !== 'object') {
			throw new Error('FilterPopover only supports createRef refs')
		}

		return (
			<Popover
				fromView={anchor.current}
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
	backgroundColor: c.sectionBgColor,
}
