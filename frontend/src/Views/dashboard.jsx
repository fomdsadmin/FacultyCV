import React, { useEffect } from "react";
import { addUser, updateUser, getUser } from "../graphql/graphqlHelpers.js"
import FacultyMenu from '../Components/FacultyMenu.jsx';
import PageContainer from './PageContainer.jsx';

const Dashboard = () => {

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
