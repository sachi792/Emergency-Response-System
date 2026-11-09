import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

// --------------------------------------------------
// Status theme
// --------------------------------------------------

const STATUS_THEME = {
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
};

const DEFAULT_THEME = {
  color: "#c3c8d4",
  rgb: "139, 147, 165",
};

// --------------------------------------------------
// Hospital Dashboard
// --------------------------------------------------

function HospitalDashboard() {
  const [incomingEmergencies, setIncomingEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);

  // --------------------------------------------------
  // Listen for active emergencies
  // ASSIGNED, ON_THE_WAY, ARRIVED
  // --------------------------------------------------

  useEffect(() => {
    const q = query(
      collection(db, "emergency_requests"),
      where("status", "in", [
        "ASSIGNED",
        "ON_THE_WAY",
        "ARRIVED",
      ])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const emergencies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setIncomingEmergencies(emergencies);
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

  // --------------------------------------------------
  // Listen for all ambulances
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Find ambulance details
  // --------------------------------------------------

  const getAmbulanceDetails = (ambulanceId) => {
    return ambulances.find(
      (ambulance) => ambulance.id === ambulanceId
    );
  };

  // --------------------------------------------------
  // Status text
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
  // Live update message
  // --------------------------------------------------

  const getLiveUpdate = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "Ambulance has been assigned and is preparing to respond.";

      case "ON_THE_WAY":
        return "Ambulance is currently travelling to the emergency location.";

      case "ARRIVED":
        return "Ambulance has arrived at the emergency location.";

      default:
        return "Waiting for status update.";
    }
  };

  // --------------------------------------------------
  // Priority style
  // --------------------------------------------------

  const priorityStyle = (priority) => {
    if (priority === "HIGH") {
      return styles.badgeRed;
    }

    if (priority === "MEDIUM") {
      return styles.badgeAmber;
    }

    return styles.badgeGreen;
  };

  // --------------------------------------------------
  // Dashboard statistics
  // --------------------------------------------------

  const incomingCount = incomingEmergencies.filter(
    (emergency) =>
      emergency.status === "ASSIGNED" ||
      emergency.status === "ON_THE_WAY"
  ).length;

  const highPriorityCount = incomingEmergencies.filter(
    (emergency) =>
      emergency.priority === "HIGH" &&
      emergency.status !== "ARRIVED"
  ).length;

  const arrivingSoonCount = incomingEmergencies.filter(
    (emergency) =>
      emergency.status === "ON_THE_WAY"
  ).length;

  const arrivedCount = incomingEmergencies.filter(
    (emergency) =>
      emergency.status === "ARRIVED"
  ).length;

  // --------------------------------------------------
  // Recent arrivals
  // --------------------------------------------------

  const recentArrivals = incomingEmergencies
    .filter((emergency) => emergency.status === "ARRIVED")
    .slice()
    .sort((a, b) => {
      const timeA = a.arrivedAt?.seconds || 0;
      const timeB = b.arrivedAt?.seconds || 0;

      return timeB - timeA;
    });

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

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
              🏥 Hospital Dashboard
            </h1>

            <p style={styles.subtitle}>
              Monitor incoming ambulances and emergency patients
              in real time.
            </p>
          </div>

          <div style={styles.liveIndicator}>
            <span style={styles.liveDot}></span>
            LIVE
          </div>
        </div>

        {/* ================================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================================= */}

        <div style={styles.summaryGrid}>

          {/* Incoming */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🚑
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Incoming Ambulances
              </p>

              <h2 style={styles.summaryValue}>
                {incomingCount}
              </h2>
            </div>
          </div>

          {/* High Priority */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🚨
            </div>

            <div>
              <p style={styles.summaryLabel}>
                High Priority
              </p>

              <h2 style={styles.summaryValue}>
                {highPriorityCount}
              </h2>
            </div>
          </div>

          {/* Arriving Soon */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🟡
            </div>

            <div>
              <p style={styles.summaryLabel}>
                On The Way
              </p>

              <h2 style={styles.summaryValue}>
                {arrivingSoonCount}
              </h2>
            </div>
          </div>

          {/* Arrived */}

          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>
              🟢
            </div>

            <div>
              <p style={styles.summaryLabel}>
                Arrived
              </p>

              <h2 style={styles.summaryValue}>
                {arrivedCount}
              </h2>
            </div>
          </div>

        </div>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* INCOMING AMBULANCES */}
        {/* ================================================= */}

        <section>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              🚑 Incoming Ambulances
              <span style={styles.count}>
                {incomingCount}
              </span>
            </h2>

            <span style={styles.sectionLive}>
              ● LIVE UPDATES
            </span>
          </div>

          <p style={styles.sectionNote}>
            Ambulances assigned to active emergencies are shown
            here automatically.
          </p>

          {incomingEmergencies.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={styles.emptyIcon}>
                🏥
              </div>

              <h3 style={styles.emptyTitle}>
                No Incoming Ambulances
              </h3>

              <p style={styles.emptyText}>
                There are currently no active ambulance
                emergencies.
              </p>
            </div>
          ) : (
            <div style={styles.list}>

              {incomingEmergencies.map((emergency) => {

                const ambulance =
                  getAmbulanceDetails(
                    emergency.assignedAmbulanceId
                  );

                const theme =
                  STATUS_THEME[emergency.status] ||
                  DEFAULT_THEME;

                return (
                  <div
                    key={emergency.id}
                    style={styles.ambulanceCard}
                  >

                    {/* Card header */}

                    <div style={styles.cardTop}>

                      <div>
                        <h3 style={styles.cardTitle}>
                          {emergency.emergencyType ||
                            "Emergency"}
                          {" - "}
                          {emergency.patientCount || 0}
                          {" "}
                          patient(s)
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

                    {/* Emergency information */}

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
                          Emergency Location
                        </span>

                        <span style={styles.infoValue}>
                          {emergency.address ||
                            "Location unavailable"}
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

                    </div>

                    {/* Ambulance information */}

                    <div style={styles.subPanel}>

                      <h4 style={styles.subTitle}>
                        🚑 Assigned Ambulance
                      </h4>

                      {!ambulance ? (
                        <p style={styles.unavailable}>
                          Waiting for ambulance details...
                        </p>
                      ) : (
                        <div style={styles.infoGrid}>

                          <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>
                              Vehicle
                            </span>

                            <span style={styles.infoValue}>
                              {ambulance.vehicleNumber ||
                                ambulance.id}
                            </span>
                          </div>

                          <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>
                              Driver
                            </span>

                            <span style={styles.infoValue}>
                              {ambulance.driverName ||
                                "Unknown"}
                            </span>
                          </div>

                          <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>
                              Driver Contact
                            </span>

                            <span style={styles.infoValue}>
                              {ambulance.contactNumber ||
                                "Not available"}
                            </span>
                          </div>

                          <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>
                              Ambulance Status
                            </span>

                            <span style={styles.infoValue}>
                              {ambulance.status ||
                                "UNKNOWN"}
                            </span>
                          </div>

                        </div>
                      )}

                    </div>

                    {/* Live update */}

                    <div
                      style={{
                        ...styles.liveBox,
                        backgroundColor:
                          `rgba(${theme.rgb}, 0.10)`,
                        border:
                          `1px solid rgba(${theme.rgb}, 0.5)`,
                      }}
                    >
                      <strong
                        style={{
                          color: theme.color,
                        }}
                      >
                        Live Update:
                      </strong>

                      <span style={styles.liveText}>
                        {" "}
                        {getLiveUpdate(
                          emergency.status
                        )}
                      </span>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* RECENT ARRIVALS */}
        {/* ================================================= */}

        <section>

          <h2 style={styles.sectionTitle}>
            🏥 Recent Patient Arrivals
            <span style={styles.count}>
              {recentArrivals.length}
            </span>
          </h2>

          <p style={styles.sectionNote}>
            Patients whose assigned ambulance has reached
            the emergency location.
          </p>

          {recentArrivals.length === 0 ? (
            <p style={styles.empty}>
              No recent arrivals.
            </p>
          ) : (
            <div style={styles.list}>

              {recentArrivals.map((emergency) => {

                const ambulance =
                  getAmbulanceDetails(
                    emergency.assignedAmbulanceId
                  );

                return (
                  <div
                    key={emergency.id}
                    style={styles.arrivalCard}
                  >

                    <div style={styles.arrivalIcon}>
                      🏥
                    </div>

                    <div style={styles.arrivalMain}>

                      <h3 style={styles.cardTitle}>
                        {emergency.emergencyType ||
                          "Emergency"}
                      </h3>

                      <p style={styles.arrivalDetails}>
                        {emergency.patientCount || 0}
                        {" patient(s) • "}
                        {ambulance?.vehicleNumber ||
                          "Ambulance"}
                      </p>

                    </div>

                    <div style={styles.arrivalStatus}>
                      <span
                        style={{
                          ...styles.badge,
                          ...styles.badgeGreen,
                        }}
                      >
                        🟢 ARRIVED
                      </span>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        <hr style={styles.line} />

        {/* ================================================= */}
        {/* HOSPITAL PREPARATION */}
        {/* ================================================= */}

        <section>

          <h2 style={styles.sectionTitle}>
            🩺 Hospital Preparation
          </h2>

          <p style={styles.sectionNote}>
            Use the incoming emergency information to prepare
            the relevant hospital resources.
          </p>

          <div style={styles.preparationGrid}>

            <div style={styles.preparationCard}>
              <div style={styles.preparationIcon}>
                🚨
              </div>

              <div>
                <h3 style={styles.preparationTitle}>
                  Emergency Cases
                </h3>

                <p style={styles.preparationText}>
                  {incomingCount} active ambulance case(s)
                  currently being handled.
                </p>
              </div>
            </div>

            <div style={styles.preparationCard}>
              <div style={styles.preparationIcon}>
                ❤️
              </div>

              <div>
                <h3 style={styles.preparationTitle}>
                  High Priority
                </h3>

                <p style={styles.preparationText}>
                  {highPriorityCount} high-priority case(s)
                  require immediate attention.
                </p>
              </div>
            </div>

            <div style={styles.preparationCard}>
              <div style={styles.preparationIcon}>
                👨‍⚕️
              </div>

              <div>
                <h3 style={styles.preparationTitle}>
                  Prepare Staff
                </h3>

                <p style={styles.preparationText}>
                  Hospital staff can monitor incoming cases
                  before the ambulance arrives.
                </p>
              </div>
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
  .hospital-card {
    transition:
      transform 0.15s,
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .hospital-card:hover {
    transform: translateY(-2px);
    border-color: #394354 !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
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
    boxShadow: "0 0 8px rgba(46, 160, 67, 0.8)",
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

  // --------------------------------------------------
  // Sections
  // --------------------------------------------------

  line: {
    margin: "32px 0",
    border: "none",
    borderTop: "1px solid #262d3a",
  },

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

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  // --------------------------------------------------
  // Ambulance Card
  // --------------------------------------------------

  ambulanceCard: {
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
  // Info
  // --------------------------------------------------

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
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
  // Ambulance sub panel
  // --------------------------------------------------

  subPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px",
    backgroundColor: "#161b22",
    border: "1px solid #2f3644",
    borderRadius: "8px",
  },

  subTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#ffffff",
  },

  unavailable: {
    margin: 0,
    color: "#8b93a5",
    fontSize: "14px",
  },

  // --------------------------------------------------
  // Live update
  // --------------------------------------------------

  liveBox: {
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "14px",
  },

  liveText: {
    color: "#c3c8d4",
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

  // --------------------------------------------------
  // Empty state
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

  empty: {
    margin: 0,
    color: "#8b93a5",
  },

  // --------------------------------------------------
  // Recent arrivals
  // --------------------------------------------------

  arrivalCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "10px",
  },

  arrivalIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    backgroundColor: "#252c38",
    fontSize: "20px",
  },

  arrivalMain: {
    flex: 1,
  },

  arrivalDetails: {
    margin: "5px 0 0",
    color: "#8b93a5",
    fontSize: "13px",
  },

  arrivalStatus: {
    display: "flex",
    alignItems: "center",
  },

  // --------------------------------------------------
  // Preparation
  // --------------------------------------------------

  preparationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "14px",
  },

  preparationCard: {
    display: "flex",
    gap: "14px",
    padding: "18px",
    backgroundColor: "#1c212b",
    border: "1px solid #2f3644",
    borderRadius: "10px",
  },

  preparationIcon: {
    fontSize: "25px",
  },

  preparationTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "15px",
  },

  preparationText: {
    margin: "6px 0 0",
    color: "#8b93a5",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};

export default HospitalDashboard;