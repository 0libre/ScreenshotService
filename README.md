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
    urls: [String]
}
```
###### Response:
You'll receive a response from the service for all your URL:s with a token to use to request all your images. Included in the response for each url there will also be a individual token; `specificURLToken` for each image to be used to fetch just that specific image.

```javascript
{
    urls: [
        {
            url: String,
            specificURLToken: String
        }
    ],
    token: String
}
```
##### Retrive Screenshots

Do a `GET` request to your API-gateway url with the token for the screenshots you wish to retrive.

`https://yourapigatewayurl.com/${Token}`

###### Response:
```javascript
{
    urls: [
        {
            url: String,
            screenshotURL: String,
            status: String
        }
    ]
}
```
