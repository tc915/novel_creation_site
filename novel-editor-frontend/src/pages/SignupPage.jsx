// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { Link /* Removed useNavigate */ } from 'react-router-dom';
import axios from 'axios';
// Removed useAuth import

function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // Removed navigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowVerificationMessage(false);

     if (!email || !password) { setError('Please fill in email and password.'); setLoading(false); return; }
     if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        name,
        email,
        password,
      });

      console.log('Registration successful:', response.data);
      setLoading(false);
      setShowVerificationMessage(true);
      setName('');
      setEmail('');
      setPassword('');

    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  // Define backend URL
  const backendUrl = 'http://localhost:5001';

  // Render verification message if needed
  if (showVerificationMessage) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
             <Link to="/" className="text-3xl font-bold text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
               Novel Scribe
             </Link>
            <div className="p-8 bg-gray-900 border border-[var(--color-neon-cyan)] rounded shadow-lg w-full max-w-md text-center">
                 <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-neon-cyan)]">Registration Complete!</h1>
                 <p className="text-lg text-gray-300 mb-6 font-[var(--font-body)]">
                   Please check your email inbox (and spam folder) for a verification link to activate your account.
                 </p>
                 <Link to="/login" className="btn-primary-cyan">Go to Login</Link>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
      <Link to="/" className="text-3xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
        Novel Scribe // Registry
      </Link>
      <div className="p-8 bg-gray-900 border border-[var(--color-border)] rounded shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-neon-pink)]">Create Account</h1>
        {error && <p className="mb-4 text-center text-red-500 bg-red-900/50 border border-red-500 p-2 rounded text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
           {/* Username Input */}
           <div>
             <label htmlFor="username" className="form-label">Username <span className="text-xs text-gray-500">(Optional)</span></label>
             <input type="text" id="username" name="username" placeholder="Your username" className="form-input focus:ring-[var(--color-neon-pink)]" value={name} onChange={(e) => setName(e.target.value)} />
           </div>
           {/* Email Input */}
           <div>
             <label htmlFor="email" className="form-label">Email Address</label>
             <input type="email" id="email" name="email" placeholder="you@example.com" required className="form-input focus:ring-[var(--color-neon-pink)]" value={email} onChange={(e) => setEmail(e.target.value)} />
           </div>
           {/* Password Input */}
           <div>
             <label htmlFor="password" className="form-label">Password</label>
             <input type="password" id="password" name="password" placeholder="Create a password (min 6 chars)" required className="form-input focus:ring-[var(--color-neon-pink)]" value={password} onChange={(e) => setPassword(e.target.value)} />
           </div>
           {/* Signup Button */}
          <button type="submit" className="w-full btn-primary-pink py-2" disabled={loading}>
            {loading ? 'Creating Account...' : '[ Sign Up ]'}
          </button>
        </form>

         {/* --- Divider (Optional) --- */}
         <div className="my-6 flex items-center">
           <div className="flex-grow border-t border-[var(--color-border)]"></div>
           <span className="flex-shrink mx-4 text-xs text-[var(--color-text-muted)] font-mono">OR</span>
           <div className="flex-grow border-t border-[var(--color-border)]"></div>
         </div>

         {/* --- STEP 2: Add Google Login Button --- */}
         <a
           href={`${backendUrl}/api/auth/google`} // Link to backend initiation route
           className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 transition duration-200 font-[var(--font-display)]"
           // Simple white button style for Google, adjust as needed
         >
           {/* Add Google Icon here later if desired */}
           Continue with Google
         </a>
         {/* --- End Google Login Button --- */}

        <p className="mt-6 text-center text-sm text-gray-400 font-[var(--font-body)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--color-neon-cyan)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
export default SignupPage;