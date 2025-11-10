ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../config/environment', __dir__)

# Prevent database modifications when running tests against production
abort("The Rails environment is running in production mode!") if Rails.env.production?

require 'rspec/rails'
require 'shoulda/matchers'
require 'pundit/matchers'

# Configure shoulda-matchers to use RSpec and Rails
Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories. (If you create support files later.)
Dir[Rails.root.join('spec', 'support', '**', '*.rb')].each { |f| require f }

require 'factory_bot_rails' if defined?(FactoryBot)

RSpec.configure do |config|
  # Include FactoryBot syntax methods
  config.include FactoryBot::Syntax::Methods if defined?(FactoryBot)
  config.include Pundit::Matchers if defined?(Pundit::Matchers)

  # Use transactional fixtures
  config.use_transactional_fixtures = true

  # If you're not using ActiveRecord, uncomment this line
  # config.use_active_record = false

  # Clean up and initialize database before running test suite
  config.before(:suite) do
    if defined?(ActiveRecord::Migration)
      ActiveRecord::Migration.maintain_test_schema!
    end
  end

  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
end

require_relative 'spec_helper'
