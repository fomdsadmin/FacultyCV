import PageContainer from "../../Views/PageContainer.jsx";
import FacultyMenu from "../../Components/FacultyMenu.jsx";
import "../../CustomStyles/scrollbar.css";
import "react-toastify/dist/ReactToastify.css";
import { FacultyProvider, useFaculty } from "./FacultyContext.jsx";
import Tabs from "./Tabs/Tabs.jsx";
import { useApp } from "../../Contexts/AppContext.jsx";

const FacultyHomePageContent = (user) => {
  const { loading, toggleViewMode, userInfo: effectiveUserInfo } = useFaculty();
  const { getCognitoUser} = useApp();

  return (
    <PageContainer>
      <FacultyMenu
        getCognitoUser={getCognitoUser}
        userName={effectiveUserInfo?.preferred_name || effectiveUserInfo?.first_name}
        toggleViewMode={toggleViewMode}
        userInfo={effectiveUserInfo}
      />

      <main
        className="
        overflow-y-auto custom-scrollbar w-full relative"
      >
        {/* Single container with consistent width */}
        <div className="mx-auto w-full">
          {/* Tabs section below the save button */}
          <div className="w-full mt-6">
            {!loading && <Tabs showCard={false} />}
          </div>

          {loading && (
            <div className="flex items-center justify-center w-full">
              <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
            </div>
          )}
        </div>
      </main>
    </PageContainer>
  );
};

const FacultyHomePage = () => {
  return (
    <FacultyProvider>
      <FacultyHomePageContent />
    </FacultyProvider>
  );
};

export default FacultyHomePage;
