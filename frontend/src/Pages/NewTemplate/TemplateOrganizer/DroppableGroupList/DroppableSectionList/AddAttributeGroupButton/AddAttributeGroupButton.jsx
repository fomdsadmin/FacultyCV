import { useState } from "react";
import { useTemplate } from "Pages/NewTemplate/TemplateContext";
import AddAttributeGroupModal from "./AddAttributeGroupModal";
import { useTemplateOrganizer } from "Pages/NewTemplate/TemplateOrganizer/TemplateOrganizerContext";

const AddAttributeGroupButton = ({ dataSectionId }) => {

    const { getGroupIdContainingPreparedSectionId } = useTemplateOrganizer();
    const [showAddAttributeGroupModal, setShowAddAttributeGroupModal] = useState(false);

    const groupId = getGroupIdContainingPreparedSectionId(dataSectionId);

    const openAddAttributeGroupModal = (e) => {
        e.stopPropagation();
        setShowAddAttributeGroupModal(true);
    }

    const onCloseAddAttributeGroupModal = () => {
        setShowAddAttributeGroupModal(false);
    }

    return <>
        <button
            type="button"
            onClick={openAddAttributeGroupModal}
            className="btn btn-secondary text-white px-2 py-1 text-xs"
        >
            Add Attribute Group
        </button>
        {showAddAttributeGroupModal &&
            <AddAttributeGroupModal
                onClose={onCloseAddAttributeGroupModal}
                groupId={groupId}
                dataSectionId={dataSectionId}
            />
        }
    </>
}

export default AddAttributeGroupButton;