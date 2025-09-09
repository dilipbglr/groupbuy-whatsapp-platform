// Create: frontend/src/components/Test/ToastTest.tsx
// This is a temporary component to test your toast system

import React from 'react';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast/ToastContainer';

const ToastTest: React.FC = () => {
  const { toasts, success, error, info, warning, removeToast } = useToast();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Toast System Test</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => success('Deal created successfully! 🎉')}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Test Success Toast
        </button>
        
        <button
          onClick={() => error('Failed to save deal')}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Test Error Toast
        </button>
        
        <button
          onClick={() => info('Loading deal information...')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Test Info Toast
        </button>
        
        <button
          onClick={() => warning('Deal is about to expire')}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Test Warning Toast
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Active Toasts: {toasts.length}</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(toasts, null, 2)}
        </pre>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default ToastTest;
