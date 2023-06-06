function logonSAP(rec, logonType) {
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: `/user/logon/sap/${logonType.path}`,
        data: JSON.stringify(rec),
        success: function (data, xhr) {
            if (data.status === 'UpdatePassword') {
                    formLogin.setVisible(false);
                    formForgot.setVisible(false);
                    formNewPassord.setVisible(true);
                    txtFormNewPassRequired.setVisible(true);
                    logonScreen.sapData = { detail: rec, path: logonType.path };
            } else {
                location.reload(true);
            }
        },
        error: function (result, status, other) {
            console.log(result, status, other)
            if (result.status === 401) {
                inLoginName.setValueState('Error');
                inLoginPassword.setValueState('Error');
                sap.m.MessageToast.show(txtWrongUsernamePassword.getText());
            } 
            else {
                if (result.responseJSON) {
                    sap.m.MessageToast.show(result.status + ': ' + result.responseJSON.status);
                } else {
                    sap.m.MessageToast.show(result.status + ': ' + result.statusText);
                }
            }
        }
    });
}
