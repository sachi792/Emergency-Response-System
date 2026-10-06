import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

const INITIAL_FORM = {
  vehicleNumber: "",
  driverName: "",
  contactNumber: "",
};

function AmbulanceManagement() {
  // --------------------------------
  // Current ambulance profile
  // --------------------------------
  const [ambulanceId, setAmbulanceId] = useState(
    localStorage.getItem("currentAmbulanceId") || ""
  );

  const [ambulance, setAmbulance] = useState(null);
  const [emergency, setEmergency] = useState(null);

  // --------------------------------
  // Registration form
  // --------------------------------
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // ==========================================
  // LISTEN TO CURRENT AMBULANCE
  // ==========================================

  useEffect(() => {
    if (!ambulanceId) {
      return;
    }

    const ambulanceRef = doc(db, "ambulances", ambulanceId);

    const unsubscribe = onSnapshot(
      ambulanceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setAmbulance({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setAmbulance(null);
        }
      },
      (error) => {
        console.error("Error listening to ambulance:", error);
      }
    );

    return () => unsubscribe();
  }, [ambulanceId]);

  // ==========================================
  // LISTEN TO ASSIGNED EMERGENCY
  // ==========================================

  useEffect(() => {
    if (!ambulance?.assignedEmergencyId) {
      setEmergency(null);
      return;
    }

    const emergencyRef = doc(
      db,
      "emergency_requests",
      ambulance.assignedEmergencyId
    );

    const unsubscribe = onSnapshot(
      emergencyRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setEmergency({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setEmergency(null);
        }
      },
      (error) => {
        console.error("Error listening to emergency:", error);
      }
    );

    return () => unsubscribe();
  }, [ambulance?.assignedEmergencyId]);

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==========================================
  // REGISTER AMBULANCE
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const ambulanceRef = await addDoc(collection(db, "ambulances"), {
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        contactNumber: formData.contactNumber,
        status: "AVAILABLE",
        assignedEmergencyId: null,
        createdAt: serverTimestamp(),
      });

      // Save this ambulance as the current driver profile
      localStorage.setItem("currentAmbulanceId", ambulanceRef.id);

      setAmbulanceId(ambulanceRef.id);
      setFormData(INITIAL_FORM);

      setMessage({
        text: "Ambulance profile created successfully.",
        type: "success",
      });
    } catch (error) {
      console.error("Error registering ambulance:", error);

      setMessage({
        text: "Failed to create ambulance profile. Please try again.",
        type: "error",
      });
    }

    setLoading(false);
  };

  // ==========================================
  // UPDATE EMERGENCY STATUS
  // ==========================================

  const updateEmergencyStatus = async (newStatus) => {
    if (!ambulance || !emergency) {
      return;
    }

    try {
      const emergencyRef = doc(db, "emergency_requests", emergency.id);
      const ambulanceRef = doc(db, "ambulances", ambulance.id);

      // Driver starts journey
      if (newStatus === "ON_THE_WAY") {
        await updateDoc(emergencyRef, {
          status: "ON_THE_WAY",
        });
      }

      // Driver arrived
      if (newStatus === "ARRIVED") {
        await updateDoc(emergencyRef, {
          status: "ARRIVED",
        });
      }

      // Emergency completed
      if (newStatus === "COMPLETED") {
        await updateDoc(emergencyRef, {
          status: "COMPLETED",
          completedAt: serverTimestamp(),
          assignedAmbulanceId: null,
        });

        await updateDoc(ambulanceRef, {
          status: "AVAILABLE",
          assignedEmergencyId: null,
        });

        setMessage({
          text: "Emergency completed. Ambulance is now available.",
          type: "success",
        });

        return;
      }

      setMessage({
        text: `Emergency status updated to ${newStatus}.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating emergency:", error);

      setMessage({
        text: "Failed to update emergency status.",
        type: "error",
      });
    }
  };

  // ==========================================
  // CHANGE CURRENT DRIVER
  // ==========================================

  const changeProfile = () => {
    localStorage.removeItem("currentAmbulanceId");

    setAmbulanceId("");
    setAmbulance(null);
    setEmergency(null);
    setMessage({ text: "", type: "" });
  };

  // Colour for the status badge
  const statusStyle = (status) => {
    if (status === "AVAILABLE") return styles.badgeGreen;
    if (status === "BUSY" || status === "ASSIGNED") return styles.badgeRed;
    if (status === "ON_THE_WAY") return styles.badgeAmber;
    if (status === "ARRIVED") return styles.badgeBlue;
    return styles.badgeGray;
  };

  // Reusable message box
  const messageBox = message.text && (
    <p
      role="status"
      style={{
        ...styles.message,
        ...(message.type === "success"
          ? styles.messageSuccess
          : styles.messageError),
      }}
    >
      {message.text}
    </p>
  );

  // ==========================================
  // REGISTRATION SCREEN
  // ==========================================

  if (!ambulanceId) {
    return (
      <div style={styles.container}>
        <style>{css}</style>

        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>🚑 Ambulance Driver</h1>
            <p style={styles.subtitle}>
              Register the ambulance and driver profile
            </p>
          </div>

          <form onSubmit={handleRegister} style={styles.form}>
            {/* 1. Vehicle Number */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="vehicleNumber">
                Vehicle Number
              </label>
              <input
                id="vehicleNumber"
                className="am-input"
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="WP ABC-1234"
                required
              />
            </div>

            {/* 2. Driver Name */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="driverName">
                Driver Name
              </label>
              <input
                id="driverName"
                className="am-input"
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                placeholder="Enter driver name"
                required
              />
            </div>

            {/* 3. Contact Number */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="contactNumber">
                Contact Number
              </label>
              <input
                id="contactNumber"
                className="am-input"
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                required
              />
            </div>

            {/* 4. Submit */}
            <button
              type="submit"
              className="am-btn am-green"
              disabled={loading}
            >
              {loading ? "Creating Profile..." : "🚑 CREATE DRIVER PROFILE"}
            </button>
          </form>

          {messageBox}
        </div>
      </div>
    );
  }

  // ==========================================
  // DRIVER DASHBOARD
  // ==========================================

  return (
    <div style={styles.container}>
      <style>{css}</style>

      <div style={styles.dashboard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🚑 Ambulance Driver Dashboard</h1>
          <p style={styles.subtitle}>
            Emergency response and ambulance operations
          </p>
        </div>

        {messageBox}

        {/* ================================= */}
        {/* 1. CURRENT PROFILE */}
        {/* ================================= */}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.sectionTitle}>👤 Current Driver Profile</h2>

            <button onClick={changeProfile} className="am-ghost">
              Change Profile
            </button>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Driver</span>
            <span style={styles.rowValue}>{ambulance?.driverName}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Vehicle</span>
            <span style={styles.rowValue}>{ambulance?.vehicleNumber}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Contact</span>
            <span style={styles.rowValue}>{ambulance?.contactNumber}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Status</span>
            {ambulance?.status && (
              <span
                style={{ ...styles.badge, ...statusStyle(ambulance.status) }}
              >
                {ambulance.status}
              </span>
            )}
          </div>
        </section>

        {/* ================================= */}
        {/* 2. NEW ASSIGNMENT */}
        {/* ================================= */}

        {emergency && emergency.status === "ASSIGNED" && (
          <section style={styles.alertPanel}>
            <h2 style={styles.alertTitle}>🚨 NEW EMERGENCY ASSIGNMENT</h2>

            <p style={styles.alertText}>
              A new emergency has been assigned to your ambulance.
            </p>

            <div style={styles.details}>
              <div style={styles.row}>
                <span style={styles.rowLabel}>Emergency</span>
                <span style={styles.rowValue}>{emergency.emergencyType}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Patients</span>
                <span style={styles.rowValue}>{emergency.patientCount}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Location</span>
                <span style={styles.rowValue}>{emergency.address}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Contact</span>
                <span style={styles.rowValue}>{emergency.contactNumber}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Additional Information</span>
                <span style={styles.rowValue}>
                  {emergency.description || "No additional information"}
                </span>
              </div>
            </div>

            <button
              onClick={() => updateEmergencyStatus("ON_THE_WAY")}
              className="am-btn am-red"
            >
              🚑 START JOURNEY
            </button>
          </section>
        )}

        {/* ================================= */}
        {/* 3. ACTIVE EMERGENCY */}
        {/* ================================= */}

        {emergency &&
          emergency.status !== "COMPLETED" &&
          emergency.status !== "ASSIGNED" && (
            <section style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.sectionTitle}>🚨 Active Emergency</h2>
                <span
                  style={{
                    ...styles.badge,
                    ...statusStyle(emergency.status),
                  }}
                >
                  {emergency.status}
                </span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Emergency</span>
                <span style={styles.rowValue}>{emergency.emergencyType}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Patients</span>
                <span style={styles.rowValue}>{emergency.patientCount}</span>
              </div>

              <div style={styles.row}>
                <span style={styles.rowLabel}>Location</span>
                <span style={styles.rowValue}>{emergency.address}</span>
              </div>

              {/* ON THE WAY */}
              {emergency.status === "ON_THE_WAY" && (
                <button
                  onClick={() => updateEmergencyStatus("ARRIVED")}
                  className="am-btn am-amber"
                >
                  📍 MARK AS ARRIVED
                </button>
              )}

              {/* ARRIVED */}
              {emergency.status === "ARRIVED" && (
                <button
                  onClick={() => updateEmergencyStatus("COMPLETED")}
                  className="am-btn am-green"
                >
                  ✅ COMPLETE EMERGENCY
                </button>
              )}
            </section>
          )}

        {/* ================================= */}
        {/* 4. WAITING */}
        {/* ================================= */}

        {!emergency && ambulance?.status === "AVAILABLE" && (
          <section style={styles.waitingPanel}>
            <h2 style={styles.waitingTitle}>🟢 Available for Emergency</h2>

            <p style={styles.waitingText}>
              No emergency has been assigned yet.
            </p>

            <p style={styles.waitingText}>
              Please remain available for the next emergency assignment.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

const css = `
  .am-input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    background-color: #1c212b;
    color: #e8eaed;
    border: 1px solid #2f3644;
    border-radius: 8px;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .am-input::placeholder { color: #6b7385; }
  .am-input:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  }

  /* Big action buttons */
  .am-btn {
    width: 100%;
    margin-top: 8px;
    padding: 16px;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.15s, filter 0.15s;
  }
  .am-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .am-btn:active:not(:disabled) { transform: scale(0.98); }
  .am-btn:focus-visible,
  .am-ghost:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }
  .am-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .am-green {
    background: linear-gradient(180deg, #34d46a 0%, #16a34a 100%);
    box-shadow: 0 0 0 1px rgba(80, 220, 120, 0.5),
                0 8px 24px rgba(34, 197, 94, 0.4);
  }
  .am-red {
    background: linear-gradient(180deg, #ff4d4d 0%, #d91616 100%);
    box-shadow: 0 0 0 1px rgba(255, 90, 90, 0.5),
                0 8px 24px rgba(255, 40, 40, 0.45);
  }
  .am-amber {
    background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
    box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.5),
                0 8px 24px rgba(245, 158, 11, 0.4);
  }

  /* Small outline button */
  .am-ghost {
    padding: 8px 14px;
    background-color: transparent;
    color: #c3c8d4;
    border: 1px solid #2f3644;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;
  }
  .am-ghost:hover {
    background-color: #1c212b;
    border-color: #4a5366;
  }
`;

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0e1117",
    padding: "30px 16px",
    boxSizing: "border-box",
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "600px",
    margin: "30px auto",
    backgroundColor: "#161b22",
    padding: "32px",
    borderRadius: "14px",
    border: "1px solid #262d3a",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.55)",
    color: "#e8eaed",
    boxSizing: "border-box",
  },

  dashboard: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#161b22",
    padding: "32px",
    borderRadius: "14px",
    border: "1px solid #262d3a",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.55)",
    color: "#e8eaed",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  header: {
    marginBottom: "6px",
    paddingBottom: "20px",
    borderBottom: "1px solid #262d3a",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#ffffff",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#8b93a5",
    fontSize: "15px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "22px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#c3c8d4",
  },

  message: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
  },

  messageSuccess: {
    backgroundColor: "rgba(46, 160, 67, 0.15)",
    border: "1px solid rgba(46, 160, 67, 0.5)",
    color: "#56d364",
  },

  messageError: {
    backgroundColor: "rgba(255, 59, 59, 0.12)",
    border: "1px solid rgba(255, 59, 59, 0.5)",
    color: "#ff7b7b",
  },

  panel: {
    padding: "22px",
    borderRadius: "10px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
  },

  alertPanel: {
    padding: "24px",
    borderRadius: "10px",
    backgroundColor: "rgba(255, 59, 59, 0.08)",
    border: "2px solid #ff3b3b",
    boxShadow: "0 0 0 4px rgba(255, 59, 59, 0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  alertTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#ff7b7b",
  },

  alertText: {
    margin: "0 0 6px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#e8eaed",
  },

  details: {
    padding: "16px",
    backgroundColor: "#161b22",
    border: "1px solid #2f3644",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "6px",
  },

  waitingPanel: {
    padding: "24px",
    borderRadius: "10px",
    backgroundColor: "rgba(46, 160, 67, 0.08)",
    border: "1px solid rgba(46, 160, 67, 0.5)",
  },

  waitingTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#56d364",
  },

  waitingText: {
    margin: "6px 0 0",
    color: "#c3c8d4",
    fontSize: "15px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    fontSize: "14px",
  },

  rowLabel: {
    color: "#8b93a5",
    fontWeight: 600,
    flexShrink: 0,
  },

  rowValue: {
    color: "#e8eaed",
    textAlign: "right",
    wordBreak: "break-word",
  },

  badge: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },

  badgeGreen: {
    backgroundColor: "rgba(46, 160, 67, 0.18)",
    border: "1px solid rgba(46, 160, 67, 0.5)",
    color: "#56d364",
  },

  badgeRed: {
    backgroundColor: "rgba(255, 59, 59, 0.14)",
    border: "1px solid rgba(255, 59, 59, 0.5)",
    color: "#ff7b7b",
  },

  badgeAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    border: "1px solid rgba(245, 158, 11, 0.5)",
    color: "#fbbf24",
  },

  badgeBlue: {
    backgroundColor: "rgba(59, 130, 246, 0.14)",
    border: "1px solid rgba(59, 130, 246, 0.5)",
    color: "#7db4ff",
  },

  badgeGray: {
    backgroundColor: "rgba(139, 147, 165, 0.15)",
    border: "1px solid rgba(139, 147, 165, 0.4)",
    color: "#c3c8d4",
  },
};

export default AmbulanceManagement;
