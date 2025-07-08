import AttributesList from "../Attributes/AttributesList";
import SubSectionTitle from "./SubSectionTitle";

const SubSectionItem = ({ subSection, index, preparedSection, setSubSectionSettings }) => {
    return (
        <div className="bg-white p-4 rounded border">
            <SubSectionTitle 
                subSection={subSection}
                index={index}
                setSubSectionSettings={setSubSectionSettings}
            />
            
            <AttributesList 
                subSection={subSection}
                preparedSection={preparedSection}
                setSubSectionSettings={setSubSectionSettings}
            />
        </div>
    );
};

export default SubSectionItem;