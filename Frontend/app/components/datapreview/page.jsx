import { useState } from "react";
import { Trash } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const DataPreview = ({ fileData }) => {
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [importStatus, setImportStatus] = useState(null);
  const rowsPerPage = 10;


  const mapErrorsToRows = (errors) => {
    const errorMap = {};
    errors.forEach((error) => {
      errorMap[error.row] = error.message;
    });
    return errorMap;
  };
  // Extract sheet names and data when fileData changes
  useState(() => {
    if (!fileData) return;

    const sheetNames = Object.keys(fileData);
    setSheets(sheetNames);
    setSelectedSheet(sheetNames[0]); // Default to first sheet

    const initialSheetData = fileData[sheetNames[0]].data;
    const initialErrors = fileData[sheetNames[0]].validationResults || [];

    setSheetData(initialSheetData);
    setValidationErrors(mapErrorsToRows(initialErrors));
  }, [fileData]);

 
  

  // Handle sheet selection
  const handleSheetChange = (e) => {
    const sheet = e.target.value;
    setSelectedSheet(sheet);
    setSheetData(fileData[sheet].data);
    setValidationErrors(mapErrorsToRows(fileData[sheet].validationResults || []));
    setCurrentPage(1);
  };

  // Handle row deletion with confirmation
  const handleDeleteRow = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this row?");
    if (confirmDelete) {
      setSheetData((prevData) => prevData.filter((_, i) => i !== index));
    }
  };

  // **🛠 Import Data to Backend**
  const handleImport = async () => {
    const validRows = sheetData.filter((_, index) => !validationErrors[index + 2]); // Skip invalid rows
  
    if (validRows.length === 0) {
      toast.error("No valid data to import");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/import", {
        sheetName: selectedSheet,
        data: validRows, // Only send valid rows
      });
    } catch (error) {
      toast.error("Import error:", error.response?.data || error.message);
      
    }
  };
  
  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sheetData.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="p-4 p-10">
      {/* Sheet Selection Dropdown */}
      <ToastContainer/>
      <label className="block text-lg font-bold ">Select Sheet:</label>
      <div className="flex justify-between pr-10 py-4">
      <select
        className="border p-2 rounded-md "
        value={selectedSheet}
        onChange={handleSheetChange}
      >
        {sheets.map((sheet, index) => (
          <option key={index} value={sheet}>{sheet}</option>
        ))}
      </select>
      <button
        className=" px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleImport}
      >
        Import Data
      </button>
      </div>
      {/* Table */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {sheetData.length > 0 &&
              Object.keys(sheetData[0]).map((key) => (
                <th key={key} className="border p-2">{key}</th>
              ))}
            <th className="border p-2">Errors</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, rowIndex) => {
            const actualRowIndex = indexOfFirstRow + rowIndex + 2; // Excel rows start from index 2
            return (
              <tr key={rowIndex} className={`border ${validationErrors[actualRowIndex] ? "bg-red-100" : ""}`}>
                {Object.values(row).map((value, colIndex) => (
                  <td key={colIndex} className="border p-2">{value}</td>
                ))}
                <td className="border p-2 text-red-600">
                  {validationErrors[actualRowIndex] || ""}
                </td>
                <td className="border p-2 text-center">
                  <button
                    className="text-red-500"
                    onClick={() => handleDeleteRow(indexOfFirstRow + rowIndex)}
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <button
          className="mx-2 px-4 py-2 border bg-blue-500 text-white rounded"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>
        <span className="mx-2 px-4 py-2 border  rounded">{currentPage}</span>
        <button
          className="mx-2 px-4 py-2 border bg-blue-500 text-white rounded"
          disabled={indexOfLastRow >= sheetData.length}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div> 
    </div>
  );
};

export default DataPreview;
