import Orcid from "./Orcid/Orcid"
import Scopus from "./Scopus/Scopus"
import InfoCard from "../../../../Components/InfoCard/InfoCard"

const Linkages = ({ user, isAdmin }) => {
  const helpText = "Connect your profile to external research databases and platforms. These IDs help identify your publications, citations, and research impact across different academic networks.";

  return (
    <InfoCard 
      title="Academic Linkages" 
      helpText={helpText}
      className="h-fit"
    >
      <div className="space-y-4">
        <Orcid user={user} isAdmin={isAdmin} />
        <Scopus user={user} isAdmin={isAdmin} />
      </div>
    </InfoCard>
  );
}

export default Linkages
