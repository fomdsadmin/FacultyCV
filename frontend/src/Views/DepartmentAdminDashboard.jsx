import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import {
  getAllUsersCount,
  getAllSections,
  getNumberOfGeneratedCVs,
  getDepartmentCVData,
  getDepartmentAffiliations,
} from "../graphql/graphqlHelpers.js";
import { useAdmin } from "Contexts/AdminContext.jsx";

const DepartmentAdminDashboard = ({ getCognitoUser, userInfo, department }) => {
  const {
    loading,
    setLoading,
    allUsersCount,
    departmentAffiliations,
    allUserCVData,
    totalGrantMoneyRaised,
    grantMoneyGraphData,
    yearlyPublicationsGraphData,
    yearlyPatentsGraphData,
  } = useAdmin();
  const [userCounts, setUserCounts] = useState(allUsersCount);
  const [userCVData, setUserCVData] = useState([]);
  const [keywordData, setKeywordData] = useState([]);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [affiliationsData, setAffiliationsData] = useState([]);
  const [showAllRanks, setShowAllRanks] = useState(false);

  useEffect(() => {
    setUserCounts(allUsersCount);
  }, [allUsersCount]);

  useEffect(() => {
    setAffiliationsData(departmentAffiliations);
  }, [departmentAffiliations]);

  useEffect(() => {
    setUserCVData(allUserCVData);
  }, [allUserCVData]);

  // Use CV data from context
  const journalPublications = userCVData.publications || [];
  const otherPublications = userCVData.otherPublications || [];
  const grants = userCVData.grants || [];
  const patents = userCVData.patents || [];


  // Compute hospital affiliations summary
  const hospitalAffiliationsSummary = useMemo(() => {
    let total = 0;
    const authorityCounts = {};
    affiliationsData.forEach((aff) => {
      let hospitalAffiliations = aff.hospital_affiliations;
      if (typeof hospitalAffiliations === "string") {
        try {
          hospitalAffiliations = JSON.parse(hospitalAffiliations);
        } catch {
          hospitalAffiliations = [];
        }
      }
      if (Array.isArray(hospitalAffiliations)) {
        hospitalAffiliations.forEach((hosp) => {
          total++;
          const authority = hosp.authority || "Unknown";
          authorityCounts[authority] = (authorityCounts[authority] || 0) + 1;
        });
      }
    });
    // Sort authorities by count descending
    const sortedAuthorities = Object.entries(authorityCounts)
      .map(([authority, count]) => ({ authority, count }))
      .sort((a, b) => b.count - a.count);
    return { total, sortedAuthorities };
  }, [affiliationsData]);

  const SummaryCards = () => (
    <>
      {/* User Statistics Row */}
      <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-cols-[0.7fr_0.7fr_0.7fr_0.5fr]  gap-4 mb-4 mt-2">
        <AnalyticsCard title="Department Admin(s)" value={userCounts.dept_admin_count.toLocaleString()} />
        <AnalyticsCard title="Faculty" value={userCounts.faculty_count.toLocaleString()} />
        <AnalyticsCard title="Delegates" value={userCounts.assistant_count.toLocaleString()} />
        {/* <AnalyticsCard title="CVs Generated" value={totalCVsGenerated.toLocaleString()} /> */}
      </div>

      {/* Research Metrics - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[0.7fr_0.7fr_0.7fr_0.5fr] gap-4 mb-4 w-full">
        {/* Faculty Ranks Section - First */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 m-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9 17a4 4 0 004-4H5a4 4 0 004 4z" />
            </svg>
            Faculty Rank Distribution
          </h3>
          <div className="space-y-4">
            {/* Primary Units Section */}
            {facultyRanksCounts.allRanks.length > 0 && (
              <>
                {/* Totals Header */}
                <div className="mb-4 m-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <AnalyticsCard
                      title="Primary Appointments"
                      value={facultyRanksCounts.primaryTotal.toLocaleString()}
                    />
                    <AnalyticsCard title="Joint Appointments" value={facultyRanksCounts.jointTotal.toLocaleString()} />
                  </div>
                </div>
                <div className="rounded-lg m-2">
                  {/* Table Header */}
                  <div className="bg-gray-100 border border-gray-300 rounded-t-md px-3 py-2">
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-700">
                      <div>Rank</div>
                      <div className="text-center">Primary</div>
                      <div className="text-center">Joint</div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="border-l border-r border-b border-gray-300 rounded-b-md">
                    {facultyRanksCounts.allRanks.slice(0, showAllRanks ? undefined : 6).map((rankData, index) => (
                      <div key={rankData.rank} className={`px-3 py-2 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-gray-800 font-medium">{rankData.rank}</div>
                          <div className="text-center">
                            {rankData.primaryCount > 0 ? (
                              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">
                                {rankData.primaryCount}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                          <div className="text-center">
                            {rankData.jointCount > 0 ? (
                              <span className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded-md text-xs font-semibold">
                                {rankData.jointCount}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {facultyRanksCounts.allRanks.length > 6 && (
                    <button
                      className="mt-3 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      onClick={() => setShowAllRanks(!showAllRanks)}
                    >
                      {showAllRanks ? "Show Less (Top 6)" : `Show All ${facultyRanksCounts.allRanks.length} Ranks`}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* No Data Message */}
            {facultyRanksCounts.allRanks.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm">No affiliations data available</p>
                <p className="text-gray-400 text-xs mt-1">
                  Faculty rank distribution will appear here once affiliations data is imported
                </p>
              </div>
            )}
          </div>
        </div>

        {/*Faculty Health Authority Distribution Section*/}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 m-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9 17a4 4 0 004-4H5a4 4 0 004 4z" />
            </svg>
            Health Authority Affiliations
          </h3>
          <div className="space-y-4">
            <AnalyticsCard
              title="Total Affiliations"
              value={hospitalAffiliationsSummary.total.toLocaleString()}
              className="!bg-purple-50 !border-purple-200"
            />
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              {hospitalAffiliationsSummary.sortedAuthorities.length > 0 && (
                <div className="">
                  <div className="space-y-1">
                    {hospitalAffiliationsSummary.sortedAuthorities.map((item, idx) => (
                      <div key={item.authority} className="flex justify-between items-center text-sm gap-y-1">
                        <span className="text-purple-700 font-medium">{item.authority}</span>
                        <span className="bg-purple-200 text-purple-800 p-2 rounded-md text-xs font-semibold min-w-[4rem] text-center">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hospitalAffiliationsSummary.total === 0 && (
                <div className="text-center text-gray-400 mt-4">No hospital affiliations found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Publications Section - Second */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Publications
          </h3>
          <div className="space-y-4">
            {/* Total Publications Count */}
            <AnalyticsCard
              title="Total Publications"
              value={(journalPublications.length + otherPublications.length).toLocaleString()}
              className="!bg-purple-50 !border-purple-200"
            />

            {/* Publication Types Breakdown */}
            {publicationTypesCounts.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-800 mb-2">Publication Types</h4>
                <div className="space-y-1">
                  {publicationTypesCounts.map((typeData, index) => (
                    <div key={index} className="flex justify-between items-center text-sm gap-y-1">
                      <span className="text-purple-700 font-medium">{typeData.type}</span>
                      <span className="bg-purple-200 text-purple-800 p-2 rounded-md text-xs font-semibold min-w-[4rem] text-center">
                        {typeData.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grants & Patents Section - Third (Merged) */}
        <div className="bg-white rounded-lg shadow-md p-4">
          {/* <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Grants & Patents
          </h3> */}
          <div className="space-y-4">
            {/* Grants Section - Top Half */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Grants and Contracts
              </h4>

              {/* Total Funding */}
              <AnalyticsCard
                title="Total Funding"
                value={totalGrantMoneyRaised}
                className="!bg-green-50 !border-green-200"
              />

              {/* Funding Breakdown */}
              <div className="space-y-2 mt-2">
                {/* Grant funding breakdown - Show first */}
                {grantTypesCounts.grant.count > 0 && (
                  <div className="bg-white border border-green-300 rounded-md p-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-700 font-medium">
                        Research Grants ({grantTypesCounts.grant.count.toLocaleString()})
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                        {grantTypesCounts.grant.funding >= 1000000
                          ? `$${(grantTypesCounts.grant.funding / 1000000).toFixed(1)}M`
                          : grantTypesCounts.grant.funding >= 1000
                          ? `$${(grantTypesCounts.grant.funding / 1000).toFixed(0)}K`
                          : `$${grantTypesCounts.grant.funding.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contract funding breakdown - Show second */}
                {grantTypesCounts.contract.count > 0 && (
                  <div className="bg-white border border-green-300 rounded-md p-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-700 font-medium">
                        Research Contracts ({grantTypesCounts.contract.count.toLocaleString()})
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                        {grantTypesCounts.contract.funding >= 1000000
                          ? `$${(grantTypesCounts.contract.funding / 1000000).toFixed(1)}M`
                          : grantTypesCounts.contract.funding >= 1000
                          ? `$${(grantTypesCounts.contract.funding / 1000).toFixed(0)}K`
                          : `$${grantTypesCounts.contract.funding.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Patents Section - Bottom Half */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 010-2h4z"
                    clipRule="evenodd"
                  />
                </svg>
                Patents
              </h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-700 font-medium">Total Patents</span>
                <span className="bg-amber-200 text-amber-800 p-1 rounded text-xs font-semibold">
                  {patents.length.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Memoized faculty ranks computation
  const facultyRanksCounts = useMemo(() => {
    const primaryRankCounts = {};
    const jointRankCounts = {};

    // Process affiliations data to count ranks
    affiliationsData.forEach((affiliation) => {
      try {
        // Parse primary unit
        const primaryUnit = JSON.parse(affiliation.primary_unit || "{}");
        if (primaryUnit.rank && primaryUnit.rank.trim()) {
          const rank = primaryUnit.rank.trim();
          primaryRankCounts[rank] = (primaryRankCounts[rank] || 0) + 1;
        }

        // Parse joint units
        const jointUnits = JSON.parse(affiliation.joint_units || "[]");
        if (Array.isArray(jointUnits)) {
          jointUnits.forEach((unit) => {
            if (unit.rank && unit.rank.trim()) {
              const rank = unit.rank.trim();
              jointRankCounts[rank] = (jointRankCounts[rank] || 0) + 1;
            }
          });
        }
      } catch (error) {
        console.error("Error parsing affiliation data:", error, affiliation);
      }
    });

    // Calculate totals
    const primaryTotal = Object.values(primaryRankCounts).reduce((sum, count) => sum + count, 0);
    const jointTotal = Object.values(jointRankCounts).reduce((sum, count) => sum + count, 0);

    // Get all unique ranks from both primary and joint appointments
    const allUniqueRanks = new Set([...Object.keys(primaryRankCounts), ...Object.keys(jointRankCounts)]);
    const allRanks = Array.from(allUniqueRanks)
      .map((rank) => ({
        rank,
        primaryCount: primaryRankCounts[rank] || 0,
        jointCount: jointRankCounts[rank] || 0,
        totalCount: (primaryRankCounts[rank] || 0) + (jointRankCounts[rank] || 0),
      }))
      .sort((a, b) => b.totalCount - a.totalCount); // Sort by total count descending

    return { primaryRankCounts, jointRankCounts, primaryTotal, jointTotal, allRanks };
  }, [affiliationsData]);

  // Memoized publication types computation
  const publicationTypesCounts = useMemo(() => {
    const typeCounts = {};

    // Process other publications to get their types
    otherPublications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        const type = details.type || "Other";
        if (type && typeof type === "string" && type.trim().length > 0) {
          const cleanType = type.trim();
          typeCounts[cleanType] = (typeCounts[cleanType] || 0) + 1;
        }
      } catch (e) {
        console.error("Error parsing other publication data for types:", e, pub);
      }
    });

    // Add journal publications as a separate type
    if (journalPublications.length > 0) {
      typeCounts["Journal Publications"] = journalPublications.length;
    }

    // Convert to array and sort by count
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [otherPublications, journalPublications]);

  // Memoized grant types computation
  const grantTypesCounts = useMemo(() => {
    const typeData = {
      contract: { count: 0, funding: 0 },
      grant: { count: 0, funding: 0 },
    };

    grants.forEach((grant) => {
      try {
        const details = JSON.parse(grant.data_details);
        const type = details.type || "";
        const amount = parseFloat(details.amount) || 0;

        if (type === "All Types Contract") {
          typeData.contract.count += 1;
          typeData.contract.funding += amount;
        } else if (type === "Grant") {
          typeData.grant.count += 1;
          typeData.grant.funding += amount;
        }
      } catch (e) {
        console.error("Error parsing grant data for types:", e, grant);
      }
    });

    return typeData;
  }, [grants]);

  // Memoized keyword computation
  const computedKeywordData = useMemo(() => {
    // Compute department-wide keywords from filtered publications (including other publications)
    const keywordCounts = {};
    journalPublications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        const keywords = details.keywords || [];
        // Ensure keywords is an array and contains valid strings
        if (Array.isArray(keywords) && keywords.length > 0) {
          keywords.forEach((kw) => {
            if (kw && typeof kw === "string" && kw.trim().length > 0) {
              const lower = kw.toLowerCase().trim();
              keywordCounts[lower] = (keywordCounts[lower] || 0) + 1;
            }
          });
        }
      } catch (e) {
        console.error("Error parsing publication data for keywords:", e, pub);
      }
    });
    // Only keep top 25 keywords
    const sorted = Object.entries(keywordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);
    return sorted;
  }, [journalPublications]);

  // Memoized graphs configuration for the carousel
  const graphsConfig = useMemo(() => {
    const graphs = [];

    // Grant funding graph (only if there's data)
    if (grantMoneyGraphData.length > 0) {
      graphs.push({
        title: "Yearly Grant Funding",
        data: grantMoneyGraphData,
        dataKey: "GrantFunding",
        xAxisKey: "date",
        xAxisLabel: "Year",
        yAxisLabel: "Grant Funding ($)",
        barColor: "#10b981",
        showLegend: false,
        formatTooltip: (value, name) => [`$${value.toLocaleString()}`, "Grant Funding ($)"],
        formatYAxis: (value) => {
          if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
          }
          return `$${value.toLocaleString()}`;
        },
        formatXAxis: (value) => value,
      });
    }

    // Publications graph (only if there's data)
    if (yearlyPublicationsGraphData.length > 0) {
      graphs.push({
        title: "Yearly Publications",
        data: yearlyPublicationsGraphData,
        dataKey: "Publications",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Number of Publications",
        barColor: "#8b5cf6",
        showLegend: false,
        formatTooltip: (value, name) => [`${value} ${value === 1 ? "Publication" : "Publications"}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value,
      });
    }

    // Patents graph (only if there's data)
    if (yearlyPatentsGraphData.length > 0) {
      graphs.push({
        title: "Yearly Patents",
        data: yearlyPatentsGraphData,
        dataKey: "Patents",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Number of Patents",
        barColor: "#f59e0b",
        showLegend: false,
        formatTooltip: (value, name) => [`${value} ${value === 1 ? "Patent" : "Patents"}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value,
      });
    }

    return graphs;
  }, [grantMoneyGraphData, yearlyPublicationsGraphData, yearlyPatentsGraphData, department]);

  // Set keyword data when it changes
  useEffect(() => {
    setKeywordData(computedKeywordData);
  }, [computedKeywordData]);

  return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 w-full min-h-screen bg-zinc-50">
        <div className="mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-700 mb-1 mt-2">Department Analytics</h1>
          <h2 className="text-xl font-semibold text-blue-700 mb-4 mt-2">{department}</h2>
          {loading ? (
            <div className="flex items-center justify-center w-full mt-16">
              <div className="text-lg text-zinc-500">Loading...</div>
            </div>
          ) : (
            <>
              <SummaryCards />

              {/* Graph Carousel Section */}
              <div className="mb-8">
                <GraphCarousel graphs={graphsConfig} />
              </div>

              {/* Department Keywords Section */}
              {keywordData.length > 0 && (
                <div className="mt-8">
                  <div className="flex flex-col gap-2 p-2 rounded-lg shadow-md bg-zinc-50">
                    <>
                      <h2 className="text-lg font-semibold p-4">
                        {department === "All"
                          ? "Top Keywords From Publications (All Departments)"
                          : "Top Keywords From Publications (Department-wide)"}
                      </h2>
                      <div className="flex-1 min-w-0 p-4">
                        <div className="flex flex-wrap gap-2">
                          {(showAllKeywords ? keywordData : keywordData.slice(0, 10)).map((item, index) => {
                            const isMax = item.value === Math.max(...keywordData.map((k) => k.value || 0));
                            return (
                              <span
                                key={index}
                                className={`py-2 px-3 text-sm rounded-full ${
                                  isMax ? "bg-yellow-400 text-black font-bold" : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                {item.text.toUpperCase()} {item.value !== 0 && `(${item.value})`}
                              </span>
                            );
                          })}
                        </div>
                        {keywordData.length > 10 && (
                          <button
                            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            onClick={() => setShowAllKeywords(!showAllKeywords)}
                          >
                            {showAllKeywords ? `Show Less (Top 10)` : `Show All ${keywordData.length} Keywords`}
                          </button>
                        )}
                      </div>
                    </>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminDashboard;
