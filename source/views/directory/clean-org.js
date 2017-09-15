// @flow
import type {StudentOrgType} from './types'
import {fastGetTrimmedText} from '../../lib/html'

export default function cleanOrg(org: StudentOrgType): StudentOrgType {
  const name = org.name.trim()

  const advisors = org.advisors
    .map(c => ({
      ...c,
      name: c.name.trim(),
    }))
    .filter(c => c.name.length)

  const contacts = org.contacts.map(c => ({
    ...c,
    title: c.title.trim(),
    firstName: c.firstName.trim(),
    lastName: c.lastName.trim(),
  }))

  const category = org.category.trim()
  const meetings = org.meetings.trim()
  const description = fastGetTrimmedText(org.description)
  let website = org.website.trim()
  if (website && !/^https?:\/\//.test(website)) {
    website = `http://${website}`
  }

  return {
    ...org,
    name,
    advisors,
    contacts,
    category,
    meetings,
    description,
    website,
  }
}
