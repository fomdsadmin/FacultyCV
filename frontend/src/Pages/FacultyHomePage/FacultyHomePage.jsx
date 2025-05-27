import PageContainer from "../../Views/PageContainer.jsx"
import FacultyMenu from "../../Components/FacultyMenu.jsx"
import "../../CustomStyles/scrollbar.css"
import ProfileLinkModal from "../../Components/ProfileLinkModal.jsx"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FacultyProvider, useFaculty } from "./FacultyContext.jsx"
import Profile from "./Profile/Profile.jsx"
import Tabs from "./Tabs/Tabs.jsx"
import { useApp } from "../../Contexts/AppContext.jsx"

const FacultyHomePageContent = (user) => {
  const {
    loading,
    change,
    isSubmitting,
    handleSubmit,
    modalOpen,
    activeModal,
    handleCloseModal,
    handleScopusLink,
    handleOrcidLink,
    getCognitoUser,
    toggleViewMode,
  } = useFaculty()

  const { userInfo } = useApp();

  return (
    <PageContainer>
      <FacultyMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />

      <main className="ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4 relative">
        <div className="flex items-center justify-between mt-4 mb-4">
          <h1 className="text-4xl ml-4 font-bold text-zinc-600">Profile</h1>
          <button
            type="button"
            className={`btn text-white py-1 px-2 w-1/5 min-h-0 h-8 leading-tight ${
              change ? "btn-success" : "btn-disabled cursor-not-allowed bg-gray-400"
            }`}
            disabled={!change || isSubmitting}
            onClick={change ? handleSubmit : null}
          >
            {isSubmitting ? "Saving..." : change ? "Save" : "Saved"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            <Profile />
            <Tabs />
          </>
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
  )
}

const FacultyHomePage = () => {
  // No longer need to receive props as they come from AppContext
  return (
    <FacultyProvider>
      <FacultyHomePageContent />
    </FacultyProvider>
  )
}

export default FacultyHomePage
