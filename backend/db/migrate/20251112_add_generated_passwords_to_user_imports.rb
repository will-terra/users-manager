class AddGeneratedPasswordsToUserImports < ActiveRecord::Migration[6.0]
  def change
    add_column :user_imports, :generated_passwords, :text
  end
end
