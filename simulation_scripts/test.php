<?php

    $json = file_get_contents("./randomcombinations.json") ;
    $curresults = json_decode($json, TRUE) ;
    $frictionFrequency = [] ;
    echo "TOTAL: " . count($curresults["combinations"] ) . "<br/><br/>";
    foreach($curresults["combinations"] as $r){
        if(!isset($frictionFrequency["".$r[0]])){
            $frictionFrequency["".$r[0]] = 1 ;
        }else{
            $frictionFrequency["".$r[0]]++ ;
        }
    }
    $sum = 0 ;
    ksort($frictionFrequency) ;
    foreach($frictionFrequency as $k => $ff){
        echo $k .": " . $ff . "<br/>" ;
        $sum += $ff ;
    }
    echo $sum ;
