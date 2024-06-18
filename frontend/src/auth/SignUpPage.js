import React, { useState } from 'react';
import { signUp } from 'aws-amplify/auth';

const SignUpPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSignUp = async () => {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: username,
        password: password,
        attributes: {
          email: email
        },
      });
      console.log('User signed up:', userId);
    } catch (error) {
      console.log('Error signing up:', error);
    }
  };

  return (
    <div>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <button onClick={handleSignUp}>Sign up</button>
    </div>
  );
};

export default SignUpPage;
