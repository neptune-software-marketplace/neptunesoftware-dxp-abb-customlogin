let AppCacheLogonAzure = {

    state: null,
    options: {},
    redirectUri: '/public/azure_redirect.html',
    msalObj: null,
    loginScopes: ['user.read', 'profile', 'openid', 'offline_access'],

    InitMsal: function () {
        this.msalObj = new msal.PublicClientApplication({
            auth: {
                clientId: this.options.clientID,
                authority: 'https://login.microsoftonline.com/' + this.options.tenantId,
                redirectUri: location.origin + AppCacheLogonAzure.redirectUri,
            },
            cache: {
                cacheLocation: 'sessionStorage',
                storeAuthStateInCookie: false, // Set this to 'true' if you are having issues on IE11 or Edge
            }
        });
    },

    Logon: async function (options, loginHint) {
        panLogon.setBusy(true);
        
        this.options = options;

        if (this.useMsal()) {
            this._loginMsal();
            return;
        }

        let popUpWidth = 483;
        let popUpHeight = 600;

        let winLeft = window.screenLeft ? window.screenLeft : window.screenX;
        let winTop = window.screenTop ? window.screenTop : window.screenY;

        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        let left = ((width / 2) - (popUpWidth / 2)) + winLeft;
        let top = ((height / 2) - (popUpHeight / 2)) + winTop;
        
        const nonce = this.options.excludeNonce ? undefined : await setSessionNonce('azure-bearer', this.options.path);
        let logonWin = window.open(this._loginUrl(loginHint, nonce), 'Login ', 'location=no,width=' + popUpWidth + ',height=' + popUpHeight + ',left=' + left + ',top=' + top);

        if (logonWin.focus) logonWin.focus();

        window.logonWin = logonWin;

        AppCacheLogonAzure._waitForPopupDesktop(logonWin, function (url) {

            let authResponse = AppCacheLogonAzure._getHashParams(url);

            // Get response
            if (authResponse) {

                //Prevent cross-site request forgery attacks
                if (parseInt(authResponse.state) !== AppCacheLogonAzure.state) {
                    sap.m.MessageToast.show('Cross-site request forgery detected');
                    return;
                }
                this._getToken(authResponse, url);
            }
        }.bind(this));
    },

    Logoff: function (options) {

        this.options = options;

        let popUpWidth = 483;
        let popUpHeight = 600;

        let winLeft = window.screenLeft ? window.screenLeft : window.screenX;
        let winTop = window.screenTop ? window.screenTop : window.screenY;

        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        let left = ((width / 2) - (popUpWidth / 2)) + winLeft;
        let top = ((height / 2) - (popUpHeight / 2)) + winTop;

        let logoutWin = window.open(this._logoutUrl(), 'Logout ', 'location=no,width=' + popUpWidth + ',height=' + popUpHeight + ',left=' + left + ',top=' + top);

        if (logoutWin.focus) logoutWin.focus();

        window.logoutWin = logoutWin;

    },

    useMsal: function () {
        if (typeof msal !== 'undefined' && this.options.azureMSALv2) return true;
    },

    _loginMsal: async function () {
        this.InitMsal();
        const nonce = await setSessionNonce('azure-bearer', this.options.path);
        this.msalObj.loginPopup({ scopes: this.loginScopes, prompt: 'select_account', nonce }).then((response) => {
            localStorage.setItem('p9azuretokenv2', JSON.stringify(response));

            // only login if MSAL v2 is able to fetch any accounts, otherwise it will produce login errors in the launchpad
            const accounts = this.msalObj.getAllAccounts();
            if (Array.isArray(accounts) && accounts.length > 0) {
                AppCacheLogonAzure._loginP9(response.idToken);
            } else {
                sap.m.MessageToast.show('MSAL v2 failed to fetch any accounts after login');
            }
        }).catch(function (error) {
            panLogon.setBusy(false);
            if (error && error.toString().indexOf('Failed to fetch') > -1) {
                sap.m.MessageToast.show('Failed to fetch token. Redirect URI in azure must be set to Single Page Application');
            } else {
                sap.m.MessageToast.show(error.toString());
            }
        });
    },

    _logoutUrl: function () {
        return 'https://login.microsoftonline.com/' + this.options.tenantId + '/oauth2/v2.0/logout';
    },

    _getToken: function (response, url) {
        let token = this._authUrl('token');
        let data = {
            client_id: this.options.clientID,
            redirect_uri: location.origin + AppCacheLogonAzure.redirectUri,
            scope: this.loginScopes.join(' '),
            code: response.code,
            grant_type: 'authorization_code',
        };

        $.ajax({
            type: 'POST',
            url: '/user/logon/' + this.options.type + '/' + this.options.path + '/' + encodeURIComponent(token),
            contentType: 'application/x-www-form-urlencoded',
            data: data,
            success: function (data) {
                localStorage.setItem('p9azuretoken', JSON.stringify(data));
                AppCacheLogonAzure._loginP9(data.id_token);
            },
            error: function (request, status) {

                panLogon.setBusy(false);

                switch (request.status) {

                    case 401:
                    case 400:

                        // Error messages 
                        if (request && request.responseJSON) {
                            console.log(request.responseJSON);
                            let log = request.responseJSON.error_description.split('\n');
                            if (log && log.length) {
                                sap.m.MessageToast.show(log[0]);
                            } else {
                                sap.m.MessageToast.show(request.responseJSON.error_description);
                            }
                        }
                        break;
                    
                    default:
                        break;
                }
            }
        });
    },

    _getHashParams: function (token) {

        if (token.indexOf('?') > -1) token = token.split('?')[1];

        let params = token.replace(/^(#|\?)/, '');
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
    },

    _authUrl: function (endPoint) {
        return 'https://login.microsoftonline.com/' + this.options.tenantId + '/oauth2/v2.0/' + endPoint + '?';
    },

    _loginUrl: function (loginHint, nonce = undefined) {
        let prompt = 'select_account';

        AppCacheLogonAzure.state = Date.now();
        let data = {
            client_id: this.options.clientID,
            redirect_uri: location.origin + AppCacheLogonAzure.redirectUri,
            scope: this.loginScopes.join(' '),
            ...(nonce && { nonce }),
            state: this.state,
            prompt: prompt,
            response_type: 'code'
        };

        return this._authUrl('authorize') + $.param(data);
    },

    _loginP9: function (idToken) {
        return $.ajax({
            type: 'POST',
            contentType: 'application/json',
            url: '/user/logon/' + this.options.type + '/' + this.options.path,
            headers: {
                'Authorization': 'Bearer ' + idToken,
            },
            success: function (data) {
                location.reload(true);
            },
            error: function (result, status) {
                panLogon.setBusy(false);
            }
        });
    },

    _waitForPopupDesktop: function (popupWin, onClose) {
        let url = '';
        let winCheckTimer = setInterval(function () {
            try {
                url = popupWin.location.href ?? '';
            } catch (err) {
                // otherwise it would error out on accessing string functions
                url = '';

                if (err.name === 'SecurityError') {
                    // we are unable to read location.href
                } else {
                    console.log('_waitForPopupDesktop popupWin', popupWin, 'error', err);
                }
            }

            if (url.indexOf('state=') > -1 || url.indexOf('nonce=') > -1) console.log(url);

            if (popupWin.closed || url.indexOf('error=') > -1) {
                clearInterval(winCheckTimer);
                panLogon.setBusy(false);
            }

            if (url.indexOf('code=') > -1) {
                console.log(url);
                clearInterval(winCheckTimer);
                popupWin.close();
                panLogon.setBusy(true);
                onClose(url);
            }
        }, 100);
    },

};