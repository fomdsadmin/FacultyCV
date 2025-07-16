import { createPortal } from "react-dom"
import { useEffect } from "react"

// Wrap all your dialog components with this
const ModalStylingWrapper = ({ children, useDefaultBox = false }) => {
    // Lock body scroll when modal is mounted
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
        >
            {useDefaultBox ? 
                <div 
                    className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative"
                    onClick={(e) => e.stopPropagation()} // Also prevent on the inner box
                >
                    {children}
                </div> :
                <div onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
            }
        </div>,
        document.body
    )
}

export default ModalStylingWrapper