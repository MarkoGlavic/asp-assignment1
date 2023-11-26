import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  GetCommandInput,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewerName = parameters?.reviewerName;
    // const year = parameters?.year ? parseInt(parameters.year) : undefined;
    let yearFormat: RegExp = /^(19|20)\d{2}$/;
    let yearChecker = false

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    if (reviewerName && yearFormat.test(reviewerName)) {
      yearChecker = true
      const commandInput: QueryCommandInput = {
        TableName: "Reviews",
        KeyConditionExpression: "movieId = :m",
        FilterExpression: "begins_with (reviewDate, :year)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":year": reviewerName,
        },
      };


      const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

      const body = {
        data: commandOutput.Items,
      };

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      };
    } 
    
    else if (yearChecker===false) {
      const getItemInput: GetCommandInput = {
        TableName: "Reviews",
        Key: {
          movieId: movieId,
          reviewerName: reviewerName,
        },
      };

      const commandOutput = await ddbDocClient.send(new GetCommand(getItemInput));

      const body = {
        data: commandOutput.Item,
      };

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      };
    } else {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing reviewerName or year" }),
      };
    }
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
