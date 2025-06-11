import Orcid from "./Orcid/Orcid"
import Scopus from "./Scopus/Scopus"

const Linkages = () => {

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Linkages</h1>
      <Scopus />
      <Orcid />
    </div>
  );
}

export default Linkages
