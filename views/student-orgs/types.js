// @flow
import {Navigator} from 'react-native'

export type StudentOrgType = {
  author: string,
  categories: string[],
  content: string,
  contentSnippet: string,
  link: string,
  publishedDate: string,
  title: string,
};

export type StudentOrgPropsType = {
  navigator: typeof Navigator,
  route: Object,
  url: string,
};
