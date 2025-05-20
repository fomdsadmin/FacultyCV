const Tabs = () => {
    return (
        <>
            <div className="ml-4 mt-12 pr-5">
                <div className="flex space-x-4 mb-4">
                    {[...academicSections, { title: 'Linkages' }].map((section) => (
                        <button
                            key={section.title}
                            className={`text-lg font-bold px-5 py-2 rounded-lg transition-colors duration-200 ${activeTab === section.title
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            onClick={() => setActiveTab(section.title)}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>


                <div className="border border-gray-200 rounded-md bg-white p-4">
                    {academicSections.map(section =>
                        activeTab === section.title ? (
                            <GenericSection
                                key={section.data_section_id}
                                user={userInfo}
                                section={section}
                                onBack={() => { }}
                            />
                        ) : null
                    )}

                    {activeTab === 'Linkages' && (
                        <div className="space-y-6">
                            {/* Scopus Section */}
                            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
                                <h3 className="text-md font-semibold text-zinc-700 mb-2">Scopus ID(s)</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {scopusId && scopusId.split(',').map((id, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => window.open(`https://www.scopus.com/authid/detail.uri?authorId=${id}`, '_blank')}
                                            className="btn btn-sm btn-secondary text-white"
                                        >
                                            {id}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={handleScopusIdClick} className="btn btn-sm btn-success text-white">Add Scopus ID</button>
                                    <button onClick={() => { setActiveModal('ManualScopus'); setModalOpen(true); }} className="btn btn-sm btn-outline text-gray-700">Add Manually</button>
                                    {scopusId && (
                                        <button onClick={handleClearScopusId} className="btn btn-sm btn-warning text-white">Clear</button>
                                    )}
                                </div>
                            </div>

                            {/* ORCID Section */}
                            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
                                <h3 className="text-md font-semibold text-zinc-700 mb-2">ORCID ID</h3>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => orcidId ? window.open(`https://orcid.org/${orcidId}`, '_blank') : handleOrcidIdClick()}
                                        className={`btn btn-sm ${orcidId ? 'btn-secondary' : 'btn-success'} text-white`}
                                    >
                                        {orcidId || "Add ORCID ID"}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => { setActiveModal('ManualOrcid'); setModalOpen(true); }} className="btn btn-sm btn-outline text-gray-700">Add Manually</button>
                                    {orcidId && (
                                        <button onClick={handleClearOrcidId} className="btn btn-sm btn-warning text-white">Clear</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

return Tabs;