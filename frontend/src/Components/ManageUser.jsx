import React from "react";
import { useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import ConnectionCard from "./ConnectionCard";
import AssociatedUser from "./AssociatedUser";
import ConnectionInviteModal from "./ConnectionInviteModal";
import ChangeRoleModal from "./ChangeRoleModal";
import { getUserConnections } from '../graphql/graphqlHelpers';
import { IoMdAddCircleOutline } from "react-icons/io";

const ManageUser = ({ user, onBack, fetchAllUsers }) => {
  const [loading, setLoading] = useState(true);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);

  useEffect(() => {
    setLoading(true);
    getAllUserConnections();
    setLoading(false)
  }, [searchTerm]);

  async function getAllUserConnections() {
    try {
      let retrievedUserConnections;
      if (user.role === 'Faculty') {
        retrievedUserConnections = await getUserConnections(user.user_id);
      } else {
        retrievedUserConnections = await getUserConnections(user.user_id, false);
      }

      const filteredUserConnections = retrievedUserConnections.filter(connection => 
        connection.assistant_first_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        connection.assistant_last_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        connection.assistant_email.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      
      console.log('User connections', retrievedUserConnections);
      setPendingConnections(filteredUserConnections.filter(connection => connection.status === 'pending'));
      setConfirmedConnections(filteredUserConnections.filter(connection => connection.status === 'confirmed'));
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleBack = () => {
    onBack();
  };

  const handleChangeRole = () => {
    console.log('Change role');
    console.log(user);
    setIsChangeRoleModalOpen(true);
  }

  return (                
    <div>
      <button onClick={handleBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4'>
        <FaArrowLeft className="h-6 w-6 text-zinc-800" />
      </button>
      <div className='m-4 flex items-center'>
        <div>
          <h2 className="text-left text-4xl font-bold text-zinc-600">{user.first_name} {user.last_name}</h2>
          <p className="text-left mt-2 text-xl text-zinc-600">{user.role}</p>
        </div>
        <button onClick={handleChangeRole} className='ml-auto text-white btn btn-info min-h-0 h-8 leading-tight'>Change Role</button>
      </div>
      {loading ? (
        <div className='flex items-center justify-center w-full'>
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div>
          <div className='m-4 flex'>
            <label className="input input-bordered flex items-center gap-2 flex-1">
              <input
                type="text"
                className="grow"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd" />
              </svg>
            </label>
            <button onClick={()=>{setIsConnectionModalOpen(true)}} className="btn btn-ghost">
              <IoMdAddCircleOutline className="h-8 w-8 text-gray-600" />
            </button>
          </div>
          {user.role === 'Faculty' && (
            <>
              {pendingConnections.length === 0 && confirmedConnections.length === 0 ? (
                <div className="text-center m-4 text-lg text-zinc-600">No connections found</div>
              ) : (
                <>
                  {pendingConnections.length > 0 && 
                    <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Invitations</h2>
                  }
                  <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                    {pendingConnections.map((connection) => (
                      <AssociatedUser key={connection.user_connection_id} connection={connection} getAllUserConnections={getAllUserConnections}/>
                    ))}
                  </div>
                  
                  {confirmedConnections.length > 0 &&
                    <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Active</h2>
                  }
                  <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                    {confirmedConnections.map((connection) => (
                      <AssociatedUser key={connection.user_connection_id} connection={connection} getAllUserConnections={getAllUserConnections}/>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {user.role === 'Assistant' && (
            <>
              {pendingConnections.length === 0 && confirmedConnections.length === 0 ? (
                <div className="text-center m-4 text-lg text-zinc-600">No connections found</div>
              ) : (
                <>
                  {pendingConnections.length > 0 && 
                    <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Invitations</h2>
                  }
                  <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                    {pendingConnections.map((connection) => (
                      <AssociatedUser key={connection.user_connection_id} connection={connection} getAllUserConnections={getAllUserConnections}/>
                    ))}
                  </div>
                  
                  {confirmedConnections.length > 0 &&
                    <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Active</h2>
                  }
                  <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                    {confirmedConnections.map((connection) => (
                      <AssociatedUser key={connection.user_connection_id} connection={connection} getAllUserConnections={getAllUserConnections}/>
                    ))}{pendingConnections.length > 0 && 
                      <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Pending</h2>
                    }
                    <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                      {pendingConnections.map((connection) => (
                        <ConnectionCard key={connection.user_connection_id} firstName={connection.faculty_first_name} lastName={connection.faculty_last_name} emaill={connection.faculty_email} role='Faculty'/>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isConnectionModalOpen && (
            <ConnectionInviteModal
              userInfo={user}
              getAllUserConnections={getAllUserConnections}
              setIsModalOpen={setIsConnectionModalOpen}
              admin={true}
            />
          )}

          {isChangeRoleModalOpen && (
            <ChangeRoleModal
              userInfo={user}
              setIsModalOpen={setIsChangeRoleModalOpen}
              fetchAllUsers={fetchAllUsers}
              handleBack={handleBack}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ManageUser;
