#!/usr/bin/env node

'use strict';

const GITHUB_API = 'https://api.github.com/'
const REPO = 'StoDevX/AAO-React-Native'

const fetch = require('node-fetch')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const checkContext = (context) => {
	if(!context) throw new Error("No context given, failing.")
	return context
}

const checkStatus = (status) => {
	if(!status) throw new Error("No status passed, failing.")

	switch(status) {
		case 'pending':
		case 'failure':
		case 'success':
		case 'error':
			return status
			break
		default:
			throw new Error(`Invalid status value '${status}'`)
	}
}

// e.g. "js:lint" "pending" "Running `yarn run lint`... stand by." "https://travis.org"

function getSha() {
	return new Promise((resolve) => {
		if(process.env['TRAVIS_COMMIT']) resolve(process.env['TRAVIS_COMMIT'])

		exec('git rev-parse HEAD').then(({stdout, stderr}) => {
			resolve(stdout.trim())
		})
	})
}

async function publishReport() {
	let jobContext = undefined
	let jobStatus = undefined

	try {
		jobStatus = checkStatus(process.argv[3])
		jobContext = checkContext(process.argv[2])
	} catch(error) {
		throw error
		process.exit(1)
	}

	const jobDescription = process.argv[4]
	const jobTargetURL = process.env['TRAVIS_JOB_ID'] ? `https://travis-ci.org/${REPO}/jobs/${process.env['TRAVIS_JOB_ID']}` : 'https://xn--b48h.com'

	let parameters = {
		'state': jobStatus,
		'target_url': jobTargetURL,
		'description': jobDescription,
		'context': jobContext
	}

	let body = JSON.stringify(parameters)

	let headers = {
		'Accept': 'application/vnd.github.v3+json,application/vnd.github.jean-grey-preview+json',
		'Authorization': `token ${process.env['DANGER_GITHUB_API_TOKEN']}`
	}

	let options = {
		method: 'POST',
		headers: headers,
		body: body
	}

	getSha().then((sha) => {
		let url = `${GITHUB_API}repos/${REPO}/statuses/${sha}`
		console.log(`Poking ${url} with parameters ${JSON.stringify(parameters)}`)
		fetch(url, options)
					 .then(response => response.json())
					 .then((slug) => {
						 console.log(slug);
					 });

		// POST /repos/:owner/:repo/statuses/:sha
	})
}

Promise.all([publishReport()])
