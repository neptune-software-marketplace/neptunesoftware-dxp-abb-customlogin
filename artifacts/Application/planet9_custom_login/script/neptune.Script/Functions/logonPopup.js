function showLogonPopupAndWaitForCallbackUrl(url) {
    return new Promise(function (resolve, reject) {
        const popup = showLogonPopup(url);

        (function check() {
            if (popup.closed) {
                return resolve();
            }

            let callbackUrl = '';
            try {
                callbackUrl = popup.location.href || '';
            } catch (e) { }

            if (callbackUrl) {
                if (callbackUrl.indexOf('code=') > -1) {
                    console.log('Callbackurl: ', callbackUrl);
                    popup.close();
                    return resolve(callbackUrl);
                }
            }
            setTimeout(check, 100);
        })();
    });
}

function showLogonPopup(url) {
    const popUpWidth = 483;
    const popUpHeight = 600;

    const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
    const winTop = window.screenTop ? window.screenTop : window.screenY;

    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
    const top = ((height / 2) - (popUpHeight / 2)) + winTop;

    const logonWin = window.open(url, 'Login ', 'location=no,width=' + popUpWidth + ',height=' + popUpHeight + ',left=' + left + ',top=' + top);
    if (logonWin.focus) logonWin.focus();

    return logonWin;
}