var ediLint = angular.module('ediLint',[]);
ediLint.factory('ediParser',[function() {
  return {
    parse: function(txt) {
      var r, rawSegments, i, curSeg, rawElements, elementObjects, sTypes=Object.create(null), seg;
      r = {errors:[],segments:[],segmentTypes:[]};
      if(txt===undefined || txt.length===0) {
        return r;
      }
      if(!txt.match(/^ISA.{102}/)) {
        r.errors.push("Your EDI must start with a valid ISA segment, not: " + txt.slice(0,106));
        return r;
      }
      r.elementSeparator = txt[3];
      if(txt[107]=="\n") {
        r.segmentTerminator = txt.slice(105,106);
      } else {
        r.segmentTerminator = txt[105];
      }
      if (r.segmentTerminator !== txt[ txt.length - 1 ]) {
        r.errors.push("Either something is wrong with your ISA or your IEA is missing its terminator");
        return r;
      }
      switch(r.segmentTerminator) {
        case "\r":
          r.segmentTerminatorDesc = "[CR]";
          break;
        case "\n":
          r.segmentTerminatorDesc = "[LF]";
          break;
        case "\r\n":
          r.segmentTerminatorDesc = "[CR][LF]";
          break;
        default:
          r.segmentTerminatorDesc = r.segmentTerminator;
          break;
      }
      rawSegments = txt.split(r.segmentTerminator);
      r.segments = [];
      var transactionSegmentCount = 0;
      var groupCount              = 0;
      var isaCount                = 0;
      var transactionNum          = "";
      var groupNum                = "";
      var isaNum                  = "";
      for(i=0;i<rawSegments.length;i++) {
        if(rawSegments[i].trim().length>0) {
          rawElements = rawSegments[i].split(r.elementSeparator);
          elementObjects = new Array(rawElements.length);
          for (var j = rawElements.length - 1; j >= 0; j--) {
            elementObjects[j] = {content:rawElements[j]};
          }
          seg = {row:i+1,elements:elementObjects,separator:r.elementSeparator};
          seg.type = seg.elements[0].content;
          switch (seg.type) {
            case "ISA":
              if (isaNum !== "") {
                r.errors.push("more than one ISA segment");
              }
              isaNum = seg.elements[13].content;
              break
            case "GS":
              if (groupCount > 0) {
                r.errors.push("Missing GE segment at " + i);
              }
              isaCount++;
              groupNum = seg.elements[6].content;
              break;
            case "ST":
              if (transactionSegmentCount > 0) {
                r.errors.push("missing SE segment at " + i);
              }
              groupCount++;
              transactionSegmentCount = 1;
              transactionNum          = seg.elements[2].content;
              break;
            case "SE":
              if (transactionNum === "") {
                r.errors.push("Missing ST for SE at position " + (i + 1));
              } else if ( transactionNum !== seg.elements[2].content ) {
                r.errors.push("Wrong transaction control number at position " + (i + 1));
              }
              if (seg.elements[1].content != transactionSegmentCount + 1) {
                r.errors.push("SE at position " + (i + 1) + " is bad (count should be " + transactionSegmentCount + ")");
              }
              transactionNum          = "";
              transactionSegmentCount = 0;
              break;
            case "GE":
              if (transactionNum !== "") {
                r.errors.push("Missing SE at position " + i);
                transactionNum = ""
              }
              if (groupNum === "") {
                r.errors.push("Missing GS for GE at position " + (i + 1));
              } else if ( groupNum !== seg.elements[2].content ) {
                r.errors.push("Wrong group control number at position " + (i + 1));
              }
              if (seg.elements[1].content != groupCount) {
                r.errors.push("GE at position " + (i + 1) + " is bad (count should be " + groupCount + ")");
              }
              groupNum   = "";
              groupCount = 0;
              break;
            case "IEA":
              if (transactionNum !== "") {
                r.errors.push("Missing SE at position " + i);
              }
              if (groupNum !== "") {
                r.errors.push("Missing GE at position " + i);
              }
              if (isaCount != seg.elements[1].content) {
                r.errors.push("IEA at positon " + (i + 1) + " is bad (count should be " + isaCount + ")");
              }
              if (isaNum !== seg.elements[2].content) {
                r.errors.push("Wrong interchange control number at position " + (i + 1));
              }
              break;
            default:
              if (transactionSegmentCount > 0) {
                transactionSegmentCount++;
              }
              break;
          }
          r.segments.push(seg);
          sTypes[seg.type] = true;
        }
      }
      for(var prop in sTypes) {
        r.segmentTypes.push(prop);
      }
      r.segmentTypes.sort();
      return r;
    }
  };
}]);

// render a segment line
ediLint.directive('ediSegment',[function() {
  return {
    scope: {
      ediSegment:'='
    },
    restrict:'A',
    template:"<span ng-repeat='el in ediSegment.elements'><span class='elementContent' ng-class='{\"bg-primary\":el.highlighted}'>{{el.content}}</span><span class='elementSep'>{{ediSegment.separator}}</span></span>"
  };
}]);

ediLint.controller('EdiCtrl',['$scope','ediParser',function($scope,ediParser) {
  $scope.view = {showJSON:false};
  $scope.ediIn = '';
  $scope.ediOut = {};
  $scope.hiddenSegmentTypes = {};
  $scope.zoomSegment = {};
  $scope.setZoomSegment = function(s) {
    $scope.zoomSegment = s;
  };

  $scope.toggleSegmentHide = function(t) {
    $scope.hiddenSegmentTypes[t] = !$scope.hiddenSegmentTypes[t];
  };
  $scope.showAllSegments = function() {
    $scope.hiddenSegmentTypes = {};
  };
  $scope.hideAllSegments = function() {
    var segs = $scope.ediOut.segments;
    var i;
    for(i=0;i<segs.length;i++) {
      $scope.hiddenSegmentTypes[segs[i].type] = true;
    }
  };

  $scope.$watch('ediIn',function(nv,ov) {
    $scope.ediOut = ediParser.parse(nv);
  });
}]);
