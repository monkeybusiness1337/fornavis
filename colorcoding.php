<?php


function getColorShade($density){
    //$colorShades = ["#ffffcc","#d9f0a3","#addd8e","#78c679", "#31a354", "#006837"] ;
    //$normalized = round(log($density)) > 5 ? 5 : round(log($density)) ;
    $colorShades = ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e", "#78c679", "#41ab5d", "#238443", "#005a32"] ;
    $normalized = round(log($density)) > 7 ? 7 : round(log($density)) ;
    return $colorShades[$normalized] ;
}

function getParetoColorShade($density){
//    $paretoColorShades = ["#f1eef6", "#d0d1e6", "#a6bddb", "#74a9cf", "#2b8cbe", "#045a8d"] ;
//    $normalized = round(log($density)) > 5 ? 5 : round(log($density)) ;
    $paretoColorShades = ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#034e7b"] ;
    $normalized = round(log($density)) > 7 ? 7 : round(log($density)) ;
    return $paretoColorShades[$normalized] ;
}

/* calculating the color ranges is simple math, the idea is to calculate it dynamically, but for
   now we are fine with statically coding them... the following lines explain how the ranges have been calculated */
/* log(x) = 0 => e^log(x) = e^0 => x = e^0 => x = 1 ; rounded 1*/
/* log(x) = 1 => e^log(x) = e^1 => x = e^1 => x = 2.7 ; rounded 3 */
/* log(x) = 2 => e^log(x) = e^2 => x = e^2 => x = 7.3 ; rounded 8 */
/* log(x) = 3 => e^log(x) = e^3 => x = e^3 => x = 20 ; rounded 20 */
/* log(x) = 4 => e^log(x) = e^4 => x = e^4 => x = 54.59 ; rounded 55 */
/* log(x) = 5 => e^log(x) = e^5 => x = e^4 => x = 148.41 ; rounded 148 */
/* => 1-2: #ffffcc ; 3-7: #d9f0a3 ; 8-19: #addd8e ; 20-54: #78c679 ; 55-147: #31a354 ; > 147: #006837 */
function getColorShadeRanges(){
    return ["1-2"=>["#ffffcc","#000"], "3-7"=>["#d9f0a3","#000"], "8-19"=>["#addd8e","#000"], "20-54"=>["#78c679","#000"], "55-147"=>["#31a354","#000"], "148-402"=>["#006837","#fff"], "> 402"=>["#005a32","#fff"]] ;
}

function getParetoColorShadeRanges(){
    return ["1-2"=>["#f1eef6", "#000"], "3-7"=>["#d0d1e6","#000"], "8-19"=>["#a6bddb","#000"], "20-54"=>["#74a9cf","#000"], "55-147"=>["#2b8cbe","#000"], "148-402"=>["#045a8d","#fff"], "> 402"=>["#034e7b","#fff"]] ;
}


/* here come the functions that do a colorblind safe density/color mapping */
function getColorBlindSaveColorShade($density){
    
}

function getColorBlindParetoColorShade($density){
    
}

function getColorBlindSaveColorShadeRanges(){
    
}

function getColorBlindSaveParetoColorShadeRanges(){
    
}