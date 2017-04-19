before_all do
  # too lazy to change the name in travis, so we jut copy it here
  ENV['FL_HOCKEY_API_TOKEN'] = ENV['HOCKEY_TOKEN'] if ENV.key?('HOCKEY_TOKEN')
  ENV['FL_HOCKEY_COMMIT_SHA'] = ENV['TRAVIS_COMMIT'] if ENV.key?('TRAVIS_COMMIT')
end
