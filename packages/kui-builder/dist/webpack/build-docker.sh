#!/usr/bin/env bash

#
# Copyright 2019 IBM Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

#
# This script assumes ./build.sh has already been called (that script
# builds the webpack bundles; this script builds the docker image)
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOPDIR="${SCRIPTDIR}/../../../../"

# the webpack and other build assets will be stored here
TARGET=build
if [ ! -d "$TARGET" ]; then
    mkdir "$TARGET"
fi

# create the self-signed certificate
npm run http-allocate-cert

# some of the assets are in sibling directories; let's copy them here
# to our TARGET directory:
cp "$TOPDIR"/packages/app/build/index-webpack.html "$TARGET"/index.html
cp -r "$TOPDIR"/packages/app/content/css/ "$TARGET" # !!! intentional trailing slash: css/
cp -r "$TOPDIR"/packages/app/content/icons "$TARGET" # !!! intentional NO trailing slash: icons
cp -r "$TOPDIR"/packages/app/content/images "$TARGET" # !!! intentional NO trailing slash: images

# finally, build the docker image
docker build . -t kui-webpack
