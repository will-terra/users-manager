import React from "react";
import { useNavigate } from "react-router-dom";
import { UserForm } from "./components/UserForm";

export const UserNewPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = () => {
    // Navigate back to users list after successful creation
    navigate("/admin/users");
  };

  const handleCancel = () => {
    // Navigate back to users list
    navigate("/admin/users");
  };

  return (
    <div className="user-new-page">
      <UserForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};
