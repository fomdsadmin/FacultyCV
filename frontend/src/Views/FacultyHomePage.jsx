import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import '../CustomStyles/scrollbar.css';
import ProfileLinkModal from '../Components/ProfileLinkModal.jsx';
import { getOrcidAuthorMatches, linkOrcid, linkScopusId, updateUser } from '../graphql/graphqlHelpers.js';
import { getAllUniversityInfo, getElsevierAuthorMatches } from '../graphql/graphqlHelpers.js';

const FacultyHomePage = ({ userInfo, setUserInfo, getCognitoUser, getUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [scopusId, setScopusId] = useState(userInfo.scopus_id || "");
  const [orcidId, setOrcidId] = useState(userInfo.orcid_id || "");

  useEffect(() => {
    sortUniversityInfo();
  }, [userInfo]);

  const sortUniversityInfo = () => {
    getAllUniversityInfo().then(result => {
      let departments = [];
      let faculties = [];
      let campuses = [];
      let ranks = [];

      result.forEach(element => {
        if (element.type === 'Department') {
          departments.push(element.value);
        } else if (element.type === 'Faculty') {
          faculties.push(element.value);
        } else if (element.type === 'Campus') {
          campuses.push(element.value);
        } else if (element.type === 'Rank') {
          ranks.push(element.value);
        }
      });

      departments.sort();
      faculties.sort();
      campuses.sort();
      ranks.sort();

      setDepartments(departments);
      setFaculties(faculties);
      setCampuses(campuses);
      setRanks(ranks);
      setLoading(false);
    });
  };

  const showModal = () => {
    setModal(!modal);
  };

  const handleClose = () => {
    setModal(false);
  };

  const handleLink = async (newScopusId, newOrcidId) => {
    try {
      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        userInfo.role,
        userInfo.bio,
        userInfo.rank,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.campus,
        '',
        userInfo.institution_user_id,
        newScopusId,
        newOrcidId
      );
      setScopusId(newScopusId);
      setOrcidId(newOrcidId);
      getUser(userInfo.email);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };
  
  /*const testOnClick = async () => {
    const result = await getTeachingDataMatches(userInfo.institution_user_id);
    console.log(result);
    console.log(await linkTeachingData(userInfo.user_id, result[0].data_details))
  }*/

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        userInfo.role,
        userInfo.bio,
        userInfo.rank,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.campus,
        '',
        userInfo.institution_user_id,
        scopusId,
        orcidId
      );
      getUser(userInfo.email);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <FacultyMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name}></FacultyMenu>
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
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
                <input id="firstName" type="text" value={userInfo.first_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly />
              </div>
              <div>
                <label className="block text-sm mb-1">Last Name</label>
                <input id="lastName" type="text" value={userInfo.last_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly/>
              </div>
              <div>
                <label className="block text-sm mb-1">Preferred Name</label>
                <input id="preferredName" name="preferredName" type="text" value={userInfo.preferred_name || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, preferred_name: e.target.value })}/>
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input id="email" type="text" value={userInfo.email || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" readOnly />
              </div>
            </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Bio</h2>
              <div className="col-span-1 sm:col-span-2 md:col-span-4">
                <textarea id="bio" name="bio" value={userInfo.bio || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, bio: e.target.value })}></textarea>
              </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Institution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
                <label className="block text-sm mb-1">Primary Faculty</label>
                <select id="primaryFaculty" name="primaryFaculty" value={userInfo.primary_faculty || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, primary_faculty: e.target.value })}>
                  <option value="">-</option>
                  {faculties.map((faculty, index) => <option key={index} value={faculty}>{faculty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Faculty</label>
                <select id="secondaryFaculty" name="secondaryFaculty" value={userInfo.secondary_faculty || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, secondary_faculty: e.target.value })}>
                  <option value="">-</option>
                  {faculties.map((faculty, index) => <option key={index} value={faculty}>{faculty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Primary Department</label>
                <select id="primaryDepartment" name="primaryDepartment" value={userInfo.primary_department || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, primary_department: e.target.value })}>
                  <option value="">-</option>
                  {departments.map((department, index) => <option key={index} value={department}>{department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Department</label>
                <select id="secondaryDepartment" name="secondaryDepartment" value={userInfo.secondary_department || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, secondary_department: e.target.value })}>
                  <option value="">-</option>
                  {departments.map((department, index) => <option key={index} value={department}>{department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Campus</label>
                <select id="campus" name="campus" value={userInfo.campus || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, campus: e.target.value })}>
                  <option value="">-</option>
                  {campuses.map((campus, index) => <option key={index} value={campus}>{campus}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Current Rank</label>
                <select id="rank" name="rank" value={userInfo.rank || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, rank: e.target.value })}>
                  <option value="">-</option>
                  {ranks.map((rank, index) => <option key={index} value={rank}>{rank}</option>)}
                </select>
              </div>
            </div>

            {modal && (
              <ProfileLinkModal 
                setClose={handleClose} 
                orcidId={orcidId} 
                setOrcidId={setOrcidId} 
                scopusId={scopusId} 
                setScopusId={setScopusId} 
                onLink={handleLink} 
              />
            )}

            <button type="button" onClick={showModal} className="btn btn-secondary text-white py-1 px-2 float-left w-1/5 min-h-0 h-8 leading-tight">
              Link to Identifications
            </button>

          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Identifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-1">Institution ID</label>
              <input id="institutionUserId" name="institutionUserId" type="text" value={userInfo.institution_user_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, institution_user_id: e.target.value })}/>
            </div>
            <div>
              <label className="block text-sm mb-1">Orcid ID</label>
              <input id="orcidId" name="orcidId" type="text" value={userInfo.orcid_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, orcid_id: e.target.value })}/>
            </div>
            <div>
              <label className="block text-sm mb-1">Scopus IDs</label>
              <input id="scopusId" name="scopusId" type="text" value={userInfo.scopus_id || ''} className="w-full rounded text-sm px-3 py-2 border border-gray-300" onChange={(e) => setUserInfo({ ...userInfo, scopus_id: e.target.value })}/>
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
