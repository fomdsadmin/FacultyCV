import Orcid from "./Orcid/Orcid"
import Scopus from "./Scopus/Scopus"

const Linkages = () => {

  return (
    <div className="">
      <h1 className="text-lg font-bold mt-4 mb-2 text-zinc-500">Linkages</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        <Scopus />
        <Orcid />
      </div>
    </div>
  );
}

export default Linkages
