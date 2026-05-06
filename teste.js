

fetch("https://consultar.io/api/v1/crm/consultar",{
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": ""
    }
}).then(res => res.json()).then(data => console.log(data));