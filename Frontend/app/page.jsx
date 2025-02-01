'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { Trash } from 'lucide-react'; // Import the Trash icon

const Home = () => {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile && uploadedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      if (uploadedFile.size <= 2 * 1024 * 1024) {
        setFile(uploadedFile);
      } else {
        toast.error('File size should be less than 2MB');
      }
    } else {
      toast.error('Only Excel files (.xlsx) are allowed');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setFileData(null);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Extract validation errors from each sheet
      const extractedErrors = {};
      Object.keys(response.data).forEach((sheet) => {
        if (response.data[sheet].validationResults.length > 0) {
          extractedErrors[sheet] = response.data[sheet].validationResults;
        }
      });

      setFileData(response.data);

      if (Object.keys(extractedErrors).length > 0) {
        setValidationErrors(response.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error(`Upload error: ${error.response?.data || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const DataPreview = ({ fileData }) => {
    const [sheets, setSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [sheetData, setSheetData] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const mapErrorsToRows = (errors) => {
      const errorMap = {};
      errors.forEach((error) => {
        errorMap[error.row] = error.message;
      });
      return errorMap;
    };

    useEffect(() => {
      if (!fileData) return;

      const sheetNames = Object.keys(fileData);
      setSheets(sheetNames);
      setSelectedSheet(sheetNames[0]); // Default to first sheet

      const initialSheetData = fileData[sheetNames[0]].data;
      const initialErrors = fileData[sheetNames[0]].validationResults || [];

      setSheetData(initialSheetData);
      setValidationErrors(mapErrorsToRows(initialErrors));
    }, [fileData]);

    const handleSheetChange = (e) => {
      const sheet = e.target.value;
      setSelectedSheet(sheet);
      setSheetData(fileData[sheet].data);
      setValidationErrors(mapErrorsToRows(fileData[sheet].validationResults || []));
      setCurrentPage(1);
    };

    const handleDeleteRow = (index) => {
      const confirmDelete = window.confirm('Are you sure you want to delete this row?');
      if (confirmDelete) {
        setSheetData((prevData) => prevData.filter((_, i) => i !== index));
      }
    };

    const handleImport = async () => {
      const validRows = sheetData.filter((_, index) => !validationErrors[index + 2]); // Skip invalid rows

      if (validRows.length === 0) {
        toast.error('No valid data to import');
        return;
      }

      try {
        const response = await axios.post('http://localhost:5000/api/import', {
          sheetName: selectedSheet,
          data: validRows, // Only send valid rows
        });
        toast.success('Data imported successfully!');
      } catch (error) {
        toast.error(`Import error: ${error.response?.data || error.message}`);
      }
    };

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = sheetData.slice(indexOfFirstRow, indexOfLastRow);

    return (
      <div className="p-4 p-10">
        <ToastContainer />
        <label className="block text-lg font-bold">Select Sheet:</label>
        <div className="flex justify-between pr-10 py-4">
          <select className="border p-2 rounded-md" value={selectedSheet} onChange={handleSheetChange}>
            {sheets.map((sheet, index) => (
              <option key={index} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleImport}>
            Import Data
          </button>
        </div>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {sheetData.length > 0 &&
                Object.keys(sheetData[0]).map((key) => (
                  <th key={key} className="border p-2">
                    {key}
                  </th>
                ))}
              <th className="border p-2">Errors</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIndex) => {
              const actualRowIndex = indexOfFirstRow + rowIndex + 2; // Excel rows start from index 2
              return (
                <tr key={rowIndex} className={`border ${validationErrors[actualRowIndex] ? 'bg-red-100' : ''}`}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex} className="border p-2">
                      {value}
                    </td>
                  ))}
                  <td className="border p-2 text-red-600">{validationErrors[actualRowIndex] || ''}</td>
                  <td className="border p-2 text-center">
                    <button
                      className="text-red-500"
                      onClick={() => handleDeleteRow(indexOfFirstRow + rowIndex)}
                      aria-label="Delete row"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 flex justify-center">
          <button
            className="mx-2 px-4 py-2 border bg-blue-500 text-white rounded"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Prev
          </button>
          <span className="mx-2 px-4 py-2 border rounded">{currentPage}</span>
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

  const ValidationErrorModal = ({ errors, onClose }) => {
    const [activeSheet, setActiveSheet] = useState(Object.keys(errors)[0]);

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-3/4 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Validation Errors</h2>
          <div className="flex border-b mb-4">
            {Object.keys(errors).map((sheet) => (
              <button
                key={sheet}
                className={`px-4 py-2 ${activeSheet === sheet ? 'border-b-2 border-blue-500 font-bold' : ''}`}
                onClick={() => setActiveSheet(sheet)}
              >
                {sheet}
              </button>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {errors[activeSheet]?.validationResults?.length > 0 ? (
              errors[activeSheet].validationResults.map((error, index) => (
                <div key={index} className="p-2 border-b">
                  <p>
                    <strong>Row:</strong> {error.row}
                  </p>
                  <p className="text-red-500">{error.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No validation errors found.</p>
            )}
          </div>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <ToastContainer />
      <div className="mb-6 flex flex-col justify-center">
        <p className="text-4xl text-center font-bold">Excel File Upload & Validation</p>
      </div>
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded w-96 mx-auto bg-green-50">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>
            Drag 'n' drop an Excel file here, or <span className="text-blue-400 underline">click to select a file</span>
          </p>
        )}
      </div>
      {file && (
        <div className="mt-4 ml-10">
          <p>Selected file: {file.name}</p>
          <button
            onClick={handleUpload}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      {fileData && <DataPreview fileData={fileData} />}
      {showModal && <ValidationErrorModal errors={validationErrors || {}} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Home;
