require 'json'

module Fastlane
  module Actions
    class GetPackageKeyAction < Action
      def self.run(params)
        key = params[:key]
        package_path = params[:package_path]

        file = File.read(package_path)
        data_hash = JSON.parse(file, symbolize_names: true)

        data_hash[key.to_sym]
      end

      def self.description
        'Retrieve a value from your package.json file.'
      end

      def self.authors
        ['Hawken Rives']
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :key,
                                       description: 'The key to fetch',
                                       type: Symbol),
          FastlaneCore::ConfigItem.new(key: :package_path,
                                       description: 'The path to the package.json file',
                                       default_value: './package.json',
                                       type: String),
        ]
      end

      def self.is_supported?(_platform)
        true
      end
    end
  end
end
