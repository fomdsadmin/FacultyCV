import Bio from "./Bio/Bio";
import Contact from "./Contact";
import Keywords from "./Keywords/Keywords";
import Linkages from "./Linkages/Linkages";
import SaveButton from "../SaveButton.jsx";
import { useFaculty } from "../FacultyContext.jsx";

const Profile = () => {
  const { change } = useFaculty();

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
          <Contact />
        </div>
        <div className="md:row-span-2">
          <Bio />
        </div>
        <div>
          <Linkages />
        </div>
        {/* <div>
          <Keywords />
        </div> */}
      </div>
      
      {/* Save button at bottom right */}
      <div className="flex justify-end ">
        <SaveButton />
      </div>
    </form>
  );
};

export default Profile;
