import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const body = event.body ? JSON.parse(event.body) : undefined;
    const reviewerName = parameters?.reviewerName;

    if (!movieId || !body || !reviewerName) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing required parameters" }),
      };
    }

    const { reviewDate, content, rating } = body;

    const commandInput: UpdateCommandInput = {
      TableName: "Reviews",
      Key: {
        movieId: movieId,
        reviewerName: reviewerName,
      },
      UpdateExpression: "SET reviewDate = :rd, content = :c, rating = :r",
      ExpressionAttributeValues: {
        ":rd": reviewDate,
        ":c": content,
        ":r": rating,
      },
    };

    const commandOutput = await ddbDocClient.send(new UpdateCommand(commandInput));

    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ Message: "Review Updated!" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}