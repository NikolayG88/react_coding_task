import { BASE_URL } from "./constants";

class HttpService {
    GetRequest<T>(url: string, props?: any[]): Promise<T> {
        return new Promise((resolve, reject) => {
            const xhttp = new XMLHttpRequest();
            xhttp.onload = function () {
                resolve(JSON.parse(this.responseText) as T);
            }
            xhttp.open('GET', `${BASE_URL}${url}`);
            xhttp.send();
        });
    }

    PostRequest(url: string, data: any) {

    }
}

export default HttpService;