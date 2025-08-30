import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const UsernameModal = ({ isOpen, onClose, onSetUsername }) => {
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState('');

  // Helper to strip @ and lowercase
  const cleanUsername = (val) => val.replace(/^@/, '').toLowerCase();
  // Helper to check if username contains both letters and numbers
  const hasLettersAndNumbers = (val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val);

  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      setCheckingUsername(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!username || cleanUsername(username).length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }
    let isCurrent = true;
    const check = async () => {
      setCheckingUsername(true);
      setUsernameAvailable(null);
      setError('');
      try {
        const q = cleanUsername(username);
        const res = await apiClient.get(`/api/users/search?q=${encodeURIComponent(q)}`);
        const data = res.data;
        if (!Array.isArray(data)) {
          setUsernameAvailable(null);
          setError('Error checking username');
          setUsernameSuggestions([]);
        } else if (data.some(u => u.username === q)) {
          setUsernameAvailable(false);
          // Suggest 3 available alternatives with at least one number
          const base = q.replace(/\d+$/, '');
          const suggestions = [];
          let tries = 0;
          while (suggestions.length < 3 && tries < 20) {
            const num = Math.floor(Math.random() * 9000 + 1000);
            const suggestion = `@${base}${num}`;
            if (suggestion !== username && hasLettersAndNumbers(base + num)) {
              // Check if suggestion is available
              if (!data.some(u => u.username === (base + num))) {
                suggestions.push(suggestion);
              }
            }
            tries++;
          }
          setUsernameSuggestions(suggestions);
        } else {
          setUsernameAvailable(true);
          // Suggest 3 available alternatives with at least one number
          const base = q.replace(/\d+$/, '');
          const suggestions = [];
          let tries = 0;
          while (suggestions.length < 3 && tries < 20) {
            const num = Math.floor(Math.random() * 9000 + 1000);
            const suggestion = `@${base}${num}`;
            if (suggestion !== username && hasLettersAndNumbers(base + num)) {
              if (!data.some(u => u.username === (base + num))) {
                suggestions.push(suggestion);
              }
            }
            tries++;
          }
          setUsernameSuggestions(suggestions);
        }
      } catch {
        setUsernameAvailable(null);
        setError('Error checking username');
        setUsernameSuggestions([]);
      } finally {
        if (isCurrent) setCheckingUsername(false);
      }
    };
    check();
    return () => { isCurrent = false; };
  }, [username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔄 Username form submitted:', { username, usernameAvailable, checkingUsername });
    
    if (!/^@[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('User ID must start with @ and use only letters, numbers, underscores (3-30 chars)');
      return;
    }
    if (!hasLettersAndNumbers(cleanUsername(username))) {
      setError('User ID must include both letters and numbers');
      return;
    }
    if (usernameAvailable !== true) {
      setError('User ID is not available or still checking');
      return;
    }
    
    console.log('✅ Calling onSetUsername with:', cleanUsername(username));
    console.log('✅ onSetUsername function:', onSetUsername);
    onSetUsername(cleanUsername(username));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose your unique LifeBuddy ID</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label htmlFor="username" className="block font-bold text-base text-gray-800 dark:text-gray-100 mb-1">User ID <span className="text-primary-600">(like @yourname)</span></label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={username}
            onChange={e => {
              let val = e.target.value;
              if (!val.startsWith('@')) val = '@' + val;
              setUsername(val.replace(/[^@a-zA-Z0-9_]/g, ''));
            }}
            className="input w-full"
            placeholder="@yourname123"
            minLength={3}
            maxLength={30}
            autoComplete="off"
          />
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Must include both <span className="font-semibold">letters and numbers</span>, 3-30 characters, unique.</div>
          {checkingUsername && <p className="text-sm text-gray-500">Checking availability...</p>}
          {usernameAvailable && !error && <p className="text-sm text-green-600">User ID is available!</p>}
          {usernameAvailable === false && <p className="text-sm text-danger-600">User ID is taken.</p>}
          {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
          {usernameSuggestions.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">Suggestions: {usernameSuggestions.map(s => (
              <button type="button" key={s} className="underline mr-2" onClick={() => setUsername(s)}>{s}</button>
            ))}</div>
          )}
          <button
            type="submit"
            className="btn-primary w-full py-2 mt-4"
            disabled={checkingUsername || !username || !usernameAvailable}
          >
            Set User ID
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal; 