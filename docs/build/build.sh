#!/bin/bash
# simple script generating all documentation versions
export PATH=node_modules/.bin:$PATH

npm install

first_documented_version='v0.6.12'
start_documenting=0

npm install

for git_tag in `git tag --sort=v:refname`
do
    if [ $start_documenting -eq 0 ]; then
        if [ $git_tag != $first_documented_version ];
        then
            continue;
        else
        	grunt clean
            start_documenting=1;
    	fi;
    fi;
    git checkout angular-engine.js
	git checkout $git_tag
	if [ $? -ne 0 ]; then
        echo "Could not change branch, exiting."
        exit 1;
	fi;
	brunch build
done

# revert to master
git checkout angular-engine.js
git checkout master