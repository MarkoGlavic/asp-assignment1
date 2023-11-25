import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, QueryCommandInput, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters  = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const queryParams = event.queryStringParameters;
    const reviewerName = event?.queryStringParameters?.reviewerName;
    const body = event.body ? JSON.parse(event.body) : undefined;

    if (!movieId || !queryParams ) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    let commandInput: QueryCommandInput = {
        TableName: "Reviews",
      };

      if('reviewerName' in queryParams){
        commandInput = {
            ...commandInput,
            KeyConditionExpression: "movieId = :m and begins_with(reviewerName, :r) ",
            ExpressionAttributeValues: {
              ":m": movieId,
              ":r": queryParams.reviewerName,
            },
          };
      }


      const commandOutput = await ddbDocClient.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME,
          Item: body,
        })
      );



    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
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