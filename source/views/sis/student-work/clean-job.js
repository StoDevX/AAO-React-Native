// @flow
import type {JobType} from './types'

import getUrls from 'get-urls'
import {fastGetTrimmedText, removeHtmlWithRegex} from '../../../lib/html'

export function cleanJob(job: JobType): JobType {
  const title = fastGetTrimmedText(job.title)
  const office = fastGetTrimmedText(job.office)
  const type = fastGetTrimmedText(job.type)

  // these all need to retain their newlines
  const description = removeHtmlWithRegex(job.description).replace(/\t/g, ' ')
  const comments = removeHtmlWithRegex(job.comments).replace(/\t/g, ' ')
  const skills = removeHtmlWithRegex(job.skills).replace(/\t/g, ' ')

  const hoursPerWeek = job.hoursPerWeek.trim()
  const lastModified = job.lastModified.trim()
  const contactEmail = fixupEmailFormat(job.contactEmail.trim())

  const contactFirstName = job.contactFirstName.trim()
  const contactLastName = job.contactLastName.trim()

  return {
    ...job,
    title,
    description,
    office,
    type,
    comments,
    skills,
    hoursPerWeek,
    lastModified,
    contactEmail,
    contactFirstName,
    contactLastName,
  }
}

export function getContactName(job: JobType) {
  return `${job.contactFirstName} ${job.contactLastName}`
}

export function getLinksFromJob(job: JobType) {
  // Clean up returns, newlines, tabs, and misc symbols...
  // ...and search for application links in the text
  return [
    ...getUrls(job.description),
    ...getUrls(job.comments),
    ...getUrls(job.skills),
  ]
}

function fixupEmailFormat(email: string) {
  if (!/@/.test(email)) {
    // No @ in address ... e.g. smith
    return `${email}@stolaf.edu`
  } else if (/@$/.test(email)) {
    // @ at end ... e.g. smith@
    return `${email}stolaf.edu`
  } else {
    // Defined address ... e.g. smith@stolaf.edu
    return email
  }
}
