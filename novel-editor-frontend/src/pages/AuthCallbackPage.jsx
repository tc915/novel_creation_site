// src/pages/AuthCallbackPage.jsx
import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    console.log("AuthCallbackPage Mounted");
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const isVerified = searchParams.get('isVerified') === 'true';

    if (token && userId && email) {
      const userData = { userId, name, email, isVerified };
      login(token, userData); // Update context state + localStorage

      // Navigate AFTER calling login
      navigate('/', { replace: true });

    } else {
      console.error("Auth Callback - Token or user info missing in URL parameters. Redirecting to login.");
      navigate('/login?error=google-auth-callback-failed', { replace: true });
    }

  }, [searchParams, login, navigate]); // Dependencies are correct

  return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
         <p className="text-xl font-[var(--font-display)] text-[var(--color-neon-cyan)]">
             Processing authentication...
         </p>
     </div>
    );
}

export default AuthCallbackPage;