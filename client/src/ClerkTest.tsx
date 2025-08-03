import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';

export default function ClerkTest() {
  const { getToken, isSignedIn, signOut } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testProtectedEndpoint = async () => {
    try {
      const token = await getToken();
      console.log('Token:', token?.substring(0, 20) + '...');
      const response = await fetch('http://localhost:3001/api/test/protected', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Clerk Authentication Test</h1>
        <p>Please sign in to test the protected endpoint.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clerk Authentication Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testProtectedEndpoint}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Protected Endpoint
        </button>
        
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
        >
          Sign Out
        </button>
      </div>

      {testResult && (
        <div className="mt-4">
          <h3 className="font-bold">API Response:</h3>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
}
