import React, { useState } from 'react';
import PublicationsEntry from "./PublicationsEntry";
import EntryModal from "./EntryModal";

const Publications = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPublication, setSelectedPublication] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleEdit = (publication) => {
        setIsNew(false)
        setSelectedPublication(publication);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setIsNew(true);
        setIsModalOpen(true);
        const newPublication = 
            {
                publication_id: '',
                publication_type: '',
                publication_title: '',
                scopus_ids: '',
                publisher: '',
                publication_year: '',
                keywords: '',
                journal: '',
                link: '',
                doi: '',
                num_citations: ''
              }

        setSelectedPublication(newPublication);
    }

    const handleCloseModal = () => {
        setSelectedPublication(null);
        setIsModalOpen(false);
    };

    const mockPublications = [
        {
          publication_id: 'pub1',
          publication_type: 'Journal Article',
          publication_title: 'A Comprehensive Study on AI',
          scopus_ids: '1234567890',
          publisher: 'Springer',
          publication_year: 2023,
          keywords: 'AI, Machine Learning, Deep Learning',
          journal: 'International Journal of AI Research',
          link: 'http://example.com/pub1',
          doi: '10.1000/j.jair.2023.01',
          num_citations: 15
        },
        {
          publication_id: 'pub2',
          publication_type: 'Conference Paper',
          publication_title: 'Advances in Quantum Computing',
          scopus_ids: '0987654321',
          publisher: 'IEEE',
          publication_year: 2022,
          keywords: 'Quantum Computing, Algorithms',
          journal: 'IEEE Quantum Conference',
          link: 'http://example.com/pub2',
          doi: '10.1000/qc.2022.02',
          num_citations: 22
        },
        {
          publication_id: 'pub3',
          publication_type: 'Book Chapter',
          publication_title: 'Big Data Analytics: Techniques and Applications',
          scopus_ids: '1122334455',
          publisher: 'Elsevier',
          publication_year: 2021,
          keywords: 'Big Data, Data Analytics',
          journal: 'Advances in Data Science',
          link: 'http://example.com/pub3',
          doi: '10.1000/ads.2021.03',
          num_citations: 30
        },
        {
          publication_id: 'pub4',
          publication_type: 'Journal Article',
          publication_title: 'Neural Networks for Image Recognition',
          scopus_ids: '2233445566',
          publisher: 'Springer',
          publication_year: 2020,
          keywords: 'Neural Networks, Image Recognition',
          journal: 'Journal of Computer Vision',
          link: 'http://example.com/pub4',
          doi: '10.1000/jcv.2020.04',
          num_citations: 45
        },
        {
          publication_id: 'pub5',
          publication_type: 'Conference Paper',
          publication_title: 'Blockchain Technology: A Survey',
          scopus_ids: '3344556677',
          publisher: 'ACM',
          publication_year: 2019,
          keywords: 'Blockchain, Cryptocurrency',
          journal: 'ACM Blockchain Conference',
          link: 'http://example.com/pub5',
          doi: '10.1000/bc.2019.05',
          num_citations: 60
        },
        {
          publication_id: 'pub6',
          publication_type: 'Book',
          publication_title: 'Introduction to Cybersecurity',
          scopus_ids: '4455667788',
          publisher: 'O\'Reilly Media',
          publication_year: 2018,
          keywords: 'Cybersecurity, Network Security',
          journal: '',
          link: 'http://example.com/pub6',
          doi: '10.1000/cs.2018.06',
          num_citations: 75
        },
        {
          publication_id: 'pub7',
          publication_type: 'Journal Article',
          publication_title: 'Data Privacy in the Age of Big Data',
          scopus_ids: '5566778899',
          publisher: 'Wiley',
          publication_year: 2017,
          keywords: 'Data Privacy, Big Data',
          journal: 'Journal of Privacy and Confidentiality',
          link: 'http://example.com/pub7',
          doi: '10.1000/jpc.2017.07',
          num_citations: 90
        },
        {
          publication_id: 'pub8',
          publication_type: 'Conference Paper',
          publication_title: 'The Future of Autonomous Vehicles',
          scopus_ids: '6677889900',
          publisher: 'IEEE',
          publication_year: 2016,
          keywords: 'Autonomous Vehicles, Robotics',
          journal: 'IEEE Robotics Conference',
          link: 'http://example.com/pub8',
          doi: '10.1000/rc.2016.08',
          num_citations: 105
        },
        {
          publication_id: 'pub9',
          publication_type: 'Book Chapter',
          publication_title: 'Cloud Computing: Principles and Paradigms',
          scopus_ids: '7788990011',
          publisher: 'Springer',
          publication_year: 2015,
          keywords: 'Cloud Computing, Virtualization',
          journal: 'Handbook of Cloud Computing',
          link: 'http://example.com/pub9',
          doi: '10.1000/hcc.2015.09',
          num_citations: 120
        },
        {
          publication_id: 'pub10',
          publication_type: 'Journal Article',
          publication_title: 'The Role of AI in Healthcare',
          scopus_ids: '8899001122',
          publisher: 'Elsevier',
          publication_year: 2014,
          keywords: 'AI, Healthcare, Machine Learning',
          journal: 'Journal of Health Informatics',
          link: 'http://example.com/pub10',
          doi: '10.1000/jhi.2014.10',
          num_citations: 135
        }
      ];

    const searchedEntries = mockPublications.filter(entry => {
        const title = entry.publication_title.toLowerCase() || '';
        const publisher = entry.publisher.toLowerCase() || '';
        const year = entry.publication_year.toString().toLowerCase() || '';
        const keywords = entry.keywords.toLowerCase() || '';
        const journal = entry.journal.toLowerCase() || '';
        const term = searchTerm.toLowerCase() || '';

        const matchesSearch = 
            title.includes(term) || 
            publisher.startsWith(term) ||
            year.includes(term) ||
            keywords.includes(term) || 
            journal.startsWith(term);
        
        return matchesSearch; 
    });

    return (
        <div>
            <div className='m-4 max-w-lg flex'>
                <h2 className="text-left text-4xl font-bold text-zinc-600">Publications</h2> 
                <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight'>new</button>   
            </div>
            <div className='m-4 max-w-lg flex'>
                <label className="input input-bordered flex items-center gap-2 flex-1">
                    <input
                        type="text"
                        className="grow"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4 opacity-70"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                            clipRule="evenodd" />
                    </svg>
                </label>
            </div>

            {searchedEntries.map((publication) => (
                <PublicationsEntry key={publication.publication_id} {...publication} onEdit={() => handleEdit(publication)} />
            ))}

            {isModalOpen && selectedPublication && !isNew && (
                <EntryModal
                    isNew={false}
                    {...selectedPublication}
                    entryType={"Publication"}
                    onClose={handleCloseModal}
                />
            )}

            {isModalOpen && selectedPublication && isNew && (
                <EntryModal
                    isNew={true}
                    {...selectedPublication}
                    entryType={"Publication"}
                    onClose={handleCloseModal}
                />
            )}

        </div>
    );
}

export default Publications;
