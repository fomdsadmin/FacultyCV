import Orcid from "./Orcid/Orcid"
import Scopus from "./Scopus/Scopus"

const Linkages = ({ user, isAdmin }) => {
  return (
    <div className="">
      <h1 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Linkages</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        <Scopus user={user} isAdmin={isAdmin} />
        <Orcid user={user} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

export default Linkages
