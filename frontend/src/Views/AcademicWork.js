import React from 'react';
import PageContainer from './PageContainer';
import FacultyMenu from '../Components/FacultyMenu';
import { Container, Section, Bar } from '@column-resizer/react';
import { IoFilterOutline } from "react-icons/io5";
import WorkSection from '../Components/WorkSection';
import '../CustomStyles/scrollbar.css';

const AcademicWork = ({ user }) => {
  return (
    <PageContainer>
      <FacultyMenu userName={user.signInDetails.loginId}></FacultyMenu>
      <main className='ml-4 flex-1 h-full'>
        <Container className='w-full h-full' >
          
          <Section minSize={330} className='!overflow-auto !h-full custom-scrollbar'>
            <h1 className="text-left ml-4 text-4xl font-bold my-3 text-zinc-600">Academic Work</h1>

            <div className='px-4 max-w-md mr-4 flex'>
              <label className="input input-bordered flex items-center gap-2 flex-1">
                <input type="text" className="grow" placeholder="Search" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70">
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                    clipRule="evenodd" />
                </svg>
              </label>
              <IoFilterOutline className='min-h-8 min-w-8 p-1 bg-neutral rounded-md ml-2 my-auto'/>
            </div>

            {/* populate from db */}
            <WorkSection title={"Publications"} category={""}></WorkSection>
            <WorkSection title={"Grants"} category={""}></WorkSection>
            <WorkSection title={"Patents"} category={""}></WorkSection>
            <WorkSection title={"Awards"} category={"Accolades"}></WorkSection>
            <WorkSection title={"Primary Education"} category={"Education"}></WorkSection>
            <WorkSection title={"Courses"} category={"Teaching"}></WorkSection>
            <WorkSection title={"Service"} category={""}></WorkSection>

          </Section>
          
          <Bar size={4} className='bg-neutral h-screen' style={{cursor: 'col-resize' }} />

          <Section minSize={240}>

          <h2 className="text-left ml-4 text-4xl font-bold my-3 text-zinc-600">Publications</h2>

          </Section>



        </Container>
      </main>
    </PageContainer>
  );
}

export default AcademicWork;