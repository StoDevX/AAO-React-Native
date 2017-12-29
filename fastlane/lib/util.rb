# coding: utf-8

def should_deploy?
  cron? ||
    !ENV['TRAVIS_TAG'].empty? ||
    ENV['TRAVIS_COMMIT_MESSAGE'] =~ /\[ci run beta\]/
end

def cron?
  ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end

def pr?
  ENV['TRAVIS_PULL_REQUEST'] != 'false'
end
