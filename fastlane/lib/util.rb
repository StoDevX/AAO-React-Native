# coding: utf-8

def should_deploy?
  cron? || tagged? || forced_deploy?
end

def cron?
  ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end

def tagged?
  travis = ENV['TRAVIS_TAG'] && !ENV['TRAVIS_TAG'].empty?
  circle = ENV['CIRCLE_TAG'] && !ENV['CIRCLE_TAG'].empty?
  travis || circle
end

def forced_deploy?
  commit = ENV['TRAVIS_COMMIT_MESSAGE'] || ENV['GIT_COMMIT_DESC']
  commit =~ /\[ci run beta\]/
end

def pr?
  travis = ENV['TRAVIS_PULL_REQUEST'] != 'false'
  circle = ENV['CIRCLE_PR_NUMBER'] && !ENV['CIRCLE_PR_NUMBER'].empty?
  travis || circle
end

def travis?
  ENV['TRAVIS'] == 'true'
end

def circle?
  ENV['CIRCLECI'] == 'true'
end
