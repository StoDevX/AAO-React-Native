import React from 'react'
import {Text, StyleSheet, TextProps} from 'react-native'

const styles = StyleSheet.create({
	code: {},
	codeBlock: {},
})

export const Code = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.code, props.style]} />
)

export const CodeBlock = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.codeBlock, props.style]} />
)
