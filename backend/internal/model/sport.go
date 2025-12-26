package model

type Sport struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type Category struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	SportID int64  `json:"sport_id"`
}

type Surface struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Environment struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
