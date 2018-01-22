// @flow

export type CourseType = {
  clbid: long,
  credits: float,
  crsid: long,
  departments: string[],
  instructors: string[],
  level: int,
  name: string,
  pn: boolean,
  prerequisites: boolean,
  semester: int,
  status: string,
  term: long,
  type: string,
  year: long,
  description?: string[],
  gereqs?: string[],
  locations?: string[],
  notes?: string[],
  section?: string,
}
