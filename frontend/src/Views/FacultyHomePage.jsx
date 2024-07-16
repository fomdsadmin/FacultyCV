import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import '../CustomStyles/scrollbar.css';
import { linkScopusId, updateUser } from '../graphql/graphqlHelpers.js';
import { getAllUniversityInfo, getElsevierAuthorMatches } from '../graphql/graphqlHelpers.js';

const FacultyHomePage = ({ userInfo, getCognitoUser, getUser }) => {
  const [user, setUser] = useState(userInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  // TODO - To fix this -> too many requests being made, old state retained after auth
  useEffect(() => {
    setUser(userInfo);
    console.log(userInfo);
    sortUniversityInfo();
    const getElsevierMatches = async () => {
      console.log(await getElsevierAuthorMatches(user.first_name, user.last_name, 'University of British Columbia'));
      console.log(await linkScopusId(user.user_id, '12345'));
    }
    getElsevierMatches();
  }, [user, userInfo]);

  const sortUniversityInfo = () => {
    getAllUniversityInfo().then(result => {
      let departments = [];
      let faculties = [];
      let campuses = [];

      result.forEach(element => {
        if (element.type === 'Department') {
          departments.push(element.value);
        } else if (element.type === 'Faculty') {
          faculties.push(element.value);
        } else if (element.type === 'Campus') {
          campuses.push(element.value);
        }
      });

      // Sort arrays alphabetically
      departments.sort();
      faculties.sort();
      campuses.sort();

      // Update state
      setDepartments(departments);
      setFaculties(faculties);
      setCampuses(campuses);
      setLoading(false);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateUser(
        user.user_id, 
        user.first_name,
        user.last_name, 
        user.preferred_name, 
        user.email,
        user.role,
        user.bio,
        user.rank,
        user.primary_department,
        user.secondary_department,
        user.primary_faculty,
        user.secondary_faculty,
        user.campus,
        '',
        user.institution_user_id,
        user.scopus_id,
        user.orcid_id
      );
      console.log(result);
      getUser(user.email);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <FacultyMenu getCognitoUser={getCognitoUser} userName={user.preferred_name || user.first_name}></FacultyMenu>
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar'>
        <h1 className="text-4xl font-bold my-3 text-zinc-600">Profile</h1>
        {loading ? (
          <div className='flex items-center justify-center w-full'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
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
                <input id="preferredName" name="preferredName" type="text" value={user.preferred_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, preferred_name: e.target.value })}/>
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input id="email" type="text" value={user.email || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly />
              </div>
              
            </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Bio</h2>
              <div className="col-span-1 sm:col-span-2 md:col-span-4">
                <textarea id="bio" name="bio" value={user.bio || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, bio: e.target.value })}></textarea>
              </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Institution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-1">Primary Department</label>
                <select id="primaryDepartment" name="primaryDepartment" value={user.primary_department || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, primary_department: e.target.value })}>
                  <option value="">-</option>
                  {departments.map((department, index) => <option key={index} value={department}>{department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Department</label>
                <select id="secondaryDepartment" name="secondaryDepartment" value={user.secondary_department || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, secondary_department: e.target.value })}>
                  <option value="">-</option>
                  {departments.map((department, index) => <option key={index} value={department}>{department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Primary Faculty</label>
                <select id="primaryFaculty" name="primaryFaculty" value={user.primary_faculty || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, primary_faculty: e.target.value })}>
                  <option value="">-</option>
                  {faculties.map((faculty, index) => <option key={index} value={faculty}>{faculty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Faculty</label>
                <select id="secondaryFaculty" name="secondaryFaculty" value={user.secondary_faculty || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, secondary_faculty: e.target.value })}>
                  <option value="">-</option>
                  {faculties.map((faculty, index) => <option key={index} value={faculty}>{faculty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Campus</label>
                <select id="campus" name="campus" value={user.campus || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, campus: e.target.value })}>
                  <option value="">-</option>
                  {campuses.map((campus, index) => <option key={index} value={campus}>{campus}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Current Rank</label>
                <input id="currentRank" name="currentRank" type="text" value={user.rank || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, rank: e.target.value })}/>
              </div>
            </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Identifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-1">Institution ID</label>
                <input id="institutionUserId" name="institutionUserId" type="text" value={user.institution_user_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, institution_user_id: e.target.value })}/>
              </div>
              <div>
                <label className="block text-sm mb-1">Orcid ID</label>
                <input id="orcidId" name="orcidId" type="text" value={user.orcid_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, orcid_id: e.target.value })}/>
              </div>
              <div>
                <label className="block text-sm mb-1">Scopus ID</label>
                <input id="scopusId" name="scopusId" type="text" value={user.scopus_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUser({ ...user, scopus_id: e.target.value })}/>
              </div>
            </div>
            <button type="submit" className="btn btn-success text-white py-1 px-2 float-right w-1/5 min-h-0 h-8 leading-tight" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}
      </main>
    </PageContainer>
  );
};

export default FacultyHomePage;
