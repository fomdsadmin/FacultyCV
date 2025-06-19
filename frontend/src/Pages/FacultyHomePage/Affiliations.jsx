import { useApp } from "../../Contexts/AppContext";
import { useFaculty } from "./FacultyContext";

// Responsive Section card
const Section = ({ title, children }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm flex-1 ">
    <h3 className="font-semibold mb-4 text-base text-zinc-600">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

// Field component
const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select
      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      {...props}
    >
      <option value="">-</option>
      {props.options.map((opt, idx) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const Affiliations = () => {
  const {
    handleInputChange,
    departments,
    faculties,
    affiliations,
    institutions,
    campuses,
    ranks,
  } = useFaculty();
  const { userInfo } = useApp();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-2">
        <Section title="Institution">
          <Field
            label="Institution"
            name="institution"
            value={userInfo.institution || ""}
            onChange={handleInputChange}
            options={institutions}
          />
          <Field
            label="Campus"
            name="campus"
            value={userInfo.campus || ""}
            onChange={handleInputChange}
            options={campuses}
          />
        </Section>

        <Section title="Faculty">
          <Field
            label="Primary Faculty"
            name="primary_faculty"
            value={userInfo.primary_faculty || ""}
            onChange={handleInputChange}
            options={faculties}
          />
          <Field
            label="Secondary Faculty"
            name="secondary_faculty"
            value={userInfo.secondary_faculty || ""}
            onChange={handleInputChange}
            options={faculties}
          />
          <Field
            label="Current Rank"
            name="rank"
            value={userInfo.rank || ""}
            onChange={handleInputChange}
            options={ranks}
          />
        </Section>

        <Section title="Department">
          <Field
            label="Primary Department"
            name="primary_department"
            value={userInfo.primary_department || ""}
            onChange={handleInputChange}
            options={departments}
          />
          <Field
            label="Secondary Department"
            name="secondary_department"
            value={userInfo.secondary_department || ""}
            onChange={handleInputChange}
            options={departments}
          />
        </Section>

        <Section title="Affiliation">
          <Field
            label="Primary Affiliation"
            name="primary_affiliation"
            value={userInfo.primary_affiliation || ""}
            onChange={handleInputChange}
            options={affiliations}
          />
          <Field
            label="Secondary Affiliation"
            name="secondary_affiliation"
            value={userInfo.secondary_affiliation || ""}
            onChange={handleInputChange}
            options={affiliations}
          />
        </Section>
      </div>
    </div>
  );
};

export default Affiliations;
