"use client"

import { useState, useEffect } from "react"
import { getElsevierAuthorMatches, getOrcidAuthorMatches } from "../../../../../graphql/graphqlHelpers"
import { useApp } from "../../../../../Contexts/AppContext"
import ModalStylingWrapper from "../../../../../SharedComponents/ModalStylingWrapper"

const AddScopusModal = ({ isOpen, onClose }) => {
    const { userInfo, setUserInfo } = useApp()
    const [loading, setLoading] = useState(false)
    const [authors, setAuthors] = useState([])
    const [institutionError, setInstitutionError] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchAuthorMatches()
        }
    }, [isOpen])

    const fetchAuthorMatches = async () => {
        if (!userInfo.institution) {
            setInstitutionError(true);
            return;
        }
        setLoading(true);
        let formattedElsevierMatches = [];
        let formattedOrcidMatches = [];

        try {
            const elsevierMatches = await getElsevierAuthorMatches(userInfo.first_name, userInfo.last_name, userInfo.institution);
            formattedElsevierMatches = elsevierMatches.map(match => ({
                last_name: match.last_name || '',
                first_name: match.first_name || '',
                current_affiliation: match.current_affiliation || '',
                name_variants: match.name_variants || '',
                subjects: match.subjects || '',
                scopus_id: match.scopus_id || '',
                orcid: match.orcid ? match.orcid.replace(/[\[\]]/g, '') : ''
            }));
        } catch (error) {
            console.error("Error fetching elsevier matches:", error);
        }

        try {
            const orcidMatches = await getOrcidAuthorMatches(userInfo.first_name, userInfo.last_name, userInfo.institution);
            formattedOrcidMatches = orcidMatches.map(match => ({
                last_name: match.last_name || '',
                first_name: match.first_name || '',
                current_affiliation: match.current_affiliation || '',
                name_variants: match.name_variants || '',
                subjects: match.keywords ? match.keywords.replace(/[\[\]]/g, '') : [],
                scopus_id: '',
                orcid: match.orcid_id || ''
            }));
        } catch (error) {
            console.error("Error fetching orcid matches:", error);
        }

        const authors = [...formattedElsevierMatches, ...formattedOrcidMatches];
        setAuthors(authors);
        setLoading(false);
    };

    const handleScopusLink = (scopusId) => {
        if (!scopusId) return

        setUserInfo((prev) => ({
            ...prev,
            scopus_id: scopusId,
        }))

        onClose()
    }

    if (!isOpen) return null

    return (
        <ModalStylingWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-2xl">Find Scopus Profile</h2>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        ✕
                    </button>
                </div>

                {institutionError ? (
                    <div className="text-center mt-4">
                        <p className="text-lg text-red-500">Please select and save an Institution for your profile</p>
                    </div>
                ) : loading ? (
                    <div className="text-center mt-4">
                        <p className="text-lg font-bold">Loading...</p>
                    </div>
                ) : authors.length === 0 ? (
                    <div className="text-center mt-4">
                        <p className="text-lg text-gray-500">No matches found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {authors.map((author, index) => (
                            <div key={index} className="py-2 shadow-glow p-2 rounded-lg flex items-center justify-between">
                                <div className="ml-4">
                                    <p className="font-bold">
                                        {author.first_name} {author.last_name}
                                    </p>
                                    <p className="text-sm">{author.current_affiliation}</p>
                                    <p className="text-sm">{author.subjects}</p>
                                    <p className="text-sm">Scopus ID: {author.scopus_id || "Not found"}</p>
                                    <p className="text-sm">ORCID ID: {author.orcid || "Not found"}</p>
                                </div>
                                <div>
                                    <button
                                        className="btn btn-primary text-white btn-sm ml-4"
                                        onClick={() => handleScopusLink(author.scopus_id)}
                                        disabled={!author.scopus_id}
                                    >
                                        Link
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ModalStylingWrapper>
    )
}

export default AddScopusModal
