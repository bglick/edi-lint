var ediLint = angular.module('ediLint',[]);
ediLint.factory('ediParser',[function() {
  return {
    parse: function(txt) {
      var r, rawSegments, i, curSeg, rawElements, elementObjects, sTypes=Object.create(null);
      r = {errors:[],segments:[],segmentTypes:[]};
      if(txt==undefined || txt.length==0) {
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
          r.segmentTerminatorDesc = r.segmentTerminator
          break;
      }
      rawSegments = txt.split(r.segmentTerminator);
      r.segments = []
      for(i=0;i<rawSegments.length;i++) {
        if(rawSegments[i].trim().length>0) {
          rawElements = rawSegments[i].split(r.elementSeparator);
          elementObjects = new Array(rawElements.length)
          for (var j = rawElements.length - 1; j >= 0; j--) {
            elementObjects[j] = {content:rawElements[j]};
          };
          seg = {row:i+1,elements:elementObjects,separator:r.elementSeparator};
          seg.type = seg.elements[0].content;
          r.segments.push(seg);
          sTypes[seg.type] = true;
        }
      }
      for(var prop in sTypes) {
        r.segmentTypes.push(prop);
      }
      r.segmentTypes.sort()
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
  }

  $scope.toggleSegmentHide = function(t) {
    $scope.hiddenSegmentTypes[t] = !$scope.hiddenSegmentTypes[t];
  }
  $scope.showAllSegments = function() {
    $scope.hiddenSegmentTypes = {};
  }
  $scope.hideAllSegments = function() {
    var segs = $scope.ediOut.segments;
    var i;
    for(i=0;i<segs.length;i++) {
      $scope.hiddenSegmentTypes[segs[i].type] = true;
    }
  }

  $scope.$watch('ediIn',function(nv,ov) {
    $scope.ediOut = ediParser.parse(nv);
  });
}]);
