import Bio from "./Bio/Bio"
import Contact from "./Contact"
import Keywords from "./Keywords/Keywords"
import Linkages from "./Linkages/Linkages";

const Profile = () => {
  return (
    <form className="mx-4 my-2 mb-4">
      <div
        className="grid 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 
      gap-x-4 max-h-[85vh]"
      >
        <Contact />
        <Bio />
        <Linkages />
        <Keywords />
      </div>
    </form>
  );
};

export default Profile
