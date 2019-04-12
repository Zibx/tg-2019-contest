(function(PCG){
    PCG.GET = function updateYAxis(url, cb) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                var data;
                try{
                    if(xhr.status!==200)
                        throw new Error('Not 200');
                    data = JSON.parse(xhr.responseText);
                }catch(e){
                    return cb(true);
                }
                cb(false, data);


            }
        };
        xhr.open('GET', url, true);
        xhr.send(null);
    };
})(window['PCG']);