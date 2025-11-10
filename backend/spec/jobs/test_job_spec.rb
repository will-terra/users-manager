require 'rails_helper'

RSpec.describe TestJob, type: :job do
  it 'executes without error' do
    expect { described_class.perform_now('hello') }.not_to raise_error
  end
end
