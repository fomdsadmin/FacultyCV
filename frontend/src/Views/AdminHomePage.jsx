import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import AdminMenu from "../Components/AdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import {
  getAllUsersCount,
  getNumberOfGeneratedCVs,
} from "../graphql/graphqlHelpers.js";
import { useAdmin } from "Contexts/AdminContext.jsx";

const AdminHomePage = ({ getCognitoUser, userInfo }) => {
  const { loading, setLoading, allUsersCount, departmentAffiliations, allDataSections } = useAdmin();
  const [userCounts, setUserCounts] = useState({
    total_count: 0,
    faculty_count: 0,
    assistant_count: 0,
    dept_admin_count: 0,
    admin_count: 0,
    faculty_admin_count: 0
  });
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);

  useEffect(() => {
    fetchGeneratedCVs();
  }, []);

  useEffect(() => {
    setUserCounts(allUsersCount);
  }, [allUsersCount]);


  async function fetchGeneratedCVs() {
    setLoading(true);
    try {
      const generatedCVs = await getNumberOfGeneratedCVs();
      setTotalCVsGenerated(generatedCVs);
    } catch (error) {}
    setLoading(false);
  }


  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-12 mt-4 overflow-auto custom-scrollbar w-full mb-4">
        <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Analytics</h1>
        {loading ? (
          <div className="flex items-center justify-center w-full mt-8">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="m-4 max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              <AnalyticsCard title="Total Users" value={userCounts.total_count} />
              <AnalyticsCard title="Faculty" value={userCounts.faculty_count} />
              <AnalyticsCard title="Department Admin" value={userCounts.dept_admin_count} />
              <AnalyticsCard title="Admin" value={userCounts.admin_count} />
              <AnalyticsCard title="Delegates" value={userCounts.assistant_count} />
              <AnalyticsCard title="Faculty Admin" value={userCounts.faculty_admin_count} />
              <AnalyticsCard title="Generated CVs" value={totalCVsGenerated} />
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default AdminHomePage;
