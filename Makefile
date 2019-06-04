SHELL := /bin/bash

clean:
	rm -rf _projects/*/.git; \
	rm -rf _projects/*/_software/*/.git; \
	rm -rf _projects/*/_specs/*/.git; \
	git clean -xdf

.PHONY: clean
