source 'https://rubygems.org'

gem 'fastlane'
gem 'hockeyapp'
gem 'json'
gem 'xcodeproj'
gem 'danger'
gem 'danger-rubocop'
gem 'rubocop', '= 0.46', require: false

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval(File.read(plugins_path), binding) if File.exist?(plugins_path) # rubocop:disable Security/Eval
