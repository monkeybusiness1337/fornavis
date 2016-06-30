<?php 

    /* datarequesthandler.php 

     * the datarequesthandler takes GET requests and routes them to the right
     * functionality depending on the parameters the calling script has sent
     * with the request. the datarequest handler is considered as the frontcontroller
     * of the application.
     * there are still the old request commands coded in here,
     * that can lead to confusion, so the following section will list the commands
     * and their functions.
     * 
     * the datarequesthandler is called in the following way:
     * datarequesthandler.php?command&param1=asd&param2=asd
     * 
     * the most important commands are:
     * 
     * getNodeCollisionsGroupedByFrictionData&sm1=[nc|lc|bld|lr]&sm2=[nc|lc|bld|lr]
     * global relative metrics trends for friction, depending on the passed metrics
     * through the parameter m1 and m2.
     * 
     * getNodeCollisionsGroupedByChargeData&sm1=[nc|lc|bld|lr]&sm2=[nc|lc|bld|lr]
     * same as function above, but just for charge.
     * 
     * getNodeCollisionsGroupedByChargeDistanceData&sm1=[nc|lc|bld|lr]&sm2=[nc|lc|bld|lr]
     * same as the function above, but just for chargedistance.
     * 
     * getHeatmapData&jitter=[true|false]&collisionType=[nc|lc|bld|lr]
     * name is also missleading, because we are actually NOT drawing a heatmap
     * but a scatterplot where the desitiy of each point is color coded like in
     * a heatmap. however, this function takes the jitter parameter, which allow you
     * to configure whether the points are jittered or not. one can also specify
     * the selected metrics by setting collisionType. this name is missleading, 
     * and should be replaced by sm, like in the command descriptions above. the
     * collisionType parameter specifies which metrics the scatterplot data 
     * should be generated for.
     * 
     * caching is also happening here in this file. mecmached is used for 
     * caching. on the current testsystrm, a memchaced server is running on
     * localhost and listening to the port 11211. Please be sure you adopt
     * the port to the one your memcached server is using. this can be done
     * when the connect call is done, so watch out for a memcache_connect() call.
     * caching is applied after the first call for each command, that means that
     * if a command was sent first, the data needs do be processed from the files
     * on the harddisk. after that the aggregated result is put into the cached. 
     * every further request is now processesed from the cache data.
     * 
     * getFrictionChargeScatterData
     * returns all input parameter combinations from friction and charge. no
     * other parameters needed. this command will be replaced or discareded in
     * the next version.
     * 
     * getFrictionChargeDistanceScatterData
     * same as description above but just for friction and chargedistance.
     * 
     * getChargeChargeDistanceScatterData
     * same as description above but just for charge and chargedistance.
     * 
     * getFrictionHistogramData
     * gets the frequency data of friction distinct values. no other parameters
     * needed for the call.
     * 
     * getChargeHistogramData
     * same as in command description above, but for charge
     * 
     * getChargeDistanceHistogramData
     * same as in command description above, but for chargedistance
     * 
     * getInputParameterRanges
     * retrieves the input parameter ranges (friction,charge,chargedistance)
     * 
     * calculateParetoFront&sm1=[]&sm2=[]&structSize=[ANY INT]
     * this command will route to the method calculateParetoFront of the
     * dataprocessor, which will return the pareto front and any other points
     * regarding the passed metrics. the function also takes a structureSize 
     * parameter, to define which structures we are interested in. structureSize
     * must me an valid integer value, that means it must be on of the integer
     * values in the array that is returned by getStructureSizes.
     * 
     * getStructureSizes
     * returns all unique structure sizes of the RNA secondary structures that
     * are in the currently chosen dataset
     * 
     * gus
     * gus stands for get unique structures. this function will return an array
     * of unqiue rna secondary structures that are in the currently chosen
     * dataset.
     * 
     * getDatasets
     * returns a list of the currently available datasets.
     * 
     * setCurrentDataset&selected=[ANY PATH]
     * sets the dataset to work on. the datasets are identified by their path
     * on the filesystem. any valid path, that was returned by getDatasets can
     * be passed.
     * 
     * clearCache
     * flushes the cache
     * 
     * getColorCoding
     * get the color coding translation in form of an array with key value pairs
     * like ["1-2"=>"#ffff"] for e.g.
     * 
     * getStructuresCounts
     * get the number of structures per structure size. return value is an array
     * with key value pairs, for e.g. ["100" => 10, "200" => 5]
     * 
     * important scripts, the datarequesthandler is using:
     * colorcoding.php - for color coding the density of scatter plot points
     * metricstaxonomy.php - for translating abreviations to human readable labels
     * dataprocessor.php - for processing the simulation files
     */


    require_once('colorcoding.php') ;
    require_once('metricstaxonomy.php') ;
    require_once('datamanager.php');
    
    $memcache = memcache_connect('localhost', 11211);

    if(isset($_GET["getNodeCollisionsGroupedByFrictionData"])){
        if($memcache->get('ncf_'.$_GET["sm1"]."_".$_GET["sm2"]) === false){
            $dm = DataManager::getInstance() ;
            $ncf = $dm->getCollisionsGroupedByFrictionData($_GET["sm1"],$_GET["sm2"]) ;
            echo $ncf ;
            $memcache->set('ncf_'.$_GET["sm1"]."_".$_GET["sm2"], $ncf);
        } else{
            echo $memcache->get('ncf_'.$_GET["sm1"]."_".$_GET["sm2"]);
        }
    } else if(isset($_GET["getNodeCollisionsGroupedByChargeData"])){
        if($memcache->get('ncc'.$_GET["sm1"]."_".$_GET["sm2"]) === false){
            $dm = DataManager::getInstance() ;
            $ncc = $dm->getCollisionsGroupedByChargeData($_GET["sm1"],$_GET["sm2"]) ;
            echo $ncc ;
            $memcache->set("ncc".$_GET["sm1"]."_".$_GET["sm2"], $ncc);
        } else{
            echo $memcache->get("ncc".$_GET["sm1"]."_".$_GET["sm2"]);
        }
    } else if(isset($_GET["getNodeCollisionsGroupedByChargeDistanceData"])){
        if($memcache->get('nccd'.$_GET["sm1"]."_".$_GET["sm2"]) === false){
            $dm = DataManager::getInstance() ;
            $nccd = $dm->getCollisionsGroupedByChargeDistanceData($_GET["sm1"],$_GET["sm2"]) ;
            echo $nccd ;
            $memcache->set("nccd".$_GET["sm1"]."_".$_GET["sm2"], $nccd);
        } else{
            echo $memcache->get("nccd".$_GET["sm1"]."_".$_GET["sm2"]);
        }
    } else if(isset($_GET["getHeatmapData"])){
        if($memcache->get($_GET["collisionType"]."_jt".$_GET["jitter"]) === false){
            $dm = DataManager::getInstance() ;
            $hmd = $dm->getHeatmapDataJitteredAndOverlapAttribute($_GET["fl"], $_GET["fu"], $_GET["cl"], $_GET["cu"], $_GET["cdl"], $_GET["cdu"],$_GET["collisionType"], $_GET["sl"], $_GET["su"],$_GET["ncu"],$_GET["lcu"],$_GET["jitter"]) ;
            echo $hmd ;
            $memcache->set($_GET["collisionType"]."_jt".$_GET["jitter"], $hmd);
        } else{
            $cached = json_decode($memcache->get($_GET["collisionType"]."_jt".$_GET["jitter"])) ;
            $filteredValues = [] ;
            /* filter logic */
            foreach($cached->values as  $val){
                $doc = new DOMDocument();
                $doc->loadHTML($val[2]);
                $xpath = new DOMXpath($doc);
                $expression = './/div[contains(concat(" ", normalize-space(@class), " "), " resValues ")]';
                foreach ($xpath->evaluate($expression) as $div) {
                    $filteredSingleCombinations = [] ;

                    $splitted = split(";", $div->nodeValue) ;
                    foreach($splitted as $single){
                        $parameters = split(",", $single) ;
                        $friction = (float)$parameters[0] ;
                        $charge = (float)$parameters[1] ;
                        $chargeDistance = (float)$parameters[2] ;
                        
                        if($friction >= (float)$_GET["fl"] && $friction <= (float) $_GET["fu"] && 
                           $charge >= (float)$_GET["cl"] && $charge <= (float)$_GET["cu"] &&
                           $chargeDistance >= (float)$_GET["cdl"] && $chargeDistance <= (float)$_GET["cdu"]){
                            $filteredSingleCombinations[] = $single ;
                        }
                    }
                    
                    if(count($filteredSingleCombinations) > 0){
                        $clusteredPointsFlat = implode(";", $filteredSingleCombinations) ;
                        $clusterPointKey = $val[1] ;
                        $metricTypeLabel  = $cached->type ;
                        $extractedCol = $val[1] ;
                        $tooltip = '<div style="display: none" class="resValues">'
                        .$clusteredPointsFlat
                        .'</div><div style="padding:5px;">' 
                        .'<b>Simulation Results:</b> '.count($filteredSingleCombinations). '<br/>'
                        .'<b>Combinations:</b> '.count(array_unique($filteredSingleCombinations)). '<br/>'                        .'<b>'.getHumanReadableLabel($metricTypeLabel).'</b>'.$extractedCol
                        .'<button class="btn btn-primary btn-sm showClusteredCombinations ' . $clusterPointKey . '" style="width:123px; margin-top: 5px" onclick="heatmapReadyHandler(\''.$clusteredPointsFlat.'\')">Test Combinations</button>'
                        .'</div>' ;
                        $valCopy = $val ;
                        $valCopy[2] = $tooltip ;
                        $valCopy[3] = 'point{opacity: 0.5; size: 5; fill-color: ' . getColorShade(count($filteredSingleCombinations)) . '; stroke-color: darkgray; stroke-width: 1}' ;
                        $filteredValues[] = $valCopy ;
                    }
                }
            }
            $cached->values = $filteredValues ; 
            echo json_encode($cached) ;
        }
    } else if(isset($_GET["getFrictionChargeScatterData"])){
        if($memcache->get('fcsd') === false){
            $dm = DataManager::getInstance() ;
            $fcsd = $dm->getFrictionChargeScatterData() ;
            echo $fcsd ;
            $memcache->set("fcsd", $fcsd);
        }else{
            echo $memcache->get("fcsd");
        }
    } else if(isset($_GET["getFrictionChargeDistanceScatterData"])){
        if($memcache->get('fcdsd') === false){
            $dm = DataManager::getInstance() ;
            $fcdsd = $dm->getFrictionChargeDistanceScatterData() ;
            echo $fcdsd ;
            $memcache->set("fcdsd", $fcdsd);
        } else{
            echo $memcache->get("fcdsd");
        }
    } else if(isset($_GET["getChargeChargeDistanceScatterData"])){
        if($memcache->get('ccdsd') === false){
            $dm = DataManager::getInstance() ;
            $ccdsd = $dm->getChargeChargeDistanceScatterData() ;
            echo $ccdsd ;
            $memcache->set("ccdsd", $ccdsd);
        } else{
            echo $memcache->get("ccdsd");
        }
    } else if(isset($_GET["getChargeDistanceHistogramData"])){
        if($memcache->get('cdhd') === false){
            $dm = DataManager::getInstance() ;
            $cdhd = $dm->getChargeDistanceHistogramData() ;
            echo $cdhd ;
            $memcache->set("cdhd", $cdhd);
        }else{
            echo $memcache->get("cdhd") ;
        }
    } else if(isset($_GET["getChargeHistogramData"])){
        if($memcache->get('chd') === false){
            $dm = DataManager::getInstance() ;
            $chd = $dm->getChargeHistogramData() ;
            echo $chd ;
            $memcache->set("chd", $chd);
        } else{
            echo $memcache->get("chd") ;
        }
    } else if(isset($_GET["getFrictionHistogramData"])){
        if($memcache->get('fhd') === false){
            $dm = DataManager::getInstance() ;
            $fhd = $dm->getFrictionHistogramData() ;
            echo $fhd ;
            $memcache->set("fhd", $fhd);
        } else{
            echo $memcache->get("fhd") ;
        }
    } else if(isset($_GET["getInputParameterRanges"])){
        if($memcache->get('ipr') === false){
            $dm = DataManager::getInstance() ;
            $ipr = $dm->getInputParameterRanges() ;
            echo $ipr ;
            $memcache->set("ipr", $ipr);
        } else{
            echo $memcache->get("ipr");
        }
    } else if(isset($_GET["calculateParetoFront"])){
        $cacheKey = $_GET["sm1"]."_".$_GET["sm2"]."_".$_GET["structSize"] ;
        if($memcache->get($cacheKey) === false){
            $dm = DataManager::getInstance() ;
            $p = $dm->calculateParetoFront($_GET["structSize"], $_GET["fl"], $_GET["fu"], $_GET["cl"], $_GET["cu"], $_GET["cdl"], $_GET["cdu"], $_GET["ncu"], $_GET["lcu"], $_GET["sm1"], $_GET["sm2"]) ;
            echo $p ;
            $memcache->set($cacheKey, $p);
        }else{
            $cached = json_decode($memcache->get($cacheKey)) ;
            /* filter logic */
            foreach($cached->values as $val){
                $doc = new DOMDocument();
                $ispareto = ($val[1] === null) ? true : false ;
                $doc->loadHTML($ispareto ? $val[5] : $val[2]) ;
                $xpath = new DOMXpath($doc);
                $expression = './/div[contains(concat(" ", normalize-space(@class), " "), " resValues ")]';
                
                foreach ($xpath->evaluate($expression) as $div) {
                    $filteredSingleCombinations = [] ;

                    $splitted = split(";", $div->nodeValue) ;
                    foreach($splitted as $single){
                        $parameters = split(",", $single) ;
                        $friction = (float)$parameters[0] ;
                        $charge = (float)$parameters[1] ;
                        $chargeDistance = (float)$parameters[2] ;
                        
                        if($friction >= (float)$_GET["fl"] && $friction <= (float) $_GET["fu"] && 
                           $charge >= (float)$_GET["cl"] && $charge <= (float)$_GET["cu"] &&
                           $chargeDistance >= (float)$_GET["cdl"] && $chargeDistance <= (float)$_GET["cdu"]){
                            $filteredSingleCombinations[] = $single ;
                        }
                    }
                    
                    if(count($filteredSingleCombinations) > 0){
                        $clusteredPointsFlat = implode(";", $filteredSingleCombinations) ;
                        $clusterPointKey = $ispareto ? $val[4] : $val[1];
                        $metric1 = $val[0] ;
                        $metric2 = $ispareto ? $val[4] : $val[1];

                        $metricTypeLabels = split("_", $cached->type) ;
                        $tooltip = '<div style="display: none" class="resValues">'
                        .$clusteredPointsFlat
                        .'</div><div style="padding:5px;">' 
                        .'<b>Combinations:</b> '.count($filteredSingleCombinations). '<br/>'
                        .'<b>'.getHumanReadableLabel($metricTypeLabels[0]).'</b>'.$metric1.'<br/>'
                        .'<b>'.getHumanReadableLabel($metricTypeLabels[1]).'</b>'.$metric2.'<br/>'
                        .($ispareto ? '<b style="color: #5cb85c">pareto optimal</b><br/>' : '')
                        .'<button class="btn btn-primary btn-sm showClusteredCombinations ' . $clusterPointKey . '" style="width:123px; margin-top: 5px" onclick="heatmapReadyHandler(\''.$clusteredPointsFlat.'\')">Test Combinations</button>'
                        .'</div>' ;
                        $valCopy = $val ;
                        if($ispareto){
                            $valCopy[5] = $tooltip ;
                            $valCopy[6] = 'point{opacity: 0.5; size: 5; fill-color: ' . getParetoColorShade(count($filteredSingleCombinations)) . '; stroke-color: darkgray; stroke-width: 1}' ;
                        } else{
                            $valCopy[2] = $tooltip ;
                            $valCopy[3] = 'point{opacity: 0.5; size: 5; fill-color: ' . getColorShade(count($filteredSingleCombinations)) . '; stroke-color: darkgray; stroke-width: 1}' ;
                        }
                        
                        $filteredValues[] = $valCopy ;
                    }
                }
            }
            $cached->values = $filteredValues ; 
            echo json_encode($cached) ;
        }
    } else if(isset($_GET["getStructureSizes"])){
        if($memcache->get('ssd') === false){
            $dm = DataManager::getInstance() ;
            $ssd = $dm->getStructureSizes() ;
            echo $ssd ;
            $memcache->set("ssd", $ssd) ;
        } else{
            echo $memcache->get("ssd") ;
        }
    } else if(isset($_GET["gus"])){
        if($memcache->get('usd') === false){
            $dm = DataManager::getInstance() ;
            $usd = $dm->getUniqueStructures() ;
            echo $usd ;
            $memcache->set("usd", $usd) ;
        } else{
            echo $memcache->get("usd") ;
        }
    } else if(isset($_GET["getDatasets"])){
       $simulations = [] ;
       $dirs = array_filter(glob('./simulationdata/*'), 'is_dir');
       foreach($dirs as $dir){
           $fi = new FilesystemIterator($dir, FilesystemIterator::SKIP_DOTS);
           $isSelected = (strpos($dir, 'current') !== false) ? true : false ;
           
           $simInfoJson = file_get_contents($dir . "/simulationinfo.json") ;
           $simInfoDecoded = json_decode($simInfoJson, TRUE) ;
           $simName = $simInfoDecoded["name"] ;
           $paramCombinCount = count($simInfoDecoded["combinations"]) ;
           $simulations[] = ["dir" => $dir, "name" => $simName, "structuresCount" => iterator_count($fi), "combinationsCount" => $paramCombinCount, "isSelected" => $isSelected] ;
       }
       echo json_encode($simulations) ;
    }else if(isset($_GET["setCurrentDataset"])){
        $selected = $_GET["selected"] ;
        if(strpos($selected, 'current') === false){
            $memcache->flush() ;
            $simid = uniqid("sim_") ;
            if(file_exists('./simulationdata/current')){
                rename('./simulationdata/current', './simulationdata/' . $simid) ;
            }
            rename($selected, './simulationdata/current');
        }
        echo json_encode(["success"=>true]) ;
    } else if(isset($_GET["clearCache"])){
        $memcache->flush() ;
        echo json_encode(["success"=>true]) ;
    } else if(isset($_GET["getColorCoding"])){
        $colorShadeMapping = getColorShadeRanges() ;
        $paretoColorShadeMapping = getParetoColorShadeRanges() ;
        echo json_encode(["colorMapping"=>$colorShadeMapping, "paretoColorMapping"=>$paretoColorShadeMapping]) ;
    } else if(isset($_GET["getStructuresCounts"])){
        if($memcache->get('sc') === false){
            $dm = DataManager::getInstance() ;
            $sc = $dm->getStructuresCounts() ;
            echo $sc ;
            $memcache->set("sc", $sc) ;
        } else{
            echo $memcache->get("sc") ;
        }
    }