import PageContainer from "../../Views/PageContainer.jsx"
import FacultyMenu from "../../Components/FacultyMenu.jsx"
import "../../CustomStyles/scrollbar.css"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FacultyProvider, useFaculty } from "./FacultyContext.jsx"
import Tabs from "./Tabs/Tabs.jsx"
import { useApp } from "../../Contexts/AppContext.jsx"
import SaveButton from "./SaveButton.jsx"

const FacultyHomePageContent = (user) => {
  const {
    loading,
    toggleViewMode,
  } = useFaculty()

  const { userInfo, getCognitoUser } = useApp();

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
          <h1 className="text-4xl ml-4 font-bold text-zinc-600">Home</h1>
          <SaveButton />
        </div>

        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <Tabs />
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
