import React from "react";

const UserCard = ({ onClick, onRemove, id, firstName, lastName, email, role }) => {

    const handleClick = () => {
        onClick(id);
    }

    const handleRemove = () => {
        onRemove(id);
    }

    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{firstName} {lastName}</h3>
                    <h1>{email}</h1>
                    <p>{role}</p>
                </div>

                <div className="card-actions">
                    <button onClick={handleClick} className="text-white btn btn-primary min-h-0 h-8 leading-tight">Manage</button>
                    <button onClick={handleRemove} className="text-white btn btn-error min-h-0 h-8 leading-tight ml-2">Remove</button>
                </div>

            </div>
        </div>
    )
}

export default UserCard;
