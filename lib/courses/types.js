// @flow

export type CourseType = {
  department: string[],
  number: number,
  section?: string,
  lab: boolean,
  name: string,
  credits: number,
  gradeOption: string,
  gereqs: string[],
  times?: string[],
  locations?: string[],
  instructors: string[],
  clbid: number,
  term: number,
};

export type CourseCollectionType =
  | {error: true, value: Error}
  | {error: false, value: CoursesByTermType};

export type CoursesByTermType = {[key: string]: CourseType[]};
