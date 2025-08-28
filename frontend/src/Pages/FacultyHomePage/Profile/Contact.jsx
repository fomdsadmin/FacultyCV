import { useFaculty } from "../FacultyContext";

const Contact = () => {
  const { handleInputChange, userInfo } = useFaculty();

  const handleNullValues = (value) => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "";
    }
    return value;
  };

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
            maxLength={100}
            value={handleNullValues(userInfo.first_name) || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            // onChange={handleInputChange}
            readOnly
            disabled
          />
        </div>
        {/* <div>
          <label className="block text-sm mb-1">Preferred Name</label>
          <input
            id="preferredName"
            name="preferred_name"
            type="text"
            maxLength={100}
            value={handleNullValues(userInfo?.preferred_name) || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            onChange={handleInputChange}
          />
        </div> */}
        <div>
          <label className="block text-sm mb-1">Last Name</label>
          <input
            id="lastName"
            name="last_name"
            type="text"
            maxLength={100}
            value={handleNullValues(userInfo.last_name) || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            // onChange={handleInputChange}
            readOnly
            disabled
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="text"
            value={handleNullValues(userInfo?.email) || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            readOnly
            disabled
          />
        </div>
        {/* 
        <div className="">
          <div className="flex items-center">
            <div className="flex-1 min-w-full">
              <label className="block text-sm mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={handleNullValues(userInfo?.username) || ""}
                className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
                readOnly
              />
            </div>
            <span className="ml-4 text-xs text-blue-600 font-normal bg-blue-50 p-2 rounded-xl min-w-full mt-6">
              * Use your <span className="bg-blue-100 px-1 rounded">CWLID@ubc.ca</span> or registered email for Health Authority Login (VCH, PHSA, PHC).
            </span>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Contact;
