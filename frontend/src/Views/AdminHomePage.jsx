import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import AdminMenu from "../Components/AdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import {
  getAllUsers,
  getAllUsersCount,
  getNumberOfGeneratedCVs,
} from "../graphql/graphqlHelpers.js";

const AdminHomePage = ({ getCognitoUser, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [assistantUsers, setAssistantUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);
  const [departmentAdminUsers, setDepartmentAdminUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchGeneratedCVs();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const users = await getAllUsers();
      setUsers(users);

      // Group users by role in a single pass
      const usersByRole = users.reduce(
        (acc, user) => {
          if (user.role === "Faculty") {
            acc.faculty.push(user);
          } else if (user.role === "Assistant") {
            acc.assistant.push(user);
          } else if (user.role === "Admin") {
            acc.admin.push(user);
          } else if (user.role.startsWith("Admin-")) {
            acc.departmentAdmin.push(user);
          }
          return acc;
        },
        {
          faculty: [],
          assistant: [],
          admin: [],
          departmentAdmin: [],
        }
      );

      setFacultyUsers(usersByRole.faculty);
      setAssistantUsers(usersByRole.assistant);
      setAdminUsers(usersByRole.admin);
      setDepartmentAdminUsers(usersByRole.departmentAdmin);

      const count = await getAllUsersCount();
      console.log("Total Users Count:", count);

    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  }
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
              <AnalyticsCard title="Total Users" value={users.length} />
              <AnalyticsCard title="Faculty Users" value={facultyUsers.length} />
              <AnalyticsCard title="Department Admin Users" value={departmentAdminUsers.length} />
              <AnalyticsCard title="Admin Users" value={adminUsers.length} />
              <AnalyticsCard title="Assistant Users" value={assistantUsers.length} />
              <AnalyticsCard title="Generated CVs" value={totalCVsGenerated} />
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default AdminHomePage;
