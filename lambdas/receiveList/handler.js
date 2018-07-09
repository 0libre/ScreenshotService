'use strict'
const AWS = require('aws-sdk')
const { TABLE } = process.env
const URLVALIDATOR = require('valid-url')
const DOCUMENTCLIENT = new AWS.DynamoDB.DocumentClient()

exports.handler = async ({urls = []}, {awsRequestId: token}) => {
  if (!urls.length) return {message: 'No URLS sent in', errorCode: 100}

  const formatedForStorage = {
    token,
    items: buildReturnObject(token, urls)
  }

  const result = {urls: await saveItemsInDynamoDB(formatedForStorage), token}

  return result
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 @Function
 @Params (token, String), (urls, Object)
 @Description The purpose of this function is to create the object to return to the client
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const buildReturnObject = (token, urls) => {
  return urls.map((url, index) => ({
    url,
    validated: !!URLVALIDATOR.isWebUri(url),
    token: `${token}-${index}`
  }))
}
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 @Function
 @Params (token, String), (items, Object)
 @Description The purpose of this function is to save the data in DynamoDB
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const saveItemsInDynamoDB = ({token, items}) => {
  return Promise.all([
    ...items.map(async item => {
      console.log(`### Storing Item: ${JSON.stringify(item)} in DynamoDB`)
      const params = {
        TableName: TABLE,
        Item: {
          PK: token,
          SK: item.token.split('-').pop(),
          url: item.url,
          status: item.validated ? 'NEW' : 'INVALID_URL'
        },
        ConditionExpression: 'attribute_not_exists(PK) and attribute_not_exists(SK)'
      }
      try {
        await DOCUMENTCLIENT.put(params).promise()
        return item
      } catch (e) {
        console.log(`### Storing Item: ${JSON.stringify(item)} in DynamoDB FAILED`)
        item.errorCode = 200
        item.errorMessage = 'FAILED TO SAVE ITEM IN SCREENSHOT SERVICE'
        return item
      }
    })
  ])
}
