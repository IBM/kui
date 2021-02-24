#!/usr/bin/env bash

#
# Copyright 2021 The Kubernetes Authors
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

rm -rf /tmp/kui-packs && mkdir /tmp/kui-packs

for i in plugins/*; do
    if [ -d $i ]; then
        echo "$(tput setaf 8)packing $(basename $i)$(tput sgr0)"
        (cd $i && npm pack > /dev/null 2>> /tmp/kui-packs.err && mv kui-shell*.tgz /tmp/kui-packs) &
    fi
done

for i in packages/*; do
    if [ -d $i ]; then
        echo "$(tput setaf 8)packing $(basename $i)$(tput sgr0)"
        (cd $i && npm pack > /dev/null 2>> /tmp/kui-packs.err && mv kui-shell*.tgz /tmp/kui-packs) &
    fi
done

wait
CODE=$?

if [ $CODE != 0 ]; then
    echo "Error generating packs. You will find the error logs in /tmp/kui-packs.err"
    if [ -n "$TRAVIS_JOB_ID" ]; then
        cat /tmp/kui-packs.err
    fi
fi

# here, we strip off the "-x.y.z" semver part of the generated
# filenames, so that we can have hard-wired package.json dependencies
# that are independent of version
# as to why we don't just use bash shell expansion, see https://github.com/IBM/kui/issues/2985
for i in /tmp/kui-packs/*.tgz; do
    mv $i $(node -e "console.log('$i'.replace(/-[\d]+\.[\d]+\.[\d]+/, '').replace(/-dev.[\d]+.[\d]+/,''))")
done

if [ -n "$TRAVIS_JOB_ID" ]; then
    echo "Generated these packs:"
    ls -l /tmp/kui-packs/
fi

echo "$(tput setaf 2)done:$(tput sgr0) packs generated in /tmp/kui-packs"

exit $CODE
