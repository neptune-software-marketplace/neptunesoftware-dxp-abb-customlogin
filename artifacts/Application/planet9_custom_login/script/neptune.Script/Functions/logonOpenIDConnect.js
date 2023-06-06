function logonOpenIDConnect(logonType) {
    const path = logonType.path;
    showLogonPopupAndWaitForCallbackUrl('/user/logon/openid-connect/' + path)
        .then(function (callbackUrl) {
            if (callbackUrl) {
                const authResponse = getHashParamsFromUrl(callbackUrl, path);
                return planet9LoginWithCode(authResponse, path);
            }
        });
}

function planet9LoginWithCode(authResponse, path) {    
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: 'GET',
            url: '/user/logon/openid-connect/' + path + '/callback?' + $.param(authResponse),
            success: function (data) {
                localStorage.setItem('p9oidctoken', JSON.stringify(data));
                location.reload();
                //getTokenWithRefreshToken(data.refresh_token, path);                
            },
            error: function (request) {
                reject(request);
            }
        });
    });
}

function getTokenWithRefreshToken(refreshToken, path) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/user/logon/openid-connect/' + path + '/token',
            contentType: 'application/x-www-form-urlencoded',
            data: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                scope: 'openid profile email offline_access',
            },
            success: function (data) {
                localStorage.setItem('p9oidctoken', JSON.stringify(data));
                resolve(data);
            },
            error: function (request) {
                reject(request);
            }
        })
    });
}

function planet9LoginWithTokenTest() {
    const tokenSet = JSON.parse(localStorage.getItem('p9oidctoken'));

    return new Promise(function(resolve, reject) {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: '/user/logon/openid-connect/openid-test/session',
            headers: {
                'Authorization': 'Bearer ' + tokenSet.id_token,
            },
            success: function (data) {
                location.reload();
            },
            error: function (request) {
                console.log('Error: ', request);
            }
        })
    });
}

window.testLogin = planet9LoginWithTokenTest;

function getHashParamsFromUrl(url) {
    if (url.indexOf('?') < 0) return;

    const queryString = url.split('?')[1];

    let params = queryString.replace(/^(#|\?)/, '');
    let hashParams = {};
    let e,
        a = /\+/g,
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) {
            return decodeURIComponent(s.replace(a, ' '));
        };
    while (e = r.exec(params))
        hashParams[d(e[1])] = d(e[2]);
    return hashParams;
}