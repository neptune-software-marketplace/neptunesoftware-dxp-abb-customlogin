function logonSAML(data) {
    
    var refUrl = "";
    if (location.href.indexOf('path=')) {
        refUrl = location.href.split('path=')[1];
    } else {
        refUrl = ""
    }

    window.location.replace("/user/logon/" + data.type + "/" + data.path + "?path=" + refUrl);

}