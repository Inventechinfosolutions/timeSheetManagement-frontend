import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Users, Eye, Search } from "lucide-react";

import { fetchMonthlyAttendance } from "../reducers/employeeAttendance.reducer"; // Import the new thunk

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const dispatch = useAppDispatch();
  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails
  );

  const { employeeRecords } = useAppSelector(
    (state: RootState) => state.attendance
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      getEntities({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
      })
    );
  }, [dispatch, currentPage, debouncedSearchTerm]);

  // Fetch attendance for each employee when entities change
  useEffect(() => {
    if (entities.length > 0) {
      const now = new Date();
      // Backend expects month as "01", "02", etc.
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      const currentYear = now.getFullYear().toString();

      entities.forEach((emp: any) => {
        const empId = emp.employeeId || emp.id;
        if (empId) {
          dispatch(
            fetchMonthlyAttendance({
              employeeId: empId,
              month: currentMonth,
              year: currentYear,
            })
          );
        }
      });
    }
  }, [dispatch, entities]);

  const employees = entities.map((emp: any) => {
    const empId = emp.employeeId || emp.id;
    const records = employeeRecords[empId] || [];

    let totalMinutes = 0;
    records.forEach((record: any) => {
      if (record.totalHours) {
        if (typeof record.totalHours === "number") {
          totalMinutes += record.totalHours * 60;
        } else if (
          typeof record.totalHours === "string" &&
          record.totalHours.includes(":")
        ) {
          const [h, m] = record.totalHours.split(":").map(Number);
          totalMinutes += (h || 0) * 60 + (m || 0);
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const formattedHours = totalMinutes > 0 ? `${hours}h ${minutes}m` : "--";

    return {
      id: empId,
      name: emp.fullName || emp.name,
      dept: emp.department || emp.dept,
      hours: formattedHours,
    };
  });

  // Calculate Dashboard Total Hours (Sum of all LOADED records for visible employees)
  const calculateDashboardTotalHours = () => {
    let totalAllMinutes = 0;

    // Iterate over all keys in employeeRecords that correspond to currently visible entities
    // OR strictly sum up everything in employeeRecords?
    // Let's sum up for visible entities to be consistent with the view
    entities.forEach((emp: any) => {
      const empId = emp.employeeId || emp.id;
      const records = employeeRecords[empId] || [];

      records.forEach((record: any) => {
        if (record.totalHours) {
          if (typeof record.totalHours === "number") {
            totalAllMinutes += record.totalHours * 60;
          } else if (
            typeof record.totalHours === "string" &&
            record.totalHours.includes(":")
          ) {
            const [h, m] = record.totalHours.split(":").map(Number);
            totalAllMinutes += (h || 0) * 60 + (m || 0);
          }
        }
      });
    });

    const hours = Math.floor(totalAllMinutes / 60);
    const minutes = Math.round(totalAllMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const totalHoursDisplay = calculateDashboardTotalHours();

  const styles = {
    container: {
      padding: "20px",
      backgroundColor: "#F4F7FE",
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#2B3674",
      margin: 0,
    },
    card: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "20px",
      boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
      marginBottom: "30px",
      display: "flex",
      alignItems: "center",
      maxWidth: "300px",
    },
    iconBox: {
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      backgroundColor: "#F4F7FE",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: "15px",
      color: "#4318FF",
    },
    metricValue: {
      fontSize: "34px",
      fontWeight: "700",
      color: "#2B3674",
      margin: 0,
      lineHeight: "1",
    },
    metricLabel: {
      fontSize: "14px",
      color: "#A3AED0",
      marginTop: "5px",
      margin: 0,
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
      overflowX: "auto" as const,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
    },
    th: {
      textAlign: "left" as const,
      padding: "15px",
      borderBottom: "1px solid #E9EDF7",
      color: "#A3AED0",
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "uppercase" as const,
    },
    td: {
      padding: "15px",
      borderBottom: "1px solid #E9EDF7",
      color: "#2B3674",
      fontSize: "14px",
      fontWeight: "500",
    },
    actionBtn: {
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#4318FF",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "14px",
    },
  };

  const handleViewTimesheet = (empId: string) => {
    navigate(`/admin-dashboard/timesheet/${empId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: "30px",
            padding: "10px 20px",
            boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
            minWidth: "250px",
          }}
        >
          <Search size={18} color="#A3AED0" style={{ marginRight: "10px" }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              color: "#2B3674",
              width: "100%",
              fontSize: "14px",
              fontWeight: "500",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div style={styles.card}>
          <div style={styles.iconBox}>
            <Users size={24} />
          </div>
          <div>
            <p style={styles.metricLabel}>Total Employees</p>
            <h3 style={styles.metricValue}>{totalItems || entities.length}</h3>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.iconBox}>
            <Users size={24} />
          </div>
          <div>
            <p style={styles.metricLabel}>Total Hours</p>
            <h3 style={styles.metricValue}>{totalHoursDisplay}</h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <h3 style={{ ...styles.title, marginBottom: "20px", fontSize: "20px" }}>
          Employee List
        </h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Work Hours</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td style={styles.td}>{emp.name}</td>
                <td style={styles.td}>{emp.id}</td>
                <td style={styles.td}>{emp.hours}</td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...styles.td, textAlign: "center" }}>
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: "20px",
            gap: "10px",
          }}
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #E9EDF7",
              backgroundColor: currentPage === 1 ? "#F4F7FE" : "white",
              color: currentPage === 1 ? "#A3AED0" : "#2B3674",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Previous
          </button>
          <span
            style={{ fontSize: "14px", color: "#2B3674", fontWeight: "500" }}
          >
            Page {currentPage} of {Math.ceil(totalItems / itemsPerPage) || 1}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                prev * itemsPerPage < totalItems ? prev + 1 : prev
              )
            }
            disabled={currentPage * itemsPerPage >= totalItems}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #E9EDF7",
              backgroundColor:
                currentPage * itemsPerPage >= totalItems ? "#F4F7FE" : "white",
              color:
                currentPage * itemsPerPage >= totalItems
                  ? "#A3AED0"
                  : "#2B3674",
              cursor:
                currentPage * itemsPerPage >= totalItems
                  ? "not-allowed"
                  : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
