export interface Review {
    id: number;
    user_id: number;
    facility_id: number;
    rating: number;
    title: string;
    comment: string;
    created_at: string;
    updated_at: string;
}

export interface ReviewWithUser extends Review {
    user_name: string;
}

export interface FacilityReviewStats {
    average_rating: number;
    total_reviews: number;
}

export interface CreateReviewRequest {
    facility_id: number;
    rating: number;
    title: string;
    comment: string;
}

export interface UpdateReviewRequest {
    rating: number;
    title: string;
    comment: string;
}
