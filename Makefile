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
	@cd ux/react && npm run build

bundle:
	@echo "Bundling blocklets..."
	@cd relay/server && npm run bundle
	@cd ux/react && npm run bundle

init: install dep env
	@echo "Initializing the repo..."
	@make build

github-init:
	@echo "Initialize software required for github (normally ubuntu software)"
	@sudo npm install --unsafe-perm -g @blocklet/cli typescript
	@make dep
	@make build

install:
	@echo "Install software required for this repo..."
	@npm install -g lerna yarn @blocklet/cli typescript

dep:
	@echo "Install dependencies required for this repo..."
	@lerna bootstrap

all: pre-build build post-build

test:
	@echo "Running test suites..."
	@npm run test

lint:
	@echo "Linting the software..."
	@npm run lint

docs:
	@echo "Building and publishing the documenation..."
	@npm run docs
	@node scripts/collect-docs.js
	@cd docs && yarn && yarn build

precommit: dep lint build test

clean:
	@echo "Cleaning the build..."
	@rm -rf coverage
	@lerna exec --no-bail -- "rm -rf coverage .blocklet"

coverage:
	@echo "Running unit tests and collecting coverage..."
	@npm run coverage

run:
	@echo "Running the software..."

include .makefiles/*.mk

.PHONY: build init travis-init install dep all test docs precommit travis clean watch run bump-version create-pr
