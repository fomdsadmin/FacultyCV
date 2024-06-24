import React, { useState } from 'react';
import { signIn, signUp, confirmSignIn, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import PageContainer from './PageContainer.js';


const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newUserPassword, setNewUserPassword] = useState(false);
  const [newSignUp, setNewSignUp] = useState(false);
  const [signUpConfirmation, setSignUpConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmationError, setConfirmationError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const user = await signIn({
        username: username,
        password: password
      });
      console.log('User logged in:', user.isSignedIn, user.nextStep.signInStep);
      if (!user.isSignedIn) {
        if (user.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          setNewUserPassword(true);
          setLoading(false);
        } else if (user.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          setSignUpConfirmation(true);
          setLoading(false);
        }
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.log('Error logging in:', error);
      setLoading(false);
    }
  };

  const handleNewPasswordUser = async (event) => {
    event.preventDefault();
    const newPassword = event.target.newPassword.value;
    const confirmNewPassword = event.target.confirmNewPassword.value;

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match!');
      return;
    }
    setPasswordError('');
    try {
      setLoading(true);
      console.log('Setting new password for user:', username);
      const attributes = {};
      const user = await confirmSignIn({
        challengeResponse: newPassword,
        options: {
          userAttributes: attributes
        }
      });
      console.log('User logged in:', user.isSignedIn, user.nextStep.signInStep);
      if (user.isSignedIn) {
        window.location.reload();
      }
    } catch (error) {
      console.log('Error setting new password:', error);
      setLoading(false);
      setNewUserPassword(false);
    }
  };

  const handleConfirmSignUp = async (event) => {
    event.preventDefault();
    const confirmationCode = event.target.confirmationCode.value;

    try {
      setLoading(true);
      const user = await confirmSignUp({
        username: username,
        confirmationCode: confirmationCode
      });
      setLoading(false);
      console.log('User logged in:', user.isSignUpComplete, user.nextStep.signInStep);
      if (user.isSignUpComplete) {
        window.location.reload();
      }
    } catch (error) {
      console.log('Error setting new password:', error);
      setConfirmationError('Invalid confirmation code');
      setLoading(false);
    }
  };

  const resendConfirmationCode = async () => {
    try {
      setLoading(true);
      await resendSignUpCode({ username: username });
      setLoading(false);
      setConfirmationError('');
    } catch (error) {
      console.log('Error resending confirmation code:', error);
      setLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    const confirmPassword = event.target.confirmPassword.value;

    // TODO: ACCOUNT FOR MORE PASSWORD SPECIFICATIONS
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match!');
      return;
    }
    setPasswordError('');
    try {
      setLoading(true);
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: username,
        password: password,
        attributes: {
          email: username
        }
      });
      setLoading(false);
      setNewSignUp(false);
      console.log('User signed up:', isSignUpComplete, userId, nextStep);
      if (!isSignUpComplete) {
        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setSignUpConfirmation(true);
        }
      }
    } catch (error) {
      console.log('Error signing up:', error);
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      {loading && <div>Loading...</div>}
      {!loading && !newUserPassword && !newSignUp && !signUpConfirmation && (
        <div>
          <form onSubmit={handleLogin}>
            <input className="input input-bordered w-full max-w-xs" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
            <input className="input input-bordered w-full max-w-xs" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
            <button className="btn btn-primary" type="submit">Log in</button>
          </form>
          <button className="btn btn-secondary" onClick={() => setNewSignUp(true)}>Sign Up</button>
        </div>
      )}
      {!loading && newSignUp && (
        <div>
          <form onSubmit={handleSignUp}>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
            <input name="confirmPassword" placeholder="Confirm Password" type="password" required />
            {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
            <button type="submit">Sign Up</button>
          </form>
          <button onClick={() => setNewSignUp(false)}>Sign In</button>
        </div>
      )}
      {!loading && newUserPassword && (
        <form onSubmit={handleNewPasswordUser}>
          <input name="newPassword" placeholder="New Password" type="password" required />
          <input name="confirmNewPassword" placeholder="Confirm New Password" type="password" required />
          {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
          <button type="submit">Submit New Password</button>
        </form>
      )}
      {!loading && signUpConfirmation && (
        <div>
          <p>Account not confirmed. Please enter the confirmation code sent to your email.</p>
          <form onSubmit={handleConfirmSignUp}>
            <input name="confirmationCode" placeholder="Confirmation Code" type="password" required />
            {confirmationError && <div style={{ color: 'red' }}>{confirmationError}</div>}
            <button type="submit">Submit</button>
            <button type="button" onClick={resendConfirmationCode}>Resend Code</button>
          </form>
        </div>
      )}
   </PageContainer>
  );
};

export default AuthPage;