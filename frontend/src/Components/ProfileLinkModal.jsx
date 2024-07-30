import React, { useState } from "react";

const authors = [
  {
    last_name: "Hayden",
    first_name: "Michael R.",
    current_affiliation: "BC Children's Hospital Research Institute",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Genetics", "Pediatrics"],
    scopus_id: "893",
    orcid: "0000-0001-2345-6789",
  },
  {
    last_name: "Hayden",
    first_name: "Michael E.",
    current_affiliation: "Simon Fraser University",
    name_variants: ["Michael E. Hayden", "Michael Hayden"],
    subjects: ["Physics", "Materials Science"],
    scopus_id: "120",
    orcid: "0000-0002-3456-7890",
  },
  {
    last_name: "Hayden",
    first_name: "Michael R.",
    current_affiliation: "The University of British Columbia",
    name_variants: ["Michael R. Hayden", "Michael Hayden"],
    subjects: ["Neurology", "Biochemistry"],
    scopus_id: "1",
    orcid: "0000-0003-4567-8901",
  },
];

const ProfileLinkModal = ({ setClose, setAuthor, author }) => {
  const [loading, setLoading] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(author);
  const [isHovered, setIsHovered] = useState(false);

  const handleLinkClick = (author) => {
    setLoading(true);
    setSelectedAuthor(null);


    setTimeout(() => {
      setLoading(false);
      setSelectedAuthor(author);
      setAuthor(author); 
    }, 1500);
  };

  const handleUnlink = () => {
    setIsHovered(false);
    setSelectedAuthor(null);
    setAuthor(null); 
  };

  return (
    <dialog className="modal-dialog" open>
      <div className="max-h-80">
        <form method="dialog">
          <button
            onClick={setClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>
        <h2 className="font-bold text-2xl">Results</h2>
        <div className="border-t mt-4"></div>
        {!selectedAuthor &&
          !loading &&
          authors.map((author, index) => (
            <div
              key={index}
              className="py-2 shadow-glow p-2 my-6 rounded-lg flex items-center justify-between"
            >
              <div className="ml-4">
                <p className="font-bold">
                  {author.first_name} {author.last_name}
                </p>
                <p className="text-sm">{author.current_affiliation}</p>
                <p className="text-sm">{author.subjects.join(", ")}</p>
              </div>
              <div>
                <button
                  onClick={() => handleLinkClick(author)}
                  className="btn btn-sm btn-primary text-white mr-4"
                >
                  Link
                </button>
              </div>
            </div>
          ))}
        {loading && (
          <div className="text-center mt-4">
            <p className="text-lg font-bold">Loading...</p>
          </div>
        )}
        {selectedAuthor && !loading && (
          <div className="mt-4">
            <p className="font-bold">
              {selectedAuthor.first_name} {selectedAuthor.last_name}
            </p>
            <p>{selectedAuthor.current_affiliation}</p>
            <p>Subjects: {selectedAuthor.subjects.join(", ")}</p>
            <div
              className="mt-2 text-green-600 font-semibold"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isHovered ? (
                <button onClick={handleUnlink} className="text-red-600">
                  Unlink
                </button>
              ) : (
                <span>Linked</span>
              )}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default ProfileLinkModal;
