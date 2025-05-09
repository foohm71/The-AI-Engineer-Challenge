'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const storedResult = localStorage.getItem('chatResult');
    if (storedResult) {
      setResult(storedResult);
    } else {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Response</h2>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      </div>
    </div>
  );
} 