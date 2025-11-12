import React, { useEffect, useState } from "react";
import { adminApi } from "../../../services/api";
import type { User } from "../../../types/user";
import "./UserForm.scss";

interface UserFormProps {
  user?: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user" as "user" | "admin",
    password: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role as "user" | "admin",
        password: "",
      });
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let savedUser: User;
      if (user) {
        // Update
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          ...(avatar && { avatar }),
        };
        const response = await adminApi.updateUser(user.id, updateData);
        savedUser = response.data;
      } else {
        // Create
        const createData = {
          ...formData,
          ...(avatar && { avatar }),
        };
        const response = await adminApi.createUser(createData);
        savedUser = response.data;
      }
      onSave(savedUser);
    } catch (err) {
      setError("Failed to save user");
      console.error("Save user error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form">
      <h3>{user ? "Edit User" : "Create User"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            autoComplete="name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {!user && (
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete={user ? "current-password" : "new-password"}
              value={formData.password}
              onChange={handleInputChange}
              required={!user}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="avatar">Avatar</label>
          <input
            type="file"
            id="avatar"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};
