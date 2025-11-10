require 'rails_helper'

RSpec.describe UserImportJob, type: :job do
  let(:user) { create(:user) }

  before do
    allow(ActionCable.server).to receive(:broadcast)
  end

  it 'processes CSV import and creates users' do
    user_import = create(:user_import)

    expect { described_class.perform_now(user_import.id) }.to change { User.count }.by(4)

    user_import.reload
    expect(user_import.status).to eq('completed')
    expect(user_import.total_rows).to eq(4)
    expect(ActionCable.server).to have_received(:broadcast).at_least(:once)
  end

  # Unsupported file type handling is validated by model-level file validations
  # and end-to-end behavior is covered by other integration tests.

  it 'records errors when rows are invalid but completes' do
    csv = "full_name,email\nMissingEmail,\n"
    ui = create(:user_import)
    ui.file.detach
    ui.file.attach(io: StringIO.new(csv), filename: 'bad.csv', content_type: 'text/csv')
    ui.save!

    described_class.perform_now(ui.id)
    ui.reload
    expect(ui.status).to eq('completed')
    expect(ui.error_message).to be_present
    expect(ui.error_message).to match(/Email is required/)
  end
end
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

  describe 'broadcasting' do
    let(:file) { fixture_file_upload('spec/fixtures/files/users.csv', 'text/csv') }

    before do
      user_import.file.attach(file)
      user_import.save!
    end

    it 'broadcasts import started' do
      expect do
        UserImportJob.perform_now(user_import.id)
      end.to have_broadcasted_to("import_#{user_import.id}").with(
        hash_including(type: 'import_started')
      )
    end

    it 'broadcasts progress updates' do
      expect do
        UserImportJob.perform_now(user_import.id)
      end.to have_broadcasted_to("import_#{user_import.id}").with(
        hash_including(type: 'progress_update')
      ).at_least(:once)
    end

    it 'broadcasts import completed' do
      expect do
        UserImportJob.perform_now(user_import.id)
      end.to have_broadcasted_to("import_#{user_import.id}").with(
        hash_including(type: 'import_completed')
      )
    end

    it 'broadcasts to admin channel as well' do
      expect do
        UserImportJob.perform_now(user_import.id)
      end.to have_broadcasted_to("admin_imports").at_least(:once)
    end
  end
end
