import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer';
import FacultyMenu from '../Components/FacultyMenu';
import '../CustomStyles/scrollbar.css';
import { getUser } from '../graphql/graphqlHelpers.js';

const HomePage = ({ user }) => {
  const [isSubmitting , setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    async function getUserInfo() {
      try {
        const userInformation = await getUser(user.signInDetails.loginId);
        setUserInfo(userInformation);
        console.log(userInformation);
      } catch (error) {
        console.log('Error getting user:', error);
      }
    }

    getUserInfo();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    // Simulate a delay of 5 seconds
    setTimeout(() => {
      // handle form submission here
      // After 5 seconds, set isSubmitting back to false
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <PageContainer>
      <FacultyMenu userName={user.signInDetails.loginId}></FacultyMenu>
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar'>
        <h1 className="text-4xl font-bold my-3 text-zinc-600">Profile</h1>
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">First Name</label>
              <input id="firstName" type="text" value="Abhi" className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" disabled />
            </div>
            <div>
              <label className="block text-sm mb-1">Last Name</label>
              <input id="lastName" type="text" value="Verma" className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" disabled />
            </div>
            <div>
              <label className="block text-sm mb-1">Preferred Name</label>
              <input id="preferredName" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input id="email" type="text" value={user.signInDetails.loginId} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" disabled />
            </div>
          </div>

          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Institution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">Primary Department</label>
              <input id="primaryDepartment" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Secondary Department</label>
              <input id="secondaryDepartment" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Primary Faculty</label>
              <input id="primaryFaculty" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Secondary Faculty</label>
              <input id="secondaryFaculty" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Current Rank</label>
              <input id="currentRank" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Campus</label>
              <input id="campus" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
          </div>

          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Identifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">Orcid ID</label>
              <input id="orcidId" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Scopus ID</label>
              <input id="scopusId" type="text" className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
          </div>
          <button type="submit" className="btn btn-success py-1 px-2 float-right w-1/5 min-h-0 h-8 leading-tight" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </main>
    </PageContainer>
  );
};

export default HomePage;
