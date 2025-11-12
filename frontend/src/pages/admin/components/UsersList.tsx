import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { adminApi } from "../../../services/api";
import type { Pagination } from "../../../types/api";
import type { User } from "../../../types/user";

interface UsersListProps {
  onEditUser: (user: User) => void;
  onCreateUser: () => void;
}

export const UsersList: React.FC<UsersListProps> = ({
  onEditUser,
  onCreateUser,
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["users", page, searchTerm],
    queryFn: () => adminApi.getUsers(page, searchTerm).then((res) => res.data),
  });

  const users = data?.users || [];
  const pagination: Pagination = (data?.pagination as Pagination) || {
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  };

  const toggleRoleMutation = useMutation({
    mutationFn: (userId: number) => adminApi.toggleUserRole(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["users", page, searchTerm] }),
    onError: (err) => console.error("Failed to toggle role:", err),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUser(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["users", page, searchTerm] }),
    onError: (err) => console.error("Failed to delete user:", err),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(search);
    setPage(1);
  };

  const handleToggleRole = (userId: number) =>
    toggleRoleMutation.mutate(userId);

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getAvatarUrl = (user: User) => {
    if (user.avatar_urls?.thumb) {
      return `${import.meta.env.VITE_API_BASE_URL}${user.avatar_urls.thumb}`;
    }
    return "/default-avatar.png"; // placeholder
  };

  return (
    <div className="users-list">
      <div className="header">
        <h2>Users Management</h2>
        <button onClick={onCreateUser} className="btn btn-primary">
          Create User
        </button>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="search-input"
        />
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table className="users-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <img
                      src={getAvatarUrl(user)}
                      alt={`${user.full_name} avatar`}
                      className="avatar-thumb"
                    />
                  </td>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button
                      onClick={() => onEditUser(user)}
                      className="btn btn-sm btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleRole(user.id)}
                      className="btn btn-sm btn-toggle"
                    >
                      Toggle Role
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn btn-sm btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span>
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
