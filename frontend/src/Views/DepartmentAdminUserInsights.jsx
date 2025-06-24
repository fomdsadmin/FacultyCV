import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import { getUserCVData, getUserConnections, getAllSections } from "../graphql/graphqlHelpers.js";
import BarChartComponent from "../Components/BarChart.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const DepartmentAdminUserInsights = ({ user, department }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userCVData, setUserCVData] = useState({});
  const [userConnections, setUserConnections] = useState([]);
  const [dataSections, setDataSections] = useState([]);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (user && dataSections.length > 0) {
      fetchUserAnalytics(user);
    }
    // eslint-disable-next-line
  }, [user, dataSections]);

  async function fetchSections() {
    try {
      const sections = await getAllSections();
      setDataSections(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  }

  async function fetchUserAnalytics(user) {
    setLoading(true);
    try {
      const sectionIds = {
        Publications: dataSections.find((s) => s.title === "Publications")?.data_section_id,
        Grants: dataSections.find((s) => s.title === "Research or Equivalent Grants")?.data_section_id,
        Patents: dataSections.find((s) => s.title === "Patents")?.data_section_id,
      };

      const publications = sectionIds.Publications ? await getUserCVData(user.user_id, sectionIds.Publications) : [];
      const grants = sectionIds.Grants ? await getUserCVData(user.user_id, sectionIds.Grants) : [];
      const patents = sectionIds.Patents ? await getUserCVData(user.user_id, sectionIds.Patents) : [];

      let grantMoneyRaised = [];
      for (const data of grants) {
        try {
          const dataDetails = JSON.parse(data.data_details);
          if (dataDetails.year) {
            grantMoneyRaised.push({
              amount: parseInt(dataDetails.amount),
              years: parseInt(dataDetails.year),
            });
          }
        } catch (error) {
          // ignore
        }
      }

      setUserCVData({
        publications,
        grants,
        patents,
        grantMoneyRaised,
      });

      // Connections
      const connections = await getUserConnections(user.user_id, false);
      setUserConnections(connections);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
    }
    setLoading(false);
  }

  // Graph data for grants
  const getGrantMoneyGraphData = () => {
    const data = [];
    const yearlyDataMap = new Map();
    (userCVData.grantMoneyRaised || []).forEach((grant) => {
      if (grant.amount && grant.years) {
        const year = grant.years;
        if (yearlyDataMap.has(year)) {
          yearlyDataMap.get(year).Funding += grant.amount;
        } else {
          yearlyDataMap.set(year, {
            date: year.toString(),
            Funding: grant.amount,
          });
        }
      }
    });
    yearlyDataMap.forEach((value) => data.push(value));
    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    return data;
  };

  // Graph data for publications
  const getYearlyPublicationsGraphData = () => {
    const data = [];
    const yearlyDataMap = new Map();
    (userCVData.publications || []).forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);
        const currentYear = new Date().getFullYear();
        const fiveYearsago = currentYear - 5;
        if (
          dataDetails.year_published &&
          Number(dataDetails.year_published) > fiveYearsago &&
          Number(dataDetails.year_published) <= currentYear
        ) {
          const year = dataDetails.year_published.toString();
          if (yearlyDataMap.has(year)) {
            yearlyDataMap.get(year).Publications += 1;
          } else {
            yearlyDataMap.set(year, {
              year: year,
              Publications: 1,
            });
          }
        }
      } catch (error) {
        // ignore
      }
    });
    yearlyDataMap.forEach((value) => data.push(value));
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  };

  // Summary cards for selected user
  const UserSummaryCards = () => {
    const pubCount = userCVData.publications ? userCVData.publications.length : 0;
    const grantCount = userCVData.grants ? userCVData.grants.length : 0;
    const patentCount = userCVData.patents ? userCVData.patents.length : 0;
    const Funding = (userCVData.grantMoneyRaised || [])
      .reduce((total, g) => total + g.amount, 0)
      .toLocaleString("en-US", { style: "currency", currency: "USD" });
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard title="Publications" value={pubCount} />
        <AnalyticsCard title="Grants" value={grantCount} />
        <AnalyticsCard title="Patents" value={patentCount} />
        <AnalyticsCard title="Grant Funding" value={Funding} />
        <AnalyticsCard title="Connections" value={userConnections.length} />
      </div>
    );
  };

  return (
    <div className="py-8 px-12 bg-white rounded-lg shadow w-full">
      <h2 className="text-xl font-bold text-zinc-700 mb-6">User Analytics</h2>
      {loading && (
        <div className="flex items-center justify-center w-full mt-8">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      )}
      {!loading && user && (
        <>
          <UserSummaryCards />
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-base font-semibold text-zinc-700 mb-8">Yearly Grant Funding</h3>
              <div className="w-full min-h-[320px] flex items-center justify-center">
                <BarChartComponent
                  data={getGrantMoneyGraphData()}
                  dataKey="Funding"
                  xAxisKey="date"
                  barColor="#82ca9d"
                />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="text-base font-semibold text-zinc-700 mb-8">Yearly Publications (Last 5 Years)</h3>
              <div className="w-full min-h-[320px] flex items-center justify-center">
                <BarChartComponent
                  data={getYearlyPublicationsGraphData()}
                  dataKey="Publications"
                  xAxisKey="year"
                  barColor="#8884d8"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentAdminUserInsights;
