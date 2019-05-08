var UploadController = function ($scope, fileReader) {
    $scope.getFile = function () {
        $scope.progress = 0;
        $scope.textSrc = '';
        $scope.newSubtitle = '';
        $scope.currentId;
        $scope.isShowEditSubtitle = false;
        $scope.isError = false;
        $scope.errMessage = '';

        fileReader.readAsText($scope.file, $scope)
                      .then(function(result) {
                        var parsedSrt = parserSrt(result);
                        if (!parsedSrt[0].hasOwnProperty('start')) {
                          $scope.isError = true;
                          $scope.errMessage = "Плохой файл";
                        } else {
                          $scope.textSrc = parsedSrt;
                          //console.log('parsedSrt', parsedSrt);
                        }
                      },
                      function(err) {
                        //console.log('reason', err);
                        $scope.isError = true;
                        $scope.errMessage = err.message;
                      });
    };
 
    $scope.$on("fileProgress", function(e, progress) {
        $scope.progress = progress.loaded / progress.total;
    });

    $scope.removeSubtitle = function(id) {
      if ($scope.textSrc.length !== 1) $scope.textSrc.splice(id, 1);
    }; 

    $scope.editSubtitle = function(id) {
      $scope.currentId = id;
      $scope.newSubtitle = $scope.textSrc[id].text;
      $scope.isShowEditSubtitle = true;
    }

    $scope.closeEditSubtitle = function() {
      $scope.textSrc[$scope.currentId].text = $scope.newSubtitle;
      $scope.textSrc[$scope.currentId].edited = true;
      $scope.isShowEditSubtitle = false;      
    }

    $scope.saveFile = function() {
      var file = $scope.textSrc.reduce((prev, current, index) => {
        return prev + (index + 1) + "\r\n" + current.start + ' --> ' + current.end + "\r\n" + current.text + "\r\n\r\n";
      }, '');

      var blob = new Blob([file], {type: "application/txt"});
      var a = document.createElement("a"),
      url = URL.createObjectURL(blob);
      a.href = url;
      a.download = "subtitles.srt";
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);  
      }, 0); 
    }
};

var parserSrt = function(srt) {
  const source = srt
    .trim()
    .concat('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^WEBVTT.*\n(?:.*: .*\n)*\n/, '')
    .split('\n');

    return source.reduce((captions, row, index) => {
      const caption = captions[captions.length - 1]
  
      if (!caption.index) {        
        if (/^\d+$/.test(row)) {
          caption.index = parseInt(row, 10)
          return captions
        }
      }
  
      if (!caption.hasOwnProperty('start')) {
        const timestamp = parseTimestamps(row)
        if (timestamp) {
          Object.assign(caption, timestamp)
        } else if (captions.length > 1) {
          captions[captions.length - 2].text += '\n' + row
        }
        return captions
      }
  
      if (row === '') {
        delete caption.index
        if (index !== source.length - 1) {
          captions.push({})
        }
      } else {
        caption.text = caption.text
          ? caption.text + '\n' + row
          : row
      }
      return captions
    }, [{}]);
}

const RE = /^((?:\d{2,}:)?\d{2}:\d{2}[,.]\d{3}) --> ((?:\d{2,}:)?\d{2}:\d{2}[,.]\d{3})(?: (.*))?$/;


var parseTimestamps = function(value) {
  const match = RE.exec(value)
  if (match) {
    const cue = {
      start: match[1],
      end: match[2]
    }
    if (match[3]) {
      cue.settings = match[3]
    }
    return cue
  }
}

app.directive("ngFileSelect",function() {
    return {
      link: function($scope,el) {        
        el.bind("change", function(e) {        
          $scope.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        })
      }
    }
  })