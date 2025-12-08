import EditSaveJsonModal from "./EditSaveJsonModal";
import { FiEdit2 } from "react-icons/fi";

const EditItemsJson = ({ setItems, items }) => {
    return (
        <EditSaveJsonModal
            json={items}
            setJson={setItems}
            buttonLabel="Edit Items JSON"
            modalTitle="Edit Items JSON"
            modalDescription="Edit or paste your template items JSON below. Click Save to apply changes."
            buttonIcon={FiEdit2}
            buttonColor="bg-orange-600 hover:bg-orange-700"
        />
    );
};

export default EditItemsJson;