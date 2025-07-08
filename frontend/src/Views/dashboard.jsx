import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { addUser, updateUser, getUser } from "../graphql/graphqlHelpers.js"
import FacultyMenu from '../Components/FacultyMenu.jsx';
import PageContainer from './PageContainer.jsx';

const Dashboard = () => {
  const auth = useAuth();

  useEffect(() => {
    async function syncUser() {
      if (auth.isAuthenticated) {
        const { email, given_name, family_name } = auth.user.profile;
      }
    }

    syncUser();
  }, [auth.isAuthenticated]);

   return (
    <PageContainer>
      {/* Sidebar */}
      <FacultyMenu
        getCognitoUser={"Test"}
        userName={"Test"}
        userInfo={"Test"}
      />
          </PageContainer>
      );
};

export default Dashboard;
