import React, { useState, useEffect } from "react";
import InfoCard from "../InfoCard/InfoCard";
import { getAllUniversityInfo } from "../../graphql/graphqlHelpers.js";

const MyAccount = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  loading, 
  formError,
  manualVPPUsername,
  setManualVPPUsername 
}) => {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    sortUniversityInfo();
  }, []);

  const sortUniversityInfo = () => {
    getAllUniversityInfo().then((result) => {
      const depts = [];
      const facs = [];

      result.forEach((element) => {
        if (element.type === "Department") {
          depts.push(element.value);
        } else if (element.type === "Faculty") {
          facs.push(element.value);
        }
      });
      setDepartments(depts.sort());
      setFaculties(facs.sort());
    });
  };

  const handleNullValues = (value) => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "Not provided";
    }
    return value;
  };

  const helpText = "Complete your account setup by providing the required information below. Fields marked with * are required.";

  return (
    <InfoCard 
      title="My Account" 
      helpText={helpText}
      className="h-fit"
    >
      <div className="space-y-6">
        {/* Contact Information Display - Similar to Contact component */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">
                    {handleNullValues(formData.first_name)} {handleNullValues(formData.last_name)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{handleNullValues(formData.email)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
        
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="primary_faculty">
              <span className="text-red-600 text-sm font-bold">* </span>
              Primary Faculty
            </label>
            <select
              id="primary_faculty"
              name="primary_faculty"
              value={formData.primary_faculty}
              onChange={(e) => setFormData({ ...formData, primary_faculty: e.target.value })}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                formError.toLowerCase().includes("faculty") ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Faculty</option>
              {faculties.map((fac, idx) => (
                <option key={idx} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="primary_department">
              <span className="text-red-600 text-sm font-bold">* </span>
              Primary Department
            </label>
            <select
              id="primary_department"
              name="primary_department"
              value={formData.primary_department}
              onChange={(e) => setFormData({ ...formData, primary_department: e.target.value })}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                formError.toLowerCase().includes("department") ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Department</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
              Role
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="Faculty"
                  checked={formData.role === "Faculty"}
                  className="mr-2"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                Faculty
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="Assistant"
                  checked={formData.role === "Assistant"}
                  className="mr-2"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                Delegate
              </label>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </InfoCard>
  );
};

export default MyAccount;
