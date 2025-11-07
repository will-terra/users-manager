class TestJob < ApplicationJob
  queue_as :default

  def perform(message)
    puts "=== TEST JOB EXECUTED ==="
    puts "Message: #{message}"
    puts "Timestamp: #{Time.current}"
    puts "Job ID: #{job_id}"
    puts "=== END TEST JOB ==="
  end
end