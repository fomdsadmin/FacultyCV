import React from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";

const FacultyMenu = ({ userName, onSignOut }) => {
    return (
        <ul className="menu bg-base-200 rounded-box w-56 flex-shrink-0 h-full">
        <li>
            <a>
            <TbHome className="h-5 w-5" />
            {userName}
            </a>
        </li>
        <li>
            <a>
            <HiOutlineAcademicCap className="h-5 w-5" />
            Academic Work
            </a>
        </li>
        <li>
            <a>
            <TiDownloadOutline className="h-5 w-5" />
            Reports
            </a>
        </li>
        <li className="mt-auto">
            <button className="btn btn-warning py-1 px-4 w-2/4 mx-auto min-h-0 h-8 leading-tight" onClick={onSignOut}>Sign out</button>
        </li>
        </ul>
    )
}

export default FacultyMenu;
