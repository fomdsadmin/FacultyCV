import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';

const ContactForm = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [formData, setFormData] = useState({
    name: `${userInfo.first_name} ${userInfo.last_name}`,
    email: `${userInfo.email}`,
    subject: "Faculty 360 Query:",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Submitted:", formData);
    setSubmitted(true);
    setFormData({
    name: `${userInfo.first_name} ${userInfo.last_name}`,
    email: `${userInfo.email}`,
    subject: "Faculty 360 Query:",
    message: "",
  });
  setErrors({});
  };

  return (
     <PageContainer>
      {/* Sidebar */}
      <FacultyMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
     {/* Main content */}
    <main className="ml-4 pr-5 w-full overflow-auto py-6 px-4">
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">📬 Support Form</h2>

      {submitted && (
        <div className="text-green-600 text-sm mb-4"><b>Ticket has been submitted successfully. We will get in touch with you shortly.</b></div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            className="input input-bordered w-full"
            value={formData.name}
            onChange={handleChange}
            readOnly
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            className="input input-bordered w-full"
            value={formData.email}
            onChange={handleChange}
            readOnly
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            className="input input-bordered w-full"
            value={formData.subject}
            onChange={handleChange}
          />
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            name="message"
            rows="4"
            className="textarea textarea-bordered w-full"
            value={formData.message}
            onChange={handleChange}
            placeholder='please provide the details'
          />
          {errors.message && (
            <p className="text-red-500 text-xs mt-1">{errors.message}</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-sm">
          Send Message
        </button>
      </form>
    </div>
    </main>
    </PageContainer>
  );
};

export default ContactForm;
