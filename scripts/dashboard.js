// ui state vars
var numChartsLoaded = 1 ;
var filterClicked = false ;
var collisionsType = "links" ;

var diagramHeight = 280 ;

// chart data
var heatmapData, heatMapChart, heatmapOptions ;
var heatmapData2, heatMapChart2, heatmapOptions2 ;
var dataFrictionNodecollisions, dataChargeNodecollisions, dataChargeDistanceNodecollisions ;
var chartFrictionNodeCollisions, chartChargeNodeCollisions, chartChargedistanceNodeCollisions ;
var frictionNodeCollisionOptions, chargeNodeCollisionOptions, chargeDistanceNodeCollisionOptions ;
var dataFrictionChargeScatter, chartFrictionChargeScatter, frictionChargeScatterOptions ;
var datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions, chartFrictionChargeDistanceScatter ;
var chartChargeChargedistanceScatter, chargeChargeDistanceScatterOptions, dataChargeChargeDistanceScatter ;
var dataFrictionHisto, frictionHistoOptions, chartFrictionHisto ;
var dataChargeHisto, chargeHistoOptions, chartChargeHisto ;
var dataChargeDistanceHisto, chargeDistanceHistoOptions, chartChargedistanceHisto ;
var dataFrictionDistribution, frictionDistributionOptions, chartFrictionDistribution ;
var dataChargeDistribution, chargeDistributionOptions, chartChargeDistribution ;
var dataChargeDistanceDistribution, chargeDistanceDistributionOptions, chartChargedistanceDistribution ;
var paretoScatterOptions, paretoScatterChart, paretoScatterData ;

// input parameter bounds
var frictionLowerBoundVal, frictionUpperBoundVal ;
var chargeLowerBoundVal, chargeUpperBoundVal ;
var chargeDistanceLowerBoundVal, chargeDistanceUpperBoundVal ;
// output parameter bounds
var structSizeLower, structSizeUpper ;
var nodColUpper, linkColUpper ;

var clusteredPointDataNodes ;
var clusteredPointDataLinks ;

var frictionDash, chargeDash, chargeDash ;

var frictionLower, frictionUpper ;
var chargeLower, chargeUpper ;
var chargeDistanceLower, chargeDistanceUpper ;

var heatmapShades, heatmapShades2, paretoShades ;
/* 
 * Metrics Abbreviations:
 * nc => nodecollisions
 * lc => linkcollisions
 * bld => backbonelink deviations
 * lr => loop roundness
 * */
var selectedMetrics = ["bld", "lr"] ;
var selectedInputPrameters = [null,null,null] ;

var estimatedTime ;
var currentAjaxRequests = [] ;

/* taken from https://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/ */
function standardDeviation(values){
  var avg = average(values);
  
  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  
  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}


function line_intersects(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / ( - s2_x * s1_y + s1_x * s2_y);
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return 1;
    }

    return 0; // No collision
}

function circle_intersects(circle1, circle2){

    var dx = circle1.x - circle2.x;
    var dy = circle1.y - circle2.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circle1.radius + circle2.radius) {
        return 1 ;
    }
    return 0 ;
}

var findOne = function (haystack, arr) {
    return arr.some(function (v) {
        return haystack.indexOf(v) >= 0;
    });
};

var heatmapReadyHandler = function (data){
    $('#clusteredPointsDetailsContainer,#overlay').fadeIn() ;
    var combins = data.split(";") ;    
    combins = jQuery.unique(combins) ;
    var table = '<table class="table">' ;
    table += '<thead><tr><th>Friction</th><th>Charge</th><th>Chargedistance</th><th>Select</th></tr></thead><tbody>' ;
    
    for(var i = 0 ; i < combins.length ; i++){
        var values = combins[i].split(",");
        var friction = values[0] ;
        var charge = values[1] ;
        var chargedistance = values[2] ;
        table += '<tr><td>'+friction+'</td><td>'+charge+'</td><td>'+chargedistance+'</td><td><input type="checkbox" name="combination" value="'+combins[i]+'"></td></tr>' ;
    }
    table += '</tbody></table>' ;
    $('#clusteredPointsDetails').html(table) ;   
}

