<?php

mb_internal_encoding("UTF-8");
echo mb_internal_encoding();

/*
    Generate Random RNA Sequences with given length:
 * ##################################################
 * Nucleotides: G, U, A, and C
 * ##################################################
 */

function generateRandomRNA($size){
    $sequence = "" ;
    $nucleotides = ["G", "U", "A", "C"] ;
    for($i = 0 ; $i < $size ; $i++){
        $randomIndex = rand(0,3) ;
        $sequence .= $nucleotides[$randomIndex] ;
    }
    return $sequence ;
}

function generateRandomRNAs($size,$amount){
    $structures = [] ;
    for($i = 0 ; $i < $amount ; $i++){
        $structures[] = generateRandomRNA($size) ;
    }
    return $structures ;
}

function generateStructuresFile($size,$amount,$filename){
    $structures = generateRandomRNAs($size,$amount) ;
    $output = "" ;
    $i = 0 ;
    foreach($structures as $structure){
        $output .= ">seq" . $i++ . "\r" ;
        $output .= $structure . "\r" ;        
    }
    $structfile = fopen($filename.".fa", "w") or die("Unable to open file!");
    fwrite($structfile, $output);
    fclose($structfile);
}


generateStructuresFile(100,10,"structs100") ;
generateStructuresFile(200,10,"structs200") ;
generateStructuresFile(300,10,"structs300") ;
generateStructuresFile(500,10,"structs400") ;
generateStructuresFile(750,10,"structs750") ;
generateStructuresFile(1000,10,"structs1000") ;
generateStructuresFile(3000,10,"structs3000") ;
generateStructuresFile(5000,10,"structs5000") ;