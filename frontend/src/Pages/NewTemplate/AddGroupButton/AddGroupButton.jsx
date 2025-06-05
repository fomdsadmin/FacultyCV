import { useState } from "react";
import AddGroupModal from "./AddGroupModal";

const AddGroupButton = () => {

    const [showAddGroupModal, setShowAddGroupModal] = useState(false);

    const openAddGroupModal = () => {
        setShowAddGroupModal(true);
    }

    const onCloseAddGroupModal = () => {
        setShowAddGroupModal(false);
    }

    return <>
        <button type="button" onClick={openAddGroupModal} className="btn btn-secondary text-white px-2 py-1 text-sm">
            Add Group
        </button>
        {showAddGroupModal &&
            <AddGroupModal onClose={onCloseAddGroupModal} />
        }
    </>
}

export default AddGroupButton;