$(document).ready(function(){
    
    google.charts.load('current', {'packages':['corechart', 'line', 'scatter', 'controls']});
    
    $('#selectedStructsizesInStepTwo').click(function(){
        $('#currentStepIndicator').text("METRICS") ;
        structSizeLower = parseFloat($('#ssmin').text()) ;
        structSizeUpper = parseFloat($('#ssmax').text()) ;
        $('#secondStep').hide() ;
        $('#thirdStep').fadeIn() ;
    }) ;
    
    $('#thirdStepBack').click(function(){
        $('#thirdStep').hide() ;
        $('#secondStep').fadeIn() ;
    }) ;
    
    $('#useFileUpload').click(function(){
        $('#fileUploadOrExistingButtonContainer, #welcomeAlert').hide() ;
        $('#fileUploadContainer').fadeIn() ;
        $('#currentStepIndicator').text("SIMULATION FILE UPLOAD") ;
    }) ;
    
    $('#fileUploadBack').click(function(){
        $('#fileUploadContainer').hide() ;
        $('#fileUploadOrExistingButtonContainer, #welcomeAlert').fadeIn() ;
        $('#currentStepIndicator').text("WELCOME") ;
    }) ;
    
    var uploadCount = 1 ;
    $('#fileupload').bind('fileuploaddone', function (e, data) {
        if(uploadCount++ == $('#uploadTable tr').length){
            $.get("simfileuploads/index.php?simfilesUploadReady", function(){
                setTimeout(function(){
                    $('#fileuploadSuccessNext, #uploadSuccessAlert').fadeIn() ;
                    $('table tr').remove() ;
                }, 1500) ;
            }) ;
            uploadCount = 1 ;
        }
    }) ;
    
    function initializeSimulationDataTable(){
        jQuery.ajaxQueue({
            url: 'datarequesthandler.php?getDatasets',
            dataType: "json"
        }).done(function( data ) {
            $('#firstStep').hide() ;
            $('#currentStepIndicator').text("SIMULATION SELECTION") ;
            $('#simulationsTable thead').html('<tr><th style="text-align:center">Name</th><th style="text-align:center"># Structures</th><th style="text-align:center"># Parametercombinations</th><th style="text-align:center">Details</th></tr>')
            var tableBody = "" ;
            if(data.length !== 0){
                for(var i = 0 ; i < data.length ; i++){
                    tableBody += '<tr id="'+data[i].dir+'" class="'+(data[i].isSelected ? "selected" : "") +'"><td>' + data[i].name + '</td><td>' + data[i].structuresCount + '</td><td>' + data[i].combinationsCount + '</td><td><button class="btn btn-sm btn-default">+</button></td></tr>' ;
                }
            }else{
                tableBody = '<tr><td colspan="4">There are no simulation files available, you need to upload some first...</td></tr>' ;
            }
            $('#simulationsTable tbody').html(tableBody) ;
            $('#simDataSelectionContainer').fadeIn() ;
        }) ;
    }
    
    $('#useExistingFiles,#fileuploadSuccessNext').click(function(){
        initializeSimulationDataTable() ;
    }) ;
    
    
    $('#simDataSelectionNext').click(function(){
        var selected = $("#simulationsTable tr.selected").attr("id") ;
        jQuery.ajaxQueue({
            url: 'datarequesthandler.php?setCurrentDataset&selected='+selected,
            dataType: "json"
        }).done(function( data ) {
            $('#firstStep,#simDataSelectionContainer').hide() ;
            $('#loadingIconContainer').fadeIn() ;
            $('#currentStepIndicator').text("LOADING SIMULATION INFOS") ;

            var start = new Date().getTime();

            jQuery.ajaxQueue({
                url: 'datarequesthandler.php?getStructureSizes',
                dataType: "json"
            }).done(function( data ) {
                var end = new Date().getTime();
                estimatedTime = end - start;
                console.log("after first load: " + estimatedTime) ;
                var decodedData = data ;    
                var dropDownMenuItems = '' ; 
                for(var i = 0 ; i < decodedData.length ; i++){
                    dropDownMenuItems += '<li><a href="#" class="structSizeMenuItem">'+decodedData[i]+'</a></li>' ;
                }
                $('#structSizeMinContainer .dropdown-menu, #structSizeMaxContainer .dropdown-menu').html(dropDownMenuItems) ;
                $('#ssmin').text(decodedData[0]) ;
                $('#ssmax').text(decodedData[decodedData.length-1]) ;

                $('.dropdown-toggle').dropdown() ;

                $('#structSizeMinContainer .structSizeMenuItem').click(function(){
                    $('#ssmin').text($(this).text()) ;
                }) ;

                $('#structSizeMaxContainer .structSizeMenuItem').click(function(){
                    $('#ssmax').text($(this).text()) ;
                }) ;
                $('#currentStepIndicator').text("STRUCTURE SIZE") ;
                $('#loadingIconContainer').hide() ;
                $('#secondStep').fadeIn() ;
            });
        }) ;
    }) ;
    
    $('#secondStepBack').click(function(){
        initializeSimulationDataTable() ;
        $('#secondStep').hide() ;
        $('#simDataSelectionContainer').fadeIn() ;
        $('#currentStepIndicator').text("WELCOME") ;
    }) ;

    $('#simDataSelectionBack').click(function(){
        $('#simDataSelectionContainer').hide() ;
        $('#firstStep').fadeIn() ;
    }) ;
    
    $("#simulationsTable").delegate("tbody tr", "click", function(){
        $('#simulationsTable tr').removeClass("selected") ;
        $(this).addClass("selected") ;
    });
    
    $('#abortInitProgress').click(function(){
        $('#progressInfo').text("Canceling Initialization!").css("color", "red") ;
        for(var i = 0 ; i < currentAjaxRequests.length ; i++){
            currentAjaxRequests[i].abort() ;
        }
        $('#initProgressInner').stop().removeClass("progress-bar-success").addClass("progress-bar-danger").animate({width: "0%"}, 1800, "linear") ;
        jQuery.ajaxQueue({
            url: 'datarequesthandler.php?clearCache',
            dataType: "json"
        }).done(function( data ) {
            setTimeout(function(){
                $('#initializationProgressContainer').hide() ;
                $('#thirdStep').fadeIn() ;
            }, 2000) ;
        }) ;
    }) ;
    
    $('#startVisualization').click(function(){

        var sm1 = $('#leftMetricsPicker .selected').text() ;
        var sm2 = $('#rightMetricsPicker .selected').text() ;

        if($('#leftMetricsPicker .selected').length == 0 || $('#rightMetricsPicker .selected').length == 0){
            $('#thridStepAlert').removeClass("alert-info").addClass("alert-danger") ;
            $('#twoKeyWord').css("font-weight", "bold") ;
        }else{
            $('#currentStepIndicator').text("INITIALIZING DASHBOARD CACHE") ;
            $('#startContainerErrors').fadeOut() ;
            if(sm1 == "Linkcollisions"){
                selectedMetrics[0] = "lc" ;
            }else if(sm1 == "Nodecollisions"){
                selectedMetrics[0] = "nc" ;
            }else if(sm1 == "Backbonelinklength Deviations"){
                selectedMetrics[0] = "bld" ;
            }else if(sm1 == "Loop Roundness"){
                selectedMetrics[0] = "lr" ;
            }

            if(sm2 == "Linkcollisions"){
                selectedMetrics[1] = "lc" ;
            }else if(sm2 == "Nodecollisions"){
                selectedMetrics[1] = "nc" ;
            }else if(sm2 == "Backbonelinklength Deviations"){
                selectedMetrics[1] = "bld" ;
            }else if(sm2 == "Loop Roundness"){
                selectedMetrics[1] = "lr" ;
            }
            
            $('#thirdStep').hide() ;
            $('#initProgressInner').removeClass("progress-bar-danger").addClass("progress-bar-success").animate({width: "0%"}, 1800, "linear") ;
            $('#progressInfo').text("Calculating data for friction histogram...").css("color", "black") ;
            $('#initializationProgressContainer').fadeIn() ;
            
            $('#initProgressInner').animate({width: Math.round( 100/13 * 10) / 10+"%"}, estimatedTime, "linear") ;
            
            jQuery.ajaxQueue({
                url: 'datarequesthandler.php?getInputParameterRanges',
                dataType: "json"
            }).done(function( data ) {
                var decodedData = data ;
                setInputParameterBounds(decodedData.values.fmin, decodedData.values.fmax, decodedData.values.cmin, decodedData.values.cmax, decodedData.values.cdmin, decodedData.values.cdmax, null, null, decodedData.values.lcmax, decodedData.values.ncmax) ;
                var progress = Math.round( 100/13 * 10) / 10 ;
                $('#initProgressInner').stop() ;
                $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                $('#initProgressInner').animate({width: Math.round( 100/13 * 2 * 10) / 10+"%"}, estimatedTime, "linear") ;
                $('#progressInfo').text("Calculating data for friction histogram...") ;

                var prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getFrictionHistogramData",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 2 * 10) / 10 ;
                    $('#initProgressInner').stop() ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for charge histogram...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 3 * 10) / 10+"%"}, estimatedTime, "linear") ;
                }) ;

                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getChargeHistogramData",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 3 * 10) / 10 ;
                    $('#initProgressInner').stop() ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for charge distance histogram...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 4 * 10) / 10+"%"}, estimatedTime, "linear") ;
                }) ;
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getChargeDistanceHistogramData",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 4 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for pareto view...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 5 * 10) / 10+"%"}, estimatedTime, "linear") ;
                }) ;
                currentAjaxRequests.push(prom) ;


                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?calculateParetoFront&structSize="+structSizeLower+"&fl=" + frictionLower + "&fu=" + frictionUpper + "&cl=" + chargeLower + "&cu=" + chargeUpper
                                                   + "&cdl=" + chargeDistanceLower + "&cdu=" + chargeDistanceUpper +"&ncu="+nodColUpper+"&lcu="+linkColUpper+"&sm1="+selectedMetrics[0]+"&sm2="+selectedMetrics[1],
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 5 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for friction / charge scatter...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 6 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;


                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getFrictionChargeScatterData",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 6 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for friction / chargedistance scatter...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 7 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;


                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getFrictionChargeDistanceScatterData",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 7 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for charge / chargedistance scatter...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 8 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getChargeChargeDistanceScatterData",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 8 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    if(selectedMetrics[0] == "nc"){
                        label = "Nodecollisions" ;
                    } else if(selectedMetrics[0] == "lc"){
                        label = "Linkcollisions" ;
                    } else if(selectedMetrics[0] == "bld"){
                        label = "Backbonelinklength Deviation" ;
                    } else if(selectedMetrics[0] == "lr"){
                        label = "Loop Roundness" ;
                    }
                    $('#progressInfo').text("Calculating data for "+label+" scatter...") ;                
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 9 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getHeatmapData&fl=" + frictionLower + "&fu=" + frictionUpper + "&cl=" + chargeLower + "&cu=" + chargeUpper
                                                                          + "&cdl=" + chargeDistanceLower + "&cdu=" + chargeDistanceUpper + "&collisionType="
                                                                          +selectedMetrics[0]+"&sl="+structSizeLower+"&su="+structSizeUpper+"&ncu="+nodColUpper+"&lcu="+linkColUpper
                                                                          +"&jitter=true",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 9 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for relative friction trends...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 10 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getNodeCollisionsGroupedByFrictionData&sm1=" +selectedMetrics[0]+"&sm2="+selectedMetrics[1],
                    dataType: "json"
                }).done(function( data ){
                    var progress = Math.round( 100/13 * 10 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for relative charge trends...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 11 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getNodeCollisionsGroupedByChargeData&sm1=" +selectedMetrics[0]+"&sm2="+selectedMetrics[1],
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 11 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    $('#progressInfo').text("Calculating data for relative charge distance trends...") ;
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 12 * 10) / 10+"%"}, estimatedTime, "linear") ;
                }) ;
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getNodeCollisionsGroupedByChargeDistanceData&sm1=" +selectedMetrics[0]+"&sm2="+selectedMetrics[1],
                    dataType: "json"
                }).done(function( data ) {
                    var progress = Math.round( 100/13 * 12 * 10) / 10 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    if(selectedMetrics[1] == "nc"){
                        label = "Nodecollisions" ;
                    } else if(selectedMetrics[1] == "lc"){
                        label = "Linkcollisions" ;
                    } else if(selectedMetrics[1] == "bld"){
                        label = "Backbonelinklength Deviation" ;
                    } else if(selectedMetrics[1] == "lr"){
                        label = "Loop Roundness" ;
                    }
                    $('#progressInfo').text("Calculating data for "+label+" scatter...") ;                
                    $('#initProgressInner').animate({width: Math.round( 100/13 * 13 * 10) / 10+"%"}, estimatedTime, "linear") ;
                });
                currentAjaxRequests.push(prom) ;

                prom = jQuery.ajaxQueue({
                    url: "datarequesthandler.php?getHeatmapData&fl=" + frictionLower + "&fu=" + frictionUpper + "&cl=" + chargeLower + "&cu=" + chargeUpper
                                                                           + "&cdl=" + chargeDistanceLower + "&cdu=" + chargeDistanceUpper + "&collisionType="+selectedMetrics[1]+"&sl="+structSizeLower
                                                                           +"&su="+structSizeUpper+"&ncu="+nodColUpper+"&lcu="+linkColUpper
                                                                           +"&jitter=true",
                    dataType: "json"
                }).done(function( data ) {
                    var progress = 100 ;
                    $('#initProgressInner').attr("aria-valuenow", progress).css("width", progress+"%") ;
                    initialize() ;
                    $('#startContainer, #overlay').fadeOut("slow") ;
                    $('#dashboardContainer').fadeIn() ;
                });
                currentAjaxRequests.push(prom) ;
        
            }) ;
            
            //initialize() ;
            //$('#startContainer, #overlay').fadeOut("slow") ;
            //$('#dashboardContainer').fadeIn() ;
        }
    }) ;
    
    $('#leftMetricsPicker .btn').click(function(){
        $('#leftMetricsPicker .btn').removeClass("selected") ;
        $(this).toggleClass("selected") ;
        if($('#leftMetricsPicker .selected').length != 0 && $('#rightMetricsPicker .selected').length != 0){
            $('#thridStepAlert').removeClass("alert-danger").addClass("alert-info") ;
        }
    }) ;
    
    $('#rightMetricsPicker .btn').click(function(){
        $('#rightMetricsPicker .btn').removeClass("selected") ;
        $(this).toggleClass("selected") ;
        if($('#leftMetricsPicker .selected').length != 0 && $('#rightMetricsPicker .selected').length != 0){
            $('#thridStepAlert').removeClass("alert-danger").addClass("alert-info") ;
        }
    }) ;

    function initialize(){
        
        jQuery.ajaxQueue({
            url: 'datarequesthandler.php?getInputParameterRanges',
            dataType: "json"
        }).done(function( data ) {
            var decodedData = data ;
            setInputParameterBounds(decodedData.values.fmin, decodedData.values.fmax, decodedData.values.cmin, decodedData.values.cmax, decodedData.values.cdmin, decodedData.values.cdmax, null, null, decodedData.values.lcmax, decodedData.values.ncmax) ;
            initializeDashboard() ;
        });
               
    }
    function initializeDashboard(){
        google.charts.setOnLoadCallback(function(){drawInputParameterHistograms(frictionLowerBoundVal,frictionUpperBoundVal,chargeLowerBoundVal,chargeUpperBoundVal,chargeDistanceLowerBoundVal,chargeDistanceUpperBoundVal);});
        google.charts.setOnLoadCallback(function(){drawParetoScatter(structSizeLower,frictionLowerBoundVal,frictionUpperBoundVal,chargeLowerBoundVal,chargeUpperBoundVal,chargeDistanceLowerBoundVal,chargeDistanceUpperBoundVal,nodColUpper,linkColUpper, selectedMetrics[0], selectedMetrics[1])});
        jQuery.ajaxQueue({
            url: 'datarequesthandler.php?getStructureSizes',
            dataType: "json"
        }).done(function( data ) {
            var decodedData = data ;    
            var dropDownMenuItems = '' ; 
            $('#selectedStructsizeLabel').text(structSizeLower) ;
            for(var i = 0 ; i < decodedData.length ; i++){
                if(parseInt(decodedData[i]) >= structSizeLower && parseInt(decodedData[i]) <= structSizeUpper){
                    dropDownMenuItems += '<li><a href="#" class="structSizeMenuItem">'+decodedData[i]+'</a></li>' ;
                }
            }
            $('#paretoStructSizeMenuContainer .dropdown-menu').html(dropDownMenuItems) ;

            $('.structSizeMenuItem').click(function(){
                $('#paretoLoadingContainer').fadeIn() ;
                var splitted = $('#curValHelper').text().split(";") ;
                drawParetoScatter($(this).text(),splitted[0],splitted[1],splitted[2],splitted[3],splitted[4],splitted[5],nodColUpper,linkColUpper, selectedMetrics[0], selectedMetrics[1]) ;
                $('#selectedStructsizeLabel').text($(this).text()) ;
            }) ;
        });
        google.charts.setOnLoadCallback(function(){drawInputParameterScatters(frictionLowerBoundVal,frictionUpperBoundVal,chargeLowerBoundVal,chargeUpperBoundVal,chargeDistanceLowerBoundVal,chargeDistanceUpperBoundVal);});
        google.charts.setOnLoadCallback(function(){drawHeatmap(frictionLowerBoundVal,frictionUpperBoundVal,chargeLowerBoundVal,chargeUpperBoundVal,chargeDistanceLowerBoundVal,chargeDistanceUpperBoundVal,structSizeLower,structSizeUpper,nodColUpper,linkColUpper, selectedMetrics[0]);});              
        google.charts.setOnLoadCallback(function(){drawChartsNodecollisionsGroupedByInputParams(frictionLowerBoundVal,frictionUpperBoundVal,chargeLowerBoundVal,chargeUpperBoundVal,chargeDistanceLowerBoundVal,chargeDistanceUpperBoundVal);});
        google.charts.setOnLoadCallback(function(){drawHeatmap2(frictionLowerBoundVal,frictionUpperBoundVal,chargeLowerBoundVal,chargeUpperBoundVal,chargeDistanceLowerBoundVal,chargeDistanceUpperBoundVal,structSizeLower,structSizeUpper,nodColUpper,linkColUpper, selectedMetrics[1]);});              


        $(document).keyup(function(e) {
            if (e.keyCode == 27) {
                if($('#fornatestContainer').is(':visible') && $('#clusteredPointsDetailsContainer').is(':visible')){
                    $('#fornatestContainer').fadeOut() ;
                }else if($('#clusteredPointsDetailsContainer').is(':visible')){
                    $('#clusteredPointsDetailsContainer, #overlay').fadeOut() ;
                }
           }
        });

        $.get("datarequesthandler.php?getColorCoding", function(data){
            var decoded = jQuery.parseJSON(data) ;

            var colorMapping = decoded.colorMapping ;
            var paretoColorMapping = decoded.paretoColorMapping ;

            var colorMappingOutput = '<div style="float: right; margin-right: 15px"> &nbsp;Combinations<div style="height: 15px; float: left">' ;

            for (var property in colorMapping) {
                if (colorMapping.hasOwnProperty(property)) {
                    console.log(property + " => " + colorMapping[property]) ;
                    colorMappingOutput += '<div style="text-align: center; width: 50px; height: 15px; background-color: '+colorMapping[property][0]+'; color: '+colorMapping[property][1]+';float: left">'+property+'</div>'
                }
            }

            colorMappingOutput += '<div style="clear: both"></div></div></div>' ;

            $('#paretoLegend').append(colorMappingOutput) ;

            var colorMappingOutput = '<div style="float: left; margin-left: 15px"> &nbsp;Combinations (pareto)<div style="height: 15px; float: left">' ;

            for (var property in paretoColorMapping) {
                if (colorMapping.hasOwnProperty(property)) {
                    console.log(property + " => " + paretoColorMapping[property]) ;
                    colorMappingOutput += '<div style="text-align: center; width: 50px; height: 15px; background-color: '+paretoColorMapping[property][0]+'; color: '+colorMapping[property][1]+'; float: left">'+property+'</div>'
                }
            }

            colorMappingOutput += '<div style="clear: both"></div></div></div><div style="clear: both"></div>' ;

            $('#paretoLegend').append(colorMappingOutput) ;
            
            colorMappingOutput = '<div style="height: 15px; float: left; margin-left: 15px">' ;
            
            for (var property in colorMapping) {
                if (colorMapping.hasOwnProperty(property)) {
                    console.log(property + " => " + colorMapping[property]) ;
                    colorMappingOutput += '<div style="text-align: center; width: 50px; height: 15px; background-color: '+colorMapping[property][0]+'; color: '+colorMapping[property][1]+';float: left">'+property+'</div>'
                }
            }
            
            colorMappingOutput += '<div style="float: left"> &nbsp;Simulation Results</div><div style="clear: both"></div></div>'
            
            $('#hmlegend1,#hmlegend2').html(colorMappingOutput) ;
            
        }) ;


        jQuery.ajaxQueue({
            url: 'datarequesthandler.php?gus',
            dataType: "json"
        }).done(function( data ) {
            var decodedData = data ;
            var structuresMenuOptions = "" ;
            for (var property in decodedData) {
                if (decodedData.hasOwnProperty(property)) {
                    structuresMenuOptions += '<optgroup label="'+property+' Nucleotides">' ;
                    for(var i = 0 ; i < decodedData[''+property].length ; i++){
                        structuresMenuOptions += '<option>' + decodedData[''+property][i] + '</option>' ;
                    }
                    structuresMenuOptions += '</optgroup>' ;
                }
            }
            $('#selectmenuContainerStructuresLeft .selectpicker').html(structuresMenuOptions) ;
            $('#selectmenuContainerStructuresRight .selectpicker').html(structuresMenuOptions) ;
            $('.selectpicker').selectpicker('refresh');
        });

        $('#jitterLinkCol').click(function(){
            $('#jitterLinkCol').toggleClass("selectedButton") ;
            $('#linkColScatterLoadingContainer').fadeIn() ;
            var splitted = $('#curValHelper').text().split(";") ;
            //drawParetoScatter($(this).text(),splitted[0],splitted[1],splitted[2],splitted[3],splitted[4],splitted[5],nodColUpper,linkColUpper) ;
            drawHeatmap(splitted[0],splitted[1],splitted[2],splitted[3],splitted[4],splitted[5],structSizeLower,structSizeUpper, nodColUpper, linkColUpper, selectedMetrics[0]) ;
        }) ;
        
        $('#jitterNodeCol').click(function(){
            $('#jitterNodeCol').toggleClass("selectedButton") ;
            $('#nodeColScatterLoadingContainer').fadeIn() ;
            var splitted = $('#curValHelper').text().split(";") ;
            drawHeatmap2(splitted[0],splitted[1],splitted[2],splitted[3],splitted[4],splitted[5],structSizeLower,structSizeUpper, nodColUpper, linkColUpper,selectedMetrics[1]) ;
        }) ;

       $('#closeClusteredPointsDetails').click(function(){
            $('#clusteredPointsDetailsContainer,#overlay').fadeOut() ;
       }) ;
       
       $('#testSelectedCombinations').click(function(){
           var selectedCombinOption = "" ;
           
           if($('#clusteredPointsDetails input:checked').length == 0){
               $('#clusterPointsDetailContainerErrors').text("Please select at least one combination!").fadeIn() ;
           }else{
                $('#clusterPointsDetailContainerErrors').fadeOut() ;
                $('#clusteredPointsDetails input:checked').each(function() {                
                    selectedCombinOption += '<option>'+$(this).attr('value')+'</option>' ;
                });
                $('#selectmenuContainerCombinationsLeft .selectpicker').html(selectedCombinOption) ;
                $('#selectmenuContainerCombinationsRight .selectpicker').html(selectedCombinOption) ;
                $('.selectpicker').selectpicker('refresh');
                $('#fornatestContainer,#overlay').fadeIn() ;
            }
       }) ;
       
       $('#closeTestContainer').click(function(){
            $('#fornatestContainer').fadeOut() ;
            $('#rna_ss_left,#rna_ss_right').html("");
            $('#outcomesLeft,#outcomesRight').fadeOut() ;
       }) ;
       
       $('#runTestLeft').click(function(){
            $('#outcomesLeft').fadeOut() ;
            var struct = $('.btn', '#selectmenuContainerStructuresLeft').attr('title').split(",") ;
            var options = {'structure': struct[1], 'sequence': struct[0]};
            var param = $('.btn', '#selectmenuContainerCombinationsLeft').attr('title').split(",") ;
            var inputParam = {'applyForce': true, 'allowPanningAndZooming': true, 'initialSize':[700,500],
                'friction': param[0],
                'middleCharge': param[1],
                'otherCharge': param[1],
                'linkDistanceMultiplier': 15,
                'chargeDistance': param[2]
            } ;
            var container = new fornac.FornaContainer("#rna_ss_left", inputParam); 
            var jsoncode = container.addRNA(options.structure, options);
            
            function writeSVG(){
                var svg = $('#rna_ss_left svg')[0] ;
                var svg_string = new XMLSerializer().serializeToString(svg);
                return svg_string;
            }
            
            setTimeout(function(){
                var links = jsoncode.links ;

                console.log(jsoncode) ;

                var backbonelinkcollisions = 0 ;
                var basepairlinkcollsions = 0 ;
                for(var i = 0 ; i < links.length ; i++){

                    for(var j = 0 ; j < links.length ; j++){

                        // backbone collision check
                        // for basepair collision check: (links[i].linkType === "basepair" && links[j].linkType === "basepair"
                        if(i!=j 
                           && links[i].linkType !== "fake" && links[j].linkType !== "fake" 
                           && links[i].linkType !== "fake_fake" && links[j].linkType !== "fake_fake"
                           && links[i].linkType === "backbone" && links[j].linkType === "backbone"
                           && links[i].source.nodeType !== "middle" && links[i].target.nodeType !== "middle"
                           && links[j].source.nodeType !== "middle" && links[j].target.nodeType !== "middle"
                           && links[i].source.num != links[j].target.num && links[i].target.num != links[j].source.num
                           && links[i].source.num != -1 && links[i].target.num != -1 
                           && links[j].source.num != -1 && links[j].target.num != -1){                  


                        if(line_intersects(links[i].source.x, links[i].source.y, links[i].target.x, links[i].target.y, links[j].source.x, links[j].source.y, links[j].target.x, links[j].target.y)){
                              /*  console.log(links[i].source.name + "(" + links[i].source.num + ") -> " + links[i].target.name + "(" + links[i].target.num + ") ; type: " + links[i].linkType) ;
                                console.log("is intersecting") ;
                                console.log(links[j].source.name + "(" + links[j].source.num + ") -> " + links[j].target.name + "(" + links[j].target.num + ") ; type: " + links[i].linkType) ;*/
                                backbonelinkcollisions++ ;
                            }

                        }

                         if(i!=j 
                           && links[i].linkType !== "fake" && links[j].linkType !== "fake" 
                           && links[i].linkType !== "fake_fake" && links[j].linkType !== "fake_fake"
                           && links[i].linkType === "basepair" && links[j].linkType === "basepair"
                           && links[i].source.nodeType !== "middle" && links[i].target.nodeType !== "middle"
                           && links[j].source.nodeType !== "middle" && links[j].target.nodeType !== "middle"
                           && links[i].source.num != links[j].target.num && links[i].target.num != links[j].source.num
                           && links[i].source.num != -1 && links[i].target.num != -1 
                           && links[j].source.num != -1 && links[j].target.num != -1){                  


                        if(line_intersects(links[i].source.x, links[i].source.y, links[i].target.x, links[i].target.y, links[j].source.x, links[j].source.y, links[j].target.x, links[j].target.y)){
                              /*  console.log(links[i].source.name + "(" + links[i].source.num + ") -> " + links[i].target.name + "(" + links[i].target.num + ") ; type: " + links[i].linkType) ;
                                console.log("is intersecting") ;
                                console.log(links[j].source.name + "(" + links[j].source.num + ") -> " + links[j].target.name + "(" + links[j].target.num + ") ; type: " + links[i].linkType) ;*/
                                basepairlinkcollsions++ ;
                            }

                        }
                    }
                }

                var nodes = jsoncode.nodes ;
                
                var linkc = 0 ;
                for(var i = 0 ; i < links.length ; i++){
                    if(links[i].linkType != "fake" && links[i].linkType != "fake_fake") linkc++ ;
                }
                var nodec = 0 ;
                for(var i = 0 ; i < nodes.length ; i++){
                    if(nodes[i].nodeType != "middle") nodec++ ;
                }
                var nodecollisions = 0 ;
                for(var i = 0 ; i < nodes.length ; i++){
                    for(var j = 0 ; j < nodes.length ; j++){
                        if(i!=j && nodes[i].nodeType === "nucleotide" && nodes[j].nodeType === "nucleotide"){
                            var c1 = {radius: nodes[i].radius, x: nodes[i].x, y: nodes[i].y} ;
                            var c2 = {radius: nodes[j].radius, x: nodes[j].x, y: nodes[j].y} ;
                            if(circle_intersects(c1,c2)){
                                //console.log("detected node collision: " + nodes[i].name + " (" + nodes[i].num + ") " + nodes[j].name + " (" + nodes[j].num + ")") ;
                                nodecollisions++ ;
                                console.log("collisions => nuc1: " + nodes[i].num + " ; nuc2: " + nodes[j].num) ;
                            }
                        }
                    }
                }
                
                var loops = [] ;
                var roundnessPerLoop = [] ;
                // all loops ( > 4 nucleotides )
                for(var i = 0 ; i < nodes.length ; i++){
                    if(nodes[i].nodeType === "middle" && nodes[i].nucs !== undefined && nodes[i].nucs.length > 4){
                        var currentLoop = nodes[i].nucs ;
                        var loopCenter = nodes[i] ;
                        var loopNodes = [] ;
                        var distances = [] ;
                        for(var j = 0 ; j < currentLoop.length ; j++){
                            for(var k = 0 ; k < nodes.length ; k++){
                                if(nodes[k].num === currentLoop[j]){
                                    loopNodes.push(nodes[k]) ;
                                    var curdistance = Math.sqrt((loopCenter.x - nodes[k].x)*(loopCenter.x - nodes[k].x)+(loopCenter.y - nodes[k].y)*(loopCenter.y - nodes[k].y)) ;
                                    distances.push(curdistance) ;
                                }
                            }
                        }
                        console.log(loopNodes) ;
                        console.log(loopCenter) ;
                        console.log(distances) ;
                        roundnessPerLoop.push(standardDeviation(distances)) ;
                        console.log("######################") ;
                    }
                }
                
                var backbonelinkLengths = [] ;
                for(var i = 0 ; i < links.length ; i++){
                    if(links[i].linkType === "backbone"){
                        var cursource = links[i].source ;
                        var curtarget = links[i].target ;
                        var curdistance = Math.sqrt((cursource.x - curtarget.x)*(cursource.x - curtarget.x)+(cursource.y - curtarget.y)*(cursource.y - curtarget.y)) ;
                        backbonelinkLengths.push(curdistance) ;
                    }
                }
                
                console.log(backbonelinkLengths) ;
                var backbonelinkLengthDeviation = standardDeviation(backbonelinkLengths) ;
                var roundness = standardDeviation(roundnessPerLoop) ;
                $('#outcomesLeft').html('<b>Linkcollisions: </b>' + ((backbonelinkcollisions/2)+basepairlinkcollsions)+'<br/><b>Nodecollisions: </b>' + (nodecollisions/2) +
                                        '<br/><b>Backbonelink Deviation: </b>' + backbonelinkLengthDeviation + "<br/><b>Loop Roundness: </b>" + roundness).fadeIn() ;
                //console.log(writeSVG()) ;
            },5000) ;
       }) ;
       
       $('#runTestRight').click(function(){
           $('#outcomesRight').fadeOut() ;
            var struct = $('.btn', '#selectmenuContainerStructuresRight').attr('title').split(",") ;
            var options = {'structure': struct[1], 'sequence': struct[0]};
            var param = $('.btn', '#selectmenuContainerCombinationsRight').attr('title').split(",") ;
            var inputParam = {'applyForce': true, 'allowPanningAndZooming': true, 'initialSize':[700,500],
                'friction': param[0],
                'middleCharge': param[1],
                'otherCharge': param[1],
                'linkDistanceMultiplier': 15,
                'chargeDistance': param[2]
            } ;
            var container = new fornac.FornaContainer("#rna_ss_right", inputParam); 
            var jsoncode = container.addRNA(options.structure, options);
            
            function writeSVG(){
                var svg = $('#rna_ss_right svg')[0] ;
                var svg_string = new XMLSerializer().serializeToString(svg);
                return svg_string;
            }
            
            
            
            setTimeout(function(){
                var links = jsoncode.links ;


                var backbonelinkcollisions = 0 ;
                var basepairlinkcollsions = 0 ;
                for(var i = 0 ; i < links.length ; i++){

                    for(var j = 0 ; j < links.length ; j++){

                        // backbone collision check
                        // for basepair collision check: (links[i].linkType === "basepair" && links[j].linkType === "basepair"
                        if(i!=j 
                           && links[i].linkType !== "fake" && links[j].linkType !== "fake" 
                           && links[i].linkType !== "fake_fake" && links[j].linkType !== "fake_fake"
                           && links[i].linkType === "backbone" && links[j].linkType === "backbone"
                           && links[i].source.nodeType !== "middle" && links[i].target.nodeType !== "middle"
                           && links[j].source.nodeType !== "middle" && links[j].target.nodeType !== "middle"
                           && links[i].source.num != links[j].target.num && links[i].target.num != links[j].source.num
                           && links[i].source.num != -1 && links[i].target.num != -1 
                           && links[j].source.num != -1 && links[j].target.num != -1){                  


                        if(line_intersects(links[i].source.x, links[i].source.y, links[i].target.x, links[i].target.y, links[j].source.x, links[j].source.y, links[j].target.x, links[j].target.y)){
                              /*  console.log(links[i].source.name + "(" + links[i].source.num + ") -> " + links[i].target.name + "(" + links[i].target.num + ") ; type: " + links[i].linkType) ;
                                console.log("is intersecting") ;
                                console.log(links[j].source.name + "(" + links[j].source.num + ") -> " + links[j].target.name + "(" + links[j].target.num + ") ; type: " + links[i].linkType) ;*/
                                backbonelinkcollisions++ ;
                            }

                        }

                         if(i!=j 
                           && links[i].linkType !== "fake" && links[j].linkType !== "fake" 
                           && links[i].linkType !== "fake_fake" && links[j].linkType !== "fake_fake"
                           && links[i].linkType === "basepair" && links[j].linkType === "basepair"
                           && links[i].source.nodeType !== "middle" && links[i].target.nodeType !== "middle"
                           && links[j].source.nodeType !== "middle" && links[j].target.nodeType !== "middle"
                           && links[i].source.num != links[j].target.num && links[i].target.num != links[j].source.num
                           && links[i].source.num != -1 && links[i].target.num != -1 
                           && links[j].source.num != -1 && links[j].target.num != -1){                  


                        if(line_intersects(links[i].source.x, links[i].source.y, links[i].target.x, links[i].target.y, links[j].source.x, links[j].source.y, links[j].target.x, links[j].target.y)){
                              /*  console.log(links[i].source.name + "(" + links[i].source.num + ") -> " + links[i].target.name + "(" + links[i].target.num + ") ; type: " + links[i].linkType) ;
                                console.log("is intersecting") ;
                                console.log(links[j].source.name + "(" + links[j].source.num + ") -> " + links[j].target.name + "(" + links[j].target.num + ") ; type: " + links[i].linkType) ;*/
                                basepairlinkcollsions++ ;
                            }

                        }
                    }
                }

                var nodes = jsoncode.nodes ;
              
                var linkc = 0 ;
                for(var i = 0 ; i < links.length ; i++){
                    if(links[i].linkType != "fake" && links[i].linkType != "fake_fake") linkc++ ;
                }
                var nodec = 0 ;
                for(var i = 0 ; i < nodes.length ; i++){
                    if(nodes[i].nodeType != "middle") nodec++ ;
                }
                var nodecollisions = 0 ;
                for(var i = 0 ; i < nodes.length ; i++){
                    for(var j = 0 ; j < nodes.length ; j++){
                        if(i!=j && nodes[i].nodeType === "nucleotide" && nodes[j].nodeType === "nucleotide"){
                            var c1 = {radius: nodes[i].radius, x: nodes[i].x, y: nodes[i].y} ;
                            var c2 = {radius: nodes[j].radius, x: nodes[j].x, y: nodes[j].y} ;
                            if(circle_intersects(c1,c2)){
                                //console.log("detected node collision: " + nodes[i].name + " (" + nodes[i].num + ") " + nodes[j].name + " (" + nodes[j].num + ")") ;
                                nodecollisions++ ;
                            }
                        }
                    }
                }
                
                var loops = [] ;
                var roundnessPerLoop = [] ;
                // all loops ( > 4 nucleotides )
                for(var i = 0 ; i < nodes.length ; i++){
                    if(nodes[i].nodeType === "middle" && nodes[i].nucs !== undefined && nodes[i].nucs.length > 4){
                        var currentLoop = nodes[i].nucs ;
                        var loopCenter = nodes[i] ;
                        var loopNodes = [] ;
                        var distances = [] ;
                        for(var j = 0 ; j < currentLoop.length ; j++){
                            for(var k = 0 ; k < nodes.length ; k++){
                                if(nodes[k].num === currentLoop[j]){
                                    loopNodes.push(nodes[k]) ;
                                    var curdistance = Math.sqrt((loopCenter.x - nodes[k].x)*(loopCenter.x - nodes[k].x)+(loopCenter.y - nodes[k].y)*(loopCenter.y - nodes[k].y)) ;
                                    distances.push(curdistance) ;
                                }
                            }
                        }
                        console.log(loopNodes) ;
                        console.log(loopCenter) ;
                        console.log(distances) ;
                        roundnessPerLoop.push(standardDeviation(distances)) ;
                        console.log("######################") ;
                    }
                }
                
                var backbonelinkLengths = [] ;
                for(var i = 0 ; i < links.length ; i++){
                    if(links[i].linkType === "backbone"){
                        var cursource = links[i].source ;
                        var curtarget = links[i].target ;
                        var curdistance = Math.sqrt((cursource.x - curtarget.x)*(cursource.x - curtarget.x)+(cursource.y - curtarget.y)*(cursource.y - curtarget.y)) ;
                        backbonelinkLengths.push(curdistance) ;
                    }
                }
                
                console.log(backbonelinkLengths) ;
                var backbonelinkLengthDeviation = standardDeviation(backbonelinkLengths) ;
                var roundness = standardDeviation(roundnessPerLoop) ;

               
                $('#outcomesRight').html('<b>Linkcollisions: </b>' + ((backbonelinkcollisions/2)+basepairlinkcollsions)+'<br/><b>Nodecollisions: </b>' + (nodecollisions/2) +
                                        '<br/><b>Backbonelink Deviation: </b>' + backbonelinkLengthDeviation + "<br/><b>Loop Roundness: </b>" + roundness).fadeIn() ;

            },5000) ;
       }) ;
        
        $('#updateDashboard').click(function(){
            filterClicked = true ;
            var frictionLower = $('#frictionLowerSliderVal').val() ;
            var frictionUpper = $('#frictionUpperSliderVal').val() ;
            var chargeLower = $('#chargeLowerSliderVal').val() ;
            var chargeUpper = $('#chargeUpperSliderVal').val() ;
            var chargeDistanceLower = $('#chargeDistanceLowerSliderVal').val() ;
            var chargeDistanceUpper = $('#chargeDistanceUpperSliderVal').val() ;
            var structSizeLower = $("#structureSizeLowerSliderVal").val() ;
            var structSizeUpper = $("#structureSizeUpperSliderVal").val() ;
            var ncUpper = $("#nodeCollisionSliderValue").val() ;
            var lcUpper = $("#linkCollisionSliderValue").val() ;
            //setUiLoading() ;
            $('.structSizeMenuItem').each(function(){
                if(!(+$(this).text() >= structSizeLower && +$(this).text() <= structSizeUpper)){
                    $(this).hide() ;
                } else{
                    $(this).show() ;
                }
            }) ;
            $('#selectedStructsizeLabel').text(structSizeLower) ;
            reloadInputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
            reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper, "null", structSizeLower, structSizeUpper, ncUpper, lcUpper) ;
        }) ;
                
        $('#nodeCollisionsButton').click(function(){
            $('nav ul li').removeClass("active") ;
            $('#nodeCollisionsMenuItem').addClass("active") ;
            filterClicked = true ;
            collisionsType = "nodes" ;
            var frictionLower = $('#frictionLowerBound').val() ;
            var frictionUpper = $('#frictionUpperBound').val() ;
            var chargeLower = $('#chargeLowerBound').val() ;
            var chargeUpper = $('#chargeUpperBound').val() ;
            var chargeDistanceLower = $('#chargeDistanceLowerBound').val() ;
            var chargeDistanceUpper = $('#chargeDistanceUpperBound').val() ;
            var structSizeLower = $("#ssLowerBound").val() ;
            var structSizeUpper = $("#ssUpperBound").val() ;
            setUiLoading() ;
            reloadInputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
            reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper, "null", structSizeLower, structSizeUpper, nodColUpper, linkColUpper) ;
        }) ;
        
        $('#linkCollisionsButton').click(function(){
            $('nav ul li').removeClass("active") ;
            $('#linkCollisionsMenuItem').addClass("active") ;
            filterClicked = true ;
            collisionsType = "links" ;
            var frictionLower = $('#frictionLowerBound').val() ;
            var frictionUpper = $('#frictionUpperBound').val() ;
            var chargeLower = $('#chargeLowerBound').val() ;
            var chargeUpper = $('#chargeUpperBound').val() ;
            var chargeDistanceLower = $('#chargeDistanceLowerBound').val() ;
            var chargeDistanceUpper = $('#chargeDistanceUpperBound').val() ;
             var structSizeLower = $("#ssLowerBound").val() ;
            var structSizeUpper = $("#ssUpperBound").val() ;
            setUiLoading() ;
            
            reloadInputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
            reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper, "null", structSizeLower, structSizeUpper, nodColUpper, linkColUpper) ;
        }) ;
        
        
                
        $('.chartContainer').bind('DOMNodeInserted DOMNodeRemoved', function() {
            if ($(".loadingPlaceHolder", $(this)).length > 0){ 
                if(numChartsLoaded++ === 14){
                    if(!filterClicked)
                        $('#loadingOverlay').fadeOut('slow') ;
                    else{
                        numChartsLoaded = 1 ;
                        filterClicked = false ;
                    }
                }else{
                    if(!filterClicked)
                        $('#currentDiagramLoading').text(numChartsLoaded) ;
                }
            }
        });
    
        $('#inputParamFilterLabel').click(function(){
            if($('#inputParamFilterLabel').hasClass('closed')){
                $('#inputParamFilterLabel').hide() ;
                $('#inputParametersContainer').show() ;
                $('#inputParamFilterLabel').removeClass("closed") ;
            }
        }) ;
    
        $('#closeFilters').click(function(){
            $('#inputParametersContainer').hide() ;
            $('#inputParamFilterLabel').show() ;
            $('#inputParamFilterLabel').addClass("closed") ;
        }) ;
        
        $('#paretoContainer,#paretoStructSizeMenuContainer').mouseenter(function(){
            $('#paretoStructSizeMenuContainer').fadeIn("slow") ;
        }) ;
        
        $('#paretoContainer').mouseleave(function(){
            $('#paretoStructSizeMenuContainer').fadeOut("slow") ;
        }) ;
        function updatePar(){
            
        }
        
        $('#nodeColChartContainer,#toogleButtonsNodeColScatter').mouseenter(function(){
            $('#toogleButtonsNodeColScatter').fadeIn("slow") ;
        }) ;
        
        $('#nodeColChartContainer').mouseleave(function(){
            $('#toogleButtonsNodeColScatter').fadeOut("slow") ;
        }) ;
        
        $('#linkColChartContainer,#toogleButtonsLinkColScatter').mouseenter(function(){
            $('#toogleButtonsLinkColScatter').fadeIn("slow") ;
        }) ;
        
        $('#linkColChartContainer').mouseleave(function(){
            $('#toogleButtonsLinkColScatter').fadeOut("slow") ;
        }) ;
    }
    
    function setUiLoading(){
        numChartsLoaded = 1 ;
        $('#currentDiagramLoading').text(1) ;
        $('#loadingOverlay').fadeIn('slow') ;
        $('.chartContainer').html('<div class="loadingPlaceHolder"><span class="glyphicon glyphicon-stats"></span></div>') ;
    }
    function reloadInputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper){
        $("#frictionValueDistributionLoadingContainer, #chargeValueDistributionLoadingContainer, #chargeDistanceValueDistributionLoadingContainer, #frictionChargeScatterLoadingContainer").fadeIn() ;
        $("#frictionChargeDistanceScatterLoadingContainer, #chargeDistanceChargeScatterLoadingContainer, #frictionFrequencyDistributionLoadingContainer, #chargeFrequencyDistributionLoadingContainer").fadeIn() ;
        $("#chargeDistanceFrequencyDistributionLoadingContainer, #nodeCollisionsFrictionLoadingContainer, #nodeCollisionsChargeLoadingContainer, #nodeCollisionsChargeDistanceLoadingContainer").fadeIn() ;
        drawInputParameterHistograms(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
        //drawInputParameterValueDistributions(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
        drawInputParameterScatters(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
        
    }
    function reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper,selectedCombinKey,structSizeLower,structSizeUpper,ncUpper, lcUpper){
        $("#paretoLoadingContainer, #nodeColScatterLoadingContainer, #linkColScatterLoadingContainer").fadeIn() ;
        //drawChartsNodecollisionsGroupedByInputParams(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper) ;
        drawHeatmap(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper,structSizeLower,structSizeUpper, ncUpper, lcUpper,selectedMetrics[0]) ;
        drawHeatmap2(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper,structSizeLower,structSizeUpper, ncUpper, lcUpper,selectedMetrics[1]) ;
        drawParetoScatter($('#selectedStructsizeLabel').text(),frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper, ncUpper, lcUpper, selectedMetrics[0], selectedMetrics[1]) ;
    }
    function setInputParameterBounds(fl, fu, cl, cu, cdl, cdu, sl, su, lcu, ncu){
        frictionLowerBoundVal = frictionLower = fl ;
        frictionUpperBoundVal = frictionUpper = fu ;
        chargeLowerBoundVal = chargeLower = cl ;
        chargeUpperBoundVal = chargeUpper = cu ;
        chargeDistanceLowerBoundVal  = chargeDistanceLower = cdl ;
        chargeDistanceUpperBoundVal = chargeDistanceUpper = cdu ;
        if(sl !== null){
            structSizeLower = sl ;
        }
        if(su !== null){
            structSizeUpper = su ;
        }
        nodColUpper = ncu ;
        linkColUpper = lcu ;

        $('#frictionLowerBound, #frictionLowerSliderVal').val(fl) ;
        $('#frictionUpperBound, #frictionUpperSliderVal').val(fu) ;
        $('#chargeLowerBound, #chargeLowerSliderVal').val(cl) ;
        $('#chargeUpperBound, #chargeUpperSliderVal').val(cu) ;
        $('#chargeDistanceLowerBound, #chargeDistanceLowerSliderVal').val(cdl) ;
        $('#chargeDistanceUpperBound, #chargeDistanceUpperSliderVal').val(cdu) ;
        $('#ssLowerBound, #structureSizeLowerSliderVal').val(sl) ;
        $('#ssUpperBound, #structureSizeUpperSliderVal').val(su) ;
        $('#ncUpperBound, #nodeCollisionSliderValue').val(ncu) ;
        $('#lcUpperBound, #linkCollisionSliderValue').val(lcu) ;
        
        $('#curValHelper').text(frictionLower + ";" + frictionUpper + ";" + chargeLower + ";" + chargeUpper + ";" + chargeDistanceLower + ";" + chargeDistanceUpper) ;

    }
    function resetAllSelectionHighlights(){
        for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
            heatmapData.setCell(i, 3, heatmapShades[i]);
        }

        for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
            heatmapData2.setCell(i, 3, heatmapShades2[i]);
        }

        for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
            dataFrictionChargeScatter.setCell(i,2,"") ;
        }
        for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
            datafrictionChargeDistanceScatter.setCell(i,2,"") ;
        }
        for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
            dataChargeChargeDistanceScatter.setCell(i,2,"") ;
        }
        for(var i = 0 ; i < dataFrictionHisto.getNumberOfRows() ; i++){
            dataFrictionHisto.setCell(i,2,"") ;
        }
        for(var i = 0 ; i < dataChargeHisto.getNumberOfRows() ; i++){
            dataChargeHisto.setCell(i,2,"") ;
        }
        for(var i = 0 ; i < dataChargeDistanceHisto.getNumberOfRows() ; i++){
            dataChargeDistanceHisto.setCell(i,2,"") ;
        }
        /*for(var i = 0 ; i < dataFrictionDistribution.getNumberOfRows() ; i++){
            dataFrictionDistribution.setCell(i,2,"point {size: 5;}") ;
        }
        for(var i = 0 ; i < dataChargeDistribution.getNumberOfRows() ; i++){
            dataChargeDistribution.setCell(i,2,"point {size: 5;}") ;
        }
        for(var i = 0 ; i < dataChargeDistanceDistribution.getNumberOfRows() ; i++){
            dataChargeDistanceDistribution.setCell(i,2,"point {size: 5;}") ;
        }*/
        for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
            dataChargeDistanceNodecollisions.setCell(i,2,"") ;
            dataChargeDistanceNodecollisions.setCell(i,4,"") ;
        }
        for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
            dataFrictionNodecollisions.setCell(i,2,"") ;
            dataFrictionNodecollisions.setCell(i,4,"") ;
        }
        for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
            dataChargeNodecollisions.setCell(i,2,"") ;
            dataChargeNodecollisions.setCell(i,4,"") ;
        }
    }
    
    function drawChartsNodecollisionsGroupedByInputParams(frictionLower, frictionUpper, chargeLower, chargeUpper, chargeDistanceLower, chargeDistanceUpper) {    
        frictionDash = new google.visualization.Dashboard(document.getElementById('frictionDash'));
        chargeDash = new google.visualization.Dashboard(document.getElementById('chargeDash'));
        chargeDistanceDash = new google.visualization.Dashboard(document.getElementById('chargeDistanceDash'));
        nodeLinkScatterDash = new google.visualization.Dashboard(document.getElementById('nodeLinkScatterDash'));
        nodeLinkScatterDash2 = new google.visualization.Dashboard(document.getElementById('nodeLinkScatterDash2'));
        paretoDash = new google.visualization.Dashboard(document.getElementById('paretoDash'));
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getNodeCollisionsGroupedByFrictionData&collisionType=" +collisionsType+"&sm1="+selectedMetrics[0]+"&sm2="+selectedMetrics[1],
            dataType: "json"
        }).done(function( data ) {
            
            var label1 = "" ;
            var label2 = "" ;
            if(selectedMetrics[0] == "nc"){
                label1 = "Nodecollisions" ;
            } else if(selectedMetrics[0] == "lc"){
                label1 = "Linkcollisions" ;
            } else if(selectedMetrics[0] == "bld"){
                label1 = "Backbonelinklength Deviation" ;
            } else if(selectedMetrics[0] == "lr"){
                label1 = "Loop Roundness" ;
            }
            if(selectedMetrics[1] == "nc"){
                label2 = "Nodecollisions" ;
            } else if(selectedMetrics[1] == "lc"){
                label2 = "Linkcollisions" ;
            } else if(selectedMetrics[1] == "bld"){
                label2 = "Backbonelinklength Deviation" ;
            } else if(selectedMetrics[1] == "lr"){
                label2 = "Loop Roundness" ;
            }
            
            
            //console.log(frictionLowerBoundVal, frictionUpperBoundVal) ;
            dataFrictionNodecollisions = new google.visualization.DataTable();
            dataFrictionNodecollisions.addColumn('number', 'Friction');
            dataFrictionNodecollisions.addColumn('number', label1);
            dataFrictionNodecollisions.addColumn( {'type': 'string', 'role': 'style'} );
            dataFrictionNodecollisions.addColumn('number', label2);
            dataFrictionNodecollisions.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;
            var filteredData = [] ;     
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= frictionLower && decodedData.values[i][0] <= frictionUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataFrictionNodecollisions.addRows(filteredData);


            //console.log("Max: " + dataFrictionNodecollisions.getColumnRange(0).max);
            //console.log("Min: " + dataFrictionNodecollisions.getColumnRange(0).min);

            frictionNodeCollisionOptions = {
                legend:{
                    position: 'bottom'
                },
                pointSize: 5,
                explorer: {},
                chartArea: {
                    left: "14%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                height: 280,
                vAxis: {
                    title: label1 + " & " + label2,
                },
                hAxis: {
                    title: "Friction",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataFrictionNodecollisions.getColumnRange(0).max+0.01,
                      min: dataFrictionNodecollisions.getColumnRange(0).min-0.01
                    }
                }, 
                colors:['#1b9e77','#045a8d'],
                dataOpacity: 1
            };

            chartFrictionNodeCollisions = new google.visualization.LineChart(document.getElementById('nodeCollisionsFriction'));

            function selectFrictionCollisionsPointHandler() {
                var selectedItem = chartFrictionNodeCollisions.getSelection();
                var selectedFriction = dataFrictionNodecollisions.getValue(selectedItem[0].row, 0) ;

                resetAllSelectionHighlights() ;

                for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                    if(i !== selectedItem[0].row)
                        dataFrictionNodecollisions.setCell(i, 2, "point {size: 5; opacity: 1}") ;
                    else
                        dataFrictionNodecollisions.setCell(i, 2, "point {size: 5; opacity: 1; fill-color: green}") ;
                }
                chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);

                /* H E A T M A P */
                var rowsToPlaceOnTop = [] ;
                /* unselect all points and set selected points on top to avoid that they are being overplotted */
                for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                    var currentTooltipData = heatmapData.getValue(i,2) ;
                    var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                    var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text();
                    var currentValSplitted = currentTooltipValuesExtracted.split(",") ;
                    var currentFriction = currentValSplitted[0] ;
                    if(+currentFriction === selectedFriction){
                        //heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                        rowsToPlaceOnTop.push([heatmapData.getValue(i,0),heatmapData.getValue(i,1),heatmapData.getValue(i,2),"point {size: 5; fill-color: #d95f02; opacity: 1}"]) ;
                        heatmapData.removeRow(i) ;
                    }
                }
                heatmapData.addRows(rowsToPlaceOnTop) ;
                heatMapChart.draw(heatmapData, google.charts.Scatter.convertOptions(heatmapOptions));

                /* I N P U T  P A R A M E T E R  S C A T T E R S */
                var filteredRowsFrictionChargeScatter = dataFrictionChargeScatter.getFilteredRows([{column: 0, value: +selectedFriction}]) ;
                for(var i = 0 ; i < filteredRowsFrictionChargeScatter.length ; i++){
                    dataFrictionChargeScatter.setCell(filteredRowsFrictionChargeScatter[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }

                var filteredRowsFrictionChargeDistanceScatter = datafrictionChargeDistanceScatter.getFilteredRows([{column: 0, value: +selectedFriction}]) ;
                for(var i = 0 ; i < filteredRowsFrictionChargeDistanceScatter.length ; i++){
                    datafrictionChargeDistanceScatter.setCell(filteredRowsFrictionChargeDistanceScatter[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }
                chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions); 
                chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions); 

                /* I N P U T  P A R A M E T E R  H I S T O G R A M S */
                var filteredRowsFrictionHisto = dataFrictionHisto.getFilteredRows([{column: 0, value: +selectedFriction}]) ;
                for(var i = 0 ; i < filteredRowsFrictionHisto.length ; i++){
                    dataFrictionHisto.setCell(filteredRowsFrictionHisto[i], 2, "bar {fill-color: #d95f02; opacity: 1}") ;
                }
                chartFrictionHisto.draw(dataFrictionHisto, frictionHistoOptions);

                /* I N P U T  P A R A M E T E R  V A L U E  D I S T R I B U T I O N S */
                var filteredRowsFrictionDist = dataFrictionDistribution.getFilteredRows([{column: 1, value: +selectedFriction}]) ;
                for(var i = 0 ; i < filteredRowsFrictionDist.length ; i++){
                    dataFrictionDistribution.setCell(filteredRowsFrictionDist[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }
                chartFrictionDistribution.draw(dataFrictionDistribution, chargeDistanceDistributionOptions); 

            } ;


            function frictionNodeColReady(){
                $('#nodeCollisionsFrictionLoadingContainer').fadeOut() ;
            }

            google.visualization.events.addListener(chartFrictionNodeCollisions, 'ready', frictionNodeColReady);

            google.visualization.events.addListener(chartFrictionNodeCollisions, 'select', selectFrictionCollisionsPointHandler); 

            chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
        });
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getNodeCollisionsGroupedByChargeData&collisionType=" +collisionsType+"&sm1="+selectedMetrics[0]+"&sm2="+selectedMetrics[1],
            dataType: "json"
        }).done(function( data ) {
            
            var label1 = "" ;
            var label2 = "" ;
            if(selectedMetrics[0] == "nc"){
                label1 = "Nodecollisions" ;
            } else if(selectedMetrics[0] == "lc"){
                label1 = "Linkcollisions" ;
            } else if(selectedMetrics[0] == "bld"){
                label1 = "Backbonelinklength Deviation" ;
            } else if(selectedMetrics[0] == "lr"){
                label1 = "Loop Roundness" ;
            }
            if(selectedMetrics[1] == "nc"){
                label2 = "Nodecollisions" ;
            } else if(selectedMetrics[1] == "lc"){
                label2 = "Linkcollisions" ;
            } else if(selectedMetrics[1] == "bld"){
                label2 = "Backbonelinklength Deviation" ;
            } else if(selectedMetrics[1] == "lr"){
                label2 = "Loop Roundness" ;
            }
            
            dataChargeNodecollisions = new google.visualization.DataTable();
            dataChargeNodecollisions.addColumn('number', 'Charge');
            dataChargeNodecollisions.addColumn('number', label1);
            dataChargeNodecollisions.addColumn( {'type': 'string', 'role': 'style'} );
            dataChargeNodecollisions.addColumn('number', label2);
            dataChargeNodecollisions.addColumn( {'type': 'string', 'role': 'style'} );
            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= chargeLower && decodedData.values[i][0] <= chargeUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataChargeNodecollisions.addRows(filteredData);

            chargeNodeCollisionOptions = {
                legend:{
                    position: 'bottom'
                },
                pointSize: 5,
                explorer: {},
                chartArea: {
                    left: "14%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                height: 280,
                vAxis: {
                    title: label1 + " & " + label2,
                },
                hAxis: {
                    title: "Charge",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeNodecollisions.getColumnRange(0).max+2,
                      min: dataChargeNodecollisions.getColumnRange(0).min-2
                    }
                }, 
                colors:['#1b9e77','#045a8d'],
                dataOpacity: 1
            };

            chartChargeNodeCollisions = new google.visualization.LineChart(document.getElementById('nodeCollisionsCharge'));

            function selectChargeCollisionsPointHandler() {
                var selectedItem = chartChargeNodeCollisions.getSelection();
                var selectedCharge = dataChargeNodecollisions.getValue(selectedItem[0].row, 0) ;

                resetAllSelectionHighlights() ;

                /* H E A T M A P */
                var rowsToPlaceOnTop = [] ;
                /* unselect all points and set selected points on top to avoid that they are being overplotted */
                for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                    var currentTooltipData = heatmapData.getValue(i,2) ;
                    var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                    var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text();
                    var currentValSplitted = currentTooltipValuesExtracted.split(",") ;
                    var currentCharge = currentValSplitted[1] ;
                    if(+currentCharge === selectedCharge){
                        //heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                        rowsToPlaceOnTop.push([heatmapData.getValue(i,0),heatmapData.getValue(i,1),heatmapData.getValue(i,2),"point {size: 5; fill-color: #d95f02; opacity: 1}"]) ;
                        heatmapData.removeRow(i) ;
                    }
                }
                heatmapData.addRows(rowsToPlaceOnTop) ;
                heatMapChart.draw(heatmapData, google.charts.Scatter.convertOptions(heatmapOptions));

                /* remove highlighting of any previous selections */

                for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                    if(i !== selectedItem[0].row)
                        dataChargeNodecollisions.setCell(i, 2, "point {size: 5; opacity: 1}") ;
                    else
                        dataChargeNodecollisions.setCell(i, 2, "point {size: 5; opacity: 1; fill-color: green}") ;
                }
                chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);

                var filteredRowsFrictionChargeScatter = dataFrictionChargeScatter.getFilteredRows([{column: 1, value: +selectedCharge}]) ;
                for(var i = 0 ; i < filteredRowsFrictionChargeScatter.length ; i++){
                    dataFrictionChargeScatter.setCell(filteredRowsFrictionChargeScatter[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }

                var filteredRowsChargeChargeDistanceScatter = dataChargeChargeDistanceScatter.getFilteredRows([{column: 0, value: +selectedCharge}]) ;
                for(var i = 0 ; i < filteredRowsChargeChargeDistanceScatter.length ; i++){
                    dataChargeChargeDistanceScatter.setCell(filteredRowsChargeChargeDistanceScatter[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }

                chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions); 
                chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions); 

                var filteredRowsChargeHisto = dataChargeHisto.getFilteredRows([{column: 0, value: +selectedCharge}]) ;
                for(var i = 0 ; i < filteredRowsChargeHisto.length ; i++){
                    dataChargeHisto.setCell(filteredRowsChargeHisto[i], 2, "bar {fill-color: #d95f02; opacity: 1}") ;
                }
                chartChargeHisto.draw(dataChargeHisto, chargeHistoOptions); 


            } ;

            function chargeNodeColReady(){
                $('#nodeCollisionsChargeLoadingContainer').fadeOut() ;
            }

            google.visualization.events.addListener(chartChargeNodeCollisions, 'ready', chargeNodeColReady);

            google.visualization.events.addListener(chartChargeNodeCollisions, 'select', selectChargeCollisionsPointHandler); 
            chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
        });

        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getNodeCollisionsGroupedByChargeDistanceData&collisionType=" +collisionsType+"&sm1="+selectedMetrics[0]+"&sm2="+selectedMetrics[1],
            dataType: "json"
        }).done(function( data ) {
            
            var label1 = "" ;
            var label2 = "" ;
            if(selectedMetrics[0] == "nc"){
                label1 = "Nodecollisions" ;
            } else if(selectedMetrics[0] == "lc"){
                label1 = "Linkcollisions" ;
            } else if(selectedMetrics[0] == "bld"){
                label1 = "Backbonelinklength Deviation" ;
            } else if(selectedMetrics[0] == "lr"){
                label1 = "Loop Roundness" ;
            }
            if(selectedMetrics[1] == "nc"){
                label2 = "Nodecollisions" ;
            } else if(selectedMetrics[1] == "lc"){
                label2 = "Linkcollisions" ;
            } else if(selectedMetrics[1] == "bld"){
                label2 = "Backbonelinklength Deviation" ;
            } else if(selectedMetrics[1] == "lr"){
                label2 = "Loop Roundness" ;
            }
            
            dataChargeDistanceNodecollisions = new google.visualization.DataTable();
            dataChargeDistanceNodecollisions.addColumn('number', 'Chargedistance');
            dataChargeDistanceNodecollisions.addColumn('number', label1);
            dataChargeDistanceNodecollisions.addColumn( {'type': 'string', 'role': 'style'} );
            dataChargeDistanceNodecollisions.addColumn('number', label2);
            dataChargeDistanceNodecollisions.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= chargeDistanceLower && decodedData.values[i][0] <= chargeDistanceUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataChargeDistanceNodecollisions.addRows(filteredData);
            chargeDistanceNodeCollisionOptions = {
                legend:{
                    position: 'bottom'
                },
                pointSize: 5,
                explorer: {},
                chartArea: {
                    left: "14%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                height: 280,
                vAxis: {
                    title: label1 + " & " + label2,
                },
                hAxis: {
                    title: "Chargedistance",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeDistanceNodecollisions.getColumnRange(0).max+2,
                      min: dataChargeDistanceNodecollisions.getColumnRange(0).min-2
                    }
                }, 
                colors:['#1b9e77','#045a8d'],
                dataOpacity: 1
            };

            chartChargedistanceNodeCollisions = new google.visualization.LineChart(document.getElementById('nodeCollisionsChargedistance')); 

            function selectChargeDistanceCollisionsPointHandler(){
                var selectedItem = chartChargedistanceNodeCollisions.getSelection();
                var selectedChargeDistance = dataChargeDistanceNodecollisions   .getValue(selectedItem[0].row, 0) ;

                resetAllSelectionHighlights() ;

                /* H E A T M A P */
                var rowsToPlaceOnTop = [] ;
                /* unselect all points and set selected points on top to avoid that they are being overplotted */
                for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                    var currentTooltipData = heatmapData.getValue(i,2) ;
                    var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                    var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text();
                    var currentValSplitted = currentTooltipValuesExtracted.split(",") ;
                    var currentChargeDistance = currentValSplitted[2] ;
                    if(+currentChargeDistance === selectedChargeDistance){
                        //heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                        rowsToPlaceOnTop.push([heatmapData.getValue(i,0),heatmapData.getValue(i,1),heatmapData.getValue(i,2),"point {size: 5; fill-color: #d95f02; opacity: 1}"]) ;
                        heatmapData.removeRow(i) ;
                    }
                }
                heatmapData.addRows(rowsToPlaceOnTop) ;
                heatMapChart.draw(heatmapData, google.charts.Scatter.convertOptions(heatmapOptions));

                for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                    if(i !== selectedItem[0].row)
                        dataChargeDistanceNodecollisions.setCell(i, 2, "point {size: 5; opacity: 1}") ;
                    else
                        dataChargeDistanceNodecollisions.setCell(i, 2, "point {size: 5; opacity: 1; fill-color: green}") ;
                }
                chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);

                var filteredRowsChargeDistanceHisto = dataChargeDistanceHisto.getFilteredRows([{column: 0, value: +selectedChargeDistance}]) ;
                for(var i = 0 ; i < filteredRowsChargeDistanceHisto.length ; i++){
                    dataChargeDistanceHisto.setCell(filteredRowsChargeDistanceHisto[i], 2, "bar {fill-color: #d95f02; opacity: 1}") ;
                }
                chartChargedistanceHisto.draw(dataChargeDistanceHisto, chargeDistanceHistoOptions); 

                var filteredRowsChargeDistanceDist = dataChargeDistanceDistribution.getFilteredRows([{column: 1, value: +selectedChargeDistance }]) ;
                for(var i = 0 ; i < filteredRowsChargeDistanceDist.length ; i++){
                    dataChargeDistanceDistribution.setCell(filteredRowsChargeDistanceDist[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }
                chartChargedistanceDistribution.draw(dataChargeDistanceDistribution, chargeDistanceDistributionOptions); 

                var filteredRowsFrictionChargeDistanceScatter = datafrictionChargeDistanceScatter.getFilteredRows([{column: 1, value: +selectedChargeDistance}]) ;
                for(var i = 0 ; i < filteredRowsFrictionChargeDistanceScatter.length ; i++){
                    datafrictionChargeDistanceScatter.setCell(filteredRowsFrictionChargeDistanceScatter[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }

                var filteredRowsChargeChargeDistanceScatter = dataChargeChargeDistanceScatter.getFilteredRows([{column: 1, value: +selectedChargeDistance}]) ;
                for(var i = 0 ; i < filteredRowsChargeChargeDistanceScatter.length ; i++){
                    dataChargeChargeDistanceScatter.setCell(filteredRowsChargeChargeDistanceScatter[i], 2, "point {size: 5; fill-color: #d95f02; opacity: 1}") ;
                }
                chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions); 
                chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
            }            

            function chargeDistanceNodeColReady(){
                $('#nodeCollisionsChargeDistanceLoadingContainer').fadeOut() ;
            }

            google.visualization.events.addListener(chartChargedistanceNodeCollisions, 'ready', chargeDistanceNodeColReady);

            google.visualization.events.addListener(chartChargedistanceNodeCollisions, 'select', selectChargeDistanceCollisionsPointHandler);            
            chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
        });
        
    }
    function drawInputParameterHistograms(frictionLower, frictionUpper, chargeLower, chargeUpper, chargeDistanceLower, chargeDistanceUpper) {
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getFrictionHistogramData",
            dataType: "json"
        }).done(function( data ) {
            dataFrictionHisto = new google.visualization.DataTable();
            dataFrictionHisto.addColumn('number', 'Friction');
            dataFrictionHisto.addColumn('number', 'Frequency');
            dataFrictionHisto.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= frictionLower && decodedData.values[i][0] <= frictionUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataFrictionHisto.addRows(filteredData);

            frictionHistoOptions = {
                bar: { groupWidth: "60%" },
                legend:{
                    position: 'none'
                },
                pointSize: 5,
                dataOpacity: 1,
                explorer: {},
                chartArea: {
                    left: "15%",
                    top: "3%",
                    height: "80%",
                    width: "90%"
                },
                height: 280,
                vAxis: {
                    title: "Fequency",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataFrictionHisto.getColumnRange(1).max+2,
                      min: 0
                    },
                },
                hAxis: {
                    title: "Friction",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataFrictionHisto.getColumnRange(0).max+0.01,
                      min: dataFrictionHisto.getColumnRange(0).min-0.01
                    },
                },
                colors: ["#1b9e77"]
            };           

            var frictionControl = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'frictionControl',
                    options: {
                        filterColumnIndex: 0,
                        ui: {
                            snapToData: true,
                            chartOptions: {
                                height: 30,
                                colors: ["#1b9e77"],
                                dataOpacity: 0.7,
                                chartArea: {
                                   left: "10%",
                                   width: "90%"
                                }
                            },
                            chartView: {
                                columns: [0, 1]
                            }
                        }
                    }
                });

            chartFrictionHisto = new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                containerId: 'frictionFrequencyDistribution',
                options: frictionHistoOptions
            });

            var frictFilterChangeTimer = null ;
            function frictionFilterChanged(){
                if(frictFilterChangeTimer){
                    clearTimeout(frictFilterChangeTimer); //cancel the previous timer.
                    frictFilterChangeTimer = null;
                }
                frictFilterChangeTimer = setTimeout(function(){
                    resetAllSelectionHighlights() ;
                    var state = frictionControl.getState() ;
                    frictionLower = state.range.start ;
                    frictionUpper = state.range.end ;

                    var view1 = new google.visualization.DataView(datafrictionChargeDistanceScatter) ;
                    view1.setRows(view1.getFilteredRows([{column: 1, minValue: frictionLower, maxValue: frictionUpper}, {column: 0, minValue: chargeDistanceLower, maxValue: chargeDistanceUpper}])) ;
                    frictionChargeDistanceScatterOptions.vAxis.viewWindow.min = view1.getColumnRange(1).min - 0.01 ;
                    frictionChargeDistanceScatterOptions.vAxis.viewWindow.max = view1.getColumnRange(1).max + 0.01 ;
                    frictionChargeDistanceScatterOptions.hAxis.viewWindow.min = view1.getColumnRange(0).min - 2 ;
                    frictionChargeDistanceScatterOptions.hAxis.viewWindow.max = view1.getColumnRange(0).max + 2 ;
                    chartFrictionChargeDistanceScatter.draw(view1, frictionChargeDistanceScatterOptions) ;

                    var view2 = new google.visualization.DataView(dataFrictionChargeScatter) ;
                    view2.setRows(view2.getFilteredRows([{column: 1, minValue: chargeLower, maxValue: chargeUpper}, {column: 0, minValue: frictionLower, maxValue: frictionUpper}])) ;
                    frictionChargeScatterOptions.vAxis.viewWindow.min = view2.getColumnRange(1).min - 2 ;
                    frictionChargeScatterOptions.vAxis.viewWindow.max = view2.getColumnRange(1).max + 2 ;
                    frictionChargeScatterOptions.hAxis.viewWindow.min = view2.getColumnRange(0).min - 0.01 ;
                    frictionChargeScatterOptions.hAxis.viewWindow.max = view2.getColumnRange(0).max + 0.01 ;
                    chartFrictionChargeScatter.draw(view2, frictionChargeScatterOptions) ;


                    var view3 = new google.visualization.DataView(dataFrictionNodecollisions);
                    view3.setRows(view3.getFilteredRows([{column: 0, minValue: frictionLower, maxValue: frictionUpper}]));
                    frictionNodeCollisionOptions.hAxis.viewWindow.min = view3.getColumnRange(0).min - 0.01 ;
                    frictionNodeCollisionOptions.hAxis.viewWindow.max = view3.getColumnRange(0).max + 0.01 ;
                    chartFrictionNodeCollisions.draw(view3, frictionNodeCollisionOptions);

                    $('#nodeColScatterLoadingContainer').fadeIn() ;
                    $('#linkColScatterLoadingContainer').fadeIn() ;
                    $('#paretoLoadingContainer').fadeIn() ;
                    $('#curValHelper').text(frictionLower + ";" + frictionUpper + ";" + chargeLower + ";" + chargeUpper + ";" + chargeDistanceLower + ";" + chargeDistanceUpper) ;
                    reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper,"null",structSizeLower,structSizeUpper,nodColUpper, linkColUpper) ;

                }, 1000) ;
            }
            google.visualization.events.addListener(frictionControl, 'statechange', frictionFilterChanged);


            //chartFrictionHisto = new google.visualization.ColumnChart(document.getElementById('frictionFrequencyDistribution'));


            function selectedFrictionBarHandler(){
                var selectedItem = chartFrictionHisto.getChart().getSelection();
                if(selectedItem.length === 0){
                    selectedInputPrameters[0] = null ;
                    $('#selectedFrictionContainer').text("none") ;
                    resetAllSelectionHighlights() ;
                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,paretoShades[i]) ;
                        } else{
                            paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;

                } else{
                    var selectedFriction = dataFrictionHisto.getValue(selectedItem[0].row, 0) ;
                    $('#selectedFrictionContainer').text(selectedFriction) ;
                    selectedInputPrameters[0] = selectedFriction ;
                    console.log(selectedInputPrameters) ;
                    resetAllSelectionHighlights() ;
//                    $('#paretoLoadingContainer').fadeIn() ;
//                    $('#linkColScatterLoadingContainer').fadeIn() ;
//                    $('#nodeColScatterLoadingContainer').fadeIn() ;
//                    $('#frictionChargeScatterLoadingContainer').fadeIn() ;
//                    $('#frictionChargeDistanceScatterLoadingContainer').fadeIn() ;
////                    $('#frictionValueDistributionLoadingContainer').fadeIn() ;
//                    $('#nodeCollisionsFrictionLoadingContainer').fadeIn() ;
//
                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,paretoShades[i]) ;
                        } else{
                            paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }

                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        var currentTooltipData = isNoParetoPoint ? paretoScatterData.getValue(i,2) : paretoScatterData.getValue(i,5) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text() ;
                        var currentTooltipValuesSplitted = currentTooltipValuesExtracted.split(";") ;

                        for(var j = 0 ; j < currentTooltipValuesSplitted.length ; j++){
                            var curfric = +currentTooltipValuesSplitted[j].split(",")[0] ;
                            var curcharge = +currentTooltipValuesSplitted[j].split(",")[1] ;
                            var curchargedistance = +currentTooltipValuesSplitted[j].split(",")[2] ;
                            if(curfric===selectedFriction && (selectedInputPrameters[1] === null || curcharge === selectedInputPrameters[1]) && (selectedInputPrameters[2] === null || curchargedistance === selectedInputPrameters[2])){
                                if(isNoParetoPoint)
                                    paretoScatterData.setCell(i,3,"point {fill-color: #d95f02; opacity: 1}") ;
                                else
                                    paretoScatterData.setCell(i,6,"point {fill-color: #d95f02; opacity: 1}") ;
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        for(var j = 0 ; j < currentTooltipValuesExtracted.length ; j++){
                            var curfric = +currentTooltipValuesExtracted[j].split(",")[0] ;
                            var curcharge = +currentTooltipValuesExtracted[j].split(",")[1] ;
                            var curchargedistance = +currentTooltipValuesExtracted[j].split(",")[2] ;
                            if(curfric===selectedFriction && (selectedInputPrameters[1] === null || curcharge === selectedInputPrameters[1]) && (selectedInputPrameters[2] === null || curchargedistance === selectedInputPrameters[2])){
                                heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData2.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        for(var j = 0 ; j < currentTooltipValuesExtracted.length ; j++){
                            var curfric = +currentTooltipValuesExtracted[j].split(",")[0] ;
                            var curcharge = +currentTooltipValuesExtracted[j].split(",")[1] ;
                            var curchargedistance = +currentTooltipValuesExtracted[j].split(",")[2] ;
                            if(curfric===selectedFriction && (selectedInputPrameters[1] === null || curcharge === selectedInputPrameters[1]) && (selectedInputPrameters[2] === null || curchargedistance === selectedInputPrameters[2])){
                                heatmapData2.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                                break ;
                            }
                        }
                    }
//                    
//                    
                    for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
                        if(dataFrictionChargeScatter.getValue(i,0)===selectedFriction && ( selectedInputPrameters[1] === null || selectedInputPrameters[1] === dataFrictionChargeScatter.getValue(i,1))){
                            dataFrictionChargeScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02  }") ;
                        }
                    }
                    for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
                        if(datafrictionChargeDistanceScatter.getValue(i,1)===selectedFriction && ( selectedInputPrameters[2] === null || selectedInputPrameters[2] === datafrictionChargeDistanceScatter.getValue(i,0))){
                            datafrictionChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
                        if(!(selectedInputPrameters[1] === null && selectedInputPrameters[2] === null) &&  (selectedInputPrameters[1] === null || dataChargeChargeDistanceScatter.getValue(i,0)===selectedInputPrameters[1]) && (selectedInputPrameters[2] === null || selectedInputPrameters[2] === dataChargeChargeDistanceScatter.getValue(i,1))){
                            dataChargeChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }

                    for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                        if(dataFrictionNodecollisions.getValue(i,0) === selectedFriction){
                            dataFrictionNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataFrictionNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                        if(selectedInputPrameters[1] !== null && dataChargeNodecollisions.getValue(i,0) === selectedInputPrameters[1]){
                            dataChargeNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataChargeNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                        if(selectedInputPrameters[2] !== null && dataChargeDistanceNodecollisions.getValue(i,0) === selectedInputPrameters[2]){
                            dataChargeDistanceNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataChargeDistanceNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }

                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);

                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }
            }            

            function chartFrictionHistoReady(){
                $('#frictionFrequencyDistributionLoadingContainer').fadeOut() ;
            }

            google.visualization.events.addListener(chartFrictionHisto, 'ready', chartFrictionHistoReady);
            google.visualization.events.addListener(chartFrictionHisto, 'select', selectedFrictionBarHandler);            
            frictionDash.bind([frictionControl], [chartFrictionHisto]);
            frictionDash.draw(dataFrictionHisto);
            //chartFrictionHisto.draw(dataFrictionHisto, frictionHistoOptions);
        });
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getChargeHistogramData",
            dataType: "json"
        }).done(function( data ) {
            dataChargeHisto = new google.visualization.DataTable();
            dataChargeHisto.addColumn('number', 'Charge');
            dataChargeHisto.addColumn('number', 'Frequency');
            dataChargeHisto.addColumn( {'type': 'string', 'role': 'style'} );


            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= chargeLower && decodedData.values[i][0] <= chargeUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataChargeHisto.addRows(filteredData);

            chargeHistoOptions = {
                bar: { groupWidth: "60%" },
                legend:{
                    position: 'none'
                },
                pointSize: 5,
                dataOpacity: 1,
                explorer: {},
                chartArea: {
                    left: "15%",
                    top: "3%",
                    height: "80%",
                    width: "90%"
                },
                height: 280,
                vAxis: {
                    title: "Fequency",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeHisto.getColumnRange(1).max+2,
                      min: 0
                    }
                },
                hAxis: {
                    title: "Charge",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeHisto.getColumnRange(0).max+2,
                      min: dataChargeHisto.getColumnRange(0).min-2
                    },
                },
                colors: ["#1b9e77"]
            };

            var chargeControl = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'chargeControl',
                    options: {
                        filterColumnIndex: 0,
                        ui: {
                            snapToData: true,
                            chartOptions: {
                                colors: ["#1b9e77"],
                                dataOpacity: 0.7,
                                height: 30,
                                chartArea: {
                                   left: "10%",
                                   width: "90%"
                                }
                            },
                            chartView: {
                                columns: [0, 1]
                            }
                        }
                    }
                });

            chartChargeHisto = new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                containerId: 'chargeFrequencyDistribution',
                options: chargeHistoOptions
            });

            var chargeFilterChangeTimer = null ;
            function chargeFilterChanged(){
                if(chargeFilterChangeTimer){
                    clearTimeout(chargeFilterChangeTimer); //cancel the previous timer.
                    chargeFilterChangeTimer = null;
                }
                chargeFilterChangeTimer = setTimeout(function(){
                    resetAllSelectionHighlights() ;
                    var state = chargeControl.getState() ;
                    chargeLower = state.range.start ;
                    chargeUpper = state.range.end ;

                    var view1 = new google.visualization.DataView(dataChargeChargeDistanceScatter) ;
                    view1.setRows(view1.getFilteredRows([{column: 0, minValue: chargeLower, maxValue: chargeUpper}, {column: 1, minValue: chargeDistanceLower, maxValue: chargeDistanceUpper}])) ;
                    chargeChargeDistanceScatterOptions.vAxis.viewWindow.min = view1.getColumnRange(1).min - 2 ;
                    chargeChargeDistanceScatterOptions.vAxis.viewWindow.max = view1.getColumnRange(1).max + 2 ;
                    chargeChargeDistanceScatterOptions.hAxis.viewWindow.min = view1.getColumnRange(0).min - 2 ;
                    chargeChargeDistanceScatterOptions.hAxis.viewWindow.max = view1.getColumnRange(0).max + 2 ;
                    chartChargeChargedistanceScatter.draw(view1, chargeChargeDistanceScatterOptions) ;

                    var view2 = new google.visualization.DataView(dataFrictionChargeScatter) ;
                    view2.setRows(view2.getFilteredRows([{column: 1, minValue: chargeLower, maxValue: chargeUpper}, {column: 0, minValue: frictionLower, maxValue: frictionUpper}])) ;
                    frictionChargeScatterOptions.vAxis.viewWindow.min = view2.getColumnRange(1).min - 2 ;
                    frictionChargeScatterOptions.vAxis.viewWindow.max = view2.getColumnRange(1).max + 2 ;
                    frictionChargeScatterOptions.hAxis.viewWindow.min = view2.getColumnRange(0).min - 0.01 ;
                    frictionChargeScatterOptions.hAxis.viewWindow.max = view2.getColumnRange(0).max + 0.01 ;
                    chartFrictionChargeScatter.draw(view2, frictionChargeScatterOptions) ;


                    var view3 = new google.visualization.DataView(dataChargeNodecollisions);
                    view3.setRows(view3.getFilteredRows([{column: 0, minValue: chargeLower, maxValue: chargeUpper}]));
                    chargeNodeCollisionOptions.hAxis.viewWindow.min = view3.getColumnRange(0).min - 2 ;
                    chargeNodeCollisionOptions.hAxis.viewWindow.max = view3.getColumnRange(0).max + 2 ;
                    chartChargeNodeCollisions.draw(view3, chargeNodeCollisionOptions);

                    $('#nodeColScatterLoadingContainer').fadeIn() ;
                    $('#linkColScatterLoadingContainer').fadeIn() ;
                    $('#paretoLoadingContainer').fadeIn() ;
                    $('#curValHelper').text(frictionLower + ";" + frictionUpper + ";" + chargeLower + ";" + chargeUpper + ";" + chargeDistanceLower + ";" + chargeDistanceUpper) ;
                    reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper,"null",structSizeLower,structSizeUpper,nodColUpper, linkColUpper) ;
                }, 1000) ;
            }
            google.visualization.events.addListener(chargeControl, 'statechange', chargeFilterChanged);



            function selectedChargeBarHandler(){
                var selectedItem = chartChargeHisto.getChart().getSelection();
                if(selectedItem.length === 0){
                    selectedInputPrameters[1] = null ;
                    $('#selectedChargeContainer').text("none") ;
                    resetAllSelectionHighlights() ;
                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,paretoShades[i]) ;
                        } else{
                            paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }else{
                    var selectedCharge = dataChargeHisto.getValue(selectedItem[0].row, 0) ;
                    $('#selectedChargeContainer').text(selectedCharge) ;
                    selectedInputPrameters[1] = selectedCharge ;
                    console.log(selectedInputPrameters) ;
                    resetAllSelectionHighlights() ;
                    $('#paretoLoadingContainer').fadeIn() ;
                    $('#linkColScatterLoadingContainer').fadeIn() ;
                    $('#nodeColScatterLoadingContainer').fadeIn() ;
                    $('#frictionChargeScatterLoadingContainer').fadeIn() ;
                    $('#chargeDistanceChargeScatterLoadingContainer').fadeIn() ;
//                    $('#chargeValueDistributionLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsChargeLoadingContainer').fadeIn() ;


                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,paretoShades[i]) ;
                        } else{
                            paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }

                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        var currentTooltipData = isNoParetoPoint ? paretoScatterData.getValue(i,2) : paretoScatterData.getValue(i,5) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text() ;
                        var currentTooltipValuesSplitted = currentTooltipValuesExtracted.split(";") ;

                        for(var j = 0 ; j < currentTooltipValuesSplitted.length ; j++){
                            var curcharge = +currentTooltipValuesSplitted[j].split(",")[1] ;
                            var curfric = +currentTooltipValuesSplitted[j].split(",")[0] ;
                            var curchargedistance = +currentTooltipValuesSplitted[j].split(",")[2] ;

                            if(curcharge===selectedCharge && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === curfric) && (selectedInputPrameters[2] === null || selectedInputPrameters[2] === curchargedistance)){
                                if(isNoParetoPoint)
                                    paretoScatterData.setCell(i,3,"point {fill-color: #d95f02; opacity: 1}") ;
                                else
                                    paretoScatterData.setCell(i,6,"point {fill-color: #d95f02; opacity: 1}") ;
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        for(var j = 0 ; j < currentTooltipValuesExtracted.length ; j++){
                            var curcharge = +currentTooltipValuesExtracted[j].split(",")[1] ;
                            var curfric = +currentTooltipValuesExtracted[j].split(",")[0] ;
                            var curchargedistance = +currentTooltipValuesExtracted[j].split(",")[2] ;

                            if(curcharge===selectedCharge && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === curfric) && (selectedInputPrameters[2] === null || selectedInputPrameters[2] === curchargedistance)){
                                heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData2.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        for(var j = 0 ; j < currentTooltipValuesExtracted.length ; j++){
                            var curcharge = +currentTooltipValuesExtracted[j].split(",")[1] ;
                            var curfric = +currentTooltipValuesExtracted[j].split(",")[0] ;
                            var curchargedistance = +currentTooltipValuesExtracted[j].split(",")[2] ;
                            
                            if(curcharge===selectedCharge && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === curfric) && (selectedInputPrameters[2] === null || selectedInputPrameters[2] === curchargedistance)){
                                heatmapData2.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
                        if(dataFrictionChargeScatter.getValue(i,1)===selectedCharge && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === dataFrictionChargeScatter.getValue(i,0))){
                            dataFrictionChargeScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }

                    for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
                        if(dataChargeChargeDistanceScatter.getValue(i,0)===selectedCharge && (selectedInputPrameters[2] === null || selectedInputPrameters[2] === dataChargeChargeDistanceScatter.getValue(i,1))){
                            dataChargeChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
                        if(!(selectedInputPrameters[0] === null && selectedInputPrameters[2] === null) &&  (selectedInputPrameters === null || datafrictionChargeDistanceScatter.getValue(i,1)===selectedInputPrameters[0]) && ( selectedInputPrameters[2] === null || selectedInputPrameters[2] === datafrictionChargeDistanceScatter.getValue(i,0))){
                            datafrictionChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }

                    for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                        if(dataChargeNodecollisions.getValue(i,0) === selectedCharge){
                            dataChargeNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataChargeNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                        if(selectedInputPrameters[0] !== null && dataFrictionNodecollisions.getValue(i,0) === selectedInputPrameters[0]){
                            dataFrictionNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataFrictionNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                        if(selectedInputPrameters[2] !== null && dataChargeDistanceNodecollisions.getValue(i,0) === selectedInputPrameters[2]){
                            dataChargeDistanceNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataChargeDistanceNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    

//                    for(var i = 0 ; i < dataChargeDistribution.getNumberOfRows() ; i++){
//                        if(dataChargeDistribution.getValue(i,1) === selectedCharge){
//                            dataChargeDistribution.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
//                        }
//                    }


                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);

                }
            }            

            function chartChargeHistoReady(){
                $('#chargeFrequencyDistributionLoadingContainer').fadeOut() ;
            }

            google.visualization.events.addListener(chartChargeHisto, 'ready', chartChargeHistoReady);
            google.visualization.events.addListener(chartChargeHisto, 'select', selectedChargeBarHandler);            
            chargeDash.bind([chargeControl], [chartChargeHisto]);
            chargeDash.draw(dataChargeHisto);
        });
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getChargeDistanceHistogramData",
            dataType: "json"
        }).done(function( data ) {
            dataChargeDistanceHisto = new google.visualization.DataTable();
            dataChargeDistanceHisto.addColumn('number', 'Chargedistance');
            dataChargeDistanceHisto.addColumn('number', 'Frequency');
            dataChargeDistanceHisto.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= chargeDistanceLower && decodedData.values[i][0] <= chargeDistanceUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataChargeDistanceHisto.addRows(filteredData);

            chargeDistanceHistoOptions = {
                bar: { groupWidth: "60%" },
                legend:{
                    position: 'none'
                },
                pointSize: 5,
                dataOpacity: 1,
                explorer: {},
                chartArea: {
                    left: "15%",
                    top: "3%",
                    height: "80%",
                    width: "90%"
                },
                height: 280,
                vAxis: {
                    title: "Fequency",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeDistanceHisto.getColumnRange(1).max+2,
                      min: 0
                    }
                },
                hAxis: {
                    title: "Chargedistance",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeDistanceHisto.getColumnRange(0).max+2,
                      min: dataChargeDistanceHisto.getColumnRange(0).min-2
                    },
                },
                colors: ["#1b9e77"]
            };

            var chargeDistanceControl = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'chargeDistanceControl',
                    options: {
                        filterColumnIndex: 0,
                        ui: {
                            snapToData: true,
                            chartOptions: {
                                height: 30,
                                colors: ["#1b9e77"],
                                dataOpacity: 0.7,
                                chartArea: {
                                   left: "10%",
                                   width: "90%"
                                }
                            },
                            chartView: {
                                columns: [0, 1]
                            }
                        }
                    }
                });

            chartChargedistanceHisto = new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                containerId: 'chargeDistanceFrequencyDistribution',
                options: chargeDistanceHistoOptions
            });

            var chargeDistanceFilterChangeTimer = null ;
            function chargeDistanceFilterChanged(){
                if(chargeDistanceFilterChangeTimer){
                    clearTimeout(chargeDistanceFilterChangeTimer); //cancel the previous timer.
                    chargeDistanceFilterChangeTimer = null;
                }
                chargeDistanceFilterChangeTimer = setTimeout(function(){
                    resetAllSelectionHighlights() ;

                    var state = chargeDistanceControl.getState() ;
                    chargeDistanceLower = state.range.start ;
                    chargeDistanceUpper = state.range.end ;

                    var view1 = new google.visualization.DataView(dataChargeChargeDistanceScatter) ;
                    view1.setRows(view1.getFilteredRows([{column: 0, minValue: chargeLower, maxValue: chargeUpper}, {column: 1, minValue: chargeDistanceLower, maxValue: chargeDistanceUpper}])) ;
                    chargeChargeDistanceScatterOptions.vAxis.viewWindow.min = view1.getColumnRange(1).min - 2 ;
                    chargeChargeDistanceScatterOptions.vAxis.viewWindow.max = view1.getColumnRange(1).max + 2 ;
                    chargeChargeDistanceScatterOptions.hAxis.viewWindow.min = view1.getColumnRange(0).min - 2 ;
                    chargeChargeDistanceScatterOptions.hAxis.viewWindow.max = view1.getColumnRange(0).max + 2 ;
                    chartChargeChargedistanceScatter.draw(view1, chargeChargeDistanceScatterOptions) ;

                    var view2 = new google.visualization.DataView(datafrictionChargeDistanceScatter) ;
                    view2.setRows(view2.getFilteredRows([{column: 1, minValue: frictionLower, maxValue: frictionUpper}, {column: 0, minValue: chargeDistanceLower, maxValue: chargeDistanceUpper}])) ;
                    frictionChargeDistanceScatterOptions.vAxis.viewWindow.min = view2.getColumnRange(1).min - 0.01 ;
                    frictionChargeDistanceScatterOptions.vAxis.viewWindow.max = view2.getColumnRange(1).max + 0.01 ;
                    frictionChargeDistanceScatterOptions.hAxis.viewWindow.min = view2.getColumnRange(0).min - 2 ;
                    frictionChargeDistanceScatterOptions.hAxis.viewWindow.max = view2.getColumnRange(0).max + 2 ;
                    chartFrictionChargeDistanceScatter.draw(view2, frictionChargeDistanceScatterOptions) ;

                    var view3 = new google.visualization.DataView(dataChargeDistanceNodecollisions);
                    view3.setRows(view3.getFilteredRows([{column: 0, minValue: chargeDistanceLower, maxValue: chargeDistanceUpper}]));
                    chargeDistanceNodeCollisionOptions.hAxis.viewWindow.min = view3.getColumnRange(0).min - 2 ;
                    chargeDistanceNodeCollisionOptions.hAxis.viewWindow.max = view3.getColumnRange(0).max + 2 ;
                    chartChargedistanceNodeCollisions.draw(view3, chargeDistanceNodeCollisionOptions);

                    $('#nodeColScatterLoadingContainer').fadeIn() ;
                    $('#linkColScatterLoadingContainer').fadeIn() ;
                    $('#paretoLoadingContainer').fadeIn() ;
                    $('#curValHelper').text(frictionLower + ";" + frictionUpper + ";" + chargeLower + ";" + chargeUpper + ";" + chargeDistanceLower + ";" + chargeDistanceUpper) ;
                    reloadOutputParameterCharts(frictionLower,frictionUpper,chargeLower,chargeUpper,chargeDistanceLower,chargeDistanceUpper,"null",structSizeLower,structSizeUpper,nodColUpper, linkColUpper) ;
                }, 1000) ;
            }

            function selectedChargeDistanceBarHandler(){
                var selectedItem = chartChargedistanceHisto.getChart().getSelection();
                if(selectedItem.length === 0){
                    selectedInputPrameters[2] = null ;
                    $('#selectedChargeDistanceContainer').text("none") ;
                    resetAllSelectionHighlights() ;
                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,paretoShades[i]) ;
                        } else{
                            paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                } else {
                    var selectedChargeDistance = dataChargeDistanceHisto.getValue(selectedItem[0].row, 0) ;
                    $('#selectedChargeDistanceContainer').text(selectedChargeDistance) ;
                    selectedInputPrameters[2] = selectedChargeDistance ;
                    console.log(selectedInputPrameters) ;
                    resetAllSelectionHighlights() ;
                    $('#paretoLoadingContainer').fadeIn() ;
                    $('#linkColScatterLoadingContainer').fadeIn() ;
                    $('#nodeColScatterLoadingContainer').fadeIn() ;
                    $('#chargeDistanceChargeScatterLoadingContainer').fadeIn() ;
                    $('#frictionChargeDistanceScatterLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsChargeDistanceLoadingContainer').fadeIn() ;


                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,paretoShades[i]) ;
                        } else{
                            paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }

                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        var currentTooltipData = isNoParetoPoint ? paretoScatterData.getValue(i,2) : paretoScatterData.getValue(i,5) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text() ;
                        var currentTooltipValuesSplitted = currentTooltipValuesExtracted.split(";") ;

                        for(var j = 0 ; j < currentTooltipValuesSplitted.length ; j++){
                            var curchargedist = +currentTooltipValuesSplitted[j].split(",")[2] ;
                            var curfric = +currentTooltipValuesSplitted[j].split(",")[0] ;
                            var curcharge = +currentTooltipValuesSplitted[j].split(",")[1] ;

                            if(curchargedist===selectedChargeDistance && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === curfric) && (selectedInputPrameters[1] === null || selectedInputPrameters[1] === curcharge)){
                                if(isNoParetoPoint)
                                    paretoScatterData.setCell(i,3,"point {fill-color: #d95f02; opacity: 1}") ;
                                else
                                    paretoScatterData.setCell(i,6,"point {fill-color: #d95f02; opacity: 1}") ;
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        for(var j = 0 ; j < currentTooltipValuesExtracted.length ; j++){
                            var curchargedist = +currentTooltipValuesExtracted[j].split(",")[2] ;
                            var curfric = +currentTooltipValuesExtracted[j].split(",")[0] ;
                            var curcharge = +currentTooltipValuesExtracted[j].split(",")[1] ;
                            if(curchargedist===selectedChargeDistance && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === curfric) && (selectedInputPrameters[1] === null || selectedInputPrameters[1] === curcharge)){
                                heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData2.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        for(var j = 0 ; j < currentTooltipValuesExtracted.length ; j++){
                            var curchargedist= +currentTooltipValuesExtracted[j].split(",")[2] ;
                            var curfric = +currentTooltipValuesExtracted[j].split(",")[0] ;
                            var curcharge = +currentTooltipValuesExtracted[j].split(",")[1] ;
                            if(curchargedist===selectedChargeDistance && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === curfric) && (selectedInputPrameters[1] === null || selectedInputPrameters[1] === curcharge)){
                                heatmapData2.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                                break ;
                            }
                        }
                    }

                    for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                        if(dataChargeDistanceNodecollisions.getValue(i,0) === selectedChargeDistance){
                            dataChargeDistanceNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataChargeDistanceNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                        if(selectedInputPrameters[1] !== null && dataChargeNodecollisions.getValue(i,0) === selectedInputPrameters[1]){
                            dataChargeNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataChargeNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                        if(selectedInputPrameters[0] !== null && dataFrictionNodecollisions.getValue(i,0) === selectedInputPrameters[0]){
                            dataFrictionNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            dataFrictionNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }


                    for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
                        if(datafrictionChargeDistanceScatter.getValue(i,0)===selectedChargeDistance && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === datafrictionChargeDistanceScatter.getValue(i,1))){
                            datafrictionChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
                        if(dataChargeChargeDistanceScatter.getValue(i,1)===selectedChargeDistance && (selectedInputPrameters[1] === null || selectedInputPrameters[1] === dataChargeChargeDistanceScatter.getValue(i,0))){
                            dataChargeChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }
                    
                    for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
                        if(!(selectedInputPrameters[0] === null && selectedInputPrameters[1] === null) &&  (selectedInputPrameters[1] === null || dataFrictionChargeScatter.getValue(i,1)===selectedInputPrameters[1]) && (selectedInputPrameters[0] === null || selectedInputPrameters[0] === dataFrictionChargeScatter.getValue(i,0))){
                            dataFrictionChargeScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                        }
                    }

                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }
            }   

            function chartChargeDistanceHistoReady(){
                $('#chargeDistanceFrequencyDistributionLoadingContainer').fadeOut() ;
            }

            google.visualization.events.addListener(chargeDistanceControl, 'statechange', chargeDistanceFilterChanged);
            google.visualization.events.addListener(chartChargedistanceHisto, 'ready', chartChargeDistanceHistoReady);
            google.visualization.events.addListener(chartChargedistanceHisto, 'select', selectedChargeDistanceBarHandler);            
            chargeDistanceDash.bind([chargeDistanceControl], [chartChargedistanceHisto]);
            chargeDistanceDash.draw(dataChargeDistanceHisto);
        });
        
    }

    function drawInputParameterScatters(frictionLower, frictionUpper, chargeLower, chargeUpper, chargeDistanceLower, chargeDistanceUpper) {
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getFrictionChargeScatterData",
            dataType: "json"
        }).done(function( data ) {
            dataFrictionChargeScatter = new google.visualization.DataTable();
            dataFrictionChargeScatter.addColumn('number', 'Friction');
            dataFrictionChargeScatter.addColumn('number', 'Charge');
            dataFrictionChargeScatter.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= frictionLower && decodedData.values[i][0] <= frictionUpper &&
                   decodedData.values[i][1] >= chargeLower && decodedData.values[i][1] <= chargeUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataFrictionChargeScatter.addRows(filteredData);

            frictionChargeScatterOptions = {
                legend:{
                    position: 'none'
                },
                pointSize: 5,
                explorer: {},
                chartArea: {
                    left: "14%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                height: 300,
                vAxis: {
                    title: "Charge",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataFrictionChargeScatter.getColumnRange(1).max+2,
                      min: dataFrictionChargeScatter.getColumnRange(1).min-2
                    }
                },
                hAxis: {
                    title: "Friction",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataFrictionChargeScatter.getColumnRange(0).max+0.01,
                      min: dataFrictionChargeScatter.getColumnRange(0).min-0.01
                    }
                },
                colors: ["#1b9e77"],
                dataOpacity: 1,
            };

            function frictioChargeScatterReady(){
                $('#frictionChargeScatterLoadingContainer').fadeOut() ;
            }

            chartFrictionChargeScatter = new google.visualization.ScatterChart(document.getElementById('frictionChargeScatter'));

            google.visualization.events.addListener(chartFrictionChargeScatter, 'ready', frictioChargeScatterReady);

            chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
        });
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getFrictionChargeDistanceScatterData",
            dataType: "json"
        }).done(function( data ) {
            datafrictionChargeDistanceScatter = new google.visualization.DataTable();
            datafrictionChargeDistanceScatter.addColumn('number', 'Chargedistance');
            datafrictionChargeDistanceScatter.addColumn('number', 'Friction');
            datafrictionChargeDistanceScatter.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][1] >= frictionLower && decodedData.values[i][1] <= frictionUpper &&
                   decodedData.values[i][0] >= chargeDistanceLower && decodedData.values[i][0] <= chargeDistanceUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            datafrictionChargeDistanceScatter.addRows(filteredData) ;

            frictionChargeDistanceScatterOptions = {
                legend:{
                    position: 'none'
                },
                pointSize: 5,
                explorer: {},
                chartArea: {
                    left: "14%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                height: 300,
                vAxis: {
                    title: "Friction",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: datafrictionChargeDistanceScatter.getColumnRange(1).max+0.01,
                      min: datafrictionChargeDistanceScatter.getColumnRange(1).min-0.01
                    }
                },
                hAxis: {
                    title: "Chargedistance",
                    viewWindowMode:'explicit',
                    viewWindow:{
                        max: datafrictionChargeDistanceScatter.getColumnRange(0).max+2,
                        min: datafrictionChargeDistanceScatter.getColumnRange(0).min-2
                    }
                }, 
                colors: ["#1b9e77"],
                dataOpacity: 1,
            };

            function frictionChargeDistanceScatterReady(){
                $('#frictionChargeDistanceScatterLoadingContainer').fadeOut() ;
            }

            chartFrictionChargeDistanceScatter = new google.visualization.ScatterChart(document.getElementById('frictionChargeDistanceScatter'));


            google.visualization.events.addListener(chartFrictionChargeDistanceScatter, 'ready', frictionChargeDistanceScatterReady);

            chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
        });

        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getChargeChargeDistanceScatterData",
            dataType: "json"
        }).done(function( data ) {
            dataChargeChargeDistanceScatter = new google.visualization.DataTable();
            dataChargeChargeDistanceScatter.addColumn('number', 'Charge');
            dataChargeChargeDistanceScatter.addColumn('number', 'Chargedistance');
            dataChargeChargeDistanceScatter.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;

            var filteredData = [] ;
            for(var i = 0 ; i < decodedData.values.length ; i++){
                if(decodedData.values[i][0] >= chargeLower && decodedData.values[i][0] <= chargeUpper &&
                   decodedData.values[i][1] >= chargeDistanceLower && decodedData.values[i][1] <= chargeDistanceUpper)
                    filteredData.push(decodedData.values[i]) ;
            }
            dataChargeChargeDistanceScatter.addRows(filteredData);

            chargeChargeDistanceScatterOptions = {
                legend:{
                    position: 'none'
                },
                pointSize: 5,
                explorer: {},
                chartArea: {
                    left: "14%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                height: 300,
                vAxis: {
                    title: "Chargedistance",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeChargeDistanceScatter.getColumnRange(1).max+2,
                      min: dataChargeChargeDistanceScatter.getColumnRange(1).min-2
                    }
                },
                hAxis: {
                    title: "Charge",
                    viewWindowMode:'explicit',
                    viewWindow:{
                      max: dataChargeChargeDistanceScatter.getColumnRange(0).max+2,
                      min: dataChargeChargeDistanceScatter.getColumnRange(0).min-2
                    }
                }, 
                colors: ["#1b9e77"],
                dataOpacity: 1,
            };

            function chargeDistanceChargeScatterReadys(){
                $('#chargeDistanceChargeScatterLoadingContainer').fadeOut() ;
            }

            chartChargeChargedistanceScatter = new google.visualization.ScatterChart(document.getElementById('chargeChargeDistanceScatter'));

            google.visualization.events.addListener(chartChargeChargedistanceScatter, 'ready', chargeDistanceChargeScatterReadys);

            chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
        });

    }
    function drawHeatmap (frictionLower, frictionUpper, chargeLower, chargeUpper, chargeDistanceLower, chargeDistanceUpper, structSizeLower, structSizeUpper, ncUpper, lcUpper, selectedMetric) {
        var jitter = $('#jitterLinkCol').hasClass('selectedButton') ? true : false ;
        var verticalLabel = "" ;
        if(selectedMetric == "nc"){
            verticalLabel = "Nodecollisions" ;
        } else if(selectedMetric == "lc"){
            verticalLabel = "Linkcollisions" ;
        } else if(selectedMetric == "bld"){
            verticalLabel = "Backbonelinklength Deviation" ;
        } else if(selectedMetric == "lr"){
            verticalLabel = "Loop Roundness" ;
        }
        
        jQuery.ajaxQueue({
             url: "datarequesthandler.php?getHeatmapData&fl=" + frictionLower + "&fu=" + frictionUpper + "&cl=" + chargeLower + "&cu=" + chargeUpper
                                                                   + "&cdl=" + chargeDistanceLower + "&cdu=" + chargeDistanceUpper + "&collisionType="
                                                                   +selectedMetric+"&sl="+structSizeLower+"&su="+structSizeUpper+"&ncu="+ncUpper+"&lcu="+lcUpper
                                                                   +"&jitter="+jitter,
            dataType: "json"
        }).done(function( data ) {
            heatmapData = new google.visualization.DataTable();
            heatmapData.addColumn('number', 'Structuresize');
            heatmapData.addColumn('number', verticalLabel);
            heatmapData.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
            heatmapData.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;                
            heatmapData.addRows(decodedData.values);
            heatmapShades = [] ;
            for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                heatmapShades.push(heatmapData.getValue(i,3)) ;
            }
            //console.log("heatmpa ticks: " + decodedData.tickValues + ", test: " + [1000,2000,3000]) ;

            heatmapOptions = {
                tooltip: {
                    textStyle: {
                    },
                    isHtml: true,
                    trigger: 'both'
                },
                legend:{
                    position: 'none'
                },
                height: 230,

                explorer: {
                    maxZoomIn:0.001,
                    keepInBounds: true
                }, 
               chartArea: {
                    left: "7%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                dataOpacity: 0.3,
                pointSize: 5,
                hAxis: {
                    title: "Structuresize",
                    viewWindow: {
                    },
                },
                vAxis: {
                    title: verticalLabel,
                },
                
            };

            var structSizeControll = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'structSizeControl',
                    options: {
                        filterColumnIndex: 0,
                        ui: {
                            chartOptions: {
                                height: 30,
                                chartArea: {
                                    left: "5%",
                                    top: "3%",
                                    height: "80%",
                                    width: "100%"
                                },
                                lineWidth: 0,
                                pointSize: 5,
                                dataOpacity: 0.3,
                                colors:['#78c679'],
                            },
                            chartView: {
                                columns: [0, 1]
                            },
                            hAxis:{
                                viewWindow:{
                                    max: heatmapData.getColumnRange(0).max+50,
                                    min: heatmapData.getColumnRange(0).min-50
                                }
                            }
                        }
                    }
                });

            heatMapChart = new google.visualization.ChartWrapper({
                chartType: 'ScatterChart',
                containerId: 'overviewScatter',
                options: heatmapOptions
            });

//            var structSizeControllChangedTimer = null ;
//            function structSizeControllChanged(){
//                if(structSizeControllChangedTimer){
//                    clearTimeout(structSizeControllChangedTimer); //cancel the previous timer.
//                    structSizeControllChangedTimer = null;
//                }
//                structSizeControllChangedTimer = setTimeout(function(){
//                }, 500) ;
//            }

//            google.visualization.events.addListener(structSizeControll, 'statechange', structSizeControllChanged);

            function selectHeatmapPointHandler() {
                console.log("CLICKED POINT!!") ;
                var selectedItem = heatMapChart.getChart().getSelection();
                console.log(selectedItem) ;
                
                var selectedItem2 = heatMapChart.getChart().getSelection()[0];
                var chartDataView = heatMapChart.getDataTable();
                var rowIndex = chartDataView.getUnderlyingTableRowIndex(selectedItem2.row) ;
                //alert(rowIndex);
                console.log(">> selectedpoint:" + heatmapData.getValue(rowIndex,0) + " ; " + heatmapData.getValue(rowIndex,1)) ;

                if(selectedItem2.length === 0) {
                    resetAllSelectionHighlights() ;
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    frictionDash.draw(dataFrictionHisto);
                    chargeDash.draw(dataChargeHisto) ;
                    chargeDistanceDash.draw(dataChargeDistanceHisto) ;
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    //nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }else{
                   /* $('#nodeColScatterLoadingContainer').fadeIn() ;
                    $('#frictionChargeScatterLoadingContainer').fadeIn() ;
                    $('#chargeDistanceChargeScatterLoadingContainer').fadeIn() ;
                    $('#frictionChargeDistanceScatterLoadingContainer').fadeIn() ;
                    $('#frictionFrequencyDistributionLoadingContainer').fadeIn() ;
                    $('#chargeFrequencyDistributionLoadingContainer').fadeIn() ;
                    $('#chargeDistanceFrequencyDistributionLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsChargeDistanceLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsFrictionLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsChargeLoadingContainer').fadeIn() ;
                    $('#paretoLoadingContainer').fadeIn() ;*/

                    resetAllSelectionHighlights() ;

                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,"point {fill-color: blue; opacity: 0.3}") ;
                        } else{
                            paretoScatterData.setCell(i,6,"point {fill-color: green; opacity: 1}") ;
                        }
                    }

                    var tooltipData = heatmapData.getValue(rowIndex,2) ;
                    var dataConvertedToHtml = $('<div>',{html:tooltipData});
                    var tooltipValuesExtractedFull = dataConvertedToHtml.find('.resValues').text();
                    var tooltipValuesExtracted = tooltipValuesExtractedFull.split(";") ;

                    console.log("selectedpoint:" + heatmapData.getValue(rowIndex,0) + " ; " + heatmapData.getValue(rowIndex,1)) ;
                    console.log(tooltipValuesExtracted) ;
                    

                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        var currentTooltipData = isNoParetoPoint ? paretoScatterData.getValue(i,2) : paretoScatterData.getValue(i,5) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");
                        if (findOne(currentTooltipValuesExtracted,tooltipValuesExtracted)){
                            if(isNoParetoPoint)
                                paretoScatterData.setCell(i,3,"point {fill-color: #d95f02; opacity: 1}") ;
                            else
                                paretoScatterData.setCell(i,6,"point {fill-color: #d95f02; opacity: 1}") ;
                        }else{
                            if(isNoParetoPoint)
                                paretoScatterData.setCell(i,3,paretoShades[i]) ;
                            else
                                paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }

                    for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData2.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        if (findOne(currentTooltipValuesExtracted,tooltipValuesExtracted)){
                            heatmapData2.setCell(i,3,"point {fill-color: #d95f02; opacity: 1; size: 5}") ;
                        } else{
                            heatmapData2.setCell(i,3,heatmapShades2[i]) ;
                        }
                    }

                    for(var j = 0 ; j < tooltipValuesExtracted.length ; j++){
                        var curextr = tooltipValuesExtracted[j].split(",") ;
                        var curfric = +curextr[0] ;
                        var curcharge = +curextr[1] ;
                        var curchargedistance = +curextr[2] ;
                        for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
                            if(dataFrictionChargeScatter.getValue(i,0)===curfric&&dataFrictionChargeScatter.getValue(i,1)===curcharge){
                                //console.log("found another one: (" +curfric + " ; " + curcharge + ")" ) ;
                                dataFrictionChargeScatter.setCell(i,2,"point {fill-color: #d95f02 ; size: 5 }") ;
                            }
                        }
                        for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
                            if(datafrictionChargeDistanceScatter.getValue(i,1)===curfric&&datafrictionChargeDistanceScatter.getValue(i,0)===curchargedistance){
                                datafrictionChargeDistanceScatter.setCell(i,2,"point {fill-color: #d95f02 ; size: 5 }") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
                            if(dataChargeChargeDistanceScatter.getValue(i,0)===curcharge&&dataChargeChargeDistanceScatter.getValue(i,1)===curchargedistance){
                                dataChargeChargeDistanceScatter.setCell(i,2,"point {fill-color: #d95f02 ; size: 5 }") ;
                            }
                        }
                        for(var i = 0 ; i < dataFrictionHisto.getNumberOfRows() ; i++){
                            if(dataFrictionHisto.getValue(i,0) === curfric){
                                dataFrictionHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeHisto.getNumberOfRows() ; i++){
                            if(dataChargeHisto.getValue(i,0) === curcharge){
                                dataChargeHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeDistanceHisto.getNumberOfRows() ; i++){
                            if(dataChargeDistanceHisto.getValue(i,0) === curchargedistance){
                                dataChargeDistanceHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                            }
                        }

                        for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                            if(dataChargeDistanceNodecollisions.getValue(i,0) === curchargedistance){
                                dataChargeDistanceNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                dataChargeDistanceNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                            if(dataFrictionNodecollisions.getValue(i,0) === curfric){
                                dataFrictionNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                dataFrictionNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                            if(dataChargeNodecollisions.getValue(i,0) === curcharge){
                                dataChargeNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                dataChargeNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                    }
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    frictionDash.draw(dataFrictionHisto);
                    chargeDash.draw(dataChargeHisto) ;
                    chargeDistanceDash.draw(dataChargeDistanceHisto) ;
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    //nodeLinkScatterDash.draw(heatmapData);
                    nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }
            }

            function nodeColScatterReady(){
                $('#linkColScatterLoadingContainer').fadeOut() ;
                $('#hmlegend1').fadeIn() ;
            }

                google.visualization.events.addListener(heatMapChart, 'select', selectHeatmapPointHandler); 
            //heatMapChart.draw(heatmapData, google.charts.Scatter.convertOptions(heatmapOptions));
            nodeLinkScatterDash.bind([structSizeControll], [heatMapChart]);
            nodeLinkScatterDash.draw(heatmapData);
            google.visualization.events.addListener(heatMapChart, 'ready', nodeColScatterReady);
        });
        
    }
    function drawHeatmap2 (frictionLower, frictionUpper, chargeLower, chargeUpper, chargeDistanceLower, chargeDistanceUpper, structSizeLower, structSizeUpper, ncUpper, lcUpper, selectedMetric) {
        var jitter = $('#jitterNodeCol').hasClass('selectedButton') ? true : false ;
        var verticalLabel = "" ;
        if(selectedMetric == "nc"){
            verticalLabel = "Nodecollisions" ;
        } else if(selectedMetric == "lc"){
            verticalLabel = "Linkcollisions" ;
        } else if(selectedMetric == "bld"){
            verticalLabel = "Backbonelinklength Deviation" ;
        } else if(selectedMetric == "lr"){
            verticalLabel = "Loop Roundness" ;
        }
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?getHeatmapData&fl=" + frictionLower + "&fu=" + frictionUpper + "&cl=" + chargeLower + "&cu=" + chargeUpper
                                                                   + "&cdl=" + chargeDistanceLower + "&cdu=" + chargeDistanceUpper + "&collisionType="+selectedMetric+"&sl="+structSizeLower
                                                                   +"&su="+structSizeUpper+"&ncu="+ncUpper+"&lcu="+lcUpper
                                                                   +"&jitter="+jitter,
            dataType: "json"
        }).done(function( data ) {
            heatmapData2 = new google.visualization.DataTable();
            heatmapData2.addColumn('number', 'Structuresize');
            heatmapData2.addColumn('number', verticalLabel);
            heatmapData2.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
            heatmapData2.addColumn( {'type': 'string', 'role': 'style'} );

            var decodedData = data ;                     
            heatmapData2.addRows(decodedData.values);

            heatmapShades2 = [] ;
            for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
                heatmapShades2.push(heatmapData2.getValue(i,3)) ;
            }

            //console.log("heatmpa ticks: " + decodedData.tickValues + ", test: " + [1000,2000,3000]) ;

            heatmapOptions2 = {
                tooltip: {
                    textStyle: {
                    },
                    isHtml: true,
                    trigger: 'both'
                },
                legend:{
                    position: 'none'
                },
                height: 230,

                explorer: {
                    maxZoomIn:0.001,
                    keepInBounds: true
                },
                chartArea: {
                    left: "7%",
                    top: "3%",
                    height: "80%",
                    width: "100%"
                },
                dataOpacity: 0.3,
                pointSize: 5,
                hAxis: {
                    title: "Structuresize",
                    viewWindow: {
                    },
                },
                vAxis: {
                    title: verticalLabel,
                },
            };

            var structSizeControll2 = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'structSizeControl2',
                    options: {
                        filterColumnIndex: 0,
                        ui: {
                            chartOptions: {
                                height: 30,
                                chartArea: {
                                    left: "5%",
                                    top: "3%",
                                    height: "80%",
                                    width: "100%"
                                },
                                lineWidth: 0,
                                pointSize: 3,
                                dataOpacity: 0.3,
                                colors:['#78c679'],
                                hAxis:{
                                    viewWindow:{
                                        max: heatmapData.getColumnRange(0).max+50,
                                        min: heatmapData.getColumnRange(0).min-50
                                  }
                                }
                            },
                            chartView: {
                                columns: [0, 1]
                            },
                        }
                    }
                });

            heatMapChart2 = new google.visualization.ChartWrapper({
                chartType: 'ScatterChart',
                containerId: 'overviewScatter2',
                options: heatmapOptions2
            });

