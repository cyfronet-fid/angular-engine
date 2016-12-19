#!/bin/bash

# simple script generating all documentation versions

first_documented_version='v0.6.11'
start_documenting=0

for git_tag in `git tag --sort=v:refname`
do
    if [ $start_documenting -eq 0 ]; then
        if [ $git_tag != $first_documented_version ];
        then
            continue;
        else
            start_documenting=1;
    	fi;
    fi;
	git checkout $git_tag
	grunt clean
	brunch build
done