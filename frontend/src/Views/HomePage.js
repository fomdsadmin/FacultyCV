import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer';
import FacultyMenu from '../Components/FacultyMenu';
import '../CustomStyles/scrollbar.css';
import { updateUser } from '../graphql/graphqlHelpers';
import { getUser } from '../graphql/graphqlHelpers.js';

const HomePage = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUser(userInfo);
  }, [userInfo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.target);
      const formValues = {
        preferred_name: formData.get('preferredName'),
        current_rank: formData.get('currentRank'),
        primary_department: formData.get('primaryDepartment'),
        secondary_department: formData.get('secondaryDepartment'),
        primary_faculty: formData.get('primaryFaculty'),
        secondary_faculty: formData.get('secondaryFaculty'),
        campus: formData.get('campus'),
        keywords: formData.get('keywords'),
        institution_user_id: formData.get('institutionUserId'),
        scopus_id: formData.get('scopusId'),
        orcid_id: formData.get('orcidId'),
      };

      console.log('Form Values:', formValues);
      console.log('User ID:', user.user_id);

      const response = await updateUser({
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        ...formValues,
      });

      console.log(response);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <FacultyMenu userName={user.email}></FacultyMenu>
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar'>
        <h1 className="text-4xl font-bold my-3 text-zinc-600">Profile</h1>
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">First Name</label>
              <input id="firstName" type="text" value={user.first_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly />
            </div>
            <div>
              <label className="block text-sm mb-1">Last Name</label>
              <input id="lastName" type="text" value={user.last_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly/>
            </div>
            <div>
              <label className="block text-sm mb-1">Preferred Name</label>
              <input id="preferredName" name="preferredName" type="text" defaultValue={user.preferred_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input id="email" type="text" value={user.email || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly />
            </div>
          </div>

          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Institution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">Primary Department</label>
              <input id="primaryDepartment" name="primaryDepartment" type="text" defaultValue={user.primary_department || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Secondary Department</label>
              <input id="secondaryDepartment" name="secondaryDepartment" type="text" defaultValue={user.secondary_department || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Primary Faculty</label>
              <input id="primaryFaculty" name="primaryFaculty" type="text" defaultValue={user.primary_faculty || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Secondary Faculty</label>
              <input id="secondaryFaculty" name="secondaryFaculty" type="text" defaultValue={user.secondary_faculty || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Current Rank</label>
              <input id="currentRank" name="currentRank" type="text" defaultValue={user.rank || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Campus</label>
              <input id="campus" name="campus" type="text" defaultValue={user.campus || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
          </div>

          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Identifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">Orcid ID</label>
              <input id="orcidId" name="orcidId" type="text" defaultValue={user.orcid_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
            </div>
            <div>
              <label className="block text-sm mb-1">Scopus ID</label>
              <input id="scopusId" name="scopusId" type="text" defaultValue={user.scopus_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" />
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
