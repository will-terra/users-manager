import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useDeleteUser,
  useToggleUserRole,
  useUsers,
} from "../../hooks/queries";
import { useAuth } from "../../hooks/useAuth";
import "./UsersPage.scss";

export const UsersPage: React.FC = () => {
  const { globalError, setGlobalError, currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data,
    isLoading: loading,
    isError,
    error,
  } = useUsers(currentPage, search);

  useEffect(() => {
    if (isError) {
      setGlobalError((error as Error)?.message || "Failed to load users");
    }
  }, [isError, error, setGlobalError]);

  const users = data?.data?.users || [];
  const totalPages = data?.data?.pagination?.total_pages ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const deleteMutation = useDeleteUser();
  const toggleRoleMutation = useToggleUserRole();

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    deleteMutation.mutate(id, {
      onSuccess: () => setGlobalError(null),
      onError: (err) =>
        setGlobalError((err as Error)?.message || "Failed to delete user"),
    });
  };

  const handleToggleRole = (id: number) => {
    toggleRoleMutation.mutate(id, {
      onSuccess: () => setGlobalError(null),
      onError: (err) =>
        setGlobalError((err as Error)?.message || "Failed to toggle user role"),
    });
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
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
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
                    {currentUser?.id !== user.id && (
                      <>
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
                      </>
                    )}
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
