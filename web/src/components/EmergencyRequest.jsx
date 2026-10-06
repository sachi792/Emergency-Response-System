import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

const INITIAL_FORM = {
  callerName: "",
  contactNumber: "",
  emergencyType: "ACCIDENT",
  patientCount: 1,
  address: "",
  priority: "HIGH",
  description: "",
};

// Colour theme for each emergency status
const STATUS_THEME = {
  PENDING: { color: "#fbbf24", rgb: "245, 158, 11" },
  ASSIGNED: { color: "#7db4ff", rgb: "59, 130, 246" },
  ON_THE_WAY: { color: "#b8a2ff", rgb: "139, 92, 246" },
  ARRIVED: { color: "#2dd4bf", rgb: "20, 184, 166" },
  COMPLETED: { color: "#56d364", rgb: "46, 160, 67" },
  CANCELLED: { color: "#ff7b7b", rgb: "255, 59, 59" },
};

const DEFAULT_THEME = { color: "#c3c8d4", rgb: "139, 147, 165" };

function EmergencyRequest() {
  // --------------------------------
  // Current emergency ID
  // --------------------------------
  const [emergencyId, setEmergencyId] = useState(
    localStorage.getItem("currentEmergencyId") || ""
  );

  const [emergency, setEmergency] = useState(null);
  const [ambulance, setAmbulance] = useState(null);

  // --------------------------------
  // Form data
  // --------------------------------
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // ==========================================
  // LISTEN TO CURRENT EMERGENCY
  // ==========================================

  useEffect(() => {
    if (!emergencyId) {
      return;
    }

    const emergencyRef = doc(db, "emergency_requests", emergencyId);

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
  }, [emergencyId]);

  // ==========================================
  // LISTEN TO ASSIGNED AMBULANCE
  // ==========================================

  useEffect(() => {
    if (!emergency?.assignedAmbulanceId) {
      setAmbulance(null);
      return;
    }

    const ambulanceRef = doc(db, "ambulances", emergency.assignedAmbulanceId);

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
  }, [emergency?.assignedAmbulanceId]);

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "patientCount" ? Number(value) : value,
    });
  };

  // ==========================================
  // SUBMIT EMERGENCY
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const emergencyRef = await addDoc(collection(db, "emergency_requests"), {
        callerName: formData.callerName,
        contactNumber: formData.contactNumber,
        emergencyType: formData.emergencyType,
        patientCount: formData.patientCount,
        address: formData.address,
        priority: formData.priority,
        description: formData.description,

        status: "PENDING",

        assignedAmbulanceId: null,

        requestedAt: serverTimestamp(),
        assignedAt: null,
        completedAt: null,
      });

      // Save current emergency ID
      localStorage.setItem("currentEmergencyId", emergencyRef.id);

      setEmergencyId(emergencyRef.id);

      setMessage({
        text: "Emergency request submitted successfully.",
        type: "success",
      });

      setFormData(INITIAL_FORM);
    } catch (error) {
      console.error("Error submitting emergency:", error);

      setMessage({
        text: "Failed to submit emergency request. Please try again.",
        type: "error",
      });
    }

    setLoading(false);
  };

  // ==========================================
  // START NEW EMERGENCY
  // ==========================================

  const createNewEmergency = () => {
    localStorage.removeItem("currentEmergencyId");

    setEmergencyId("");
    setEmergency(null);
    setAmbulance(null);
    setMessage({ text: "", type: "" });
  };

  // ==========================================
  // STATUS TEXT
  // ==========================================

  const getStatusTitle = () => {
    if (!emergency) {
      return "";
    }

    switch (emergency.status) {
      case "PENDING":
        return "⏳ WAITING FOR AMBULANCE";

      case "ASSIGNED":
        return "🚑 AMBULANCE ASSIGNED";

      case "ON_THE_WAY":
        return "🚑 AMBULANCE ON THE WAY";

      case "ARRIVED":
        return "📍 AMBULANCE ARRIVED";

      case "COMPLETED":
        return "✅ EMERGENCY COMPLETED";

      case "CANCELLED":
        return "❌ EMERGENCY CANCELLED";

      default:
        return emergency.status;
    }
  };

  // Guidance card shown under the details for each status
  const getGuidance = () => {
    if (!emergency) {
      return null;
    }

    switch (emergency.status) {
      case "PENDING":
        return {
          title: "⏳ Please Wait",
          lines: [
            "Your emergency request has been received.",
            "The dispatcher is currently looking for an available ambulance.",
            "Please remain at the emergency location.",
          ],
        };

      case "ASSIGNED":
        // Only shown once the ambulance details are loaded
        if (!ambulance) {
          return null;
        }
        return {
          title: "🚑 Ambulance Assigned",
          lines: [
            "An ambulance has been assigned to your emergency.",
            "The driver will start the journey shortly.",
          ],
        };

      case "ON_THE_WAY":
        return {
          title: "🚑 Ambulance Is On The Way",
          lines: [
            "The ambulance is currently travelling to your emergency location.",
            "Please remain at the provided location.",
          ],
        };

      case "ARRIVED":
        return {
          title: "📍 Ambulance Has Arrived",
          lines: ["The ambulance has arrived at your emergency location."],
        };

      case "COMPLETED":
        return {
          title: "✅ Emergency Completed",
          lines: ["The emergency response has been completed."],
        };

      default:
        return null;
    }
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
  // REQUEST FORM
  // ==========================================

  if (!emergencyId || !emergency) {
    return (
      <div style={styles.container}>
        <style>{css}</style>

        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>🚨 Emergency Request</h1>
            <p style={styles.subtitle}>Request an ambulance for an emergency</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* 1. Caller Name */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="callerName">
                Caller Name
              </label>
              <input
                id="callerName"
                className="er-input"
                type="text"
                name="callerName"
                value={formData.callerName}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* 2. Contact Number */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="contactNumber">
                Contact Number
              </label>
              <input
                id="contactNumber"
                className="er-input"
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                required
              />
            </div>

            {/* 3. Emergency Type */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="emergencyType">
                Emergency Type
              </label>
              <select
                id="emergencyType"
                className="er-input"
                name="emergencyType"
                value={formData.emergencyType}
                onChange={handleChange}
              >
                <option value="ACCIDENT">Accident</option>
                <option value="MEDICAL">Medical Emergency</option>
                <option value="FIRE">Fire</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* 4. Number of Patients */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="patientCount">
                Number of Patients
              </label>
              <input
                id="patientCount"
                className="er-input"
                type="number"
                name="patientCount"
                min="1"
                value={formData.patientCount}
                onChange={handleChange}
                required
              />
            </div>

            {/* 5. Location / Address */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="address">
                Location / Address
              </label>
              <input
                id="address"
                className="er-input"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter emergency location"
                required
              />
            </div>

            {/* 6. Priority */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                className="er-input"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* 7. Additional Information */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="description">
                Additional Information
              </label>
              <textarea
                id="description"
                className="er-input"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the emergency"
                rows="4"
              />
            </div>

            {/* 8. Submit */}
            <button
              type="submit"
              className="er-btn er-red"
              disabled={loading}
            >
              {loading ? "Submitting..." : "🚨 REQUEST AMBULANCE"}
            </button>
          </form>

          {messageBox}
        </div>
      </div>
    );
  }

  // ==========================================
  // CURRENT EMERGENCY SCREEN
  // ==========================================

  const theme = STATUS_THEME[emergency.status] || DEFAULT_THEME;
  const guidance = getGuidance();

  return (
    <div style={styles.container}>
      <style>{css}</style>

      <div style={styles.dashboard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🚨 Emergency Response</h1>
          <p style={styles.subtitle}>Live status of your emergency request</p>
        </div>

        {messageBox}

        {/* ================================= */}
        {/* 1. CURRENT STATUS */}
        {/* ================================= */}

        <div
          style={{
            ...styles.statusCard,
            backgroundColor: `rgba(${theme.rgb}, 0.1)`,
            border: `2px solid rgba(${theme.rgb}, 0.7)`,
            boxShadow: `0 0 0 4px rgba(${theme.rgb}, 0.12)`,
          }}
        >
          <h2 style={{ ...styles.statusTitle, color: theme.color }}>
            {getStatusTitle()}
          </h2>

          <p style={styles.statusLabel}>
            Your emergency request is currently:
          </p>

          <span
            style={{
              ...styles.statusBadge,
              color: theme.color,
              backgroundColor: `rgba(${theme.rgb}, 0.18)`,
              border: `1px solid rgba(${theme.rgb}, 0.6)`,
            }}
          >
            {emergency.status}
          </span>
        </div>

        {/* ================================= */}
        {/* 2. EMERGENCY DETAILS */}
        {/* ================================= */}

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>📋 Current Emergency Details</h2>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Caller</span>
            <span style={styles.rowValue}>{emergency.callerName}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Contact</span>
            <span style={styles.rowValue}>{emergency.contactNumber}</span>
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
            <span style={styles.rowLabel}>Priority</span>
            <span style={styles.rowValue}>{emergency.priority}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Location</span>
            <span style={styles.rowValue}>{emergency.address}</span>
          </div>

          <div style={{ ...styles.row, ...styles.rowLast }}>
            <span style={styles.rowLabel}>Description</span>
            <span style={styles.rowValue}>
              {emergency.description || "No additional information"}
            </span>
          </div>
        </section>

        {/* ================================= */}
        {/* 3. AMBULANCE DETAILS */}
        {/* ================================= */}

        {ambulance && (
          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>🚑 Assigned Ambulance</h2>

            <div style={styles.row}>
              <span style={styles.rowLabel}>Vehicle</span>
              <span style={styles.rowValue}>{ambulance.vehicleNumber}</span>
            </div>

            <div style={styles.row}>
              <span style={styles.rowLabel}>Driver</span>
              <span style={styles.rowValue}>{ambulance.driverName}</span>
            </div>

            <div style={styles.row}>
              <span style={styles.rowLabel}>Contact</span>
              <span style={styles.rowValue}>{ambulance.contactNumber}</span>
            </div>

            <div style={{ ...styles.row, ...styles.rowLast }}>
              <span style={styles.rowLabel}>Ambulance Status</span>
              <span style={styles.rowValue}>{ambulance.status}</span>
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* 4. STATUS GUIDANCE */}
        {/* ================================= */}

        {guidance && (
          <div
            style={{
              ...styles.guidanceCard,
              backgroundColor: `rgba(${theme.rgb}, 0.08)`,
              border: `1px solid rgba(${theme.rgb}, 0.5)`,
            }}
          >
            <h2 style={{ ...styles.guidanceTitle, color: theme.color }}>
              {guidance.title}
            </h2>

            {guidance.lines.map((line) => (
              <p key={line} style={styles.guidanceText}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* ================================= */}
        {/* 5. NEW REQUEST BUTTON */}
        {/* ================================= */}

        {emergency.status === "COMPLETED" && (
          <button onClick={createNewEmergency} className="er-btn er-red">
            🚨 CREATE NEW EMERGENCY REQUEST
          </button>
        )}
      </div>
    </div>
  );
}

const css = `
  .er-input {
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
  .er-input::placeholder { color: #6b7385; }
  .er-input:focus {
    border-color: #ff3b3b;
    box-shadow: 0 0 0 3px rgba(255, 59, 59, 0.25);
  }
  .er-input option {
    background-color: #1c212b;
    color: #e8eaed;
  }
  textarea.er-input {
    resize: vertical;
    min-height: 90px;
  }

  .er-btn {
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
  .er-red {
    background: linear-gradient(180deg, #ff4d4d 0%, #d91616 100%);
    box-shadow: 0 0 0 1px rgba(255, 90, 90, 0.5),
                0 8px 24px rgba(255, 40, 40, 0.45);
  }
  .er-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 0 0 1px rgba(255, 120, 120, 0.7),
                0 10px 32px rgba(255, 40, 40, 0.65);
  }
  .er-btn:active:not(:disabled) { transform: scale(0.98); }
  .er-btn:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }
  .er-btn:disabled { opacity: 0.6; cursor: not-allowed; }
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
    margin: "0 auto",
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
    maxWidth: "800px",
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
    margin: "0 0 8px",
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
    margin: "20px 0 0",
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

  statusCard: {
    padding: "28px 24px",
    borderRadius: "10px",
    textAlign: "center",
  },

  statusTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  statusLabel: {
    margin: "12px 0 10px",
    color: "#c3c8d4",
    fontSize: "14px",
  },

  statusBadge: {
    display: "inline-block",
    padding: "6px 18px",
    borderRadius: "999px",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  panel: {
    padding: "22px",
    borderRadius: "10px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    display: "flex",
    flexDirection: "column",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "10px 0",
    borderBottom: "1px solid #2a3140",
    fontSize: "14px",
  },

  rowLast: {
    borderBottom: "none",
    paddingBottom: 0,
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

  guidanceCard: {
    padding: "22px 24px",
    borderRadius: "10px",
  },

  guidanceTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
    fontWeight: 700,
  },

  guidanceText: {
    margin: "6px 0 0",
    color: "#c3c8d4",
    fontSize: "15px",
    lineHeight: 1.5,
  },
};

export default EmergencyRequest;
