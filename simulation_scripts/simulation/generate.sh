#!/bin/bash

i=0
j=1
fileTemplate=$(cat template.html)
#echo "$fileTemplate"

while IFS='' read -r line || [[ -n "$line" ]]; do
    if [ `echo "$i % 2" | bc` -eq 0 ] ; then
	echo "generating simfile for structure: "
	sed -e "s/--inpseq--/$line/g" template.html > tmp.html
	echo "DRITTER PARAM: $3"
	sed -i -e "s/--paramcombinfile--/$3/g" tmp.html
    else
	sed -e "s/--inpstruct--/$line/g" tmp.html > "$2/$j.html"
	rm tmp.html
	j=$((j+1))
    fi
    echo "$line"
    i=$((i+1))
done < "$1"

echo "Finished input file generation for simulation..."
