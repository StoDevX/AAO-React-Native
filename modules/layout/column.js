// @flow
import * as React from 'react'
import {StyledComponent, type PropsType} from './styled-component'

export const Column = ({children, ...props}: PropsType) => {
	return (
		<StyledComponent flexDirection="column" {...props}>
			{children}
		</StyledComponent>
	)
}
