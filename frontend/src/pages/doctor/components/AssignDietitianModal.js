import React, { useState, useEffect } from 'react';
import { X, User as UserIcon } from 'lucide-react';

const AssignDietitianModal = ({ 
  isOpen, 
  onClose, 
  patientId,
  patientName,
  onAssign,
  isAssigning
}) => {
  const [dietitians, setDietitians] = useState([]);
  const [selectedDietitian, setSelectedDietitian] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDietitians();
    }
  }, [isOpen]);

  const fetchDietitians = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('http://localhost:8080/api/patients/dietitians');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch dietitians: ${errorText}`);
      }
      
      const data = await response.json();
      // Handle the response format from the API
      setDietitians(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching dietitians:', err);
      setError('Failed to load dietitians. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDietitian) {
      setError('Please select a dietitian');
      return;
    }
    
    try {
      setError('');
      await onAssign(patientId, selectedDietitian);
      onClose();
    } catch (err) {
      console.error('Error assigning dietitian:', err);
      setError(err.message || 'Failed to assign dietitian. Please try again.');
      // Re-throw the error so the parent component can handle it if needed
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Assign Dietitian
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={isAssigning}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Assign {patientName} to a dietitian
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="dietitian" className="block text-sm font-medium text-gray-700">
                  Select a Dietitian
                </label>
                {dietitians.length > 0 ? (
                  <select
                    id="dietitian"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={selectedDietitian}
                    onChange={(e) => setSelectedDietitian(e.target.value)}
                    disabled={isAssigning}
                  >
                    <option value="">Select a dietitian</option>
                    {dietitians.map((dietitian) => (
                      <option key={dietitian.id} value={dietitian.id}>
                        {dietitian.fullName} ({dietitian.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">No dietitians available.</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!selectedDietitian || isAssigning}
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignDietitianModal;
