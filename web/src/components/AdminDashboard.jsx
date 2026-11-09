import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

// ======================================================
// Status Theme
// ======================================================

const STATUS_THEME = {
  AVAILABLE: {
    color: "#56d364",
    rgb: "46, 160, 67",
  },

  ASSIGNED: {
    color: "#7db4ff",
    rgb: "59, 130, 246",
  },

  ON_THE_WAY: {
    color: "#b8a2ff",
    rgb: "139, 92, 246",
  },

  ARRIVED: {
    color: "#2dd4bf",
    rgb: "20, 184, 166",
  },

  BUSY: {
    color: "#fbbf24",
    rgb: "245, 158, 11",
  },

  OFFLINE: {
    color: "#8b93a5",
    rgb: "139, 147, 165",
  },
};

const DEFAULT_THEME = {
  color: "#c3c8d4",
  rgb: "139, 147, 165",
};

// ======================================================
// Admin Dashboard
// ======================================================

function AdminDashboard() {
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [users, setUsers] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);

  // ======================================================
  // Listen for ambulances
  // ======================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "ambulances"),
      (snapshot) => {
        const ambulanceList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAmbulances(ambulanceList);
      },
      (error) => {
        console.error(
          "Error listening to ambulances:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ======================================================
  // Listen for hospitals
  // ======================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "hospitals"),
      (snapshot) => {
        const hospitalList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHospitals(hospitalList);
      },
      (error) => {
        console.error(
          "Error listening to hospitals:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ======================================================
  // Listen for emergency requests
  // ======================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "emergency_requests"),
      (snapshot) => {
        const emergencyList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEmergencies(emergencyList);
      },
      (error) => {
        console.error(
          "Error listening to emergency requests:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ======================================================
  // Listen for users
  // ======================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(userList);
      },
      (error) => {
        console.error(
          "Error listening to users:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ======================================================
  // Listen for dispatchers
  // ======================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "dispatchers"),
      (snapshot) => {
        const dispatcherList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDispatchers(dispatcherList);
      },
      (error) => {
        console.error(
          "Error listening to dispatchers:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ======================================================
  // Statistics
  // ======================================================

  const availableAmbulances = ambulances.filter(
    (ambulance) =>
      ambulance.status === "AVAILABLE" ||
      ambulance.status === "available"
  ).length;

  const assignedAmbulances = ambulances.filter(
    (ambulance) =>
      ambulance.status === "ASSIGNED" ||
      ambulance.status === "ON_THE_WAY" ||
      ambulance.status === "ARRIVED"
  ).length;

  const activeEmergencies = emergencies.filter(
    (emergency) =>
      emergency.status !== "COMPLETED" &&
      emergency.status !== "CANCELLED"
  );

  const completedEmergencies = emergencies.filter(
    (emergency) =>
      emergency.status === "COMPLETED"
  );

  const highPriorityEmergencies = activeEmergencies.filter(
    (emergency) =>
      emergency.priority === "HIGH"
  );

  const onTheWayCount = emergencies.filter(
    (emergency) =>
      emergency.status === "ON_THE_WAY"
  ).length;

  const arrivedCount = emergencies.filter(
    (emergency) =>
      emergency.status === "ARRIVED"
  ).length;

  // ======================================================
  // Status helpers
  // ======================================================

  const getStatusTheme = (status) => {
    return STATUS_THEME[status] || DEFAULT_THEME;
  };

  const getStatusText = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "🟢 AVAILABLE";

      case "ASSIGNED":
        return "🔵 ASSIGNED";

      case "ON_THE_WAY":
        return "🟣 ON THE WAY";

      case "ARRIVED":
        return "🟢 ARRIVED";

      case "BUSY":
        return "🟡 BUSY";

      case "OFFLINE":
        return "⚪ OFFLINE";

      case "COMPLETED":
        return "✅ COMPLETED";

      case "CANCELLED":
        return "❌ CANCELLED";

      default:
        return status || "UNKNOWN";
    }
  };

  const priorityStyle = (priority) => {
    if (priority === "HIGH") {
      return styles.badgeRed;
    }

    if (priority === "MEDIUM") {
      return styles.badgeAmber;
    }

    return styles.badgeGreen;
  };

  // ======================================================
  // Render
  // ======================================================

  return (
    <div style={styles.container}>
      <style>{css}</style>

      <div style={styles.dashboard}>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div style={styles.header}>

          <div>
            <h1 style={styles.title}>
              ⚙️ Admin Dashboard
            </h1>

            <p style={styles.subtitle}>
              Monitor and manage the entire emergency
              ambulance management system.
            </p>
          </div>

          <div style={styles.liveIndicator}>
            <span style={styles.liveDot}></span>
            LIVE
          </div>

        </div>

        {/* ================================================= */}
        {/* SYSTEM SUMMARY */}
        {/* ================================================= */}

        <div style={styles.summaryGrid}>

          {/* Ambulances */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🚑
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Total Ambulances
              </p>

              <h2 style={styles.summaryValue}>
                {ambulances.length}
              </h2>

              <p style={styles.summarySubtext}>
                {availableAmbulances} available
              </p>
            </div>
          </div>

          {/* Hospitals */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🏥
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Hospitals
              </p>

              <h2 style={styles.summaryValue}>
                {hospitals.length}
              </h2>

              <p style={styles.summarySubtext}>
                Registered hospitals
              </p>
            </div>
          </div>

          {/* Active Emergencies */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🚨
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Active Emergencies
              </p>

              <h2 style={styles.summaryValue}>
                {activeEmergencies.length}
              </h2>

              <p style={styles.summarySubtext}>
                {highPriorityEmergencies.length} high priority
              </p>
            </div>
          </div>

          {/* Users */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              👥
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Registered Users
              </p>

              <h2 style={styles.summaryValue}>
                {users.length}
              </h2>

              <p style={styles.summarySubtext}>
                System users
              </p>
            </div>
          </div>

        </div>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* EMERGENCY OVERVIEW */}
        {/* ================================================= */}

        <section>

          <div style={styles.sectionHeader}>

            <h2 style={styles.sectionTitle}>
              🚨 Emergency Overview
              <span style={styles.count}>
                {activeEmergencies.length}
              </span>
            </h2>

            <span style={styles.sectionLive}>
              ● LIVE UPDATES
            </span>

          </div>

          <p style={styles.sectionNote}>
            Real-time overview of current emergency
            requests across the system.
          </p>

          <div style={styles.overviewGrid}>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>
                🚨
              </div>

              <div>
                <p style={styles.overviewLabel}>
                  Active Emergencies
                </p>

                <h3 style={styles.overviewValue}>
                  {activeEmergencies.length}
                </h3>
              </div>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>
                🟣
              </div>

              <div>
                <p style={styles.overviewLabel}>
                  Ambulances On The Way
                </p>

                <h3 style={styles.overviewValue}>
                  {onTheWayCount}
                </h3>
              </div>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>
                🏥
              </div>

              <div>
                <p style={styles.overviewLabel}>
                  Arrived
                </p>

                <h3 style={styles.overviewValue}>
                  {arrivedCount}
                </h3>
              </div>
            </div>

            <div style={styles.overviewCard}>
              <div style={styles.overviewIcon}>
                ✅
              </div>

              <div>
                <p style={styles.overviewLabel}>
                  Completed
                </p>

                <h3 style={styles.overviewValue}>
                  {completedEmergencies.length}
                </h3>
              </div>
            </div>

          </div>

        </section>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* ACTIVE EMERGENCIES */}
        {/* ================================================= */}

        <section>

          <div style={styles.sectionHeader}>

            <h2 style={styles.sectionTitle}>
              🚨 Active Emergency Requests
              <span style={styles.count}>
                {activeEmergencies.length}
              </span>
            </h2>

          </div>

          <p style={styles.sectionNote}>
            Monitor emergency requests currently being
            handled by the system.
          </p>

          {activeEmergencies.length === 0 ? (

            <div style={styles.emptyBox}>

              <div style={styles.emptyIcon}>
                ✅
              </div>

              <h3 style={styles.emptyTitle}>
                No Active Emergencies
              </h3>

              <p style={styles.emptyText}>
                There are currently no active emergency
                requests.
              </p>

            </div>

          ) : (

            <div style={styles.list}>

              {activeEmergencies.map((emergency) => {

                const theme =
                  getStatusTheme(emergency.status);

                return (
                  <div
                    key={emergency.id}
                    className="admin-card"
                    style={styles.emergencyCard}
                  >

                    <div style={styles.cardTop}>

                      <div>

                        <h3 style={styles.cardTitle}>
                          {emergency.emergencyType ||
                            "Emergency"}
                        </h3>

                        <p style={styles.requestId}>
                          Request ID: {emergency.id}
                        </p>

                      </div>

                      <div
                        style={{
                          ...styles.badge,
                          color: theme.color,
                          backgroundColor:
                            `rgba(${theme.rgb}, 0.18)`,
                          border:
                            `1px solid rgba(${theme.rgb}, 0.6)`,
                        }}
                      >
                        {getStatusText(
                          emergency.status
                        )}
                      </div>

                    </div>

                    <div style={styles.infoGrid}>

                      <div style={styles.infoBox}>

                        <span style={styles.infoLabel}>
                          Priority
                        </span>

                        <span
                          style={{
                            ...styles.badge,
                            ...priorityStyle(
                              emergency.priority
                            ),
                          }}
                        >
                          {emergency.priority ||
                            "NORMAL"}
                        </span>

                      </div>

                      <div style={styles.infoBox}>

                        <span style={styles.infoLabel}>
                          Caller
                        </span>

                        <span style={styles.infoValue}>
                          {emergency.callerName ||
                            "Unknown"}
                        </span>

                      </div>

                      <div style={styles.infoBox}>

                        <span style={styles.infoLabel}>
                          Contact
                        </span>

                        <span style={styles.infoValue}>
                          {emergency.contactNumber ||
                            "Not available"}
                        </span>

                      </div>

                      <div style={styles.infoBox}>

                        <span style={styles.infoLabel}>
                          Patients
                        </span>

                        <span style={styles.infoValue}>
                          {emergency.patientCount || 0}
                        </span>

                      </div>

                      <div style={styles.infoBox}>

                        <span style={styles.infoLabel}>
                          Location
                        </span>

                        <span style={styles.infoValue}>
                          {emergency.address ||
                            "Location unavailable"}
                        </span>

                      </div>

                      <div style={styles.infoBox}>

                        <span style={styles.infoLabel}>
                          Ambulance
                        </span>

                        <span style={styles.infoValue}>
                          {emergency.assignedAmbulanceId ||
                            "Not assigned"}
                        </span>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* AMBULANCE FLEET */}
        {/* ================================================= */}

        <section>

          <div style={styles.sectionHeader}>

            <h2 style={styles.sectionTitle}>
              🚑 Ambulance Fleet
              <span style={styles.count}>
                {ambulances.length}
              </span>
            </h2>

            <span style={styles.sectionLive}>
              ● LIVE STATUS
            </span>

          </div>

          <p style={styles.sectionNote}>
            Monitor the current status of all registered
            ambulances.
          </p>

          {ambulances.length === 0 ? (

            <div style={styles.emptyBox}>

              <div style={styles.emptyIcon}>
                🚑
              </div>

              <h3 style={styles.emptyTitle}>
                No Ambulances Registered
              </h3>

              <p style={styles.emptyText}>
                Ambulances will appear here when they are
                added to the system.
              </p>

            </div>

          ) : (

            <div style={styles.list}>

              {ambulances.map((ambulance) => {

                const theme =
                  getStatusTheme(ambulance.status);

                return (
                  <div
                    key={ambulance.id}
                    className="admin-card"
                    style={styles.fleetCard}
                  >

                    <div style={styles.fleetIcon}>
                      🚑
                    </div>

                    <div style={styles.fleetMain}>

                      <h3 style={styles.cardTitle}>
                        {ambulance.vehicleNumber ||
                          ambulance.id}
                      </h3>

                      <p style={styles.fleetDetails}>
                        Driver:{" "}
                        {ambulance.driverName ||
                          "Not assigned"}
                      </p>

                      <p style={styles.fleetDetails}>
                        Contact:{" "}
                        {ambulance.contactNumber ||
                          "Not available"}
                      </p>

                    </div>

                    <div
                      style={{
                        ...styles.badge,
                        color: theme.color,
                        backgroundColor:
                          `rgba(${theme.rgb}, 0.18)`,
                        border:
                          `1px solid rgba(${theme.rgb}, 0.6)`,
                      }}
                    >
                      {getStatusText(
                        ambulance.status
                      )}
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* SYSTEM MANAGEMENT */}
        {/* ================================================= */}

        <section>

          <h2 style={styles.sectionTitle}>
            ⚙️ System Management
          </h2>

          <p style={styles.sectionNote}>
            Overview of the main resources managed by
            the administrator.
          </p>

          <div style={styles.managementGrid}>

            {/* Ambulances */}

            <div
              className="admin-card"
              style={styles.managementCard}
            >

              <div style={styles.managementIcon}>
                🚑
              </div>

              <div style={styles.managementMain}>

                <h3 style={styles.managementTitle}>
                  Ambulances
                </h3>

                <p style={styles.managementText}>
                  {ambulances.length} registered ambulance(s)
                </p>

                <p style={styles.managementStatus}>
                  {availableAmbulances} currently available
                </p>

              </div>

              <span style={styles.managementArrow}>
                →
              </span>

            </div>

            {/* Hospitals */}

            <div
              className="admin-card"
              style={styles.managementCard}
            >

              <div style={styles.managementIcon}>
                🏥
              </div>

              <div style={styles.managementMain}>

                <h3 style={styles.managementTitle}>
                  Hospitals
                </h3>

                <p style={styles.managementText}>
                  {hospitals.length} registered hospital(s)
                </p>

                <p style={styles.managementStatus}>
                  Hospital network
                </p>

              </div>

              <span style={styles.managementArrow}>
                →
              </span>

            </div>

            {/* Users */}

            <div
              className="admin-card"
              style={styles.managementCard}
            >

              <div style={styles.managementIcon}>
                👥
              </div>

              <div style={styles.managementMain}>

                <h3 style={styles.managementTitle}>
                  Users
                </h3>

                <p style={styles.managementText}>
                  {users.length} registered user(s)
                </p>

                <p style={styles.managementStatus}>
                  Patient accounts
                </p>

              </div>

              <span style={styles.managementArrow}>
                →
              </span>

            </div>

            {/* Dispatchers */}

            <div
              className="admin-card"
              style={styles.managementCard}
            >

              <div style={styles.managementIcon}>
                📞
              </div>

              <div style={styles.managementMain}>

                <h3 style={styles.managementTitle}>
                  Dispatchers
                </h3>

                <p style={styles.managementText}>
                  {dispatchers.length} dispatcher(s)
                </p>

                <p style={styles.managementStatus}>
                  Emergency operations
                </p>

              </div>

              <span style={styles.managementArrow}>
                →
              </span>

            </div>

          </div>

        </section>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* SYSTEM STATUS */}
        {/* ================================================= */}

        <section>

          <h2 style={styles.sectionTitle}>
            🖥️ System Status
          </h2>

          <div style={styles.statusGrid}>

            <div style={styles.systemStatusCard}>

              <span style={styles.systemDot}></span>

              <div>
                <h3 style={styles.systemTitle}>
                  Firestore
                </h3>

                <p style={styles.systemText}>
                  Real-time database connected
                </p>
              </div>

              <span style={styles.onlineText}>
                ONLINE
              </span>

            </div>

            <div style={styles.systemStatusCard}>

              <span style={styles.systemDot}></span>

              <div>
                <h3 style={styles.systemTitle}>
                  Emergency Monitoring
                </h3>

                <p style={styles.systemText}>
                  Live emergency updates active
                </p>
              </div>

              <span style={styles.onlineText}>
                ACTIVE
              </span>

            </div>

            <div style={styles.systemStatusCard}>

              <span style={styles.systemDot}></span>

              <div>
                <h3 style={styles.systemTitle}>
                  Ambulance Tracking
                </h3>

                <p style={styles.systemText}>
                  Ambulance status monitoring active
                </p>
              </div>

              <span style={styles.onlineText}>
                ACTIVE
              </span>

            </div>

          </div>

        </section>

      </div>
    </div>
  );
}

// ======================================================
// CSS
// ======================================================

const css = `
  .admin-card {
    transition:
      transform 0.15s,
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .admin-card:hover {
    transform: translateY(-2px);
    border-color: #394354 !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  }

  @media (max-width: 700px) {
    .admin-card {
      transform: none !important;
    }
  }
`;

// ======================================================
// Styles
// ======================================================

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

  // --------------------------------------------------
  // Header
  // --------------------------------------------------

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
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

  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: "rgba(46, 160, 67, 0.12)",
    border: "1px solid rgba(46, 160, 67, 0.4)",
    color: "#56d364",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#2ea043",
    boxShadow:
      "0 0 8px rgba(46, 160, 67, 0.8)",
  },

  // --------------------------------------------------
  // Summary
  // --------------------------------------------------

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },

  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "10px",
  },

  summaryIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    backgroundColor: "#252c38",
    fontSize: "22px",
  },

  summaryLabel: {
    margin: 0,
    color: "#8b93a5",
    fontSize: "13px",
  },

  summaryValue: {
    margin: "4px 0 0",
    color: "#ffffff",
    fontSize: "25px",
    fontWeight: 700,
  },

  summarySubtext: {
    margin: "3px 0 0",
    color: "#6f7787",
    fontSize: "11px",
  },

  // --------------------------------------------------
  // Lines
  // --------------------------------------------------

  line: {
    margin: "32px 0",
    border: "none",
    borderTop: "1px solid #262d3a",
  },

  // --------------------------------------------------
  // Sections
  // --------------------------------------------------

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "6px",
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

  sectionLive: {
    color: "#56d364",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    marginBottom: "18px",
  },

  count: {
    marginLeft: "7px",
    padding: "2px 10px",
    borderRadius: "999px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    color: "#c3c8d4",
    fontSize: "13px",
    fontWeight: 600,
    verticalAlign: "middle",
  },

  // --------------------------------------------------
  // Overview
  // --------------------------------------------------

  overviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },

  overviewCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "16px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "10px",
  },

  overviewIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    backgroundColor: "#252c38",
    fontSize: "20px",
  },

  overviewLabel: {
    margin: 0,
    color: "#8b93a5",
    fontSize: "12px",
  },

  overviewValue: {
    margin: "4px 0 0",
    color: "#ffffff",
    fontSize: "22px",
  },

  // --------------------------------------------------
  // List
  // --------------------------------------------------

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  // --------------------------------------------------
  // Emergency Card
  // --------------------------------------------------

  emergencyCard: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
    color: "#ffffff",
  },

  requestId: {
    margin: "5px 0 0",
    color: "#6f7787",
    fontSize: "12px",
  },

  // --------------------------------------------------
  // Information
  // --------------------------------------------------

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "10px",
  },

  infoBox: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "11px 13px",
    backgroundColor: "#161b22",
    border: "1px solid #2a3140",
    borderRadius: "8px",
  },

  infoLabel: {
    color: "#737c8e",
    fontSize: "12px",
  },

  infoValue: {
    color: "#e8eaed",
    fontSize: "14px",
    fontWeight: 500,
  },

  // --------------------------------------------------
  // Fleet
  // --------------------------------------------------

  fleetCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "10px",
  },

  fleetIcon: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    backgroundColor: "#252c38",
    fontSize: "21px",
  },

  fleetMain: {
    flex: 1,
  },

  fleetDetails: {
    margin: "4px 0 0",
    color: "#8b93a5",
    fontSize: "13px",
  },

  // --------------------------------------------------
  // Badges
  // --------------------------------------------------

  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },

  badgeRed: {
    backgroundColor:
      "rgba(255, 59, 59, 0.14)",
    border:
      "1px solid rgba(255, 59, 59, 0.5)",
    color: "#ff7b7b",
  },

  badgeAmber: {
    backgroundColor:
      "rgba(245, 158, 11, 0.14)",
    border:
      "1px solid rgba(245, 158, 11, 0.5)",
    color: "#fbbf24",
  },

  badgeGreen: {
    backgroundColor:
      "rgba(46, 160, 67, 0.18)",
    border:
      "1px solid rgba(46, 160, 67, 0.5)",
    color: "#56d364",
  },

  // --------------------------------------------------
  // Management
  // --------------------------------------------------

  managementGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "14px",
  },

  managementCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "10px",
    cursor: "pointer",
  },

  managementIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    backgroundColor: "#252c38",
    fontSize: "22px",
  },

  managementMain: {
    flex: 1,
  },

  managementTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
  },

  managementText: {
    margin: "5px 0 0",
    color: "#8b93a5",
    fontSize: "13px",
  },

  managementStatus: {
    margin: "3px 0 0",
    color: "#6f7787",
    fontSize: "12px",
  },

  managementArrow: {
    color: "#737c8e",
    fontSize: "22px",
  },

  // --------------------------------------------------
  // Empty State
  // --------------------------------------------------

  emptyBox: {
    padding: "45px 20px",
    textAlign: "center",
    backgroundColor: "#1c212b",
    border: "1px dashed #353d4c",
    borderRadius: "10px",
  },

  emptyIcon: {
    fontSize: "34px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "0 0 6px",
    color: "#ffffff",
    fontSize: "17px",
  },

  emptyText: {
    margin: 0,
    color: "#8b93a5",
    fontSize: "14px",
  },

  // --------------------------------------------------
  // System Status
  // --------------------------------------------------

  statusGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
  },

  systemStatusCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "9px",
  },

  systemDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: "#2ea043",
    boxShadow:
      "0 0 8px rgba(46, 160, 67, 0.7)",
    flexShrink: 0,
  },

  systemTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "14px",
  },

  systemText: {
    margin: "4px 0 0",
    color: "#737c8e",
    fontSize: "12px",
  },

  onlineText: {
    marginLeft: "auto",
    color: "#56d364",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
};

export default AdminDashboard;

