async function setSessionNonce(type, path) {
    const nonce = ModelData.genID();
    const result = await fetch(`/user/logon/${type}/${path}/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({nonce})
    });
    return (await result.json()).nonce;
}