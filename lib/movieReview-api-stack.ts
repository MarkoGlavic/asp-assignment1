import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movieReviews} from "../seed/movieReviews";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { AuthApi } from './auth-api'

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Auth
    const userPool = new UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const userPoolId = userPool.userPoolId;

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true },
    });

    const userPoolClientId = appClient.userPoolClientId;





    // Tables 
    const moviesReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewDate", type: dynamodb.AttributeType.STRING }, //cant have multiple reviews for same movie otherwise
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews",
    });


    const getMovieReviewsFn = new lambdanode.NodejsFunction(
      this,
      "getMovieReviewsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambda/functionality/movieReviewsByID.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesReviewsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const newMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambda/functionality/addReviewToMovie.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });
    
    const getMovieReviewByUserFn = new lambdanode.NodejsFunction(this, "getMovieReview", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambda/functionality/movieReviewsByUser.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });


    moviesReviewsTable.grantReadData(getMovieReviewsFn)
    moviesReviewsTable.grantReadWriteData(newMovieReviewFn)
    moviesReviewsTable.grantReadData(getMovieReviewByUserFn)

        new custom.AwsCustomResource(this, "moviesddbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem",
            parameters: {
              RequestItems: {
                [moviesReviewsTable.tableName]: generateBatch(movieReviews),
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("movieReviewsddbInitData"), //.of(Date.now().toString()),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [moviesReviewsTable.tableArn], 
          }),
        });

        const api = new apig.RestApi(this, "RestAPI", {
          description: "demo api",
          deployOptions: {
            stageName: "dev",
          },
          // 👇 enable CORS
          defaultCorsPreflightOptions: {
            allowHeaders: ["Content-Type", "X-Amz-Date"],
            allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
            allowCredentials: true,
            allowOrigins: ["*"],
          },
        });

        const moviesEndpoint = api.root.addResource("movies");
   
        const movieEndpoint = moviesEndpoint.addResource("{movieId}");
  
        const movieReviewsEndpoint = movieEndpoint.addResource("reviews");
        movieReviewsEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewsFn, {proxy: true})
        )
        const addReviewEndpoint = moviesEndpoint.addResource("reviews")
        addReviewEndpoint.addMethod(
          "POST",
          new apig.LambdaIntegration(newMovieReviewFn, { proxy: true })
        );  

        const movieReviewByUserEndpoint = movieReviewsEndpoint.addResource("{reviewerName}");
        movieReviewByUserEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewByUserFn,{proxy: true})
        )

        new AuthApi(this, 'AuthServiceApi', {
			userPoolId: userPoolId,
			userPoolClientId: userPoolClientId,
		});

      }

     

      
      

      
    }
    