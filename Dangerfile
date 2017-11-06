case ENV['TASK']
when 'rubocop'
  rubocop.lint(report_danger: true)

when 'android', 'ios'
  if ENV['TRAVIS_TEST_RESULT'] == '1'
    contents = File.read('logs/fastlane')
    fail contents
  end

end
