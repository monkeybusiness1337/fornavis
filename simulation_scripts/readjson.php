<?php

$json = file_get_contents("./testjson.json") ;
$curresults = json_decode($json, TRUE) ;
var_dump($curresults) ;