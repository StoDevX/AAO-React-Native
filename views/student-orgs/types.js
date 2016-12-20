// @flow
import {Navigator} from 'react-native'

export type StudentOrgAbridgedType = {
  name: string,
  categories: string[],
  newOrg: boolean,
}

export type StudentOrgInfoType = {
  name: string,
  categories: string[],
  regularMeetingTime: string,
  regularMeetingLocation: string,
  contactName: string,
  description: string,
}

export type StudentOrgPropsType = {
  navigator: typeof Navigator,
  route: Object,
  url: string,
}

export type StudentOrgDetailPropsType = {
  data: Object,
}
