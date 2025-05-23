import Orcid from "./Orcid/Orcid"
import Scopus from "./Scopus/Scopus"

const Linkages = () => {
 
  return (
    <div className="space-y-6">
      <Scopus/>
      <Orcid/>
    </div>
  )
}

export default Linkages
