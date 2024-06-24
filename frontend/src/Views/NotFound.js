//Not found page
import { Container } from '@column-resizer/react';
import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from './PageContainer';

const NotFound = () => {
    return (
        <Container>
        <h1>404 - Not Found!</h1>
        <Link to="/Home">Back to the homepage</Link>
        </Container>
    );
}

export default NotFound;