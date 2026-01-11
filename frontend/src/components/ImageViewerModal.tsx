import { useState } from "react";
import "../styles/ImageViewerModal.css";

interface ImageViewerModalProps {
    images: { url: string; is_primary: boolean }[];
    initialIndex?: number;
    onClose: () => void;
}

export default function ImageViewerModal({ images, initialIndex = 0, onClose }: ImageViewerModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
    };

    useState(() => {
        document.addEventListener("keydown", handleKeyDown as any);
        return () => document.removeEventListener("keydown", handleKeyDown as any);
    });

    if (images.length === 0) return null;

    return (
        <div className="image-viewer-modal" onClick={handleBackdropClick}>
            <div className="image-viewer-content">
                <button className="close-btn" onClick={onClose}>
                    ×
                </button>

                {images.length > 1 && (
                    <>
                        <button className="nav-btn prev-btn" onClick={goToPrevious}>
                            ‹
                        </button>
                        <button className="nav-btn next-btn" onClick={goToNext}>
                            ›
                        </button>
                    </>
                )}

                <div className="image-container">
                    <img
                        src={images[currentIndex].url}
                        alt={`Image ${currentIndex + 1}`}
                        className="viewer-image"
                    />
                    {images[currentIndex].is_primary && (
                        <span className="primary-badge-viewer">Primary Image</span>
                    )}
                </div>

                {images.length > 1 && (
                    <div className="image-counter">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                {images.length > 1 && (
                    <div className="thumbnails">
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className={`thumbnail ${index === currentIndex ? "active" : ""}`}
                                onClick={() => setCurrentIndex(index)}
                            >
                                <img src={image.url} alt={`Thumbnail ${index + 1}`} />
                                {image.is_primary && <span className="primary-indicator">P</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
