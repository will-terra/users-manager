import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { RegisterPayload } from "../../types/authService";
import "./Auth.scss";

export const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterPayload>({
    full_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const { globalError, setGlobalError, setGlobalSuccess } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isFormComplete =
    formData.full_name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    (formData.password_confirmation ?? "").trim() !== "";

  const passwordsMatch = formData.password === formData.password_confirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setGlobalSuccess(null);
    setLoading(true);

    try {
      const response = await register(formData);
      const redirectTo = response.redirect_to || "/profile";
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Users Manager</h1>
          <h2>Register:</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation">Confirm Password</label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isFormComplete || !passwordsMatch}
              className="auth-button"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
            {globalError && <div className="error-message">{globalError}</div>}
            {formData.password_confirmation !== "" && !passwordsMatch && (
              <div className="error-message">Passwords do not match</div>
            )}
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
