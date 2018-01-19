# coding: utf-8

# should we build and release to the nightly channel?
def should_nightly?
  cron?
end

# should we build and release to the beta channel?
def should_beta?
  tagged? || commit_says_deploy?
end

# does the build have the api keys needed for signing?
def has_api_keys?
  ENV['MATCH_PASSWORD'] && ENV['FASTLANE_PASSWORD']
end

# was this build initiated by cron?
def cron?
  ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end

# is this a build of a tagged commit?
def tagged?
  travis = ENV['TRAVIS_TAG'] && !ENV['TRAVIS_TAG'].empty?
  circle = ENV['CIRCLE_TAG'] && !ENV['CIRCLE_TAG'].empty?
  travis || circle
end

# does the commit message tell us to make a new beta?
def commit_says_deploy?
  commit = ENV['TRAVIS_COMMIT_MESSAGE'] || ENV['GIT_COMMIT_DESC']
  commit =~ /\[ci run beta\]/
end

# are we running on travis?
def travis?
  ENV['TRAVIS'] == 'true'
end

# are we running on circle?
def circle?
  ENV['CIRCLECI'] == 'true'
end
