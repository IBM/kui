#!/usr/bin/env bash

#
# Copyright 2017 The Kubernetes Authors
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
# This script builds two sets of artifacts:
#
#  1. the webpack bundles
#
#  2. at the tail end of this script, ./build-docker.sh is
#  invoked. That script builds a docker image that can be used to
#  serve up the webpack client. Try `npm start` when this script
#  finishes; this will start the docker container, allowing you to
#  debug your webpack client.
#
# Notes on build configuration: see /docs/dev/build-customization.md
#

set -e
set -o pipefail

#
# @param $1 staging directory
#
STAGING="${1-`pwd`}"
echo "staging directory: $STAGING"

CLIENT_HOME="$(pwd)"
SCRIPTDIR=$(cd $(dirname "$0") && pwd)
BUILDER_HOME="$CLIENT_HOME"/node_modules/@kui-shell/builder
BUILDDIR="$CLIENT_HOME"/dist/webpack

APPDIR="$STAGING"/node_modules/@kui-shell
CORE_HOME="$STAGING"/node_modules/@kui-shell/core
THEME="$CLIENT_HOME"/node_modules/@kui-shell/client

echo "build-webpack CLIENT_HOME=$CLIENT_HOME"
echo "build-webpack BUILDDIR=$BUILDDIR"
echo "build-webpack STAGING=$STAGING"
echo "build-webpack CORE_HOME=$CORE_HOME"
echo "build-webpack APPDIR=$APPDIR"

export MODE="${MODE-production}"
export CLIENT_HOME="$CLIENT_HOME"
export KUI_STAGE="$STAGING"
export KUI_BUILDDIR="$BUILDDIR"
export KUI_BUILDER_HOME="$BUILDER_HOME"

# build the webpack bundles
function webpack {
    pushd "$STAGING" > /dev/null
    rm -f "$BUILDDIR"/*.js*
    npx --no-install webpack-cli --config ./node_modules/@kui-shell/webpack/webpack.config.js --mode production
    popd > /dev/null
}

KUI_LINK="$CLIENT_HOME"/node_modules/@kui-shell/proxy/kui
if [ -L "$KUI_LINK" ]; then
    echo "removing kui link"
    rm -f "$KUI_LINK"
    RESTORE_KUI_LINK=true
fi

webpack

if [ -n "$RESTORE_KUI_LINK" ]; then
    echo "restoring kui link"
    git checkout packages/proxy/kui
fi
