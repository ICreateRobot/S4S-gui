// modes/wifi.js

const BASE_URL = "http://139.129.32.56:3000";////192.168.20.161     139.129.32.56
const Version = "0.1.3";//gui中记录软件版本的位置（不妙，但是未来有空再改吧）

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
export async function upload(connKey, code,slot,projectName) {//
    return await request("/device/upload", {
        connKey,
        code,
        slot,
        projectName
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


// RunIoTProject（不等待）
export async function runIoTProject(projectData) {
    let playConnKey = null;

    if ( vm.runtime.connKey ) {
        playConnKey = vm.runtime.connKey;
    }
    
    if (!playConnKey) {
        const history = localStorage.getItem("wifi_history");

        try {
            const list = JSON.parse(history || "[]");

            if (Array.isArray(list) && list.length > 0) {
                playConnKey = list[0];
            }
        } catch (e) {
            console.warn("wifi_history 解析失败", e);
        }
    }

    //没有任何连接码
    if (!playConnKey) {
        console.log("没有可用的 connKey（runtime + history 均为空）");
        return {success: false};
    }

    const response = await fetch(`${BASE_URL}/iot/project`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            connKey: playConnKey,   
            data: projectData
        })
    });

    const result = await response.json();
    const previewUrl = `${BASE_URL}/preview/${result.id}`
    return {
        ...result,
        previewUrl: previewUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(previewUrl)}`
    };
}


// 查询单个
//const Version = "0.0.9";
export async function getVersion(name) {
    const res = await fetch(`${BASE_URL}/version/${name}`);
    const json = await res.json();

    const serverVersion = json?.data?.version;
    console.log(json)

    console.log("本地版本:", Version);
    console.log("服务端版本:", serverVersion);

    if (serverVersion === Version) {
        console.log("✅ 版本一致，无需更新");
        return false;
    } else {
        console.log("❌ 版本不一致，需要更新");
        return true;
    }

}