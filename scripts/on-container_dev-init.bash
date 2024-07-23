#!/bin/bash
case "$1" in
    "--no-build")
    ;;
    "--no-clean")
        /app/scripts/build --no-clean
    ;;
    *)
        /app/scripts/build
    ;;
esac

export DEV_MODE='true';
export NODE_OPTIONS='--inspect-brk=0.0.0.0:2129';

node . "$@"