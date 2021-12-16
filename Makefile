SHELL := /bin/bash

all: _site

clean:
	bundle exec jekyll clean
	rm -rf _site _projects/*/.git _projects/*/_specs _projects/*/_software _projects/*/assets _projects/*/_posts

_site:
	bundle exec jekyll build --trace

serve:
	bundle exec jekyll serve --trace

.PHONY: all clean serve
