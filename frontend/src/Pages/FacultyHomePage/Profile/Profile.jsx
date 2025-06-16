import Bio from "./Bio/Bio"
import Contact from "./Contact"
import Keywords from "./Keywords/Keywords"
import Linkages from "./Linkages/Linkages";

const Profile = () => {
  return (
    <form className="mx-4 my-2 mb-4">
      <div
        className="grid 2xl:grid-cols-2 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 
        gap-x-4 gap-y-4 max-h-[85vh] grid-rows-[auto_auto_auto]"
        style={{
          gridTemplateAreas: `
            "contact linkages"
            "bio linkages"
            "bio keywords "
          `,
        }}
      >
        <div style={{ gridArea: "contact" }}>
          <Contact />
        </div>
        <div style={{ gridArea: "linkages" }}>
          <Linkages />
        </div>
        <div style={{ gridArea: "bio" }}>
          <Bio />
        </div>
        <div style={{ gridArea: "keywords" }}>
          <Keywords />
        </div>
      </div>
    </form>
  );
};

export default Profile
