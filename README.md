# Screenshot Service
A complete stack to receive URL:s to screenshot. The service will then make screenshots available using a generated token.

## Prerequisite
* To use this service it assumes that you have an `Amazon Web Services account`.
* You'll also have to provide the `.env` file with credentials to this account to allow the `aws cli` to to upload the service to your account.

### Deployment
Edit the resulting `.env.` file with your details and the run the following command to deploy the app to Amazon Web Service.
```shell
make deploy_fullstack
```
Make note of the API-gateway URL from the deployment or login to the `AWS console` and find the `Screenshot API` to retrive the URL for your newly created API-gateway.

### Usage
##### Create Screenshots
`POST` a message to your API-gateway url containing a list of URL:s you wish to Screenshot to your `API-gateway URL`.

```javascript
{
    urls: [
    "http://feber.se/",
    "http://aftonbladet.se"
  ]
}
```
###### Response:
You'll receive a response from the service for all your URL:s with a token to use to request all your images. Included in the response for each url there will also be a individual token; `specificURLToken` for each image to be used to fetch just that specific image.

```javascript
{
  "urls": [
    {
      "url": "http://feber.se/",
      "validated": true,
      "token": "126f858c-84dc-11e8-8694-a5ffce5d6228-0"
    },
    {
      "url": "http://aftonbladet.se",
      "validated": true,
      "token": "126f858c-84dc-11e8-8694-a5ffce5d6228-1"
    }
  ],
  "token": "126f858c-84dc-11e8-8694-a5ffce5d6228"
}
```
##### Retrive Screenshots

Do a `GET` request to your API-gateway url with the token for the screenshots you wish to retrive.

`https://yourapigatewayurl.com/126f858c-84dc-11e8-8694-a5ffce5d6228`

###### Response:
```javascript
{
  "urls": [
    {
      "url": "http://feber.se/",
      "screenshotURL": "https://s3-eu-west-1.amazonaws.com/your-service-name/f697697169abf10629a3b7f0802439ac.jpeg",
      "status": "DONE"
    },
    {
      "url": "http://aftonbladet.se",
      "screenshotURL": "https://s3-eu-west-1.amazonaws.com/your-service-name/0010b68dc304fd6143a9e70f4f8dffdb.jpeg",
      "status": "DONE"
    }
  ]
}
```
