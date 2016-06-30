<?php

/* 
 * Metrics Abbreviations:
 * nc => nodecollisions
 * lc => linkcollisions
 * bld => backbonelink deviations
 * lr => loop roundness
 * */

function getHumanReadableLabel($abbreviation){
    $humanReadable = "" ;
    switch($abbreviation){
        case "nc": $humanReadable = "Nodecollisions" ;
            break ;
        case "lc": $humanReadable = "Linkcollisions" ;
            break ;
        case "bld": $humanReadable = "Backbonelinklength Deviations" ;
            break ;
        case "lr": $humanReadable = "Loop Roundness" ;
            break ;
    }
    return $humanReadable ;
}

function getKey($abbreviation){
    $key = "" ;
    switch($abbreviation){
        case "nc": $key = "avgNodeCollisions" ;
            break ;
        case "lc": $key = "avgLinkCollisions" ;
            break ;
        case "bld": $key = "avgLinkLengthDev" ;
            break ;
        case "lr": $key = "loopRoundness" ;
            break ;
    }
    return $key ;
}