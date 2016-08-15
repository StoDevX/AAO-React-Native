// @flow
import {Navigator} from 'react-native'

export type StoryType = {
  author: string,
  categories: string[],
  content: string,
  contentSnippet: string,
  link: string,
  publishedDate: string,
  title: string,
};

export type NewsItemPropsType = {
  navigator: typeof Navigator,
  story: StoryType,
  title: string,
};
