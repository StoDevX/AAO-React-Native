source "https://rubygems.org"

gem "fastlane"
gem "hockeyapp"
gem "json"
gem "xcodeproj"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval(File.read(plugins_path), binding) if File.exist?(plugins_path)
