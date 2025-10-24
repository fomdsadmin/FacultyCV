import Bio from "./Bio/Bio";
import Contact from "./Contact";
import Login from "./Login";
import Linkages from "./Linkages/Linkages";
import SaveButton from "../SaveButton.jsx";
import { useFaculty } from "../FacultyContext.jsx";
// import Keywords from "./Keywords/Keywords";

const Profile = () => {
  // const { change } = useFaculty();

  return (
    <div className="mx-auto px-4">
      <form className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-11">
            <Contact />
            <Bio />
          </div>
          <div>
            <Linkages />
          </div>
        </div>

        {/* Save button - now more prominent */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <SaveButton />
        </div>
      </form>
    </div>
  );
};

export default Profile;
