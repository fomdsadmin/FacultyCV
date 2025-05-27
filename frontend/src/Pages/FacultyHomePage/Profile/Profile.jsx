import { useFaculty } from "../FacultyContext"
import Bio from "./Bio"
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
