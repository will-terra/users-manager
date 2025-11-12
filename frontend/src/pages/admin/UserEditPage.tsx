import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../services/api";
import type { User } from "../../types/user";
import { UserForm } from "./components/UserForm";

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { globalError, setGlobalError } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setGlobalError("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await adminApi.getUser(parseInt(id));
        setUser(response.data);
        setGlobalError(null);
      } catch (err) {
        const error = err as Error;
        setGlobalError(error.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, setGlobalError]);

  const handleSave = () => {
    // Navigate back to users list after successful update
    navigate("/admin/users");
  };

  const handleCancel = () => {
    // Navigate back to users list
    navigate("/admin/users");
  };

  if (loading) {
    return <div className="loading">Loading user...</div>;
  }

  if (globalError) {
    return <div className="error">{globalError}</div>;
  }

  if (!user) {
    return <div className="error">User not found</div>;
  }

  return (
    <div className="user-edit-page">
      <UserForm user={user} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};
