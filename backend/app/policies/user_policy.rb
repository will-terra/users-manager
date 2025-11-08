# Pundit policy governing which users can perform actions on User records.
class UserPolicy < ApplicationPolicy
  def index?
    user.admin? # Only admins can list all users
  end

  def show?
    user.admin? || user == record # Admins or the user viewing themselves
  end

  def create?
    user.admin? # Only admins create new users
  end

  def update?
    user.admin? || user == record # Admins or the user editing their own record
  end

  def destroy?
    user.admin? # Admins can attempt deletion; controller handles self-deletion
  end

  def toggle_role?
    user.admin? && user != record # Admins can change roles; not on themselves
  end

  def admin_user_params?
    user.admin? # Determines if admin-only params are permitted
  end

  def admin?
    user.admin? # Check if user has admin privileges
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all # Admins see all users
      else
        scope.where(id: user.id) # Regular users only see themselves
      end
    end
  end
end
