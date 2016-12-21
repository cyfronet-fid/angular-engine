#!/bin/bash
# simple script generating all documentation versions
export PATH=node_modules/.bin:$PATH

npm install

first_documented_version='v0.6.12'
newest_version=1
stop_documenting=0

npm install
for git_tag in `git tag --sort=-v:refname`
do
    if [ $stop_documenting -eq 0 ]; then
        if [ $git_tag == $first_documented_version ]; then
            stop_documenting=1
        fi;

        if [ $newest_version -eq 1 ]; then
            grunt clean
            mkdir build

            git_version=${git_tag:1}
            sed  "s/@@__ENGINE_VERSION__/$git_version/g" docs/build/index.tpl.html > build/index.html
            sed  "s/@@__ENGINE_VERSION__/$git_version/g" docs/build/.htaccess > build/.htaccess
            newest_version=0
        fi;
        git checkout angular-engine.js
        git checkout $git_tag
        if [ $? -ne 0 ]; then
            echo "Could not change branch, exiting."
            exit 1;
        fi;
        brunch build
    else
        break;
    fi;
done

# revert to master
git checkout angular-engine.js
git checkout master