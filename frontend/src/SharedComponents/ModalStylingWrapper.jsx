import { createPortal } from "react-dom"

// Wrap all your dialog components with this
const ModalStylingWrapper = ({ children }) => {
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            {children}
        </div>,
        document.body
    )

}

export default ModalStylingWrapper