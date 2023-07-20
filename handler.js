'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({  region: process.env.AWS_REGION})
const ddbDocClient = DynamoDBDocumentClient.from(client);

const notesTableName = process.env.NOTES_TABLE_NAME;

module.exports.createNote = async (event,context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const data = JSON.parse(event.body);
  try {
    const params = {
      TableName: notesTableName,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }
    await ddbDocClient.send(new PutCommand(params))
    return {
      statusCode: 201,
      body: JSON.stringify({
        message:'new note created',
        data
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
};

module.exports.updateNote = async (event) => {
  const notesId = event.pathParameters.id;
  const data = JSON.parse(event.body);
  try {
    const params = {
      TableName: notesTableName,
      Key: { notesId },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        "#title":"title",
        "#body":"body"
      },
      ExpressionAttributeValues: {
        ":title": data.title,
        ":body": data.body
      },
      ConditionExpression: 'attribute_exists(notesId)',
      ReturnValues: 'ALL_NEW'
    }
    const response = await ddbDocClient.send(new UpdateCommand(params))
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `note with id: ${notesId} updated!`,
        data: response
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
};
module.exports.deleteNote = async (event) => {
  const notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: notesTableName,
      Key : { notesId },
      ConditionExpression: 'attribute_exists(notesId)',
    }
    await ddbDocClient.send(new DeleteCommand(params))
    return {
      statusCode: 200,
      body: JSON.stringify("Item deleted Successfully")
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error.message)
    }
  }
};
module.exports.getAllNotes = async (event) => {
  // context information from authorizer
  console.log(event.requestContext.authorizer);
  try {
    let params = {
      TableName: notesTableName
    };
    const response = await ddbDocClient.send(new ScanCommand(params))
    return {
      statusCode: 200,
      body: JSON.stringify(response.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
};

