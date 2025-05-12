import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import '../CustomStyles/scrollbar.css';
import { updateUser } from '../graphql/graphqlHelpers.js';
import { getAllUniversityInfo } from '../graphql/graphqlHelpers.js';
import { getOrcidSections } from '../graphql/graphqlHelpers.js';
import ProfileLinkModal from '../Components/ProfileLinkModal.jsx'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const FacultyHomePage = ({ userInfo, setUserInfo, getCognitoUser, getUser, toggleViewMode }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [affiliations, setAffilitations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopusId, setScopusId] = useState(userInfo.scopus_id || "");
  const [orcidId, setOrcidId] = useState(userInfo.orcid_id || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [change, setChange] = useState(false);
  const [showBioWarningDialog, setShowBioWarningDialog] = useState(false);
  const [showKeywordsWarningDialog, setShowKeywordsWarningDialog] = useState(false);

  useEffect(() => {
    sortUniversityInfo();
  }, [userInfo]);


  const sortUniversityInfo = () => {
    getAllUniversityInfo().then(result => {
      let departments = [];
      let faculties = [];
      let campuses = [];
      let ranks = [];
      let affiliations = [];
      let institutions = [];

      result.forEach(element => {
        if (element.type === 'Department') {
          departments.push(element.value);
        } else if (element.type === 'Faculty') {
          faculties.push(element.value);
        } else if (element.type === 'Campus') {
          campuses.push(element.value);
        } else if (element.type === 'Rank') {
          ranks.push(element.value);
        } else if (element.type === 'Affiliation') {
          affiliations.push(element.value);
        } else if (element.type === 'Institution') {
          institutions.push(element.value);
        }
      });

      departments.sort();
      faculties.sort();
      campuses.sort();
      ranks.sort();
      affiliations.sort();
      institutions.sort();

      
      
      

      setDepartments(departments);
      setFaculties(faculties);
      setCampuses(campuses);
      setRanks(ranks);
      setAffilitations(affiliations);
      setInstitutions(institutions);
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

  // to escape problematic characters before constructing the GraphQL query
  const sanitizeInput = (input) => {
    return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  };
  
  const getBio = async () => {
    try {
      const bio = await getOrcidSections(orcidId, "biography");
      if (bio && bio.bio) {
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          bio:bio.bio,
        }));
        setChange(true);
        toast.success('Bio imported successfully!', { autoClose: 3000 });
      } else {
        toast.error('Failed to fetch the bio from ORCID.', { autoClose: 3000 });
      }
    } 
    catch (error) {
      toast.error('An error occurred while fetching the bio.', { autoClose: 3000 });
    }
  };

  const getKeywords = async () => {
    try {
      const keywords_output = await getOrcidSections(orcidId, "keywords");
        if (keywords_output && keywords_output.keywords) {
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo,
            keywords:keywords_output.keywords,
          }));
          setChange(true);
          toast.success('Keywords imported successfully!', { autoClose: 3000 });
        } 
        else {
          toast.error('Failed to fetch the keywords from ORCID.', { autoClose: 3000 });
        }
    } 
    catch (error) {
      toast.error('An error occurred while fetching the keywords.', { autoClose: 3000 });
    }

  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const sanitizedBio = sanitizeInput(userInfo.bio || "");
      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        userInfo.role,
        sanitizedBio,
        userInfo.rank,
        userInfo.institution,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.primary_affiliation,
        userInfo.secondary_affiliation,
        userInfo.campus,
        userInfo.keywords,
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
    <PageContainer>
      <FacultyMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} toggleViewMode={toggleViewMode} userInfo={userInfo}></FacultyMenu>

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
                maxLength={3000}
                value={userInfo.bio || ''} 
                className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
                onChange={(e) => {
                  setUserInfo(prevUserInfo => ({ ...prevUserInfo, bio: e.target.value }));
                  setChange(true);
                }}
              ></textarea>

              <button
                type="button"
                className="btn btn-sm btn-primary text-white mt-2"
                onClick={() => {
                  if (!orcidId) {
                    // Show warning if ORCID is not entered
                    toast.warning('Please enter ORCID ID before fetching bio.');
                  } else {
                    setShowBioWarningDialog(true);
                  }
                }}
              >
                Import Bio from ORCID
              </button>

            </div>


            {showBioWarningDialog && (
        <dialog className="modal-dialog" open>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setShowBioWarningDialog(false)}
          >
            ✕
          </button>
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <p className="text-center text-lg font-bold text-zinc-600">
              Importing bio from ORCID will overwrite your existing bio. Do you want to continue?
            </p>
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                className="btn btn-success text-white"
                onClick={() => {
                  setShowBioWarningDialog(false);
                  getBio();
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn btn-secondary text-white"
                onClick={() => setShowBioWarningDialog(false)}
              >
                No
              </button>
            </div>
          </div>
        </dialog>
      )}

          <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Keywords</h2>
          <div className="col-span-1 sm:col-span-2 md:col-span-4">
            <textarea 
              id="keywords" 
              name="keywords" 
              maxLength={1000} 
              value={userInfo.keywords || ''} 
              className="w-full rounded text-sm px-3 py-2 border border-gray-300" 
              placeholder="Add keywords separated by commas"
              onChange={(e) => {
                setUserInfo(prevUserInfo => ({ ...prevUserInfo, keywords: e.target.value }));
                setChange(true);
              }}
            ></textarea>

            <button
              type="button"
              className="btn btn-sm btn-primary text-white mt-2"
              onClick={() => {
                if (!orcidId) {
                  // Show warning if ORCID is not entered
                  toast.warning('Please enter ORCID ID before fetching keywords.');
                } else {
                  setShowKeywordsWarningDialog(true);
                }
              }}
            >
              Import Keywords from ORCID
            </button>
          </div>
          {showKeywordsWarningDialog && (
        <dialog className="modal-dialog" open>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setShowKeywordsWarningDialog(false)}
          >
            ✕
          </button>
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <p className="text-center text-lg font-bold text-zinc-600">
              Importing keywords from ORCID will overwrite your existing keywords. Do you want to continue?
            </p>
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                className="btn btn-success text-white"
                onClick={() => {
                  setShowKeywordsWarningDialog(false);
                  getKeywords();
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn btn-secondary text-white"
                onClick={() => setShowKeywordsWarningDialog(false)}
              >
                No
              </button>
            </div>
          </div>
        </dialog>
      )}


            <h2 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Institution Information</h2>
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

      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

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
    </PageContainer>
  );
};

export default FacultyHomePage;
