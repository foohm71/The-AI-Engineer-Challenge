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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
      }

      // Store the result in localStorage to access it on the result page
      localStorage.setItem('chatResult', result);
      router.push('/result');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
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