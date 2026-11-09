import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import { theme } from "../theme";

const { colors, radius, shadow, font } = theme;

const ROLES = [
  { value: "dispatcher", label: "Dispatcher", path: "/dispatcher" },
  { value: "hospital", label: "Hospital", path: "/hospital" },
  { value: "admin", label: "Admin", path: "/admin" },
];

const AUTH_ERRORS = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many login attempts. Try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
};

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("dispatcher");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with Firebase Authentication
      const { user } = await signInWithEmailAndPassword(auth, cleanEmail, password);

      // 2. Get the user's profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        setError("User profile not found.");
        return;
      }

      const userData = userDoc.data();

      // 3. Check the actual role
      if (userData.role !== role) {
        await signOut(auth);
        setError(
          `This account is registered as ${userData.role}. Select the correct role.`
        );
        return;
      }

      // 4. Redirect according to role
      const target = ROLES.find((r) => r.value === userData.role);

      if (!target) {
        await signOut(auth);
        setError("Invalid user role.");
        return;
      }

      navigate(target.path, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(AUTH_ERRORS[err.code] || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        .login-input:focus {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
          outline: none;
        }
        .login-input::placeholder { color: ${colors.muted}; opacity: 0.7; }
        .login-input:-webkit-autofill {
          -webkit-text-fill-color: ${colors.text};
          box-shadow: 0 0 0 1000px ${colors.inputBg} inset;
        }
        .login-btn:hover:not(:disabled) { background: ${colors.primaryHover}; }
        .login-btn:focus-visible {
          outline: 3px solid rgba(59, 130, 246, 0.45);
          outline-offset: 2px;
        }
      `}</style>

      <main style={styles.card}>
        <header style={styles.header}>
          <h1 style={styles.title}>Emergency Response System</h1>
          <p style={styles.subtitle}>Ambulance &amp; Emergency Coordination</p>
        </header>

        <form onSubmit={handleLogin} noValidate>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              className="login-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              className="login-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.field, marginBottom: "24px" }}>
            <label htmlFor="role" style={styles.label}>
              Login As
            </label>
            <select
              id="role"
              className="login-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ ...styles.input, ...styles.select }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div role="alert" style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            style={{
              ...styles.button,
              background: loading ? colors.disabled : colors.primary,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </main>
    </div>
  );
}

const arrow =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%238b97ad' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: colors.pageBg,
    padding: "20px",
    fontFamily: font,
    colorScheme: "dark",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box",
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: "40px 32px",
    boxShadow: shadow,
  },
  header: { textAlign: "center", marginBottom: "32px" },
  title: {
    margin: "0 0 6px",
    fontSize: "24px",
    fontWeight: 700,
    color: colors.text,
    letterSpacing: "-0.01em",
  },
  subtitle: { margin: 0, fontSize: "14px", color: colors.muted },
  field: { marginBottom: "18px" },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: colors.label,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.inputBg,
    color: colors.text,
    fontSize: "14px",
    fontFamily: font,
  },
  select: {
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
    paddingRight: "40px",
    backgroundImage: arrow,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  },
  error: {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: radius.sm,
    background: colors.errorBg,
    border: `1px solid ${colors.errorBorder}`,
    color: colors.errorText,
    fontSize: "13px",
    textAlign: "center",
  },
  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: radius.sm,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: font,
    transition: "background 0.15s",
  },
};

export default Login;
