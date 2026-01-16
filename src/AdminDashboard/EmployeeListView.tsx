import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Eye, Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

const EmployeeListView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Server-side pagination limit

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

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

  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const departments = ["All", "HR", "IT", "Sales", "Marketing", "Finance"];

  useEffect(() => {
    dispatch(
      getEntities({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        sort: sortConfig.key || undefined,
        order: sortConfig.key ? sortConfig.direction.toUpperCase() : undefined,
        department:
          selectedDepartment === "All" ? undefined : selectedDepartment,
      })
    );
  }, [
    dispatch,
    currentPage,
    debouncedSearchTerm,
    sortConfig,
    selectedDepartment,
  ]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const employees = entities.map((emp: any) => ({
    id: emp.employeeId || emp.id,
    name: emp.fullName || emp.name,
    department: emp.department,
  }));

  // Server-side: Use fetched employees directly
  const currentItems = employees;
  const totalPages = Math.ceil(totalItems / itemsPerPage);



  const handleViewDetails = (empId: string) => {
    navigate(`/admin-dashboard/employee-details/${empId}`);
  };

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
    filterContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    searchBox: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "white",
      borderRadius: "30px",
      padding: "10px 20px",
      boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
      minWidth: "250px",
    },
    dropdown: {
      padding: "10px 15px",
      borderRadius: "30px",
      border: "none",
      backgroundColor: "white",
      boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
      color: "#2B3674",
      fontWeight: "500",
      outline: "none",
      cursor: "pointer",
      minWidth: "120px",
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
    clickableTh: {
      textAlign: "left" as const,
      padding: "15px",
      borderBottom: "1px solid #E9EDF7",
      color: "#A3AED0",
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "uppercase" as const,
      cursor: "pointer",
      userSelect: "none" as const,
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Employee List</h1>

        <div style={styles.filterContainer}>
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            style={styles.dropdown}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div style={styles.searchBox}>
            <Search size={18} color="#A3AED0" style={{ marginRight: "10px" }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
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

          <button
            onClick={() => navigate("/admin-dashboard/registration")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4318FF] hover:bg-[#3311CC] text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 ml-2"
          >
            <UserPlus size={18} />
            <span>Create Employee</span>
          </button>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th
                style={styles.clickableTh}
                onClick={() => handleSort("fullName")}
                title="Click to sort by Name"
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  Name
                  {/* {sortConfig.key === "fullName" && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )} */}
                </div>
              </th>
              <th
                style={styles.clickableTh}
                onClick={() => handleSort("employeeId")}
                title="Click to sort by ID"
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  ID
                  {/* {sortConfig.key === "employeeId" && (
                    <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )} */}
                </div>
              </th>
              <th style={styles.th}>Department</th>
              {/* <th style={styles.th}>Work Hours</th> */}
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((emp) => (
              <tr key={emp.id}>
                <td style={styles.td}>{emp.name}</td>
                <td style={styles.td}>{emp.id}</td>
                <td style={styles.td}>{emp.department}</td>
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
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.td, textAlign: "center" }}>
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
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            style={{
              padding: "8px",
              borderRadius: "50%",
              border: "1px solid #E9EDF7",
              backgroundColor: currentPage === 1 ? "#F4F7FE" : "white",
              color: currentPage === 1 ? "#A3AED0" : "#2B3674",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            style={{ fontSize: "14px", color: "#2B3674", fontWeight: "600", margin: "0 10px" }}
          >
            {currentPage} / {totalPages > 0 ? totalPages : 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{
              padding: "8px",
              borderRadius: "50%",
              border: "1px solid #E9EDF7",
              backgroundColor:
                currentPage === totalPages || totalPages === 0
                  ? "#F4F7FE"
                  : "white",
              color:
                currentPage === totalPages || totalPages === 0
                  ? "#A3AED0" : "#2B3674",
              cursor:
                currentPage === totalPages || totalPages === 0
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeListView;
