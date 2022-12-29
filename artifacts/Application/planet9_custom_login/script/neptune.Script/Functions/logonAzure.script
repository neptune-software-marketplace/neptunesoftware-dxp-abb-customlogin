var AppCacheLogonAzure = {

    state: null,
    options: {},
    redirectUri: "/public/azure_redirect.html",

    Logon: function(options, loginHint) {

        panLogon.setBusy(true);

        this.options = options;

        var popUpWidth = 483;
        var popUpHeight = 600;

        var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
        var winTop = window.screenTop ? window.screenTop : window.screenY;

        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        var left = ((width / 2) - (popUpWidth / 2)) + winLeft;
        var top = ((height / 2) - (popUpHeight / 2)) + winTop;

        var logonWin = window.open(this._loginUrl(loginHint), "Login ", "location=no,width=" + popUpWidth + ",height=" + popUpHeight + ",left=" + left + ",top=" + top);

        if (logonWin.focus) logonWin.focus();

        window.logonWin = logonWin;

        AppCacheLogonAzure._waitForPopupDesktop(logonWin, function(url) {

            var authResponse = AppCacheLogonAzure._getHashParams(url);

            // Get response
            if (authResponse) {

                // Prevent cross-site request forgery attacks
                if (parseInt(authResponse.state) !== AppCacheLogonAzure.state) {
                    sap.m.MessageToast.show("Cross-site request forgery detected");
                    return;
                }

                this._getToken(authResponse);
            }

        }.bind(this));

    },

    Logoff: function(options) {

        this.options = options;

        var popUpWidth = 483;
        var popUpHeight = 600;

        var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
        var winTop = window.screenTop ? window.screenTop : window.screenY;

        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        var left = ((width / 2) - (popUpWidth / 2)) + winLeft;
        var top = ((height / 2) - (popUpHeight / 2)) + winTop;

        var logoutWin = window.open(this._logoutUrl(), "Logout ", "location=no,width=" + popUpWidth + ",height=" + popUpHeight + ",left=" + left + ",top=" + top);
        
        if (logoutWin.focus) logoutWin.focus();

        window.logoutWin = logoutWin;

    },

    _logoutUrl: function() {
        return "https://login.microsoftonline.com/" + this.options.tenantId + "/oauth2/v2.0/logout";
    },

    _getToken: function(response) {

        var url = this._authUrl("token");

        var data = {
            client_id: this.options.clientID,
            redirect_uri: location.origin + AppCacheLogonAzure.redirectUri,
            code: response.code,
            grant_type: "authorization_code",
        };

        $.ajax({
            type: "POST",
            url: "/user/logon/" + this.options.type + "/" + this.options.path + "/" + encodeURIComponent(url),
            contentType: "application/x-www-form-urlencoded",
            data: data,
            success: function(data) {
                localStorage.setItem("p9azuretoken", JSON.stringify(data));
                AppCacheLogonAzure._loginP9(data.id_token);
            },
            error: function(request, status) {

                panLogon.setBusy(false);

                switch (request.status) {

                    case 400:

                        // Error messages 
                        if (request && request.responseJSON) {
                            console.log(request.responseJSON);
                            var log = request.responseJSON.error_description.split("\n");
                            if (log && log.length) {
                                sap.m.MessageToast.show(log[0]);
                            } else {
                                sap.m.MessageToast.show(request.responseJSON.error_description);
                            }
                        }
                        break;

                    case 401:

                        // Not authorized
                        AppCacheLogonAzure.Logon();
                        break;

                    default:
                        break;

                }

            }
        });

    },

    _getHashParams: function(token) {

        if (token.indexOf("?") > -1) token = token.split("?")[1];

        var params = token.replace(/^(#|\?)/, '');
        var hashParams = {};
        var e,
            a = /\+/g,
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function(s) {
                return decodeURIComponent(s.replace(a, " "));
            };
        while (e = r.exec(params))
            hashParams[d(e[1])] = d(e[2]);
        return hashParams;
    },

    _authUrl: function(endPoint) {
        return "https://login.microsoftonline.com/" + this.options.tenantId + "/oauth2/v2.0/" + endPoint + "?";
    },

    _loginUrl: function(loginHint) {

        var prompt = "select_account";

        AppCacheLogonAzure.state = Date.now();

        var data = {
            client_id: this.options.clientID,
            redirect_uri: location.origin + AppCacheLogonAzure.redirectUri,
            scope: this.options.scope,
            nonce: ModelData.genID(),
            state: this.state,
            prompt: prompt,
            response_type: "code"
        };

        return this._authUrl("authorize") + $.param(data);
    },

    _loginP9: function(idToken) {
        return $.ajax({
            type: "POST",
            url: "/user/logon/" + this.options.type + "/" + this.options.path,
            headers: {
                "Authorization": "Bearer " + idToken,
            },
            success: function(data) {
                location.reload(true);
            },
            error: function(result, status) {
                panLogon.setBusy(false);

            }
        });
    },

    _waitForPopupDesktop: function(popupWin, onClose) {

        var url = "";
        var winCheckTimer = setInterval(function() {

            if (popupWin.closed) {
                clearInterval(winCheckTimer);
                panLogon.setBusy(false);
            }

            try {
                url = popupWin.location.href || "";
            } catch (e) {

            }

            if (url.indexOf("code=") > -1) {
                clearInterval(winCheckTimer);
                popupWin.close();
                panLogon.setBusy(true);
                onClose(url);
            }
        }, 100);
    },

};