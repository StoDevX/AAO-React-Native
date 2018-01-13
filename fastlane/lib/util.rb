# coding: utf-8

def should_deploy?
  cron? || tagged? || forced_deploy?
end

def cron?
  ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end

def tagged?
  ENV['TRAVIS_TAG'] && !ENV['TRAVIS_TAG'].empty?
end

def forced_deploy?
  ENV['TRAVIS_COMMIT_MESSAGE'] =~ /\[ci run beta\]/
end

def pr?
  # todo: figure out how to handle forked-pr/non-forked, or if we even want to
  # ENV['TRAVIS_PULL_REQUEST'] != 'false' || ENV['CIRCLE_PR_NUMBER']
  ENV['TRAVIS_PULL_REQUEST'] != 'false' || false
end

def travis?
  ENV['TRAVIS'] == 'true'
end

def circle?
  ENV['CIRCLECI'] == 'true'
end
