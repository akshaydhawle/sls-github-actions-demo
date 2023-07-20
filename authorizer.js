const { CognitoJwtVerifier } = require('aws-jwt-verify');

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: COGNITO_WEB_CLIENT_ID
})

const generatePolicy = (principalId, effect, resource) => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context: {
            name: "akshay"
        }
    };
};

module.exports.handler = async (event) => {
    // we have two modes request and token, token is default 
    const token = event.authorizationToken; // allow or deny
    console.log(token);

    try {
        const payload = await jwtVerifier.verify(token);
        console.log(JSON.stringify(payload));
        return generatePolicy('user', 'Allow', event.methodArn);
    } catch (error) {
        return "Invalid Token";
    }
}
