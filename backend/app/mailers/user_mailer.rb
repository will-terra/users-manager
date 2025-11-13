# Mailer for user-related notifications
class UserMailer < ApplicationMailer
  # Send welcome email with generated password to new users
  # @param user [User] The newly created user
  # @param password [String] The generated password (only sent once, never stored)
  def welcome_email_with_password(user, password)
    @user = user
    @password = password

    mail(
      to: user.email,
      subject: "Welcome! Your account has been created"
    )
  end
end
