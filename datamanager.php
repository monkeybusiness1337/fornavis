<?php

/**
 * DataManager
 * 
 * The job of this class is to read all the simulation files from the hard disk
 * and to extract the needed information of them and transforms them into arrays
 * that can be read by the google charts framework. the data arrays are encoded
 * in json for the reason that google charts are running in javascript. 
 * 
 * this class is only called by the datarequesthandler script. the idea was to
 * implement a singleton pattern here, to make sure just one instance of this 
 * class is generated and to also keep track of it. unfortunately the singleton 
 * patter can't be implmented properly in php and is also considered as anti pattern
 * here, so the next verion discard that implementation style. 
 * 
 * there are still the old method names in here, but there is a detailed
 * description in the datarequesthandler.php file. the method names will be replaced
 * in the next version. 
 * 
 * the only dependency of this class is colorcoding.php for density color coding
 * of the points in the sctter plots. 
 * 
 * 
 * 
 *  */

    require_once('colorcoding.php') ;

    /* helper function to derive the standard deviation of a given array. that function would be included
     * in the statistics bundle of php, that needs to be added extra to the php core, so i decided  
     * to insert the code for the standard deviation here, because we don't need the whole math bundle
     * to be integrated.
     * code taken from http://php.net/manual/de/function.stats-standard-deviation.php */
    
    // Function to calculate square of value - mean
    function sd_square($x, $mean) { return pow($x - $mean,2); }
    // Function to calculate standard deviation (uses sd_square)    
    function sd($array) {
        // square root of sum of squares devided by N-1
        return sqrt(array_sum(array_map("sd_square", $array, array_fill(0,count($array), (array_sum($array) / count($array)) ) ) ) / (count($array)-1) );
    }

    class DataManager{
        /* private attributes holding the most important data pieces */
        private $results ;
        private $structuresRead ;
        private $simulationNumber ;
        private $structuresByNumber ;
        private $inputParameterRanges ;
        private $scatterPointCollisionsDataNodes ;
        private $scatterPointCollisionsDataLinks ;
        private $structureSizes ;
        private $paretoChache ;
        private $structures ;
        private $inputCombinData ;
        private $structuresCounts ;
        
        /* holding one instance of it self to be returned. this is actually for 
         * the sake of the front controller pattern, that means that line will be
         * discarded soon  */
        protected static $_instance = null;
        
        /* construct initializes all that class attributes from above with the 
         * values of the simulation dataset */
        protected function __construct(){
            /* turn off memory limit (bad practice. better adjust in php.ini) */
            ini_set('memory_limit', '-1');
            /* turn off execution time limit (bad practice. better adjust in php.ini) */
            ini_set('max_execution_time', '-1');
            /* establish the connection to the memcached server 
             * please make sure to adpt the port to the one your memcached server
             * is listening on. */
            $memcache = memcache_connect('localhost', 11211);

            $dir = new DirectoryIterator("./simulationdata/current/");
            $this->results = [] ;
            $this->structuresByNumber = [] ;
            $this->structuresRead = 0 ;
            $this->scatterPointCollisionsDataNodes = [] ;
            $this->scatterPointCollisionsDataLinks = [] ;
            $this->structureSizes = [] ;
            $this->paretoChache = [] ;

            /* now here comes the actual initialization process, where we iterate
               over the simulation files aqnd grab the contents. */

            $json = file_get_contents("./simulationdata/current/simulationinfo.json") ;
            $decoded = json_decode($json, TRUE) ;
            $this->inputCombinData = $decoded["combinations"] ;

            foreach ($dir as $fileinfo) {
                if (!$fileinfo->isDot() && $fileinfo->getFilename() !== "simulationinfo.json") {
                    $json = file_get_contents("./simulationdata/current/" . $fileinfo->getFilename()) ;
                    $curresults = json_decode($json, TRUE) ;
                    $this->simulationNumber = 0 ;
                    if($curresults != null){
                        $i = 0 ;
                        $curkey = "" ;
                        foreach($curresults as $curresult){
                            if($i++ === 0){                                    
                                $curkey = "". strlen($curresult["options"]["sequence"]) ;
                                if(!isset($this->structures[$curkey])){
                                    $this->structures[$curkey] = [] ;
                                    $this->structuresCounts[$curkey] = 0 ;
                                }
                                $this->structuresCounts[$curkey]++ ;
                                $curStruct = $curresult["options"]["sequence"] . "," . $curresult["options"]["structure"] ;
                                if(!in_array($curStruct, $this->structures[$curkey])){
                                    $this->structures[$curkey][] = $curStruct ;
                                }
                            }else{
                                if(!isset($this->results[$curkey])) $this->results[$curkey] = [] ;
                                $this->results[$curkey][] = $curresult ;
                                $this->simulationNumber++ ;
                            }
                        }
                        $this->structuresRead++ ;
                    }
                }
            }      
            $this->inputParameterRanges = $this->calculateInputParameterRanges() ;
        }
        
        /* constructs new object or returns the current instance if one is available, 
         * this is an important part of the froncontroller pattern what we are going to
         * discard in the next version */
        public static function getInstance(){
            if (null === self::$_instance){
                self::$_instance = new self;
            }
            return self::$_instance;
        }
        
        protected function __clone() {}
        
        /* encode structureCounts to json, for the datarequesthandler */
        public function getStructuresCounts(){
            return json_encode($this->structuresCounts) ;
        }

        /* encode structureSizes to json, for the datarequesthandler */
        public function getStructureSizes(){
            return json_encode($this->structureSizes) ;
        }
        
        /* calculates the pareto view, the name is misleading, and will be changed in the next version.
         * this method takes a couple of input parameters which are there for filtering. the parameter names should
         * talk for themselves*/
        public function calculateParetoFront($structSize, $frictionLower, $frictionUpper, $chargeLower, $chargeUpper, $chargeDistanceLower, $chargeDistanceUpper, $nodeCollisionsUpper, $linkCollisionsUpper, $selectedMetric1, $selectedMetric2){
            $clusteredData = "" ;
            $resultsSizeAndCombination = [] ;
            foreach($this->results as $resultKey => $result){
                foreach($result as $res){
                    if((float)$res["inputParameters"][0] >= (float)$frictionLower && (float)$res["inputParameters"][0] <= (float)$frictionUpper &&
                       (int)$res["inputParameters"][1] >= (int)$chargeLower && (int)$res["inputParameters"][1] <= (int)$chargeUpper &&
                       (int)$res["inputParameters"][2] >= (int)$chargeDistanceLower && (int)$res["inputParameters"][2] <= (int)$chargeDistanceUpper){
                            $curkey = $res["inputParameters"][0] . "#" . $res["inputParameters"][1] . "#" . $res["inputParameters"][2] ;
                            if(!isset($resultsSizeAndCombination[$resultKey])) $resultsSizeAndCombination[$resultKey] = [] ;
                                if(!isset($resultsSizeAndCombination[$resultKey][$curkey])) $resultsSizeAndCombination[$resultKey][$curkey] = [] ;
                                $resultsSizeAndCombination[$resultKey][$curkey][] = $res ;
                            }
                    }
            }

            $collisionsBySize = [] ;

            foreach($resultsSizeAndCombination as $resultKey => $results){
                foreach($results as $curKey => $curRes){
                    if(!isset($collisionsBySize[$resultKey][$curKey])) $collisionsBySize[$resultKey][$curKey] = [] ;
                    $nodeCollisions = 0 ;
                    $linkCollisions = 0 ;
                    $linkLengthDeviations = 0 ;
                    $loopRoundness = 0 ;
                    $avgLinks = 0 ;
                    $avgNodes = 0 ;
                    foreach($curRes as $key => $res){
                        $nodeCollisions += ($res["nodeCollisions"]/2) ;
                        $linkCollisions += $res["backboneLinkCollisions"] + $res["basepairLinkCollisions"] ;
                        $linkLengthDeviations += round($res["backboneLinkStdev"],2) ;
                        $loopRoundness += round(sd($res["loopDeviations"]),2) ;
                        $avgLinks += $res["linkNumber"] ;
                        $avgNodes += $res["nodeNumber"] ;
                    }
                    $collisionsBySize[$resultKey][$curKey]["avgNodeCollisions"] = $nodeCollisions / count($curRes) ;
                    $collisionsBySize[$resultKey][$curKey]["avgLinkCollisions"] = $linkCollisions / count($curRes) ;
                    $collisionsBySize[$resultKey][$curKey]["avgLinkLengthDev"] = round($linkLengthDeviations / count($curRes),2) ;
                    $collisionsBySize[$resultKey][$curKey]["loopRoundness"] = round($loopRoundness / count($curRes),2) ;
                    $collisionsBySize[$resultKey][$curKey]["avgNodes"] = $avgNodes / count($curRes) ;
                    $collisionsBySize[$resultKey][$curKey]["avgLinks"] = $avgLinks / count($curRes) ;
                }
            }

            $nodecollisions = [] ;
            $linkcollisions = [] ;
            $pareto = [] ;
            $test = $collisionsBySize[(int)$structSize] ;
            
            $selectedMetricKey1 = getKey($selectedMetric1) ;
            $selectedMetricKey2 = getKey($selectedMetric2) ;
            $selectedMetricLabel1 = getHumanReadableLabel($selectedMetric1) ;
            $selectedMetricLabel2 = getHumanReadableLabel($selectedMetric2) ;
            
            foreach($test as $k => $t){
                $nodecollisions[$k] = $t[$selectedMetricKey1] ;
                $linkcollisions[$k] = $t[$selectedMetricKey2] ;
                
                $pareto[$k] = true ;
            }
            foreach($nodecollisions as $nk => $n){
                foreach($nodecollisions as $nk2 => $n){
                    if( ($nodecollisions[$nk] > $nodecollisions[$nk2] && $linkcollisions[$nk] > $linkcollisions[$nk2])){
                        $pareto[$nk] = false ;
                    }
                }
            }
            
            $pointsToRecheck = [] ;
            $clusteredByNc = [] ;
            $clusteredByLc = [] ;
            foreach($pareto as $k => $p){
                if($p){
                    $pointsToRecheck[] = $k ;
                    $clusteredByNc["".$nodecollisions[$k]][] = ["key" => $k,"lc" =>$linkcollisions[$k]] ;
                    $clusteredByLc["".$linkcollisions[$k]][] = ["key" => $k,"nc" =>$nodecollisions[$k]] ;
                }
            }

            $mins = [] ;
            foreach($clusteredByNc as $k => $p){
                if(count($p) > 1){
                    $ncs = array_column($p, 'lc');
                    $minArr = $p[array_search(min($ncs), $ncs)];
                    //echo "<pre>" . var_dump($minArr) . "</pre>" ;
                    $mins[$k] = $minArr ;
                }
            }
            foreach($mins as $minsKey => $min){
                foreach($clusteredByNc[$minsKey] as $k => $p){
                    if($p["lc"] != $min["lc"]){
                        $pareto[$p["key"]] = false ;
                    }
                }
            } 
            
            $mins = [] ;
            foreach($clusteredByLc as $k => $p){
                if(count($p) > 1){
                    $ncs = array_column($p, 'nc');
                    $minArr = $p[array_search(min($ncs), $ncs)];
                    $mins[$k] = $minArr ;
                }
            }
            foreach($mins as $minsKey => $min){
                foreach($clusteredByLc[$minsKey] as $k => $p){
                    if($p["nc"] != $min["nc"]){
                        $pareto[$p["key"]] = false ;
                    }
                }
            } 
           
            $dataString = "" ;
            $cluster = [] ;

            foreach($nodecollisions as $nk => $n){
                if(!$pareto[$nk]){
                    $explo = explode("#", $nk) ;
                    $friction = $explo[0] ;
                    $charge = $explo[1] ;
                    $chargeDistance = $explo[2] ;
                    $scatterPointKey = $nodecollisions[$nk] . "_" . $linkcollisions[$nk] ;

                    if((float)$friction >= (float)$frictionLower && (int)$friction <= (float)$frictionUpper &&
                       (int)$charge >= (int)$chargeLower && (int)$charge <= (int)$chargeUpper &&
                       (int)$chargeDistance >= (int)$chargeDistanceLower && (int)$chargeDistance <= (int)$chargeDistanceUpper &&
                       (float)$nodecollisions[$nk] <= (float)$nodeCollisionsUpper && (float)$linkcollisions[$nk] <= (float)$linkCollisionsUpper){

                        $pointKey = $friction . "_" . $charge . "_" . $chargeDistance ;
                        if(!isset($cluster[$scatterPointKey])){
                            $cluster[$scatterPointKey] = [] ;
                        }
                        if(!isset($cluster[$scatterPointKey][$pointKey])){
                            $cluster[$scatterPointKey][$pointKey] = [] ;
                        }
                        $cur = array("friction" => $friction, "charge" => $charge, "chargeDistance" => $chargeDistance) ;
                        $cluster[$scatterPointKey][$pointKey][] = $cur ;
                    }
                }
            }
            
            $min = 0 ;
            $max = 0 ;
            $i = 0 ;
            foreach($cluster as $clusterKey => $clusterPoint){
                $curv = 0 ;
                foreach($clusterPoint as $clusterPointKey => $clusterPointSingleCombination){
                    $curv += count($clusterPointSingleCombination) ;
                }
                if($i++ == 0){
                    $min = $max = $curv ;
                }
                if($curv < $min){
                    $min = $curv ;
                } else if($curv > $max){
                    $max = $curv ;
                }
            }           

            foreach($cluster as $clusterKey => $clusterPoint){
                $clusteredPointsFlat = "" ;
                foreach($clusterPoint as $clusterPointKey => $clusterPointSingleCombination){
                    foreach($clusterPointSingleCombination as $combinationKey => $combination){
                        $clusteredPointsFlat .= $combination["friction"] . "," . $combination["charge"] . "," . $combination["chargeDistance"] . ";" ;
                    }
                }
                $clusteredPointsFlat = substr($clusteredPointsFlat, 0, -1) ;
                $clusteredPointNumber = count(explode(";", $clusteredPointsFlat)) ;
                $col = getColorShade($clusteredPointNumber) ;
                
                $extractedValues = explode("_", $clusterKey) ;
                $tooltip = '"<div style=\"display: none\" class=\"resValues\">'
                        .$clusteredPointsFlat
                        .'</div><div style=\"padding: 5px\">' 
                        .'<b>Combinations:</b> '.count(explode(";", $clusteredPointsFlat)) . '<br/>'
                        .'<b>'.$selectedMetricLabel1.': </b>'.$extractedValues[0].'<br/>'
                        .'<b>'.$selectedMetricLabel2.': </b>'.$extractedValues[1].'<br/>'
                        .'<button class=\"btn btn-primary btn-sm showClusteredCombinations ' . $clusterPointKey . '\" style=\"width:100%; margin-top: 5px\" onclick=\"heatmapReadyHandler(\''.$clusteredPointsFlat.'\')\">Test Combinations</button>'
                        .'</div>"' ;

                $clusteredData .= '[' .  $extractedValues[0] . ',' . $extractedValues[1] . ',' . $tooltip .', "point{opacity:0.4; fill-color: '.$col.'; stroke-color: darkgray}", null, null, null],' ;
            }

            asort($nodecollisions) ;
            asort($linkcollisions) ;

            $clusterPareto = [] ;

            foreach($nodecollisions as $nk => $n){
                if($pareto[$nk] ){
                    $explo = explode("#", $nk) ;
                    $friction = $explo[0] ;
                    $charge = $explo[1] ;
                    $chargeDistance = $explo[2] ;
                    $scatterPointKey = $nodecollisions[$nk] . "_" . $linkcollisions[$nk] ;
                    if((float)$friction >= (float)$frictionLower && (int)$friction <= (float)$frictionUpper &&
                       (int)$charge >= (int)$chargeLower && (int)$charge <= (int)$chargeUpper &&
                       (int)$chargeDistance >= (int)$chargeDistanceLower && (int)$chargeDistance <= (int)$chargeDistanceUpper &&
                       (float)$nodecollisions[$nk] <= (float)$nodeCollisionsUpper && (float)$linkcollisions[$nk] <= (float)$linkCollisionsUpper){

                        $pointKey = $friction . "_" . $charge . "_" . $chargeDistance ;
                        if(!isset($clusterPareto[$scatterPointKey])){
                            $clusterPareto[$scatterPointKey] = [] ;
                        }
                        if(!isset($clusterPareto[$scatterPointKey][$pointKey])){
                            $clusterPareto[$scatterPointKey][$pointKey] = [] ;
                        }
                        $cur = array("friction" => $friction, "charge" => $charge, "chargeDistance" => $chargeDistance) ;
                        $clusterPareto[$scatterPointKey][$pointKey][] = $cur ;
                    }
                }
            }
            foreach($clusterPareto as $clusterKey => $clusterPoint){
                $clusteredPointsFlat = "" ;
                foreach($clusterPoint as $clusterPointKey => $clusterPointSingleCombination){
                    foreach($clusterPointSingleCombination as $combinationKey => $combination){
                        $clusteredPointsFlat .= $combination["friction"] . "," . $combination["charge"] . "," . $combination["chargeDistance"] . ";" ;
                    }
                }
                $clusteredPointsFlat = substr($clusteredPointsFlat, 0, -1) ;
                $clusteredPointNumber = count(explode(";", $clusteredPointsFlat)) ;
                $color = getParetoColorShade($clusteredPointNumber) ;
                $extractedValues = explode("_", $clusterKey) ;
                $tooltip = '"<div style=\"display: none\" class=\"resValues\">'
                        .$clusteredPointsFlat
                        .'</div><div style=\"padding: 5px\">' 
                        .'<b>Combinations:</b> '.count(explode(";", $clusteredPointsFlat)) . '<br/>'
                        .'<b>'.$selectedMetricLabel1.': </b>'.$extractedValues[0].'<br/>'
                        .'<b>'.$selectedMetricLabel2.': </b>'.$extractedValues[1].'<br/>'
                        .'<b style=\"color: #5cb85c\">pareto optimal</b><br/>'
                        .'<button class=\"btn btn-primary btn-sm showClusteredCombinations ' . $clusterPointKey . '\" style=\"width:100%; margin-top: 5px\" onclick=\"heatmapReadyHandler(\''.$clusteredPointsFlat.'\')\">Test Combinations</button>'
                        .'</div>"' ;

                $clusteredData .= '[' .  $extractedValues[0] . ', null, null, null, ' . $extractedValues[1] . ',' . $tooltip .', "point{opacity:1; fill-color: '.$color.'; stroke-color: darkgray}"],' ;
            }           
            
            return '{"type": "'.$selectedMetric1."_".$selectedMetric2.'", "values": [' . substr($clusteredData, 0, -1) . ']}' ;
        }
        
        /* encode the input parameter ranges to json for the datarequestmanager. 
         * it is probably better to use json_encode. this will be implemented in the next version */
        public function getInputParameterRanges(){
            return '{"values": {"cdmin": ' . $this->inputParameterRanges["cdmin"] . ', "cdmax": ' . $this->inputParameterRanges["cdmax"] . ', "cmin": ' . $this->inputParameterRanges["cmin"] .
                    ', "cmax": ' . $this->inputParameterRanges["cmax"] . ', "fmin": ' . $this->inputParameterRanges["fmin"] . ', "fmax": ' . $this->inputParameterRanges["fmax"] . 
                    ', "smin": ' . $this->inputParameterRanges["smin"] . ', "smax": ' . $this->inputParameterRanges["smax"] . 
                    ', "ncmin": ' . $this->inputParameterRanges["ncmin"] . ', "ncmax": ' . $this->inputParameterRanges["ncmax"] .
                    ', "lcmin": ' . $this->inputParameterRanges["lcmin"] . ', "lcmax": ' . $this->inputParameterRanges["lcmax"] .
                    '} }' ;
        }
        
        /* method that caluclates the input parameter ranges from the result array that
         * has been initialized in the constructor */
        public function calculateInputParameterRanges(){
            $frictionMin = 0 ;
            $frictionMax = 0 ;
            $chargeMin = 0 ;
            $chargeMax = 0 ;
            $chargeDistanceMin = 0 ;
            $chargeDistanceMax = 0 ;
            $first = true ;
            
            foreach($this->results as $result){
                foreach($result as $res){
                    if($first){
                        $frictionMin = $frictionMax = (float) $res["inputParameters"][0] ;
                        $chargeMin = $chargeMax = (float) $res["inputParameters"][1] ;
                        $chargeDistanceMin = (float) $chargeDistanceMax = $res["inputParameters"][2] ;
                        $first = false ;
                    }else{
                        if((float) $res["inputParameters"][0] < $frictionMin)
                            $frictionMin = (float) $res["inputParameters"][0] ;
                        else if((float) $res["inputParameters"][0] > $frictionMax)
                            $frictionMax = (float) $res["inputParameters"][0] ;
                        
                        if((float) $res["inputParameters"][1] < $chargeMin)
                            $chargeMin = (float) $res["inputParameters"][1] ;
                        else if((int) $res["inputParameters"][1] > $chargeMax)
                            $chargeMax = (float) $res["inputParameters"][1] ;
                        
                        if((float) $res["inputParameters"][2] < $chargeDistanceMin)
                            $chargeDistanceMin = (float) $res["inputParameters"][2] ;
                        else if((float) $res["inputParameters"][2] > $chargeDistanceMax)
                            $chargeDistanceMax = (float) $res["inputParameters"][2] ;
                    }
                }
            }
            
            $resultsSizeAndCombination = [] ;
            foreach($this->results as $resultKey => $result){
                foreach($result as $res){
                    $curkey = $res["inputParameters"][0] . "#" . $res["inputParameters"][1] . "#" . $res["inputParameters"][2] ;
                    if(!isset($resultsSizeAndCombination[$resultKey])) $resultsSizeAndCombination[$resultKey] = [] ;
                        if(!isset($resultsSizeAndCombination[$resultKey][$curkey])) $resultsSizeAndCombination[$resultKey][$curkey] = [] ;
                        $resultsSizeAndCombination[$resultKey][$curkey][] = $res ;
                }
            }
            
            $collisionsBySize = [] ;
            
            foreach($resultsSizeAndCombination as $resultKey => $results){
                // mistake here ???
                //if(!isset($collisionsBySize[$resultKey])) $resultsSizeAndCombination[$resultKey] = [] ;
                if(!isset($collisionsBySize[$resultKey])) $collisionsBySize[$resultKey] = [] ;
                foreach($results as $curKey => $curRes){
                    if(!isset($collisionsBySize[$resultKey][$curKey])) $collisionsBySize[$resultKey][$curKey] = [] ;
                    $nodeCollisions = 0 ;
                    $linkCollisions = 0 ;
                    $avgLinks = 0 ; 
                    $avgNodes = 0 ;
                    foreach($curRes as $key => $res){
                        $nodeCollisions += ($res["nodeCollisions"]/2) ;
                        $linkCollisions += $res["backboneLinkCollisions"] + $res["basepairLinkCollisions"] ;
                        $avgLinks += $res["linkNumber"] ;
                        $avgNodes += $res["nodeNumber"] ;
                    }
                    $collisionsBySize[$resultKey][$curKey]["avgNodeCollisions"] = $nodeCollisions / count($curRes) ;
                    $collisionsBySize[$resultKey][$curKey]["avgLinkCollisions"] = $linkCollisions / count($curRes) ;
                    $collisionsBySize[$resultKey][$curKey]["avgNodes"] = $avgNodes / count($curRes) ;
                    $collisionsBySize[$resultKey][$curKey]["avgLinks"] = $avgLinks / count($curRes) ;
                }
            }
            
            $ncmin = 0 ;
            $ncmax = 0 ;
            $lcmin = 0 ;
            $lcmax = 0 ;
            $first = true ;
            foreach($collisionsBySize as $cbs){
                foreach($cbs as $c){
                    if($first){
                        $ncmin = $ncmax = $c["avgNodeCollisions"] ;
                        $lcmin = $lcmax = $c["avgLinkCollisions"] ;
                        $first = false ;
                    }
                    
                    if($c["avgNodeCollisions"] < $ncmin){
                        $ncmin = $c["avgNodeCollisions"] ;
                    } else if($c["avgNodeCollisions"] > $ncmax){
                        $ncmax = $c["avgNodeCollisions"] ;
                    }
                    
                    if($c["avgLinkCollisions"] < $lcmin){
                        $lcmin = $c["avgLinkCollisions"] ;
                    } else if($c["avgLinkCollisions"] > $lcmax){
                        $lcmax = $c["avgLinkCollisions"] ;
                    }
                }
            }
            
            $ret = [] ;
            $ret["cmin"] = $chargeMin ;
            $ret["cmax"] = $chargeMax ;
            $ret["cdmin"] = $chargeDistanceMin ;
            $ret["cdmax"] = $chargeDistanceMax ;
            $ret["fmin"] = $frictionMin ;
            $ret["fmax"] = $frictionMax ;
            $structSizes = array_keys($this->results) ;
            $ret["smin"] = $structSizes[0] ;
            $ret["smax"] = $structSizes[count($structSizes)-1] ;
            $ret["lcmin"] = $lcmin ;
            $ret["lcmax"] = $lcmax ;
            $ret["ncmin"] = $ncmin ;
            $ret["ncmax"] = $ncmax ;
            $this->structureSizes = $structSizes ;
            
            return $ret ;
        }
       
        
        /* encode the rna secondary structures of the current dataset to json */
        public function getUniqueStructures(){
            return json_encode($this->structures) ;
        }        
        
        /* that method name is misleading and will be changed in the next version. this
         * method actually generates the data for the scatter plots where structuresize is on
         * the horizontal axis and the chosen metic is on the vertical one. to indicate which 
         * metric we are interested in we use the $collisionType parameter. that is in fact 
         * missleading but a relict from on of the older prototypes. this will also be replaced
         * in the next version. the $jitter parameter is a boolean, and specifies wheter the
         * datapoints are jittered in a specifc range on the horizontal axis. the other attributes
         * are used for filtering purpose. for a more detailed documentation please refer to the 
         * comments in the head section of the datarequesthandler.php script */
        public function getHeatmapDataJitteredAndOverlapAttribute($frictionLower, $frictionUpper, $chargeLower, $chargeUpper, $chargeDistanceLower, $chargeDistanceUpper, $collisionType, $structSizeLower, $structSizeUpper, $nodeCollisionsUpper, $linkCollisionsUpper, $jitter){
            $heatmapData = "" ;
            $j = 0 ;
            $wholeArray = [] ;
            $cluster = [] ;
            $metricTypeLabel = "" ;
            
            foreach($this->results as $resultkey => $result){
                $subArray = [] ;
                foreach($result as $res){
                    $structSize = $realStructSize = (int) $resultkey ;
                    if((float)$res["inputParameters"][0] >= (float)$frictionLower && (float)$res["inputParameters"][0] <= (float)$frictionUpper &&
                       (int)$res["inputParameters"][1] >= (int)$chargeLower && (int)$res["inputParameters"][1] <= (int)$chargeUpper &&
                       (int)$res["inputParameters"][2] >= (int)$chargeDistanceLower && (int)$res["inputParameters"][2] <= (int)$chargeDistanceUpper &&
                       (int)$structSize >= (int)$structSizeLower && (int)$structSize <= (int)$structSizeUpper){
                            if($collisionType == "nc"){
                                $metricTypeLabel = getHumanReadableLabel($collisionType) ;
                                $clusterKey = $realStructSize . "_" . ($res["nodeCollisions"]/2) ;
                                $pointKey = $res["inputParameters"][0] . "_" . $res["inputParameters"][1] . "_" . $res["inputParameters"][2] ;
                                if(!isset($cluster[$clusterKey])){
                                    $cluster[$clusterKey] = [] ;
                                }
                                if(!isset($cluster[$clusterKey][$pointKey])){
                                    $cluster[$clusterKey][$pointKey] = [] ;
                                }
                                $cur = array("friction" => $res["inputParameters"][0], "charge" => $res["inputParameters"][1], "chargeDistance" => $res["inputParameters"][2]) ;
                                $cluster[$clusterKey][$pointKey][] = $cur ;
                                //$tooltip = '"<div style=\"display: none\" class=\"resValues\">'.$res["inputParameters"][0].','.$res["inputParameters"][1].','.$res["inputParameters"][2].'</div><div style=\"padding: 20px\"><b>Parametercombination: </b><br/>Friction: ' . $res["inputParameters"][0] . " <br/>Charge: " . $res["inputParameters"][1] . " <br/>Chargedistance: "  . $res["inputParameters"][2] . "<br/><br/><b>Nodecollisions: </b>" . $res["nodeCollisions"]  . '<br/><br/><a href=\"paramtest.php?page=test&friction=' .$res["inputParameters"][0] . '&cdistance=' . $res["inputParameters"][2] . '&charge=' . $res["inputParameters"][1] . '&sequence='.$res["options"]["sequence"].'&structure='.$res["options"]["structure"].'\" class=\"btn btn-primary\" style=\"width:100%\">Test</a></div>"' ;
                                //$heatmapData .= '[' .  $structSize . ',' . $res["nodeCollisions"] . ',"' . 'Friction: ' . $res["inputParameters"][0] . ', Charge: ' . $res["inputParameters"][1] . ', Chargedistance: ' . $res["inputParameters"][2] . '"' . ', ""],' ;
                                //$heatmapData .= '[' .  $structSize . ',' . $res["nodeCollisions"] . ',' . $tooltip . ', ""],' ;
                            } else if($collisionType == "bld"){
                                $metricTypeLabel = getHumanReadableLabel($collisionType) ;
                                $clusterKey = $realStructSize . "_" . round($res["backboneLinkStdev"],2) ;
                                $pointKey = $res["inputParameters"][0] . "_" . $res["inputParameters"][1] . "_" . $res["inputParameters"][2] ;
                                if(!isset($cluster[$clusterKey])){
                                    $cluster[$clusterKey] = [] ;
                                }
                                if(!isset($cluster[$clusterKey][$pointKey])){
                                    $cluster[$clusterKey][$pointKey] = [] ;
                                }
                                $cur = array("friction" => $res["inputParameters"][0], "charge" => $res["inputParameters"][1], "chargeDistance" => $res["inputParameters"][2]) ;
                                $cluster[$clusterKey][$pointKey][] = $cur ;
                            } else if($collisionType == "lr"){
                                $metricTypeLabel = getHumanReadableLabel($collisionType) ;
                                $clusterKey = $realStructSize . "_" . round(sd($res["loopDeviations"]),2) ;
                                $pointKey = $res["inputParameters"][0] . "_" . $res["inputParameters"][1] . "_" . $res["inputParameters"][2] ;
                                if(!isset($cluster[$clusterKey])){
                                    $cluster[$clusterKey] = [] ;
                                }
                                if(!isset($cluster[$clusterKey][$pointKey])){
                                    $cluster[$clusterKey][$pointKey] = [] ;
                                }
                                $cur = array("friction" => $res["inputParameters"][0], "charge" => $res["inputParameters"][1], "chargeDistance" => $res["inputParameters"][2]) ;
                                $cluster[$clusterKey][$pointKey][] = $cur ;
                            }else if($collisionType == "lc"){
                                $metricTypeLabel = getHumanReadableLabel($collisionType) ;
                                $clusterKey = $realStructSize . "_" .($res["backboneLinkCollisions"] + $res["basepairLinkCollisions"]) ;
                                $pointKey = $res["inputParameters"][0] . "_" . $res["inputParameters"][1] . "_" . $res["inputParameters"][2] ;
                                if(!isset($cluster[$clusterKey])){
                                    $cluster[$clusterKey] = [] ;
                                }
                                if(!isset($cluster[$clusterKey][$pointKey])){
                                    $cluster[$clusterKey][$pointKey] = [] ;
                                }
                                $cur = array("friction" => $res["inputParameters"][0], "charge" => $res["inputParameters"][1], "chargeDistance" => $res["inputParameters"][2]) ;
                                $cluster[$clusterKey][$pointKey][] = $cur ;
                            }
                   }
                }
            }
            
            $min = 0 ;
            $max = 0 ;
            $i = 0 ;
            foreach($cluster as $clusterKey => $clusterPoint){
                $curv = 0 ;
                foreach($clusterPoint as $clusterPointKey => $clusterPointSingleCombination){
                    $curv += count($clusterPointSingleCombination) ;
                }
                if($i++ == 0){
                    $min = $max = $curv ;
                }
                if($curv < $min){
                    $min = $curv ;
                } else if($curv > $max){
                    $max = $curv ;
                }
            }            
            
            $clusteredData = "" ;
            foreach($cluster as $clusterKey => $clusterPoint){
                $clusteredPointsFlat = "" ;
                foreach($clusterPoint as $clusterPointKey => $clusterPointSingleCombination){
                    foreach($clusterPointSingleCombination as $combinationKey => $combination){
                        $clusteredPointsFlat .= $combination["friction"] . "," . $combination["charge"] . "," . $combination["chargeDistance"] . ";" ;
                    }
                }
                $clusteredPointsFlat = substr($clusteredPointsFlat, 0, -1) ;
                $clusteredPointNumber = count(explode(";", $clusteredPointsFlat)) ;
                $splittedValues = explode("_", $clusterKey) ;
                $extractedStructSize = $splittedValues[0] ;
                $extractedCol = $splittedValues[1] ;
                
                $tooltip = '"<div style=\"display: none\" class=\"resValues\">'
                        .$clusteredPointsFlat
                        .'</div><div style=\"padding:5px;\">' 
                        .'<b>Simulation Results:</b> '.$clusteredPointNumber. '<br/>'
                        .'<b>Combinations:</b> '.count(array_unique(explode(";",$clusteredPointsFlat))). '<br/>'
                        .'<b>'.$metricTypeLabel.': </b>'.$extractedCol
                        .'<button class=\"btn btn-primary btn-sm showClusteredCombinations ' . $clusterPointKey . '\" style=\"width:123px; margin-top: 5px\" onclick=\"heatmapReadyHandler(\''.$clusteredPointsFlat.'\')\">Test Combinations</button>'
                        .'</div>"' ;
                
                if($jitter === "true"){
                    $randomJitter = mt_rand (0,20) ;
                    $sign = mt_rand(0,1) == 0 ? true : false ;
                    if($sign) $extractedStructSize = (int) $extractedStructSize + $randomJitter ;
                    else $extractedStructSize = (int) $extractedStructSize - $randomJitter ;
                }
                
                if(($collisionType == "lc" && (float)$extractedCol <= (float)$linkCollisionsUpper) || ($collisionType == "nc" && (float)$extractedCol <= (float)$nodeCollisionsUpper)  || 
                        ($collisionType == "bld" && (float)$extractedCol <= (float)$nodeCollisionsUpper) || ($collisionType == "lr" && (float)$extractedCol <= (float)$nodeCollisionsUpper)){
                    $colorShade = getColorShade($clusteredPointNumber) ;
                    $clusteredData .= '[' .  $extractedStructSize . ',' . $extractedCol . ',' . $tooltip .', "point{opacity: 0.5; size: 5; fill-color: ' . $colorShade . '; stroke-color: darkgray; stroke-width: 1}"],' ;
                }
            }
                        
            return '{"type": "'. $collisionType . '", "values": [' . substr($clusteredData, 0, -1) . ']}' ;
        }
        
        /* function that caluclates the frequency distribution of distinc friction values
         * and returns it in json format */
        public function getFrictionHistogramData(){
            $dataAsString = "" ;
            $frictionFrequency = [] ;
            foreach ($this->inputCombinData as $r) {
                if (!isset($frictionFrequency["" . $r[0]])) {
                    $frictionFrequency["" . $r[0]] = 1;
                } else {
                    $frictionFrequency["" . $r[0]] ++;
                }
            }
            ksort($frictionFrequency);
            foreach($frictionFrequency as $k => $r){
                $dataAsString .= "[" . $k . "," . $r . ', ""],' ;
            }
            return '{"values": [' . substr($dataAsString, 0, -1) . ']}' ;
        }
        
        /* function that caluclates the frequency distribution of distinc charge values
         * and returns it in json format */
        public function getChargeHistogramData(){
            $dataAsString = "" ;
            $chargeFrequency = [] ;
            foreach ($this->inputCombinData as $r) {
                if (!isset($chargeFrequency["" . $r[1]])) {
                    $chargeFrequency["" . $r[1]] = 1;
                } else {
                    $chargeFrequency["" . $r[1]] ++;
                }
            }
            ksort($chargeFrequency);
            foreach($chargeFrequency as $k => $r){
                $dataAsString .= "[" . $k . "," . $r . ', ""],' ;
            }
            return '{"values": [' . substr($dataAsString, 0, -1) . ']}' ;
        }
        
        /* function that caluclates the frequency distribution of distinc chargedistance values
         * and returns it in json format */
        public function getChargeDistanceHistogramData(){
            $dataAsString = "" ;
            $chargeDistanceFrequency = [] ;
            foreach ($this->inputCombinData as $r) {
                if (!isset($chargeDistanceFrequency["" . $r[2]])) {
                    $chargeDistanceFrequency["" . $r[2]] = 1;
                } else {
                    $chargeDistanceFrequency["" . $r[2]] ++;
                }
            }
            ksort($chargeDistanceFrequency);
            foreach($chargeDistanceFrequency as $k => $r){
                $dataAsString .= "[" . $k . "," . $r . ', ""],' ;
            }
            return '{"values": [' . substr($dataAsString, 0, -1) . ']}' ;
        }
        
        /* calculates relative global friction trends, for all metrics. the method name
         * is a relict from older prototype versions and will be adjusted in the next version         */
        public function getCollisionsGroupedByFriction(){
            $nodeCollisionsGroupedByFriction = [] ;
            foreach($this->results as $resultkey => $result){
                foreach($result as $res){
                    $key = "" . $res["inputParameters"][0] ;
                    if(!isset($nodeCollisionsGroupedByFriction[$key])) $nodeCollisionsGroupedByFriction[$key] = [] ;
                    $nodeCollisionsGroupedByFriction[$key]["nodeCollisions"][] = ($res["nodeCollisions"]/2) / (int) $resultkey * 100 ;
                    $nodeCollisionsGroupedByFriction[$key]["linkCollisions"][] = ($res["backboneLinkCollisions"] + $res["basepairLinkCollisions"]) / (int) $resultkey * 100 ;
                    $nodeCollisionsGroupedByFriction[$key]["loopRoundness"][] = sd($res["loopDeviations"]) ;
                    $nodeCollisionsGroupedByFriction[$key]["bblDeviations"][] = $res["backboneLinkStdev"] ;
                }
            }
            ksort($nodeCollisionsGroupedByFriction) ;
            return $nodeCollisionsGroupedByFriction ;
        }
        
        /* calculates relative global charge trends, for all metrics. the method name
         * is a relict from older prototype versions and will be adjusted in the next version         */
        public function getCollisionsGroupedByCharge(){
            $nodeCollisionsGroupedByCharge = [] ;
            foreach($this->results as $resultkey => $result){
                foreach($result as $res){
                    $key = "" . $res["inputParameters"][1] ;
                    if(!isset($nodeCollisionsGroupedByCharge[$key])) $nodeCollisionsGroupedByCharge[$key] = [] ;
                    $nodeCollisionsGroupedByCharge[$key]["nodeCollisions"][] = ($res["nodeCollisions"]/2) / (int) $resultkey * 100;
                    $nodeCollisionsGroupedByCharge[$key]["linkCollisions"][] = ($res["backboneLinkCollisions"] + $res["basepairLinkCollisions"]) / (int) $resultkey * 100 ;
                    $nodeCollisionsGroupedByCharge[$key]["loopRoundness"][] = sd($res["loopDeviations"]) ;
                    $nodeCollisionsGroupedByCharge[$key]["bblDeviations"][] = $res["backboneLinkStdev"] ;
                }
            }
            ksort($nodeCollisionsGroupedByCharge) ;
            return $nodeCollisionsGroupedByCharge ;
        }
        /* calculates relative global charge distance trends, for all metrics. the method name
         * is a relict from older prototype versions and will be adjusted in the next version         */
        public function getCollisionsGroupedByChargeDistance(){
            $nodeCollisionsGroupedByChargeDistance = [] ;
            foreach($this->results as $resultkey => $result){
                foreach($result as $res){
                    $key = "" . $res["inputParameters"][2] ;
                    if(!isset($nodeCollisionsGroupedByChargeDistance[$key])) $nodeCollisionsGroupedByChargeDistance[$key] = [] ;
                    $nodeCollisionsGroupedByChargeDistance[$key]["nodeCollisions"][] = ($res["nodeCollisions"]/2) / (int) $resultkey * 100 ;
                    $nodeCollisionsGroupedByChargeDistance[$key]["linkCollisions"][] = ($res["backboneLinkCollisions"] + $res["basepairLinkCollisions"]) / (int) $resultkey * 100 ;
                    $nodeCollisionsGroupedByChargeDistance[$key]["loopRoundness"][] = sd($res["loopDeviations"]) ;
                    $nodeCollisionsGroupedByChargeDistance[$key]["bblDeviations"][] = $res["backboneLinkStdev"] ;
                }
            }
            ksort($nodeCollisionsGroupedByChargeDistance) ;
            return $nodeCollisionsGroupedByChargeDistance ;
        }
        
        /* returns input parameter scatters for friction and charge in json format */
        public function getFrictionChargeScatterData(){
            $dataAsString = "" ;
            $temp = [] ;
            foreach($this->inputCombinData as $r){
                $temp[] = $r[0].",".$r[1] ;
            }
            $temp = array_unique($temp) ;
            
            foreach ($temp as $r) {
                $dataAsString .= "[" . $r . ',""],' ; 
            }
            
            return '{"values": [' . substr($dataAsString, 0, -1) . ']}' ;
        }
        
        /* returns input parameter scatters for friction and chargedistance in json format */
        public function getFrictionChargeDistanceScatterData(){
            $dataAsString = "" ;
            $temp = [] ;
            foreach($this->inputCombinData as $r){
                $temp[] = $r[2].",".$r[0] ;
            }
            $temp = array_unique($temp) ;
            
            foreach ($temp as $r) {
                $dataAsString .= "[" . $r . ',""],' ; 
            }
            
            return '{"values": [' . substr($dataAsString, 0, -1) . ']}' ;
        }
        
        /* returns input parameter scatters for charge and chargedistance in json format */
        public function getChargeChargeDistanceScatterData(){
            $dataAsString = "" ;
            $temp = [] ;
            foreach($this->inputCombinData as $r){
                $temp[] = $r[1].",".$r[2] ;
            }
            $temp = array_unique($temp) ;
            
            foreach ($temp as $r) {
                $dataAsString .= "[" . $r . ',""],' ; 
            }
            return '{"values": [' . substr($dataAsString, 0, -1) . ']}' ;
        }
        
        /* method that calculates the relative global chargedistance trends for the
         * passed metrics and encodes them in json to be returned to the
         * datarequesthandler */
        public function getCollisionsGroupedByChargeDistanceData($mType1, $mType2){
            $nodeColGroupedByFrictionData = "" ;
            $avgColFric = [];
            foreach($this->getCollisionsGroupedByChargeDistance() as $key => $res){
                foreach($res["nodeCollisions"] as $r){
                    if(!isset($avgColFric[$key])){ 
                        $avgColFric[$key] = [] ;
                        $avgColFric[$key]["nodeCollisions"] = 0 ;
                        $avgColFric[$key]["linkCollisions"] = 0 ;
                        $avgColFric[$key]["bbld"] = 0 ;
                        $avgColFric[$key]["lr"] = 0 ;
                    }
                    $avgColFric[$key]["nodeCollisions"] += $r ;
                }
                $avgColFric[$key]["nodeCollisions"] /= count($res["nodeCollisions"]) ;
                
                foreach($res["linkCollisions"] as $r){
                    $avgColFric[$key]["linkCollisions"] += $r ;
                }
                $avgColFric[$key]["linkCollisions"] /= count($res["linkCollisions"]) ;
                
                foreach($res["bblDeviations"] as $r){
                    $avgColFric[$key]["bbld"] += $r ;
                }
                $avgColFric[$key]["bbld"] /= count($res["bblDeviations"]) ;
                
                foreach($res["loopRoundness"] as $r){
                    $avgColFric[$key]["lr"] += $r ;
                }
                $avgColFric[$key]["lr"] /= count($res["loopRoundness"]) ;
                
            }
            $i = 0 ;
            foreach($avgColFric as $key => $res){
                $selKey1 = "" ;
                $selKey2 = "" ;
                if($mType1 === "nc"){
                    $selKey1 = "nodeCollisions" ;
                } else if($mType1 === "lc"){
                    $selKey1 = "linkCollisions" ;
                } else if($mType1 === "bld"){
                    $selKey1 = "bbld" ;
                } else if($mType1 === "lr"){
                    $selKey1 = "lr" ;
                }
                
                if($mType2 === "nc"){
                    $selKey2 = "nodeCollisions" ;
                } else if($mType2 === "lc"){
                    $selKey2 = "linkCollisions" ;
                } else if($mType2 === "bld"){
                    $selKey2 = "bbld" ;
                } else if($mType2 === "lr"){
                    $selKey2 = "lr" ;
                }
                
                $nodeColGroupedByFrictionData .= "[" . $key . "," . $res[$selKey1] . ', "",' . $res[$selKey2] . ',""]' ;
                
                if($i++ < count($avgColFric)-1)
                    $nodeColGroupedByFrictionData .= "," ;
            }
            return '{"values": [' . $nodeColGroupedByFrictionData . ']}' ;
        }
        
        /* method that calculates the relative global charge trends for the
         * passed metrics and encodes them in json to be returned to the
         * datarequesthandler */
        public function getCollisionsGroupedByChargeData($mType1, $mType2){
            $nodeColGroupedByFrictionData = "" ;
            $avgColFric = [];
            foreach($this->getCollisionsGroupedByCharge() as $key => $res){
              
                foreach($res["nodeCollisions"] as $r){
                    if(!isset($avgColFric[$key])){
                        $avgColFric[$key] = [] ;
                        $avgColFric[$key]["nodeCollisions"] = 0 ;
                        $avgColFric[$key]["linkCollisions"] = 0 ;
                        $avgColFric[$key]["bbld"] = 0 ;
                        $avgColFric[$key]["lr"] = 0 ;
                    }
                    $avgColFric[$key]["nodeCollisions"] += $r ;
                }
                $avgColFric[$key]["nodeCollisions"] /= count($res["nodeCollisions"]) ;
                
                foreach($res["linkCollisions"] as $r){
                    $avgColFric[$key]["linkCollisions"] += $r ;
                }
                $avgColFric[$key]["linkCollisions"] /= count($res["linkCollisions"]) ;
                
                foreach($res["bblDeviations"] as $r){
                    $avgColFric[$key]["bbld"] += $r ;
                }
                $avgColFric[$key]["bbld"] /= count($res["bblDeviations"]) ;
                
                foreach($res["loopRoundness"] as $r){
                    $avgColFric[$key]["lr"] += $r ;
                }
                $avgColFric[$key]["lr"] /= count($res["loopRoundness"]) ;
                
            }
            $i = 0 ;
            foreach($avgColFric as $key => $res){
                $selKey1 = "" ;
                $selKey2 = "" ;
                if($mType1 === "nc"){
                    $selKey1 = "nodeCollisions" ;
                } else if($mType1 === "lc"){
                    $selKey1 = "linkCollisions" ;
                } else if($mType1 === "bld"){
                    $selKey1 = "bbld" ;
                } else if($mType1 === "lr"){
                    $selKey1 = "lr" ;
                }
                
                if($mType2 === "nc"){
                    $selKey2 = "nodeCollisions" ;
                } else if($mType2 === "lc"){
                    $selKey2 = "linkCollisions" ;
                } else if($mType2 === "bld"){
                    $selKey2 = "bbld" ;
                } else if($mType2 === "lr"){
                    $selKey2 = "lr" ;
                }
                
                $nodeColGroupedByFrictionData .= "[" . $key . "," . $res[$selKey1] . ', "",' . $res[$selKey2] . ',""]' ;

                if($i++ < count($avgColFric)-1)
                    $nodeColGroupedByFrictionData .= "," ;
            }
            return '{"values": [' . $nodeColGroupedByFrictionData . ']}' ;
        }
        
        /* method that calculates the relative global friction trends for the
         * passed metrics and encodes them in json to be returned to the
         * datarequesthandler */
        public function getCollisionsGroupedByFrictionData($mType1, $mType2){
            $nodeColGroupedByFrictionData = "" ;
            $avgColFric = [];
            foreach($this->getCollisionsGroupedByFriction() as $key => $res){
                foreach($res["nodeCollisions"] as $r){
                    if(!isset($avgColFric[$key])){
                        $avgColFric[$key] = [] ;
                        $avgColFric[$key]["nodeCollisions"] = 0 ;
                        $avgColFric[$key]["linkCollisions"] = 0 ;
                        $avgColFric[$key]["bbld"] = 0 ;
                        $avgColFric[$key]["lr"] = 0 ;
                    }
                    $avgColFric[$key]["nodeCollisions"] += $r ;
                }
                $avgColFric[$key]["nodeCollisions"] /= count($res["nodeCollisions"]) ;
                
                foreach($res["linkCollisions"] as $r){
                    $avgColFric[$key]["linkCollisions"] += $r ;
                }
                $avgColFric[$key]["linkCollisions"] /= count($res["linkCollisions"]) ;
                
                foreach($res["bblDeviations"] as $r){
                    $avgColFric[$key]["bbld"] += $r ;
                }
                $avgColFric[$key]["bbld"] /= count($res["bblDeviations"]) ;
                
                foreach($res["loopRoundness"] as $r){
                    $avgColFric[$key]["lr"] += $r ;
                }
                $avgColFric[$key]["lr"] /= count($res["loopRoundness"]) ;
                
            }
            $i = 0 ;
            foreach($avgColFric as $key => $res){
                $selKey1 = "" ;
                $selKey2 = "" ;
                if($mType1 === "nc"){
                    $selKey1 = "nodeCollisions" ;
                } else if($mType1 === "lc"){
                    $selKey1 = "linkCollisions" ;
                } else if($mType1 === "bld"){
                    $selKey1 = "bbld" ;
                } else if($mType1 === "lr"){
                    $selKey1 = "lr" ;
                }
                
                if($mType2 === "nc"){
                    $selKey2 = "nodeCollisions" ;
                } else if($mType2 === "lc"){
                    $selKey2 = "linkCollisions" ;
                } else if($mType2 === "bld"){
                    $selKey2 = "bbld" ;
                } else if($mType2 === "lr"){
                    $selKey2 = "lr" ;
                }
                
                $nodeColGroupedByFrictionData .= "[" . $key . "," . $res[$selKey1] . ', "", ' . $res[$selKey2] . ',""]' ;
                if($i++ < count($avgColFric)-1)
                    $nodeColGroupedByFrictionData .= "," ;
            }
            return '{"values": [' . $nodeColGroupedByFrictionData . ']}' ;
        }
        
        /* function to test the methods, here should come some assertions */
        public function testMethods(){
            $dm = new DataManager() ;
            var_dump($dm->getChargeChargeDistanceScatterData()) ;
            var_dump($dm->getFrictionChargeDistanceScatterData()) ;
            var_dump($dm->getHeatmapData()) ;
            var_dump($dm->getFrictionDistributionData()) ;
            var_dump($dm->getChargeDistributionData()) ;
            var_dump($dm->getChargeDistanceDistributionData()) ;
            var_dump($dm->getNodeCollisionsGroupedByFriction()) ;
            var_dump($dm->getNodeCollisionsGroupedByCharge()) ;
            var_dump($dm->getNodeCollisionsGroupedByChargeDistance()) ;
            var_dump($dm->getFrictionChargeScatterData()) ;
            var_dump($dm->getFrictionChargeDistanceScatterData()) ;
        }
    
    }