#!/usr/bin/env bash
# Clean bin/obj folders from the api project

find . -type d \( -name bin -o -name obj \) -exec rm -rf {} +
