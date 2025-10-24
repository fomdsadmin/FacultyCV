import { useFaculty } from "../FacultyContext";
import InfoCard from "../../../Components/InfoCard/InfoCard";

const Contact = () => {
  const { userInfo } = useFaculty();

  const handleNullValues = (value) => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "Not provided";
    }
    return value;
  };

  const helpText = "This section displays your contact information fetched from Workday. Please update your details in Workday if there are any changes.";
  return (
    <InfoCard 
      title="Contact Information" 
      helpText={helpText}
      className="h-fit"
    >
      <div className="grid grid-cols-2 items-center justify-start space-y-4">
        <div className="flex items-center border-b border-gray-100 last:border-b-0">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">
                {handleNullValues(userInfo.first_name)} {handleNullValues(userInfo.last_name)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center border-b border-gray-100 last:border-b-0">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900">{handleNullValues(userInfo?.email)}</p>
            </div>
          </div>
        </div>
      </div>
    </InfoCard>
  );
};

export default Contact;
