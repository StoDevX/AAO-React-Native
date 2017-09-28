module Fastlane
  module Actions
    class LatestHockeyappVersionNumberAction < Action
      def self.run(params)
        require 'hockeyapp'

        HockeyApp::Config.configure do |config|
          config.token = params[:api_token]
        end

        UI.message "Fetching metadata for #{params[:app_name]} from HockeyApp"
        app = HockeyApp.build_client.get_apps.find do |a|
          a.title == params[:app_name] &&
            a.platform == platforms[params[:platform]] &&
            a.release_type == release_types[params[:release_type]]
        end

        version = if app.nil?
                    1
                  else
                    app.versions.first.version.to_i
                  end

        UI.message "Found version #{version}"

        version
      end

      def self.description
        'Easily fetch the most recent HockeyApp version number for your app'
      end

      def self.details
        'Provides a way to have increment_build_number be based on the latest HockeyApp version'
      end

      def self.release_types
        {
          beta: 0,
          store: 1,
          alpha: 2,
          enterprise: 3
        }
      end

      def self.platforms
        {
          ios: 'iOS',
          android: 'Android',
          macos: 'Mac OS',
          windows_phone: 'Windows Phone',
          custom: 'Custom'
        }
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :app_name,
                                       description: 'The app name to use when fetching the version number',
                                       optional: false,
                                       default_value: lane_context[:PRETTY_APP_NAME]),
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: 'FL_HOCKEY_API_TOKEN',
                                       description: 'API Token for Hockey Access',
                                       optional: false),
          FastlaneCore::ConfigItem.new(key: :release_type,
                                       description: 'The release type to fetch: beta, store, alpha, enterprise',
                                       default_value: :beta,
                                       type: Symbol),
          FastlaneCore::ConfigItem.new(key: :platform,
                                       description: 'The platform to fetch: ios, android, macos, windows_phone, custom',
                                       default_value: lane_context[:PLATFORM_NAME] || :ios,
                                       type: Symbol)
        ]
      end

      def self.return_value
        'The most recent version number for the specified app'
      end

      def self.authors
        ['Travis Palmer', 'Hawken Rives']
      end

      def self.is_supported?(platform)
        [:ios, :mac, :android].include? platform
      end
    end
  end
end
