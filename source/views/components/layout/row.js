// @flow
import * as React from 'react'
import {StyledComponent} from './styled-component'
import type {PropsType} from './styled-component'

export const Row = ({children, ...props}: PropsType) => {
  return (
    <StyledComponent flexDirection="row" {...props}>
      {children}
    </StyledComponent>
  )
}
