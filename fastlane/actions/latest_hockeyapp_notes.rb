module Fastlane
  module Actions
    class LatestHockeyappNotesAction < Action
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

        if app.nil?
          return {
            branch: params[:release_branch],
            commit_hash: nil,
            changelog: ''
          }
        end

        parsed = app.versions
                    .map { |version| parse_notes(version.notes) }
                    .reject(&:nil?)

        # First, try to find a previous set of notes from this branch
        data = parsed.find { |v| v[:branch] == params[:release_branch] }
        # If we can't find any, grab the most recent notes from `master`
        data = parsed.find { |v| v[:branch] == 'master' } unless data
        # If none of those exist either, grab the most recent notes
        data = parsed.first unless data

        UI.message "Last build branch: #{data[:branch]}"
        UI.message "Last build hash: #{data[:commit_hash]}"
        UI.message "Last changelog: #{data[:changelog]}"

        data
      end

      def self.parse_notes(notes)
        lines = notes.split("\n").reject(&:empty?)
        return nil unless lines.size > 3

        {
          branch: parse_html_line(lines[0]),
          commit_hash: parse_html_line(lines[1]),
          changelog: lines.drop(2).join("\n")
        }
      end

      def self.parse_html_line(line)
        # `line` looks like "<tag>key: value</tag>", where both parts of
        # <tag> may or may not exist.
        line.split(/: +/).last.split('<').first
      end

      def self.description
        'Easily fetch the most recent HockeyApp version for your app'
      end

      def self.details
        'Allows increment_build_number to increment from the latest HockeyApp version'
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
                                       description: 'The app name to fetch',
                                       optional: false,
                                       default_value: lane_context[:PRETTY_APP_NAME]),
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: 'FL_HOCKEY_API_TOKEN',
                                       description: 'API Token for Hockey access',
                                       optional: false),
          FastlaneCore::ConfigItem.new(key: :release_type,
                                       description: 'The release type to fetch: beta, store, alpha, enterprise',
                                       default_value: :beta,
                                       type: Symbol),
          FastlaneCore::ConfigItem.new(key: :release_branch,
                                       description: 'The branch to look for when fetching the notes (falls back to `master` or, failing that, to the latest build)',
                                       default_value: 'master'),
          FastlaneCore::ConfigItem.new(key: :platform,
                                       description: 'The platform to fetch: ios, android, macos, windows_phone, custom',
                                       type: Symbol,
                                       default_value: lane_context[:PLATFORM_NAME] || :ios)
        ]
      end

      def self.return_value
        'Parsed notes field for the most recent version of the specified app'
      end

      def self.authors
        ['Hawken Rives']
      end

      def self.is_supported?(platform)
        [:ios, :mac, :android].include? platform
      end
    end
  end
end
