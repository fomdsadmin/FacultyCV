//Not found page
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div>
        <h1>404 - Not Found!</h1>
        <Link to="/Home">Back to the homepage</Link>
        </div>
    );
}

export default NotFound;