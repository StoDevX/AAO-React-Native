// @flow
import {Navigator} from 'react-native'

export type StudentOrgType = {
  name: string,
  categories: string,
  regularMeetingTime: string,
  regularMeetingLocation: string,
  contactName: string,
  description: string,
  photoUri: string,
};

export type StudentOrgPropsType = {
  navigator: typeof Navigator,
  route: Object,
  url: string,
};
