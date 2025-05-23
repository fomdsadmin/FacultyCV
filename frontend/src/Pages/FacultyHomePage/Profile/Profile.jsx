"use client"

import Orcid from "./Linkages/Orcid/Orcid"
import Scopus from "./Linkages/Scopus/Scopus"

const Linkages = () => {
  return (
    <div className="space-y-6">
      <Scopus />
      <Orcid />
    </div>
  )
}

export default Linkages