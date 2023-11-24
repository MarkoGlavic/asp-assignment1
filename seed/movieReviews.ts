import {MovieReviews} from '../shared/types'

export const movieReviews : MovieReviews[] = [
    {
      movieId: 1234,
      reviewerName: 'Marko',
      reviewDate: '2023-10-20',
      content: "This movie is amazing",
      rating: 5,
    },
    {
        movieId: 1234,
        reviewerName: 'User2',
        reviewDate: '2023-10-21',
        content: "This movie sucks",
        rating: 1,
      },
      {
        movieId: 1234,
        reviewerName: 'User3',
        reviewDate: '2023-10-22',
        content: "Mid",
        rating: 3,
      },
      {
        movieId: 2345,
        reviewerName: 'Marko',
        reviewDate: '2023-10-25',
        content: "This moive is also amazing",
        rating: 5,
      },
      {
        movieId: 2345,
        reviewerName: 'User2',
        reviewDate: '2023-10-22',
        content: "Ye this movie is better",
        rating: 4,
      },
]
