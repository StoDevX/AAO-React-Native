before_all do
  # too lazy to change the name in travis, so we jut copy it here
  ENV['FL_HOCKEY_API_TOKEN'] = ENV['HOCKEYAPP_TOKEN']
  ENV['FL_HOCKEY_COMMIT_SHA'] = ENV['TRAVIS_COMMIT']
end
