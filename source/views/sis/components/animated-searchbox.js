// @flow

import * as React from 'react'

import {StyleSheet, Animated} from 'react-native'
import * as c from '../../components/colors'
import {SearchBar} from '../../components/searchbar'
import {Viewport} from '../../components/viewport'

type Props = {
	value: string,
	active: boolean,
	placeholder?: string,
	onSubmit?: () => mixed,
	onFocus?: () => mixed,
	onCancel?: () => mixed,
	onChange?: string => mixed,
	title?: string,
}

export class AnimatedSearchbox extends React.Component<Props> {
	componentDidUpdate(prevProps: Props) {
		if (this.props.active !== prevProps.active) {
			if (this.props.active) {
				this.activateSearch()
			} else {
				this.deactivateSearch()
			}
		}
	}

	headerOpacitySpec = {start: 1, end: 0, duration: 200}
	searchBarTopSpec = {start: 71, end: 10, duration: 200}
	containerHeightSpec = {start: 125, end: 64, duration: 200}

	headerOpacity = new Animated.Value(this.headerOpacitySpec.start)
	searchBarTop = new Animated.Value(this.searchBarTopSpec.start)
	containerHeight = new Animated.Value(this.containerHeightSpec.start)

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

	activateSearch = () => {
		this.animate(this.headerOpacity, this.headerOpacitySpec, 'end')
		this.animate(this.searchBarTop, this.searchBarTopSpec, 'end')
		this.animate(this.containerHeight, this.containerHeightSpec, 'end')
	}

	deactivateSearch = () => {
		this.animate(this.headerOpacity, this.headerOpacitySpec, 'start')
		this.animate(this.searchBarTop, this.searchBarTopSpec, 'start')
		this.animate(this.containerHeight, this.containerHeightSpec, 'start')
	}

	handleFocus = () => {
		this.activateSearch()
		this.props.onFocus && this.props.onFocus()
	}

	handleCancel = () => {
		this.deactivateSearch()
		this.props.onCancel && this.props.onCancel()
	}

	render() {
		return (
			<Viewport
				render={viewport => {
					let searchBarWidth = viewport.width - 20

					let showTitle = Boolean(this.props.title)

					let containerStyle = [
						styles.searchContainer,
						styles.common,
						{
							height: showTitle
								? this.containerHeight
								: this.containerHeightSpec.end,
						},
					]

					let searchStyle = [
						styles.searchBarWrapper,
						{width: searchBarWidth},
						{top: showTitle ? this.searchBarTop : this.searchBarTopSpec.end},
					]

					let headerStyle = [
						styles.header,
						{
							opacity: showTitle
								? this.headerOpacity
								: this.headerOpacitySpec.end,
						},
					]

					return (
						<Animated.View style={containerStyle}>
							{showTitle ? (
								<Animated.Text style={headerStyle}>
									{this.props.title}
								</Animated.Text>
							) : null}

							<Animated.View style={searchStyle}>
								<SearchBar
									active={this.props.active}
									backButtonAndroid={false}
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
