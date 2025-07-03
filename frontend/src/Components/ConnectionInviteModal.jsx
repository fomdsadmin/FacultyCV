import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserConnection, getUser } from '../graphql/graphqlHelpers';

const ConnectionInviteModal = ({ userInfo, getAllUserConnections, setIsModalOpen, admin = false, departmentAdmin = false, department='' }) => {
  const [email, setEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [error, setError] = useState('');

  const sendInvite = async () => {
    setSendingInvite(true);
    setError('');

    if (email === '') {
      setError('Please enter an email');
      setSendingInvite(false);
      return;
    }

    if (email === userInfo.email) {
      setError('You cannot form a connection with yourself');
      setSendingInvite(false);
      return;
    }

    let facultyMember;
    try {
      // Get faculty member by email
      facultyMember = await getUser(email);
    } catch (error) {
      console.error('Error finding user:', error);
      setError('No user exists. Please enter valid email');
      setSendingInvite(false);
      return;
    }

    if (facultyMember.role !== 'Faculty') {
      setError('User is not a faculty member');
      setSendingInvite(false);
      return;
    }

    try {
      // Call the addUserConnection function with the necessary parameters
      const result = await addUserConnection(facultyMember.user_id, facultyMember.first_name, facultyMember.last_name, facultyMember.email, userInfo.user_id, userInfo.first_name, userInfo.last_name, userInfo.email, 'pending');
      
      if (result === 'connection already exists') {
        setError('Connection already exists');
        setSendingInvite(false);
        return;
      }
      getAllUserConnections();
      setIsModalOpen(false); // Close the modal on success
    } catch (error) {
      console.error('Error sending invite:', error);
      setError('Error sending invite. Please try again.');
    }

    setSendingInvite(false);
  };

  const formConnection = async () => {
    setSendingInvite(true);
    setError('');

    if (email === '') {
      setError('Please enter an email');
      setSendingInvite(false);
      return;
    }

    if (email === userInfo.email) {
      setError('You cannot form a connection with yourself');
      setSendingInvite(false);
      return;
    }

    let member;
    try {
      // Get member by email
      member = await getUser(email);
      
    } catch (error) {
      console.error('Error finding user:', error);
      setError('No user exists. Please enter valid email');
      setSendingInvite(false);
      return;
    }

    if (userInfo.role==='Assistant' && member.role !== 'Faculty') {
      setError('Assistants can only form connections with faculty members');
      setSendingInvite(false);
      return;
    }

    if (userInfo.role==='Faculty' && member.role !== 'Assistant') {
      setError('Faculty can only form connections with assistants');
      setSendingInvite(false);
      return;
    }

    if (departmentAdmin) {
      
      if (userInfo.role==='Assistant' && member.primary_department !== department && member.secondary_department !== department) {
        setError('You can only form connections with faculty in your department');
        setSendingInvite(false);
        return;
      }
    }

    try {
      let result;
      if (userInfo.role === 'Faculty') {
        result = await addUserConnection(userInfo.user_id, userInfo.first_name, userInfo.last_name, userInfo.email, member.user_id, member.first_name, member.last_name, member.email, 'confirmed');
      } else {
        // Call the addUserConnection function with the necessary parameters
        result = await addUserConnection(member.user_id, member.first_name, member.last_name, member.email, userInfo.user_id, userInfo.first_name, userInfo.last_name, userInfo.email, 'confirmed');
      }
      
      
      if (result === 'connection already exists') {
        setError('Connection already exists');
        setSendingInvite(false);
        return;
      }
      getAllUserConnections();
      setIsModalOpen(false); // Close the modal on success
    } catch (error) {
      console.error('Error sending invite:', error);
      setError('Error sending invite. Please try again.');
    }

    setSendingInvite(false);
  }

  return (
    <dialog className="modal-dialog ml-4" open>
      <div className="modal-content">
        <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={() => setIsModalOpen(false)}>✕</button>
        
        <h2 className="text-xl font-bold mb-4">
          {admin ? 'Create Connection' : 'Send Connection Invite'}
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Enter user's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <div className="flex justify-end">
          <button 
            type="submit" 
            onClick={admin ? formConnection : sendInvite} 
            className="btn btn-accent text-white mt-1 py-1 px-2 w-1/5 min-h-0 leading-tight" 
            disabled={sendingInvite}
          >
            {sendingInvite ? 'Processing...' : admin ? 'Create Connection' : 'Send Invite'}
          </button>
        </div>
      </div>
    </dialog>
  );  
};

export default ConnectionInviteModal;
