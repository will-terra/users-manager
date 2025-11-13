class RemoveGeneratedPasswordsFromUserImports < ActiveRecord::Migration[8.0]
  def change
    remove_column :user_imports, :generated_passwords, :text
  end
end
