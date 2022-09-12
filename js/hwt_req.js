//

const hwt = (() => {
  let errorcool = false
  let view_info = function (id, callback) {
    let xhr = new XMLHttpRequest({
      mozSystem: true,
    });
    xhr.open(
      "GET",
      "http://www.heywhatsthat.com/bin/result.json?id=" +
      id
    );
    xhr.timeout = 6000; // time in milliseconds

    xhr.ontimeout = function (e) {};

    xhr.onload = function () {
      if (xhr.status == 200) {
        callback(JSON.parse(xhr.responseText));
      } else {
        console.log(xhr)
      }
    
    };

    xhr.onerror = function (err) {
    
      console.log(err)
     
      
    };
    xhr.send();
  };

  return {
    view_info,
  };
})();