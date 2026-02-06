import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { reviewService } from "../api";
import type { ReviewWithUser, FacilityReviewStats, Review } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarSolid, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import "../styles/ReviewSection.css";

interface ReviewSectionProps {
    facilityId: number;
}

export default function ReviewSection({ facilityId }: ReviewSectionProps) {
    const { isAuthenticated, user } = useAuth();
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [stats, setStats] = useState<FacilityReviewStats | null>(null);
    const [userReview, setUserReview] = useState<Review | null>(null);
    const [canReview, setCanReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isHalf, setIsHalf] = useState(false);

    useEffect(() => {
        fetchReviewData();
    }, [facilityId, isAuthenticated]);

    const fetchReviewData = async () => {
        try {
            setLoading(true);
            setError("");            // Fetch reviews and stats (public)
            const [reviewsData, statsData] = await Promise.all([
                reviewService.getFacilityReviews(facilityId),
                reviewService.getFacilityStats(facilityId)
            ]);

            setReviews(reviewsData || []);
            setStats(statsData);

            // Fetch user-specific data if authenticated
            if (isAuthenticated) {
                try {
                    const [userReviewData, canReviewData] = await Promise.all([
                        reviewService.getUserReviewForFacility(facilityId),
                        reviewService.canUserReview(facilityId)
                    ]);

                    setUserReview(userReviewData || null);
                    setCanReview(canReviewData?.can_review || false);
                } catch (err) {
                    console.error("Error fetching user review data:", err);
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load reviews";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !comment.trim()) {
            setError("Please provide both a title and comment for your review");
            return;
        }

        try {
            setSubmitting(true);
            setError("");            if (isEditing && userReview) {
                await reviewService.update(userReview.id, {
                    rating,
                    title,
                    comment
                });
            } else {
                await reviewService.create({
                    facility_id: facilityId,
                    rating,
                    title,
                    comment
                });
            }

            // Reset form
            setShowReviewForm(false);
            setIsEditing(false);
            setRating(5);
            setTitle("");
            setComment("");

            // Refresh reviews
            await fetchReviewData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to submit review";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditReview = () => {
        if (userReview) {
            setRating(userReview.rating);
            setTitle(userReview.title);
            setComment(userReview.comment);
            setIsEditing(true);
            setShowReviewForm(true);
        }
    };

    const handleDeleteReview = async () => {
        if (!userReview || !window.confirm("Are you sure you want to delete your review?")) {
            return;
        }        try {
            setError("");
            await reviewService.delete(userReview.id);
            await fetchReviewData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete review";
            setError(errorMessage);
        }
    };

    const handleCancelForm = () => {
        setShowReviewForm(false);
        setIsEditing(false);
        setRating(5);
        setTitle("");
        setComment("");
        setError("");
    };

    const handleStarHover = (e: React.MouseEvent<SVGSVGElement>, starIndex: number) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const isLeftHalf = x < width / 2;
        
        const hoverValue = isLeftHalf ? starIndex - 0.5 : starIndex;
        setHoveredRating(hoverValue);
        setIsHalf(isLeftHalf);
    };

    const handleStarClick = (e: React.MouseEvent<SVGSVGElement>, starIndex: number) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const isLeftHalf = x < width / 2;
        
        const newRating = isLeftHalf ? starIndex - 0.5 : starIndex;
        setRating(newRating);
    };

    const renderStars = (rating: number, interactive: boolean = false) => {
        const stars = [];
        const displayRating = interactive && hoveredRating > 0 ? hoveredRating : rating;
        
        for (let i = 1; i <= 5; i++) {
            let starIcon;
            
            if (interactive) {
                // For interactive stars, support half stars
                const difference = displayRating - (i - 1);
                
                if (difference >= 1) {
                    starIcon = faStarSolid;
                } else if (difference > 0 && difference < 1) {
                    starIcon = faStarHalfStroke;
                } else {
                    starIcon = faStarRegular;
                }
                
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={starIcon}
                        className={`star ${difference > 0 ? 'filled' : ''} interactive`}
                        onClick={(e) => handleStarClick(e, i)}
                        onMouseMove={(e) => handleStarHover(e, i)}
                        onMouseLeave={() => setHoveredRating(0)}
                    />
                );
            } else {
                // For display stars, support half stars
                const difference = displayRating - (i - 1);
                
                if (difference >= 1) {
                    starIcon = faStarSolid;
                } else if (difference >= 0.25 && difference < 0.75) {
                    starIcon = faStarHalfStroke;
                } else if (difference >= 0.75) {
                    starIcon = faStarSolid;
                } else {
                    starIcon = faStarRegular;
                }
                
                stars.push(
                    <FontAwesomeIcon
                        key={i}
                        icon={starIcon}
                        className={`star ${difference >= 0.25 ? 'filled' : ''}`}
                    />
                );
            }
        }
        return <div className="stars">{stars}</div>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    if (loading) {
        return <div className="review-section-loading">Loading reviews...</div>;
    }

    return (
        <div className="review-section">
            <div className="review-header">
                <h2>Reviews & Ratings</h2>
                {stats && stats.total_reviews > 0 && (
                    <div className="review-stats">
                        <div className="average-rating">
                            <span className="rating-number">{stats.average_rating.toFixed(1)}</span>
                            {renderStars(stats.average_rating)}
                            <span className="total-reviews">({stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'})</span>
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="review-error">{error}</div>}

            {/* User Review Section */}
            {isAuthenticated && (
                <div className="user-review-section">
                    {userReview && !showReviewForm ? (
                        <div className="user-existing-review">
                            <h3>Your Review</h3>
                            <div className="review-card user-review">
                                <div className="review-header-inline">
                                    {renderStars(userReview.rating)}
                                    <span className="review-date">{formatDate(userReview.updated_at)}</span>
                                </div>
                                <h4>{userReview.title}</h4>
                                <p>{userReview.comment}</p>
                                <div className="review-actions">
                                    <button onClick={handleEditReview} className="btn-edit">Edit Review</button>
                                    <button onClick={handleDeleteReview} className="btn-delete">Delete Review</button>
                                </div>
                            </div>
                        </div>
                    ) : canReview && !userReview ? (
                        <div className="can-review-section">
                            {!showReviewForm ? (
                                <button onClick={() => setShowReviewForm(true)} className="btn-write-review">
                                    Write a Review
                                </button>
                            ) : (
                                <form onSubmit={handleSubmitReview} className="review-form">
                                    <h3>{isEditing ? 'Edit Your Review' : 'Write a Review'}</h3>
                                    
                                    <div className="form-group">
                                        <label>Rating *</label>
                                        {renderStars(rating, true)}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="review-title">Title *</label>
                                        <input
                                            id="review-title"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Summarize your experience"
                                            required
                                            maxLength={255}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="review-comment">Your Review *</label>
                                        <textarea
                                            id="review-comment"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Share your experience with this facility..."
                                            required
                                            rows={5}
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button type="submit" disabled={submitting} className="btn-submit">
                                            {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                                        </button>
                                        <button type="button" onClick={handleCancelForm} className="btn-cancel">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : !userReview && !canReview && (
                        <div className="cannot-review-message">
                            <p>You can only review facilities where you have completed a booking.</p>
                        </div>
                    )}
                </div>
            )}

            {/* All Reviews List */}
            <div className="reviews-list">
                <h3>All Reviews ({reviews.length})</h3>
                {reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review this facility!</p>
                ) : (
                    <div className="reviews-grid">
                        {reviews.map((review) => (
                            <div key={review.id} className={`review-card ${review.user_id === user?.id ? 'own-review' : ''}`}>
                                <div className="review-header-inline">
                                    <div className="reviewer-info">
                                        <span className="reviewer-name">{review.user_name}</span>
                                        {renderStars(review.rating)}
                                    </div>
                                    <span className="review-date">{formatDate(review.created_at)}</span>
                                </div>
                                <h4>{review.title}</h4>
                                <p>{review.comment}</p>
                                {review.created_at !== review.updated_at && (
                                    <span className="edited-badge">Edited</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
