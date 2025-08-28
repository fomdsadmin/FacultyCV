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
    <form className="mx-4 my-2 mb-4">
      <div
        className="
          grid 
          grid-cols-1 
          md:grid-cols-2 
          xl:grid-cols-2 
          gap-x-4 gap-y-4 
        "
      >
        <div>
          <Login />
        </div>
        <div>
          <Linkages />
        </div>
        <div>
          <Contact />
        </div>

        <div>
          <Bio />
        </div>
        {/* <div>
          <Keywords />
        </div> */}
      </div>

      {/* Save button at bottom right */}
      <div className="flex justify-end my-8">
        <SaveButton />
      </div>
    </form>
  );
};

export default Profile;
