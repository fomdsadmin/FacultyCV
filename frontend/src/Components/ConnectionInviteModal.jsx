import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserConnection, getUser } from '../graphql/graphqlHelpers';
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const ConnectionInviteModal = ({ userInfo, getAllUserConnections, setIsModalOpen, admin = false, departmentAdmin = false, department = '' }) => {
  const [username, setUsername] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [error, setError] = useState('');
  const { logAction } = useAuditLogger();

  const sendInvite = async () => {
    setSendingInvite(true);
    setError('');

    if (username === '') {
      setError('Please enter an username');
      setSendingInvite(false);
      return;
    }

    if (username === userInfo.username) {
      setError('You cannot form a connection with yourself');
      setSendingInvite(false);
      return;
    }

    let facultyMember;
    try {
      // Get faculty member by username
      facultyMember = await getUser(username);
    } catch (error) {
      console.error('Error finding user:', error);
      setError('No user exists. Please enter valid username');
      setSendingInvite(false);
      return;
    }

    // if (facultyMember.role !== 'Faculty') {
    //   setError('User is not a faculty member');
    //   setSendingInvite(false);
    //   return;
    // }

    try {
      // Call the addUserConnection function with the necessary parameters
      const result = await addUserConnection(facultyMember.user_id, facultyMember.first_name, facultyMember.last_name, facultyMember.email, userInfo.user_id, userInfo.first_name, userInfo.last_name, userInfo.email, 'pending', facultyMember.username, userInfo.username);

      if (result === 'connection already exists') {
        setError('Connection already exists');
        setSendingInvite(false);
        return;
      }
      getAllUserConnections();
      // Log the invite action
      await logAction(AUDIT_ACTIONS.FORM_CONNECTION, {
        facultyMemberId: facultyMember.user_id,
        facultyMemberName: `${facultyMember.first_name} ${facultyMember.last_name}`,
        facultyEmail: facultyMember.email
      });
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

    if (username === '') {
      setError('Please enter an username');
      setSendingInvite(false);
      return;
    }

    if (username === userInfo.username) {
      setError('You cannot form a connection with yourself');
      setSendingInvite(false);
      return;
    }

    let member;
    try {
      // Get member by username
      member = await getUser(username);

    } catch (error) {
      console.error('Error finding user:', error);
      setError('No user exists. Please enter valid username');
      setSendingInvite(false);
      return;
    }

    if (userInfo.role === 'Assistant' && member.role !== 'Faculty') {
      setError('Assistants can only form connections with faculty members');
      setSendingInvite(false);
      return;
    }

    if (userInfo.role === 'Faculty' && member.role !== 'Assistant') {
      setError('Faculty can only form connections with assistants');
      setSendingInvite(false);
      return;
    }

    if (departmentAdmin) {

      if (userInfo.role === 'Assistant' && member.primary_department !== department && member.secondary_department !== department) {
        setError('You can only form connections with faculty in your department');
        setSendingInvite(false);
        return;
      }
    }

    try {
      let result;
      if (userInfo.role === 'Faculty') {
        result = await addUserConnection(userInfo.user_id, userInfo.first_name, userInfo.last_name, userInfo.email, member.user_id, member.first_name, member.last_name, member.email, 'confirmed', userInfo.username, member.username);
      } else {
        // Call the addUserConnection function with the necessary parameters
        result = await addUserConnection(member.user_id, member.first_name, member.last_name, member.email, userInfo.user_id, userInfo.first_name, userInfo.last_name, userInfo.email, 'confirmed', member.username, userInfo.username);
      }


      if (result === 'connection already exists') {
        setError('Connection already exists');
        setSendingInvite(false);
        return;
      }
      getAllUserConnections();
      setIsModalOpen(false); // Close the modal on success
      // Log the invite action
      await logAction(AUDIT_ACTIONS.SEND_CONNECTION_INVITE, {
        memberId: member.user_id,
        memberName: `${member.first_name} ${member.last_name}`,
        memberEmail: member.email
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      setError('Error sending invite. Please try again.');
    }

    setSendingInvite(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-50">
          <button 
            type="button" 
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors duration-200" 
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>

          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {admin ? 'Create Connection' : 'Send Connection Invite'}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Enter user's username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={sendingInvite}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={admin ? formConnection : sendInvite}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 disabled:opacity-50"
                disabled={sendingInvite}
              >
                {sendingInvite ? 'Processing...' : admin ? 'Create Connection' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConnectionInviteModal;
