# should we build and release to the nightly channel?
def should_nightly?
	github_scheduled? || travis_cron? || circle_nightly?
end

# was this build triggered by a schedule event on GH?
def github_scheduled?
	ENV['GITHUB_EVENT_NAME'] == 'schedule'
end

# was this build initiated by cron?
def travis_cron?
	ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end

# are we running under the circleci nightly workflow?
def circle_nightly?
	ENV['IS_NIGHTLY'] == '1'
end

# should we build and release to the beta channel?
def should_beta?
	tagged? || commit_says_deploy?
end

# does the build have the api keys needed for signing?
def api_keys_available?
	ENV['MATCH_PASSWORD'] && !ENV['MATCH_PASSWORD'].empty? &&
		ENV['FASTLANE_PASSWORD'] && !ENV['FASTLANE_PASSWORD'].empty? &&
		ENV['GITHUB_KEYS_REPOSITORY_TOKEN'] && !ENV['GITHUB_KEYS_REPOSITORY_TOKEN'].empty?
end

# is the build happening for a platform where we also run a simulator build?
def simulator_also?
	lane_context[:PLATFORM_NAME] == :ios
end

# is this a build of a tagged commit?
def tagged?
	travis = ENV['TRAVIS_TAG'] && !ENV['TRAVIS_TAG'].empty?
	circle = ENV['CIRCLE_TAG'] && !ENV['CIRCLE_TAG'].empty?
	github = ENV['GITHUB_REF'] && ENV['GITHUB_REF'] =~ /^refs\/tags\//
	github || travis || circle
end

# does the commit message tell us to make a new beta?
def commit_says_deploy?
	commit = ENV['TRAVIS_COMMIT_MESSAGE'] || ENV['GIT_COMMIT_DESC'] || `git show --pretty=format:%B HEAD`
	commit =~ /\[ci run beta\]/
end

# are we running on github actions?
def github_actions?
	!!ENV['GITHUB_SHA']
end

# are we running on travis?
def travis?
	ENV['TRAVIS'] == 'true'
end

# are we running on circle?
def circle?
	ENV['CIRCLECI'] == 'true'
end
