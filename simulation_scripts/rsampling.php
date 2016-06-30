<?php
/*
    #################################################################################
    Random Sampling of Parameter Combinations for d3.js' Force Directed Graph Layout:
    #################################################################################
     Parameters: friction, charge, chargedistance
     Ranges: friction: [0.3,0.95] ; stepsize: 0.05 => 14 values
             charge: [-200,-30] ; stepsize: 10 => 18 values
             chargedistance: [30,150] ; stepsize: 10 => 13 values
     
     1) Cartesian Sampling:
     friction X charge X chargedistance => basic quantitative (3267 combinations)
     2) Random Sampling:
     Then we use random sampling for reduction of the dataset size. We want the
     dataset to be of size N, currently we use N = 1000.
    #################################################################################
*/

$N = 1000 ; //target sample size
$frictions = [0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95] ; //14
$charges = [-30,-40,-50,-60,-70,-80,-90,-100,-110,-120,-130,-140,-150,-160,-170,-180,-190,-200] ; //18
$chargedistances = [30,40,50,60,70,80,90,100,110,120,130,140,150] ; //13
$combinations = [] ; //helper arr
$i = 0 ; //helper index

/* taken from http://stackoverflow.com/questions/5612656/generating-unique-random-numbers-within-a-range-php */
function UniqueRandomNumbersWithinRange($min, $max, $quantity) {
    $numbers = range($min, $max);
    shuffle($numbers);
    return array_slice($numbers, 0, $quantity);
}

foreach($frictions as $friction){
    foreach($charges as $charge){
        foreach($chargedistances as $distance){
            $combinations[$i][0] = $friction ;
            $combinations[$i][1] = $charge ;
            $combinations[$i][2] = $distance ;
            $i++ ;
        }
    }
}
$randomIndexes = UniqueRandomNumbersWithinRange(0, count($combinations)-1, $N) ;
$randomSample = [] ;
foreach($randomIndexes as $index){
    $randomSample[] = $combinations[$index] ;
}
$result = [] ;
$result["combinations"] = $randomSample ;
echo json_encode($result) ;