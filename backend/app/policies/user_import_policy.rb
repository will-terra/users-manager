# Pundit policy governing which users can perform actions on UserImport records.
class UserImportPolicy < ApplicationPolicy
  def index?
    user.admin? # Only admins can list imports
  end

  def show?
    user.admin? # Only admins can view imports
  end

  def create?
    user.admin? # Only admins can create imports
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all # Admins see all imports
      else
        scope.none # Regular users don't see imports
      end
    end
  end
end
