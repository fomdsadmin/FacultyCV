import React from 'react';
import PageContainer from './PageContainer';
import FacultyMenu from '../Components/FacultyMenu';

const Assistants = ({ user }) => {
    return (
        <PageContainer>
            <FacultyMenu userName={user.signInDetails.loginId} />
            <main className='ml-4'>
                <h1 className="text-4xl font-bold my-3 text-zinc-600">Assistants</h1>
            </main>
        </PageContainer>
    )
}

export default Assistants;