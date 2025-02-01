import { useState } from "react";

const ValidationErrorModal = ({ errors, onClose }) => {
  const [activeSheet, setActiveSheet] = useState(Object.keys(errors)[0]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-3/4 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Validation Errors</h2>
        
        {/* Tab Navigation */}
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

        {/* Error List */}
        <div className="max-h-64 overflow-y-auto">
        {Array.isArray(errors[activeSheet]?.validationResults) ? (
  errors[activeSheet].validationResults.map((error, index) => (
    <div key={index} className="p-2 border-b">
      <p><strong>Row:</strong> {error.row}</p>
      <p className="text-red-500">{error.message}</p>
    </div>
  ))
) : (
  <p className="text-gray-500">No validation errors found.</p>
)}
</div>

        {/* Close Button */}
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ValidationErrorModal;
