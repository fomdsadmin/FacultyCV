import { changeUsername } from "graphql/graphqlHelpers";
import { useFaculty } from "../FacultyContext";
import { useState } from "react";

const Login = () => {
  const { handleInputChange, userInfo, setUserInfo } = useFaculty();
  const [showVppModal, setShowVppModal] = useState(false);
  const [healthEmail, setHealthEmail] = useState("");

  const handleLinkVPP = () => {
    setShowVppModal(true);
  };

  const handleVppModalSubmit = async (e) => {
    e.preventDefault();

    await changeUsername(userInfo.user_id, userInfo.cwl_username, healthEmail);
    window.location.reload();
    setShowVppModal(false);
    setHealthEmail("");
  };

  const handleClearVPP = async () => {
    if (setUserInfo) {
      setUserInfo((prev) => ({ ...prev, vpp_username: "" }));
    }
    await changeUsername(userInfo.user_id, userInfo.cwl_username, "");
    window.location.reload();
    setHealthEmail("");
  };

  const handleNullValues = (value) => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "";
    }
    return value;
  };

  return (
    <div>
      <h2 className="text-lg font-bold mt-2 mb-2 text-zinc-500">Login</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
        <div className="flex-1 w-full">
          <label className="block text-sm mb-1">
            {/* <label className="  text-sm font-bold" htmlFor="first_name">
              *{" "}
            </label> */}
            CWL Username
          </label>
          <input
            id="cwl_username"
            name="cwl_username"
            type="text"
            value={handleNullValues(userInfo.cwl_username) || ""}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300 cursor-not-allowed"
            readOnly
            disabled
          />
        </div>
        <div></div>
        <div className="flex-1 w-full relative">
          <label className="block text-sm mb-1">VPP Username</label>
          {userInfo.vpp_username ? (
            <div className="flex items-center gap-2">
              <span
                className="bg-blue-100 border border-blue-200 rounded-md font-semibold text-left"
                style={{ width: "100%", minWidth: 0, padding: "0.5rem 0.75rem", display: "inline-block" }}
              >
                {userInfo.vpp_username}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                title="Edit VPP Username"
                onClick={() => {
                  setHealthEmail(userInfo.vpp_username);
                  setShowVppModal(true);
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                title="Clear VPP Username"
                onClick={handleClearVPP}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-primary px-3 py-1 text-xs font-semibold" onClick={handleLinkVPP}>
                Link Health Authority Login
              </button>
            </div>
          )}
          {showVppModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-[25%] max-h-[25%] h-full w-full flex flex-col  justify-center gap-3">
                <h3 className="text-lg font-bold mb-2 text-zinc-700">Link Health Authority Login</h3>
                <form>
                  <label className="block text-sm mb-1">Health Authority Email</label>
                  <input
                    type="email"
                    className="w-full rounded text-sm px-3 py-2 border border-gray-300 mb-3"
                    value={healthEmail}
                    onChange={(e) => setHealthEmail(e.target.value)}
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowVppModal(false)}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary text-white font-semibold"
                      onClick={handleVppModalSubmit}
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        {/* <span className="ml-4 text-xs text-blue-600 font-normal bg-blue-50 p-2 rounded-xl min-w-full mt-6">
              * Use your <span className="bg-blue-100 px-1 rounded">CWLID@ubc.ca</span> or registered email for Health Authority Login (VCH, PHSA, PHC).
            </span> */}
      </div>
    </div>
  );
};

export default Login;
