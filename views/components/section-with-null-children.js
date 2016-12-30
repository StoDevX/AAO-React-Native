// @flow
import React from 'react'
import {Section} from 'react-native-tableview-simple'

export const SectionWithNullChildren = ({...props, children}: {children?: any}) => {
  return <Section {...props}>
    {React.Children.toArray(children).filter(x => x)}
  </Section>
}
