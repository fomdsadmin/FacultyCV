import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';

const SignInPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const user = await signIn({
        username: username,
        password: password
    });
      console.log('User logged in:', user);
      window.location.reload();
    } catch (error) {
      console.log('Error logging in:', error);
    }
  };

  return (
    <div>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button onClick={handleLogin}>Log in</button>
    </div>
  );
};

export default SignInPage;
