import { createPortal } from "react-dom"

// Wrap all your dialog components with this
const ModalStylingWrapper = ({ children, useDefaultBox = false }) => {
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            {useDefaultBox ? <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative">
                {children}
            </div> :
                <>
                    {children}
                </>
            }
        </div>,
        document.body
    )

}

export default ModalStylingWrapper