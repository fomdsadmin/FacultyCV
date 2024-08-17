import React from "react";
import { useState } from "react";

const ArchiveSection = ({ section, restoreSection }) => {
    const [restoring, setRestoring] = useState(false);

    const handleClick = () => {
        setRestoring(true);
        restoreSection(section.data_section_id);
        setRestoring(false);
    }

    return (                
        <div className="bg-base-100 pr-5 my-3 m-4 p-4 shadow-glow rounded-lg">
            <div className="flex justify-between items-center ">
                
                <div className="flex flex-col justify-center">
                    <h3 className="card-title">{section.title}</h3>
                    <p>{section.category}</p>
                </div>

                <div className="card-actions">
                    <button onClick={handleClick} className="text-white btn btn-accent min-h-0 h-8 leading-tight" disabled={restoring}>{restoring ? 'Restoring Section...' : 'Restore' }</button>
                </div>
            </div>
        </div>
    )
}

export default ArchiveSection;
