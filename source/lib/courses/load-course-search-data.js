/**
 * @flow
 * loadAllCourses is the entry point for loading courses from
 * the SIS.
 */

 export async function loadCourseSearchData() {
   resp = await fetchJson('https://stodevx.github.io/course-data/terms/20161.json')
   return resp
 }
