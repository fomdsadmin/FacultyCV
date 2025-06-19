import { useApp } from "../../../Contexts/AppContext";
import { useFaculty } from "../FacultyContext"

const Contact = () => {
  const { handleInputChange } = useFaculty()
  const { userInfo} = useApp();

  return (
    <div>
      <h2 className="text-lg font-bold mt-2 mb-2 text-zinc-500">Contact</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 ">
        <div>
          <label className="block text-sm mb-1">First Name</label>
          <input
            id="firstName"
            name="first_name"
            type="text"
            value={userInfo.first_name || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Preferred Name</label>
          <input
            id="preferredName"
            name="preferred_name"
            type="text"
            maxLength={100}
            value={userInfo?.preferred_name || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Last Name</label>
          <input
            id="lastName"
            name="last_name"
            type="text"
            value={userInfo.last_name || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="text"
            value={userInfo?.email || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

export default Contact
