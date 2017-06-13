module Fastlane
  module Actions
    class GetGradleVersionNameAction < Action
      def self.run(params)
        gradle_path = params[:gradle_path]
        version_name = nil

        File.foreach(gradle_path) do |line|
          if line.include? 'versionName '
            components = line.strip.split(' ')
            version_name = components[1].tr('"', '')
          end
        end

        if version_name.nil?
          UI.user_error!("Could not find the version name in #{gradle_path}")
        else
          UI.success("Version name: #{version_name}")
        end

        version_name
      end

      def self.description
        'Get the version name of your android project.'
      end

      def self.authors
        ['Hawken Rives']
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :gradle_path,
                                       description: 'The path to the build.gradle file',
                                       type: String),
        ]
      end

      def self.is_supported?(platform)
        [:android].include?(platform)
      end
    end
  end
end
