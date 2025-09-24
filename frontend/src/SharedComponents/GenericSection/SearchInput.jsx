import { useGenericSection } from "./GenericSectionContext"

const SearchInput = () => {
    const { searchTerm, setSearchTerm, section } = useGenericSection()

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value)
    }

    return (
        <div className="flex ml-4">
            <label className="text-sm input input-bordered flex items-center gap-2 h-10 w-96 max-w-xl">
                <input
                    type="text"
                    className="grow"
                    placeholder={`Search ${section.title}`}
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
                    <path
                        fillRule="evenodd"
                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                        clipRule="evenodd"
                    />
                </svg>
            </label>
        </div>
    )
}

export default SearchInput
