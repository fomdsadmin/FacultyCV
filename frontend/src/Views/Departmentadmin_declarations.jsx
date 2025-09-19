import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import { getUserCVData, getUserConnections, getAllSections } from "../graphql/graphqlHelpers.js";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const DepartmentAdmindeclaration = ({ getCognitoUser, userInfo, department }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userCVData, setUserCVData] = useState({});
  const [userConnections, setUserConnections] = useState([]);
  const [dataSections, setDataSections] = useState([]);

  useEffect(() => {
   
  }, []);
     return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 w-full min-h-screen bg-zinc-50">
        <div className="mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-700 mb-1 mt-2">Declarations Report</h1>
          <h2 className="text-xl font-semibold text-blue-700 mb-4 mt-2">{department}</h2>
        </div>
      </main>
    </PageContainer>
  );
}
export default DepartmentAdmindeclaration;
