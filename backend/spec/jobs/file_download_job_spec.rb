require 'rails_helper'

RSpec.describe FileDownloadJob, type: :job do
  include ActiveJob::TestHelper

  let(:user_import) { create(:user_import) }

  it 'enqueues the job' do
    expect {
      FileDownloadJob.perform_later(user_import.id, 'https://example.com/file.csv')
    }.to have_enqueued_job(FileDownloadJob)
  end
end
