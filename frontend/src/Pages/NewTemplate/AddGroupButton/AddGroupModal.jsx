import { useState } from "react";
import ModalStylingWrapper from "../../../SharedComponents/ModalStylingWrapper";
import { useTemplate } from "../TemplateContext";
import { toast } from "react-toastify";

const AddGroupModal = ({ onClose }) => {

    const { setGroups, groups } = useTemplate();

    const [groupName, setGroupName] = useState("");

    const createGroup = () => {

        const listOfGroupIds = groups.map(group => group.id);

        if (listOfGroupIds.includes(groupName)) {
            toast.warning("A group with that name already exists!", { autoClose: 3000 })
            setGroupName("");
            return;
        }

        setGroups((prev) => ([
            {
                id: groupName,
                title: groupName,
                sections: []
            },
            ...prev
        ]))

        onClose();
    }

    return <>
        <ModalStylingWrapper useDefaultBox={true}>
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
            <input
                className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y transition-all duration-150"
                placeholder="Enter name of new group here..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="flex justify-end mt-2">
                <button type="button" onClick={createGroup} className="btn btn-success text-white px-2 py-1 text-sm">
                    Create Group
                </button>
            </div>
        </ModalStylingWrapper>
    </>
}

export default AddGroupModal;