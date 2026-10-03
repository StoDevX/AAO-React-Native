// Sentry's Xcode build phase scripts run SENTRY_CLI_EXECUTABLE through node,
// because they expect npm's @sentry/cli, whose bin/sentry-cli is a JavaScript
// wrapper. That package is dropped in pnpm-workspace.yaml and the CLI comes
// from mise instead, as a native binary node cannot run. So this stands in for
// the wrapper: ios/.xcode.env points SENTRY_CLI_EXECUTABLE here (see
// plugins/with-sentry-cli-executable.ts), ci_post_clone.sh points
// SENTRY_CLI_BINARY at mise's sentry-cli, and this runs it with the same
// arguments, environment and exit status.
const {spawnSync} = require('node:child_process')

const binary = process.env.SENTRY_CLI_BINARY
if (!binary) {
	console.error(
		'error: SENTRY_CLI_BINARY is not set; ci_post_clone.sh writes it to .xcode.env.local. For a Release build that uploads nothing to Sentry, set SENTRY_DISABLE_AUTO_UPLOAD=true.',
	)
	process.exit(1)
}

const result = spawnSync(binary, process.argv.slice(2), {stdio: 'inherit'})
if (result.error) {
	console.error(`error: could not run ${binary}: ${result.error.message}`)
	process.exit(1)
}

// A null status means a signal ended it, which is a failure too.
process.exit(result.status ?? 1)
