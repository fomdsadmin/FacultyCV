import PageContainer from "../../Views/PageContainer.jsx"
import FacultyMenu from "../../Components/FacultyMenu.jsx"
import "../../CustomStyles/scrollbar.css"
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

      <main className="px-[1vw] xs:px-[1vw] sm:px-[2vw] md:px-[2vw] lg:px-[2vw] xl:px-[5vw] 2xl:px-[8vw] overflow-y-auto custom-scrollbar w-full mb-4 relative">
        <div className="flex items-center justify-between mt-6">
          <h1 className="text-4xl font-bold text-zinc-600">Home</h1>
          <SaveButton />
        </div>

        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">
              Loading...
            </div>
          </div>
        ) : (
          <Tabs />
        )}
      </main>
    </PageContainer>
  );
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
