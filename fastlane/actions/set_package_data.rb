require 'json'

module Fastlane
  module Actions
    class SetPackageDataAction < Action
      def self.run(params)
        data_to_write = params[:data]
        package_path = params[:package_path]

        file = File.read(package_path)
        data_hash = JSON.parse(file, symbolize_names: true)

        data_hash.update(data_to_write)

        pretty = JSON.pretty_generate(data_hash) + "\n"
        File.write(package_path, pretty)

        UI.success("#{package_path} has been updated with #{data_to_write}")

        data_hash
      end

      def self.description
        'Change data in your package.json file.'
      end

      def self.authors
        ['Hawken Rives']
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :data,
                                       description: 'The data to update',
                                       type: Hash),
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
