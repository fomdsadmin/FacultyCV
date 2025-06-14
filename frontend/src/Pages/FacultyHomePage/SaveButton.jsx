import { useState } from "react";
import { useApp } from "../../Contexts/AppContext";
import { updateUser } from "../../graphql/graphqlHelpers";
import { useFaculty } from "./FacultyContext";

const SaveButton = () => {

    const [isSubmitting, setIsSubmitting] = useState(false)

    const { userInfo, getUserInfo } = useApp();
    const { setPrevUserInfo, change } = useFaculty();

    // Handle form submission
    const handleSubmit = async (event) => {
        if (event) event.preventDefault()
        setIsSubmitting(true)

        try {
            await updateUser(
                userInfo.user_id,
                userInfo.first_name,
                userInfo.last_name,
                userInfo.preferred_name,
                userInfo.email,
                userInfo.role,
                userInfo.bio,
                userInfo.rank,
                userInfo.institution,
                userInfo.primary_department,
                userInfo.secondary_department,
                userInfo.primary_faculty,
                userInfo.secondary_faculty,
                userInfo.primary_affiliation,
                userInfo.secondary_affiliation,
                userInfo.campus,
                userInfo.keywords,
                userInfo.institution_user_id,
                userInfo.scopus_id,
                userInfo.orcid_id,
            )
            getUserInfo(userInfo.email)
            setIsSubmitting(false)
            setPrevUserInfo(JSON.parse(JSON.stringify(userInfo)));
        } catch (error) {
            console.error("Error updating user:", error)
            setIsSubmitting(false)
        }
    }

    return (
        <button
            type="button"
            className={`btn text-white py-1 px-2 w-1/5 min-h-0 h-8 leading-tight ${change ? "btn-success" : "btn-disabled bg-gray-400"
                }`}
            disabled={!change || isSubmitting}
            onClick={change && !isSubmitting ? handleSubmit : undefined}
        >
            {isSubmitting ? "Saving..." : change ? "Save" : "Saved"}
        </button>
    );
};

export default SaveButton;
