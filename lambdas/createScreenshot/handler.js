const AWS = require('aws-sdk')
const AXIOS = require('axios')
const S3 = new AWS.S3()

const { TABLE, BUCKET } = process.env
const DOCUMENTCLIENT = new AWS.DynamoDB.DocumentClient()
const GOOGLE_PAGE_API_URI = 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?screenshot=true&url='

exports.handler = async ({Records}) => {
  const filteredResult = filterResult(Records)
  const result = await Promise.all(filteredResult.map(async item => {
    const url = item.dynamodb.NewImage.url.S
    const request = {
      url: `${GOOGLE_PAGE_API_URI}${url}`,
      method: 'GET'
    }
    const { data } = await AXIOS(request)
    const imageBuffer = new Buffer(data.screenshot.data, 'base64')
    const screenshotURL = `${item.eventID}.jpeg`
    await saveToS3(imageBuffer, screenshotURL)
    return {
      screenshotURL,
      PK: item.dynamodb.Keys.PK.S,
      SK: item.dynamodb.Keys.SK.S
    }
  }))

  const resultFromDYNAMODB = await saveItemsInDynamoDB(result)
  console.log(`### Result from Screenshot run: ${JSON.stringify(resultFromDYNAMODB)}`)

  return true
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 @Function
 @Params (Records, Array)
 @Description The purpose of this function is to filter the result
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const filterResult = (Records) => {
  return Records.filter(x => (x.eventName === 'INSERT' && x.dynamodb.NewImage.status.S === 'NEW'))
}
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 @Function
 @Params (payload, Object), (path, String)
 @Description The purpose of this function is to save the screenshot in S3
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const saveToS3 = (payload, path) => {
  const params = {
    Bucket: BUCKET,
    Key: path,
    ContentType: 'image/jpeg',
    Body: payload
  }
  return S3.upload(params).promise()
}
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 @Function
 @Params (items, Object)
 @Description The purpose of this function is to update the data in DynamoDB
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const saveItemsInDynamoDB = items => {
  return Promise.all(items.map(async item => {
    const {PK, SK, screenshotURL} = item
    console.log(`### Updating Item: ${{PK, SK}} in DynamoDB`)
    const params = {
      TableName: TABLE,
      Key: {PK, SK},
      UpdateExpression: 'SET #status = :status, screenshotURL = :screenshotURL',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':screenshotURL': screenshotURL,
        ':status': 'DONE'
      }
    }
    try {
      return DOCUMENTCLIENT.update(params).promise()
    } catch (error) {
      console.log('error', error)
      console.log(`### Updating Item: ${{PK, SK}} in DynamoDB failed`)
      item.errorCode = 300
      item.errorMessage = 'FAILED TO UPDATE ITEM IN SCREENSHOT SERVICE'
      return item
    }
  })
  )
}
