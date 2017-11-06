if ENV['TRAVIS_TEST_RESULT'] == '1'
    contents = File.read('logs/fastlane')
    fail contents
end
