import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase";

// Colour theme for each emergency status (same as the caller's tracking page)
const STATUS_THEME = {
  ASSIGNED: { color: "#7db4ff", rgb: "59, 130, 246" },
  ON_THE_WAY: { color: "#b8a2ff", rgb: "139, 92, 246" },
  ARRIVED: { color: "#2dd4bf", rgb: "20, 184, 166" },
};

const DEFAULT_THEME = { color: "#c3c8d4", rgb: "139, 147, 165" };

function DispatcherDashboard() {
  const [pendingEmergencies, setPendingEmergencies] = useState([]);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);

  const [selectedEmergency, setSelectedEmergency] = useState("");
  const [selectedAmbulance, setSelectedAmbulance] = useState("");

  // --------------------------------------------------
  // Listen for PENDING emergencies
  // --------------------------------------------------
  useEffect(() => {
    const q = query(
      collection(db, "emergency_requests"),
      where("status", "==", "PENDING")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emergencies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingEmergencies(emergencies);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------
  // Listen for ACTIVE emergencies
  // ASSIGNED, ON_THE_WAY, ARRIVED
  // --------------------------------------------------
  useEffect(() => {
    const q = query(
      collection(db, "emergency_requests"),
      where("status", "in", ["ASSIGNED", "ON_THE_WAY", "ARRIVED"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emergencies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActiveEmergencies(emergencies);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------
  // Listen for available ambulances
  // --------------------------------------------------
  useEffect(() => {
    const q = query(
      collection(db, "ambulances"),
      where("status", "==", "AVAILABLE")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ambulanceList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAmbulances(ambulanceList);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------
  // Assign ambulance
  // --------------------------------------------------
  const assignAmbulance = async () => {
    if (!selectedEmergency || !selectedAmbulance) {
      alert("Please select an emergency and an ambulance.");
      return;
    }

    try {
      const emergencyRef = doc(db, "emergency_requests", selectedEmergency);

      const ambulanceRef = doc(db, "ambulances", selectedAmbulance);

      // Update emergency
      await updateDoc(emergencyRef, {
        status: "ASSIGNED",
        assignedAmbulanceId: selectedAmbulance,
        assignedAt: new Date(),
      });

      // Update ambulance
      await updateDoc(ambulanceRef, {
        status: "BUSY",
        assignedEmergencyId: selectedEmergency,
      });

      setSelectedEmergency("");
      setSelectedAmbulance("");

      alert("Ambulance assigned successfully.");
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Failed to assign ambulance.");
    }
  };

  // --------------------------------------------------
  // Status display
  // --------------------------------------------------
  const getStatusText = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "🚑 ASSIGNED";

      case "ON_THE_WAY":
        return "🟡 ON THE WAY";

      case "ARRIVED":
        return "🟢 ARRIVED";

      default:
        return status;
    }
  };

  // --------------------------------------------------
  // Find ambulance details
  // --------------------------------------------------
  const getAmbulanceDetails = (ambulanceId) => {
    return ambulances.find((ambulance) => ambulance.id === ambulanceId);
  };

  // Colour for the priority badge
  const priorityStyle = (priority) => {
    if (priority === "HIGH") return styles.badgeRed;
    if (priority === "MEDIUM") return styles.badgeAmber;
    return styles.badgeGreen;
  };

  // Text for the live update box
  const getLiveUpdate = (status) => {
    if (status === "ASSIGNED") {
      return "Ambulance assigned. Waiting for driver to start the journey.";
    }
    if (status === "ON_THE_WAY") {
      return "Ambulance is currently travelling to the emergency location.";
    }
    if (status === "ARRIVED") {
      return "Ambulance has arrived at the emergency location.";
    }
    return "";
  };

  return (
    <div style={styles.container}>
      {/* Scoped CSS for hover and focus states */}
      <style>{css}</style>

      <div style={styles.dashboard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🚨 Dispatcher Dashboard</h1>
          <p style={styles.subtitle}>
            Monitor emergencies and ambulance operations in real time.
          </p>
        </div>

        {/* ===================================================== */}
        {/* 1. PENDING EMERGENCIES */}
        {/* ===================================================== */}
        <section>
          <h2 style={styles.sectionTitle}>
            🚨 Pending Emergencies{" "}
            <span style={styles.count}>{pendingEmergencies.length}</span>
          </h2>

          {pendingEmergencies.length === 0 ? (
            <p style={styles.empty}>No pending emergencies.</p>
          ) : (
            <div style={styles.list}>
              {pendingEmergencies.map((emergency) => (
                <div key={emergency.id} style={styles.pendingCard}>
                  <div style={styles.cardTop}>
                    <h3 style={styles.cardTitle}>
                      {emergency.emergencyType} - {emergency.patientCount}{" "}
                      patient(s)
                    </h3>
                    <span
                      style={{
                        ...styles.badge,
                        ...priorityStyle(emergency.priority),
                      }}
                    >
                      {emergency.priority}
                    </span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Caller</span>
                    <span style={styles.rowValue}>{emergency.callerName}</span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Contact</span>
                    <span style={styles.rowValue}>
                      {emergency.contactNumber}
                    </span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Location</span>
                    <span style={styles.rowValue}>{emergency.address}</span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Description</span>
                    <span style={styles.rowValue}>
                      {emergency.description || "No description"}
                    </span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Status</span>
                    <span style={{ ...styles.badge, ...styles.badgeAmber }}>
                      ⏳ WAITING FOR AMBULANCE
                    </span>
                  </div>

                  {/* Assignment controls */}
                  <div style={styles.assignBox}>
                    <label
                      style={styles.label}
                      htmlFor={`ambulance-${emergency.id}`}
                    >
                      Select Ambulance
                    </label>

                    <select
                      id={`ambulance-${emergency.id}`}
                      className="dd-input"
                      value={
                        selectedEmergency === emergency.id
                          ? selectedAmbulance
                          : ""
                      }
                      onChange={(e) => {
                        setSelectedEmergency(emergency.id);
                        setSelectedAmbulance(e.target.value);
                      }}
                    >
                      <option value="">-- Select Available Ambulance --</option>

                      {ambulances.map((ambulance) => (
                        <option key={ambulance.id} value={ambulance.id}>
                          {ambulance.vehicleNumber} - {ambulance.driverName}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setSelectedEmergency(emergency.id);
                        assignAmbulance();
                      }}
                      disabled={
                        selectedEmergency !== emergency.id ||
                        !selectedAmbulance
                      }
                      className="dd-assign"
                    >
                      🚑 ASSIGN AMBULANCE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <hr style={styles.line} />

        {/* ===================================================== */}
        {/* 2. ACTIVE EMERGENCIES */}
        {/* ===================================================== */}
        <section>
          <h2 style={styles.sectionTitle}>
            📡 Active Emergencies{" "}
            <span style={styles.count}>{activeEmergencies.length}</span>
          </h2>

          <p style={styles.sectionNote}>
            These emergencies have already been assigned and are currently
            being handled by ambulance staff.
          </p>

          {activeEmergencies.length === 0 ? (
            <p style={styles.empty}>No active emergencies.</p>
          ) : (
            <div style={styles.list}>
              {activeEmergencies.map((emergency) => {
                const theme = STATUS_THEME[emergency.status] || DEFAULT_THEME;
                const ambulance = getAmbulanceDetails(
                  emergency.assignedAmbulanceId
                );

                return (
                  <div key={emergency.id} style={styles.activeCard}>
                    <div style={styles.cardTop}>
                      <h3 style={styles.cardTitle}>
                        {emergency.emergencyType} - {emergency.patientCount}{" "}
                        patient(s)
                      </h3>

                      <span
                        style={{
                          ...styles.badge,
                          color: theme.color,
                          backgroundColor: `rgba(${theme.rgb}, 0.18)`,
                          border: `1px solid rgba(${theme.rgb}, 0.6)`,
                        }}
                      >
                        {getStatusText(emergency.status)}
                      </span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.rowLabel}>Caller</span>
                      <span style={styles.rowValue}>
                        {emergency.callerName}
                      </span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.rowLabel}>Contact</span>
                      <span style={styles.rowValue}>
                        {emergency.contactNumber}
                      </span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.rowLabel}>Priority</span>
                      <span
                        style={{
                          ...styles.badge,
                          ...priorityStyle(emergency.priority),
                        }}
                      >
                        {emergency.priority}
                      </span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.rowLabel}>Emergency Location</span>
                      <span style={styles.rowValue}>{emergency.address}</span>
                    </div>

                    <div style={styles.row}>
                      <span style={styles.rowLabel}>Description</span>
                      <span style={styles.rowValue}>
                        {emergency.description || "No description"}
                      </span>
                    </div>

                    {/* Assigned ambulance */}
                    <div style={styles.subPanel}>
                      <h4 style={styles.subTitle}>🚑 Assigned Ambulance</h4>

                      <div style={styles.row}>
                        <span style={styles.rowLabel}>Ambulance ID</span>
                        <span style={styles.rowValue}>
                          {emergency.assignedAmbulanceId}
                        </span>
                      </div>

                      {!ambulance ? (
                        <p style={styles.unavailable}>
                          Ambulance details are currently unavailable.
                        </p>
                      ) : (
                        <>
                          <div style={styles.row}>
                            <span style={styles.rowLabel}>Vehicle</span>
                            <span style={styles.rowValue}>
                              {ambulance.vehicleNumber}
                            </span>
                          </div>

                          <div style={styles.row}>
                            <span style={styles.rowLabel}>Driver</span>
                            <span style={styles.rowValue}>
                              {ambulance.driverName}
                            </span>
                          </div>

                          <div style={styles.row}>
                            <span style={styles.rowLabel}>Driver Contact</span>
                            <span style={styles.rowValue}>
                              {ambulance.contactNumber}
                            </span>
                          </div>

                          <div style={styles.row}>
                            <span style={styles.rowLabel}>Ambulance Status</span>
                            <span style={styles.rowValue}>
                              {ambulance.status}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Live update */}
                    <div
                      style={{
                        ...styles.liveBox,
                        backgroundColor: `rgba(${theme.rgb}, 0.1)`,
                        border: `1px solid rgba(${theme.rgb}, 0.5)`,
                      }}
                    >
                      <strong style={{ color: theme.color }}>
                        Live Update:
                      </strong>{" "}
                      <span style={styles.liveText}>
                        {getLiveUpdate(emergency.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <hr style={styles.line} />

        {/* ===================================================== */}
        {/* 3. AVAILABLE AMBULANCES */}
        {/* ===================================================== */}
        <section>
          <h2 style={styles.sectionTitle}>
            🚑 Available Ambulances{" "}
            <span style={styles.count}>{ambulances.length}</span>
          </h2>

          {ambulances.length === 0 ? (
            <p style={styles.empty}>No ambulances currently available.</p>
          ) : (
            <div style={styles.grid}>
              {ambulances.map((ambulance) => (
                <div key={ambulance.id} style={styles.ambulanceCard}>
                  <div style={styles.cardTop}>
                    <h3 style={styles.cardTitle}>
                      🚑 {ambulance.vehicleNumber}
                    </h3>
                    <span style={{ ...styles.badge, ...styles.badgeGreen }}>
                      🟢 {ambulance.status}
                    </span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Driver</span>
                    <span style={styles.rowValue}>{ambulance.driverName}</span>
                  </div>

                  <div style={styles.row}>
                    <span style={styles.rowLabel}>Contact</span>
                    <span style={styles.rowValue}>
                      {ambulance.contactNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const css = `
  .dd-input {
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
  .dd-input:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  }
  .dd-input option {
    background-color: #1c212b;
    color: #e8eaed;
  }

  .dd-assign {
    width: 100%;
    padding: 14px;
    background: linear-gradient(180deg, #34d46a 0%, #16a34a 100%);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 0 0 1px rgba(80, 220, 120, 0.5),
                0 8px 24px rgba(34, 197, 94, 0.4);
    transition: transform 0.1s, box-shadow 0.15s, filter 0.15s;
  }
  .dd-assign:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 0 0 1px rgba(120, 240, 150, 0.7),
                0 10px 32px rgba(34, 197, 94, 0.6);
  }
  .dd-assign:active:not(:disabled) { transform: scale(0.98); }
  .dd-assign:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 3px;
  }
  .dd-assign:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
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

  dashboard: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
    backgroundColor: "#161b22",
    padding: "32px",
    borderRadius: "14px",
    border: "1px solid #262d3a",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.55)",
    color: "#e8eaed",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "28px",
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
    margin: "0 0 18px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
  },

  sectionNote: {
    margin: "-6px 0 18px",
    color: "#8b93a5",
    fontSize: "14px",
  },

  count: {
    marginLeft: "6px",
    padding: "2px 10px",
    borderRadius: "999px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    color: "#c3c8d4",
    fontSize: "13px",
    fontWeight: 600,
    verticalAlign: "middle",
  },

  empty: {
    margin: 0,
    color: "#8b93a5",
  },

  line: {
    margin: "32px 0",
    border: "none",
    borderTop: "1px solid #262d3a",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "14px",
  },

  pendingCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#1c212b",
    border: "1px solid rgba(255, 59, 59, 0.45)",
  },

  activeCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
  },

  ambulanceCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "18px 20px",
    borderRadius: "10px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#ffffff",
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

  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#c3c8d4",
  },

  assignBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px",
    paddingTop: "16px",
    borderTop: "1px solid #2a3140",
  },

  subPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "10px",
    padding: "16px",
    backgroundColor: "#161b22",
    border: "1px solid #2f3644",
    borderRadius: "8px",
  },

  subTitle: {
    margin: "0 0 4px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#ffffff",
  },

  unavailable: {
    margin: 0,
    color: "#8b93a5",
    fontSize: "14px",
  },

  liveBox: {
    marginTop: "10px",
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "14px",
  },

  liveText: {
    color: "#c3c8d4",
  },

  badge: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
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

  badgeGreen: {
    backgroundColor: "rgba(46, 160, 67, 0.18)",
    border: "1px solid rgba(46, 160, 67, 0.5)",
    color: "#56d364",
  },
};

export default DispatcherDashboard;
