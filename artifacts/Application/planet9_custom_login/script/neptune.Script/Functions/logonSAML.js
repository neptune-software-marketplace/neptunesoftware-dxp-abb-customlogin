function logonSAML(data) {
    let pathSearchAndHash = (location.pathname.substring(1) ? location.pathname : '') + location.search + location.hash;
    window.location.replace('/user/logon/' + data.type + '/' + data.path + '?path=' + encodeURIComponent(pathSearchAndHash));
}