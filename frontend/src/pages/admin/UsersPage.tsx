import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../services/api";
import type { User } from "../../types/user";
import "./UsersPage.scss";

export const UsersPage: React.FC = () => {
  const { globalError, setGlobalError } = useAuth();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const {
    data,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", currentPage, search],
    queryFn: () =>
      adminApi
        .getUsers(currentPage, search)
        .then(
          (res) =>
            res?.data ?? {
              users: [],
              pagination: { current_page: 1, total_pages: 1, total_count: 0 },
            },
        ),
  });
  useEffect(() => {
    if (isError) {
      setGlobalError((error as Error)?.message || "Failed to load users");
    }
  }, [isError, error, setGlobalError]);

  const users = (data?.users as User[]) || [];
  const totalPages = data?.pagination?.total_pages ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users", currentPage, search],
      });
      setGlobalError(null);
    },
    onError: (err) =>
      setGlobalError((err as Error)?.message || "Failed to delete user"),
  });

  const toggleRoleMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users", currentPage, search],
      });
      setGlobalError(null);
    },
    onError: (err) =>
      setGlobalError((err as Error)?.message || "Failed to toggle user role"),
  });

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const handleToggleRole = (id: number) => {
    toggleRoleMutation.mutate(id);
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Users Management</h1>
        <Link to="/admin/users/new" className="btn btn-primary">
          Add New User
        </Link>
      </div>

      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {globalError && <div className="error-message">{globalError}</div>}

      <div className="users-table">
        {/* wrapper enables horizontal scrolling on small screens */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.full_name || user.email.split("@")[0]}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="actions">
                    <Link
                      to={`/admin/users/${user.id}/edit`}
                      className="btn btn-sm btn-edit"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleRole(user.id)}
                      className="btn btn-sm btn-toggle"
                    >
                      Toggle Role
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="btn btn-sm btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
