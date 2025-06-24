import React, { useState, useEffect } from 'react';
import Assistant_FacultyMenu from '../Components/Assistant_FacultyMenu.jsx';
import AssistantMenu from '../Components/AssistantMenu.jsx';
import '../CustomStyles/scrollbar.css';
import ProfileLinkModal from '../Components/ProfileLinkModal.jsx';
import { updateUser } from '../graphql/graphqlHelpers.js';
import { getAllUniversityInfo } from '../graphql/graphqlHelpers.js';
import AssistantPageContainer from '../Components/AssistantPageContainer.jsx';

const Assistant_FacultyHomePage = ({ assistantUserInfo, userInfo, setUserInfo, getUser, getCognitoUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [affiliations, setAffilitations] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopusId, setScopusId] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [change, setChange] = useState(false);

  useEffect(() => {
    // Initialize IDs from userInfo
    if (userInfo) {
      setScopusId(userInfo.scopus_id || "");
      setOrcidId(userInfo.orcid_id || "");
    }
    sortUniversityInfo();
  }, [userInfo]);

  const sortUniversityInfo = () => {
    getAllUniversityInfo().then(result => {
      const departments = result.filter(item => item.type === 'Department').map(item => item.value).sort();
      const faculties = result.filter(item => item.type === 'Faculty').map(item => item.value).sort();
      const campuses = result.filter(item => item.type === 'Campus').map(item => item.value).sort();
      const ranks = result.filter(item => item.type === 'Rank').map(item => item.value).sort();
      const affiliations = result.filter(item => item.type === 'Affiliation').map(item => item.value).sort();
      const institutions = result.filter(item => item.type === 'Institution').map(item => item.value).sort();

      setAffilitations(affiliations);
      setInstitutions(institutions);
      setDepartments(departments);
      setFaculties(faculties);
      setCampuses(campuses);
      setRanks(ranks);
      setLoading(false);
    });
  };

  const handleScopusIdClick = () => {
    setActiveModal('Scopus');
    setModalOpen(true);
  };

  const handleOrcidIdClick = () => {
    setActiveModal('Orcid');
    setModalOpen(true);
  };

  const handleClearScopusId = () => {
    setScopusId("");
    setChange(true);
  };

  const handleClearOrcidId = () => {
    setOrcidId("");
    setChange(true);
  };

  const handleScopusLink = (newScopusId) => {
    const updatedScopusId = scopusId ? `${scopusId},${newScopusId}` : newScopusId;
    setScopusId(updatedScopusId);
    setModalOpen(false);
    setChange(true);
  };

  const handleOrcidLink = (newOrcidId) => {
    setOrcidId(newOrcidId);
    setModalOpen(false);
    setChange(true);
  };

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
        userInfo.institution,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.primary_affiliation,
        userInfo.secondary_affiliation,
        userInfo.campus,
        '',
        userInfo.institution_user_id,
        scopusId,
        orcidId
      );
      getUser(userInfo.email);
      setIsSubmitting(false);
      setChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserInfo((prevUserInfo) => ({
      ...prevUserInfo,
      [name]: value,
    }));
    setChange(true);
  };
  
  return (
    <div>
      {/* <AssistantMenu getCognitoUser={getCognitoUser} userName={assistantUserInfo.preferred_name || assistantUserInfo.first_name}></AssistantMenu> */}
      <AssistantPageContainer>
        <Assistant_FacultyMenu userInfo={userInfo} assistantUserInfo={assistantUserInfo}></Assistant_FacultyMenu>
        <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4 relative'>
        
        <div className="flex items-center justify-between mt-4 mb-4">
          <h1 className="text-4xl ml-4 font-bold text-zinc-600">Profile</h1>
          <button
            type="button"
            className={`btn text-white py-1 px-2 w-1/5 min-h-0 h-8 leading-tight ${
              change ? 'btn-success' : 'btn-disabled cursor-not-allowed bg-gray-400'
            }`}
            disabled={!change || isSubmitting}
            onClick={change ? handleSubmit : null}
          >
            {isSubmitting ? 'Saving...' : change ? 'Save' : 'Saved'}
          </button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center w-full'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='ml-4'>
            
            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-1">First Name</label>
                <input 
                  id="firstName" 
                  name="first_name" 
                  type="text" 
                  value={userInfo.first_name || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" 
                  readOnly 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Last Name</label>
                <input 
                  id="lastName" 
                  name="last_name" 
                  type="text" 
                  value={userInfo.last_name || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" 
                  readOnly 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Preferred Name</label>
                <input 
                  id="preferredName" 
                  name="preferred_name" 
                  type="text" 
                  maxLength={100}
                  value={userInfo.preferred_name || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input 
                  id="email" 
                  name="email" 
                  type="text" 
                  value={userInfo.email || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed" 
                  readOnly 
                />
              </div>
            </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Bio</h2>
            <div className="col-span-1 sm:col-span-2 md:col-span-4">
              <textarea 
                id="bio" 
                name="bio" 
                value={userInfo.bio || ''} 
                maxLength={500}
                className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                onChange={handleInputChange} 
              ></textarea>
            </div>

            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Institution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-1">Institution Name</label>
                <select 
                  id="institution" 
                  name="institution" 
                  value={userInfo.institution || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {institutions.map((institution, index) => <option key={index} value={institution}>{institution}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Primary Faculty</label>
                <select 
                  id="primaryFaculty" 
                  name="primary_faculty" 
                  value={userInfo.primary_faculty || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {faculties.map((faculty, index) => <option key={index} value={faculty}>{faculty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Faculty</label>
                <select 
                  id="secondaryFaculty" 
                  name="secondary_faculty" 
                  value={userInfo.secondary_faculty || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {faculties.map((faculty, index) => <option key={index} value={faculty}>{faculty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Primary Department</label>
                <select 
                  id="primaryDepartment" 
                  name="primary_department" 
                  value={userInfo.primary_department || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {departments.map((department, index) => <option key={index} value={department}>{department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Department</label>
                <select 
                  id="secondaryDepartment" 
                  name="secondary_department" 
                  value={userInfo.secondary_department || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {departments.map((department, index) => <option key={index} value={department}>{department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Primary Affiliation</label>
                <select 
                  id="primaryAffiliation" 
                  name="primary_affiliation" 
                  value={userInfo.primary_affiliation || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {affiliations.map((affiliation, index) => <option key={index} value={affiliation}>{affiliation}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Secondary Affiliation</label>
                <select 
                  id="secondaryAffiliation" 
                  name="secondary_affiliation" 
                  value={userInfo.secondary_affiliation || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {affiliations.map((affiliation, index) => <option key={index} value={affiliation}>{affiliation}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Campus</label>
                <select 
                  id="campus" 
                  name="campus" 
                  value={userInfo.campus || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {campuses.map((campus, index) => <option key={index} value={campus}>{campus}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Current Rank</label>
                <select 
                  id="rank" 
                  name="rank" 
                  value={userInfo.rank || ''} 
                  className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                  onChange={handleInputChange} 
                >
                  <option value="">-</option>
                  {ranks.map((rank, index) => <option key={index} value={rank}>{rank}</option>)}
                </select>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-2 text-zinc-500">Identifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm">Scopus ID(s):</label>
                  {scopusId && (
                    <button
                      type="button"
                      className="btn btn-xs btn-warning text-white font-bold"
                      onClick={handleClearScopusId}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {scopusId && scopusId.split(',').map((id, index) => (
                    <button
                      key={index}
                      type="button"
                      className="btn btn-sm btn-secondary text-white py-1 px-2"
                      onClick={() => window.open(`https://www.scopus.com/authid/detail.uri?authorId=${id}`, '_blank')}
                    >
                      {id}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleScopusIdClick}
                    className="btn btn-sm btn-success text-white py-1 px-2 w-full"
                  >
                    Add Scopus ID
                    </button>
                    <button
                    type="button"
                    onClick={() => {
                      setActiveModal('ManualScopus'); // Set to manual entry mode
                      setModalOpen(true);
                    }}
                    className="btn btn-sm btn-secondary text-white py-1 px-2 w-full mt-2"
                  >
                    Add Scopus ID Manually
                  </button>
                </div>
              </div>
              <div>
                <div className='flex flex-wrap justify-between mb-2'>
                  <label className="block text-sm">ORCID ID:</label>
                  {orcidId && ( 
                    <button
                      type="button"
                      className="btn btn-xs btn-warning text-white ml-2 font-bold"
                      onClick={handleClearOrcidId}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => orcidId ? window.open(`https://orcid.org/${orcidId}`, '_blank') : handleOrcidIdClick()}
                  className={`btn btn-sm ${orcidId ? 'btn-secondary' : 'btn-success'} text-white py-1 px-2 w-full`}
                >
                  {orcidId ? `${orcidId}` : "Add ORCID ID"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('ManualOrcid'); // Set to manual ORCID entry mode
                    setModalOpen(true);
                  }}
                  className="btn btn-sm btn-secondary text-white py-1 px-2 w-full mt-2"
                >
                  Add ORCID ID Manually
               </button>
              </div>
            </div>
          </form>
        )}
      </main>
      {modalOpen && (
        <ProfileLinkModal 
          user={userInfo}
          activeModal={activeModal}
          setClose={handleCloseModal} 
          setOrcidId={handleOrcidLink} 
          setScopusId={handleScopusLink} 
          institution={userInfo.institution}
        />
      )}
      </AssistantPageContainer>
    </div>
    
  );
};

export default Assistant_FacultyHomePage;
