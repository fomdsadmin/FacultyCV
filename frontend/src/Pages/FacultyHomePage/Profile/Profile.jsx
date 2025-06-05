import Bio from "./Bio/Bio"
import Contact from "./Contact"
import Keywords from "./Keywords/Keywords"

const Profile = () => {

  return (
    <form className="mx-4 my-4 mb-8">
      <Contact />
      <Bio />
      <Keywords />
    </form>
  );
}

export default Profile
