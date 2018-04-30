SOURCE := _jekyll/ *.yml

SHELL := /bin/bash

SERVE_PID_FILE = .jekyll-pid

.PHONY: all clean build watch serve live-serve prep prep-gems update  $(foreach gem,$(STYLE_GEMS),update-$(gem))

NODE_BIN_DIR := node_modules/.bin

VENDOR_STYLESHEET_PATH = _jekyll/_assets/stylesheets/vendor

STYLE_GEMS := bourbon neat

HOSTNAME := $(SITE_HOSTNAME)
REGION := $(SITE_REGION)

prep: prep-gems-style

prep-gems:
	bundle

prep-gems-style: prep-gems $(foreach gem,$(STYLE_GEMS),$(VENDOR_STYLESHEET_PATH)/$(gem))

update: $(foreach gem,$(STYLE_GEMS),update-$(gem))

define UPDATE_GEM_TASK
update-$(gem):
	bundle exec $(gem) update --path $(VENDOR_STYLESHEET_PATH)
endef

$(foreach gem,$(STYLE_GEMS),$(eval $(UPDATE_GEM_TASK)))

$(VENDOR_STYLESHEET_PATH)/%:
	bundle exec $(@F) install --path $(VENDOR_STYLESHEET_PATH)

clean:
	rm -rf .jekyll-cache .jekyll-metadata _site/*

build:
	bundle exec jekyll build

clean-build: clean build

$(NODE_BIN_DIR)/onchange:
	npm i

$(NODE_BIN_DIR)/live-server:
	npm i

$(NODE_BIN_DIR)/parallelshell:
	npm i

watch: $(NODE_BIN_DIR)/onchange
	$< $(SOURCE) -- make build

clean-watch: $(NODE_BIN_DIR)/onchange
	$< $(SOURCE) -- make clean-build

# serve: $(NODE_BIN_DIR)/live-server
# 	@echo TODO: --entry-file is TBI
# 	$< --entry-file=main.html --ignorePattern=".*.html|Makefile|Gemfile.*|package.*.json|node_modules/*" --wait=1000
#
# watchandserve: $(NODE_BIN_DIR)/parallelshell
# 	$< 'make watch' 'make serve'

stop-serve:
	@printf "\e[1mStopping server...\e[0m"
	@[[ ! -r "$(SERVE_PID_FILE)" ]] || { \
		PID=$$(cat "$(SERVE_PID_FILE)") ; \
		echo PID=$$PID ; \
		ps aux | grep $$PID | grep -v grep ; \
		if ps a | cut -d' ' -f1 | grep $${PID}; \
		then \
			kill -9 $${PID}; \
		fi ; \
		rm "$(SERVE_PID_FILE)" ; \
	}

serve:
	@# @printf "\e[1mServing...\e[0m"
	@# @(bundle exec jekyll serve) & \
	@# echo $$! > "$(SERVE_PID_FILE)" && \
	@# fg
	@printf "\e[1mServing...\e[0m"
	@(bundle exec jekyll serve) & \
	echo $$! > "$(SERVE_PID_FILE)"

live-serve: $(NODE_BIN_DIR)/onchange stop-serve serve
	$< $(SOURCE) -- make stop-serve serve

upload:
	S3_BUCKET=$$(aws s3api list-buckets --query "Buckets[?contains(Name, '$(HOSTNAME)')] | [0].Name" | jq -r '.'); \
	echo "[bucket] is \"$${S3_BUCKET}\""; \
	find _site -type f ! -iname 'index.html' -iname '*.html' -print0 | while read -d $$'\0' f; do \
	  echo "[move] $$f to $${f%.html}"; \
		mv "$$f" "$${f%.html}"; \
	done && \
	aws s3 sync _site/ s3://$${S3_BUCKET} --size-only --exclude "*" --include "*.*" --delete --region $(REGION) && \
	aws s3 sync _site/ s3://$${S3_BUCKET} --size-only --content-type "text/html; charset=utf-8" --exclude "*.*" --delete --region $(REGION)

clear-cf:
	CF_DISTRIBUTION=$$(aws cloudfront list-distributions --query "DistributionList.Items[].{DomainName: DomainName, OriginDomainName: Origins.Items[0].DomainName, DistributionID: Id}[?contains(OriginDomainName, '$(HOSTNAME)')] | [0].DistributionID" | jq -r '.'); \
	aws cloudfront create-invalidation --distribution-id $${CF_DISTRIBUTION} --paths /\*
