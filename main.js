var ediLint = angular.module('ediLint',[]);
ediLint.factory('ediParser',[function() {
  return {
    parse: function(txt) {
      var r, rawSegments, i, curSeg, sTypes=Object.create(null);
      r = {errors:[],segments:[],segmentTypes:[]};
      if(txt==undefined || txt.length==0) {
        return r;
      }
      if(!txt.match(/^ISA.{102}/)) {
        r.errors.push("Your EDI must start with a valid ISA segment.");
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
          seg = {row:i+1,elements:rawSegments[i].split(r.elementSeparator),separator:r.elementSeparator}
          seg.type = seg.elements[0];
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
    link: function(scope,el,attrs) {
      var i,
        h = '', 
        es = scope.ediSegment,
        hEl;
      if(es.elements.length==1 && es.elements[0].trim().length==0) {
        return;
      }
      for(i=0;i<es.elements.length;i++) {
        hEl = es.elements[i].replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/ /,'&nbsp;');
        h += '<span class="elementContent">'+hEl+'</span>';
        if(i<es.elements.length-1) {
          h += '<span class="elementSep">'+es.separator+'</span>';
        }
      }
      $(el).html(h);
    }
  };
}]);

ediLint.controller('EdiCtrl',['$scope','ediParser',function($scope,ediParser) {
  $scope.view = {showJSON:false};
  $scope.ediIn = '';
  $scope.ediOut = {};
  $scope.hiddenSegmentTypes = {};

  $scope.toggleSegmentHide = function(t) {
    $scope.hiddenSegmentTypes[t] = !$scope.hiddenSegmentTypes[t]
  }

  $scope.$watch('ediIn',function(nv,ov) {
    $scope.ediOut = ediParser.parse(nv);
  });
}]);
