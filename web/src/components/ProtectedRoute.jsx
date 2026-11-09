import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import { theme } from "../theme";

const ROLE_PATHS = {
  admin: "/admin",
  dispatcher: "/dispatcher",
  hospital: "/hospital",
};

function ProtectedRoute({ children, allowedRole }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Get the user's role from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          setUser(currentUser);
          setUserRole(userDoc.data().role);
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setUser(null);
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Wait until Firebase finishes checking authentication
  if (loading) {
    return (
      <div
        role="status"
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: theme.colors.pageBg,
          color: theme.colors.muted,
          fontFamily: theme.font,
          fontSize: "15px",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role: send them to their own dashboard
  if (userRole !== allowedRole) {
    return <Navigate to={ROLE_PATHS[userRole] || "/login"} replace />;
  }

  // Correct user and role
  return children;
}

export default ProtectedRoute;
