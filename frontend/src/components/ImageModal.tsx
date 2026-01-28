import { useEffect } from 'react';
import '../styles/ImageModal.css';

interface ImageModalProps {
    imageUrl: string;
    altText: string;
    onClose: () => void;
}

const ImageModal = ({ imageUrl, altText, onClose }: ImageModalProps) => {
    useEffect(() => {
        // Close modal on Escape key press
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="image-modal-close" onClick={onClose}>
                    ✕
                </button>
                <img src={imageUrl} alt={altText} />
            </div>
        </div>
    );
};

export default ImageModal;
