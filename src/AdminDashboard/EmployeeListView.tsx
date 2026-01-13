import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Eye, Search } from "lucide-react";

const EmployeeListView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const dispatch = useAppDispatch();
  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails
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

  const employees = entities.map((emp: any) => ({
    id: emp.employeeId || emp.id,
    name: emp.fullName || emp.name,
    dept: emp.department || emp.dept,
    hours: emp.totalHours || emp.hours || "--",
  }));

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

  const handleViewDetails = (empId: string) => {
    navigate(`/admin-dashboard/employee-details/${empId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Employee List</h1>

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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>ID</th>
              {/* <th style={styles.th}>Work Hours</th> */}
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td style={styles.td}>{emp.name}</td>
                <td style={styles.td}>{emp.id}</td>
                {/* <td style={styles.td}>{emp.hours}</td> */}
                <td style={styles.td}>
                  <button
                    style={styles.actionBtn}
                    onClick={() => handleViewDetails(emp.id)}
                  >
                    <Eye size={16} /> View
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.td, textAlign: "center" }}>
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeListView;
