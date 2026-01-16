import React from 'react'
import {Image as RNImage, ImageProps, StyleSheet} from 'react-native'

const styles = StyleSheet.create({
	image: {},
})

export const Image = (props: ImageProps): React.JSX.Element => (
	<RNImage {...props} style={[styles.image, props.style]} />
)
