import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const EditPrescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    notes: '',
    validUntil: '',
    medications: [
      { name: '', dosage: '', frequency: 'Once daily', instructions: '' }
    ]
  });

  // Fetch prescription data
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const response = await fetch(`${API_URL}/prescriptions/prescription/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prescription');
        }
        const data = await response.json();
        
        // Format the data for the form
        setFormData({
          diagnosis: data.diagnosis || '',
          notes: data.notes || '',
          validUntil: data.validUntil ? data.validUntil.split('T')[0] : '',
          medications: data.medications && data.medications.length > 0 
            ? data.medications.map(med => ({
                id: med.id, // Include the medication ID
                name: med.name || '',
                dosage: med.dosage || '',
                frequency: med.frequency || 'Once daily',
                instructions: med.instructions || ''
              }))
            : [{ name: '', dosage: '', frequency: 'Once daily', instructions: '' }]
        });
      } catch (err) {
        console.error('Error fetching prescription:', err);
        setError('Failed to load prescription data');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicationChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [name]: value
    };
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: '', dosage: '', frequency: 'Once daily', instructions: '' }
      ]
    }));
  };

  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const updatedMedications = [...formData.medications];
      updatedMedications.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        medications: updatedMedications
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Prepare the request body with proper medication structure
      const requestBody = {
        diagnosis: formData.diagnosis || '',
        notes: formData.notes || '',
        validUntil: formData.validUntil ? `${formData.validUntil}T00:00:00` : null,
        medications: formData.medications.map(med => ({
          id: med.id, // Include the medication ID if it exists
          name: med.name || '',
          dosage: med.dosage || '',
          frequency: med.frequency || 'Once daily',
          instructions: med.instructions || ''
        }))
      };

      const response = await fetch(`${API_URL}/prescriptions/prescription/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update prescription');
      }

      // Redirect to prescriptions list on success
      navigate('/doctor/prescriptions', { replace: true });
    } catch (err) {
      console.error('Error updating prescription:', err);
      setError(err.message || 'Failed to update prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Prescription</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis
          </label>
          <input
            type="text"
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">
            Valid Until
          </label>
          <input
            type="date"
            id="validUntil"
            name="validUntil"
            value={formData.validUntil}
            onChange={handleChange}
            className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">Medications</h3>
            <button
              type="button"
              onClick={addMedication}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {formData.medications.map((med, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  disabled={formData.medications.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`med-name-${index}`} className="block text-xs font-medium text-gray-500 mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      id={`med-name-${index}`}
                      name="name"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`med-dosage-${index}`} className="block text-xs font-medium text-gray-500 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      id={`med-dosage-${index}`}
                      name="dosage"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`med-frequency-${index}`} className="block text-xs font-medium text-gray-500 mb-1">
                      Frequency
                    </label>
                    <select
                      id={`med-frequency-${index}`}
                      name="frequency"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="As needed">As needed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`med-instructions-${index}`} className="block text-xs font-medium text-gray-500 mb-1">
                      Instructions
                    </label>
                    <input
                      type="text"
                      id={`med-instructions-${index}`}
                      name="instructions"
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Take with food"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any additional instructions or notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPrescription;
