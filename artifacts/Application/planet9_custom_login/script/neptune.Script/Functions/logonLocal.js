function logonLocal(rec) {
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: '/user/logon/local',
        data: JSON.stringify(rec),
        success: function (data, xhr) {
            if (data.status === "UpdatePassword") {
                const url = new URL(data.link, location.href);
                url.searchParams.append('reason', data.reason || 'other');
                location.replace(url.toString());
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
