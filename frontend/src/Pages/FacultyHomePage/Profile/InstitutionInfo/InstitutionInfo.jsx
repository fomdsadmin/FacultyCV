import { useFaculty } from "../../FacultyContext"

const InstitutionInfo = () => {
  const { userInfo, handleInputChange, departments, faculties, affiliations, institutions, campuses, ranks } =
    useFaculty()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
      <div>
        <label className="block text-sm mb-1">Institution Name</label>
        <select
          id="institution"
          name="institution"
          value={userInfo.institution || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {institutions.map((institution, index) => (
            <option key={index} value={institution}>
              {institution}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Primary Faculty</label>
        <select
          id="primaryFaculty"
          name="primary_faculty"
          value={userInfo.primary_faculty || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {faculties.map((faculty, index) => (
            <option key={index} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Secondary Faculty</label>
        <select
          id="secondaryFaculty"
          name="secondary_faculty"
          value={userInfo.secondary_faculty || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {faculties.map((faculty, index) => (
            <option key={index} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Primary Department</label>
        <select
          id="primaryDepartment"
          name="primary_department"
          value={userInfo.primary_department || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {departments.map((department, index) => (
            <option key={index} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Secondary Department</label>
        <select
          id="secondaryDepartment"
          name="secondary_department"
          value={userInfo.secondary_department || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {departments.map((department, index) => (
            <option key={index} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Primary Affiliation</label>
        <select
          id="primaryAffiliation"
          name="primary_affiliation"
          value={userInfo.primary_affiliation || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {affiliations.map((affiliation, index) => (
            <option key={index} value={affiliation}>
              {affiliation}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Secondary Affiliation</label>
        <select
          id="secondaryAffiliation"
          name="secondary_affiliation"
          value={userInfo.secondary_affiliation || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {affiliations.map((affiliation, index) => (
            <option key={index} value={affiliation}>
              {affiliation}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Campus</label>
        <select
          id="campus"
          name="campus"
          value={userInfo.campus || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {campuses.map((campus, index) => (
            <option key={index} value={campus}>
              {campus}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Current Rank</label>
        <select
          id="rank"
          name="rank"
          value={userInfo.rank || ""}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          onChange={handleInputChange}
        >
          <option value="">-</option>
          {ranks.map((rank, index) => (
            <option key={index} value={rank}>
              {rank}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default InstitutionInfo
