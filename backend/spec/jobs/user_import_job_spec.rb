require 'rails_helper'

RSpec.describe UserImportJob, type: :job do
  include ActiveJob::TestHelper

  let(:user_import) { create(:user_import) }

  it 'enqueues the job' do
    expect {
      UserImportJob.perform_later(user_import.id)
    }.to have_enqueued_job(UserImportJob)
  end

  it 'processes CSV file' do
    file = fixture_file_upload('spec/fixtures/files/users.csv', 'text/csv')
    user_import.file.attach(file)
    user_import.save!

    perform_enqueued_jobs do
      UserImportJob.perform_now(user_import.id)
    end

    user_import.reload
    expect(user_import.status).to eq('completed')
    expect(user_import.progress).to eq(user_import.total_rows)
  end

  it 'handles processing errors' do
    allow_any_instance_of(UserImportJob).to receive(:process_csv).and_raise(StandardError.new('Test error'))

    perform_enqueued_jobs do
      UserImportJob.perform_now(user_import.id)
    end

    user_import.reload
    expect(user_import.status).to eq('failed')
    expect(user_import.error_message).to eq('Test error')
  end
end
