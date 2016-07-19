#!/bin/bash

if [ "$#" -ne 4 ]; then 
	echo "illegal number of parameters"
	echo "usage: startsimulation.sh parametercombinfile structuresfile simulationfilefolder outputfolder"
	exit
fi

parametercombinfile=$1
structuresfile=$2
simfilefolder=$3
outputfolder=$4

mkdir $simfilefolder

echo "Generating inputfiles for simulation..."

./generate.sh $structuresfile $simfilefolder $parametercombinfile

echo ""
echo "Starting simulation..."

mkdir $outputfolder
i=1
for filename in $simfilefolder/*.html; do
    echo "running simulation for: $filename" ;
    nodejs run-headless-chromium/run-headless-chromium.js $filename > "$outputfolder/$i.json" 
    i=$((i+1))
done

echo "Successfully done!"
