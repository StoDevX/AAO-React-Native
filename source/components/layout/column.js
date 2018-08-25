// @flow
import * as React from 'react'
import {StyledComponent} from './styled-component'
import type {PropsType} from './styled-component'

export const Column = ({children, ...props}: PropsType) => {
	return (
		<StyledComponent flexDirection="column" {...props}>
			{children}
		</StyledComponent>
	)
}
