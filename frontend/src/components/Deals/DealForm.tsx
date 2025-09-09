import React, { useState, useEffect } from 'react';
import { Deal, CreateDealRequest, UpdateDealRequest } from '../../types';

// 🎯 ENHANCED TYPE-SAFE FORM DATA HANDLING

// 1. Define form data interface (for internal form state)
interface DealFormData {
  product_name: string;
  description: string;
  original_price: string;
  group_price: string;
  min_participants: string;
  max_participants: string;
  start_time: string;
  end_time: string;
}

// 2. Enhanced initialization with explicit typing
const initializeFormData = (deal?: Deal): DealFormData => ({
  product_name: deal?.product_name || '',
  description: deal?.description || '',
  original_price: deal?.original_price?.toString() || '',
  group_price: deal?.group_price?.toString() || '',
  min_participants: deal?.min_participants?.toString() || '',
  max_participants: deal?.max_participants?.toString() || '',
  start_time: deal?.start_time 
    ? new Date(deal.start_time).toISOString().slice(0, 16)
    : '',
  end_time: deal?.end_time 
    ? new Date(deal.end_time).toISOString().slice(0, 16)
    : '',
});

// 3. Type-safe form data conversion for submission
const convertFormDataToSubmission = (formData: DealFormData): CreateDealRequest | UpdateDealRequest => ({
  product_name: formData.product_name.trim(),
  description: formData.description.trim() || undefined,
  original_price: parseFloat(formData.original_price),
  group_price: parseFloat(formData.group_price),
  min_participants: parseInt(formData.min_participants, 10),
  max_participants: parseInt(formData.max_participants, 10),
  start_time: new Date(formData.start_time).toISOString(),
  end_time: new Date(formData.end_time).toISOString(),
});

// 4. Form validation function
const validateFormData = (formData: DealFormData): string[] => {
  const errors: string[] = [];
  
  if (!formData.product_name.trim()) {
    errors.push('Product name is required');
  }
  
  if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
    errors.push('Original price must be greater than 0');
  }
  
  if (!formData.group_price || parseFloat(formData.group_price) <= 0) {
    errors.push('Group price must be greater than 0');
  }
  
  if (formData.original_price && formData.group_price && 
      parseFloat(formData.group_price) >= parseFloat(formData.original_price)) {
    errors.push('Group price must be less than original price');
  }
  
  if (!formData.min_participants || parseInt(formData.min_participants) < 1) {
    errors.push('Minimum participants must be at least 1');
  }
  
  if (!formData.max_participants || 
      parseInt(formData.max_participants) < parseInt(formData.min_participants || '1')) {
    errors.push('Maximum participants must be greater than minimum');
  }
  
  if (!formData.start_time) {
    errors.push('Start time is required');
  }
  
  if (!formData.end_time) {
    errors.push('End time is required');
  }
  
  if (formData.start_time && formData.end_time && 
      new Date(formData.end_time) <= new Date(formData.start_time)) {
    errors.push('End time must be after start time');
  }
  
  return errors;
};

// 5. Main component interface
interface DealFormProps {
  deal?: Deal;
  onSubmit: (data: CreateDealRequest | UpdateDealRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

// 6. Enhanced DealForm component
const DealForm: React.FC<DealFormProps> = ({ deal, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<DealFormData>(initializeFormData(deal));
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when deal prop changes
  useEffect(() => {
    setFormData(initializeFormData(deal));
    setErrors([]);
  }, [deal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Validate form
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors and submit
    setErrors([]);
    const submitData = convertFormDataToSubmission(formData);
    onSubmit(submitData);
  };

  const handleInputChange = (field: keyof DealFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const isFormValid = validateFormData(formData).length === 0;

  // Calculate savings percentage
  const savingsPercentage = formData.original_price && formData.group_price
    ? Math.round(((parseFloat(formData.original_price) - parseFloat(formData.group_price)) / parseFloat(formData.original_price)) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-none mx-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {deal ? 'Edit Deal' : 'Create New Deal'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        {/* Error display */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Width Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Product Information - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Product Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    id="product_name"
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    placeholder="Enter product description (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Pricing - Takes 1 column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Pricing
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="original_price" className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price ($) *
                  </label>
                  <input
                    id="original_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => handleInputChange('original_price', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="group_price" className="block text-sm font-medium text-gray-700 mb-1">
                    Group Price ($) *
                  </label>
                  <input
                    id="group_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.group_price}
                    onChange={(e) => handleInputChange('group_price', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                {/* Compact Savings Display */}
                {savingsPercentage > 0 && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                    <p className="text-xs text-green-700 font-medium">
                      💰 Save {savingsPercentage}% 
                      {formData.original_price && formData.group_price && (
                        <span className="block">${(parseFloat(formData.original_price) - parseFloat(formData.group_price)).toFixed(2)} off</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Participants & Timing - Takes 1 column */}
            <div className="space-y-4">
              {/* Participants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  Participants
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="min_participants" className="block text-sm font-medium text-gray-700 mb-1">
                      Min Participants *
                    </label>
                    <input
                      id="min_participants"
                      type="number"
                      min="1"
                      value={formData.min_participants}
                      onChange={(e) => handleInputChange('min_participants', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="1"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum needed to succeed
                    </p>
                  </div>
                  <div>
                    <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Participants *
                    </label>
                    <input
                      id="max_participants"
                      type="number"
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => handleInputChange('max_participants', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="100"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum allowed
                    </p>
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  Timing
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      When deal becomes available
                    </p>
                  </div>
                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      When deal expires
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Footer with Buttons */}
      <div className="flex justify-end space-x-3 px-6 py-3 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            deal ? 'Update Deal' : 'Create Deal'
          )}
        </button>
      </div>
    </div>
  );
};

export default DealForm;