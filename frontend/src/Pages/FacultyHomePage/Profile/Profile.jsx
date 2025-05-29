import Bio from "./Bio/Bio"
import Contact from "./Contact"
import Keywords from "./Keywords"

const Profile = () => {

  return (
    <form className="ml-4">
      <Contact />
      <Bio />
      <Keywords />
    </form>
  )
}

export default Profile
