# Model to track bulk user import operations from CSV/Excel files
# Manages import status, progress tracking, and file attachments
class UserImport < ApplicationRecord
  belongs_to :user
  has_one_attached :file

  # Valid import statuses throughout the import lifecycle
  STATUSES = %w[pending processing completed failed].freeze

  # Allow skipping file validation (e.g., when file will be downloaded later)
  attr_accessor :skip_file_validation

  validates :status, inclusion: { in: STATUSES }

  validate :file_presence, unless: :skip_file_validation
  validate :file_content_type

  # Updates the progress counter for the import operation
  def update_progress(processed, total = nil)
    update(
      progress: processed,
      total_rows: total || total_rows
    )
  end

  # Transitions import to processing status
  def mark_as_processing
    update(status: "processing")
  end

  # Marks import as successfully completed
  def mark_as_completed
    update(status: "completed", progress: total_rows)
  end

  # Marks import as failed and stores error message
  def mark_as_failed(error)
    update(status: "failed", error_message: error.message)
  end

  # Calculates completion percentage
  def percentage
    return 0 if total_rows.zero?
    (progress.to_f / total_rows * 100).round
  end

  private

  # Validates that a file is attached to the import
  def file_presence
    errors.add(:file, "must be attached") unless file.attached?
  end

  # Validates that the attached file is CSV or Excel format
  def file_content_type
    return unless file.attached?

    unless file.content_type.in?(%w[text/csv application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet])
      errors.add(:file, "must be a CSV or Excel file")
    end
  end
end
