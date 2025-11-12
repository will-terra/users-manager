import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../hooks/queries";
import { UserForm } from "./components/UserForm";

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUser(parseInt(id || "0"));

  const handleSave = () => {
    // Navigate back to users list after successful update
    navigate("/admin/users");
  };

  const handleCancel = () => {
    // Navigate back to users list
    navigate("/admin/users");
  };

  if (isLoading) {
    return <div className="loading">Loading user...</div>;
  }

  if (error) {
    return <div className="error">{error.message}</div>;
  }

  if (!data?.data) {
    return <div className="error">User not found</div>;
  }

  return (
    <div className="user-edit-page">
      <UserForm user={data.data} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};
