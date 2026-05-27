// modes/wifi.js

const BASE_URL = "http://139.129.32.56:3000";////192.168.20.161

// 连接
export async function connect(connKey) {
    const res = await fetch(
    `${BASE_URL}/device/info?connKey=${connKey}`
  );

  return await res.json();
}


// Run（不等待）
export async function run(connKey, code) {
    return await request("/device/run", {
        connKey,
        code
    });
}

//Upload（不等待）
export async function upload(connKey, code) {
    return await request("/device/upload", {
        connKey,
        code
    });
}

/**
 * 统一请求封装
 */
async function request(url, body) {
    try {
        const res = await fetch(`${BASE_URL}${url}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        return await res.json();
    } catch (err) {
        return {
            code: 500,
            message: err.message
        };
    }
}