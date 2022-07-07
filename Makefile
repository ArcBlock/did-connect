TOP_DIR=.
README=$(TOP_DIR)/README.md

VERSION=$(strip $(shell cat version))

build:
	@echo "Building typescript packages..."
	@cd core/types && npm run build
	@cd relay/storage && npm run build
	@cd relay/storage-memory && npm run build
	@cd relay/storage-nedb && npm run build
	@cd relay/storage-mongo && npm run build
	@cd core/authenticator && npm run build
	@cd core/handler && npm run build
	@cd core/state && npm run build
	@cd relay/adapter-express && npm run build

init: install dep env
	@echo "Initializing the repo..."
	@cd core/proto && make dep
	@make build

github-init:
	@echo "Initialize software required for github (normally ubuntu software)"
	@sudo npm install --unsafe-perm -g @blocklet/cli grpc-tools @dropbox-web-platform/protobufjs-cli @dropbox-web-platform/protobufjs js2dts@0.3.3 jsdoc@3.6.6
	@make dep
	@cd core/proto && make init && make build
	@make build

install:
	@echo "Install software required for this repo..."
	@npm install -g lerna yarn @blocklet/cli grpc-tools protobufjs js2dts@0.3.3 jsdoc@3.6.6 --target_arch=x64

dep:
	@echo "Install dependencies required for this repo..."
	@lerna bootstrap

env:
	@echo "Init env for packages..."
	@echo "ES_ENDPOINT=\"http://127.0.0.1:9200\"" > indexdb/elasticsearch/.env.test

all: pre-build build post-build

test:
	@echo "Running test suites..."
	@npm run test

lint:
	@echo "Linting the software..."
	@npm run lint:fix

docs:
	@echo "Building and publishing the documenation..."
	@npm run docs
	@node scripts/collect-docs.js
	@cd docs && yarn && yarn build

precommit: dep lint build test

clean:
	@echo "Cleaning the build..."
	@rm -rf coverage
	@lerna exec --no-bail -- "rm -rf coverage"
	@lerna exec --no-bail -- "rm -rf .blocklet"

coverage:
	@echo "Running unit tests and collecting coverage..."
	@npm run coverage

codecov:
	@echo "Reporting coverage to codecov..."
	@npm run codecov

run:
	@echo "Running the software..."

include .makefiles/*.mk

.PHONY: build init travis-init install dep all test docs precommit travis clean watch run bump-version create-pr
