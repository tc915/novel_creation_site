// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Page Not Found.</p>
        <Link to="/" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
          Go Back Home
        </Link>
    </div>
  );
}
export default NotFoundPage;