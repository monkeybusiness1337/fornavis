!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.rnatreemap=n():e.rnatreemap=n()}(this,function(){return function(e){function n(r){if(t[r])return t[r].exports;var a=t[r]={exports:{},id:r,loaded:!1};return e[r].call(a.exports,a,a.exports,n),a.loaded=!0,a.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n,t){"use strict";function r(){function e(e){e.each(function(e){d3.select(this).attr("transform",function(e){return"translate("+e.x+","+e.y+")"}).append("rect").classed("structure-background-rect",!0).attr("width",function(e){return Math.max(0,e.dx)}).attr("height",function(e){return Math.max(0,e.dy)});var n=(0,a.rnaPlot)().width(Math.max(0,e.dx)).height(Math.max(0,e.dy)).labelInterval(0).rnaEdgePadding(10).showNucleotideLabels(!1);"structure"in e&&d3.select(this).call(n)})}var n=550,t=400,r=function(r){r.each(function(r){console.log("data:",r);var a=d3.layout.treemap().size([n,t]).sticky(!1).value(function(e){return e.size}),o=d3.select(this).append("g");o.datum(r).selectAll(".treemapNode").data(a.nodes).enter().append("g").attr("class","treemapNode").call(e)})};return r.width=function(e){return arguments.length?(n=e,r):n},r.height=function(e){return arguments.length?(t=e,r):t},r}Object.defineProperty(n,"__esModule",{value:!0}),n.rnaTreemapChart=r;var a=t(16)},,,function(e,n){e.exports=function(){var e=[];return e.toString=function(){for(var e=[],n=0;n<this.length;n++){var t=this[n];t[2]?e.push("@media "+t[2]+"{"+t[1]+"}"):e.push(t[1])}return e.join("")},e.i=function(n,t){"string"==typeof n&&(n=[[null,n,""]]);for(var r={},a=0;a<this.length;a++){var o=this[a][0];"number"==typeof o&&(r[o]=!0)}for(a=0;a<n.length;a++){var i=n[a];"number"==typeof i[0]&&r[i[0]]||(t&&!i[2]?i[2]=t:t&&(i[2]="("+i[2]+") and ("+t+")"),e.push(i))}},e}},function(e,n,t){function r(e,n){for(var t=0;t<e.length;t++){var r=e[t],a=f[r.id];if(a){a.refs++;for(var o=0;o<a.parts.length;o++)a.parts[o](r.parts[o]);for(;o<r.parts.length;o++)a.parts.push(u(r.parts[o],n))}else{for(var i=[],o=0;o<r.parts.length;o++)i.push(u(r.parts[o],n));f[r.id]={id:r.id,refs:1,parts:i}}}}function a(e){for(var n=[],t={},r=0;r<e.length;r++){var a=e[r],o=a[0],i=a[1],s=a[2],l=a[3],u={css:i,media:s,sourceMap:l};t[o]?t[o].parts.push(u):n.push(t[o]={id:o,parts:[u]})}return n}function o(e,n){var t=m(),r=y[y.length-1];if("top"===e.insertAt)r?r.nextSibling?t.insertBefore(n,r.nextSibling):t.appendChild(n):t.insertBefore(n,t.firstChild),y.push(n);else{if("bottom"!==e.insertAt)throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");t.appendChild(n)}}function i(e){e.parentNode.removeChild(e);var n=y.indexOf(e);n>=0&&y.splice(n,1)}function s(e){var n=document.createElement("style");return n.type="text/css",o(e,n),n}function l(e){var n=document.createElement("link");return n.rel="stylesheet",o(e,n),n}function u(e,n){var t,r,a;if(n.singleton){var o=k++;t=v||(v=s(n)),r=c.bind(null,t,o,!1),a=c.bind(null,t,o,!0)}else e.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(t=l(n),r=p.bind(null,t),a=function(){i(t),t.href&&URL.revokeObjectURL(t.href)}):(t=s(n),r=d.bind(null,t),a=function(){i(t)});return r(e),function(n){if(n){if(n.css===e.css&&n.media===e.media&&n.sourceMap===e.sourceMap)return;r(e=n)}else a()}}function c(e,n,t,r){var a=t?"":r.css;if(e.styleSheet)e.styleSheet.cssText=b(n,a);else{var o=document.createTextNode(a),i=e.childNodes;i[n]&&e.removeChild(i[n]),i.length?e.insertBefore(o,i[n]):e.appendChild(o)}}function d(e,n){var t=n.css,r=n.media;if(r&&e.setAttribute("media",r),e.styleSheet)e.styleSheet.cssText=t;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(t))}}function p(e,n){var t=n.css,r=n.sourceMap;r&&(t+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */");var a=new Blob([t],{type:"text/css"}),o=e.href;e.href=URL.createObjectURL(a),o&&URL.revokeObjectURL(o)}var f={},h=function(e){var n;return function(){return"undefined"==typeof n&&(n=e.apply(this,arguments)),n}},g=h(function(){return/msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase())}),m=h(function(){return document.head||document.getElementsByTagName("head")[0]}),v=null,k=0,y=[];e.exports=function(e,n){n=n||{},"undefined"==typeof n.singleton&&(n.singleton=g()),"undefined"==typeof n.insertAt&&(n.insertAt="bottom");var t=a(e);return r(t,n),function(e){for(var o=[],i=0;i<t.length;i++){var s=t[i],l=f[s.id];l.refs--,o.push(l)}if(e){var u=a(e);r(u,n)}for(var i=0;i<o.length;i++){var l=o[i];if(0===l.refs){for(var c=0;c<l.parts.length;c++)l.parts[c]();delete f[l.id]}}}};var b=function(){var e=[];return function(n,t){return e[n]=t,e.filter(Boolean).join("\n")}}()},function(e,n,t){"use strict";function r(){var e=(new Date).getTime(),n="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(n){var t=(e+16*Math.random())%16|0;return e=Math.floor(e/16),("x"==n?t:3&t|8).toString(16)});return n}function a(e,n,t){var a=this;a.type="protein",a.size=n,a.nodes=[{name:"P",num:1,radius:3*Math.sqrt(n),rna:a,nodeType:"protein",structName:e,elemType:"p",size:n,uid:r()}],a.links=[],a.uid=r(),a.addUids=function(e){for(var n=0;n<e.length;n++)a.nodes[n].uid=e[n];return a},a.getUids=function(){uids=[];for(var e=0;e<a.dotbracket.length;e++)uids.push(a.nodes[e].uid);return uids}}function o(e,n,t,a){var o=this;o.type="rna",o.circularizeExternal=!1,0===arguments.length?(o.seq="",o.dotbracket="",o.structName=""):(o.seq=e,o.dotbracket=n,o.structName=t),arguments.length<4&&(a=1),o.circular=!1,o.dotbracket.length>0&&"*"==o.dotbracket[o.dotbracket.length-1]&&(o.dotbracket=o.dotbracket.slice(0,o.dotbracket.length-1),o.circular=!0),o.uid=r(),o.elements=[],o.pseudoknotPairs=[],o.nucsToNodes={},o.addUids=function(e){for(var n=o.nodes.filter(function(e){return"nucleotide"==e.nodeType}),t=0;t<e.length&&t<n.length;t++)n[t].uid=e[t];return o},o.computePairtable=function(){o.pairtable=s.rnaUtilities.dotbracketToPairtable(o.dotbracket)},o.removeBreaks=function(e){for(var n=[],t=-1;(t=e.indexOf("&"))>=0;)n.push(t),e=e.substring(0,t)+"oo"+e.substring(t+1,e.length);return{targetString:e,breaks:n}};var i=o.removeBreaks(o.dotbracket);o.dotbracket=i.targetString,o.dotBracketBreaks=i.breaks,i=o.removeBreaks(o.seq),o.seq=i.targetString,o.seqBreaks=i.breaks,o.calculateStartNumberArray=function(){o.startNumberArray=[];for(var e=0;e<o.dotbracket.length;e++)o.startNumberArray.push(a),"o"==o.dotbracket[e]&&(a=-e)},o.calculateStartNumberArray(),o.rnaLength=o.dotbracket.length,(0,s.arraysEqual)(o.dotBracketBreaks,o.seqBreaks)||(console.log("WARNING: Sequence and structure breaks not equal"),console.log("WARNING: Using the breaks in the structure")),o.computePairtable(),o.addPositions=function(e,n){for(var t=o.nodes.filter(function(n){return n.nodeType==e}),r=0;r<t.length;r++)t[r].x=n[r][0],t[r].px=n[r][0],t[r].y=n[r][1],t[r].py=n[r][1];return o},o.breakNodesToFakeNodes=function(){for(var e=o.nodes.filter(function(e){return"nucleotide"==e.nodeType}),n=0;n<e.length;n++)"o"==o.dotbracket[n]&&(e[n].nodeType="middle");for(var n=0;n<o.elements.length;n++){for(var t=!1,r=0;r<o.elements[n][2].length;r++)o.dotBracketBreaks.indexOf(o.elements[n][2][r])>=0&&(t=!0);t?o.elements[n][2].map(function(e){0!=e&&(o.nodes[e-1].elemType="e")}):o.elements[n][2].map(function(e){0!=e&&(o.nodes[e-1].elemType=o.elements[n][0])})}return o},o.getPositions=function(e){for(var n=[],t=o.nodes.filter(function(n){return n.nodeType==e}),r=0;r<t.length;r++)n.push([t[r].x,t[r].y]);return n},o.getUids=function(){for(var e=[],n=0;n<o.dotbracket.length;n++)e.push(o.nodes[n].uid);return e},o.reinforceStems=function(){for(var e=o.pairtable,n=o.elements.filter(function(e){return"s"==e[0]&&e[2].length>=4}),t=0;t<n.length;t++)for(var r=n[t][2],a=r.slice(0,r.length/2),i=0;i<a.length-1;i++)o.addFakeNode([a[i],a[i+1],e[a[i+1]],e[a[i]]]);return o},o.reinforceLoops=function(){for(var e=function(e){return 0!==e&&e<=o.dotbracket.length},n=0;n<o.elements.length;n++)if("s"!=o.elements[n][0]&&(o.circularizeExternal||"e"!=o.elements[n][0])){var t=o.elements[n][2].filter(e);if("e"==o.elements[n][0]){var a={name:"",num:-3,radius:0,rna:o,nodeType:"middle",elemType:"f",nucs:[],x:o.nodes[o.rnaLength-1].x,y:o.nodes[o.rnaLength-1].y,px:o.nodes[o.rnaLength-1].px,py:o.nodes[o.rnaLength-1].py,uid:r()},i={name:"",num:-2,radius:0,rna:o,nodeType:"middle",elemType:"f",nucs:[],x:o.nodes[0].x,y:o.nodes[0].y,px:o.nodes[0].px,py:o.nodes[0].py,uid:r()};t.push(o.nodes.length+1),t.push(o.nodes.length+2),o.nodes.push(a),o.nodes.push(i)}o.addFakeNode(t)}return o},o.updateLinkUids=function(){for(var e=0;e<o.links.length;e++)o.links[e].uid=o.links[e].source.uid+o.links[e].target.uid;return o},o.addFakeNode=function(e){for(var n=18,t=6.283/(2*e.length),a=n/(2*Math.tan(t)),i="",s=0;s<e.length;s++)i+=o.nodes[e[s]-1].uid;var l={name:"",num:-1,radius:a,rna:o,nodeType:"middle",elemType:"f",nucs:e,uid:i};o.nodes.push(l);var u=0,c=0,d=0;t=3.14159*(e.length-2)/(2*e.length),a=.5/Math.cos(t);for(var p=0;p<e.length;p++)if(!(0===e[p]||e[p]>o.dotbracket.length)){o.links.push({source:o.nodes[e[p]-1],target:o.nodes[o.nodes.length-1],linkType:"fake",value:a,uid:r()}),e.length>4&&o.links.push({source:o.nodes[e[p]-1],target:o.nodes[e[(p+Math.floor(e.length/2))%e.length]-1],linkType:"fake",value:2*a,uid:r()});var f=3.14159*(e.length-2)/e.length,h=2*Math.cos(1.570795-f/2);o.links.push({source:o.nodes[e[p]-1],target:o.nodes[e[(p+2)%e.length]-1],linkType:"fake",value:h});var g=o.nodes[e[p]-1];"x"in g&&(u+=g.x,c+=g.y,d+=1)}return d>0&&(l.x=u/d,l.y=c/d,l.px=l.x,l.py=l.y),o},o.connectFakeNodes=function(){for(var e=18,n=function(e){return"middle"==e.nodeType},t={},r=o.nodes.filter(n),a=new Set,i=1;i<=o.nodes.length;i++)t[i]=[];for(var i=0;i<r.length;i++)for(var s=r[i],l=0;l<s.nucs.length;l++){for(var u=s.nucs[l],c=0;c<t[u].length;c++)if(!a.has(JSON.stringify([t[u][c].uid,s.uid].sort()))){var d=t[u][c].radius+s.radius;o.links.push({source:t[u][c],target:s,value:d/e,linkType:"fake_fake"}),a.add(JSON.stringify([t[u][c].uid,s.uid].sort()))}t[u].push(s)}return o},o.addExtraLinks=function(e){if("undefined"==typeof e)return o;for(var n=0;n<e.length;n++){var t=o.getNodeFromNucleotides(e[n].from),a=o.getNodeFromNucleotides(e[n].to),i={source:t,target:a,linkType:"extra",extraLinkType:e[n].linkType,uid:r()};o.links.push(i)}return o},o.elementsToJson=function(){var e=o.pairtable;o.elements;o.nodes=[],o.links=[];var n={};o.elements.sort();for(var t=0;t<o.elements.length;t++)for(var a=o.elements[t][2],i=0;i<a.length;i++)n[a[i]]=o.elements[t][0];for(var t=1;t<=e[0];t++){var s=o.seq[t-1];(o.dotBracketBreaks.indexOf(t-1)>=0||o.dotBracketBreaks.indexOf(t-2)>=0)&&(s=""),o.nodes.push({name:s,num:t+o.startNumberArray[t-1]-1,radius:5,rna:o,nodeType:"nucleotide",structName:o.structName,elemType:n[t],uid:r(),linked:!1})}for(var t=0;t<o.nodes.length;t++)0===t?o.nodes[t].prevNode=null:o.nodes[t].prevNode=o.nodes[t-1],t==o.nodes.length-1?o.nodes[t].nextNode=null:o.nodes[t].nextNode=o.nodes[t+1];for(var t=1;t<=e[0];t++)0!==e[t]&&o.links.push({source:o.nodes[t-1],target:o.nodes[e[t]-1],linkType:"basepair",value:1,uid:r()}),t>1&&-1===o.dotBracketBreaks.indexOf(t-1)&&-1==o.dotBracketBreaks.indexOf(t-2)&&-1==o.dotBracketBreaks.indexOf(t-3)&&(o.links.push({source:o.nodes[t-2],target:o.nodes[t-1],linkType:"backbone",value:1,uid:r()}),o.nodes[t-1].linked=!0);for(var t=0;t<o.pseudoknotPairs.length;t++)o.links.push({source:o.nodes[o.pseudoknotPairs[t][0]-1],target:o.nodes[o.pseudoknotPairs[t][1]-1],linkType:"pseudoknot",value:1,uid:r()});return o.circular&&o.links.push({source:o.nodes[0],target:o.nodes[o.rnaLength-1],linkType:"backbone",value:1,uid:r()}),o},o.ptToElements=function(e,n,t,r){var a=[],i=[t-1],s=[r+1];if(t>r)return[];for(;0===e[t];t++)i.push(t);for(;0===e[r];r--)s.push(r);if(t>r){if(i.push(t),0===n)return[["e",n,i.sort(l)]];for(var u=!1,c=[],d=[],p=0;p<i.length;p++)u?d.push(i[p]):c.push(i[p]),o.dotBracketBreaks.indexOf(i[p])>=0&&(u=!0);return u?[["h",n,i.sort(l)]]:[["h",n,i.sort(l)]]}if(e[t]!=r){var f=i,p=t;for(f.push(p);r>=p;){for(a=a.concat(o.ptToElements(e,n,p,e[p])),f.push(e[p]),p=e[p]+1;0===e[p]&&r>=p;p++)f.push(p);f.push(p)}return f.pop(),f=f.concat(s),f.length>0&&(0===n?a.push(["e",n,f.sort(l)]):a.push(["m",n,f.sort(l)])),a}if(e[t]===r){i.push(t),s.push(r);var h=i.concat(s);h.length>4&&(0===n?a.push(["e",n,i.concat(s).sort(l)]):a.push(["i",n,i.concat(s).sort(l)]))}for(var g=[];e[t]===r&&r>t;)g.push(t),g.push(r),t+=1,r-=1,n+=1;return i=[t-1],s=[r+1],a.push(["s",n,g.sort(l)]),a.concat(o.ptToElements(e,n,t,r))},o.addLabels=function(e,n){if(0===arguments.length&&(e=1,n=10),1===arguments.length&&(n=10),0===n)return o;0>=n&&console.log("The label interval entered in invalid:",n);for(var t=1;t<=o.pairtable[0];t++)if(t%n===0){var a,i,s,l,u,c,d=o.nodes[t-1];1==o.rnaLength?(c=[d.x-15,d.y],u=[d.x-15,d.y]):(s=1==t?o.nodes[o.rnaLength-1]:o.nodes[t-2],l=t==o.rnaLength?o.nodes[0]:o.nodes[t],0!==o.pairtable[l.num]&&0!==o.pairtable[s.num]&&0!==o.pairtable[d.num]&&(s=l=o.nodes[o.pairtable[d.num]-1]),0===o.pairtable[d.num]||0!==o.pairtable[l.num]&&0!==o.pairtable[s.num]?(c=[l.x-d.x,l.y-d.y],u=[s.x-d.x,s.y-d.y]):(c=[d.x-l.x,d.y-l.y],u=[d.x-s.x,d.y-s.y]));var p=[c[0]+u[0],c[1]+u[1]],f=Math.sqrt(p[0]*p[0]+p[1]*p[1]),h=[p[0]/f,p[1]/f],g=[-15*h[0],-15*h[1]],a=o.nodes[t-1].x+g[0],i=o.nodes[t-1].y+g[1],m={name:t+o.startNumberArray[t-1]-1,num:-1,radius:6,rna:o,nodeType:"label",structName:o.structName,elemType:"l",x:a,y:i,px:a,py:i,uid:r()},v={source:o.nodes[t-1],target:m,value:1,linkType:"label_link",uid:r()};o.nodes.push(m),o.links.push(v)}return o},o.recalculateElements=function(){if(o.removePseudoknots(),o.elements=o.ptToElements(o.pairtable,0,1,o.dotbracket.length),o.circular&&(externalLoop=o.elements.filter(function(e){return"e"==e[0]?!0:void 0}),externalLoop.length>0)){eloop=externalLoop[0],nucs=eloop[2].sort(l),prev=nucs[0],hloop=!0,numGreater=0;for(var e=1;e<nucs.length;e++)nucs[e]-prev>1&&(numGreater+=1),prev=nucs[e];1==numGreater?eloop[0]="h":2==numGreater?eloop[0]="i":eloop[0]="m"}return o},o.reassignLinkUids=function(){for(var e,e=0;e<o.links.length;e++)o.links[e].uid=o.links[e].source.uid+o.links[e].target.uid;return o},o.removePseudoknots=function(){return o.pairtable.length>1&&(o.pseudoknotPairs=o.pseudoknotPairs.concat(s.rnaUtilities.removePseudoknotsFromPairtable(o.pairtable))),o},o.addPseudoknots=function(){for(var e=o.pairtable,n=o.pseudoknotPairs,t=0;t<n.length;t++)e[n[t][0]]=n[t][1],e[n[t][1]]=n[t][0];return o.pseudoknotPairs=[],o},o.addName=function(e){return"undefined"==typeof e?(o.name="",o):(o.name=e,o)},o.rnaLength>0&&o.recalculateElements()}function i(e){for(var n={},t=[],i=[],s=0;s<e.molecules.length;s++){var l,u=e.molecules[s];"rna"==u.type?(l=new o(u.seq,u.ss,u.header),l.circularizeExternal=!0,l.elementsToJson().addPositions("nucleotide",u.positions).addLabels().reinforceStems().reinforceLoops()):"protein"==u.type&&(l=new a(u.header,u.size)),l.addUids(u.uids);for(var c=0;c<l.nodes.length;c++)n[l.nodes[c].uid]=l.nodes[c];t.push(l)}for(var s=0;s<e.extraLinks.length;s++)link=e.extraLinks[s],link.source=n[link.source],link.target=n[link.target],link.uid=r(),i.push(link);return{graphs:t,extraLinks:i}}Object.defineProperty(n,"__esModule",{value:!0}),n.ProteinGraph=a,n.RNAGraph=o,n.moleculesToJson=i;var s=t(6),l=function(e,n){return e-n};"undefined"==typeof String.prototype.trim&&(String.prototype.trim=function(){return String(this).replace(/^\s+|\s+$/g,"")})},function(e,n,t){!function(n,t){e.exports=t()}(this,function(){return function(e){function n(r){if(t[r])return t[r].exports;var a=t[r]={exports:{},id:r,loaded:!1};return e[r].call(a.exports,a,a.exports,n),a.loaded=!0,a.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n,t){e.exports=t(1)},function(e,n){"use strict";function t(e,n){if(e===n)return!0;if(null===e||null===n)return!1;if(e.length!=n.length)return!1;for(var t=0;t<e.length;++t)if(e[t]!==n[t])return!1;return!0}function r(){var e=this;e.bracketLeft="([{<ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),e.bracketRight=")]}>abcdefghijklmnopqrstuvwxyz".split(""),e.inverseBrackets=function(e){for(var n={},t=0;t<e.length;t++)n[e[t]]=t;return n},e.maximumMatching=function(e){for(var n=e[0],t=0,r=new Array(n+1),a=0;n>=a;a++){r[a]=new Array(n+1);for(var o=a;n>=o;o++)r[a][o]=0}for(var i=0,a=n-t-1;a>0;a--)for(var o=a+t+1;n>=o;o++){i=r[a][o-1];for(var s=o-t-1;s>=a;s--)e[s]===o&&(i=Math.max(i,(s>a?r[a][s-1]:0)+1+(o-s-1>0?r[s+1][o-1]:0)));r[a][o]=i}return i=r[1][n],r},e.backtrackMaximumMatching=function(n,t){var r=Array.apply(null,Array(n.length)).map(function(){return 0});return e.mmBt(n,r,t,1,n.length-1),r},e.mmBt=function(n,t,r,a,o){var i=n[a][o],s=0;if(!(s>o-a-1)){if(n[a][o-1]==i)return void e.mmBt(n,t,r,a,o-1);for(var l=o-s-1;l>=a;l--)if(r[o]===l){var u=l>a?n[a][l-1]:0,c=o-l-1>0?n[l+1][o-1]:0;if(u+c+1==i)return t[l]=o,t[o]=l,l>a&&e.mmBt(n,t,r,a,l-1),void e.mmBt(n,t,r,l+1,o-1)}console.log("FAILED!!!"+a+","+o+": backtracking failed!")}},e.dotbracketToPairtable=function(n){var t=Array.apply(null,new Array(n.length+1)).map(Number.prototype.valueOf,0);t[0]=n.length;for(var r={},a=0;a<e.bracketLeft.length;a++)r[a]=[];for(var o=e.inverseBrackets(e.bracketLeft),i=e.inverseBrackets(e.bracketRight),a=0;a<n.length;a++){var s=n[a],l=a+1;if("."==s||"o"==s)t[l]=0;else if(s in o)r[o[s]].push(l);else{if(!(s in i))throw"Unknown symbol in dotbracket string";var u=r[i[s]].pop();t[l]=u,t[u]=l}}for(var c in r)if(r[c].length>0)throw"Unmatched base at position "+r[c][0];return t},e.insertIntoStack=function(e,n,t){for(var r=0;e[r].length>0&&e[r][e[r].length-1]<t;)r+=1;return e[r].push(t),r},e.deleteFromStack=function(e,n){for(var t=0;0===e[t].length||e[t][e[t].length-1]!=n;)t+=1;return e[t].pop(),t},e.pairtableToDotbracket=function(n){for(var t={},r=0;r<n[0];r++)t[r]=[];for(var r,a={},o="",r=1;r<n[0]+1;r++){if(0!==n[r]&&n[r]in a)throw"Invalid pairtable contains duplicate entries";a[n[r]]=!0,o+=0===n[r]?".":n[r]>r?e.bracketLeft[e.insertIntoStack(t,r,n[r])]:e.bracketRight[e.deleteFromStack(t,r)]}return o},e.findUnmatched=function(n,t,r){for(var a,o=[],i=[],s=t,l=r,a=t;r>=a;a++)0!==n[a]&&(n[a]<t||n[a]>r)&&i.push([a,n[a]]);for(var a=s;l>=a;a++){for(;0===n[a]&&l>=a;)a++;for(r=n[a];n[a]===r;)a++,r--;o=o.concat(e.findUnmatched(n,a,r))}return i.length>0&&o.push(i),o},e.removePseudoknotsFromPairtable=function(n){for(var t=e.maximumMatching(n),r=e.backtrackMaximumMatching(t,n),a=[],o=1;o<n.length;o++)n[o]<o||r[o]!=n[o]&&(a.push([o,n[o]]),n[n[o]]=0,n[o]=0);return a},e.ptToElements=function(n,t,r,a,i){var s=[],l=[r-1],u=[a+1];if(arguments.length<5&&(i=[]),r>a)return[];for(;0===n[r];r++)l.push(r);for(;0===n[a];a--)u.push(a);if(r>a){if(l.push(r),0===t)return[["e",t,l.sort(o)]];for(var c=!1,d=[],p=[],f=0;f<l.length;f++)c?p.push(l[f]):d.push(l[f]),i.indexOf(l[f])>=0&&(c=!0);return c?[["h",t,l.sort(o)]]:[["h",t,l.sort(o)]]}if(n[r]!=a){var h=l,f=r;for(h.push(f);a>=f;){for(s=s.concat(e.ptToElements(n,t,f,n[f],i)),h.push(n[f]),f=n[f]+1;0===n[f]&&a>=f;f++)h.push(f);h.push(f)}return h.pop(),h=h.concat(u),h.length>0&&(0===t?s.push(["e",t,h.sort(o)]):s.push(["m",t,h.sort(o)])),s}if(n[r]===a){l.push(r),u.push(a);var g=l.concat(u);g.length>4&&(0===t?s.push(["e",t,l.concat(u).sort(o)]):s.push(["i",t,l.concat(u).sort(o)]))}for(var m=[];n[r]===a&&a>r;)m.push(r),m.push(a),r+=1,a-=1,t+=1;return l=[r-1],u=[a+1],s.push(["s",t,m.sort(o)]),s.concat(e.ptToElements(n,t,r,a,i))}}function a(e){var n=this;return n.colorsText=e,n.parseRange=function(e){for(var n=e.split(","),t=[],r=0;r<n.length;r++){var a=n[r].split("-");if(1==a.length)t.push(parseInt(a[0]));else if(2==a.length)for(var o=parseInt(a[0]),i=parseInt(a[1]),s=o;i>=s;s++)t.push(s);else console.log("Malformed range (too many dashes):",e)}return t},n.parseColorText=function(e){for(var t=e.split("\n"),r="",a=1,o={colorValues:{"":{}},range:["white","steelblue"]},i=[],s=0;s<t.length;s++)if(">"!=t[s][0])for(var l=t[s].trim().split(/[\s]+/),u=0;u<l.length;u++)if(isNaN(l[u])){if(0===l[u].search("range")){var c=l[u].split("="),d=c[1].split(":");o.range=[d[0],d[1]];continue}if(0==l[u].search("domain")){var p=l[u].split("="),d=p[1].split(":");o.domain=[d[0],d[1]];continue}for(var f=l[u].split(":"),h=n.parseRange(f[0]),g=f[1],m=0;m<h.length;m++)isNaN(g)?o.colorValues[r][h[m]]=g:(o.colorValues[r][h[m]]=+g,i.push(Number(g)))}else o.colorValues[r][a]=Number(l[u]),a+=1,i.push(Number(l[u]));else r=t[s].trim().slice(1),a=1,o.colorValues[r]={};return"domain"in o||(o.domain=[Math.min.apply(null,i),Math.max.apply(null,i)]),n.colorsJson=o,n},n.normalizeColors=function(){var e;for(var t in n.colorsJson){var r=Number.MAX_VALUE,a=Number.MIN_VALUE;for(var o in n.colorsJson.colorValues[t])e=n.colorsJson.colorValues[t][o],"number"==typeof e&&(r>e&&(r=e),e>a&&(a=e));for(o in n.colorsJson.colorValues[t])e=n.colorsJson.colorValues[t][o],"number"==typeof e&&(n.colorsJson.colorValues[t][o]=(e-r)/(a-r))}return n},n.parseColorText(n.colorsText),n}Object.defineProperty(n,"__esModule",{value:!0}),n.arraysEqual=t,n.RNAUtilities=r,n.ColorScheme=a;var o=function(e,n){return e-n};n.rnaUtilities=new r}])})},function(e,n){"use strict";function t(e){var n,t,r,a=0,o=100,i=100,s=15,l=[],u=[];t=e[0];var c=Array.apply(null,new Array(t+5)).map(Number.prototype.valueOf,0),d=Array.apply(null,new Array(16+Math.floor(t/5))).map(Number.prototype.valueOf,0),p=Array.apply(null,new Array(16+Math.floor(t/5))).map(Number.prototype.valueOf,0),f=0,h=0,g=Math.PI/2,m=function k(e,n,t){var r,a,o,i,s,l,u,m,v,y,b,x,N=2,T=0,L=0,w=Array.apply(null,new Array(3+2*Math.floor((n-e)/5))).map(Number.prototype.valueOf,0);for(r=e-1,n++;e!=n;)if(a=t[e],a&&0!=e){N+=2,o=e,i=a,w[++T]=o,w[++T]=i,e=a+1,s=o,l=i,m=0;do o++,i--,m++;while(t[o]==i&&t[o]>o);if(u=m-2,m>=2&&(c[s+1+u]+=g,c[l-1-u]+=g,c[s]+=g,c[l]+=g,m>2))for(;u>=1;u--)c[s+u]=Math.PI,c[l-u]=Math.PI;p[++h]=m,i>=o&&k(o,i,t)}else e++,N++,L++;for(x=Math.PI*(N-2)/N,w[++T]=n,v=0>r?0:r,y=1;T>=y;y++){for(b=w[y]-v,u=0;b>=u;u++)c[v+u]+=x;if(y>T)break;v=w[++y]}d[++f]=L};m(0,t+1,e),d[f]-=2,r=a,l[0]=o,u[0]=i;var v=[];for(v.push([l[0],u[0]]),n=1;t>n;n++)l[n]=l[n-1]+s*Math.cos(r),u[n]=u[n-1]+s*Math.sin(r),v.push([l[n],u[n]]),r+=Math.PI-c[n+1];return v}Object.defineProperty(n,"__esModule",{value:!0}),n.simpleXyCoordinates=t},,,,,,,,,function(e,n,t){"use strict";function r(){function e(e,n){function t(e,n,t){var r=(e.range()[1]-e.range()[0])/(e.domain()[1]-e.domain()[0]),a=(n[1]-n[0])*r,o=(t[1]-t[0]-a)/2;return{scaleFactor:r,scale:d3.scale.linear().domain(n).range([t[0]+o,t[1]-o])}}var r=arguments.length<=2||void 0===arguments[2]?"":arguments[2],a=d3.extent(e),o=d3.extent(n),i=30;""!=r&&(o[1]+=i),a[0]-=c.nucleotideRadius+c.rnaEdgePadding,o[0]-=c.nucleotideRadius+c.rnaEdgePadding,a[1]+=c.nucleotideRadius+c.rnaEdgePadding,o[1]+=c.nucleotideRadius+c.rnaEdgePadding;var s,d=a[1]-a[0],p=o[1]-o[0],f=d-c.width,h=p-c.height;f>h?(l=d3.scale.linear().domain(a).range([0,c.width]),s=t(l,o,[0,c.height]),u=s.scale):(u=d3.scale.linear().domain(o).range([0,c.height]),s=t(u,a,[0,c.width]),l=s.scale);l.range()[0]-l.domain()[0],u.range()[0]-u.domain()[0];return"translate("+-(l.domain()[0]*s.scaleFactor-l.range()[0])+","+-(u.domain()[0]*s.scaleFactor-u.range()[0])+")scale("+s.scaleFactor+")"}function n(e,n){var t=e.selectAll(".rna-base").data(n).enter().append("svg:g").attr("transform",function(e){return"translate("+e.x+","+e.y+")"});t.append("svg:circle").attr("r",c.nucleotideRadius).classed("rna-base",!0);if(c.showNucleotideLabels){t.append("svg:text").text(function(e){return e.name}).attr("text-anchor","middle").attr("dominant-baseline","central").classed("nucleotide-label",!0).append("svg:title").text(function(e){return e.struct_name+":"+e.num})}}function t(e,n){var t=e.selectAll(".rnaLabel").data(n).enter().append("svg:g").attr("transform",function(e){return"translate("+e.x+","+e.y+")"});t.append("svg:text").text(function(e){return e.name}).attr("text-anchor","middle").attr("font-weight","bold").attr("dominant-baseline","central").classed("number-label",!0)}function r(e,n){e.append("svg:text").attr("transform","translate("+l.invert(c.width/2)+","+u.invert(c.height)+")").attr("dy",-10).classed("rna-name",!0).text(n)}function o(e,n){var t={},r=[];n=n.filter(function(e){return"correct"==e.linkType||"incorrect"==e.linkType||"extra"==e.linkType}),e.selectAll("[link-type=extra]").remove();for(var a=0;a<n.length;a++)null!==n[a].source&&null!==n[a].target&&(t[n[a].source.uid]=n[a].source,t[n[a].target.uid]=n[a].target,r.push({source:n[a].source.uid,target:n[a].target.uid,linkType:n[a].linkType,extraLinkType:n[a].extraLinkType}));for(var o=d3.ForceEdgeBundling().nodes(t).edges(r).compatibility_threshold(.8).step_size(.2),i=o(),s=d3.svg.line().x(function(e){return e.x}).y(function(e){return e.y}).interpolate("linear"),a=0;a<i.length;a++){var l=i[a];e.append("path").attr("d",s(l)).style("fill","none").attr("link-type",function(e){return r[a].linkType}).attr("extra-link-type",function(e){return r[a].extraLinkType}).style("stroke-opacity",.4)}}function i(e,n){n=n.filter(function(e){return null!==e.source&&null!==e.target});e.selectAll(".rna-link").data(n).enter().append("svg:line").attr("x1",function(e){return e.source.x}).attr("x2",function(e){return e.target.x}).attr("y1",function(e){return e.source.y}).attr("y2",function(e){return e.target.y}).attr("link-type",function(e){return e.linkType}).attr("extra-link-type",function(e){return e.extraLinkType}).classed("rna-link",!0)}function s(s){s.each(function(s){var l=new a.RNAGraph(s.sequence,s.structure,s.name).recalculateElements().elementsToJson().addName(s.name);s.rnaGraph=l;var u=new u,d=naview.naview_xy_coordinates(l.pairtable);l.addPositions("nucleotide",d).reinforceStems().reinforceLoops().addExtraLinks(s.extraLinks).addLabels(c.startNucleotideNumber,c.labelInterval);var p=e(l.nodes.map(function(e){return e.x}),l.nodes.map(function(e){return e.y})),f=d3.select(this).append("g").attr("transform",p),h=l.nodes.filter(function(e){return"nucleotide"==e.nodeType}),g=l.nodes.filter(function(e){return"label"==e.nodeType}),m=l.links;i(f,m),n(f,h),t(f,g),r(f,s.name),c.bundleExternalLinks&&o(f,m)})}var l,u,c={width:400,height:400,nucleotideRadius:5,rnaEdgePadding:0,labelInterval:0,showNucleotideLabels:!0,startNucleotideNumber:1,bundleExternalLinks:!1};return s.width=function(e){return arguments.length?(c.width=e,s):c.width},s.height=function(e){return arguments.length?(c.height=e,s):c.height},s.showNucleotideLabels=function(e){return arguments.length?(c.showNucleotideLabels=e,s):c.showNucleotideLabels},s.rnaEdgePadding=function(e){return arguments.length?(c.rnaEdgePadding=e,s):c.rnaEdgePadding},s.nucleotideRadius=function(e){return arguments.length?(c.nucleotideRadius=e,s):c.nucleotideRadius},s.labelInterval=function(e){return arguments.length?(c.labelInterval=e,s):c.labelInterval},s.showNucleotideLabels=function(e){return arguments.length?(c.showNucleotideLabels=e,s):c.showNucleotideLabels},s.startNucleotideNumber=function(e){return arguments.length?(c.startNucleotideNumber=e,s):c.startNucleotideNumber},s.bundleExternalLinks=function(e){return arguments.length?(c.bundleExternalLinks=e,s):c.bundleExternalLinks},s}Object.defineProperty(n,"__esModule",{value:!0}),n.rnaPlot=r;var a=(t(7),t(5));t(6);t(17),"undefined"==typeof String.prototype.trim&&(String.prototype.trim=function(){return String(this).replace(/^\s+|\s+$/g,"")})},function(e,n,t){var r=t(18);"string"==typeof r&&(r=[[e.id,r,""]]);t(4)(r,{});r.locals&&(e.exports=r.locals)},function(e,n,t){n=e.exports=t(3)(),n.push([e.id,'.structure-background-rect {\n    stroke: black;\n    stroke-width: 5;\n    fill: transparent;\n}\n\ncircle.rna-base {\n  stroke: #ccc;\n  stroke-width: 1px;\n  opacity: 1;\n  fill: white;\n}\n\ncircle.rna-base.label {\n    stroke: transparent;\n    stroke-width: 0;\n    fill: white;\n}\n\nline.link {\n  stroke: #999;\n  stroke-opacity: 0.8;\n  stroke-width: 2;\n}\n\nline.rna-link {\n  stroke: #999;\n  stroke-opacity: 0.8;\n  stroke-width: 2;\n}\n\n.overlay {\n    fill: transparent;\n}\n\n.rna-name {\n    text-anchor: middle;\n    dy: -10;\n    font-family: Tahoma, Geneva, sans-serif;\n    font-size: 8pt;\n}\n\nline.rna-link[link-type="backbone"] {\n    stroke: transparent;\n}\n\nline.rna-link[link-type="basepair"] {\n    stroke: transparent;\n}\n\nline.rna-link[link-type="fake"] {\n    stroke: transparent;\n}\n\nline.rna-link[link-type="extra"] {\n    stroke: grey;\n}\n\nline.rna-link[extra-link-type="correct"] {\n    stroke: green;\n}\n\nline.rna-link[extra-link-type="incorrect"] {\n    stroke: green;\n}\n\n\npath {\n    stroke: grey;\n  stroke-width: 2;\n}\n\npath[extra-link-type="correct"] {\n    stroke: green;\n}\n\npath[extra-link-type="incorrect"] {\n    stroke: red;\n}\n\n\nline.basepair {\n  stroke: red;\n}\n\nline.intermolecule {\n  stroke: blue;\n}\n\nline.chain_chain {\n  stroke-dasharray: 3,3;\n}\n\nline.fake {\n  stroke: green;\n}\n\n.transparent {\n    fill: transparent;\n    stroke-width: 0;\n    stroke-opacity: 0;\n    opacity: 0;\n}\n\n.d3-tip {\n    line-height: 1;\n    font-weight: bold;\n    padding: 6px;\n    background: rgba(0, 0, 0, 0.6);\n    color: #fff;\n    border-radius: 4px;\n    pointer-events: none;\n          }\n\ntext.nucleotide-label {\n    font-size: 5.5pt;\n    font-weight: bold;\n    font-family: Tahoma, Geneva, sans-serif;\n    color: rgb(100,100,100);\n    pointer-events: none;\n}\n\ntext.number-label {\n    font-size: 5.5pt;\n    font-weight: bold;\n    font-family: Tahoma, Geneva, sans-serif;\n    color: rgb(100,100,100);\n    pointer-events: none;\n}\n\ntext {\n    pointer-events: none;\n}\n\ng.gnode {\n\n}\n\n.brush .extent {\n  fill-opacity: .1;\n  stroke: #fff;\n  shape-rendering: crispEdges;\n}\n\n.noselect {\n    -webkit-touch-callout: none;\n    -webkit-user-select: none;\n    -khtml-user-select: none;\n    -moz-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n}\n',""])}])});