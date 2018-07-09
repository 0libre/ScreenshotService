ENVIRONMENT ?= dev
STACK_NAME  ?= oliver-screenshot-service
AWS_REGION  ?= eu-west-1

DEPLOY_BUCKET_STACK_NAME:=$(STACK_NAME)-deploy
DEPLOY_BUCKET_NAME:=$(DEPLOY_BUCKET_STACK_NAME)-$(ENVIRONMENT)

SCREENSHOT_BUCKET_STACK_NAME:=$(STACK_NAME)-screenshots
SCREENSHOT_BUCKET_NAME:=$(SCREENSHOT_BUCKET_STACK_NAME)-$(ENVIRONMENT)

SERVERLESS_STACK_NAME:=$(STACK_NAME)-serverless
DYNAMODB_STACK_NAME:=$(STACK_NAME)-dynamodb

include .env
export AWS_ACCESS_KEY_ID = $(ACCESS_KEY_ID)
export AWS_SECRET_ACCESS_KEY = $(SECRET_ACCESS_KEY)

.PHONY: deploy_fullstack
deploy_fullstack:
	make deploy_bucket
	make deploy_screenshot_bucket
	make deploy_dynamodb
	make deploy_serverless

#########################################################
##################### DEPLOY BUCKET #####################
#########################################################

.PHONY: deploy_bucket
deploy_bucket:
	@echo "\n----- AWS deploy bucket start -----\n"
	date
	aws cloudformation deploy \
	--template-file cloudformation/Bucket.yaml \
	--stack-name $(DEPLOY_BUCKET_STACK_NAME) \
	--capabilities CAPABILITY_NAMED_IAM \
	--region $(AWS_REGION) \
	--parameter-overrides  \
	BucketName=$(DEPLOY_BUCKET_NAME) \
	Environment=$(ENVIRONMENT)
	date
	@echo "\n----- AWS deploy bucket done -----\n"

#########################################################
############### DEPLOY SCREENSHOT BUCKET ################
#########################################################

.PHONY: deploy_screenshot_bucket
deploy_screenshot_bucket:
	@echo "\n----- AWS screenshot bucket start -----\n"
	date
	aws cloudformation deploy \
	--template-file cloudformation/ScreenshotBucket.yaml \
	--stack-name $(SCREENSHOT_BUCKET_STACK_NAME) \
	--capabilities CAPABILITY_NAMED_IAM \
	--region $(AWS_REGION) \
	--parameter-overrides  \
	BucketName=$(SCREENSHOT_BUCKET_NAME) \
	Environment=$(ENVIRONMENT)
	date
	@echo "\n----- AWS deploy bucket done -----\n"

#########################################################
##################### PACKAGE LAMBDA ####################
#########################################################

.PHONY: deploy_serverless
deploy_serverless:
	@echo "\n----- Deploy serverless start -----\n"
	@echo "\n-----Package Lambda Backend function------\n"
	mkdir -p tmp
	yarn && yarn recursive
	aws cloudformation package \
	--template-file cloudformation/Serverless.yaml \
	--output-template-file tmp/Serverless-template.yaml \
	--s3-bucket $(DEPLOY_BUCKET_NAME)
	@echo "\n----Package Lambda Backend function Done ----\n"
	@echo "\n----- Deploy serverless start -----\n"
	aws s3 cp cloudformation/Swagger.yaml s3://$(DEPLOY_BUCKET_NAME)/swagger/Swagger.yaml
	aws cloudformation deploy \
	--template-file tmp/Serverless-template.yaml \
	--stack-name $(STACK_NAME) \
	--region $(AWS_REGION) \
	--capabilities CAPABILITY_NAMED_IAM \
	--parameter-overrides \
	Environment=$(ENVIRONMENT) \
	ScreenShotBucket=$(SCREENSHOT_BUCKET_NAME) \
	Service=$(STACK_NAME)
	@echo "\n------DEPLOY DONE------\n"
	@echo "\n----- API url START -----\n"
	$(eval API_ID := $(shell AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY} aws apigateway get-rest-apis --query 'items[?name==`$(STACK_NAME)`].id' --output text))
	@echo https://${API_ID}.execute-api.$(AWS_REGION).amazonaws.com/dev/
	@echo "\n----- API url END -----\n"

#############
# DEPLOY DYNAMODB
#############
.PHONY: deploy_dynamodb
deploy_dynamodb:
	@echo "\n----- Deploying DynamoDB START -----\n"
	aws cloudformation deploy \
	--template-file cloudformation/DynamoDB.yaml \
	--stack-name $(DYNAMODB_STACK_NAME) \
	--capabilities CAPABILITY_NAMED_IAM \
	--region $(AWS_REGION) \
	--parameter-overrides \
	Service=$(STACK_NAME) \
  ENVIRONMENT=$(ENVIRONMENT)
	@echo "\n----- Deploying DynamoDB DONE -----\n"
