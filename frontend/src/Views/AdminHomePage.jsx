import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import Filters from '../Components/Filters.jsx';
import ManageUser from '../Components/ManageUser.jsx';
import UserCard from '../Components/UserCard.jsx';
import { getAllUsers } from '../graphql/graphqlHelpers.js';

const AdminHomePage = ({ userInfo, getCognitoUser }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  async function fetchAllUsers() {
    setLoading(true);
    try {
        const users = await getAllUsers();
        const filteredUsers = users.filter(user => user.email !== userInfo.email);
        console.log(filteredUsers);
        setUsers(filteredUsers);
    } catch (error) {
        console.log('Error getting users:', error);
    }
    setLoading(false);
}

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filters = Array.from(new Set(users.map(user => user.role)));

  const handleManageClick = (value) => {
    const user = users.filter((user) => user.user_id === value);
    setActiveUser(user[0]);
  }

  const searchedUsers = users
    .filter(user => {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const email = user.email || '';

      const matchesSearch = firstName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        email.toLowerCase().startsWith(searchTerm.toLowerCase());

      const matchesFilter = activeFilters.length === 0 || activeFilters.includes(user.role);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const firstNameA = a.first_name.toLowerCase();
      const firstNameB = b.first_name.toLowerCase();
      const lastNameA = a.last_name.toLowerCase();
      const lastNameB = b.last_name.toLowerCase();

      if (firstNameA < firstNameB) return -1;
      if (firstNameA > firstNameB) return 1;
      if (lastNameA < lastNameB) return -1;
      if (lastNameA > lastNameB) return 1;
      return 0;
  });


  const handleBack = () => {
    setActiveUser(null);
  };

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Users</h1>
        {loading ? (
          <div className='flex items-center justify-center w-full'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div>
            {activeUser === null ? (
              <div className='!overflow-auto !h-full custom-scrollbar'>
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
                </div>
                <Filters activeFilters={activeFilters} onFilterChange={setActiveFilters} filters={filters}></Filters>
                {searchedUsers.map((user) => (
                  <UserCard onClick={handleManageClick} key={user.user_id} id={user.user_id} firstName={user.first_name} lastName={user.last_name} email={user.email} role={user.role}></UserCard>
                ))}
              </div>
            ) : (
              <div className='!overflow-auto !h-full custom-scrollbar'>
                <ManageUser user={activeUser} onBack={handleBack} fetchAllUsers={fetchAllUsers}></ManageUser>                
              </div>
            )}
          </div>
        )}
      </main>
    </PageContainer>
  )
}

export default AdminHomePage;