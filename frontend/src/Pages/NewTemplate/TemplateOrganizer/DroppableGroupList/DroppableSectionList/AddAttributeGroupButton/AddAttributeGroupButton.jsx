import { useState } from "react";
import AddAttributeGroupModal from "./AddAttributeGroupModal";

const AddAttributeGroupButton = ({ groupId, dataSectionId }) => {

    const [showAddAttributeGroupModal, setShowAddAttributeGroupModal] = useState(false);

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