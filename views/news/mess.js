// @flow
import React from 'react'
import NewsContainer from './news-container'
import type { NewsItemPropsType } from './types'

export default function MessengerNewsView(props: NewsItemPropsType) {
  return <NewsContainer {...props} />
}
