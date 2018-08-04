// @flow

import * as React from 'react'

import {StyleSheet, Animated} from 'react-native'
import * as c from '../../components/colors'
import {SearchBar} from '../../components/searchbar'
import {Viewport} from '../../components/viewport'

type Props = {
	value: string,
	placeholder?: string,
	onSubmit?: () => mixed,
	onFocus?: () => mixed,
	onCancel?: () => mixed,
	onChange?: string => mixed,
	title?: string,
}

type State = {
	active: boolean,
}

export class AnimatedSearchbox extends React.Component<Props, State> {
	state = {
		active: false,
	}

	animations = {
		headerOpacity: {start: 1, end: 0, duration: 200},
		searchBarTop: {start: 71, end: 10, duration: 200},
		containerHeight: {start: 125, end: 64, duration: 200},
	}

	headerOpacity = new Animated.Value(this.animations.headerOpacity.start)
	searchBarTop = new Animated.Value(this.animations.searchBarTop.start)
	containerHeight = new Animated.Value(this.animations.containerHeight.start)

	onSearchButtonPress = () => {
		this.props.onSubmit && this.props.onSubmit()
	}

	animate = (
		thing: Animated.Value,
		args: {start: number, end: number, duration: number},
		toValue: 'start' | 'end',
	) => {
		Animated.timing(thing, {
			toValue: args[toValue],
			duration: args.duration,
		}).start()
	}

	handleFocus = () => {
		this.animate(this.headerOpacity, this.animations.headerOpacity, 'end')
		this.animate(this.searchBarTop, this.animations.searchBarTop, 'end')
		this.animate(this.containerHeight, this.animations.containerHeight, 'end')

		this.props.onFocus && this.props.onFocus()
	}

	handleCancel = () => {
		this.animate(this.headerOpacity, this.animations.headerOpacity, 'start')
		this.animate(this.searchBarTop, this.animations.searchBarTop, 'start')
		this.animate(this.containerHeight, this.animations.containerHeight, 'start')

		this.props.onCancel && this.props.onCancel()
	}

	render() {
		return (
			<Viewport
				render={viewport => {
					let searchBarWidth = viewport.width - 20

					let containerStyle = [
						styles.searchContainer,
						styles.common,
						{height: this.containerHeight},
					]

					let searchStyle = [
						styles.searchBarWrapper,
						{width: searchBarWidth},
						{top: this.searchBarTop},
					]

					let headerStyle = [styles.header, {opacity: this.headerOpacity}]

					return (
						<Animated.View style={containerStyle}>
							{this.props.title ? (
								<Animated.Text style={headerStyle}>
									{this.props.title}
								</Animated.Text>
							) : null}

							<Animated.View style={searchStyle}>
								<SearchBar
									active={this.state.active}
									onCancel={this.handleCancel}
									onChange={this.props.onChange}
									onFocus={this.handleFocus}
									onSubmit={this.props.onSubmit}
									placeholder={this.props.placeholder}
									textFieldBackgroundColor={c.sto.lightGray}
									value={this.props.value}
								/>
							</Animated.View>
						</Animated.View>
					)
				}}
			/>
		)
	}
}

let styles = StyleSheet.create({
	common: {
		backgroundColor: c.white,
	},
	searchContainer: {
		margin: 0,
	},
	searchBarWrapper: {
		position: 'absolute',
		left: 10,
	},
	header: {
		fontSize: 30,
		fontWeight: 'bold',
		padding: 22,
		paddingLeft: 17,
	},
})
