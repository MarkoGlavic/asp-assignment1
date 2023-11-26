## ServerlessREST Sddignment - Distributed Systems.

__Name:__ Marko Glavic

This repository contains the implementation of a serverless REST API for the AWS platform. A CDK stack creates the infrastructure. The domain context of the API is movie reviews.

### API endpoints.

 
+ POST /movies/reviews - add a movie review.

+ GET /movies/{movieId}/reviews - Get all the reviews for a movie with the specified id.

+ GET /movies/{movieId}/reviews?minRating=n - Get all the reviews for the movie with the specified ID with a rating greater than the minRating.

+ GET /movies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer.

+ PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review. (movie ID and reviewer username uniquely identify a review item).

+ GET /movies/{movieId}/reviews/{year} - Get the review(s) for the movie with the specified movie ID and were written in a specified year.

+ GET /movies/reviews/{reviewerName} - Get all the reviews written by a specific reviewer.

[Include screenshots from the AWS console (API Gateway service) that clearly show the deployed API ( have legible font size). ]

![](./images/apis.png)

![](./images/api2.png)

![](./images/api1.png)

### Authentication..

![](./images/userA.png)

### Independent learning (If relevant).

+ finding different query commands, and attributes to properly query DynamoDB
