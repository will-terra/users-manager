# Background job that processes bulk user imports from CSV/Excel files
# Handles file parsing, user creation, and real-time progress updates via ActionCable
class UserImportJob < ApplicationJob
  queue_as :default

  # Main entry point - processes the import file and creates users
  def perform(user_import_id)
    user_import = UserImport.find(user_import_id)
    user_import.mark_as_processing

    file = user_import.file.download
    extension = File.extname(user_import.file.filename.to_s)

    case extension.downcase
    when ".csv"
      process_csv(file, user_import)
    when ".xlsx", ".xls"
      process_excel(file, user_import)
    else
      user_import.mark_as_failed(StandardError.new("Unsupported file type: #{extension}"))
    end
  rescue => e
    user_import.mark_as_failed(e)
  end

  private

  # Processes CSV files and creates users from each row
  def process_csv(file, user_import)
    require "csv"
    rows = CSV.parse(file, headers: true)
    user_import.update(total_rows: rows.size)

    rows.each_with_index do |row, index|
      create_user_from_row(row)
      user_import.update_progress(index + 1)

      if (index + 1) % 10 == 0 || (index + 1) == rows.size
        broadcast_progress(user_import)
      end
    end

    user_import.mark_as_completed
    broadcast_progress(user_import)
  end

  # Processes Excel files (.xlsx, .xls) and creates users from each row
  def process_excel(file, user_import)
    require "roo"
    spreadsheet = Roo::Spreadsheet.open(StringIO.new(file))
    sheet = spreadsheet.sheet(0)
    rows = sheet.parse(headers: true)
    user_import.update(total_rows: rows.size)

    rows.each_with_index do |row, index|
      create_user_from_row(row)
      user_import.update_progress(index + 1)

      if (index + 1) % 10 == 0 || (index + 1) == rows.size
        broadcast_progress(user_import)
      end
    end

    user_import.mark_as_completed
    broadcast_progress(user_import)
  end

  # Creates a User record from a spreadsheet row with flexible column mapping
  def create_user_from_row(row)
    user_attributes = {
      full_name: row["full_name"] || row["name"] || row["Full Name"],
      email: row["email"] || row["Email"],
      role: row["role"] || row["Role"] || "user"
    }

    password = row["password"] || SecureRandom.hex(8)

    user = User.new(user_attributes.merge(
      password: password,
      password_confirmation: password
    ))

    if row["avatar_url"].present?
      user.avatar_url = row["avatar_url"]
    end

    user.save!
  end

  # Broadcasts import progress to connected clients via ActionCable
  def broadcast_progress(user_import)
    ActionCable.server.broadcast(
      "import_#{user_import.id}",
      {
        type: "progress_update",
        data: {
          id: user_import.id,
          status: user_import.status,
          progress: user_import.progress,
          total_rows: user_import.total_rows,
          percentage: user_import.percentage,
          error_message: user_import.error_message
        }
      }
    )
  end
end
