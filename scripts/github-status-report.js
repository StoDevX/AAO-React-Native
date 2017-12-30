#!/usr/bin/env node

'use strict'

const GITHUB_API = 'https://api.github.com'
const REPO = 'StoDevX/AAO-React-Native'

const fetch = require('node-fetch')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const GH_API_HEADERS = token => {
  return {
    Accept:
      'application/vnd.github.v3+json,application/vnd.github.jean-grey-preview+json',
    Authorization: `token ${token}`,
  }
}

const checkContext = context => {
  if (!context) throw new Error('No context given, failing.')
  return context
}

const checkStatus = status => {
  if (!status) throw new Error('No status passed, failing.')

  switch (status) {
    case 'pending':
    case 'failure':
    case 'success':
    case 'error':
      return status
    default:
      throw new Error(`Invalid status value '${status}'`)
  }
}

async function checkToken(token) {
  // this endpoint does not count against rate limit and has the added benefit of being a preflight check
  let url = `${GITHUB_API}/rate_limit`
  let options = {
    mecthod: 'GET',
    headers: GH_API_HEADERS(token),
  }

  let value = await fetch(url, options)
    .then(response => response.json())
    .then(response => {
      return response
    })

  return value
}

// e.g. "js:lint" "pending" "Running `yarn run lint`... stand by." "https://travis.org"

function getSha() {
  return new Promise(resolve => {
    if (process.env['TRAVIS_COMMIT']) resolve(process.env['TRAVIS_COMMIT'])

    exec('git rev-parse HEAD').then(({stdout, _}) => {
      resolve(stdout.trim())
    })
  })
}

const generateTargetUrlFromStatus = _ => {
  let jobOrBuildUrl = process.env['TRAVIS_JOB_ID']
    ? `https://travis-ci.org/${REPO}/jobs/${process.env['TRAVIS_JOB_ID']}`
    : process.env['TRAVIS_BUILD_ID']
      ? `https://travis-ci.org/${REPO}/jobs/${process.env['TRAVIS_BUILD_ID']}`
      : 'about:blank'
  return jobOrBuildUrl
}

async function publishReport() {
  let rateLimit = await checkToken(process.env['DANGER_GITHUB_API_TOKEN'])
  console.log(
    `Authentication successful.  Rate limit remaining: ${
      rateLimit.resources.core.remaining
    } of ${rateLimit.resources.core.limit}`,
  )

  let jobContext = undefined
  let jobStatus = undefined

  try {
    jobStatus = checkStatus(process.argv[3])
    jobContext = checkContext(process.argv[2])
  } catch (error) {
    console.log(error)
    process.exit(1)
  }

  const jobDescription = process.argv[4]
  const jobTargetURL = generateTargetUrlFromStatus(jobStatus)

  // prettier-ignore
  let parameters = {
    'state': jobStatus,
    'target_url': jobTargetURL,
    'description': jobDescription,
    'context': jobContext,
  }

  let body = JSON.stringify(parameters)

  let options = {
    method: 'POST',
    headers: GH_API_HEADERS(process.env['DANGER_GITHUB_API_TOKEN']),
    body: body,
  }

  getSha().then(sha => {
    let url = `${GITHUB_API}/repos/${REPO}/statuses/${sha}`
    fetch(url, options).then(response => {
      if (response.status >= 400) {
        response
          .json()
          .then(slug => {
            console.log(
              `Uh oh! Anomaly in accessing GitHub: got response ${
                response.status
              } ${response.statusText}\n${JSON.stringify(slug)}`,
            )
            throw new Error(
              `Anomalous response code from GitHub: ${response.status} ${
                response.statusText
              }`,
            )
          })
          .catch(error => {
            console.log(error)
            process.exit(1)
          })
      }

      return response
    })
  })
}

Promise.all([publishReport()]).catch(error => {
  console.log(error)
  process.exit(1)
})
