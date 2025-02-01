'use client'
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import ValidationErrorModal from './components/validationerror/page';
import DataPreview from './components/datapreview/page';
import { toast, ToastContainer } from 'react-toastify';


const Home = () => {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sheets, setSheets] = useState([]);  // Stores sheet names
const [sheetData, setSheetData] = useState(null); // Stores data for selected sheet
const [selectedSheet, setSelectedSheet] = useState(""); // Tracks selected sheet


  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile && uploadedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      if (uploadedFile.size <= 2 * 1024 * 1024) {
        setFile(uploadedFile);
        setError(null);
      } else {
        toast.error('File size should be less than 2MB');
      }
    } else {
      toast.error('Only Excel files are allowed');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
    setFileData(null);
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
      } else {
        // Extract sheet names and data
      }

    } catch (error) {
      toast.error('Upload error:', error.response?.data || error.message);
    }
};


  return (
    <div className="min-h-screen p-6  ">
      <ToastContainer/>
      <div className="mb-6 flex flex-col justify-center">
        <p className="text-4xl text-center font-bold">Excel File Upload & Validation</p>
      </div>
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded w-96 mx-auto bg-green-50">  
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag 'n' drop an Excel file here, or <span className='text-blue-400 underline'>click to select a file</span></p>
        )}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {file && (
        <div className="mt-4 ml-10">
          <p>Selected file: {file.name}</p>
          <button
            onClick={handleUpload}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Upload
          </button>
        </div>
      )}
     {fileData && <DataPreview fileData={fileData} />}
      {showModal && (
           <ValidationErrorModal 
             errors={validationErrors} 
             onClose={() => setShowModal(false)} 
           />
         )}

    </div>
  );
};

export default Home;