import React from "react";

const ConnectionCard = ({ firstName, lastName, email, role }) => {


    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{firstName} {lastName}</h3>
                    <h1>{email}</h1>
                    <p>{role}</p>
                </div>
            </div>
        </div>
    )
}

export default ConnectionCard;
