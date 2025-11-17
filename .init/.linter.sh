#!/bin/bash
cd /home/kavia/workspace/code-generation/academic-learning-platform-255274-255334/lms_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

