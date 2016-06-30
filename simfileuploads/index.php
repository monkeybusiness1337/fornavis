<?php
/*
 * jQuery File Upload Plugin PHP Example
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

if(isset($_GET["simfilesUploadReady"])){
    $dir = new DirectoryIterator("./simfiles");
    $simid = uniqid("sim_") ;
    mkdir('../simulationdata/'.$simid) ;
    foreach ($dir as $fileinfo) {
        if (!$fileinfo->isDot()) {
            rename("./simfiles/" . $fileinfo->getFilename(), '../simulationdata/' . $simid . "/" . $fileinfo->getFilename());
        }
    }
    return json_encode(["success"   =>true]) ;
}else{
    error_reporting(E_ALL | E_STRICT);
    require('UploadHandler.php');
    $upload_handler = new UploadHandler();

    return json_encode(["success"   =>true]) ;
}