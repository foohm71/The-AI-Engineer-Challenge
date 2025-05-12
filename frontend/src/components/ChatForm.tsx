'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRequest } from '@/types/api';

export default function ChatForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<ChatRequest>({
    developer_message: '',
    user_message: '',
    api_key: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = 'https://api-peach-omega-11.vercel.app';
      console.log('Sending request to:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify(formData),
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let result = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += new TextDecoder().decode(value);
        }
      } catch (readError) {
        console.error('Error reading stream:', readError);
        throw new Error(`Error reading response: ${readError.message}`);
      }

      if (!result) {
        throw new Error('Empty response received');
      }

      // Store the result in localStorage to access it on the result page
      localStorage.setItem('chatResult', result);
      router.push('/result');
    } catch (error) {
      console.error('Error details:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="developer_message" className="block text-sm font-medium text-gray-700">
          My Mood
        </label>
        <input
          type="text"
          id="developer_message"
          name="developer_message"
          value={formData.developer_message}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
          autoComplete="off"
          enterKeyHint="next"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="user_message" className="block text-sm font-medium text-gray-700">
          My Question
        </label>
        <textarea
          id="user_message"
          name="user_message"
          value={formData.user_message}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
          enterKeyHint="next"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
          API Key
        </label>
        <input
          type="password"
          id="api_key"
          name="api_key"
          value={formData.api_key}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
          autoComplete="off"
          enterKeyHint="done"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Submit'}
      </button>
    </form>
  );
} 