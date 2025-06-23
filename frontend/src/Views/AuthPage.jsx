import React, { useState } from 'react';
import { signIn, signUp, confirmSignIn, confirmSignUp, resendSignUpCode, 
  getCurrentUser, resetPassword, confirmResetPassword, 
  signOut} from 'aws-amplify/auth';
import PageContainer from './PageContainer.jsx';
import '../CustomStyles/scrollbar.css';
import { addUser, updateUser, getExistingUser, addToUserGroup, getUser } from '../graphql/graphqlHelpers.js';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ getCognitoUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Faculty');
  const [institution_user_id, setInstitutionUserId] = useState('0'); // HARDCODED INSTITUTION USER ID TO ADD BULK USERS
  const [newUserPassword, setNewUserPassword] = useState(false);
  const [newSignUp, setNewSignUp] = useState(false);
  const [signUpConfirmation, setSignUpConfirmation] = useState(false);
  const [forgotPassword, setForgotPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const navigate = useNavigate();

  

  const handleRoleChange = (event) => {
    setRole('');
    const selectedRole = event.target.value;
    if (selectedRole === 'Department Admin') {
      setIsDepartmentAdmin(true);
    } else {
      setIsDepartmentAdmin(false);
      setRole(selectedRole);
    }
  };
  
  const handleDepartmentInputChange = (event) => {
    const departmentName = event.target.value;
    setSelectedDepartment(departmentName);
    setRole(`Admin-${departmentName}`);
  };
  
  const handleLogin = async (event) => {
    setLoginError('');
    event.preventDefault();
    const username= event.target.email.value;
    const password = event.target.password.value;

    try {
      setLoading(true);
      const user = await signIn({
        username: username,
        password: password
      });
      
      if (!user.isSignedIn) {
        setUsername(username);
        if (user.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          setNewUserPassword(true);
          setLoading(false);
        } else if (user.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          setSignUpConfirmation(true);
          setLoading(false);
        }
      } else {
        getCognitoUser();
        navigate('/home');
      }
    } catch (error) {
      
      setLoginError('Incorrect email or password.');
      setLoading(false);
    }
  };

  const handleNewPasswordUser = async (event) => {
    event.preventDefault();
    const newPassword = event.target.newPassword.value;
    const confirmNewPassword = event.target.confirmNewPassword.value;

    // Password specifications
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/;

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match!');
      return;
    } else if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters long, contain a lowercase letter, an uppercase letter, and a digit.');
      return;
    } 
    setError('');
    try {
      setLoading(true);
      
      const attributes = {};
      const user = await confirmSignIn({
        challengeResponse: newPassword,
        options: {
          userAttributes: attributes
        }
      });
      
      if (user.isSignedIn) {
        storeUserData(firstName, lastName, username, role, institution_user_id, newPassword);
      }
    } catch (error) {
      
      setLoading(false);
      setNewUserPassword(false);
    }
  };

  const handleConfirmSignUp = async (event) => {
    event.preventDefault();
    const confirmationCode = event.target.confirmationCode.value;

    setError('');
    try {
      setLoading(true);
      const user = await confirmSignUp({
        username: username,
        confirmationCode: confirmationCode
      });
      setLoading(false);
      
      if (user.isSignUpComplete) {
        storeUserData(firstName, lastName, username, role, institution_user_id, password);
      }
    } catch (error) {
      
      setError('Invalid confirmation code');
      setLoading(false);
    }
  };

  const resendConfirmationCode = async () => {
    try {
      setLoading(true);
      await resendSignUpCode({ username: username });
      setLoading(false);
      setError('');
    } catch (error) {
      
      setLoading(false);
    }
  };


  const handleSignUp = async (event) => {
    event.preventDefault();
    const confirmPassword = event.target.confirmPassword.value;

    // Password specifications
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/;

    // Username specification
    const usernameRegex = /@[\w-]+\.ubc\.ca$/;
    const username2Regex = /@ubc\.ca$/;

    if (password !== confirmPassword) {
      setSignUpError('Passwords do not match!');
      return;
    } else if (!passwordRegex.test(password)) {
      setSignUpError('Password must be at least 8 characters long, contain a lowercase letter, an uppercase letter, and a digit.');
      return;
    } else if (!usernameRegex.test(username) && !username2Regex.test(username)) {
      setSignUpError('Email must be a valid UBC email address.');
      return;
    }
    setSignUpError('');

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
      
      if (!isSignUpComplete) {
        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setSignUpConfirmation(true);
        }
      }
    } catch (error) {
      
      if (error.message === 'User already exists') {
        setSignUpError('An account with this email already exists.');
      }
      setLoading(false);
    }
  };

  const storeUserData = async (first_name, last_name, email, role, institution_user_id, newPassword) => {
    setLoading(true);
    //sign in user
    try {
      let user = null;
      try {
        user = await getCurrentUser();
      } catch (error) {
        
        user = await signIn({
          username: username,
          password: newPassword
        });
      }      
    } catch (error) {
      
      setLoading(false);
      return;
    }

    //put user in user group
    try {
      if (role.startsWith('Admin-')) {
        const result = await addToUserGroup(email, 'DepartmentAdmin');
        const result2 = await addToUserGroup(email, 'Faculty')
        
      } else {
        const result = await addToUserGroup(email, role);
        
      }
    } catch (error) {
      
      setLoading(false);
      return;
    }

    // need new user session to refresh user group
    try {
      const result = await signOut();
      
    } catch (error) {
      
      setLoading(false);
      return;
    }
    try {
      const user = await signIn({
        username: username,
        password: newPassword
      });
      
    } catch (error) {
      
      setLoading(false);
      return;
    }
    
    // put user data in database if it doesn't already exist
    try {
      const userInformation = await getExistingUser(institution_user_id);
      
      if (!userInformation.role) {
        
        const result = await updateUser(
            userInformation.user_id, userInformation.first_name, userInformation.last_name, userInformation.preferred_name,
            email, role, userInformation.bio, userInformation.rank, userInformation.institution,
            userInformation.primary_department, userInformation.secondary_department, userInformation.primary_faculty,
            userInformation.secondary_faculty, userInformation.primary_affiliation, userInformation.secondary_affiliation, userInformation.campus, userInformation.keywords,
            userInformation.institution_user_id, userInformation.scopus_id, userInformation.orcid_id
        )
        
    
      }
    } catch (error) {
      try {
        const result = await addUser(first_name, last_name, '', email, role, '', '', '', '', '', '', '', '', '', '', '', '', '', '');
        const user = await getUser(email);
        const result3 = await updateUser(user.user_id, first_name, last_name, '', email, role, '', '', '', '', '', '', '', '', '', '', '', '', '', '');
        
      } catch (error) {
        
        setLoading(false);
      }
    }
    getCognitoUser();
    
    navigate('/home');
  };

  async function handleResetPassword(event) {
    event.preventDefault();
    setForgotPasswordError('');
    try {
      const output = await resetPassword({ username });
      handleResetPasswordNextSteps(output);
      
    } catch (error) {
      
      setMessage("");
      if (error.message === "Attempt limit exceeded, please try after some time.") {
        setForgotPasswordError("Attempt limit exceeded, please try after some time.");
      }
      else {
        setForgotPasswordError('User does not exist.');
      }
    }
  }

  function handleResetPasswordNextSteps(output) {
    const { nextStep } = output;
    switch (nextStep.resetPasswordStep) {
      case "CONFIRM_RESET_PASSWORD_WITH_CODE":
        const codeDeliveryDetails = nextStep.codeDeliveryDetails;
        setMessage(
          `Confirmation code was sent to ${codeDeliveryDetails.deliveryMedium}`
        );
        setForgotPassword("confirmReset");
        break;
      case "DONE":
        setMessage("Successfully reset password.");
        setDone(true);
        
        break;
    }
  }

  async function handleConfirmResetPassword(event) {
    event.preventDefault();
    const confirmationCode = event.target.confirmationCode.value;
    const newPassword = event.target.newPassword.value;
    const confirmPassword = event.target.confirmNewPassword.value;

    // Password specifications
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/;

    setForgotPasswordError('');

    if (newPassword !== confirmPassword) {
      setForgotPasswordError('Passwords do not match!');
      return;
    } else if (!passwordRegex.test(newPassword)) {
      setForgotPasswordError('Password must be at least 8 characters long, contain a lowercase letter, an uppercase letter, and a digit.');
      return;
    } 

    try {
      await confirmResetPassword({
        username,
        confirmationCode,
        newPassword,
      });
      
      setMessage("Password successfully reset.");
      setDone(true);
      setForgotPasswordError("");
    } catch (error) {
      
      
      
      setForgotPasswordError("Invalid confirmation code.");
    }
  }

  return (
    <PageContainer>
      <div className="flex w-full rounded-lg mx-auto shadow-lg overflow-hidden bg-gray-100">
        <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar">
          {loading && <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>}
          {!loading && !newUserPassword && !newSignUp && !signUpConfirmation && !forgotPassword && (
            <div>
              <div>
              <h1 className="text-4xl font-bold my-3 text-zinc-600">Sign in to manage your Faculty Activities</h1>
			 </div>
              <div className='flex flex-col items-center justify-center'>
                <form onSubmit={handleLogin}>
                  <label className="block text-m mb-1 mt-6">Email</label>
                  <input className="input input-bordered w-full text-sm" name="email" placeholder="Email" required />
                  <label className="block text-m mb-1 mt-6">Password</label>
                  <input className="input input-bordered w-full text-sm" name="password" placeholder="Password" type="password" required />
                  <button className="btn btn-neutral mt-6 mb-3 w-full text-base" type="submit">Sign In</button>
                </form>
                <span className="text-zinc-600 text-sm font-bold underline underline-offset-2 cursor-pointer" onClick={() => setForgotPassword('forgotPassword')}>Forgot Password</span>
                {loginError && <div className="text-sm mt-4 text-red-600">{loginError}</div>}
              </div>
            </div>
          )}
          {!loading && forgotPassword==='forgotPassword' && (
            <div>
              {!done && (
                <div>
                <h1 className="text-3xl font-bold my-3 text-zinc-600">Reset Password</h1>
                <p className='text-sm'>Please enter the email for your account.</p>
                <div className='flex flex-col items-center justify-center max-w-xl'>
                  <form onSubmit={handleResetPassword}>
                    <label className="block text-xs mt-4">Email</label>
                    <input className="input input-bordered mt-1 h-10 w-full text-xs" value={username} onChange={e => setUsername(e.target.value)} placeholder="Email" required />
                    <button className="btn btn-neutral mt-4 mb-3 min-h-5 h-8 w-full" type="submit">Send Reset Code</button>
                  </form>
                  <span className="text-zinc-600 text-sm font-bold underline underline-offset-2 cursor-pointer" onClick={() => setForgotPassword('')}>Back to Login</span>
                  {forgotPasswordError && <div className="text-sm mt-4 text-red-600">{forgotPasswordError}</div>}
                </div>
              </div>
              )}
              {done && (
                <div>
                  <div className="block text-m mb-3 mt-6 text-green-600">
                    {message}
                  </div>
                  <span className="text-zinc-600 text-sm font-bold underline underline-offset-2 cursor-pointer" onClick={() => setForgotPassword('')}>Back to Login</span>
                </div>
              )}
            </div>
            
          )}
          {!loading && forgotPassword==='confirmReset' && (
            <div>
              {!done && (
                <div>
                  <h1 className="text-3xl font-bold my-3 text-zinc-600">Reset Password</h1>
                  {message && <div className="text-m mt-4">A confirmation code was sent to {username}</div>}
                  <div className='flex flex-col items-center justify-center max-w-xl'>
                    <form onSubmit={handleConfirmResetPassword}>
                      <label className="block text-xs mt-4">Confirmation Code</label>
                      <input className="input input-bordered mt-1 h-10 w-full text-xs" name="confirmationCode" placeholder="Confirmation Code" required />
                      <label className="block text-xs mt-4">New Password</label>
                      <input className="input input-bordered mt-1 h-10 w-full text-xs" name="newPassword" placeholder="New Password" type="password" required />
                      <label className="block text-xs mt-4">Confirm New Password</label>
                      <input className="input input-bordered mt-1 h-10 w-full text-xs" name="confirmNewPassword" placeholder="Confirm New Password" type="password" required />
                      <button className="btn btn-neutral mt-4 mb-3 min-h-5 h-8 w-full" type="submit">Submit</button>
                    </form>
                    <span className="text-zinc-600 text-sm font-bold underline underline-offset-2 cursor-pointer" onClick={() => setForgotPassword('')}>Back to Login</span>
                    {forgotPasswordError && <div className="block text-sm mb-1 mt-6 text-red-600">{forgotPasswordError}</div>}
                  </div>
                </div>
              )}
              {done && (
                <div>
                  <div className="block text-m mb-3 mt-6 text-green-600">
                    {message}
                  </div>
                  <span className="text-zinc-600 text-sm font-bold underline underline-offset-2 cursor-pointer" onClick={() => setForgotPassword('')}>Back to Login</span>
                </div>
              )}
            </div>
            
          )}
          {!loading && newSignUp && (
            <div className='mt-20 mb-5'>
              <div>
                <h1 className="text-3xl font-bold my-3 text-zinc-600">Create an account</h1>
                <p className='text-sm'>Enter your account details below or <span className="text-zinc-600 font-bold underline underline-offset-2 cursor-pointer" onClick={() => setNewSignUp(false)}>sign in</span></p>
              </div>
              <div className='flex flex-col items-center justify-center'>
                <form onSubmit={handleSignUp}>
                  <label className="block text-xs mt-4">First Name</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required />
                  <label className="block text-xs mt-4">Last Name</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required />
                  <label className="block text-xs mt-4">Email</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" value={username} onChange={e => setUsername(e.target.value)} placeholder="Email" required />
                  <label className="block text-xs mt-4">Password</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
                  <label className="block text-xs mt-4">Confirm Password</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" name="confirmPassword" placeholder="Confirm Password" type="password" required />
                  <div className="mt-2 flex justify-between">
                    <div className="mt-2">
                      <input type="radio" id="faculty" name="role" value="Faculty" onChange={e => setRole(e.target.value)} defaultChecked />
                      <label className="ml-1 text-xs">Faculty</label>
                    </div>
                    <div className="mt-2">
                        <input type="radio" id="assistant" name="role" value="Assistant"onChange={e => setRole(e.target.value)} />
                        <label className="ml-1 text-xs">Assistant</label>
                    </div>
                  </div>
                  <button className="btn btn-neutral mt-4 min-h-5 h-8 w-full" type="submit">Create Account</button>
                </form>
                {signUpError && <div className="mb-1 max-w-sm text-sm mt-6 text-red-600">{signUpError}</div>}
              </div>
            </div>
          )}
          {!loading && newUserPassword && (
            <div>
              <h1 className="text-3xl font-bold my-3 text-zinc-600">New User</h1>
              <p className='text-sm'>Please enter a the following information for your account.</p>
              <div className='flex flex-col items-center justify-center max-w-xl'>
                <form onSubmit={handleNewPasswordUser}>
                  <label className="block text-xs mt-4">First Name</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required />
                  <label className="block text-xs mt-4">Last Name</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required />
                  <label className="block text-xs mt-4">New Password</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" name="newPassword" placeholder="New Password" type="password" required />
                  <label className="block text-xs mt-4">Confirm New Password</label>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" name="confirmNewPassword" placeholder="Confirm New Password" type="password" required />
                  <div className='flex flex-col items-center justify-center max-w-sm'>
                    <div className="mt-2 flex justify-between">
                      <div className="mt-2">
                        <input type="radio" id="faculty" name="role" value="Faculty" checked={role === 'Faculty'} onChange={handleRoleChange} defaultChecked />
                        <label className="ml-1 text-xs mr-2">Faculty</label>
                      </div>
                      <div className="mt-2">
                        <input type="radio" id="assistant" name="role" value="Assistant" checked={role === 'Assistant'} onChange={handleRoleChange} />
                        <label className="ml-1 text-xs mr-2">Assistant</label>
                      </div>
                      <div className="mt-2">
                        <input
                          type="radio"
                          value="Department Admin"
                          checked={isDepartmentAdmin}
                          onChange={handleRoleChange}
                        />
                        <label className="ml-1 text-xs mr-2">Department Admin</label>
                      </div>
                      <div className="mt-2">
                        <input type="radio" id="admin" name="role" value="Admin" checked={role === 'Admin'} onChange={handleRoleChange} />
                        <label className="ml-1 text-xs">Admin</label>
                      </div>
                    </div>
                    {isDepartmentAdmin && (
                      <div className="department-input">
                        <label className="block text-xs mt-4">Enter department name (Should be exactly the same as name in list of departments provided during deployment):</label>
                        <input
                          className="input input-bordered mt-1 h-10 w-full text-xs"
                          value={selectedDepartment}
                          onChange={handleDepartmentInputChange}
                          placeholder="Department Name"
                          required
                        />
                      </div>
                    )}
                  </div>
                  <button className="btn btn-neutral mt-4 min-h-5 h-8 w-full" type="submit">Submit</button>
                </form>
                {error && <div className="block max-w-sm text-sm mb-1 mt-6 text-red-600">{error}</div>}
              </div>
            </div>
            
          )}
          {!loading && signUpConfirmation && (
            <div>
              <h1 className="text-3xl font-bold my-3 text-zinc-600">Account not confirmed</h1>
              <p className='text-sm'>Please enter the confirmation code sent to your email.</p>
              <div className='flex flex-col items-center justify-center'>
                <form onSubmit={handleConfirmSignUp}>
                  <input className="input input-bordered mt-1 h-10 w-full text-xs" name="confirmationCode" placeholder="Confirmation Code" required />
                  <button className="btn btn-neutral mt-4 min-h-5 h-8 w-full" type="submit">Submit</button>
                  <button className="btn btn-secondary mt-4 min-h-5 h-8 w-full" type="button" onClick={resendConfirmationCode}>Resend Code</button>
                </form>
                {error && <div className="block mb-1 text-sm mt-6 text-red-600">{error}</div>}
              </div>
              
            </div>
          )}
        </div>
        <div className="w-2/5" style={{ backgroundImage: "url(/UBC.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}></div>
      </div>
   </PageContainer>
  );
};

export default AuthPage;