//            var structSizeControllChangedTimer = null ;
//            function structSizeControllChanged(){
//                if(structSizeControllChangedTimer){
//                    clearTimeout(structSizeControllChangedTimer); //cancel the previous timer.
//                    structSizeControllChangedTimer = null;
//                }
//                structSizeControllChangedTimer = setTimeout(function(){
//                }, 500) ;
//            }
//
//            google.visualization.events.addListener(structSizeControll2, 'statechange', structSizeControllChanged);

            function selectHeatmapPointHandler() {
               var selectedItem = heatMapChart2.getChart().getSelection();
               
               var selectedItem2 = heatMapChart2.getChart().getSelection()[0];
               var chartDataView = heatMapChart2.getDataTable();
               var rowIndex = chartDataView.getUnderlyingTableRowIndex(selectedItem2.row) ;
               //alert(rowIndex);
               console.log(">> selectedpoint:" + heatmapData.getValue(rowIndex,0) + " ; " + heatmapData.getValue(rowIndex,1)) ;
               
               if(selectedItem2.length === 0) {
                    resetAllSelectionHighlights() ;
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    frictionDash.draw(dataFrictionHisto);
                    chargeDash.draw(dataChargeHisto) ;
                    chargeDistanceDash.draw(dataChargeDistanceHisto) ;
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    //nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }else{
                    $('#linkColScatterLoadingContainer').fadeIn() ;
                    $('#frictionChargeScatterLoadingContainer').fadeIn() ;
                    $('#chargeDistanceChargeScatterLoadingContainer').fadeIn() ;
                    $('#frictionChargeDistanceScatterLoadingContainer').fadeIn() ;
                    $('#frictionFrequencyDistributionLoadingContainer').fadeIn() ;
                    $('#chargeFrequencyDistributionLoadingContainer').fadeIn() ;
                    $('#chargeDistanceFrequencyDistributionLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsChargeDistanceLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsFrictionLoadingContainer').fadeIn() ;
                    $('#nodeCollisionsChargeLoadingContainer').fadeIn() ;
                    $('#paretoLoadingContainer').fadeIn() ;

                    resetAllSelectionHighlights() ;

                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        if(isNoParetoPoint){
                            paretoScatterData.setCell(i,3,"point {fill-color: blue; opacity: 0.3}") ;
                        } else{
                            paretoScatterData.setCell(i,6,"point {fill-color: green; opacity: 1}") ;
                        }
                    }

                    var tooltipData = heatmapData.getValue(rowIndex,2) ;
                    var dataConvertedToHtml = $('<div>',{html:tooltipData});
                    var tooltipValuesExtractedFull = dataConvertedToHtml.find('.resValues').text();
                    var tooltipValuesExtracted = tooltipValuesExtractedFull.split(";") ;


                    for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                        var isNoParetoPoint = (paretoScatterData.getValue(i,2) !== null) ;
                        var currentTooltipData = isNoParetoPoint ? paretoScatterData.getValue(i,2) : paretoScatterData.getValue(i,5) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");
                        if (findOne(currentTooltipValuesExtracted,tooltipValuesExtracted)){
                            if(isNoParetoPoint)
                                paretoScatterData.setCell(i,3,"point {fill-color: #d95f02; opacity: 1}") ;
                            else
                                paretoScatterData.setCell(i,6,"point {fill-color: #d95f02; opacity: 1}") ;
                        }else{
                            if(isNoParetoPoint)
                                paretoScatterData.setCell(i,3,paretoShades[i]) ;
                            else
                                paretoScatterData.setCell(i,6,paretoShades[i]) ;
                        }
                    }

                    for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                        var currentTooltipData = heatmapData.getValue(i,2) ;
                        var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                        var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                        if (findOne(currentTooltipValuesExtracted,tooltipValuesExtracted)){
                            heatmapData.setCell(i,3,"point {fill-color: #d95f02; opacity: 1; size: 5}") ;
                        } else{
                            heatmapData.setCell(i,3,heatmapShades[i]) ;
                        }
                    }

                    for(var j = 0 ; j < tooltipValuesExtracted.length ; j++){
                        var curextr = tooltipValuesExtracted[j].split(",") ;
                        var curfric = +curextr[0] ;
                        var curcharge = +curextr[1] ;
                        var curchargedistance = +curextr[2] ;
                        for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
                            if(dataFrictionChargeScatter.getValue(i,0)===curfric&&dataFrictionChargeScatter.getValue(i,1)===curcharge){
                                dataFrictionChargeScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
                            if(datafrictionChargeDistanceScatter.getValue(i,1)===curfric&&datafrictionChargeDistanceScatter.getValue(i,0)===curchargedistance){
                                datafrictionChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
                            if(dataChargeChargeDistanceScatter.getValue(i,0)===curcharge&&dataChargeChargeDistanceScatter.getValue(i,1)===curchargedistance){
                                dataChargeChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < dataFrictionHisto.getNumberOfRows() ; i++){
                            if(dataFrictionHisto.getValue(i,0) === curfric){
                                dataFrictionHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeHisto.getNumberOfRows() ; i++){
                            if(dataChargeHisto.getValue(i,0) === curcharge){
                                dataChargeHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeDistanceHisto.getNumberOfRows() ; i++){
                            if(dataChargeDistanceHisto.getValue(i,0) === curchargedistance){
                                dataChargeDistanceHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                            }
                        }

                        for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                            if(dataChargeDistanceNodecollisions.getValue(i,0) === curchargedistance){
                                dataChargeDistanceNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                dataChargeDistanceNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                            if(dataFrictionNodecollisions.getValue(i,0) === curfric){
                                dataFrictionNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                dataFrictionNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                        for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                            if(dataChargeNodecollisions.getValue(i,0) === curcharge){
                                dataChargeNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                dataChargeNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                            }
                        }
                    }
                    chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                    chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                    chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                    frictionDash.draw(dataFrictionHisto);
                    chargeDash.draw(dataChargeHisto) ;
                    chargeDistanceDash.draw(dataChargeDistanceHisto) ;
                    chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                    chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                    chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                    nodeLinkScatterDash.draw(heatmapData);
                    //nodeLinkScatterDash2.draw(heatmapData2);
                    //paretoDash.draw(paretoScatterData);
                    paretoScatterChart.draw() ;
                    //paretoScatterChart.draw(paretoScatterData, paretoScatterOptions);
                }
            }

            function linkColScatterReady(){
                $('#nodeColScatterLoadingContainer').fadeOut() ;
                $('#hmlegend2').fadeIn() ;
            }
            google.visualization.events.addListener(heatMapChart2, 'ready', linkColScatterReady);
            google.visualization.events.addListener(heatMapChart2, 'select', selectHeatmapPointHandler); 
            nodeLinkScatterDash2.bind([structSizeControll2], [heatMapChart2]);
            nodeLinkScatterDash2.draw(heatmapData2);

        });
        
    }
    function drawParetoScatter(structSize, frictionLower, frictionUpper, chargeLower, chargeUpper, chargeDistanceLower, chargeDistanceUpper, ncUpper, lcUpper, selectedMetric1, selectedMetric2){
        
        jQuery.ajaxQueue({
            url: "datarequesthandler.php?calculateParetoFront&structSize="+structSize+"&fl=" + frictionLower + "&fu=" + frictionUpper + "&cl=" + chargeLower + "&cu=" + chargeUpper
                                               + "&cdl=" + chargeDistanceLower + "&cdu=" + chargeDistanceUpper +"&ncu="+ncUpper+"&lcu="+lcUpper+"&sm1="+selectedMetric1+"&sm2="+selectedMetric2,
                dataType: "json"
            }).done(function( data ) {
                var horizonLabel = "" ;
                var verticalLabel = "" ;
                if(selectedMetric1 == "nc"){
                    horizonLabel = "Nodecollisions" ;
                } else if(selectedMetric1 == "lc"){
                    horizonLabel = "Linkcollisions" ;
                } else if(selectedMetric1 == "bld"){
                    horizonLabel = "Backbonelinklength Deviation" ;
                } else if(selectedMetric1 == "lr"){
                    horizonLabel = "Loop Roundness" ;
                }
                if(selectedMetric2 == "nc"){
                    verticalLabel = "Nodecollisions" ;
                } else if(selectedMetric2 == "lc"){
                    verticalLabel = "Linkcollisions" ;
                } else if(selectedMetric2 == "bld"){
                    verticalLabel = "Backbonelinklength Deviation" ;
                } else if(selectedMetric2 == "lr"){
                    verticalLabel = "Loop Roundness" ;
                }
                
                
                paretoScatterData = new google.visualization.DataTable();
                paretoScatterData.addColumn('number', horizonLabel);
                paretoScatterData.addColumn('number', verticalLabel);
                paretoScatterData.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
                paretoScatterData.addColumn( {'type': 'string', 'role': 'style'} );
                paretoScatterData.addColumn('number', 'Paretofront');
                paretoScatterData.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
                paretoScatterData.addColumn( {'type': 'string', 'role': 'style'} );

                var decodedData = data ;
                console.log("HERE I AM, REDRAWING THE PARETO SCATTER!") ;
                console.log(decodedData) ;
                paretoScatterData.addRows(decodedData.values) ;
                paretoShades = [] ;
                for(var i = 0 ; i < paretoScatterData.getNumberOfRows() ; i++){
                    if(paretoScatterData.getValue(i,3)===null)
                        paretoShades.push(paretoScatterData.getValue(i,6)) ;
                    else
                        paretoShades.push(paretoScatterData.getValue(i,3)) ;
                }

                paretoScatterOptions = {
                    height: 230,
                    dataOpacity: 0.4,
                    explorer: {
                        maxZoomIn:0.001,
                        keepInBounds: true
                    },
                    chartArea: {
                        left: "7%",
                        top: "3%",
                        height: "80%",
                        width: "100%"
                    },
                    legend:{
                        position: 'none'
                    },
                    tooltip: {
                        textStyle: {
                        },
                        isHtml: true,
                        trigger: 'both'
                    },
                    series: {
                        1: { dataOpacity: 1, lineWidth: 4, color: '#a6bddb'},
                    },
                    colors:['blue','green', 'red'],
                    vAxis: {
                        title: verticalLabel,
                    },
                    hAxis: {
                        title: horizonLabel,
                    },
                };

                //paretoScatterChart = new google.visualization.ScatterChart(document.getElementById('paretoScatter'));
                

                paretoScatterChart = new google.visualization.ChartWrapper({
                    chartType: 'ScatterChart',
                    containerId: 'paretoScatter',
                    options: paretoScatterOptions,
                    dataTable: paretoScatterData,
                });


                var metricsControl1 = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'paretoMetricControl1',
                    dataTable: paretoScatterData,
                    options: {
                        filterColumnIndex: 0,
                        ui: {
                            chartType: "ScatterChart",
                            chartOptions: {
                                height: 30,
                                chartArea: {
                                    left: "5%",
                                    top: "3%",
                                    height: "80%",
                                    width: "100%"
                                },
                                lineWidth: 0,
                                pointSize: 3,
                                dataOpacity: 0.3,
                                colors:['#78c679'],
                            },
                            chartView: {
                                columns: [0,1,4]
                            },
                        }
                    }
                });
                
                var metricsControl2 = new google.visualization.ControlWrapper({
                    controlType: 'ChartRangeFilter',
                    containerId: 'paretoMetricControl2',
                    dataTable: paretoScatterData,
                    options: {
                        filterColumnIndex: 1,
                        ui: {
                            chartType: "ScatterChart",
                            chartOptions: {
                                height: 30,
                                chartArea: {
                                    left: "5%",
                                    top: "3%",
                                    height: "80%",
                                    width: "100%"
                                },
                                lineWidth: 0,
                                pointSize: 3,
                                dataOpacity: 0.3,
                                colors:['#78c679'],
                            },
                            chartView: {
                                columns: [1,0,4]
                            },
                        }
                    }
                });
                
                /* with help from http://stackoverflow.com/questions/37861085/google-charts-scatter-plot-two-series-chartrangefilter-troubles 
                 * the problem without that event handler is, that the pareto front wouldn't be drawn */
                google.visualization.events.addListener(metricsControl2, 'statechange', function () {
                    var paretoScatterView = new google.visualization.DataView(paretoScatterData);

                    console.log("control1: [" + metricsControl1.getState().range.start + " ; " + metricsControl1.getState().range.end + "]") ;
                    console.log("control2: [" + metricsControl2.getState().range.start + " ; " + metricsControl2.getState().range.end + "]") ;
                    rowsFound = paretoScatterData.getFilteredRows([{
                      column: 1,
                      test: function (value, row, column, table) {
                        return ((table.getValue(row, column) === null) ||
                                ((table.getValue(row, column) >= metricsControl2.getState().range.start) &&
                                 (table.getValue(row, column) <= metricsControl2.getState().range.end)))
                                 
                      }
                    },{
                      column: 0,
                      test: function (value, row, column, table) {
                        return ((table.getValue(row, column) === null) ||
                                ((table.getValue(row, column) >= metricsControl1.getState().range.start) &&
                                 (table.getValue(row, column) <= metricsControl1.getState().range.end)))
                                 
                      }
                    }]);
                    
                    paretoScatterView.setRows(rowsFound);
                    paretoScatterChart.setDataTable(paretoScatterView);
                    paretoScatterChart.draw();
                });
                
                google.visualization.events.addListener(metricsControl1, 'statechange', function () {
                    var paretoScatterView = new google.visualization.DataView(paretoScatterData);

                    console.log("control1: [" + metricsControl1.getState().range.start + " ; " + metricsControl1.getState().range.end + "]") ;
                    console.log("control2: [" + metricsControl2.getState().range.start + " ; " + metricsControl2.getState().range.end + "]") ;
                    rowsFound = paretoScatterData.getFilteredRows([{
                      column: 1,
                      test: function (value, row, column, table) {
                        return ((table.getValue(row, column) === null) ||
                                ((table.getValue(row, column) >= metricsControl2.getState().range.start) &&
                                 (table.getValue(row, column) <= metricsControl2.getState().range.end)))
                                 
                      }
                    },{
                      column: 0,
                      test: function (value, row, column, table) {
                        return ((table.getValue(row, column) === null) ||
                                ((table.getValue(row, column) >= metricsControl1.getState().range.start) &&
                                 (table.getValue(row, column) <= metricsControl1.getState().range.end)))
                                 
                      }
                    }]);
                    
                    paretoScatterView.setRows(rowsFound);
                    paretoScatterChart.setDataTable(paretoScatterView);
                    paretoScatterChart.draw();
                });
                
                metricsControl1.draw() ;
                metricsControl2.draw();
                
                function paretoScatterReady(){
                    $('#paretoLoadingContainer').fadeOut() ;
                    $('#paretoLegend').fadeIn() ;
                }

                google.visualization.events.addListener(paretoScatterChart, 'ready', paretoScatterReady);

                function selectedParetoScatterPoint(){
                    var selectedItem = paretoScatterChart.getChart().getSelection();
                    if(selectedItem.length === 0) {
                        resetAllSelectionHighlights() ;
                        chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                        chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                        chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                        frictionDash.draw(dataFrictionHisto);
                        chargeDash.draw(dataChargeHisto) ;
                        chargeDistanceDash.draw(dataChargeDistanceHisto) ;
                        chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                        chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                        chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                        nodeLinkScatterDash.draw(heatmapData2);
                        nodeLinkScatterDash2.draw(heatmapData);
                    }else{
                        var tooltipData = paretoScatterData.getValue(selectedItem[0].row,2) !== null ? paretoScatterData.getValue(selectedItem[0].row,2) : paretoScatterData.getValue(selectedItem[0].row,5) ;
                        var dataConvertedToHtml = $('<div>',{html:tooltipData});
                        var tooltipValuesExtractedFull = dataConvertedToHtml.find('.resValues').text();
                        var tooltipValuesExtracted = tooltipValuesExtractedFull.split(";") ;
                        var nodeRowsToPlaceOnTop = [], linkRowsToPlaceOnTop = [] ;
                        var nodeRowsToRemove = [], linkRowsToRemove = [] ;

                        resetAllSelectionHighlights() ;

                        for(var i = 0 ; i < heatmapData.getNumberOfRows() ; i++){
                            var currentTooltipData = heatmapData.getValue(i,2) ;
                            var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                            var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");
                            if (findOne(tooltipValuesExtracted,currentTooltipValuesExtracted)){
                                heatmapData.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                            } else{
                                heatmapData.setCell(i, 3, heatmapShades[i]) ;
                            }
                        }
                        for(var i = 0 ; i < heatmapData2.getNumberOfRows() ; i++){
                            var currentTooltipData = heatmapData2.getValue(i,2) ;
                            var currentDataConvertedToHtml = $('<div>',{html:currentTooltipData});
                            var currentTooltipValuesExtracted = currentDataConvertedToHtml.find('.resValues').text().split(";");

                            if (findOne(tooltipValuesExtracted,currentTooltipValuesExtracted)){
                                heatmapData2.setCell(i, 3, "point {size: 5; fill-color: #d95f02 ; opacity: 1 }");
                            } else{
                                heatmapData2.setCell(i, 3, heatmapShades2[i]) ;
                            }
                        }

                        for(var j = 0 ; j < tooltipValuesExtracted.length ; j++){
                            var curextr = tooltipValuesExtracted[j].split(",") ;
                            var curfric = +curextr[0] ;
                            var curcharge = +curextr[1] ;
                            var curchargedistance = +curextr[2] ;
                            for(var i = 0 ; i < dataFrictionChargeScatter.getNumberOfRows() ; i++){
                                if(dataFrictionChargeScatter.getValue(i,0)===curfric&&dataFrictionChargeScatter.getValue(i,1)===curcharge){
                                    dataFrictionChargeScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                }
                            }
                            for(var i = 0 ; i < datafrictionChargeDistanceScatter.getNumberOfRows() ; i++){
                                if(datafrictionChargeDistanceScatter.getValue(i,1)===curfric&&datafrictionChargeDistanceScatter.getValue(i,0)===curchargedistance){
                                    datafrictionChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                }
                            }
                            for(var i = 0 ; i < dataChargeChargeDistanceScatter.getNumberOfRows() ; i++){
                                if(dataChargeChargeDistanceScatter.getValue(i,0)===curcharge&&dataChargeChargeDistanceScatter.getValue(i,1)===curchargedistance){
                                    dataChargeChargeDistanceScatter.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                }
                            }
                            for(var i = 0 ; i < dataFrictionHisto.getNumberOfRows() ; i++){
                                if(dataFrictionHisto.getValue(i,0) === curfric){
                                    dataFrictionHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                                }
                            }
                            for(var i = 0 ; i < dataChargeHisto.getNumberOfRows() ; i++){
                                if(dataChargeHisto.getValue(i,0) === curcharge){
                                    dataChargeHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                                }
                            }
                            for(var i = 0 ; i < dataChargeDistanceHisto.getNumberOfRows() ; i++){
                                if(dataChargeDistanceHisto.getValue(i,0) === curchargedistance){
                                    dataChargeDistanceHisto.setCell(i,2,"bar {fill-color: #d95f02}") ;
                                }
                            }


                            for(var i = 0 ; i < dataChargeDistanceNodecollisions.getNumberOfRows() ; i++){
                                if(dataChargeDistanceNodecollisions.getValue(i,0) === curchargedistance){
                                    dataChargeDistanceNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                    dataChargeDistanceNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                                }
                            }
                            for(var i = 0 ; i < dataFrictionNodecollisions.getNumberOfRows() ; i++){
                                if(dataFrictionNodecollisions.getValue(i,0) === curfric){
                                    dataFrictionNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                    dataFrictionNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                                }
                            }
                            for(var i = 0 ; i < dataChargeNodecollisions.getNumberOfRows() ; i++){
                                if(dataChargeNodecollisions.getValue(i,0) === curcharge){
                                    dataChargeNodecollisions.setCell(i,2,"point {size: 5; fill-color: #d95f02 ; }") ;
                                    dataChargeNodecollisions.setCell(i,4,"point {size: 5; fill-color: #d95f02 ; }") ;
                                }
                            }
                        }
                        chartChargeNodeCollisions.draw(dataChargeNodecollisions, chargeNodeCollisionOptions);
                        chartFrictionNodeCollisions.draw(dataFrictionNodecollisions, frictionNodeCollisionOptions);
                        chartChargedistanceNodeCollisions.draw(dataChargeDistanceNodecollisions, chargeDistanceNodeCollisionOptions);
                        frictionDash.draw(dataFrictionHisto);
                        chargeDash.draw(dataChargeHisto) ;
                        chargeDistanceDash.draw(dataChargeDistanceHisto) ;
                        chartFrictionChargeDistanceScatter.draw(datafrictionChargeDistanceScatter, frictionChargeDistanceScatterOptions);
                        chartChargeChargedistanceScatter.draw(dataChargeChargeDistanceScatter, chargeChargeDistanceScatterOptions);
                        chartFrictionChargeScatter.draw(dataFrictionChargeScatter, frictionChargeScatterOptions);
                        nodeLinkScatterDash.draw(heatmapData);
                        nodeLinkScatterDash2.draw(heatmapData2);
                    }
                }

                google.visualization.events.addListener(paretoScatterChart, 'select', selectedParetoScatterPoint); 
                //paretoScatterChart.draw(paretoScatterData);
                //paretoDash.bind([metricsControl1], [paretoScatterChart]);

                paretoScatterChart.draw() ;

            });
    }
  
}) ;