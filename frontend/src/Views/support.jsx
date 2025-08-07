import React, { useState } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import { fetchAuthSession } from 'aws-amplify/auth';

const ContactForm = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [formData, setFormData] = useState({
    name: `${userInfo.first_name} ${userInfo.last_name}`,
    email: `${userInfo.email}`,
    subject: "Faculty 360 Query:",
    message: "",
    problemType: "",
    file: null,
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.problemType) newErrors.problemType = "Select a problem type";
    if (!formData.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("No ID token found.");

      const payload = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        problemType: formData.problemType,
      };

      if (formData.file) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            const base64Index = result.indexOf("base64,") + 7;
            resolve(result.substring(base64Index));
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(formData.file);
        });

        payload.attachments = [{
          name: formData.file.name,
          type: formData.file.type,
          content: base64
        }];
      }

      // Get the base URL from environment variable, with fallback logic
      let baseUrl = process.env.REACT_APP_SUPPORT_FORM_API_BASE_URL || "";
      
      // Remove trailing slash if present
      if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
      }

      // Make the POST request to /send-email with Authorization header and payload
      const response = await fetch(`${baseUrl}/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Assumes idToken is defined
      },
      body: JSON.stringify(payload), // Assumes payload is defined
    });


      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      setSubmitted(true);
      alert("Your ticket has been submitted successfully. We'll get in touch soon.");

      setFormData({
        name: `${userInfo.first_name} ${userInfo.last_name}`,
        email: `${userInfo.email}`,
        subject: "Faculty 360 Query:",
        message: "",
        problemType: "",
        file: null,
      });
      setErrors({});
    } catch (err) {
      console.error("Submission error:", err);
      alert("There was a problem submitting your request. Please try again or email us at xxxx@ubc.ca.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <FacultyMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main className="ml-4 pr-5 w-full overflow-auto py-6 px-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">📬 Support Form</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" className="input input-bordered w-full" value={formData.name} readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" className="input input-bordered w-full" value={formData.email} readOnly />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input type="text" name="subject" className="input input-bordered w-full" value={formData.subject} onChange={handleChange} />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Problem Type</label>
              <select name="problemType" className="select select-bordered w-full" value={formData.problemType} onChange={handleChange}>
                <option value="">Select a type</option>
                <option value="bug">Bug</option>
                <option value="enhancement">Enhancement Request</option>
                <option value="help">Help Request</option>
                <option value="other">Other</option>
              </select>
              {errors.problemType && <p className="text-red-500 text-xs mt-1">{errors.problemType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea name="message" rows="4" className="textarea textarea-bordered w-full" value={formData.message} onChange={handleChange} placeholder="Please provide the details" />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
              <input type="file" name="file" className="file-input file-input-bordered w-full" onChange={handleChange} />
              {formData.file && <p className="text-sm mt-1 text-gray-600">Selected: {formData.file.name}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </main>
    </PageContainer>
  );
};

export default ContactForm;
